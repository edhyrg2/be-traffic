-- Migration: Add URL column to jalur table
-- File: 009_add_url_to_jalur.sql

-- Add URL column to jalur table if not exists
ALTER TABLE jalur ADD COLUMN url VARCHAR(500) NULL;

-- Sample data untuk testing (uncomment jika diperlukan)
-- UPDATE jalur SET url = 'https://cctv.balitower.co.id/Cikoko-006-705651_2/embed.html' WHERE id = 1;
-- UPDATE jalur SET url = 'https://cctv.balitower.co.id/Location2/embed.html' WHERE id = 2;
-- UPDATE jalur SET url = 'https://cctv.balitower.co.id/Location3/embed.html' WHERE id = 3;
-- UPDATE jalur SET url = 'https://cctv.balitower.co.id/Location4/embed.html' WHERE id = 4;
