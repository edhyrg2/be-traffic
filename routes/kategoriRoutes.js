const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // GET semua kategori
    router.get('/kategori', (req, res) => {
        db.query('SELECT * FROM kategori ORDER BY id DESC', (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            res.json(results);
        });
    });

    // GET kategori by ID
    router.get('/kategori/:id', (req, res) => {
        const { id } = req.params;
        db.query('SELECT * FROM kategori WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            if (results.length === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
            res.json(results[0]);
        });
    });

    // POST tambah kategori
    router.post('/kategori', (req, res) => {
        const { nama, jumlah } = req.body;
        
        if (!nama || jumlah === undefined) {
            return res.status(400).json({ message: 'Nama dan jumlah harus diisi' });
        }

        db.query('INSERT INTO kategori (nama, jumlah) VALUES (?, ?)', 
            [nama, jumlah], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            res.json({ message: 'Kategori berhasil ditambahkan', id: result.insertId });
        });
    });

    // PUT update kategori
    router.put('/kategori/:id', (req, res) => {
        const { id } = req.params;
        const { nama, jumlah } = req.body;

        if (!nama || jumlah === undefined) {
            return res.status(400).json({ message: 'Nama dan jumlah harus diisi' });
        }

        db.query('UPDATE kategori SET nama = ?, jumlah = ? WHERE id = ?',
            [nama, jumlah, id], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
            res.json({ message: 'Kategori berhasil diupdate' });
        });
    });

    // DELETE kategori
    router.delete('/kategori/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM kategori WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error' });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
            res.json({ message: 'Kategori berhasil dihapus' });
        });
    });

    return router;
};