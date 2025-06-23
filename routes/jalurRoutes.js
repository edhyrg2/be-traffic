const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // GET semua jalur
    router.get('/jalur', (req, res) => {
        db.query('SELECT * FROM jalur ORDER BY id DESC', (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            res.json(results);
        });
    });

    // GET jalur by ID
    router.get('/jalur/:id', (req, res) => {
        const { id } = req.params;
        db.query('SELECT * FROM jalur WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            if (results.length === 0) return res.status(404).json({ message: 'Jalur tidak ditemukan' });
            res.json(results[0]);
        });
    });

    // POST tambah jalur
    router.post('/jalur', (req, res) => {
        const { nama_jalan, lokasi, arah } = req.body;
        
        if (!nama_jalan || !lokasi || !arah) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        db.query('INSERT INTO jalur (nama_jalan, lokasi, arah) VALUES (?, ?, ?)', 
            [nama_jalan, lokasi, arah], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            res.json({ message: 'Jalur berhasil ditambahkan', id: result.insertId });
        });
    });

    // PUT update jalur
    router.put('/jalur/:id', (req, res) => {
        const { id } = req.params;
        const { nama_jalan, lokasi, arah } = req.body;

        if (!nama_jalan || !lokasi || !arah) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        db.query('UPDATE jalur SET nama_jalan = ?, lokasi = ?, arah = ? WHERE id = ?',
            [nama_jalan, lokasi, arah, id], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Jalur tidak ditemukan' });
            res.json({ message: 'Jalur berhasil diupdate' });
        });
    });

    // DELETE jalur
    router.delete('/jalur/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM jalur WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Jalur tidak ditemukan' });
            res.json({ message: 'Jalur berhasil dihapus' });
        });
    });

    return router;
};