-- Migrasi 009: Membuat tabel custom_vehicles
CREATE TABLE IF NOT EXISTS custom_vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  image_data LONGTEXT,
  bbox_x INT,
  bbox_y INT, 
  bbox_width INT,
  bbox_height INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);