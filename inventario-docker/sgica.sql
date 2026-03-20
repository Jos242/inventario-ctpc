-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: sgica
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activoobservacion`
--

DROP TABLE IF EXISTS `activoobservacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activoobservacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `idActivo` int NOT NULL,
  `idObservacion` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `activoobservacion_idActivo_a220f059_fk_activos_id` (`idActivo`),
  KEY `activoobservacion_idObservacion_c64bcc73_fk_observaciones_id` (`idObservacion`),
  CONSTRAINT `activoobservacion_idActivo_a220f059_fk_activos_id` FOREIGN KEY (`idActivo`) REFERENCES `activos` (`id`),
  CONSTRAINT `activoobservacion_idObservacion_c64bcc73_fk_observaciones_id` FOREIGN KEY (`idObservacion`) REFERENCES `observaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1358 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activos`
--

DROP TABLE IF EXISTS `activos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_registro` varchar(150) NOT NULL,
  `asiento` int NOT NULL,
  `no_identificacion` varchar(150) NOT NULL,
  `descripcion` varchar(150) NOT NULL,
  `marca` varchar(150) NOT NULL,
  `modelo` varchar(150) NOT NULL,
  `serie` varchar(150) NOT NULL,
  `serie_modificado` varchar(150) NOT NULL DEFAULT '',
  `estado` varchar(7) NOT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `fecha` datetime(6) NOT NULL,
  `observacion` longtext NOT NULL,
  `impreso` tinyint(1) NOT NULL,
  `conectividad` tinyint(1) NOT NULL,
  `seguridad` tinyint(1) NOT NULL,
  `placa` tinyint(1) NOT NULL,
  `baja` varchar(25) NOT NULL,
  `modo_adquisicion` int DEFAULT NULL,
  `ubicacion_actual` int DEFAULT NULL,
  `ubicacion_original` int DEFAULT NULL,
  `forced` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_registro` (`id_registro`),
  UNIQUE KEY `no_identificacion` (`no_identificacion`),
  KEY `activos_ubicacion_actual_a15d4b31_fk_ubicaciones_id` (`ubicacion_actual`),
  KEY `activos_ubicacion_original_bdac7073_fk_ubicaciones_id` (`ubicacion_original`),
  KEY `activos_modo_adquisicion_3c23bf50_fk_modoadquisicion_id` (`modo_adquisicion`),
  CONSTRAINT `activos_modo_adquisicion_3c23bf50_fk_modoadquisicion_id` FOREIGN KEY (`modo_adquisicion`) REFERENCES `modoadquisicion` (`id`),
  CONSTRAINT `activos_ubicacion_actual_a15d4b31_fk_ubicaciones_id` FOREIGN KEY (`ubicacion_actual`) REFERENCES `ubicaciones` (`id`),
  CONSTRAINT `activos_ubicacion_original_bdac7073_fk_ubicaciones_id` FOREIGN KEY (`ubicacion_original`) REFERENCES `ubicaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9165 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` int NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cierreinventario`
--

DROP TABLE IF EXISTS `cierreinventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cierreinventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_revision` varchar(10) NOT NULL,
  `fecha` date DEFAULT NULL,
  `finalizado` tinyint(1) NOT NULL,
  `funcionario` int NOT NULL,
  `aula` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cierreinventario_aula_4d2a3155_fk_ubicaciones_id` (`aula`),
  KEY `cierreinventario_funcionario_3d398152_fk` (`funcionario`),
  CONSTRAINT `cierreinventario_aula_4d2a3155_fk_ubicaciones_id` FOREIGN KEY (`aula`) REFERENCES `ubicaciones` (`id`),
  CONSTRAINT `cierreinventario_funcionario_3d398152_fk` FOREIGN KEY (`funcionario`) REFERENCES `funcionarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `departamentos`
--

DROP TABLE IF EXISTS `departamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(240) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `docs`
--

DROP TABLE IF EXISTS `docs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(200) NOT NULL,
  `tipo` varchar(5) NOT NULL,
  `ruta` varchar(250) NOT NULL,
  `impreso` tinyint(1) NOT NULL,
  `creado_el` datetime(6) NOT NULL DEFAULT (now(6)),
  `last_row` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `funcionarios`
--

DROP TABLE IF EXISTS `funcionarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcionarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_completo` longtext NOT NULL,
  `departamento` int NOT NULL,
  `user_id` int NOT NULL,
  `puesto` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `funcionarios_departamento_21833cdf_fk_departamentos_id` (`departamento`),
  KEY `funcionarios_puesto_09c98349_fk_puestos_id` (`puesto`),
  CONSTRAINT `funcionarios_departamento_21833cdf_fk_departamentos_id` FOREIGN KEY (`departamento`) REFERENCES `departamentos` (`id`),
  CONSTRAINT `funcionarios_puesto_09c98349_fk_puestos_id` FOREIGN KEY (`puesto`) REFERENCES `puestos` (`id`),
  CONSTRAINT `funcionarios_user_id_ccf0f829_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historialacceso`
--

DROP TABLE IF EXISTS `historialacceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historialacceso` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_usuario` varchar(20) NOT NULL,
  `fecha_hora_acceso` datetime(6) NOT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `historialacceso_usuario_id_c7ffa044_fk_auth_user_id` (`usuario_id`),
  CONSTRAINT `historialacceso_usuario_id_c7ffa044_fk_auth_user_id` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historialubicaciones`
--

DROP TABLE IF EXISTS `historialubicaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historialubicaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fecha` datetime DEFAULT NULL,
  `activo` varchar(150) NOT NULL,
  `ubicacion` int NOT NULL,
  `acta` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `historialubicaciones_activo_ce5052a9_fk_activos_id_registro` (`activo`),
  KEY `historialubicaciones_ubicacion_b7f48298_fk_ubicaciones_id` (`ubicacion`),
  CONSTRAINT `historialubicaciones_activo_ce5052a9_fk_activos_id_registro` FOREIGN KEY (`activo`) REFERENCES `activos` (`id_registro`),
  CONSTRAINT `historialubicaciones_ubicacion_b7f48298_fk_ubicaciones_id` FOREIGN KEY (`ubicacion`) REFERENCES `ubicaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `modoadquisicion`
--

DROP TABLE IF EXISTS `modoadquisicion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modoadquisicion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(240) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `observaciones`
--

DROP TABLE IF EXISTS `observaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `observaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_registro` varchar(150) NOT NULL,
  `asiento` int NOT NULL,
  `descripcion` longtext NOT NULL,
  `impreso` tinyint(1) NOT NULL,
  `forced` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_registro` (`id_registro`)
) ENGINE=InnoDB AUTO_INCREMENT=2164 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pendiente`
--

DROP TABLE IF EXISTS `pendiente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pendiente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `http` varchar(45) NOT NULL,
  `usuario_id` int NOT NULL,
  `url` text NOT NULL,
  `data` text NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `aprovado` tinyint(1) DEFAULT NULL,
  `aprovado_por_id` int DEFAULT NULL,
  `aprovado_en` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_Pendiente_Usuario_idx` (`usuario_id`),
  KEY `FK_Pendiente_Usuario2_idx` (`aprovado_por_id`),
  CONSTRAINT `FK_Pendiente_Usuario` FOREIGN KEY (`usuario_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `FK_Pendiente_Usuario2` FOREIGN KEY (`aprovado_por_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plantillas`
--

DROP TABLE IF EXISTS `plantillas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantillas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` longtext NOT NULL,
  `tipo` varchar(21) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `puestos`
--

DROP TABLE IF EXISTS `puestos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `puestos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(240) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `descripcion` (`descripcion`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `revisiones`
--

DROP TABLE IF EXISTS `revisiones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `revisiones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` varchar(11) NOT NULL,
  `fecha` date DEFAULT NULL,
  `nota` longtext,
  `cierre_inventario_id` int NOT NULL,
  `id_registro` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `revisiones_cierre_inventario_id_e96a594a_fk_cierreinventario_id` (`cierre_inventario_id`),
  KEY `revisiones_id_registro_ac9f0532_fk_activos_id_registro` (`id_registro`),
  CONSTRAINT `revisiones_cierre_inventario_id_e96a594a_fk_cierreinventario_id` FOREIGN KEY (`cierre_inventario_id`) REFERENCES `cierreinventario` (`id`),
  CONSTRAINT `revisiones_id_registro_ac9f0532_fk_activos_id_registro` FOREIGN KEY (`id_registro`) REFERENCES `activos` (`id_registro`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ubicaciones`
--

DROP TABLE IF EXISTS `ubicaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ubicaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre_oficial` varchar(240) NOT NULL,
  `alias` varchar(240) DEFAULT NULL,
  `img_path` varchar(250) NOT NULL,
  `funcionario_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_nombre_oficial_alias` (`nombre_oficial`,`alias`),
  KEY `ubicaciones_funcionario_id_5c4119bb_fk` (`funcionario_id`),
  CONSTRAINT `ubicaciones_funcionario_id_5c4119bb_fk` FOREIGN KEY (`funcionario_id`) REFERENCES `funcionarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-13  2:38:28
