# WA Blast Pro (Native Node.js Version)

This project is a **WhatsApp Automation Tool** allowing you to blast messages (Text, Image, Video) to multiple contacts using `whatsapp-web.js`.

> **Update:** This project has been migrated from a Docker-based WAHA solution to a **native Node.js** implementation for better performance and easier setup.

## 🚀 Features
- **Native WhatsApp Integration**: Uses `whatsapp-web.js` (No Docker required).
- **Multi-Type Messaging**: Send **Text**, **Image**, and **Video**.
- **Campaign Management**: Create and track campaigns via database.
- **Smart Delays**:
  - **Fixed Delay**: Set a specific delay between messages.
  - **Random Delay**: Set a range (min-max) to avoid ban detection.
- **Dashboard**: Web Interface for scanning QR code and managing blasts.
- **API Support**: Full REST API for integration.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js installed (v16 or higher)
- Google Chrome installed (for Puppeteer)

### Quick Start
Simply run the included batch script:
```bash
start.bat
```
This script will:
1. Automatically install dependencies (`npm install`).
2. Start the server.

### Manual Start
```bash
npm install
node server.js
```

## 📱 Usage
1. Open your browser to `http://localhost:4000`.
2. Scan the **QR Code** with your WhatsApp.
3. Once connected, you can use the dashboard to start blasts.

## 📡 API Endpoints

### Status
- `GET /api/session-status`: Check connection status.
- `GET /api/qr-code`: Get QR code image.

### Sending Messages
- `POST /api/send-message`: Send a text message.
  ```json
  { "phone": "628123456789", "message": "Hello!" }
  ```
- `POST /api/send-media`: Send media (Image/Video).
  ```json
  { 
    "phone": "628123456789", 
    "mediaUrl": "https://example.com/image.jpg", 
    "type": "image", 
    "caption": "Check this out!" 
  }
  ```

### Blasting (Campaigns)
- `POST /api/blast/text`: Start a text blast.
- `POST /api/blast/image`: Start an image blast.

## 🧪 Testing
We include a robust test suite to verify functionality.

**Unit Tests** (Utility functions):
```bash
node test-unit.js
```

**End-to-End Tests**:
```bash
# Test All Features
node test-api.js all <PHONE_NUMBER>

# Test Media Sending
node test-api.js media <PHONE_NUMBER>
```

## 📂 Project Structure
- `server.js`: Main application server.
- `database.js`: SQLite database manager.
- `utils.js`: Utility functions.
- `public/`: Frontend dashboard files.
- `start.bat`: Quick start script for Windows.