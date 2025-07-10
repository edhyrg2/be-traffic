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
const jalurStatusRoutes = require('./routes/jalurStatusRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const nodeMcuRoutes = require('./routes/nodeMcuRoutes');

// Import Traffic Light Sync Service
const TrafficLightSync = require('./services/trafficLightSync');

// Import middleware
const checkAuth = require('./middlewares/checkAuth');

// ========== PUBLIC ROUTES (No Authentication) ==========
// Auth endpoints - Public untuk login/logout
app.use('/api/auth', authRoutes(db));

// ========== PROTECTED ROUTES (Authentication Required) ==========
// Apply auth middleware untuk semua route frontend DAN NodeMCU
app.use('/api', checkAuth);
app.use('/api', durasiRoutes(db));
app.use('/api', jalurRoutes(db));
app.use('/api', jalurStatusRoutes(db));
app.use('/api', kategoriRoutes(db));
app.use('/api', trafficRoutes(db));
app.use('/api', vehicleRoutes(db));

// Initialize Traffic Light Sync
const trafficSync = new TrafficLightSync(db);
global.trafficSync = trafficSync; // Make it global for other routes

// Start traffic light synchronization after a short delay
setTimeout(async () => {
    console.log('🚦 Starting Traffic Light Synchronization...');
    await trafficSync.startSync();
}, 2000);

// Add route to check sync status
app.get('/api/sync/status', async (req, res) => {
    try {
        const status = await trafficSync.getSystemStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get sync status' });
    }
});

// Add route to restart sync
app.post('/api/sync/restart', async (req, res) => {
    try {
        await trafficSync.stopSync();
        setTimeout(async () => {
            await trafficSync.startSync();
        }, 1000);
        res.json({ message: 'Traffic sync restarted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to restart sync' });
    }
});

// Error handler global
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    if (global.trafficSync) {
        await global.trafficSync.stopSync();
    }
    process.exit(0);
});

// Server Start
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📡 NodeMCU endpoints: http://localhost:${port}/api/nodemcu/{1-4}`);
});
