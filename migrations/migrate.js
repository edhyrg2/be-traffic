const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// Konfigurasi database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Sesuaikan dengan password MySQL Anda
    multipleStatements: true
};

async function runMigrations() {
    let connection;
    
    try {
        // Koneksi ke MySQL
        connection = await mysql.createConnection(dbConfig);
        console.log('Terhubung ke MySQL');

        // Buat database jika belum ada
        await connection.query('CREATE DATABASE IF NOT EXISTS traffic_system');
        console.log('Database traffic_system dibuat/sudah ada');

        // Tutup koneksi dan buat koneksi baru ke database
        await connection.end();
        
        // Koneksi ke database traffic_system
        connection = await mysql.createConnection({
            ...dbConfig,
            database: 'traffic_system'
        });

        // Jalankan migrasi berurutan
        const migrations = [
            '001_create_admin_table.sql',
            '002_create_pengaturan_durasi_table.sql',
            '003_insert_default_admin.sql',
            '004_insert_admin_edi.sql',
            '005_create_jalur_table.sql',
            '006_create_kategori_table.sql',
            '009_create_custom_vehicles_table.sql',
            '010_add_url_to_jalur_table.sql',
            '011_create_jalur_status_table.sql'
        ];

        for (const migration of migrations) {
            const migrationPath = path.join(__dirname, migration);
            const sql = await fs.readFile(migrationPath, 'utf8');
            
            await connection.query(sql);
            console.log(`✓ Migrasi ${migration} berhasil dijalankan`);
        }

        console.log('Semua migrasi berhasil dijalankan!');

    } catch (error) {
        console.error('Error saat menjalankan migrasi:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Jalankan migrasi
runMigrations();