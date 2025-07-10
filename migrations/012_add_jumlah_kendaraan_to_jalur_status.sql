-- Migrasi 012: Menambahkan kolom jumlah_kendaraan_terakhir ke tabel jalur_status
ALTER TABLE jalur_status 
ADD COLUMN jumlah_kendaraan_terakhir INT DEFAULT 50 COMMENT 'Jumlah kendaraan terakhir yang terdeteksi';
