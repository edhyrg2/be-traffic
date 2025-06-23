// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');

module.exports = (db) => {
    const router = express.Router();

    // Login endpoint
    router.post('/login', (req, res) => {
        const { username, password } = req.body;

        // Mencari user berdasarkan username
        db.query('SELECT * FROM admin WHERE username = ?', [username], (err, results) => {
            if (err) return res.status(500).json({ message: 'DB error' });

            if (results.length === 0) {
                return res.status(400).json({ message: 'Username atau password salah' });
            }

            const user = results[0];

            // Verifikasi password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) return res.status(500).json({ message: 'Error saat verifikasi password' });

                if (!isMatch) {
                    return res.status(400).json({ message: 'Username atau password salah' });
                }

                // Set session setelah login berhasil
                req.session.userId = user.id;
                req.session.username = user.username;

                res.json({ message: 'Login berhasil' });
            });
        });
    });

    // Logout endpoint
    router.post('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ message: 'Logout error' });
            res.json({ message: 'Logout berhasil' });
        });
    });

    return router;
};
