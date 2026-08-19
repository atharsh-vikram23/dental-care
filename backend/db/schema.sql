-- Dr. Deleep Dental Care — database schema
-- Run this once against a fresh MySQL 8.x server:
--   mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS dr_deleep_dental
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dr_deleep_dental;

-- Application user with least-privilege access. Change the password,
-- then put the same value in backend/.env as DB_PASSWORD.
CREATE USER IF NOT EXISTS 'dental_app'@'%' IDENTIFIED BY 'change_this_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON dr_deleep_dental.* TO 'dental_app'@'%';
FLUSH PRIVILEGES;

-- ---------------------------------------------------------------------
-- services: the 15 preventive services shown on the site. Editable here
-- (or via a future admin UI) without touching frontend code.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  icon         VARCHAR(10)   NOT NULL DEFAULT '🦷',
  title        VARCHAR(120)  NOT NULL,
  teaser       VARCHAR(255)  NOT NULL,
  duration     VARCHAR(50)   NOT NULL,
  ideal_for    VARCHAR(150)  NOT NULL,
  description  TEXT          NOT NULL,
  benefits     JSON          NOT NULL,
  steps        JSON          NOT NULL,
  sort_order   INT           NOT NULL DEFAULT 0,
  active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- bookings: every appointment request submitted through the site.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(120) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  service        VARCHAR(120) NOT NULL,
  booking_date   DATE         NOT NULL,
  booking_time   VARCHAR(20)  NOT NULL,
  notes          TEXT         NULL,
  status         ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date_time (booking_date, booking_time),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- clinic_hours: optional table for future use if hours ever vary by day
-- (e.g. shorter hours on Sunday). Not required for the current site,
-- which uses a single fixed 9–5 window from .env, but included so the
-- schema has a clean place to grow into per-day hours later.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinic_hours (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  day_of_week  TINYINT   NOT NULL,  -- 0 = Sunday ... 6 = Saturday
  opens        TIME      NULL,
  closes       TIME      NULL,
  is_closed    TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_day (day_of_week)
) ENGINE=InnoDB;
