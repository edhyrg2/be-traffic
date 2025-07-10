const mysql = require('mysql2');

async function setupDurationData() {
    const db = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'traffic_system'
    });

    try {
        // Check kategori data
        const kategoriRows = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM kategori ORDER BY jumlah', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log('📋 Current kategori data:');
        console.table(kategoriRows);

        if (kategoriRows.length === 0) {
            console.log('❌ No kategori data found. Inserting default data...');

            await new Promise((resolve, reject) => {
                db.query(`
                    INSERT INTO kategori (nama, jumlah) VALUES 
                    ('Normal', 30),
                    ('Macet', 60),
                    ('Sangat Macet', 100)
                `, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            console.log('✅ Kategori data inserted');
        }

        // Check pengaturan_durasi data
        const durasiRows = await new Promise((resolve, reject) => {
            db.query(`
                SELECT pd.*, k.nama as kategori_nama, k.jumlah as kategori_jumlah 
                FROM pengaturan_durasi pd 
                JOIN kategori k ON pd.id_kategori = k.id 
                ORDER BY pd.id_jalur, k.jumlah
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log('\n📋 Current pengaturan_durasi data:');
        console.table(durasiRows);

        if (durasiRows.length === 0) {
            console.log('❌ No pengaturan_durasi data found. Inserting default data...');

            // Get kategori IDs
            const kategoriData = await new Promise((resolve, reject) => {
                db.query('SELECT id, nama, jumlah FROM kategori ORDER BY jumlah', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            // Insert duration data for all jalur and kategori
            for (let jalur = 1; jalur <= 4; jalur++) {
                for (const kategori of kategoriData) {
                    let durations;

                    if (kategori.jumlah <= 30) { // Normal
                        durations = { hijau: 30, kuning: 5, merah: 35 };
                    } else if (kategori.jumlah <= 60) { // Macet
                        durations = { hijau: 45, kuning: 5, merah: 50 };
                    } else { // Sangat Macet
                        durations = { hijau: 60, kuning: 5, merah: 65 };
                    }

                    await new Promise((resolve, reject) => {
                        db.query(`
                            INSERT INTO pengaturan_durasi (id_jalur, id_kategori, durasi_hijau, durasi_kuning, durasi_merah)
                            VALUES (?, ?, ?, ?, ?)
                        `, [jalur, kategori.id, durations.hijau, durations.kuning, durations.merah], (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });
                }
            }

            console.log('✅ Pengaturan durasi data inserted');
        }

        // Test query that trafficLightSync uses
        console.log('\n🧪 Testing duration query for jalur 1:');
        const testRows = await new Promise((resolve, reject) => {
            db.query(`
                SELECT pd.durasi_hijau, pd.durasi_kuning, pd.durasi_merah, k.nama, k.jumlah, js.jumlah_kendaraan_terakhir
                FROM pengaturan_durasi pd
                JOIN jalur_status js ON pd.id_jalur = js.id_jalur
                JOIN kategori k ON pd.id_kategori = k.id
                WHERE pd.id_jalur = 1 
                AND k.jumlah <= COALESCE(js.jumlah_kendaraan_terakhir, 50)
                ORDER BY k.jumlah DESC LIMIT 1
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.table(testRows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        db.end();
    }
}

setupDurationData();
