USE sgica;

ALTER TABLE activos
    ADD COLUMN IF NOT EXISTS serie_modificado varchar(150) NOT NULL DEFAULT 'N/A' AFTER serie;

UPDATE activos
SET serie_modificado = serie
WHERE serie_modificado IS NULL
   OR serie_modificado = ''
   OR serie_modificado = 'N/A';

ALTER TABLE docs
    ADD COLUMN IF NOT EXISTS last_row int DEFAULT NULL AFTER creado_el;

CREATE TABLE IF NOT EXISTS pendiente (
    id int NOT NULL AUTO_INCREMENT,
    http varchar(6) NOT NULL,
    usuario_id int DEFAULT NULL,
    url longtext NOT NULL,
    data longtext NOT NULL,
    descripcion longtext NOT NULL,
    creado_en datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aprovado tinyint(1) DEFAULT NULL,
    aprovado_por_id int DEFAULT NULL,
    aprovado_en datetime DEFAULT NULL,
    PRIMARY KEY (id),
    KEY pendiente_usuario_id_fk (usuario_id),
    KEY pendiente_aprovado_por_id_fk (aprovado_por_id),
    CONSTRAINT pendiente_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES auth_user (id),
    CONSTRAINT pendiente_aprovado_por_id_fk FOREIGN KEY (aprovado_por_id) REFERENCES auth_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
