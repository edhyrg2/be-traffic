const express = require('express');
const mqtt = require('mqtt');

module.exports = (db) => {
    const router = express.Router();

    // Auth middleware sudah diterapkan secara global di server.js

    // Setup MQTT Client untuk publish durasi
    const mqttClient = mqtt.connect('mqtt://localhost:1883'); // Pastikan broker MQTT berjalan di localhost

    mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
    });

    // GET all durasi dengan join
    router.get('/durasi', (req, res) => {
        const query = `
            SELECT pd.*, j.nama_jalan, j.lokasi, j.arah, k.nama as kategori_nama
            FROM pengaturan_durasi pd
            LEFT JOIN jalur j ON pd.id_jalur = j.id
            LEFT JOIN kategori k ON pd.id_kategori = k.id
            ORDER BY pd.id DESC
        `;
        db.query(query, (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            res.json(results);
        });
    });

    // GET durasi berdasarkan jalur dan kategori
    router.get('/durasi/jalur/:id_jalur/kategori/:id_kategori', (req, res) => {
        const { id_jalur, id_kategori } = req.params;

        const query = `
            SELECT pd.*, j.nama_jalan, j.lokasi, j.arah, k.nama as kategori_nama
            FROM pengaturan_durasi pd
            LEFT JOIN jalur j ON pd.id_jalur = j.id
            LEFT JOIN kategori k ON pd.id_kategori = k.id
            WHERE pd.id_jalur = ? AND pd.id_kategori = ?
        `;
        db.query(query, [id_jalur, id_kategori], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            if (results.length === 0) return res.status(404).json({ message: 'Durasi tidak ditemukan' });
            res.json(results[0]);
        });
    });

    // POST durasi
    router.post('/durasi', (req, res) => {
        const { id_jalur, id_kategori, durasi_merah, durasi_kuning, durasi_hijau } = req.body;

        if (!id_jalur || !id_kategori || !durasi_merah || !durasi_kuning || !durasi_hijau) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        db.query('INSERT INTO pengaturan_durasi (id_jalur, id_kategori, durasi_merah, durasi_kuning, durasi_hijau) VALUES (?, ?, ?, ?, ?)',
            [id_jalur, id_kategori, durasi_merah, durasi_kuning, durasi_hijau],
            (err, result) => {
                if (err) {
                    console.error('Insert error:', err);
                    return res.status(500).json({ message: 'Insert error', error: err.message });
                }
                res.json({ message: 'Durasi ditambahkan', id: result.insertId });
            });
    });

    // PUT durasi
    router.put('/durasi/:id', (req, res) => {
        const { id } = req.params;
        const { id_jalur, id_kategori, durasi_merah, durasi_kuning, durasi_hijau } = req.body;

        if (!id_jalur || !id_kategori || !durasi_merah || !durasi_kuning || !durasi_hijau) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        db.query('UPDATE pengaturan_durasi SET id_jalur=?, id_kategori=?, durasi_merah=?, durasi_kuning=?, durasi_hijau=? WHERE id=?',
            [id_jalur, id_kategori, durasi_merah, durasi_kuning, durasi_hijau, id],
            (err, result) => {
                if (err) return res.status(500).json({ message: 'Update error' });
                if (result.affectedRows === 0) return res.status(404).json({ message: 'Durasi tidak ditemukan' });
                res.json({ message: 'Durasi diperbarui' });
            });
    });

    // DELETE durasi
    router.delete('/durasi/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM pengaturan_durasi WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ message: 'Delete error' });
            res.json({ message: 'Durasi dihapus' });
        });
    });

    // Endpoint untuk mengirimkan durasi ke NodeMCU berdasarkan kategori kemacetan
    router.post('/sendDurasiToNode/:jalur', (req, res) => {
        const { jalur } = req.params;
        const { kemacetan } = req.body; // kemacetan: Normal, Macet, Sangat Macet

        // Ambil durasi berdasarkan jalur dan kategori kemacetan
        db.query('SELECT pd.durasi_merah, pd.durasi_kuning, pd.durasi_hijau FROM pengaturan_durasi pd JOIN kategori k ON pd.id_kategori = k.id WHERE pd.id_jalur = ? AND k.nama = ?', [jalur, kemacetan], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            if (results.length === 0) return res.status(404).json({ message: 'Durasi untuk kategori kemacetan ini tidak ditemukan' });

            // Durasi yang ditemukan
            const durasi = results[0];

            // Kirim durasi ke NodeMCU melalui MQTT
            const topic = `/lampu/${jalur}/durasi`;
            mqttClient.publish(topic, JSON.stringify(durasi), () => {
                console.log(`Sent duration data to /lampu/${jalur}/durasi: ${JSON.stringify(durasi)}`);
            });

            res.json({ message: 'Durasi berhasil dikirimkan ke NodeMCU' });
        });
    });

    return router;
};
