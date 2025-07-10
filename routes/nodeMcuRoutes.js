const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Add CORS headers for NodeMCU endpoints (public access)
    router.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    });

    // API untuk NodeMCU membaca status lampu (PUBLIC - NO AUTH)
    router.get('/nodemcu/:id_jalur', async (req, res) => {
        try {
            const { id_jalur } = req.params;

            // Validate jalur ID
            if (!id_jalur || id_jalur < 1 || id_jalur > 4) {
                return res.status(400).json({
                    error: 'Invalid jalur ID',
                    status: 'error'
                });
            }

            // Use regular query instead of execute to avoid MySQL2 issues
            const query = `
                SELECT 
                    js.id_jalur,
                    j.nama_jalan,
                    js.status_lampu,
                    js.durasi_tersisa,
                    js.durasi_total,
                    COALESCE(js.jumlah_kendaraan_terakhir, 50) as jumlah_kendaraan_terakhir,
                    js.updated_at
                FROM jalur_status js
                JOIN jalur j ON js.id_jalur = j.id
                WHERE js.id_jalur = ?
            `;

            db.query(query, [id_jalur], (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        error: 'Database error',
                        status: 'error'
                    });
                }

                if (rows.length === 0) {
                    return res.status(404).json({
                        error: 'Jalur tidak ditemukan',
                        status: 'error'
                    });
                }

                const data = rows[0];

                // Response untuk NodeMCU (format sederhana)
                res.json({
                    jalur_id: parseInt(data.id_jalur),
                    nama: data.nama_jalan,
                    lampu: data.status_lampu,          // "merah", "kuning", "hijau"
                    durasi: parseInt(data.durasi_tersisa),  // detik tersisa
                    total: parseInt(data.durasi_total),     // total durasi fase ini
                    kendaraan: parseInt(data.jumlah_kendaraan_terakhir),
                    timestamp: Math.floor(Date.now() / 1000),
                    status: 'ok'
                });
            });

        } catch (error) {
            console.error('NodeMCU API Error:', error);
            res.status(500).json({
                error: 'Server error',
                status: 'error'
            });
        }
    });

    // API untuk NodeMCU mendapatkan status semua jalur (PUBLIC - untuk debugging)
    router.get('/nodemcu/status/all', (req, res) => {
        try {
            const query1 = `
                SELECT 
                    js.id_jalur,
                    j.nama_jalan,
                    js.status_lampu,
                    js.durasi_tersisa,
                    js.durasi_total,
                    COALESCE(js.jumlah_kendaraan_terakhir, 50) as jumlah_kendaraan_terakhir
                FROM jalur_status js
                JOIN jalur j ON js.id_jalur = j.id
                ORDER BY js.id_jalur
            `;

            db.query(query1, (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        error: 'Database error',
                        status: 'error'
                    });
                }

                const query2 = `
                    SELECT current_green_jalur, 
                           TIMESTAMPDIFF(SECOND, cycle_start_time, NOW()) as elapsed_seconds
                    FROM traffic_cycle WHERE id = 1
                `;

                db.query(query2, (err2, cycleInfo) => {
                    if (err2) {
                        console.error('Cycle query error:', err2);
                        return res.status(500).json({
                            error: 'Cycle query error',
                            status: 'error'
                        });
                    }

                    res.json({
                        cycle: cycleInfo[0] || {},
                        jalur: rows,
                        timestamp: Math.floor(Date.now() / 1000),
                        status: 'ok'
                    });
                });
            });

        } catch (error) {
            console.error('NodeMCU All Status Error:', error);
            res.status(500).json({
                error: 'Server error',
                status: 'error'
            });
        }
    });

    // API untuk manual control (emergency/testing)
    router.post('/nodemcu/manual/:id_jalur', async (req, res) => {
        try {
            const { id_jalur } = req.params;
            const { lampu, durasi } = req.body;

            // Validate input
            if (!['merah', 'kuning', 'hijau'].includes(lampu)) {
                return res.status(400).json({ error: 'Invalid lampu status' });
            }

            if (!durasi || durasi < 1 || durasi > 300) {
                return res.status(400).json({ error: 'Invalid durasi (1-300 seconds)' });
            }

            // Stop automatic sync temporarily (optional)
            if (global.trafficSync) {
                console.log('⚠️  Manual control activated for Jalur ' + id_jalur);
            }

            // Update jalur status manually
            await db.execute(`
                UPDATE jalur_status 
                SET status_lampu = ?, durasi_tersisa = ?, durasi_total = ?, updated_at = NOW()
                WHERE id_jalur = ?
            `, [lampu, durasi, durasi, id_jalur]);

            res.json({
                message: `Jalur ${id_jalur} set to ${lampu} for ${durasi} seconds`,
                jalur_id: parseInt(id_jalur),
                lampu: lampu,
                durasi: parseInt(durasi),
                status: 'ok'
            });

        } catch (error) {
            console.error('Manual Control Error:', error);
            res.status(500).json({
                error: 'Server error',
                status: 'error'
            });
        }
    });

    // Simple test endpoint (PUBLIC - NO AUTH)
    router.get('/nodemcu/test', (req, res) => {
        res.json({
            message: 'NodeMCU API is working!',
            server_time: new Date().toISOString(),
            timestamp: Math.floor(Date.now() / 1000),
            endpoints: [
                'GET /api/nodemcu/{1-4} - Get traffic status',
                'GET /api/nodemcu/status/all - Get all status',
                'GET /api/nodemcu/test - This test endpoint'
            ],
            status: 'ok'
        });
    });

    // PUBLIC endpoint untuk dashboard frontend (public monitoring)
    router.get('/public/status', (req, res) => {
        try {
            const query = `
                SELECT 
                    js.id_jalur,
                    j.nama_jalan,
                    js.status_lampu,
                    js.durasi_tersisa,
                    js.durasi_total,
                    COALESCE(js.jumlah_kendaraan_terakhir, 50) as jumlah_kendaraan_terakhir,
                    js.updated_at
                FROM jalur_status js
                JOIN jalur j ON js.id_jalur = j.id
                ORDER BY js.id_jalur
            `;

            db.query(query, (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        error: 'Database error',
                        status: 'error'
                    });
                }

                res.json({
                    jalur: results,
                    timestamp: Math.floor(Date.now() / 1000),
                    status: 'ok'
                });
            });

        } catch (error) {
            console.error('Public Status Error:', error);
            res.status(500).json({
                error: 'Server error',
                status: 'error'
            });
        }
    });

    // PUBLIC endpoint untuk update traffic density dari AI/external
    router.post('/public/update-density', (req, res) => {
        try {
            const { id_jalur, jumlah_kendaraan } = req.body;

            // Validasi input
            if (!id_jalur || id_jalur < 1 || id_jalur > 4) {
                return res.status(400).json({
                    error: 'Invalid jalur ID (1-4)',
                    status: 'error'
                });
            }

            if (jumlah_kendaraan === undefined || jumlah_kendaraan === null || isNaN(jumlah_kendaraan)) {
                return res.status(400).json({
                    error: 'Invalid jumlah_kendaraan',
                    status: 'error'
                });
            }

            const idJalur = parseInt(id_jalur);
            const jumlahKendaraan = parseInt(jumlah_kendaraan);

            // Update jumlah kendaraan terakhir di jalur_status
            const updateQuery = `
                UPDATE jalur_status 
                SET jumlah_kendaraan_terakhir = ?
                WHERE id_jalur = ?
            `;

            db.query(updateQuery, [jumlahKendaraan, idJalur], (err, result) => {
                if (err) {
                    console.error('Error updating traffic density:', err);
                    return res.status(500).json({
                        error: 'Database error',
                        status: 'error'
                    });
                }

                // Trigger re-sync jika ada traffic sync service
                if (global.trafficSync) {
                    global.trafficSync.updateTrafficDensity(idJalur, jumlahKendaraan);
                }

                res.json({
                    message: `Traffic density updated for Jalur ${idJalur}`,
                    jalur_id: idJalur,
                    jumlah_kendaraan: jumlahKendaraan,
                    status: 'ok'
                });
            });

        } catch (error) {
            console.error('Update Density Error:', error);
            res.status(500).json({
                error: 'Server error',
                status: 'error'
            });
        }
    });

    return router;
};
