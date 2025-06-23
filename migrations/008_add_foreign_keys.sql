-- Migrasi 008: Menambah foreign key constraints
-- Cek dan tambah constraint jika belum ada
SET @constraint_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'traffic_system' 
    AND TABLE_NAME = 'pengaturan_durasi' 
    AND CONSTRAINT_NAME = 'fk_durasi_jalur');

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE pengaturan_durasi ADD CONSTRAINT fk_durasi_jalur FOREIGN KEY (id_jalur) REFERENCES jalur(id) ON DELETE CASCADE', 
    'SELECT "Constraint fk_durasi_jalur already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_exists2 = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'traffic_system' 
    AND TABLE_NAME = 'pengaturan_durasi' 
    AND CONSTRAINT_NAME = 'fk_durasi_kategori');

SET @sql2 = IF(@constraint_exists2 = 0, 
    'ALTER TABLE pengaturan_durasi ADD CONSTRAINT fk_durasi_kategori FOREIGN KEY (id_kategori) REFERENCES kategori(id) ON DELETE CASCADE', 
    'SELECT "Constraint fk_durasi_kategori already exists" as message');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;