# 📁 Struktur File & Penjelasan

Dokumentasi lengkap struktur file project WAHA Plus API.

## 🗂️ File Tree

```
waha-plus-complete/
├── 📄 docker-compose.yml          # Docker configuration
├── 📄 .env                        # Environment variables (SECRET!)
├── 📄 .gitignore                  # Git ignore rules
├── 📄 package.json                # NPM dependencies & scripts
├── 📄 server.js                   # Main API server
├── 📄 database.js                 # SQLite database functions
├── 📄 setup-webhook.js            # Webhook setup script
├── 📄 test-api.js                 # API testing script
├── 📄 dashboard.html              # Monitoring dashboard
├── 📄 README.md                   # Main documentation
├── 📄 QUICK-START.md              # Quick start guide
├── 📄 DEPLOYMENT-CHECKLIST.md     # Deployment checklist
├── 📄 FILE-STRUCTURE.md           # This file
├── 📁 waha_data/                  # WhatsApp session data (auto)
├── 📁 node_modules/               # NPM packages (auto)
└── 📄 wa_blast.db                 # SQLite database (auto)
```

## 📄 File Descriptions

### Core Files

#### `docker-compose.yml`
**Fungsi:** Konfigurasi Docker untuk WAHA Plus  
**Edit:** Ya, sesuaikan port & API key  
**Commit:** Ya (tanpa sensitive data)

**Key sections:**
- `image`: Docker image WAHA Plus
- `ports`: Port mapping (3000:3000)
- `environment`: Environment variables
- `volumes`: Data persistence

#### `.env`
**Fungsi:** Environment variables & secrets  
**Edit:** Ya, WAJIB ganti API key  
**Commit:** ❌ JANGAN! (ada di .gitignore)

**Contains:**
- `WAHA_URL`: URL WAHA Plus
- `WAHA_API_KEY`: Secret API key
- `SESSION_NAME`: WhatsApp session name
- `PORT`: Node.js server port
- `WEBHOOK_URL`: Webhook callback URL

#### `server.js`
**Fungsi:** Main API server dengan Express.js  
**Edit:** Jarang (kecuali custom logic)  
**Commit:** Ya

**Features:**
- Express.js REST API
- WAHA Plus integration
- Typing indicator implementation
- Database integration
- Webhook handler
- Campaign processing
- Auto-update status

**Endpoints:**
- POST `/api/campaigns` - Create campaign
- GET `/api/campaigns` - List campaigns
- POST `/api/campaigns/:id/start` - Start campaign
- GET `/api/campaigns/:id/messages` - Get messages
- GET `/api/replies/unread` - Get unread replies
- GET `/api/statistics` - Get statistics
- POST `/api/webhook` - Webhook receiver
- And more...

#### `database.js`
**Fungsi:** SQLite database layer  
**Edit:** Jarang (kecuali schema changes)  
**Commit:** Ya

**Functions:**
- `initTables()` - Create all tables
- Campaign CRUD operations
- Message tracking functions
- Reply management
- Contact management
- Statistics queries

**Tables:**
- `campaigns` - Campaign tracking
- `messages` - Message details
- `replies` - Reply monitoring
- `contacts` - Contact database

#### `package.json`
**Fungsi:** NPM configuration & dependencies  
**Edit:** Ya, untuk add scripts/dependencies  
**Commit:** Ya

**Dependencies:**
- `express` - Web server
- `axios` - HTTP client
- `sqlite3` - Database
- `cors` - CORS middleware
- `dotenv` - Environment loader

**Scripts:**
- `npm start` - Start server
- `npm run dev` - Development mode
- `npm test` - Run tests
- `npm run docker-up` - Start Docker
- `npm run setup-webhook` - Setup webhook

### Configuration Files

#### `.gitignore`
**Fungsi:** Git ignore rules  
**Edit:** Ya, add more ignore patterns  
**Commit:** Ya

**Ignores:**
- `.env` - Secrets
- `node_modules/` - Dependencies
- `waha_data/` - WhatsApp data
- `wa_blast.db` - Database
- Log files

### Utility Scripts

#### `setup-webhook.js`
**Fungsi:** Configure webhook di WAHA Plus  
**Edit:** Tidak perlu  
**Commit:** Ya

**Usage:**
```bash
npm run setup-webhook       # Setup webhook
npm run check-webhook       # Check status
```

**What it does:**
- Connect to WAHA Plus API
- Configure webhook URL
- Set event subscriptions
- Verify configuration

#### `test-api.js`
**Fungsi:** API testing & validation  
**Edit:** Ya, add more tests  
**Commit:** Ya

**Usage:**
```bash
npm test                    # Basic tests
npm run test:all 628xxx     # All tests
npm run test:campaign 628xxx # Campaign test
npm run test:help           # Show help
```

**Tests:**
- Statistics endpoint
- Session status
- Campaign CRUD
- Message sending
- Reply monitoring
- Contact management

### Frontend

#### `dashboard.html`
**Fungsi:** Web-based monitoring dashboard  
**Edit:** Ya, customize design  
**Commit:** Ya

**Features:**
- Real-time statistics
- Campaign management
- Create campaign form
- Reply monitoring
- Contact list
- Auto-refresh (10s)

**Tabs:**
- 📋 Campaigns - List & manage
- 💬 Balasan - Monitor replies
- 👥 Kontak - Contact database
- ➕ Buat Campaign - Create new

### Documentation

#### `README.md`
**Fungsi:** Main documentation  
**Edit:** Ya, keep updated  
**Commit:** Ya

**Sections:**
- Features overview
- Installation guide
- API documentation
- Configuration
- Troubleshooting
- Best practices

#### `QUICK-START.md`
**Fungsi:** Quick setup guide  
**Edit:** Update jika workflow berubah  
**Commit:** Ya

**Content:**
- 5-minute setup
- Step-by-step instructions
- Quick test procedures
- Common commands

#### `DEPLOYMENT-CHECKLIST.md`
**Fungsi:** Production deployment checklist  
**Edit:** Ya, add your requirements  
**Commit:** Ya

**Sections:**
- Security checks
- Configuration verification
- Testing procedures
- Production setup
- Success criteria

#### `FILE-STRUCTURE.md`
**Fungsi:** This file - documentation of files  
**Edit:** Ya, keep synchronized  
**Commit:** Ya

### Auto-Generated Files

#### `wa_blast.db`
**Fungsi:** SQLite database file  
**Edit:** ❌ Jangan manual!  
**Commit:** ❌ Tidak (ada di .gitignore)

**Created by:** `database.js` on first run

**Tables:**
- campaigns
- messages  
- replies
- contacts

**Backup:**
```bash
npm run backup-db
```

#### `waha_data/`
**Fungsi:** WhatsApp session storage  
**Edit:** ❌ Jangan!  
**Commit:** ❌ Tidak (ada di .gitignore)

**Contains:**
- Session files
- QR codes
- Authentication data
- WhatsApp cache

**Important:** Backup folder ini untuk preserve session!

#### `node_modules/`
**Fungsi:** NPM dependencies  
**Edit:** ❌ Never!  
**Commit:** ❌ Tidak (ada di .gitignore)

**Created by:** `npm install`

**Size:** ~50-100MB

## 🔄 File Dependencies

```
docker-compose.yml
    ↓ starts
WAHA Plus Container
    ↓ connects to
server.js
    ↓ uses
database.js → wa_blast.db
    ↑
    ├── Reads .env
    └── Serves dashboard.html
```

## 📝 Which Files to Edit?

### Must Edit (Initial Setup)
1. ✅ `.env` - API key & configuration
2. ✅ `docker-compose.yml` - API key (same as .env)

### May Edit (Customization)
3. 🔧 `dashboard.html` - UI customization
4. 🔧 `server.js` - Custom endpoints/logic
5. 🔧 `database.js` - Schema changes

### Don't Edit
6. ❌ `wa_blast.db` - Auto-managed
7. ❌ `waha_data/` - Auto-managed
8. ❌ `node_modules/` - Auto-managed

## 🚀 Typical Workflow

### 1. Initial Setup
```bash
# Edit configuration
nano .env
nano docker-compose.yml

# Install & start
npm install
npm run docker-up
npm start
```

### 2. Daily Usage
```bash
# Start services (if not running)
npm run docker-up
npm start

# Open dashboard
open dashboard.html

# Create & run campaigns via dashboard
```

### 3. Testing
```bash
# Basic tests
npm test

# Full tests with campaign
npm run test:all 628123456789
```

### 4. Monitoring
```bash
# Check logs
npm run docker-logs

# Check webhook
npm run check-webhook

# View stats
curl http://localhost:3001/api/statistics
```

### 5. Maintenance
```bash
# Backup database
npm run backup-db

# Update code
git pull

# Restart services
npm run docker-down
npm run docker-up
npm start
```

## 📦 File Sizes (Approx)

```
docker-compose.yml          1 KB
.env                        1 KB
server.js                  15 KB
database.js                10 KB
dashboard.html             25 KB
test-api.js                10 KB
setup-webhook.js            3 KB
package.json                1 KB
README.md                  30 KB
wa_blast.db               50 KB - 10 MB (grows)
waha_data/              100 MB - 500 MB
node_modules/            50 MB - 100 MB
```

## 🔐 Security Notes

**Never Commit:**
- `.env` file
- `wa_blast.db` database
- `waha_data/` folder
- Any files with API keys
- Session data

**Always:**
- Keep `.gitignore` updated
- Use strong API keys
- Backup database regularly
- Review logs for security issues
- Update dependencies regularly

## 🎓 Learning Path

**Beginner:**
1. Read `QUICK-START.md`
2. Follow setup instructions
3. Test dengan dashboard
4. Buat campaign pertama

**Intermediate:**
5. Read `README.md` fully
6. Explore API endpoints
7. Test dengan `test-api.js`
8. Customize dashboard

**Advanced:**
9. Modify `server.js` for custom logic
10. Add new database tables
11. Implement rate limiting
12. Deploy to production

## 🆘 Troubleshooting Files

**Problem:** Server won't start  
**Check:** `.env`, `package.json`, logs in terminal

**Problem:** Database error  
**Check:** `database.js`, `wa_blast.db` permissions

**Problem:** Webhook not working  
**Check:** `setup-webhook.js`, server logs, WAHA logs

**Problem:** Docker issues  
**Check:** `docker-compose.yml`, `docker logs waha-plus`

**Problem:** WhatsApp disconnected  
**Check:** `waha_data/` folder, QR code scan

## 📚 Additional Resources

**Official Docs:**
- WAHA Plus: https://waha.devlike.pro
- Express.js: https://expressjs.com
- SQLite: https://sqlite.org

**Project Docs:**
- Main: `README.md`
- Quick start: `QUICK-START.md`
- Deployment: `DEPLOYMENT-CHECKLIST.md`
- This file: `FILE-STRUCTURE.md`

---

**Last Updated:** Auto-generated  
**Version:** 1.0.0  
**Maintainer:** Project Team