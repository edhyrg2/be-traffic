const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const mysql = require('mysql2');
const mqtt = require('mqtt');
const path = require('path');

const app = express();
const port = 3001;

// Middleware Setup
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// MQTT Client Setup
const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'traffic_system'
});

db.connect(err => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL database');
    }
});

// Function: Get Durasi by Kategori
const getDurasiByKategori = (kategori) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT durasi_merah, durasi_kuning, durasi_hijau
            FROM pengaturan_durasi
            WHERE kategori = ?
        `;

        db.query(query, [kategori], (err, results) => {
            if (err) return reject(err);
            if (results.length === 0) return reject(new Error('Durasi tidak ditemukan untuk kategori ini'));
            resolve(results[0]);
        });
    });
};

// MQTT Subscriber: Listen to Kemacetan
mqttClient.subscribe('/kemacetan/+');

mqttClient.on('message', (topic, message) => {
    if (!topic.startsWith('/kemacetan/')) return;

    try {
        const data = JSON.parse(message.toString());
        const kemacetan = data.kemacetan;
        const jalurId = topic.split('/')[2];

        getDurasiByKategori(kemacetan)
            .then(durasi => {
                const topicDurasi = `/lampu/${jalurId}/durasi`;
                mqttClient.publish(topicDurasi, JSON.stringify(durasi), () => {
                    console.log(`✅ Sent duration to ${topicDurasi}:`, durasi);
                });
            })
            .catch(err => {
                console.error('⚠️ Error getting duration:', err.message);
            });

    } catch (err) {
        console.error('❌ Invalid MQTT message format:', err.message);
    }
});

// Route Import & Usage
const authRoutes = require('./routes/authRoutes');
const durasiRoutes = require('./routes/durasiRoutes');
const jalurRoutes = require('./routes/jalurRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');

app.use('/api', authRoutes(db));
app.use('/api', durasiRoutes(db));
app.use('/api', jalurRoutes(db));
app.use('/api', kategoriRoutes(db));
app.use('/api', trafficRoutes(db));
app.use('/api', vehicleRoutes(db));

// Error handler global agar semua error mengirim header CORS yang benar
app.use((err, req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Server Start
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
