# SGICA deployment notes

This repository is easiest to deploy on an Ubuntu server that already uses Apache/Webmin with this layout:

- Angular frontend served by Apache at `/inventario/`
- Django backend served by Gunicorn on `127.0.0.1:8000`
- Apache reverse proxy from `/inventario-backend/` to Gunicorn
- MySQL isolated in Docker only, published to `127.0.0.1:3307`

This avoids the old `nginx + full Docker stack` conflict with the server's existing Apache site.

## One-shot installer

If you want the server to perform the whole setup, use [`deploy/ubuntu/install_inventario.sh`](./ubuntu/install_inventario.sh) from the project root on the Ubuntu server.

## Why the old Docker setup is not the best fit here

- `inventario-docker/docker-compose.yml` exposes Django directly on `8001` and MySQL on `3307`, but the Angular container is commented out.
- The old nginx config expected container-to-container proxying that was never finished.
- The backend in Docker still had hardcoded `localhost` DB settings, so it did not really match the compose networking model.
- Apache already owns the public web entrypoint on the server, so adding another public nginx layer is unnecessary.

## Current schema drift found

`SGICA_backup(1).sql` is close to the app schema, but it is missing at least:

- `activos.serie_modificado`
- `docs.last_row`
- the `pendiente` table

Use the backup first, then run [`deploy/sql/2026-03-19_schema_sync.sql`](./sql/2026-03-19_schema_sync.sql).

## Backend setup

1. Install packages:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-dev build-essential pkg-config default-libmysqlclient-dev libreoffice apache2
```

2. Copy the backend to `/opt/inventario-ctpc/backend`.

3. Create the venv and install requirements:

```bash
cd /opt/inventario-ctpc
python3 -m venv venv
source venv/bin/activate
cd backend
pip install --upgrade pip
pip install -r requirements.txt
pip install docxtpl gunicorn
```

4. Create `/opt/inventario-ctpc/backend/.env` from [`backend/.env.example`](../backend/.env.example).

5. Collect static files:

```bash
cd /opt/inventario-ctpc/backend
source /opt/inventario-ctpc/venv/bin/activate
python manage.py collectstatic --noinput
```

6. Install the systemd service from [`deploy/systemd/sgica-gunicorn.service.example`](./systemd/sgica-gunicorn.service.example):

```bash
sudo cp /path/to/repo/deploy/systemd/sgica-gunicorn.service.example /etc/systemd/system/sgica-gunicorn.service
sudo systemctl daemon-reload
sudo systemctl enable --now sgica-gunicorn
sudo systemctl status sgica-gunicorn
```

## Frontend build for Apache subpath

From `frontend/inventario-ctpc`:

```bash
npm install
npm run build -- --configuration server-subpath
```

Copy the built folder that contains `index.html` to `/var/www/inventario-ctpc/frontend/`.

The `server-subpath` build already points API and media requests to `/inventario-backend/` and uses `/inventario/` as the app base path.

## MySQL in Docker

1. Copy [`deploy/docker-compose.mysql.yml`](./docker-compose.mysql.yml) to a server folder such as `/opt/inventario-ctpc/deploy/`.
2. Edit the passwords before starting it.
3. Start MySQL:

```bash
cd /opt/inventario-ctpc/deploy
sudo docker compose -f docker-compose.mysql.yml up -d
```

4. Import the backup:

```bash
mysql -h 127.0.0.1 -P 3307 -u root -p < SGICA_backup(1).sql
```

5. Run the schema sync:

```bash
mysql -h 127.0.0.1 -P 3307 -u root -p < 2026-03-19_schema_sync.sql
```

Important:

- The dump uses `USE sgica;`, so the backend `.env` should normally also use `MYSQL_DATABASE=sgica`.
- Do not rely on `python manage.py migrate` to build this app schema from scratch. The app has no checked-in Django migrations for `inventario`.

## Apache

Enable the needed modules:

```bash
sudo a2enmod proxy proxy_http rewrite headers alias
sudo systemctl restart apache2
```

Then apply [`deploy/apache/inventario-subpath.conf.example`](./apache/inventario-subpath.conf.example) inside the existing site or virtual host that serves your main server.

If you prefer a dedicated subdomain instead, use [`deploy/apache/inventario-subdomain.conf.example`](./apache/inventario-subdomain.conf.example) and build the frontend with:

```bash
npm run build -- --configuration server-subdomain
```

That variant expects the backend to be proxied at `/backend/` on the same host.

## Recommended order on the real server

1. Start MySQL container.
2. Import `SGICA_backup(1).sql`.
3. Run `2026-03-19_schema_sync.sql`.
4. Configure backend `.env`.
5. Install backend dependencies and start Gunicorn.
6. Build and copy the frontend.
7. Apply Apache config.
8. Test:
   - `/inventario/`
   - `/inventario-backend/login/`
   - document downloads
   - image uploads
   - Excel generation
   - PDF generation through LibreOffice

## Files that should persist across deployments

- `/opt/inventario-ctpc/backend/media/`
- Docker volume for MySQL data
- backend `.env`

## What I would still want from the server before final cutover

- The current Apache vhost or include file that serves the main site
- The exact URL you want to use: subpath (`/inventario/`) or subdomain
- Whether SSL is already terminated by Apache for that site
