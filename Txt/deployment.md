# 📋 Deployment Checklist

Checklist lengkap untuk memastikan sistem WAHA Plus API siap production.

## 🔐 Security

- [ ] **API Key kuat** - Min 32 karakter random
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] API Key sama di `.env` dan `docker-compose.yml`
- [ ] `.env` ada di `.gitignore`
- [ ] Folder `waha_data/` ada di `.gitignore`
- [ ] Database `wa_blast.db` ada di `.gitignore`
- [ ] Tidak ada credentials di commit history

## 🐳 Docker

- [ ] Docker & Docker Compose terinstall
- [ ] `docker-compose.yml` configured correctly
- [ ] Port 3000 tidak conflict
- [ ] Volume `waha_data` mounted correctly
- [ ] Container running: `docker ps`
- [ ] No errors in logs: `docker logs waha-plus -f`

## 📱 WhatsApp Session

- [ ] QR Code berhasil di-scan
- [ ] Session status: WORKING
  ```bash
  curl http://localhost:3000/api/sessions
  ```
- [ ] WhatsApp number active
- [ ] WhatsApp tidak di-banned
- [ ] Backup session data di `waha_data/`

## 🔧 Node.js Server

- [ ] Node.js v16+ installed
- [ ] Dependencies installed: `npm install`
- [ ] Server starts without errors: `npm start`
- [ ] Port 3001 tidak conflict
- [ ] CORS configured correctly
- [ ] Environment variables loaded

## 🗄️ Database

- [ ] SQLite3 installed
- [ ] Database file created: `wa_blast.db`
- [ ] All tables created successfully
- [ ] Database readable: `sqlite3 wa_blast.db "SELECT * FROM campaigns LIMIT 1;"`
- [ ] Backup strategy configured
- [ ] Write permissions on database folder

## 🔗 Webhook

- [ ] Webhook URL accessible
- [ ] Webhook setup berhasil: `npm run setup-webhook`
- [ ] Webhook verified: `npm run check-webhook`
- [ ] Events configured: message, message.ack, state.change
- [ ] Test webhook dengan reply pesan
- [ ] Reply tersimpan di database

## 🧪 Testing

- [ ] Basic tests pass: `npm test`
- [ ] Session status OK
- [ ] Statistics endpoint OK
- [ ] Campaign creation OK
- [ ] Message sending OK
- [ ] Reply monitoring OK
- [ ] Test dengan 1-2 nomor dulu

## 🎨 Dashboard

- [ ] Dashboard accessible
- [ ] Statistics loading correctly
- [ ] Session status showing
- [ ] Campaigns table working
- [ ] Create campaign form working
- [ ] Auto-refresh working (10s interval)

## 📊 Monitoring

- [ ] Dashboard shows real-time stats
- [ ] Logs readable: `npm run docker-logs`
- [ ] Error handling working
- [ ] Database query performance OK
- [ ] Memory usage acceptable
- [ ] CPU usage acceptable

## 🚀 Production (Optional)

### Reverse Proxy
- [ ] Nginx/Apache configured
- [ ] SSL certificate installed
- [ ] Domain pointing to server
- [ ] HTTPS working
- [ ] Webhook URL updated dengan HTTPS

### Process Manager
- [ ] PM2 installed: `npm install -g pm2`
- [ ] Server running via PM2: `pm2 start server.js --name waha-api`
- [ ] PM2 startup configured: `pm2 startup`
- [ ] PM2 auto-start on reboot

### Backup
- [ ] Database backup script
- [ ] Backup cron job configured
- [ ] Backup tested (restore)
- [ ] Backup storage configured
- [ ] waha_data backup included

### Performance
- [ ] Rate limiting configured
- [ ] Connection pooling OK
- [ ] Database indexes created
- [ ] Logs rotation configured
- [ ] Disk space monitoring

### High Availability
- [ ] Health check endpoint
- [ ] Auto-restart on failure
- [ ] Monitoring alerts configured
- [ ] Failover plan documented
- [ ] Recovery procedure tested

## 🛡️ Rate Limiting (Avoid Ban)

- [ ] Min delay 5 seconds antar pesan
- [ ] Max 50-100 pesan per jam
- [ ] Typing duration 2-5 seconds
- [ ] Variasi waktu pengiriman
- [ ] Monitoring banned status

## 📝 Documentation

- [ ] README.md up to date
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide complete
- [ ] Team trained on usage

## 🔄 Maintenance

- [ ] Update strategy planned
- [ ] Downtime maintenance window
- [ ] Database migration plan
- [ ] Rollback procedure documented
- [ ] Support contacts listed

## ✅ Pre-Launch Checklist

**Critical Items:**
- [ ] API Key secure & strong
- [ ] WhatsApp connected & stable
- [ ] Database working & backed up
- [ ] Webhook configured & tested
- [ ] All tests passing
- [ ] Dashboard accessible
- [ ] Team knows how to use

**Nice to Have:**
- [ ] Production domain configured
- [ ] SSL certificate active
- [ ] PM2 running server
- [ ] Backup automation
- [ ] Monitoring dashboard
- [ ] Alert system configured

## 🧪 Final Tests

### Test 1: Single Message
```bash
npm run test:campaign 628123456789
```
Expected: Message sent dengan typing indicator

### Test 2: Campaign
1. Create campaign via dashboard
2. Add 2-3 test numbers
3. Start campaign
4. Verify messages sent
5. Check database records

### Test 3: Reply Monitoring
1. Reply to test message from phone
2. Check dashboard "Balasan" tab
3. Verify reply in database
4. Mark as read
5. Verify unread count updates

### Test 4: Statistics
```bash
curl http://localhost:3001/api/statistics
```
Expected: All stats displayed correctly

### Test 5: Session Stability
1. Run for 24 hours
2. Monitor session status
3. Check for disconnections
4. Verify auto-reconnect
5. Check logs for errors

## 📞 Support Contacts

- **WAHA Support**: https://waha.devlike.pro
- **Server Admin**: [Your contact]
- **On-call**: [Emergency contact]
- **Documentation**: README.md

## 🎯 Success Criteria

✅ **All items checked**
✅ **Tests passing** 
✅ **No critical errors**
✅ **Team trained**
✅ **Backup configured**

## 🚨 Red Flags (Do NOT Deploy)

❌ Session disconnected
❌ Database errors
❌ Webhook not working
❌ Tests failing
❌ API Key weak/default
❌ No backup strategy

---

**Date:** ___________
**Deployed by:** ___________
**Verified by:** ___________

**Status:** 🟢 READY / 🟡 NEEDS WORK / 🔴 NOT READY