-- Migrasi 013: Membuat tabel traffic_cycle untuk sinkronisasi siklus lampu
CREATE TABLE IF NOT EXISTS traffic_cycle (
  id INT AUTO_INCREMENT PRIMARY KEY,
  current_green_jalur INT NOT NULL DEFAULT 1,
  cycle_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cycle_duration INT NOT NULL DEFAULT 120,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO traffic_cycle (id, current_green_jalur, cycle_start_time, cycle_duration) 
VALUES (1, 1, NOW(), 120)
ON DUPLICATE KEY UPDATE 
  current_green_jalur = VALUES(current_green_jalur),
  cycle_start_time = VALUES(cycle_start_time),
  cycle_duration = VALUES(cycle_duration);
