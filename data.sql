-- --------------------------------------------------------
-- Máy chủ:                      127.0.0.1
-- Phiên bản máy chủ:            10.4.32-MariaDB - mariadb.org binary distribution
-- HĐH máy chủ:                  Win64
-- HeidiSQL Phiên bản:           12.11.0.7065
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Đang kết xuất đổ cấu trúc cơ sở dữ liệu cho urbanvn
DROP DATABASE IF EXISTS `urbanvn`;
CREATE DATABASE IF NOT EXISTS `urbanvn` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `urbanvn`;

-- Đang kết xuất đổ cấu trúc cho bảng urbanvn.employees
DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `gender` enum('FEMALE','MALE','OTHER') DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `position` enum('LEADER','MANAGER','STAFF') DEFAULT NULL,
  `role` enum('ADMIN','MANAGER','USER') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `office_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKj9xgmd0ya5jmus09o0b8pqrpb` (`email`),
  UNIQUE KEY `UK3gqbimdf7fckjbwt1kcud141m` (`username`),
  KEY `FKcelobek54amw1bedldhp6f98r` (`office_id`),
  CONSTRAINT `FKcelobek54amw1bedldhp6f98r` FOREIGN KEY (`office_id`) REFERENCES `offices` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Đang kết xuất đổ dữ liệu cho bảng urbanvn.employees: ~1 rows (xấp xỉ)
DELETE FROM `employees`;
INSERT INTO `employees` (`id`, `address`, `avatar`, `created_at`, `email`, `gender`, `name`, `password`, `phone_number`, `position`, `role`, `updated_at`, `username`, `office_id`) VALUES
	(13, 'abc', NULL, '2025-06-28 16:50:54.000000', 'admin123@gmail.com', 'MALE', 'Admin', '123456', '0987654321', 'LEADER', 'ADMIN', '2025-06-28 16:50:28.000000', 'admin', 6);

-- Đang kết xuất đổ cấu trúc cho bảng urbanvn.offices
DROP TABLE IF EXISTS `offices`;
CREATE TABLE IF NOT EXISTS `offices` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKedjms83xmpm0fdqiqya1a6qwt` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Đang kết xuất đổ dữ liệu cho bảng urbanvn.offices: ~4 rows (xấp xỉ)
DELETE FROM `offices`;
INSERT INTO `offices` (`id`, `address`, `name`, `is_active`) VALUES
	(6, NULL, 'Yokohama', 1),
	(7, NULL, 'Tokyo', 1),
	(8, NULL, 'Sapporo', 1),
	(9, NULL, 'Miysgi', 1);

-- Đang kết xuất đổ cấu trúc cho bảng urbanvn.schedules
DROP TABLE IF EXISTS `schedules`;
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `end_time` time(6) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `start_time` time(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `work_type` enum('BUSINESS_TRIP','NORMAL','OUTSIDE','OVERTIME','VACATION') DEFAULT NULL,
  `employee_id` bigint(20) NOT NULL,
  `office_id` bigint(20) DEFAULT NULL,
  `status` enum('ACTIVE','CANCELLED') NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKk1xoduufw1mu7ywao2xg90g3f` (`employee_id`),
  KEY `FK_schedules_offices` (`office_id`),
  CONSTRAINT `FK_schedules_offices` FOREIGN KEY (`office_id`) REFERENCES `offices` (`id`),
  CONSTRAINT `FKk1xoduufw1mu7ywao2xg90g3f` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Đang kết xuất đổ dữ liệu cho bảng urbanvn.schedules: ~0 rows (xấp xỉ)
DELETE FROM `schedules`;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
