const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // GET semua custom vehicles
    router.get('/vehicles', (req, res) => {
        db.query('SELECT * FROM custom_vehicles ORDER BY id DESC', (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error', error: err.message });
            res.json(results);
        });
    });

    // GET vehicle by ID
    router.get('/vehicles/:id', (req, res) => {
        const { id } = req.params;
        db.query('SELECT * FROM custom_vehicles WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error', error: err.message });
            if (results.length === 0) return res.status(404).json({ message: 'Vehicle tidak ditemukan' });
            res.json(results[0]);
        });
    });

    // POST tambah vehicle
    router.post('/vehicles', (req, res) => {
        const { type, image_data, bbox_x, bbox_y, bbox_width, bbox_height } = req.body;
        
        if (!type) {
            return res.status(400).json({ message: 'Type harus diisi' });
        }

        db.query('INSERT INTO custom_vehicles (type, image_data, bbox_x, bbox_y, bbox_width, bbox_height) VALUES (?, ?, ?, ?, ?, ?)', 
            [type, image_data, bbox_x, bbox_y, bbox_width, bbox_height], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error', error: err.message });
            res.json({ message: 'Vehicle berhasil ditambahkan', id: result.insertId });
        });
    });

    // PUT update vehicle
    router.put('/vehicles/:id', (req, res) => {
        const { id } = req.params;
        const { type, image_data, bbox_x, bbox_y, bbox_width, bbox_height } = req.body;

        if (!type) {
            return res.status(400).json({ message: 'Type harus diisi' });
        }

        db.query('UPDATE custom_vehicles SET type = ?, image_data = ?, bbox_x = ?, bbox_y = ?, bbox_width = ?, bbox_height = ? WHERE id = ?',
            [type, image_data, bbox_x, bbox_y, bbox_width, bbox_height, id], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error', error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Vehicle tidak ditemukan' });
            res.json({ message: 'Vehicle berhasil diupdate' });
        });
    });

    // DELETE vehicle
    router.delete('/vehicles/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM custom_vehicles WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ message: 'DB error', error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Vehicle tidak ditemukan' });
            res.json({ message: 'Vehicle berhasil dihapus' });
        });
    });

    // GET vehicles by type
    router.get('/vehicles/type/:type', (req, res) => {
        const { type } = req.params;
        db.query('SELECT * FROM custom_vehicles WHERE type = ? ORDER BY id DESC', [type], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error', error: err.message });
            res.json(results);
        });
    });

    return router;
};