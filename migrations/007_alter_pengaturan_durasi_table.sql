-- Migrasi 007: Alter tabel pengaturan_durasi untuk menambah id_jalur dan id_kategori
ALTER TABLE pengaturan_durasi DROP COLUMN kategori;

ALTER TABLE pengaturan_durasi 
ADD COLUMN id_jalur INT NOT NULL DEFAULT 1,
ADD COLUMN id_kategori INT NOT NULL DEFAULT 1;