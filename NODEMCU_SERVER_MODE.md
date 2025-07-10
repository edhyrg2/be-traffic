# NodeMCU Server-Controlled Mode

## 🔄 Perubahan Sistem

NodeMCU sekarang berfungsi sebagai **PURE DISPLAY DEVICE** yang sepenuhnya dikontrol oleh server.

## ⚙️ Cara Kerja Baru:

### **SERVER (Master Controller):**
- ✅ Mengatur semua timing dan countdown
- ✅ Menentukan fase lampu (hijau→kuning→merah)
- ✅ Menyimpan durasi_tersisa di database
- ✅ Mengupdate status setiap detik

### **NODEMCU (Display Device):**
- ✅ Polling API setiap 1 detik: `GET /api/nodemcu/{1-4}`
- ✅ Menampilkan LED sesuai status dari server
- ❌ TIDAK ada countdown lokal
- ❌ TIDAK mengubah timing sendiri

## 📡 Response API yang Dibaca NodeMCU:

```json
{
    "jalur_id": 1,
    "nama": "Jl. Sudirman", 
    "lampu": "hijau",           // Status dari SERVER
    "durasi": 35,               // Sisa waktu dari SERVER  
    "total": 40,                // Total durasi fase dari SERVER
    "kendaraan": 75,            // Jumlah kendaraan terdeteksi
    "timestamp": 1672531200,
    "status": "ok"
}
```

## 🚦 Behavior NodeMCU:

### **Normal Mode:**
- 🟢 **Hijau**: LED hijau menyala sesuai server
- 🟡 **Kuning**: LED kuning menyala sesuai server  
- 🔴 **Merah**: LED merah menyala sesuai server

### **Error Mode:**
- 🔴 **Blinking Red**: Jika tidak ada koneksi ke server
- No LED: Jika data invalid

## 📊 Serial Monitor Output:

```
🚦 NodeMCU Traffic Light - Jalur 1
📡 Jalur 1 | 🟢 HIJAU | Server: 35s/40s | Kendaraan: 75
📡 Jalur 1 | 🟢 HIJAU | Server: 34s/40s | Kendaraan: 75
📡 Jalur 1 | 🟡 KUNING | Server: 5s/5s | Kendaraan: 75
📡 Jalur 1 | 🔴 MERAH | Server: 45s/45s | Kendaraan: 75
```

## 🛠️ Debug Commands:

Ketik di Serial Monitor:
- `info` atau `status` - Tampilkan info sistem
- `wifi` - Cek status WiFi
- `test` - Test API call manual
- `reset` - Restart NodeMCU
- `help` - Tampilkan bantuan

## ✅ Keuntungan Mode Ini:

1. **Perfect Sync** - 4 NodeMCU selalu sinkron 100%
2. **Centralized Logic** - Semua keputusan di server
3. **Easy Debugging** - Monitor server log untuk troubleshoot
4. **Adaptive Timing** - Server bisa ubah durasi berdasarkan traffic
5. **Failsafe** - Blink red jika server down

## 🔧 Setup Per NodeMCU:

```cpp
// NodeMCU 1
const int JALUR_ID = 1;

// NodeMCU 2  
const int JALUR_ID = 2;

// NodeMCU 3
const int JALUR_ID = 3;

// NodeMCU 4
const int JALUR_ID = 4;
```

**Status: ✅ SERVER FULL CONTROL MODE ACTIVE**
