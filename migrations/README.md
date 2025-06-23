# Database Migrations

## Cara Menjalankan Migrasi

1. Pastikan MySQL sudah berjalan
2. Sesuaikan konfigurasi database di file `migrate.js` (host, user, password)
3. Jalankan migrasi:
   ```bash
   node migrations/migrate.js
   ```

## Cara Rollback

Untuk menghapus semua tabel:
```bash
node migrations/rollback.js
```

## Daftar Migrasi

- `001_create_admin_table.sql` - Membuat tabel admin
- `002_create_pengaturan_durasi_table.sql` - Membuat tabel pengaturan_durasi  
- `003_insert_default_admin.sql` - Insert admin default (username: admin, password: admin123)

## Catatan

- Password admin default sudah di-hash menggunakan bcrypt
- Setiap tabel memiliki kolom `created_at` dan `updated_at` untuk tracking