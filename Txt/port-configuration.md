# 🔌 Port Configuration Guide

Panduan lengkap untuk mengubah port WAHA Plus dan API Server.

## 🎯 Default Ports

```
WAHA Plus:  localhost:3000
API Server: localhost:3001
```

## 🔄 Mengubah WAHA Plus Port (3000 → 5000)

### File yang HARUS diubah:

#### 1. **docker-compose.yml**
```yaml
services:
  waha-plus:
    ports:
      - "5000:3000"  # 👈 Ubah dari 3000:3000 ke 5000:3000
```

**Penjelasan:**
- Format: `"HOST_PORT:CONTAINER_PORT"`
- `5000` = Port di komputer Anda
- `3000` = Port di dalam Docker (jangan diubah!)

#### 2. **.env**
```env
WAHA_URL=http://localhost:5000  # 👈 Ubah dari 3000 ke 5000
```

#### 3. **server.js** (opsional jika pakai .env)
```javascript
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:5000';
```

#### 4. **setup-webhook.js** (opsional jika pakai .env)
```javascript
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:5000';
```

### Setelah Perubahan:

```bash
# Restart Docker
npm run docker-down
npm run docker-up

# Restart server
# Ctrl+C (stop server)
npm start

# Setup webhook lagi
npm run setup-webhook

# Test
curl http://localhost:5000/api/sessions
```

## 🔄 Mengubah API Server Port (3001 → 4000)

### File yang HARUS diubah:

#### 1. **.env**
```env
PORT=4000  # 👈 Ubah dari 3001 ke 4000
```

#### 2. **dashboard.html**
```javascript
const API_URL = 'http://localhost:4000/api';  // 👈 Ubah dari 3001 ke 4000
```

#### 3. **test-api.js**
```javascript
const API_URL = 'http://localhost:4000/api';  // 👈 Ubah dari 3001 ke 4000
```

### Setelah Perubahan:

```bash
# Restart server
# Ctrl+C (stop server)
npm start

# Test
curl http://localhost:4000/api/statistics
```

## 📋 Quick Reference

### Skenario 1: Port 3000 sudah dipakai

**Solusi:** Ganti WAHA Plus ke port 5000

**Ubah:**
1. ✅ `docker-compose.yml` → `"5000:3000"`
2. ✅ `.env` → `WAHA_URL=http://localhost:5000`

**Restart:**
```bash
npm run docker-down && npm run docker-up
npm run setup-webhook
```

### Skenario 2: Port 3001 sudah dipakai

**Solusi:** Ganti API Server ke port 4000

**Ubah:**
1. ✅ `.env` → `PORT=4000`
2. ✅ `dashboard.html` → `API_URL = 'http://localhost:4000/api'`
3. ✅ `test-api.js` → `API_URL = 'http://localhost:4000/api'`

**Restart:**
```bash
# Ctrl+C (stop server)
npm start
```

### Skenario 3: Kedua port sudah dipakai

**Solusi:** Ganti keduanya

**WAHA Plus:** 3000 → 5000  
**API Server:** 3001 → 4000

**Ubah:**
1. ✅ `docker-compose.yml` → `"5000:3000"`
2. ✅ `.env` → `WAHA_URL=http://localhost:5000` dan `PORT=4000`
3. ✅ `dashboard.html` → `API_URL = 'http://localhost:4000/api'`
4. ✅ `test-api.js` → `API_URL = 'http://localhost:4000/api'`

**Restart:**
```bash
npm run docker-down && npm run docker-up
# Ctrl+C (stop server)
npm start
npm run setup-webhook
```

## 🔍 Cek Port yang Sudah Dipakai

### Windows
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### Linux/Mac
```bash
lsof -i :3000
lsof -i :3001
```

## ✅ Verifikasi Setelah Perubahan

### Test WAHA Plus (Port 5000)
```bash
curl http://localhost:5000/api/sessions
```

Expected: Response JSON dari WAHA

### Test API Server (Port 3001 default)
```bash
curl http://localhost:3001/api/statistics
```

Expected: Response statistik

### Test Dashboard
1. Buka `dashboard.html` di browser
2. Cek connection status (hijau)
3. Lihat statistics muncul

## 🐛 Troubleshooting

### Error: "Port already in use"

**Cek siapa yang pakai:**
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

**Kill process:**
```bash
# Windows (ganti PID)
taskkill /PID 1234 /F

# Linux/Mac
kill -9 1234
```

### Error: "Cannot connect to WAHA"

**Cek:**
1. ✅ Docker container running: `docker ps`
2. ✅ Port benar di `.env`
3. ✅ URL benar: `http://localhost:5000`
4. ✅ Logs: `npm run docker-logs`

### Error: "Webhook setup failed"

**Cek:**
1. ✅ WAHA URL benar di `.env`
2. ✅ API Server running
3. ✅ Webhook URL benar: `http://localhost:3001/api/webhook`
4. ✅ API Key sama di semua file

## 📝 Port Configuration Matrix

| Service | Default Port | Alternative | File to Change |
|---------|-------------|-------------|----------------|
| WAHA Plus | 3000 | 5000, 8080 | docker-compose.yml, .env |
| API Server | 3001 | 4000, 8081 | .env, dashboard.html |
| Database | N/A (local) | N/A | N/A |
| Dashboard | N/A (file) | N/A | Open in browser |

## 🎯 Production Configuration

### Dengan Domain

**.env:**
```env
WAHA_URL=https://waha.yourdomain.com
WEBHOOK_URL=https://api.yourdomain.com/api/webhook
PORT=3001
```

**docker-compose.yml:**
```yaml
ports:
  - "3000:3000"  # Internal only, pakai reverse proxy
```

### Reverse Proxy (Nginx)

```nginx
# WAHA Plus
server {
    listen 80;
    server_name waha.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}

# API Server
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
    }
}
```

## 💡 Best Practices

### Development
```
WAHA Plus:  localhost:3000
API Server: localhost:3001
```

### Staging
```
WAHA Plus:  localhost:5000
API Server: localhost:5001
```

### Production
```
WAHA Plus:  waha.yourdomain.com:443 (SSL)
API Server: api.yourdomain.com:443 (SSL)
```

## 🔐 Security Notes

**Port Exposure:**
- ✅ Expose only necessary ports
- ✅ Use firewall for production
- ✅ Use SSL/TLS (443) in production
- ❌ Don't expose internal ports publicly

**Reverse Proxy Benefits:**
- ✅ SSL termination
- ✅ Load balancing
- ✅ DDoS protection
- ✅ Hide internal ports

## 📞 Need Help?

**Common Issues:**
1. Port conflict → Change port
2. Connection refused → Check Docker/Server running
3. Webhook failed → Check URL & API key
4. Dashboard not loading → Check API_URL

**Check Logs:**
```bash
# Docker logs
npm run docker-logs

# Server logs
# Check terminal output where you ran npm start
```

---

**Summary:**
- WAHA Plus default: 3000 → Change in `docker-compose.yml` & `.env`
- API Server default: 3001 → Change in `.env` & `dashboard.html`
- Always restart services after changing ports
- Verify with curl or browser