-- Migrasi 002: Membuat tabel pengaturan_durasi
CREATE TABLE IF NOT EXISTS pengaturan_durasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_jalur INT NOT NULL DEFAULT 1,
  id_kategori INT NOT NULL DEFAULT 1,
  durasi_merah INT NOT NULL,
  durasi_kuning INT NOT NULL,
  durasi_hijau INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);