const mysql = require('mysql2/promise');

// Konfigurasi database
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', // Sesuaikan dengan password MySQL Anda
    database: 'traffic_system'
};

async function rollback() {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Terhubung ke database traffic_system');

        // Drop foreign key constraints first
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        
        // Drop tables dalam urutan terbalik
        const tables = ['custom_vehicles', 'kategori', 'jalur', 'pengaturan_durasi', 'admin'];
        
        for (const table of tables) {
            await connection.execute(`DROP TABLE IF EXISTS ${table}`);
            console.log(`✓ Tabel ${table} berhasil dihapus`);
        }
        
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Rollback berhasil!');

    } catch (error) {
        console.error('Error saat rollback:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

rollback();