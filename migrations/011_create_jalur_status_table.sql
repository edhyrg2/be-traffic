-- Migrasi 011: Membuat tabel jalur_status
CREATE TABLE IF NOT EXISTS jalur_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_jalur INT NOT NULL,
  status_lampu ENUM('merah', 'kuning', 'hijau') NOT NULL,
  durasi_tersisa INT NOT NULL DEFAULT 0,
  durasi_total INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_jalur) REFERENCES jalur(id) ON DELETE CASCADE,
  UNIQUE KEY unique_jalur (id_jalur)
);