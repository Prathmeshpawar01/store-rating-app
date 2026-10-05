-- =====================================================================
-- Store Rating Application - MySQL schema
-- Target: MySQL 8.0.16+ (CHECK constraints are enforced from 8.0.16)
--
-- Usage (manual):
--   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS store_rating CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql -u root -p store_rating < database/schema.sql
--
-- WARNING: this script DROPS and re-creates the tables.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- users: every account (system administrators, normal users, store owners)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(60)  NOT NULL,
  email       VARCHAR(255) NOT NULL,
  password    VARCHAR(255) NOT NULL,              -- bcrypt hash, never plain text
  address     VARCHAR(400) NOT NULL,
  role        ENUM('ADMIN', 'USER', 'OWNER') NOT NULL DEFAULT 'USER',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT chk_users_name_length CHECK (CHAR_LENGTH(name) BETWEEN 20 AND 60)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- uq_users_email already creates an index on users.email
CREATE INDEX idx_users_role       ON users (role);
CREATE INDEX idx_users_name       ON users (name);
CREATE INDEX idx_users_created_at ON users (created_at);

-- ---------------------------------------------------------------------
-- stores: each store belongs to exactly one OWNER user
-- ---------------------------------------------------------------------
CREATE TABLE stores (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(60)  NOT NULL,
  email       VARCHAR(255) NOT NULL,
  address     VARCHAR(400) NOT NULL,
  owner_id    INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_stores_email UNIQUE (email),
  CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- uq_stores_email already creates an index on stores.email
CREATE INDEX idx_stores_name     ON stores (name);
CREATE INDEX idx_stores_address  ON stores (address(191));
CREATE INDEX idx_stores_owner_id ON stores (owner_id);

-- ---------------------------------------------------------------------
-- ratings: one rating (1-5) per (user, store); editable via UPDATE
-- ---------------------------------------------------------------------
CREATE TABLE ratings (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  store_id    INT UNSIGNED NOT NULL,
  rating      TINYINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_ratings_user_store UNIQUE (user_id, store_id),
  CONSTRAINT chk_ratings_value CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_ratings_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ratings_store FOREIGN KEY (store_id)
    REFERENCES stores (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- uq_ratings_user_store (user_id, store_id) also serves lookups by user_id
CREATE INDEX idx_ratings_user_id  ON ratings (user_id);
CREATE INDEX idx_ratings_store_id ON ratings (store_id);
