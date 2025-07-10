# NodeMCU Public API Documentation

## Overview
API endpoints khusus untuk NodeMCU yang dapat diakses secara publik tanpa autentikasi. Semua endpoint NodeMCU menggunakan prefix `/api/nodemcu/` dan memiliki CORS headers yang memungkinkan akses dari mana saja.

## Base URL
```
http://localhost:3001/api/nodemcu/
```

## Available Endpoints

### 1. Test Connection
**GET** `/api/nodemcu/test`

Endpoint untuk test koneksi dan memastikan API berfungsi.

**Response:**
```json
{
  "message": "NodeMCU API is working!",
  "server_time": "2024-01-15T10:30:00.000Z",
  "timestamp": 1705312200,
  "endpoints": [
    "GET /api/nodemcu/{1-4} - Get traffic status",
    "GET /api/nodemcu/status/all - Get all status",
    "GET /api/nodemcu/test - This test endpoint"
  ],
  "status": "ok"
}
```

### 2. Get Traffic Light Status by Jalur
**GET** `/api/nodemcu/{id_jalur}`

Mendapatkan status lampu lalu lintas untuk jalur tertentu (1-4).

**Parameters:**
- `id_jalur`: Integer (1, 2, 3, atau 4)

**Example:** `GET /api/nodemcu/1`

**Response:**
```json
{
  "jalur_id": 1,
  "nama": "Jl. Raya Utara",
  "lampu": "hijau",
  "durasi": 25,
  "total": 30,
  "kendaraan": 75,
  "timestamp": 1705312200,
  "status": "ok"
}
```

**Response Fields:**
- `jalur_id`: ID jalur (1-4)
- `nama`: Nama jalan
- `lampu`: Status lampu ("merah", "kuning", "hijau")
- `durasi`: Durasi tersisa dalam detik
- `total`: Total durasi fase saat ini
- `kendaraan`: Jumlah kendaraan terakhir yang terdeteksi
- `timestamp`: Unix timestamp
- `status`: Status response ("ok" atau "error")

### 3. Get All Traffic Status
**GET** `/api/nodemcu/status/all`

Mendapatkan status semua jalur dan informasi siklus traffic light.

**Response:**
```json
{
  "cycle": {
    "current_green_jalur": 1,
    "elapsed_seconds": 15
  },
  "jalur": [
    {
      "id_jalur": 1,
      "nama_jalan": "Jl. Raya Utara",
      "status_lampu": "hijau",
      "durasi_tersisa": 25,
      "durasi_total": 30,
      "jumlah_kendaraan_terakhir": 75
    },
    {
      "id_jalur": 2,
      "nama_jalan": "Jl. Raya Selatan",
      "status_lampu": "merah",
      "durasi_tersisa": 25,
      "durasi_total": 60,
      "jumlah_kendaraan_terakhir": 45
    }
  ],
  "timestamp": 1705312200,
  "status": "ok"
}
```

### 4. Manual Control (Testing)
**POST** `/api/nodemcu/manual/{id_jalur}`

Endpoint untuk kontrol manual lampu (untuk testing/emergency).

**Parameters:**
- `id_jalur`: Integer (1, 2, 3, atau 4)

**Request Body:**
```json
{
  "lampu": "hijau",
  "durasi": 30
}
```

**Response:**
```json
{
  "message": "Jalur 1 set to hijau for 30 seconds",
  "jalur_id": 1,
  "lampu": "hijau",
  "durasi": 30,
  "status": "ok"
}
```

## Error Responses

### Invalid Jalur ID
```json
{
  "error": "Invalid jalur ID",
  "status": "error"
}
```

### Jalur Not Found
```json
{
  "error": "Jalur tidak ditemukan",
  "status": "error"
}
```

### Server Error
```json
{
  "error": "Server error",
  "status": "error"
}
```

## CORS Configuration
Semua endpoint NodeMCU dikonfigurasi dengan:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## NodeMCU Implementation Notes

### Polling Frequency
Disarankan NodeMCU melakukan polling setiap 1-2 detik:
```cpp
// Contoh dalam loop() NodeMCU
if (millis() - lastUpdate > 1000) { // 1 detik
    getTrafficStatus();
    lastUpdate = millis();
}
```

### Error Handling
NodeMCU harus menangani error dengan menampilkan indikator (misalnya blink merah) jika:
- HTTP request gagal
- Response status bukan "ok"
- Timeout request

### Response Parsing
Contoh parsing JSON response di NodeMCU:
```cpp
DynamicJsonDocument doc(1024);
deserializeJson(doc, response);

if (doc["status"] == "ok") {
    String lampu = doc["lampu"];
    int durasi = doc["durasi"];
    // Update display
}
```

## Security Notes
- Endpoint ini PUBLIC dan tidak memerlukan autentikasi
- Hanya menyediakan READ access untuk status lampu
- Manual control endpoint ada untuk testing tapi sebaiknya disable di production
- Rate limiting mungkin diperlukan jika ada abuse

## Testing
Gunakan script test untuk memverifikasi endpoint:
```bash
node test_nodemcu_api.js
```

## Network Configuration
Pastikan NodeMCU dapat mengakses server:
- NodeMCU dan server harus dalam jaringan yang sama, atau
- Server dapat diakses dari IP public, atau
- Gunakan port forwarding jika perlu

## Troubleshooting

### NodeMCU tidak bisa akses API
1. Cek koneksi WiFi NodeMCU
2. Test ping ke server dari jaringan NodeMCU
3. Cek firewall server
4. Verifikasi URL endpoint benar

### Response format tidak sesuai
1. Cek endpoint URL (harus `/api/nodemcu/{id}`)
2. Pastikan server running
3. Cek log error di server console

### CORS Error (jika menggunakan web interface)
1. Pastikan CORS headers ada di response
2. Cek browser console untuk detail error
