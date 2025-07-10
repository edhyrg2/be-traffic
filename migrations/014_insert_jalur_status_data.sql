-- Migrasi 014: Insert data awal untuk jalur_status
INSERT INTO jalur_status (id_jalur, status_lampu, durasi_tersisa, durasi_total, jumlah_kendaraan_terakhir) 
VALUES 
  (1, 'hijau', 30, 30, 50),
  (2, 'merah', 90, 90, 45),
  (3, 'merah', 60, 60, 55),
  (4, 'merah', 30, 30, 40)
ON DUPLICATE KEY UPDATE 
  status_lampu = VALUES(status_lampu),
  durasi_tersisa = VALUES(durasi_tersisa),
  durasi_total = VALUES(durasi_total),
  jumlah_kendaraan_terakhir = VALUES(jumlah_kendaraan_terakhir);
