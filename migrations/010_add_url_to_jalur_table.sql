-- Migrasi 010: Menambahkan field URL ke tabel jalur
ALTER TABLE jalur ADD COLUMN url VARCHAR(255) NULL AFTER arah;