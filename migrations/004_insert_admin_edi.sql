-- Migrasi 004: Insert admin edi
-- Username: edi, Password: edi (sudah di-hash dengan bcrypt)
INSERT IGNORE INTO admin (username, password)
VALUES ('edi', '$2b$10$KyyNYu2Rw838hXw7NBqWFeZO53hVSbMQH4v1pvqCpl7OiKI/ZNyWO');