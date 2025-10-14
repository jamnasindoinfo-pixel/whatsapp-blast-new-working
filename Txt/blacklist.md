# 🚫 Blacklist Management - Panduan Lengkap

Fitur blacklist untuk **auto-deteksi** kontak yang memblokir Anda dan **mencegah** pengiriman blast ke kontak tersebut.

---

## 🎯 Apa itu Blacklist?

**Blacklist** adalah daftar kontak WhatsApp yang **tidak akan menerima blast** dari sistem. Kontak bisa masuk blacklist dengan 2 cara:

1. **Auto-Deteksi** 🤖 - Sistem otomatis mendeteksi saat nomor memblokir Anda
2. **Manual** ✋ - Anda menambahkan sendiri kontak yang tidak ingin dikirimi

---

## ✨ Fitur Utama

### **1. Auto-Detection** 🤖
- ✅ Deteksi otomatis saat nomor memblokir
- ✅ Parse error dari WAHA API
- ✅ Langsung tambah ke blacklist
- ✅ Log di terminal server

### **2. Smart Filtering** 🎯
- ✅ Filter nomor blacklist sebelum blast
- ✅ Hitung & tampilkan berapa nomor di-skip
- ✅ Prevent pengiriman ke nomor blocked
- ✅ Save resource & quota

### **3. Management UI** 📱
- ✅ Halaman khusus blacklist
- ✅ Lihat semua nomor blacklist
- ✅ Tambah manual via form
- ✅ Hapus dari blacklist
- ✅ Filter by type (auto/manual)

### **4. Dashboard Integration** 📊
- ✅ Stats card blacklist count
- ✅ Quick link ke halaman blacklist
- ✅ Auto-refresh count

---

## 🔧 Cara Kerja Auto-Detection

### **Flow Diagram:**

```
Blast Pesan
    ↓
Kirim ke Nomor X
    ↓
WAHA Response Error
    ↓
Cek Error Message:
- "blocked"
- "not authorized"  
- "forbidden"
- Status 403
    ↓
✅ Match! → Auto Blacklist
    ↓
Save ke Database
    ↓
Log: "🚫 Nomor X memblokir kita!"
```

### **Error Patterns yang Detected:**

```javascript
// Server otomatis deteksi error ini:
- error.includes('blocked')
- error.includes('not authorized')
- error.includes('forbidden')
- error.response.status === 403
```

---

## 📱 Cara Menggunakan

### **A. Lihat Blacklist**

```
1. Buka: http://localhost:4000/blacklist.html
2. Lihat tabel daftar blacklist
3. Info yang ditampilkan:
   - Nomor WhatsApp
   - Alasan blacklist
   - Type (Auto/Manual)
   - Tanggal ditambahkan
```

### **B. Tambah Manual ke Blacklist**

```
1. Buka halaman Blacklist
2. Isi form "Tambah ke Blacklist":
   - Nomor WhatsApp: 08123456789
   - Alasan: "Spam" / "Tidak Relevan" / dll
3. Klik "🚫 Tambah ke Blacklist"
4. Konfirmasi
5. Nomor masuk blacklist ✅
```

### **C. Hapus dari Blacklist**

```
1. Di tabel blacklist
2. Klik tombol "✅ Hapus" di nomor yang mau dihapus
3. Konfirmasi
4. Nomor keluar dari blacklist
5. Bisa terima blast lagi
```

### **D. Cek Status Blacklist**

Via API:
```bash
curl http://localhost:4000/api/blacklist/check/6281234567890
```

Response:
```json
{
  "phone": "6281234567890",
  "isBlacklisted": true
}
```

---

## 🚀 Saat Blast

### **Before (Tanpa Blacklist):**

```
Input: 10 nomor
→ Kirim ke 10 nomor
→ 2 nomor blocked (error)
→ Resource terbuang
```

### **After (Dengan Blacklist):**

```
Input: 10 nomor
→ Filter blacklist: 2 nomor di-skip ✅
→ Kirim ke 8 nomor only
→ Efisien! Save resource
→ Log: "🚫 Skipped 2 blacklisted contacts"
```

### **Log Terminal:**

```bash
🚀 ========== MULAI BLAST TEKS ==========
📊 Campaign ID: 5
📊 Total nomor: 8
🚫 Skipped blacklist: 2

[1/8] Mengirim ke: 6281234567890
✅ Pesan berhasil ke 6281234567890

[2/8] Mengirim ke: 6282345678901
❌ Error ke 6282345678901: User blocked
🚫 Nomor 6282345678901 memblokir kita! Adding to blacklist...
✅ 6282345678901 ditambahkan ke blacklist
```

---

## 📊 Dashboard Stats

Dashboard menampilkan card **Blacklist** dengan:
- 🚫 Icon merah
- Total nomor di blacklist
- Klik untuk buka halaman blacklist

```
┌─────────────────┐
│   Blacklist     │
│       5         │
│      🚫         │
└─────────────────┘
```

---

## 🗄️ Database Schema

### **Table: contacts**

```sql
ALTER TABLE contacts ADD COLUMN:
- is_blacklisted INTEGER DEFAULT 0
- blacklist_reason TEXT
- blacklisted_at DATETIME
```

### **Query Examples:**

**Get all blacklist:**
```sql
SELECT * FROM contacts 
WHERE is_blacklisted = 1
ORDER BY blacklisted_at DESC;
```

**Check if number blacklisted:**
```sql
SELECT is_blacklisted FROM contacts 
WHERE phone_number = '6281234567890';
```

**Add to blacklist:**
```sql
UPDATE contacts 
SET is_blacklisted = 1,
    blacklist_reason = 'Auto-detected: Blocked by user',
    blacklisted_at = CURRENT_TIMESTAMP
WHERE phone_number = '6281234567890';
```

**Remove from blacklist:**
```sql
UPDATE contacts 
SET is_blacklisted = 0,
    blacklist_reason = NULL,
    blacklisted_at = NULL
WHERE phone_number = '6281234567890';
```

---

## 🔌 API Endpoints

### **GET /api/blacklist**
Ambil semua kontak blacklist

Response:
```json
[
  {
    "phone_number": "6281234567890",
    "blacklist_reason": "Auto-detected: Blocked by user",
    "blacklisted_at": "2024-12-10 14:30:00",
    "is_blacklisted": 1
  }
]
```

### **POST /api/blacklist**
Tambah ke blacklist

Request:
```json
{
  "phoneNumber": "08123456789",
  "reason": "Spam"
}
```

Response:
```json
{
  "success": true,
  "message": "Nomor ditambahkan ke blacklist"
}
```

### **DELETE /api/blacklist/:phone**
Hapus dari blacklist

Response:
```json
{
  "success": true,
  "message": "Nomor dihapus dari blacklist"
}
```

### **GET /api/blacklist/check/:phone**
Cek status blacklist

Response:
```json
{
  "phone": "6281234567890",
  "isBlacklisted": true
}
```

---

## 💡 Tips & Best Practices

### **1. Regular Review**
- Cek blacklist setiap minggu
- Hapus nomor yang salah masuk
- Verifikasi alasan blacklist

### **2. Manual Blacklist**
Gunakan untuk:
- Nomor spam yang reply negatif
- Kontak yang minta berhenti
- Nomor yang tidak relevan
- Pesaing atau competitor

### **3. Auto-Detection**
Akan mendeteksi:
- Nomor yang block Anda
- Nomor nonaktif (kadang)
- Error 403 dari WAHA
- "Not authorized" messages

### **4. Export Blacklist**
Backup daftar blacklist:
```sql
sqlite3 wa_blast.db
.mode csv
.output blacklist_backup.csv
SELECT * FROM contacts WHERE is_blacklisted = 1;
.quit
```

### **5. Import Blacklist**
Jika punya list blacklist, import manual atau buat script:
```javascript
const blacklistNumbers = [
  '6281234567890',
  '6282345678901',
  // ...
];

for (const phone of blacklistNumbers) {
  await fetch('http://localhost:4000/api/blacklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: phone,
      reason: 'Imported from old system'
    })
  });
}
```

---

## ⚠️ Important Notes

### **False Positives**
Kadang nomor masuk blacklist padahal tidak block. Ini bisa terjadi karena:
- Nomor nonaktif temporary
- Server WAHA error
- Rate limit WhatsApp

**Solusi:** Review manual & hapus dari blacklist jika perlu.

### **WhatsApp Limits**
WhatsApp punya rate limit. Jangan salah mengira rate limit sebagai block.

**Ciri-ciri Rate Limit:**
- Banyak nomor gagal sekaligus
- Error message: "too many requests"
- Temporary (hilang setelah beberapa jam)

**Ciri-ciri Blocked:**
- Hanya 1-2 nomor gagal
- Error: "blocked" / "forbidden"
- Permanent (tidak hilang)

### **Privacy**
Blacklist berisi data pribadi (nomor). Jangan:
- Share file database
- Export & share CSV
- Screenshot blacklist
- Publish anywhere

---

## 🔧 Troubleshooting

### **Nomor masuk blacklist tapi tidak block**

```sql
-- Cek alasan
SELECT phone_number, blacklist_reason 
FROM contacts 
WHERE phone_number = '6281234567890';

-- Jika salah, hapus
UPDATE contacts 
SET is_blacklisted = 0 
WHERE phone_number = '6281234567890';
```

### **Auto-detection tidak jalan**

Cek:
1. ✅ Database.js ada fungsi `addToBlacklist`?
2. ✅ Server.js detect error dengan benar?
3. ✅ Error dari WAHA berisi kata "blocked"?

Debug:
```javascript
// Di server.js, tambah log
console.log('Error message:', error.response?.data?.message);
console.log('Is blocked?', isBlocked);
```

### **Blacklist tidak muncul di dashboard**

1. Clear browser cache (Ctrl + F5)
2. Cek API: `http://localhost:4000/api/blacklist`
3. Restart server

---

## 📈 Analytics

### **Query Useful:**

**Blacklist growth over time:**
```sql
SELECT 
  DATE(blacklisted_at) as date,
  COUNT(*) as count
FROM contacts
WHERE is_blacklisted = 1
GROUP BY DATE(blacklisted_at)
ORDER BY date DESC;
```

**Auto vs Manual:**
```sql
SELECT 
  CASE 
    WHEN blacklist_reason LIKE '%Auto%' THEN 'Auto'
    ELSE 'Manual'
  END as type,
  COUNT(*) as count
FROM contacts
WHERE is_blacklisted = 1
GROUP BY type;
```

**Most common reasons:**
```sql
SELECT 
  blacklist_reason,
  COUNT(*) as count
FROM contacts
WHERE is_blacklisted = 1
GROUP BY blacklist_reason
ORDER BY count DESC
LIMIT 10;
```

---

## ✅ Checklist Setup

Untuk menggunakan fitur blacklist:

- [ ] Database.js sudah update (kolom blacklist)
- [ ] Server.js sudah update (detection & API)
- [ ] File blacklist.html sudah dibuat
- [ ] Dashboard.html sudah update (link & stats)
- [ ] Server restart berhasil
- [ ] Database migrate berhasil (kolom baru)
- [ ] Halaman blacklist bisa dibuka
- [ ] Test tambah manual → berhasil
- [ ] Test blast → skip blacklist
- [ ] Test auto-detect → masuk blacklist

---

## 🎉 Selamat!

Fitur blacklist sudah aktif! Sekarang sistem akan:
- 🤖 Auto-detect nomor yang block
- 🎯 Skip nomor blacklist saat blast
- 📊 Track & manage blacklist
- 💾 Save semua data di database

**Happy Blasting dengan Blacklist Management! 🚀**