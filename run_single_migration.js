const mysql = require('mysql2/promise');
const fs = require('fs').promises;

async function runSingleMigration() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'traffic_system'
        });

        const sql = await fs.readFile('./migrations/011_create_jalur_status_table.sql', 'utf8');
        await connection.query(sql);
        console.log('✓ Tabel jalur_status berhasil dibuat');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

runSingleMigration();