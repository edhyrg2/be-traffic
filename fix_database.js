const mysql = require('mysql2/promise');

async function checkAndFixDatabase() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'traffic_system'
    });

    try {
        // Check if column exists
        const [columns] = await db.execute(
            "SHOW COLUMNS FROM jalur_status LIKE 'jumlah_kendaraan_terakhir'"
        );

        if (columns.length === 0) {
            console.log('❌ Column jumlah_kendaraan_terakhir not found. Adding...');

            // Add the column
            await db.execute(`
                ALTER TABLE jalur_status 
                ADD COLUMN jumlah_kendaraan_terakhir INT DEFAULT 50 
                COMMENT 'Jumlah kendaraan terakhir yang terdeteksi'
            `);

            console.log('✅ Column jumlah_kendaraan_terakhir added successfully');
        } else {
            console.log('✅ Column jumlah_kendaraan_terakhir already exists');
        }

        // Check traffic_cycle table
        const [tables] = await db.execute(
            "SHOW TABLES LIKE 'traffic_cycle'"
        );

        if (tables.length === 0) {
            console.log('❌ Table traffic_cycle not found. Creating...');

            await db.execute(`
                CREATE TABLE traffic_cycle (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  current_green_jalur INT NOT NULL DEFAULT 1,
                  cycle_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  cycle_duration INT NOT NULL DEFAULT 120,
                  is_active BOOLEAN DEFAULT TRUE,
                  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            await db.execute(`
                INSERT INTO traffic_cycle (id, current_green_jalur, cycle_start_time, cycle_duration) 
                VALUES (1, 1, NOW(), 120)
            `);

            console.log('✅ Table traffic_cycle created successfully');
        } else {
            console.log('✅ Table traffic_cycle already exists');
        }

        // Check and ensure jalur_status has data
        const [jalurStatus] = await db.execute('SELECT COUNT(*) as count FROM jalur_status');
        if (jalurStatus[0].count === 0) {
            console.log('❌ No data in jalur_status. Inserting initial data...');

            await db.execute(`
                INSERT INTO jalur_status (id_jalur, status_lampu, durasi_tersisa, durasi_total, jumlah_kendaraan_terakhir) 
                VALUES 
                  (1, 'hijau', 30, 30, 50),
                  (2, 'merah', 90, 90, 45),
                  (3, 'merah', 60, 60, 55),
                  (4, 'merah', 30, 30, 40)
            `);

            console.log('✅ Initial jalur_status data inserted');
        } else {
            console.log('✅ jalur_status has data');
        }

        // Show current structure
        console.log('\n📋 Current jalur_status structure:');
        const [structure] = await db.execute('DESCRIBE jalur_status');
        console.table(structure);

        console.log('\n📋 Current jalur_status data:');
        const [data] = await db.execute('SELECT * FROM jalur_status');
        console.table(data);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.end();
    }
}

checkAndFixDatabase();
