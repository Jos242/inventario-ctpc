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
    estado ENUM("BUENO", "MALO", "REGULAR", "BEENO", "N/I"),
    ubicacion VARCHAR(255) NOT NULL, 
    modo_adquisicion VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2),
    creado_el  DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
)ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;


LOAD DATA INFILE '/var/lib/mysql-files/activos_sin_observaciones_CSV.csv'
INTO TABLE activos 
FIELDS TERMINATED BY ';' 
ENCLOSED BY ''
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id_registro, asiento, no_identificacion, descripcion, marca, modelo, serie, estado, ubicacion, modo_adquisicion, precio);

UPDATE activos SET precio = NULL WHERE precio = 0.00
UPDATE activos SET estado = 'BUENO' WHERE estado = 'BEENO';
ALTER TABLE activos MODIFY estado ENUM("BUENO", "MALO", "REGULAR", "N/I")

--SHOW VARIABLES LIKE "secure_file_priv";