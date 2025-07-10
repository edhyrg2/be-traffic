const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // GET status semua jalur dengan informasi durasi
    router.get('/jalur-status', (req, res) => {
        const query = `
            SELECT 
                j.id as id_jalur,
                j.nama_jalan as nama_jalur,
                k.nama as kategori,
                pd.durasi_merah,
                pd.durasi_kuning,
                pd.durasi_hijau,
                js.status_lampu,
                js.durasi_tersisa,
                js.durasi_total
            FROM jalur j
            LEFT JOIN jalur_status js ON j.id = js.id_jalur
            LEFT JOIN pengaturan_durasi pd ON j.id = pd.id_jalur
            LEFT JOIN kategori k ON pd.id_kategori = k.id
            WHERE pd.id_kategori = COALESCE(
                (SELECT id FROM kategori WHERE jumlah <= COALESCE(js.durasi_total, 50) ORDER BY jumlah DESC LIMIT 1),
                2
            )
            ORDER BY j.id
        `;
        db.query(query, (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error', error: err.message });
            res.json(results);
        });
    });

    // GET status jalur by ID dengan informasi durasi
    router.get('/jalur-status/:id_jalur', (req, res) => {
        const { id_jalur } = req.params;
        const query = `
            SELECT 
                j.id as id_jalur,
                j.nama_jalan as nama_jalur,
                k.nama as kategori,
                pd.durasi_merah,
                pd.durasi_kuning,
                pd.durasi_hijau,
                js.status_lampu,
                js.durasi_tersisa,
                js.durasi_total
            FROM jalur j
            LEFT JOIN jalur_status js ON j.id = js.id_jalur
            LEFT JOIN pengaturan_durasi pd ON j.id = pd.id_jalur
            LEFT JOIN kategori k ON pd.id_kategori = k.id
            WHERE j.id = ? AND pd.id_kategori = COALESCE(
                (SELECT id FROM kategori WHERE jumlah <= COALESCE(js.durasi_total, 50) ORDER BY jumlah DESC LIMIT 1),
                2
            )
        `;
        db.query(query, [id_jalur], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error', error: err.message });
            if (results.length === 0) return res.status(404).json({ message: 'Status jalur tidak ditemukan' });
            res.json(results[0]);
        });
    });

    // POST update status jalur berdasarkan jumlah kendaraan (PROTECTED - NEED AUTH)
    router.post('/jalur-status', (req, res) => {
        console.log('Request body:', req.body); // Debug log
        const { id_jalur, jumlah_kendaraan } = req.body;

        // Validasi yang lebih robust
        if (!id_jalur) {
            return res.status(400).json({ message: 'id_jalur harus diisi' });
        }

        if (jumlah_kendaraan === undefined || jumlah_kendaraan === null) {
            return res.status(400).json({ message: 'jumlah_kendaraan harus diisi' });
        }

        // Konversi ke number jika perlu
        const idJalur = parseInt(id_jalur);
        const jumlahKendaraan = parseInt(jumlah_kendaraan);

        if (isNaN(idJalur) || isNaN(jumlahKendaraan)) {
            return res.status(400).json({ message: 'id_jalur dan jumlah_kendaraan harus berupa angka valid' });
        }

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
                    message: 'Database error',
                    error: err.message
                });
            }

            // Trigger re-sync jika ada traffic sync service
            if (global.trafficSync) {
                global.trafficSync.updateTrafficDensity(idJalur, jumlahKendaraan);
            }

            res.json({
                message: `Traffic density updated for Jalur ${idJalur}`,
                jalur_id: idJalur,
                jumlah_kendaraan: jumlahKendaraan
            });
        });
    });

    return router;
};