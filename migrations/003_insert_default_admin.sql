-- Migrasi 003: Insert admin default
-- Password: admin123 (sudah di-hash dengan bcrypt)
INSERT IGNORE INTO admin (username, password)
VALUES ('admin', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8N7L5kB0eix4RIiPBJBD5dZTy3Nrse');