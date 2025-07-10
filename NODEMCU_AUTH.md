# NodeMCU Authentication Implementation

## Overview
NodeMCU sekarang menggunakan session-based authentication seperti frontend. Semua API endpoint memerlukan login terlebih dahulu.

## How it Works

### 1. Login Process
- NodeMCU melakukan POST ke `/api/auth/login` dengan username/password
- Server mengembalikan session cookie dalam header `Set-Cookie`
- NodeMCU menyimpan session cookie untuk request selanjutnya

### 2. API Calls
- Setiap request ke API menyertakan session cookie di header `Cookie`
- Jika session expired (401), NodeMCU otomatis login ulang

### 3. Session Management
- Login otomatis saat startup
- Re-login setiap 5 menit untuk refresh session
- Re-login otomatis jika mendapat error 401

## Arduino Code Changes

### 1. New Variables
```cpp
// Auth Configuration
const char* username = "admin";
const char* password = "admin123";

// Session Variables
bool isLoggedIn = false;
String sessionCookie = "";
unsigned long lastLoginCheck = 0;
```

### 2. Login Function
```cpp
bool performLogin() {
    HTTPClient http;
    String url = String(serverURL) + "/api/auth/login";
    
    // Send login request
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    String loginData = "{\"username\":\"" + String(username) + "\",\"password\":\"" + String(password) + "\"}";
    int httpCode = http.POST(loginData);
    
    // Extract session cookie from response headers
    if (httpCode == HTTP_CODE_OK) {
        String setCookieHeader = http.header("Set-Cookie");
        // Parse and store session cookie
        isLoggedIn = true;
        return true;
    }
    return false;
}
```

### 3. Authenticated API Calls
```cpp
void getTrafficStatus() {
    // Check login status
    if (!isLoggedIn) {
        performLogin();
    }
    
    HTTPClient http;
    String url = String(serverURL) + "/api/jalur-status/" + String(JALUR_ID);
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Cookie", sessionCookie); // Add session cookie
    
    int httpCode = http.GET();
    
    if (httpCode == 401) {
        // Session expired, login again
        isLoggedIn = false;
        sessionCookie = "";
    }
}
```

## API Endpoints Used by NodeMCU

### Authentication
```
POST /api/auth/login
Body: {"username": "admin", "password": "admin123"}
Response: {"message": "Login berhasil"} + Set-Cookie header
```

### Get Traffic Status
```
GET /api/jalur-status/{jalur_id}
Headers: Cookie: connect.sid=s%3A...
Response: {
  "id_jalur": 1,
  "nama_jalur": "Jl. Sudirman",
  "status_lampu": "hijau",
  "durasi_tersisa": 25,
  "durasi_total": 40,
  ...
}
```

## Benefits

### 1. Security
- Semua API calls memerlukan authentication
- Tidak ada endpoint public yang bisa disalahgunakan
- Session timeout untuk security

### 2. Consistency
- NodeMCU dan Frontend menggunakan sistem auth yang sama
- Satu sistem autentikasi untuk semua clients

### 3. Monitoring
- Server bisa track siapa yang mengakses API
- Logging dan auditing lebih baik

## Serial Commands

NodeMCU menyediakan command debugging via serial:

```
info/status - Show system information (termasuk login status)
wifi - Show WiFi status
login - Manual login attempt
test - Test authenticated API call
reset - Restart NodeMCU
help - Show available commands
```

## Troubleshooting

### 1. Login Failed
- Check username/password di code
- Check server accessibility
- Check WiFi connection

### 2. Session Expired
- NodeMCU otomatis re-login setiap 5 menit
- Manual re-login dengan command `login` via serial
- Check server session configuration

### 3. 401 Unauthorized
- Session cookie tidak valid atau expired
- NodeMCU akan otomatis login ulang
- Check serial output untuk error details

## Configuration

### Server Setup
Pastikan server memiliki konfigurasi session yang benar:

```javascript
app.use(session({
    secret: 'secretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));
```

### NodeMCU Setup
Update credentials di Arduino code:

```cpp
// Auth Configuration
const char* username = "admin";        // Username admin
const char* password = "admin123";     // Password admin
const char* serverURL = "http://192.168.1.100:3001"; // IP server
```

## Server Endpoints Structure

```
PUBLIC (No Auth):
- POST /api/auth/login
- POST /api/auth/logout

PROTECTED (Need Auth):
- GET /api/jalur-status/{id}
- POST /api/jalur-status
- GET /api/durasi
- POST /api/durasi
- All other admin endpoints
```

Dengan implementasi ini, sistem menjadi lebih secure dan terintegrasi dengan baik antara NodeMCU dan Frontend.
