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
  `position` enum('LEADER','MANAGER','STAFF','SUPERVISOR') DEFAULT NULL,
  `role` enum('ADMIN','MANAGER','USER') DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `username` varchar(255) NOT NULL,
  `office_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKj9xgmd0ya5jmus09o0b8pqrpb` (`email`),
  UNIQUE KEY `UK3gqbimdf7fckjbwt1kcud141m` (`username`),
  KEY `FKcelobek54amw1bedldhp6f98r` (`office_id`),
  CONSTRAINT `FKcelobek54amw1bedldhp6f98r` FOREIGN KEY (`office_id`) REFERENCES `offices` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Đang kết xuất đổ dữ liệu cho bảng urbanvn.employees: ~12 rows (xấp xỉ)
DELETE FROM `employees`;
INSERT INTO `employees` (`id`, `address`, `avatar`, `created_at`, `email`, `gender`, `name`, `password`, `phone_number`, `position`, `role`, `updated_at`, `username`, `office_id`) VALUES
	(1, '123 Đường ABC, Hà Nội', NULL, '2025-06-24 10:10:12.000000', 'admin@urban.vn', 'MALE', 'Nguyễn Văn Admin', '$2a$10$s4gteSTE4Kt2NsytZdoTy..2ZYVQbnLMkcRuMFS8HRVF7c6OncQhS', '0901234567', 'MANAGER', 'ADMIN', '2025-06-24 10:10:12.000000', 'admin', 1),
	(2, '456 Đường XYZ, TP.HCM', NULL, '2025-06-24 10:10:12.000000', 'manager@urban.vn', 'FEMALE', 'Trần Thị Quản lý', '$2a$10$obaVR4o8On3HsQUrUBF0s.vD5eqYVNpwK0RUavJce1X8hQbNHxM22', '0901234568', 'MANAGER', 'MANAGER', '2025-06-24 10:10:12.000000', 'manager', 2),
	(3, '789 Đường DEF, Hà Nội', NULL, '2025-06-24 10:10:12.000000', 'hung.le@urban.vn', 'MALE', 'Lê Văn Hùng', '$2a$10$AUwExvX7RqSR2aKanV0CRO3gMEUD7iuljTCGufmFuYUQjgsZLZATW', '0901234569', 'LEADER', 'USER', '2025-06-24 10:10:12.000000', 'hung.le', 1),
	(4, '101 Đường GHI, Hà Nội', NULL, '2025-06-24 10:10:12.000000', 'lan.pham@urban.vn', 'FEMALE', 'Phạm Thị Lan', '$2a$10$/WF8/1J/Gm7VE7GwTwJ0I.34jJRL0zsMf10WlSIqbUyjMwo1fDDzW', '0901234570', 'STAFF', 'USER', '2025-06-24 10:10:12.000000', 'lan.pham', 1),
	(5, '202 Đường JKL, Hà Nội', NULL, '2025-06-24 10:10:12.000000', 'tuan.hoang@urban.vn', 'MALE', 'Hoàng Minh Tuấn', '$2a$10$LDElzHqxjp9iogrAU4oq1uFnUFIXtMXV.c1xRZ7yq36.nOe0umuDK', '0901234571', 'STAFF', 'USER', '2025-06-24 10:10:12.000000', 'tuan.hoang', 1),
	(6, '404 Đường PQR, TP.HCM', NULL, '2025-06-24 10:10:12.000000', 'nam.dang@urban.vn', 'MALE', 'Đặng Văn Nam', '$2a$10$farP9UTTth94sjmRzj7QxO3qPQFR7FyUvV5ZnqYX.NT7khfWJ1eW.', '0901234573', 'STAFF', 'USER', '2025-06-24 10:10:12.000000', 'nam.dang', 2),
	(7, '505 Đường STU, TP.HCM', NULL, '2025-06-24 10:10:12.000000', 'hoa.vu@urban.vn', 'FEMALE', 'Vũ Thị Hoa', '$2a$10$0XGSUqzWFaSSHyGY7HtSE.9J428w67nZIhnz8RTE9HnaJx87nvPXq', '0901234574', 'STAFF', 'USER', '2025-06-24 10:10:12.000000', 'hoa.vu', 2),
	(8, '606 Đường VWX, Đà Nẵng', NULL, '2025-06-24 10:10:12.000000', 'duc.bui@urban.vn', 'MALE', 'Bùi Văn Đức', '$2a$10$3WLIRioVAWE66jMjQWjCluhmthvs9PvdesaplKoaEYTs5TOUes4US', '0901234575', 'LEADER', 'USER', '2025-06-24 10:10:12.000000', 'duc.bui', 3),
	(9, '707 Đường YZ, Đà Nẵng', NULL, '2025-06-24 10:10:12.000000', 'nga.ly@urban.vn', 'FEMALE', 'Lý Thị Nga', '$2a$10$9svD2qSw.TYnC9xia1/tjObJMkBRmDfBTJ8cS0j.HmfVqFFgFLXRq', '0901234576', 'STAFF', 'USER', '2025-06-24 10:10:12.000000', 'nga.ly', 3),
	(10, '1-1-1 Shibuya, Tokyo', NULL, '2025-06-24 10:10:12.000000', 'hiroshi.tanaka@urban.vn', 'MALE', 'Tanaka Hiroshi', '$2a$10$CDWCXZfXzeY1sHVN7Yb3iuf59GRUFHGMc0kfYLdC8E4T3w073kH46', '090-1234-5577', 'MANAGER', 'MANAGER', '2025-06-24 10:10:12.000000', 'hiroshi.tanaka', 4),
	(11, '2-2-2 Shinjuku, Tokyo', NULL, '2025-06-24 10:10:12.000000', 'yuki.sato@urban.vn', 'FEMALE', 'Sato Yuki', '$2a$10$hcdvtJqsYgOEWpsZ2kNXn.oRU2tMAGkC86scDbaD0Qx7JiHrqrZx2', '090-1234-5578', 'STAFF', 'USER', '2025-06-24 10:10:12.000000', 'yuki.sato', 4),
	(12, '4-4-4 Namba, Osaka', NULL, '2025-06-24 10:10:12.000000', 'akiko.suzuki@urban.vn', 'FEMALE', 'Suzuki Akiko', '$2a$10$8Qqu82VaXVSYOi9C7CaAOO3NOZHiL6r1b/nJzvXJRroHy8HtsiFta', '090-1234-5580', 'STAFF', 'USER', '2025-06-24 10:10:12.000000', 'akiko.suzuki', 5);

-- Đang kết xuất đổ cấu trúc cho bảng urbanvn.offices
DROP TABLE IF EXISTS `offices`;
CREATE TABLE IF NOT EXISTS `offices` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `address` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKedjms83xmpm0fdqiqya1a6qwt` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Đang kết xuất đổ dữ liệu cho bảng urbanvn.offices: ~5 rows (xấp xỉ)
DELETE FROM `offices`;
INSERT INTO `offices` (`id`, `address`, `name`, `is_active`) VALUES
	(1, 'Tầng 10, Tòa nhà Keangnam, Phạm Hùng, Nam Từ Liêm, Hà Nội', 'Văn phòng Hà Nội', b'0'),
	(2, 'Tầng 15, Tòa nhà Bitexco, Quận 1, TP.HCM', 'Văn phòng TP.HCM', b'0'),
	(3, 'Tầng 5, Tòa nhà FPT, Quận Ngũ Hành Sơn, Đà Nẵng', 'Văn phòng Đà Nẵng', b'0'),
	(4, 'Shibuya Sky Building, Tokyo, Japan', 'Văn phòng Tokyo', b'0'),
	(5, 'Umeda Business Center, Osaka, Japan', 'Văn phòng Osaka', b'0');

-- Đang kết xuất đổ cấu trúc cho bảng urbanvn.password_reset_token
DROP TABLE IF EXISTS `password_reset_token`;
CREATE TABLE IF NOT EXISTS `password_reset_token` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `expiry_date` datetime(6) NOT NULL,
  `token` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKcokxly6aosm7di3ldt7whhoqw` (`email`),
  UNIQUE KEY `UKg0guo4k8krgpwuagos61oc06j` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Đang kết xuất đổ dữ liệu cho bảng urbanvn.password_reset_token: ~2 rows (xấp xỉ)
DELETE FROM `password_reset_token`;
INSERT INTO `password_reset_token` (`id`, `email`, `expiry_date`, `token`) VALUES
	(1, 'zerotwo18022003@gmail.com', '2025-06-25 13:40:31.000000', '54907179-997f-4c78-9beb-84fe0f68cb59'),
	(2, 'baothuong18022003@gmail.com', '2025-06-25 20:54:49.000000', '6a047ed4-59a4-4144-bc22-0a27c8dbcbd3');

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
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Đang kết xuất đổ dữ liệu cho bảng urbanvn.schedules: ~36 rows (xấp xỉ)
DELETE FROM `schedules`;
INSERT INTO `schedules` (`id`, `created_at`, `end_time`, `notes`, `start_time`, `updated_at`, `start_date`, `end_date`, `work_type`, `employee_id`, `office_id`, `status`) VALUES
	(1, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-07-17', '2025-07-19', 'VACATION', 1, NULL, 'ACTIVE'),
	(2, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-06-28', '2025-06-28', 'OVERTIME', 1, NULL, 'ACTIVE'),
	(3, '2025-06-24 10:10:12.000000', NULL, 'Đi công tác dài ngày', NULL, '2025-06-24 10:10:12.000000', '2025-07-18', '2025-07-21', 'BUSINESS_TRIP', 1, NULL, 'ACTIVE'),
	(4, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-03', '2025-07-03', 'OVERTIME', 1, NULL, 'ACTIVE'),
	(5, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-19', '2025-07-19', 'NORMAL', 2, NULL, 'ACTIVE'),
	(6, '2025-06-24 10:10:12.000000', NULL, 'Đi công tác dài ngày', NULL, '2025-06-24 10:10:12.000000', '2025-06-26', '2025-06-28', 'BUSINESS_TRIP', 2, NULL, 'ACTIVE'),
	(7, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-04', '2025-07-04', 'NORMAL', 2, NULL, 'ACTIVE'),
	(8, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-23', '2025-07-23', 'OUTSIDE', 3, NULL, 'ACTIVE'),
	(9, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-06-28', '2025-06-28', 'NORMAL', 3, NULL, 'ACTIVE'),
	(10, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-11', '2025-07-11', 'OUTSIDE', 3, NULL, 'ACTIVE'),
	(11, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-06-28', '2025-06-28', 'OVERTIME', 3, NULL, 'ACTIVE'),
	(12, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-06-27', '2025-06-27', 'NORMAL', 4, NULL, 'ACTIVE'),
	(13, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-07-08', '2025-07-10', 'VACATION', 4, NULL, 'ACTIVE'),
	(14, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-06-26', '2025-06-30', 'VACATION', 5, NULL, 'ACTIVE'),
	(15, '2025-06-24 10:10:12.000000', NULL, 'Đi công tác dài ngày', NULL, '2025-06-24 10:10:12.000000', '2025-06-24', '2025-06-29', 'BUSINESS_TRIP', 5, NULL, 'ACTIVE'),
	(16, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-02', '2025-07-02', 'NORMAL', 6, NULL, 'ACTIVE'),
	(17, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-06-26', '2025-06-26', 'OUTSIDE', 6, NULL, 'ACTIVE'),
	(18, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-16', '2025-07-16', 'OVERTIME', 7, NULL, 'ACTIVE'),
	(19, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-14', '2025-07-14', 'NORMAL', 7, NULL, 'ACTIVE'),
	(20, '2025-06-24 10:10:12.000000', NULL, 'Đi công tác dài ngày', NULL, '2025-06-24 10:10:12.000000', '2025-07-15', '2025-07-17', 'BUSINESS_TRIP', 7, NULL, 'ACTIVE'),
	(21, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-06-29', '2025-07-02', 'VACATION', 7, NULL, 'ACTIVE'),
	(22, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-07-22', '2025-07-26', 'VACATION', 8, NULL, 'ACTIVE'),
	(23, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-07-16', '2025-07-20', 'VACATION', 8, NULL, 'ACTIVE'),
	(24, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-03', '2025-07-03', 'OVERTIME', 8, NULL, 'ACTIVE'),
	(25, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-06-29', '2025-07-02', 'VACATION', 8, NULL, 'ACTIVE'),
	(26, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-07-12', '2025-07-16', 'VACATION', 9, NULL, 'ACTIVE'),
	(27, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-18', '2025-07-18', 'OVERTIME', 9, NULL, 'ACTIVE'),
	(28, '2025-06-24 10:10:12.000000', NULL, 'Đi công tác dài ngày', NULL, '2025-06-24 10:10:12.000000', '2025-07-12', '2025-07-16', 'BUSINESS_TRIP', 9, NULL, 'ACTIVE'),
	(29, '2025-06-24 10:10:12.000000', NULL, 'Đi công tác dài ngày', NULL, '2025-06-24 10:10:12.000000', '2025-06-30', '2025-07-05', 'BUSINESS_TRIP', 10, NULL, 'ACTIVE'),
	(30, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-03', '2025-07-03', 'OVERTIME', 10, NULL, 'ACTIVE'),
	(31, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-08', '2025-07-08', 'NORMAL', 11, NULL, 'ACTIVE'),
	(32, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-06-30', '2025-06-30', 'OUTSIDE', 11, NULL, 'ACTIVE'),
	(33, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-06-28', '2025-06-28', 'OUTSIDE', 12, NULL, 'ACTIVE'),
	(34, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-13', '2025-07-13', 'OUTSIDE', 12, NULL, 'ACTIVE'),
	(35, '2025-06-24 10:10:12.000000', '17:30:00.000000', 'Công việc trong ngày.', '08:30:00.000000', '2025-06-24 10:10:12.000000', '2025-07-22', '2025-07-22', 'NORMAL', 12, NULL, 'ACTIVE'),
	(36, '2025-06-24 10:10:12.000000', NULL, 'Nghỉ phép theo kế hoạch', NULL, '2025-06-24 10:10:12.000000', '2025-07-18', '2025-07-23', 'VACATION', 12, NULL, 'ACTIVE');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
