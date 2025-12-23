require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const app = express();

// Try to import multer, but make it optional
let multer, upload;
try {
  multer = require('multer');
  // Configure multer for file uploads
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept images only
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  });
  console.log('✅ Multer loaded successfully');
} catch (error) {
  console.log('⚠️ Multer not found, upload features will be disabled');
  upload = {
    single: (fieldName) => (req, res, next) => {
      res.status(501).json({
        success: false,
        error: 'Upload feature not available. Please run "npm install" to install required dependencies.'
      });
    }
  };
}

// Increase payload limit for large images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Serve static files from public folder
app.use(express.static('public'));

// Helper function to format phone numbers
const { formatPhoneNumber } = require('./utils');

// ============ WHATSAPP-WEB.JS CLIENT ============
let qrCodeData = null;
let clientReady = false;
let clientStatus = 'INITIALIZING';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  }
});

client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  qrCodeData = qr;
  clientStatus = 'QR_READY';
});

client.on('ready', () => {
  console.log('✅ Client is ready!');
  clientReady = true;
  clientStatus = 'CONNECTED';
  qrCodeData = null;
});

client.on('authenticated', () => {
  console.log('✅ Client is authenticated!');
  clientStatus = 'AUTHENTICATED';
});

client.on('auth_failure', msg => {
  console.error('❌ AUTHENTICATION FAILURE', msg);
  clientStatus = 'AUTH_FAILURE';
});

client.on('disconnected', (reason) => {
  console.log('❌ Client was logged out', reason);
  clientReady = false;
  clientStatus = 'DISCONNECTED';
  // Client will usually try to reinitialize with LocalAuth, simply await new QR
  client.initialize();
});

client.on('message', async msg => {
  console.log('📩 Message received:', msg.body);
  // Future: Handle replies here
});

client.initialize();

// ============ API ENDPOINTS ============

app.get('/api/session-status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: clientStatus,
      ready: clientReady
    }
  });
});

app.get('/api/qr-code', async (req, res) => {
  if (clientReady) {
    return res.status(400).json({ error: 'Client is already ready' });
  }
  if (!qrCodeData) {
    return res.status(404).json({ error: 'QR code not generated yet' });
  }

  try {
    const qrImage = await qrcode.toBuffer(qrCodeData);
    res.type('png').send(qrImage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR image' });
  }
});

// Get sessions (Mocking multiple sessions support for frontend compatibility)
app.get('/api/sessions', (req, res) => {
  res.json({
    success: true,
    sessions: [
      {
        name: 'default',
        status: clientStatus === 'CONNECTED' ? 'WORKING' : 'STOPPED',
        me: client.info ? client.info.wid : null
      }
    ]
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'WhatsApp API is running',
    sessions: [
      {
        name: 'default',
        status: clientStatus === 'CONNECTED' ? 'WORKING' : 'STOPPED'
      }
    ]
  });
});

// Logout Endpoint
app.post('/api/logout', async (req, res) => {
  try {
    if (clientReady) {
      await client.logout();
      // Client disconnect event will handle state reset
      res.json({ success: true, message: 'Logged out successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Not logged in' });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unified Test Send Endpoint
app.post('/api/test/send', async (req, res) => {
  try {
    const { phoneNumber, message, type, imageUrl, caption, sessionName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    if (!clientReady) {
      return res.status(503).json({ success: false, error: 'WhatsApp client is not ready' });
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const chatId = `${formattedPhone}@c.us`;

    console.log(`🔍 Test send to ${formattedPhone} type: ${type}`);

    let response;
    if (type === 'image') {
      if (!imageUrl) return res.status(400).json({ success: false, error: 'Image URL required' });
      const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
      response = await client.sendMessage(chatId, media, { caption: message || caption || '' });
    } else {
      if (!message) return res.status(400).json({ success: false, error: 'Message required' });
      response = await client.sendMessage(chatId, message);
    }

    res.json({ success: true, data: { id: response.id._serialized } });

  } catch (error) {
    console.error('Test send error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Original Send Message API (kept for compatibility if needed)
app.post('/api/send-message', async (req, res) => {
  try {
    const { phone, message, typingDuration } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    if (!clientReady) {
      return res.status(503).json({ success: false, error: 'WhatsApp client is not ready' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const chatId = `${formattedPhone}@c.us`;

    const response = await client.sendMessage(chatId, message);

    res.json({ success: true, data: { id: response.id._serialized } });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/send-media', async (req, res) => {
  try {
    const { phone, mediaUrl, caption, type } = req.body;

    if (!phone || !mediaUrl) {
      return res.status(400).json({ success: false, error: 'Phone and mediaUrl are required' });
    }

    if (!clientReady) {
      return res.status(503).json({ success: false, error: 'WhatsApp client is not ready' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    const chatId = `${formattedPhone}@c.us`;

    console.log(`📤 Sending media (${type || 'unknown'}) to ${formattedPhone}`);

    const media = await MessageMedia.fromUrl(mediaUrl, { unsafeMime: true });
    const response = await client.sendMessage(chatId, media, { caption: caption || '' });

    res.json({ success: true, data: { id: response.id._serialized } });

  } catch (error) {
    console.error('Error sending media:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============ CAMPAIGN ENDPOINTS ============

// Helper to parse delay config
function parseDelayConfig(delayConfig) {
  let delayMin = 0;
  let delayMax = 5000;

  if (delayConfig) {
    if (delayConfig.type === 'random') {
      delayMin = parseInt(delayConfig.min) || 1000;
      delayMax = parseInt(delayConfig.max) || 5000;
    } else if (delayConfig.type === 'fix') {
      delayMax = parseInt(delayConfig.value) || 5000;
      delayMin = 0; // 0 means fixed delay of delayMax
    }
  }
  return { delayMin, delayMax };
}

// Helper to process phone numbers string
function parsePhoneNumbers(phoneString) {
  if (!phoneString) return [];
  return phoneString.split(/[\n,;|]/).map(p => p.trim()).filter(p => p.length > 5);
}

// Upload Image Endpoint
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image file provided' });
  }

  // In a real app, you'd save to disk or cloud. 
  // Here we'll just return a success since we are using local media for blast (or logic needs update).
  // Wait, the frontend sends this URL back to /blast/image.
  // So we need to ensure the URL is accessible.
  // Server is serving 'public'. We should save the file there.
  // But since we are using multer memory storage (or file storage if configured), let's fix multer to save to disk.

  // Quick fix: Write buffer to file in public/uploads
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, 'public', 'uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filename = `upload_${Date.now()}_${Math.round(Math.random() * 1000)}.png`; // Simpler extension handling
  const filepath = path.join(uploadsDir, filename);

  try {
    fs.writeFileSync(filepath, req.file.buffer);
    const fileUrl = `/uploads/${filename}`; // Relative URL
    // Host needs to be constructed. Ideally return full URL or relative if frontend handles it.
    // Frontend uses it in fetch, so relative is fine for browser, but server needs logic to read.
    // Actually server reads via MessageMedia.fromUrl. If it's a local file path, better to return full URL.
    const fullUrl = `http://localhost:${PORT}${fileUrl}`;

    res.json({
      success: true,
      imageId: filename,
      imageUrl: fullUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save file: ' + err.message });
  }
});

// Blast Text Endpoint
app.post('/api/blast/text', (req, res) => {
  const { phoneNumbers, message, delayConfig, campaignName, sessionName } = req.body;

  if (!phoneNumbers || !message) {
    return res.status(400).json({ success: false, error: 'Phone numbers and message are required' });
  }

  const contacts = parsePhoneNumbers(phoneNumbers);
  const { delayMin, delayMax } = parseDelayConfig(delayConfig);

  db.createCampaign({
    name: campaignName || `Text Campaign ${new Date().toLocaleString()}`,
    message,
    type: 'text',
    totalTargets: contacts.length,
    typingDuration: 2000,
    delayBetweenMessages: delayMax,
    delayMin: delayMin,
    sessionName: sessionName || 'default',
  }, (err, campaignId) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    let completed = 0;
    contacts.forEach((phone) => {
      db.createMessage({
        campaignId,
        phoneNumber: phone,
        message: message,
        status: 'pending',
      }, () => {
        completed++;
        if (completed === contacts.length) {
          // Start immediately
          db.updateCampaignStatus(campaignId, 'running', () => { });
          processCampaign(campaignId, {
            name: campaignName,
            type: 'text',
            delay_between_messages: delayMax,
            delay_min: delayMin
          });

          res.json({ success: true, campaignId, total: contacts.length, message: 'Campaign started' });
        }
      });
    });
  });
});

// Blast Image Endpoint
app.post('/api/blast/image', (req, res) => {
  const { phoneNumbers, imageUrl, message, delayConfig, campaignName, sessionName } = req.body;

  if (!phoneNumbers || !imageUrl) {
    return res.status(400).json({ success: false, error: 'Phone numbers and image URL are required' });
  }

  const contacts = parsePhoneNumbers(phoneNumbers);
  const { delayMin, delayMax } = parseDelayConfig(delayConfig);

  db.createCampaign({
    name: campaignName || `Image Campaign ${new Date().toLocaleString()}`,
    message: message || '', // Caption
    imageUrl: imageUrl,
    caption: message || '',
    type: 'image',
    totalTargets: contacts.length,
    typingDuration: 2000,
    delayBetweenMessages: delayMax,
    delayMin: delayMin,
    sessionName: sessionName || 'default',
  }, (err, campaignId) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    let completed = 0;
    contacts.forEach((phone) => {
      db.createMessage({
        campaignId,
        phoneNumber: phone,
        message: message || '',
        status: 'pending',
      }, () => {
        completed++;
        if (completed === contacts.length) {
          // Start immediately
          db.updateCampaignStatus(campaignId, 'running', () => { });
          processCampaign(campaignId, {
            name: campaignName,
            type: 'image',
            image_url: imageUrl, // Pass image url
            delay_between_messages: delayMax,
            delay_min: delayMin
          });

          res.json({ success: true, campaignId, total: contacts.length, message: 'Campaign started' });
        }
      });
    });
  });
});


app.post('/api/campaigns', (req, res) => {
  const { name, message, imageUrl, caption, type, contacts, typingDuration, delayBetweenMessages } = req.body;

  if (!name || !contacts || contacts.length === 0) {
    return res.status(400).json({ success: false, error: 'Name and contacts are required' });
  }

  db.createCampaign({
    name,
    message,
    imageUrl,
    caption,
    type: type || 'text',
    totalTargets: contacts.length,
    typingDuration: typingDuration || 3000,
    delayBetweenMessages: delayBetweenMessages || 5000,
    delayMin: 0, // Default to fixed
    sessionName: 'default',
  }, (err, campaignId) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    let completed = 0;
    contacts.forEach((phone) => {
      db.createMessage({
        campaignId,
        phoneNumber: phone,
        message: type === 'text' ? message : caption,
        status: 'pending',
      }, (err) => {
        completed++;
        if (completed === contacts.length) {
          res.json({ success: true, campaignId, message: 'Campaign created successfully' });
        }
      });
    });
  });
});

app.get('/api/campaigns', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  db.getCampaigns(limit, (err, campaigns) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: campaigns });
  });
});

app.get('/api/campaigns/:id', (req, res) => {
  db.getCampaignById(req.params.id, (err, campaign) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: campaign });
  });
});

app.post('/api/campaigns/:id/start', async (req, res) => {
  const campaignId = req.params.id;
  db.getCampaignById(campaignId, async (err, campaign) => {
    if (err || !campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    db.updateCampaignStatus(campaignId, 'running', (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
    });

    res.json({ success: true, message: 'Campaign started' });
    processCampaign(campaignId, campaign);
  });
});

async function processCampaign(campaignId, campaign) {
  console.log(`🚀 Starting campaign: ${campaign.name}`);

  if (!clientReady) {
    console.log('⚠️ Client not ready, pausing campaign processing (simple handler)');
    return;
  }

  db.getPendingMessages(campaignId, async (err, messages) => {
    if (err || !messages || messages.length === 0) {
      db.updateCampaignStatus(campaignId, 'completed', () => { });
      return;
    }

    for (let i = 0; i < messages.length; i++) {

      // --- DELAY LOGIC START ---
      if (i > 0) {
        const min = campaign.delay_min || 0;
        const max = campaign.delay_between_messages || 5000;
        let delay;

        if (min > 0 && max > min) {
          // Random delay
          delay = Math.floor(Math.random() * (max - min + 1)) + min;
          console.log(`⏱️ Random delay: ${delay}ms`);
        } else {
          // Fixed delay
          delay = max;
          console.log(`⏱️ Fixed delay: ${delay}ms`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
      // --- DELAY LOGIC END ---

      const msg = messages[i];
      const formattedPhone = formatPhoneNumber(msg.phone_number);
      const chatId = `${formattedPhone}@c.us`;

      try {
        console.log(`📤 Sending message ${i + 1}/${messages.length} to ${msg.phone_number}`);

        // Typing indicator simulation
        if (campaign.typing_duration && campaign.typing_duration > 0) {
          // await client.sendPresenceAvailable(); // Optional
          // await new Promise(resolve => setTimeout(resolve, 500));
        }

        let response;
        if (campaign.type === 'text') {
          response = await client.sendMessage(chatId, msg.message);
        } else if (campaign.type === 'image') {
          // Handle local uploads or remote URLs
          let media;
          if (campaign.image_url && campaign.image_url.startsWith('http')) {
            media = await MessageMedia.fromUrl(campaign.image_url, { unsafeMime: true });
          } else {
            // Assuming base64 or local path fallback, but implementation mainly supports URLs currently.
            // If implementation above saves as http://localhost..., it passes here.
          }

          if (media) {
            response = await client.sendMessage(chatId, media, { caption: msg.message });
          } else {
            throw new Error('Invalid image URL');
          }
        }

        db.updateMessageStatus(msg.id, 'sent', response.id._serialized, null, () => { });
        db.updateCampaignStats(campaignId, () => { });
        db.upsertContact(msg.phone_number, null, () => { });
        db.updateContactStats(msg.phone_number, () => { });

      } catch (error) {
        console.error(`❌ Error sending to ${msg.phone_number}:`, error.message);
        db.updateMessageStatus(msg.id, 'failed', null, error.message, () => { });
      }
    }

    db.updateCampaignStatus(campaignId, 'completed', () => { });
    db.updateCampaignStats(campaignId, () => { });
    console.log(`✅ Campaign finished: ${campaign.name}`);
  });
}

app.post('/api/campaigns/:id/stop', (req, res) => {
  db.updateCampaignStatus(req.params.id, 'stopped', (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Campaign stopped' });
  });
});

app.delete('/api/campaigns/:id', (req, res) => {
  db.deleteCampaign(req.params.id, (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Campaign deleted' });
  });
});

// ============ OTHER ENDPOINTS ============
app.get('/api/contacts', (req, res) => {
  db.getContacts((err, contacts) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: contacts });
  });
});

app.get('/api/statistics', (req, res) => {
  db.getStatistics((err, stats) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: stats });
  });
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});