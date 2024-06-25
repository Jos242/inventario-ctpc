DROP DATABASE IF EXISTS SGICA;
CREATE database SGICA;
DROP USER IF EXISTS 'ctpc'@'localhost';
CREATE USER 'ctpc'@'localhost' IDENTIFIED BY 'YFqut12#';
GRANT ALL PRIVILEGES ON SGICA.* TO 'ctpc'@'localhost';
FLUSH PRIVILEGES;
use SGICA;

DROP TABLE IF EXISTS activos;
CREATE TABLE activos(
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_registro VARCHAR(150) UNIQUE NOT NULL,
    asiento INT NOT NULL, 
    no_identificacion VARCHAR(150) UNIQUE NOT NULL,
    descripcion VARCHAR(150) NOT NULL ,
    marca VARCHAR(150),
    modelo VARCHAR(150),
    serie VARCHAR(150),
    estado ENUM("Bueno", "Malo", "Regular", "BEENO", "N/I", "TESTING") NULL,
    ubicacion VARCHAR(255) NOT NULL, 
    modo_adquisicion VARCHAR(255) NOT NULL,
    precio VARCHAR(255),
    creado_el  DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    observacion TEXT
    
)ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

DROP TABLE IF EXISTS observaciones;
CREATE TABLE  observaciones(
    id INT PRIMARY KEY AUTO_INCREMENT, 
    id_registro VARCHAR(150) UNIQUE NOT NULL,
    asiento INT NOT NULL,
    descripcion TEXT NOT NULL,
    activo_id VARCHAR(150) NOT NULL,
    FOREIGN KEY (activo_id) REFERENCES activos(id_registro) 
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

DROP TABLE IF EXISTS docs;
CREATE TABLE docs(
    id INT PRIMARY KEY AUTO_INCREMENT, 
    titulo VARCHAR(200) NOT NULL,
    tipo ENUM("PDF", "EXCEL") NOT NULL,
    ruta VARCHAR(250) NOT NULL, 
    creado_el  DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


LOAD DATA INFILE '/var/lib/mysql-files/all_activos.csv'
INTO TABLE activos 
FIELDS TERMINATED BY ';' 
ENCLOSED BY ''
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id_registro, asiento, no_identificacion, descripcion, marca, modelo, serie, estado, 
ubicacion, modo_adquisicion, precio, observacion);

LOAD DATA INFILE '/var/lib/mysql-files/observaciones_part1.csv'
INTO TABLE observaciones 
FIELDS TERMINATED BY ';' 
ENCLOSED BY ''
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id_registro, asiento, descripcion, activo_id);

LOAD DATA INFILE '/var/lib/mysql-files/observaciones_part2.csv'
INTO TABLE observaciones 
FIELDS TERMINATED BY ';' 
ENCLOSED BY ''
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id_registro, asiento, descripcion, activo_id);

-- UPDATE activos SET precio = NULL WHERE precio = 0.00;
UPDATE activos SET estado = 'Bueno' WHERE estado = 'BEENO';
UPDATE activos SET estado = NULL WHERE estado = 'TESTING';
UPDATE activos SET precio = NULL WHERE precio = 'N/A';
UPDATE activos SET precio = NULL WHERE precio = '';
-- UPDATE activos SET estado = 'REGULAR' WHERE estado = 'N/I';
-- UPDATE activos set marca  = NULL WHERE marca = 'N/I';
-- UPDATE activos set modelo = NULL WHERE modelo = 'N/I';
ALTER TABLE activos MODIFY precio Decimal(10,2);
ALTER TABLE activos ADD impreso BOOLEAN DEFAULT 0;
ALTER TABLE observaciones ADD impreso BOOLEAn DEFAULT 0;
UPDATE activos SET impreso = 1 WHERE impreso = 0;
UPDATE observaciones SET impreso = 1 WHERE impreso = 0; 


-- SHOW VARIABLES LIKE "sec{ure_file_priv";
