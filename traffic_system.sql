-- Buat database
CREATE DATABASE IF NOT EXISTS traffic_system;
USE traffic_system;

-- Tabel admin
CREATE TABLE IF NOT EXISTS admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- Tambahkan admin awal (password dienkripsi menggunakan bcrypt)
-- password: admin123
INSERT INTO admin (username, password)
VALUES ('admin', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8N7L5kB0eix4RIiPBJBD5dZTy3Nrse');

-- Tabel pengaturan durasi
CREATE TABLE IF NOT EXISTS pengaturan_durasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kategori ENUM('Sangat Macet', 'Macet', 'Normal') NOT NULL,
  durasi_merah INT NOT NULL,
  durasi_kuning INT NOT NULL,
  durasi_hijau INT NOT NULL
);
