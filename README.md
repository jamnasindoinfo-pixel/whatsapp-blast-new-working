# WA Blast Pro (Versi Native Node.js)

Proyek ini adalah **Alat Otomasi WhatsApp** yang memungkinkan Anda mengirim pesan massal (Teks, Gambar, Video) ke banyak kontak menggunakan `whatsapp-web.js`.

> **Update:**  Proyek ini telah dimigrasikan dari solusi WAHA berbasis Docker ke implementasi **Native Node.js** untuk performa yang lebih baik dan pengaturan yang lebih mudah.

## 🚀 Fitur Utama
- **Integrasi WhatsApp Native**: Menggunakan `whatsapp-web.js` (Tanpa ribet pakai Docker).
- **Pengiriman Multi-Tipe**: Kirim **Teks**, **Gambar**, dan **Video**.
- **Manajemen Campaign**: Buat dan lacak status pengiriman via database.
- **Smart Delays (Anti-Banned)**:
  - **Fixed Delay**: Atur jeda waktu tetap antar pesan.
  - **Random Delay**: Atur rentang waktu acak (min-max) agar lebih aman dari deteksi spam.
- **Dashboard**: Web Interface untuk scan QR dan mengelola blast.
- **Dukungan API**: REST API lengkap untuk integrasi dengan sistem lain.

## 🎓 Tutorial Instalasi Lengkap (Full Guide)

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan aplikasi ini dari nol.

### Langkah 1: Persiapan Sistem (Prerequisites)
1.  **Download & Install Node.js**:
    *   Kunjungi [nodejs.org](https://nodejs.org/).
    *   Download versi **LTS (Long Term Support)**.
    *   Install di komputer Anda (klik Next sampai selesai).
2.  **Google Chrome**:
    *   Pastikan Google Chrome sudah terinstall di komputer, karena dibutuhkan oleh sistem otomasi.

### Langkah 2: Download Project
1.  **Clone via Git** (jika punya Git):
    ```bash
    git clone https://github.com/jamnasindoinfo-pixel/whatsapp-blast-new-working.git
    cd whatsapp-blast-new-working
    ```
2.  **Atau Download ZIP**:
    *   Klik tombol "Code" tang berwarna hijau di GitHub -> "Download ZIP".
    *   Ekstrak file ZIP tersebut.

### Langkah 3: Menjalankan Aplikasi
Kami menyediakan cara termudah menggunakan **start.bat** (Khusus Windows).

1.  Buka folder project `whatsapp-blast-new-working`.
2.  Cari file bernama `start.bat`.
3.  **Klik dua kali (Double click)** file tersebut.
    *   Script akan otomatis menginstall kebutuhan (`npm install`).
    *   Tunggu proses sampai selesai.
4.  Jika muncul tulisan `Server running on port 4000`, artinya aplikasi siap! ✅

### Cara Manual (Lewat Terminal)
Jika `start.bat` gagal, lakukan ini:
1.  Buka CMD/Terminal di folder project.
2.  Ketik perintah berikut:
    ```bash
    npm install
    node server.js
    ```

### ❓ Troubleshooting (Masalah Umum)
*   **'npm' is not recognized**: Node.js belum terinstall atau path belum terbaca. Restart komputer Anda.
*   **Error Puppeteer / Chrome**: Pastikan Chrome terinstall.
*   **Port 4000 already in use**: Tutup aplikasi lain yang memakai port 4000, atau restart komputer.

## 📱 Cara Penggunaan
1. Buka browser ke `http://localhost:4000`.
2. Scan **QR Code** yang muncul menggunakan WhatsApp di HP Anda.
3. Setelah terhubung "Connected", Anda bisa mulai menggunakan fitur blast di dashboard.

## 📡 Endpoint API

### Status
- `GET /api/session-status`: Cek status koneksi.
- `GET /api/qr-code`: Ambil gambar QR code.

### Kirim Pesan
- `POST /api/send-message`: Kirim pesan teks.
  ```json
  { "phone": "628123456789", "message": "Halo!" }
  ```
- `POST /api/send-media`: Kirim media (Gambar/Video).
  ```json
  { 
    "phone": "628123456789", 
    "mediaUrl": "https://example.com/image.jpg", 
    "type": "image", 
    "caption": "Cek gambar ini!" 
  }
  ```

### Blasting (Campaigns)
- `POST /api/blast/text`: Mulai blast pesan teks.
- `POST /api/blast/image`: Mulai blast gambar.

## 🧪 Testing (Pengujian)
Kami menyertakan script testing lengkap untuk memastikan semua fitur berjalan lancar.

**Unit Tests** (Fungsi utilitas):
```bash
node test-unit.js
```

**Comprehensive Tests** (Logika Campaign & Delay):
```bash
node test-comprehensive.js
```

**End-to-End Tests**:
```bash
# Test Semua Fitur
node test-api.js all <NOMOR_HP>

# Test Kirim Media
node test-api.js media <NOMOR_HP>
```

## 📂 Struktur Proyek
- `server.js`: Server aplikasi utama.
- `database.js`: Manajer database SQLite.
- `utils.js`: Fungsi bantuan (helper).
- `public/`: File frontend dashboard.
- `start.bat`: Script untuk menjalankan aplikasi di Windows dengan mudah.