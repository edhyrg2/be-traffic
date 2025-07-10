# Traffic Light NodeMCU System

## 🚦 Sistem Traffic Light Otomatis dengan NodeMCU

Sistem ini menggunakan 4 NodeMCU yang tersinkronisasi untuk mengontrol lampu traffic light berdasarkan tingkat kemacetan yang terdeteksi oleh AI.

## 📋 Komponen Sistem

### Backend:
- ✅ **TrafficLightSync Service** - Sinkronisasi otomatis semua jalur
- ✅ **NodeMCU API Routes** - Endpoint khusus untuk NodeMCU
- ✅ **Database Schema** - Tabel tracking traffic cycle
- ✅ **Jalur Status API** - Update traffic density

### Hardware:
- ✅ **4x NodeMCU ESP8266** - Satu untuk setiap jalur
- ✅ **12x LED** - 3 LED (merah, kuning, hijau) per NodeMCU
- ✅ **Arduino Code** - Polling API setiap detik

## 🔧 Setup Instructions

### 1. Database Setup
```sql
-- Jalankan file tra.sql untuk setup database
-- File sudah include tabel traffic_cycle dan jalur_status update
```

### 2. Backend Setup
```bash
cd d:\Programs\backup\be-traffic
npm install
npm start
```

### 3. NodeMCU Setup
```cpp
// Upload arduino/traffic_light_nodemcu.ino ke setiap NodeMCU
// Ubah konstanta JALUR_ID untuk setiap NodeMCU:
const int JALUR_ID = 1; // NodeMCU 1 -> Jalur 1
const int JALUR_ID = 2; // NodeMCU 2 -> Jalur 2  
const int JALUR_ID = 3; // NodeMCU 3 -> Jalur 3
const int JALUR_ID = 4; // NodeMCU 4 -> Jalur 4

// Update WiFi credentials:
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Update server IP:
const char* serverURL = "http://192.168.1.100:3001";
```

### 4. Wiring NodeMCU
```
NodeMCU Pin -> LED
D1          -> LED Merah
D2          -> LED Kuning  
D3          -> LED Hijau
GND         -> GND (semua LED)
```

## 📡 API Endpoints

### Untuk NodeMCU:
```bash
# Status jalur spesifik (untuk NodeMCU)
GET /api/nodemcu/1
GET /api/nodemcu/2  
GET /api/nodemcu/3
GET /api/nodemcu/4

# Status semua jalur (untuk debugging)
GET /api/nodemcu/status/all

# Manual control (emergency)
POST /api/nodemcu/manual/1
{
    "lampu": "merah",    // "merah", "kuning", "hijau"
    "durasi": 30         // 1-300 seconds
}
```

### Untuk Frontend:
```bash
# Update traffic density (dari AI detection)
POST /api/jalur-status
{
    "id_jalur": 1,
    "jumlah_kendaraan": 75
}

# Get status semua jalur
GET /api/jalur-status

# Cek status sinkronisasi
GET /api/sync/status

# Restart sinkronisasi
POST /api/sync/restart
```

## 🔄 Cara Kerja Sinkronisasi

### Timeline Otomatis:
```
Fase 1: Jalur 1 HIJAU (40s) -> KUNING (5s) | Jalur 2,3,4 MERAH
Fase 2: Jalur 2 HIJAU (45s) -> KUNING (5s) | Jalur 1,3,4 MERAH  
Fase 3: Jalur 3 HIJAU (35s) -> KUNING (5s) | Jalur 1,2,4 MERAH
Fase 4: Jalur 4 HIJAU (42s) -> KUNING (5s) | Jalur 1,2,3 MERAH
... loop kembali ke Fase 1
```

### Adaptive Duration:
- **Sepi** (0-49 kendaraan): Durasi pendek
- **Normal** (50-99 kendaraan): Durasi standard  
- **Ramai** (100-199 kendaraan): Durasi diperpanjang
- **Macet** (200+ kendaraan): Durasi maksimal

## 🧪 Testing

### 1. Test NodeMCU Connection:
```bash
curl http://localhost:3001/api/nodemcu/1
```

### 2. Test Traffic Update:
```bash
curl -X POST http://localhost:3001/api/jalur-status \
  -H "Content-Type: application/json" \
  -d '{"id_jalur": 1, "jumlah_kendaraan": 120}'
```

### 3. Test Manual Control:
```bash
curl -X POST http://localhost:3001/api/nodemcu/manual/1 \
  -H "Content-Type: application/json" \
  -d '{"lampu": "hijau", "durasi": 60}'
```

### 4. Monitor System:
```bash
curl http://localhost:3001/api/sync/status
curl http://localhost:3001/api/nodemcu/status/all
```

## 🐛 Troubleshooting

### NodeMCU tidak connect:
1. Cek WiFi credentials
2. Cek server IP address
3. Cek serial monitor untuk debug info

### Sinkronisasi bermasalah:
1. Restart sync: `POST /api/sync/restart`
2. Cek database traffic_cycle table
3. Restart server

### LED tidak menyala:
1. Cek wiring (D1=Merah, D2=Kuning, D3=Hijau)
2. Cek power supply NodeMCU
3. Test manual control API

## 📊 Monitoring

### Server Logs:
```
🚦 Traffic Light Sync Started
🟢 System initialized: Jalur 1 GREEN, others RED
🔄 Switching to Jalur 2
📊 Jalur 1: 75 kendaraan
```

### NodeMCU Serial Monitor:
```
📡 Jalur 1 | 🟢 HIJAU | Sisa: 35s/40s | Kendaraan: 75
📡 Jalur 1 | 🟡 KUNING | Sisa: 4s/5s | Kendaraan: 75
📡 Jalur 1 | 🔴 MERAH | Sisa: 45s/45s | Kendaraan: 75
```

## 🚀 Production Notes

1. **Reliability**: NodeMCU auto-reconnect WiFi
2. **Failsafe**: Default RED blinking jika no connection
3. **Performance**: 1 second polling interval
4. **Scalability**: Easy to add more jalur
5. **Maintenance**: Manual control untuk emergency

---

**Status: ✅ READY TO DEPLOY**
