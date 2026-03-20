#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_ROOT="${APP_ROOT:-/opt/inventario-ctpc}"
BACKEND_ROOT="$APP_ROOT/backend"
FRONTEND_ROOT="$APP_ROOT/frontend"
VENV_ROOT="$APP_ROOT/venv"
DEPLOY_ROOT="$APP_ROOT/deploy"
FRONTEND_BUILD_ROOT="${FRONTEND_BUILD_ROOT:-/var/www/inventario}"
APACHE_DEFAULT_CONF="${APACHE_DEFAULT_CONF:-/etc/apache2/sites-available/000-default.conf}"
APACHE_SSL_CONF="${APACHE_SSL_CONF:-/etc/apache2/sites-available/default-ssl.conf}"
APACHE_MANAGED_CONF="/etc/apache2/conf-available/inventario-ctpc.conf"
SYSTEMD_SERVICE="/etc/systemd/system/sgica-gunicorn.service"
MYSQL_CONTAINER_NAME="${MYSQL_CONTAINER_NAME:-sgica-mysql}"
MYSQL_DATABASE="${MYSQL_DATABASE:-sgica}"
MYSQL_USER="${MYSQL_USER:-sgica}"
MYSQL_PORT="${MYSQL_PORT:-3307}"
SERVER_ORIGIN="${SERVER_ORIGIN:-https://181.193.121.122}"
SERVER_PUBLIC_URL="${SERVER_PUBLIC_URL:-https://181.193.121.122/inventario}"

timestamp() {
  date +"%Y%m%d-%H%M%S"
}

log() {
  printf "\n[%s] %s\n" "$(date +"%H:%M:%S")" "$1"
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    echo "Run this script as root: sudo bash $0"
    exit 1
  fi
}

ensure_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing required command: $1"
    exit 1
  }
}

port_in_use() {
  local port="$1"
  ss -ltn "( sport = :$port )" | tail -n +2 | grep -q .
}

pick_mysql_port() {
  local candidate="$MYSQL_PORT"

  while port_in_use "$candidate"; do
    log "Port $candidate is already in use, trying the next port for isolated MySQL"
    candidate=$((candidate + 1))
  done

  MYSQL_PORT="$candidate"
}

node_major_version() {
  if ! command -v node >/dev/null 2>&1; then
    echo 0
    return
  fi

  node -p "process.versions.node.split('.')[0]"
}

install_packages() {
  log "Installing Ubuntu packages"
  apt-get update
  apt-get install -y \
    apache2 \
    build-essential \
    ca-certificates \
    curl \
    default-libmysqlclient-dev \
    docker.io \
    docker-compose-plugin \
    libreoffice \
    pkg-config \
    python3 \
    python3-dev \
    python3-venv \
    rsync

  if [[ "$(node_major_version)" -lt 20 ]]; then
    log "Installing Node.js 20"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi

  systemctl enable --now docker
}

prepare_layout() {
  log "Preparing application directories"
  mkdir -p "$APP_ROOT" "$DEPLOY_ROOT" "$FRONTEND_BUILD_ROOT" "$BACKEND_ROOT/media" "$APP_ROOT/backups"

  rsync -a --delete "$PROJECT_ROOT/backend/" "$BACKEND_ROOT/"
  rsync -a --delete "$PROJECT_ROOT/frontend/" "$FRONTEND_ROOT/"
  rsync -a --delete "$PROJECT_ROOT/deploy/" "$DEPLOY_ROOT/"
}

load_or_generate_secrets() {
  local backend_env="$BACKEND_ROOT/.env"
  local mysql_env="$DEPLOY_ROOT/mysql.env"

  DJANGO_SECRET_KEY_DEFAULT="$(openssl rand -hex 32)"
  MYSQL_ROOT_PASSWORD_DEFAULT="$(openssl rand -hex 24)"
  MYSQL_PASSWORD_DEFAULT="$(openssl rand -hex 24)"

  if [[ -f "$backend_env" ]]; then
    # shellcheck disable=SC1090
    source "$backend_env"
  fi

  if [[ -f "$mysql_env" ]]; then
    # shellcheck disable=SC1090
    source "$mysql_env"
  fi

  DJANGO_SECRET_KEY="${DJANGO_SECRET_KEY:-$DJANGO_SECRET_KEY_DEFAULT}"
  MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-$MYSQL_ROOT_PASSWORD_DEFAULT}"
  MYSQL_PASSWORD="${MYSQL_PASSWORD:-${MYSQL_PASSWORD_DEFAULT}}"
}

report_existing_inventario_containers() {
  log "Inspecting existing inventario-related containers"
  docker ps --format '{{.Names}}\t{{.Ports}}' | grep -i inventario || true
}

cleanup_old_inventario_containers() {
  log "Stopping and removing old inventario containers"

  mapfile -t containers < <(
    docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}' | \
    awk -F '\t' '
      BEGIN { IGNORECASE = 1 }
      {
        line = $0
        name = $2
        image = $3
        ports = $4

        if (
          name ~ /inventario/ ||
          image ~ /inventario/ ||
          ports ~ /127\.0\.0\.1:8001->/ ||
          ports ~ /0\.0\.0\.0:8001->/ ||
          ports ~ /:::8001->/ ||
          ports ~ /127\.0\.0\.1:8080->/ ||
          ports ~ /0\.0\.0\.0:8080->/ ||
          ports ~ /:::8080->/ ||
          name ~ /^django$/ ||
          name ~ /^angular$/ ||
          (name ~ /^db$/ && (ports ~ /127\.0\.0\.1:3307->/ || ports ~ /0\.0\.0\.0:3307->/ || ports ~ /:::3307->/))
        ) {
          print $1
        }
      }
    '
  )

  if [[ "${#containers[@]}" -eq 0 ]]; then
    log "No old inventario containers found"
    return
  fi

  printf '%s\n' "${containers[@]}" | xargs -r docker rm -f
}

write_env_files() {
  log "Writing backend and MySQL env files"

  cat > "$BACKEND_ROOT/.env" <<EOF
DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=181.193.121.122
CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=$SERVER_ORIGIN
CSRF_TRUSTED_ORIGINS=$SERVER_ORIGIN
MYSQL_HOST=127.0.0.1
MYSQL_PORT=$MYSQL_PORT
MYSQL_DATABASE=$MYSQL_DATABASE
MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_PASSWORD
EOF

  cat > "$DEPLOY_ROOT/mysql.env" <<EOF
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=$MYSQL_DATABASE
MYSQL_USER=$MYSQL_USER
MYSQL_PASSWORD=$MYSQL_PASSWORD
MYSQL_PORT=$MYSQL_PORT
EOF

  cat > "$DEPLOY_ROOT/docker-compose.mysql.generated.yml" <<EOF
services:
  mysql:
    image: mysql:8.0
    container_name: $MYSQL_CONTAINER_NAME
    restart: unless-stopped
    command:
      - --default-authentication-plugin=mysql_native_password
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    environment:
      MYSQL_ROOT_PASSWORD: $MYSQL_ROOT_PASSWORD
      MYSQL_DATABASE: $MYSQL_DATABASE
      MYSQL_USER: $MYSQL_USER
      MYSQL_PASSWORD: $MYSQL_PASSWORD
      TZ: America/Costa_Rica
    ports:
      - "127.0.0.1:$MYSQL_PORT:3306"
    volumes:
      - $DEPLOY_ROOT/mysql-data:/var/lib/mysql
EOF
}

normalize_requirements() {
  local source_file="$BACKEND_ROOT/requirements.txt"
  local target_file="$APP_ROOT/requirements.normalized.txt"

  log "Normalizing Python requirements file"
  python3 - <<PY
from pathlib import Path

source = Path(r"$source_file")
target = Path(r"$target_file")
raw = source.read_bytes()

for encoding in ("utf-8", "utf-16", "utf-16-le", "utf-16-be"):
    try:
        text = raw.decode(encoding)
        break
    except UnicodeDecodeError:
        continue
else:
    raise SystemExit("Could not decode requirements.txt")

target.write_text(text, encoding="utf-8")
print(target)
PY
}

setup_python() {
  log "Creating Python virtualenv"
  python3 -m venv "$VENV_ROOT"

  # shellcheck disable=SC1091
  source "$VENV_ROOT/bin/activate"
  pip install --upgrade pip
  pip install -r "$APP_ROOT/requirements.normalized.txt"
  pip install docxtpl gunicorn

  mkdir -p "$BACKEND_ROOT/staticfiles" "$BACKEND_ROOT/media"
  python "$BACKEND_ROOT/manage.py" collectstatic --noinput
}

start_mysql() {
  log "Starting MySQL in Docker"
  docker compose -f "$DEPLOY_ROOT/docker-compose.mysql.generated.yml" up -d

  log "Waiting for MySQL to accept connections"
  for _ in $(seq 1 60); do
    if docker exec "$MYSQL_CONTAINER_NAME" mysqladmin ping -uroot "-p$MYSQL_ROOT_PASSWORD" --silent >/dev/null 2>&1; then
      return
    fi
    sleep 2
  done

  echo "MySQL container did not become ready in time."
  exit 1
}

import_database() {
  local backup_dir="$APP_ROOT/backups/db"
  local backup_sql="$PROJECT_ROOT/SGICA_backup(1).sql"
  local schema_sync_sql="$PROJECT_ROOT/deploy/sql/2026-03-19_schema_sync.sql"

  if [[ ! -f "$backup_sql" ]]; then
    echo "Missing SQL backup: $backup_sql"
    exit 1
  fi

  log "Backing up the current application database if it exists"
  mkdir -p "$backup_dir"
  if docker exec "$MYSQL_CONTAINER_NAME" mysql -uroot "-p$MYSQL_ROOT_PASSWORD" -Nse "SHOW DATABASES LIKE '$MYSQL_DATABASE';" | grep -q "$MYSQL_DATABASE"; then
    docker exec "$MYSQL_CONTAINER_NAME" mysqldump -uroot "-p$MYSQL_ROOT_PASSWORD" --databases "$MYSQL_DATABASE" > "$backup_dir/pre-reset-$(timestamp).sql" || true
  fi

  log "Resetting and importing the application database"
  docker exec "$MYSQL_CONTAINER_NAME" mysql -uroot "-p$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE IF EXISTS \`$MYSQL_DATABASE\`; CREATE DATABASE \`$MYSQL_DATABASE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  docker exec -i "$MYSQL_CONTAINER_NAME" mysql -uroot "-p$MYSQL_ROOT_PASSWORD" < "$backup_sql"
  docker exec -i "$MYSQL_CONTAINER_NAME" mysql -uroot "-p$MYSQL_ROOT_PASSWORD" < "$schema_sync_sql"
}

build_frontend() {
  local frontend_project="$FRONTEND_ROOT/inventario-ctpc"
  local dist_root="$frontend_project/dist/inventario-ctpc"
  local build_dir=""

  log "Building Angular frontend for /inventario/"
  cd "$frontend_project"

  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  npm run build -- --configuration server-subpath

  if [[ -f "$dist_root/browser/index.html" ]]; then
    build_dir="$dist_root/browser"
  elif [[ -f "$dist_root/index.html" ]]; then
    build_dir="$dist_root"
  else
    echo "Could not find built frontend output under $dist_root"
    exit 1
  fi

  log "Publishing frontend files to Apache document root"
  mkdir -p "$FRONTEND_BUILD_ROOT"
  rsync -a --delete "$build_dir/" "$FRONTEND_BUILD_ROOT/"
}

disable_legacy_inventario_directives_in_file() {
  local conf_file="$1"

  if [[ ! -f "$conf_file" ]]; then
    log "Skipping Apache patch because $conf_file does not exist"
    return
  fi

  log "Disabling only legacy inventario directives in $conf_file"
  cp "$conf_file" "$APP_ROOT/backups/$(basename "$conf_file").$(timestamp).bak"

  python3 - <<PY
from pathlib import Path

conf_path = Path(r"$conf_file")
lines = conf_path.read_text(encoding="utf-8", errors="replace").splitlines()
result = []
inside_old_directory = False

for line in lines:
    stripped = line.strip()

    if stripped.startswith("<Directory /var/www/inventario/>") or stripped.startswith("<Location /inventario/>"):
        inside_old_directory = True
        result.append("# DISABLED_BY_INVENTARIO_DEPLOY " + line)
        continue

    if inside_old_directory:
        result.append("# DISABLED_BY_INVENTARIO_DEPLOY " + line)
        if stripped == "</Directory>":
            inside_old_directory = False
        continue

    if (
        stripped.startswith("Alias /inventario/ ")
        or stripped.startswith("RedirectMatch ^/inventario$")
        or stripped.startswith("Redirect /inventario ")
        or stripped.startswith('ProxyPass        "/inventario/api/"')
        or stripped.startswith('ProxyPassReverse "/inventario/api/"')
        or stripped.startswith('ProxyPass /inventario ')
        or stripped.startswith('ProxyPass /inventario/')
        or stripped.startswith('ProxyPassReverse /inventario ')
        or stripped.startswith('ProxyPassReverse /inventario/')
        or "X-Forwarded-Prefix \"/inventario\"" in stripped
        or "ProxyPassReverseCookiePath / /inventario/" in stripped
    ):
        result.append("# DISABLED_BY_INVENTARIO_DEPLOY " + line)
        continue

    result.append(line)

conf_path.write_text("\n".join(result) + "\n", encoding="utf-8")
PY
}

disable_legacy_inventario_directives() {
  disable_legacy_inventario_directives_in_file "$APACHE_DEFAULT_CONF"
  disable_legacy_inventario_directives_in_file "$APACHE_SSL_CONF"
}

write_apache_conf() {
  log "Writing managed Apache conf"
  cat > "$APACHE_MANAGED_CONF" <<EOF
RedirectMatch ^/inventario$ /inventario/

Alias /inventario/ $FRONTEND_BUILD_ROOT/

<Directory $FRONTEND_BUILD_ROOT>
    Options FollowSymLinks
    AllowOverride None
    Require all granted
    DirectoryIndex index.html

    RewriteEngine On
    RewriteBase /inventario/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /inventario/index.html [L]
</Directory>

ProxyPreserveHost On
RequestHeader set X-Forwarded-Proto expr=%{REQUEST_SCHEME}

ProxyPass /inventario-backend/ http://127.0.0.1:8000/
ProxyPassReverse /inventario-backend/ http://127.0.0.1:8000/
EOF

  a2enmod proxy proxy_http rewrite headers alias >/dev/null
  a2enconf inventario-ctpc >/dev/null
}

write_systemd_service() {
  log "Writing Gunicorn systemd service"
  cat > "$SYSTEMD_SERVICE" <<EOF
[Unit]
Description=SGICA Django Gunicorn
After=network.target docker.service
Requires=docker.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=$BACKEND_ROOT
EnvironmentFile=$BACKEND_ROOT/.env
ExecStart=$VENV_ROOT/bin/gunicorn sgica.wsgi:application --bind 127.0.0.1:8000 --workers 3 --timeout 180 --access-logfile - --error-logfile -
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  chown -R www-data:www-data "$APP_ROOT" "$FRONTEND_BUILD_ROOT"
  systemctl daemon-reload
  systemctl enable --now sgica-gunicorn
}

reload_apache() {
  log "Reloading Apache"
  apache2ctl configtest
  systemctl reload apache2
}

print_summary() {
  cat <<EOF

Deployment completed.

Public URL:
  $SERVER_PUBLIC_URL

Backend API base for the frontend:
  https://181.193.121.122/inventario-backend/

Generated secrets are stored in:
  $BACKEND_ROOT/.env
  $DEPLOY_ROOT/mysql.env

Important:
  This script assumes Apache already handles HTTPS for 181.193.121.122.
  If HTTPS is not already configured on the server, /inventario will only work over HTTP until the SSL vhost is added.
EOF
}

main() {
  require_root
  ensure_command python3
  ensure_command openssl
  ensure_command rsync
  ensure_command ss

  install_packages
  prepare_layout
  load_or_generate_secrets
  report_existing_inventario_containers
  cleanup_old_inventario_containers
  pick_mysql_port
  write_env_files
  normalize_requirements
  setup_python
  start_mysql
  import_database
  build_frontend
  disable_legacy_inventario_directives
  write_apache_conf
  write_systemd_service
  reload_apache
  print_summary
}

main "$@"
