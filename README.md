# 📱 WA Blast Pro - WhatsApp Marketing Tool

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/Node.js-18+-green.svg" alt="Node.js">
  <img src="https://img.shields.io/badge/WhatsApp-API-WAHA%20Plus-orange.svg" alt="WAHA Plus">
  <img src="https://img.shields.io/badge/Database-SQLite-3-brightgreen.svg" alt="SQLite">
</p>

A powerful WhatsApp marketing and bulk messaging tool built with Node.js, powered by WAHA Plus API. Features typing indicators, inline image sending, campaign management, and real-time tracking.

## ✨ Features

### 🚀 Core Functionality
- **Bulk Message Blasting**: Send text and image messages to multiple contacts
- **Campaign Management**: Create, track, and manage marketing campaigns
- **Typing Indicators**: Simulate real typing experience for better engagement
- **Inline Image Support**: Send images as media files (not attachments)
- **Real-time Progress Tracking**: Monitor campaign progress in real-time
- **Contact Management**: Block/unblock contacts and view interaction history

### 📊 Analytics & Tracking
- **Campaign Statistics**: View sent, delivered, and failed message counts
- **Reply Tracking**: Monitor incoming replies and conversations
- **Contact Analytics**: Track message history per contact
- **Success Rate Metrics**: Monitor campaign effectiveness

### 🔧 Technical Features
- **RESTful API**: Clean and well-documented API endpoints
- **SQLite Database**: Lightweight, fast, and reliable data storage
- **File Upload Support**: Direct image upload with temporary storage
- **Docker Support**: Easy deployment with Docker/Docker Compose
- **Webhook Integration**: Real-time message status updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- WAHA Plus running on your system (localhost:5000 by default)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wa-blast-pro.git
   cd wa-blast-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your WAHA configuration
   ```

4. **Start the server**
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

5. **Access the application**
   - Main Interface: http://localhost:4000
   - Dashboard: http://localhost:4000/dashboard.html
   - Test Page: http://localhost:4000/test.html

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# WAHA Plus Configuration
WAHA_URL=http://localhost:5000
WAHA_API_KEY=your-secret-api-key-here
SESSION_NAME=default

# Server Configuration
PORT=4000
```

### WAHA Plus Setup

1. **Install and run WAHA Plus** (if not already running)
2. **Configure API Key** in WAHA Plus dashboard
3. **Set up Webhook** to point to your server:
   ```
   Webhook URL: http://your-server-ip:4000/api/webhook
   ```

## 📖 Usage Guide

### 1. Text Message Blast
- Go to the "📝 Blast Teks" tab
- Enter campaign name, target phone numbers, and message
- Configure delay settings (fixed or random)
- Click "🚀 Mulai Blast Teks"

### 2. Image Message Blast
- Use the "🖼️ Blast Gambar" tab
- Provide image URL or use the upload feature
- Add caption and target numbers
- Configure delivery settings

### 3. Upload & Blast
- Use the "📤 Upload & Blast" tab
- Upload images directly (max 10MB)
- System converts images to accessible URLs
- Send with inline media format

### 4. Campaign Management
- View all campaigns in the dashboard
- Start/stop campaigns as needed
- Monitor real-time progress and statistics

## 🔌 API Endpoints

### Authentication
All endpoints require the WAHA API key to be configured in the environment variables.

### Campaign Management
```http
POST   /api/campaigns          # Create new campaign
GET    /api/campaigns          # List all campaigns
GET    /api/campaigns/:id      # Get campaign by ID
POST   /api/campaigns/:id/start # Start campaign
POST   /api/campaigns/:id/stop  # Stop campaign
DELETE /api/campaigns/:id      # Delete campaign
```

### Message Operations
```http
POST   /api/send-message       # Send single message
POST   /api/test/send         # Test message sending
POST   /api/blast/text         # Bulk text blast
POST   /api/blast/image        # Bulk image blast
POST   /api/upload-image      # Upload image file
```

### Media & Content
```http
GET    /api/temp-images/:id   # Access uploaded images
GET    /api/qr-code          # Get WhatsApp QR code
GET    /api/session-status    # Check WhatsApp session
```

### Data & Analytics
```http
GET    /api/statistics        # Campaign statistics
GET    /api/contacts         # Contact list
GET    /api/replies/unread   # Unread replies
GET    /api/webhook           # Webhook endpoint
```

## 📊 Dashboard Features

### Campaign Overview
- View all campaigns with status indicators
- Quick actions (start, stop, delete)
- Real-time statistics display

### Message Tracking
- Real-time delivery progress
- Success/failure rates
- Individual message status
- Reply tracking

### Contact Management
- Contact list with interaction history
- Block/unblock functionality
- Message statistics per contact

## 🔧 Development

### Project Structure
```
├── public/                 # Frontend files
│   ├── index.html          # Main application
│   ├── dashboard.html       # Dashboard interface
│   └── *.html              # Additional pages
├── database.js            # SQLite database operations
├── server.js              # Express server and API
├── test-api.js            # API testing utilities
└── package.json           # Project configuration
```

### Running Tests
```bash
# Basic API test
npm test

# Comprehensive test suite
npm run test:all

# Campaign testing
npm run test:campaign

# View test options
npm run test:help
```

### Docker Deployment
```bash
# Build and start containers
npm run docker-up

# View logs
npm run docker-logs

# Stop containers
npm run docker-down
```

## 🔌 Network Configuration

### Docker Setup
If running WAHA Plus in Docker:
1. Update the server configuration to use your network IP
2. Ensure Docker can access your local server
3. Configure webhook URLs accordingly

### Webhook Configuration
Set up webhooks in WAHA Plus to receive:
- Message delivery confirmations
- Read receipts
- Incoming replies
- Error notifications

## 🛡️ Security Considerations

- **API Key Protection**: Always secure your WAHA API key
- **Rate Limiting**: Implement appropriate rate limiting for production
- **Data Privacy**: Comply with WhatsApp's terms of service
- **Network Security**: Use HTTPS in production environments

## 🐛 Docker Support

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4000

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  wa-blast:
    build: .
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - WAHA_URL=http://waha-plus:5000
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

## 📈 Monitoring & Logging

### Server Logs
- Console logging for all operations
- Error tracking and reporting
- Campaign progress monitoring
- Webhook event logging

### Database Management
```bash
# Backup database
npm run backup-db

# Database file location
./wa_blast.db
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **WAHA Connection**: Ensure WAHA Plus is running and accessible
- **Image Upload**: Check file size limits (10MB max)
- **Docker Networking**: Verify network IP configuration
- **Database**: Check SQLite file permissions

### Getting Help
- Check the console logs for detailed error messages
- Verify WAHA Plus configuration
- Ensure all dependencies are installed
- Test with single messages before bulk operations

## 🚀 Roadmap

- [ ] Message scheduling functionality
- [ ] Template management system
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] WhatsApp Business API integration
- [ ] Cloud deployment options

## 📞 API Reference

### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": {...},
  "error": null
}
```

### Error Handling
```json
{
  "success": false,
  "error": "Error description",
  "hint": "Troubleshooting suggestion"
}
```

---

<p align="center">
  Made with ❤️ for WhatsApp automation
</p>

<p align="center">
  <strong>WAHA Plus Integration • Node.js • Express • SQLite</strong>
</p>