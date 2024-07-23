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

DROP TABLE IF EXISTS departamentos;
CREATE TABLE departamentos(
	id INT PRIMARY KEY AUTO_INCREMENT,
    descripcion VARCHAR(240) NOT NULL UNIQUE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;

DROP TABLE IF EXISTS puestos;
CREATE TABLE puestos(
	id INT PRIMARY KEY AUTO_INCREMENT,
    descripcion VARCHAR(240) NOT NULL UNIQUE
) ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4;



-- LINUX QUERIES----------------------------------------------------------------------------
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
-- ----------------------------------------------------------------------------------------

INSERT INTO puestos (descripcion) VALUES
('AGENTE DE SEGURIDAD'),
('AUX. ADMINISTRATIVA'),
('AUX. ADMINISTRATIVO'),
('CONSERJE'),
('COORD. CON LA EMPRESA'),
('COORDINADOR ACADÉMICO'),
('COORDINADOR TÉCNICO'),
('DIRECTORA'),
('DOCENTE'),
('GEST. INFRAESTRUCTURA TI'),
('GESTOR DE INNOVACIÓN'),
('OFICINISTA'),
('ORIENTADOR'),
('ORIENTADORA'),
('SUB-DIRECTORA');

INSERT INTO departamentos (descripcion) VALUES
('DIRECTORA'),
('SUB-DIRECTORA'),
('DEPARTAMENTO AUX. ADMINISTRATIVO'),
('DEPARTAMENTO DE ORIENTACIÓN'),
('GESTIÓN DE INFRAESTRUCTURA DE TI'),
('DEPARTAMENTO MATEMÁTICAS'),
('COORDINACIÓN TÉCNICA'),
('COORDINACIÓN CON EMPRESAS'),
('OFICINISTA'),
('AGENTE DE SEGURIDAD Y VIGILANCIA'),
('CONSERJE'),
('CONSERJE REUBICADA'),
('GESTOR DE INNOVACIÓN'),
('DEPARTAMENTO DE ESPAÑOL'),
('DEPARTAMENTO ESTUDIOS SOC.'),
('DEPARTAMENTO CIENCIAS'),
('DEPARTAMENTO QUIMICA, FISICA Y BIOLOGÍA'),
('DEPARTAMENTO INGLÉS'),
('DEPARTAMENTO FRANCÉS'),
('DEPARTAMENTO EDUC. FISICA'),
('DEPARTAMENTO MÚSICA'),
('DEPARTAMENTO RELIGIÓN'),
('ETICA Y PSICOLOGÍA'),
('PROG. NAC. FORMACIÓN TECNOLÓGICA'),
('DOCENTES REUBICADAS'),
('TALLER EXPLORATORIO'),
('ESPECIALIDAD ADUANAS'),
('ESPECIALIDAD CONTABILIDAD'),
('ESPECIALIDAD EJECUTIVO'),
('ESPECIALIDAD ELECTRÓNICA'),
('DIBUJO TÉCNICO'),
('ESPECIALIDAD TURISMO'),
('DESARROLLO DEL SOFTWARE'),
('BANCA Y FINANZAS'),
('INGLÉS ESPECIALIZADO');

UPDATE activos SET estado = 'Bueno' WHERE estado = 'BEENO';
UPDATE activos SET estado = NULL WHERE estado = 'TESTING';
UPDATE activos SET precio = NULL WHERE precio = 'N/A';
UPDATE activos SET precio = NULL WHERE precio = '';
ALTER TABLE activos MODIFY precio Decimal(10,2);
ALTER TABLE activos ADD impreso BOOLEAN DEFAULT 0;
ALTER TABLE activos ADD ubicacion_actual INT;
ALTER TABLE activos ADD conectividad BOOLEAN DEFAULT 0;
ALTER TABLE activos ADD seguridad BOOLEAN DEFAULT 0;
ALTER TABLE activos ADD placa_impresa BOOLEAN DEFAULT 0;
ALTER TABLE activos 
ADD COLUMN de_baja ENUM('NO DADO DE BAJA', 'DADO DE BAJA CON PLACA', 'DADO DE BAJA SIN PLACA') 
NOT NULL DEFAULT 'NO DADO DE BAJA';
ALTER TABLE observaciones ADD impreso BOOLEAN DEFAULT 0;
UPDATE activos SET impreso = 1 WHERE impreso = 0;
UPDATE observaciones SET impreso = 1 WHERE impreso = 0; 


-- SHOW VARIABLES LIKE "secure_file_priv";

-- For test puporposes, delete these queries.
UPDATE observaciones
SET impreso = 1
WHERE impreso = 0 AND id_registro = '1,137,01';

UPDATE observaciones
SET impreso = 0
WHERE impreso = 1 AND id_registro = '1,137,02';

DELETE FROM observaciones
WHERE id_registro = '1,137,01';