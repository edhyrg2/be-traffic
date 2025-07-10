const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // POST - Cek status lampu berdasarkan id jalur dan jumlah kendaraan
    router.post('/traffic/status', (req, res) => {
        console.log('Traffic status request:', req.body);
        const { id_jalur, jumlah_kendaraan } = req.body;

        if (!id_jalur || jumlah_kendaraan === undefined) {
            console.log('Missing required fields:', { id_jalur, jumlah_kendaraan });
            return res.status(400).json({ message: 'id_jalur dan jumlah_kendaraan harus diisi' });
        }

        // Query untuk mencari kategori berdasarkan jumlah kendaraan
        let queryKategori, queryParams;

        if (jumlah_kendaraan === 0) {
            // Jika 0 kendaraan, ambil kategori dengan threshold terkecil (Normal)
            queryKategori = `
                SELECT id, nama 
                FROM kategori 
                ORDER BY jumlah ASC 
                LIMIT 1
            `;
            queryParams = [];
        } else {
            // Jika ada kendaraan, cari kategori yang sesuai
            queryKategori = `
                SELECT id, nama 
                FROM kategori 
                WHERE jumlah <= ? 
                ORDER BY jumlah DESC 
                LIMIT 1
            `;
            queryParams = [jumlah_kendaraan];
        }

        db.query(queryKategori, queryParams, (err, kategoriResults) => {
            if (err) {
                console.error('Error query kategori:', err);
                return res.status(500).json({ message: 'DB error', error: err.message });
            }

            console.log('Kategori results:', kategoriResults);
            if (kategoriResults.length === 0) {
                return res.status(404).json({ message: 'Kategori tidak ditemukan untuk jumlah kendaraan ini' });
            }

            const kategori = kategoriResults[0];

            // Query untuk mendapatkan durasi berdasarkan jalur dan kategori, termasuk URL
            const queryDurasi = `
                SELECT pd.*, j.nama_jalan, j.lokasi, j.arah, j.url, k.nama as kategori_nama
                FROM pengaturan_durasi pd
                JOIN jalur j ON pd.id_jalur = j.id
                JOIN kategori k ON pd.id_kategori = k.id
                WHERE pd.id_jalur = ? AND pd.id_kategori = ?
            `;

            db.query(queryDurasi, [id_jalur, kategori.id], (err, durasiResults) => {
                if (err) return res.status(500).json({ message: 'DB error', error: err.message });

                if (durasiResults.length === 0) {
                    return res.status(404).json({ message: 'Durasi tidak ditemukan untuk jalur dan kategori ini' });
                }

                const durasi = durasiResults[0];

                // Response dengan informasi lengkap
                res.json({
                    status: 'success',
                    data: {
                        jalur: {
                            id: durasi.id_jalur,
                            nama_jalan: durasi.nama_jalan,
                            lokasi: durasi.lokasi,
                            arah: durasi.arah,
                            url: durasi.url
                        },
                        kategori: {
                            id: kategori.id,
                            nama: kategori.nama,
                            jumlah_threshold: kategori.jumlah
                        },
                        traffic_info: {
                            jumlah_kendaraan: jumlah_kendaraan,
                            status_kemacetan: kategori.nama
                        },
                        durasi_lampu: {
                            durasi_merah: durasi.durasi_merah,
                            durasi_kuning: durasi.durasi_kuning,
                            durasi_hijau: durasi.durasi_hijau
                        }
                    }
                });
            });
        });
    });

    return router;
};