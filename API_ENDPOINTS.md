# API Endpoints untuk Traffic Light System

## 🔓 PUBLIC ENDPOINTS (Tidak memerlukan autentikasi)

### NodeMCU Device API
```
GET  /api/nodemcu/{id_jalur}           - Status jalur untuk NodeMCU
GET  /api/nodemcu/status/all           - Status semua jalur dengan cycle info
GET  /api/nodemcu/test                 - Test koneksi NodeMCU
POST /api/nodemcu/manual/{id_jalur}    - Manual control jalur (emergency)
```

### Public Monitoring API
```
GET  /api/nodemcu/public/status        - Status semua jalur untuk dashboard publik
POST /api/nodemcu/public/update-density - Update traffic density dari AI/external
```

### Authentication API
```
POST /api/auth/login                   - Login admin
POST /api/auth/logout                  - Logout admin
```

## 🔒 PROTECTED ENDPOINTS (Memerlukan login session)

### Admin Management
```
GET  /api/jalur-status                 - Get status semua jalur (admin)
GET  /api/jalur-status/{id_jalur}      - Get status jalur tertentu (admin)
POST /api/jalur-status                 - Update status jalur (admin)

GET  /api/durasi                       - Get pengaturan durasi
POST /api/durasi                       - Update pengaturan durasi
PUT  /api/durasi/{id}                  - Update durasi tertentu
DELETE /api/durasi/{id}                - Delete durasi tertentu

GET  /api/jalur                        - Get data jalur
POST /api/jalur                        - Create jalur baru
PUT  /api/jalur/{id}                   - Update jalur
DELETE /api/jalur/{id}                 - Delete jalur

GET  /api/kategori                     - Get kategori traffic
POST /api/kategori                     - Create kategori baru
PUT  /api/kategori/{id}                - Update kategori
DELETE /api/kategori/{id}              - Delete kategori
```

## CORS Headers

Semua public endpoints sudah dikonfigurasi dengan CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Usage Examples

### Frontend (React/JavaScript) dengan credentials
```javascript
// Update traffic density dari frontend
fetch('http://localhost:3001/api/traffic/update-density', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Untuk session cookies
  body: JSON.stringify({
    id_jalur: 1,
    jumlah_kendaraan: 75
  })
})
.then(response => response.json())
.then(data => console.log(data));

// Get status untuk frontend
fetch('http://localhost:3001/api/traffic/status', {
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data));
```

### NodeMCU (Arduino) tanpa credentials
```cpp
// Update traffic density dari NodeMCU
String url = "http://192.168.1.100:3001/api/nodemcu/update-density";
HTTPClient http;
http.begin(url);
http.addHeader("Content-Type", "application/json");
String postData = "{\"id_jalur\":1,\"jumlah_kendaraan\":75}";
int httpCode = http.POST(postData);

// Get status dari NodeMCU
String statusUrl = "http://192.168.1.100:3001/api/nodemcu/1";
http.begin(statusUrl);
httpCode = http.GET();
String payload = http.getString();
```

### cURL Testing
```bash
# Frontend endpoint (dengan cookies jika sudah login)
curl -X POST http://localhost:3001/api/traffic/update-density \
  -H "Content-Type: application/json" \
  -d '{"id_jalur": 1, "jumlah_kendaraan": 75}' \
  --cookie-jar cookies.txt --cookie cookies.txt

# NodeMCU endpoint (tanpa cookies)
curl -X POST http://localhost:3001/api/nodemcu/update-density \
  -H "Content-Type: application/json" \
  -d '{"id_jalur": 1, "jumlah_kendaraan": 75}'

# Get status NodeMCU
curl http://localhost:3001/api/nodemcu/1
curl http://localhost:3001/api/nodemcu/status-all
```

## CORS Configuration

### Frontend (localhost:3000)
- Origin: `http://localhost:3000` (spesifik)
- Credentials: `true` (support session cookies)
- Methods: GET, POST, PUT, DELETE, OPTIONS

### NodeMCU/Device (any origin)  
- Origin: `*` (wildcard)
- Credentials: `false` (no cookies)
- Methods: GET, POST, OPTIONS

## Error Handling

### Common Errors
1. **CORS Error**: Pastikan menggunakan endpoint yang tepat (frontend vs NodeMCU)
2. **401 Unauthorized**: Endpoint admin memerlukan login session
3. **400 Bad Request**: Parameter id_jalur atau jumlah_kendaraan tidak valid
4. **404 Not Found**: Jalur tidak ditemukan
5. **500 Internal Server Error**: Database error

### Response Format
```json
{
  "message": "Error description",
  "status": "error"
}
```
