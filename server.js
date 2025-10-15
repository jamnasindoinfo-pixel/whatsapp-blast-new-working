require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const db = require('./database');
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
  console.log('💡 Run "npm install" to install multer for upload features');
  // Create a dummy upload middleware
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

// Tambahkan CSP middleware di sini
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  next();
});

// Serve static files dari folder public
app.use(express.static('public'));

// Temporary storage for uploaded images
const uploadedImages = new Map();

// Generate unique ID for uploaded images
function generateImageId() {
    return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Helper function to format and clean phone numbers
function formatPhoneNumber(phone) {
    let formatted = phone.toString().trim();

    // Remove all non-digit characters except +
    formatted = formatted.replace(/[^\d+]/g, '');

    // Remove spaces, slashes, quotes, and other invalid characters
    formatted = formatted.replace(/[\s\/'"]/g, '');

    // Handle Indonesian numbers
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.substring(1);
    }

    // Remove leading 62 if already present and add 62 (to avoid duplicates)
    if (formatted.startsWith('62') && !formatted.startsWith('628')) {
        formatted = '62' + formatted.substring(2);
    }

    // Ensure it starts with 62 for Indonesian numbers
    if (!formatted.startsWith('+') && !formatted.startsWith('62')) {
        formatted = '62' + formatted;
    }

    return formatted;
}

// Serve uploaded images
app.get('/temp-images/:id', (req, res) => {
    const imageId = req.params.id;
    const imageData = uploadedImages.get(imageId);
    
    if (!imageData) {
        return res.status(404).json({ error: 'Image not found' });
    }
    
    res.set('Content-Type', imageData.mimeType);
    res.set('Cache-Control', 'no-cache');
    res.send(imageData.buffer);
});

// Clean up old images every hour
const oneHour = 60 * 60 * 1000;
setInterval(() => {
    const now = Date.now();
    
    for (const [id, data] of uploadedImages.entries()) {
        if (now - data.timestamp > oneHour) {
            uploadedImages.delete(id);
            console.log('🗑️ Cleaned up old image:', id);
        }
    }
}, oneHour);

// Route untuk root
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Konfigurasi WAHA Plus
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:5000';
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'your-secret-api-key-here';
const SESSION_NAME = process.env.SESSION_NAME || 'default';

// Helper function untuk mengirim typing indicator
async function sendTypingIndicator(sessionName, chatId, duration = 3000) {
  try {
    console.log(`📝 Sending typing indicator for session: ${sessionName} to ${chatId}`);

    // Kirim status typing menggunakan WAHA endpoint yang benar
    await axios.post(
      `${WAHA_URL}/api/sendTyping`,
      {
        session: sessionName,
        chatId: chatId,
        duration: duration,
        textMessage: null // Optional, untuk simulasi typing yang lebih realistis
      },
      {
        headers: {
          'X-Api-Key': WAHA_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Typing indicator sent for session: ${sessionName}`);
  } catch (error) {
    console.error('❌ Error sending typing indicator:', error.message);
    // Jangan throw error, biarkan proses lanjut tanpa typing indicator
    console.log('⚠️ Continuing without typing indicator...');
  }
}

// Fungsi untuk mengirim pesan dengan typing indicator
async function sendMessageWithTyping(sessionName, chatId, message, messageId, typingDuration = 3000) {
  try {
    // Kirim typing indicator
    await sendTypingIndicator(sessionName, chatId, typingDuration);

    // Kirim pesan
    const response = await axios.post(
      `${WAHA_URL}/api/sendText`,
      {
        session: sessionName,
        chatId: chatId,
        text: message,
      },
      {
        headers: {
          'X-Api-Key': WAHA_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Update status di database
    if (messageId) {
      db.updateMessageStatus(messageId, 'sent', response.data.id, null, (err) => {
        if (err) console.error('Error updating message status:', err);
      });
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    // Update status failed di database
    if (messageId) {
      db.updateMessageStatus(messageId, 'failed', null, error.message, (err) => {
        if (err) console.error('Error updating message status:', err);
      });
    }
    throw error;
  }
}

// Fungsi untuk mengirim media dengan typing indicator
async function sendMediaWithTyping(sessionName, chatId, mediaUrl, caption, messageId, typingDuration = 3000) {
  try {
    // Kirim typing indicator
    await sendTypingIndicator(sessionName, chatId, typingDuration);
    
    // Kirim media sebagai inline media (bukan attachment)
    // Convert localhost URLs to network IP for Docker compatibility
    const finalMediaUrl = mediaUrl.startsWith('http://localhost') ?
      mediaUrl.replace('localhost', '192.168.18.171') : mediaUrl;

    console.log('🔗 Using media URL for WAHA:', finalMediaUrl);

    const response = await axios.post(
      `${WAHA_URL}/api/sendImage`,
      {
        session: sessionName,
        chatId: chatId,
        file: {
          url: finalMediaUrl,
          filename: 'image.jpg',
          mimetype: 'image/jpeg'
        },
        caption: caption || '',
        reply_to: null
      },
      {
        headers: {
          'X-Api-Key': WAHA_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    // Update status di database
    if (messageId) {
      db.updateMessageStatus(messageId, 'sent', response.data.id, null, (err) => {
        if (err) console.error('Error updating message status:', err);
      });
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    // Update status failed di database
    if (messageId) {
      db.updateMessageStatus(messageId, 'failed', null, error.message, (err) => {
        if (err) console.error('Error updating message status:', err);
      });
    }
    throw error;
  }
}

// ============ CAMPAIGN ENDPOINTS ============

// Buat campaign baru
app.post('/api/campaigns', (req, res) => {
  const { name, message, imageUrl, caption, type, contacts, typingDuration, delayBetweenMessages, sessionName } = req.body;

  if (!name || !contacts || contacts.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Name dan contacts harus diisi',
    });
  }

  // Buat campaign
  db.createCampaign({
    name,
    message,
    imageUrl,
    caption,
    type: type || 'text',
    totalTargets: contacts.length,
    typingDuration: typingDuration || 3000,
    delayBetweenMessages: delayBetweenMessages || 5000,
    sessionName: sessionName || SESSION_NAME,
  }, (err, campaignId) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    // Buat messages untuk setiap contact
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
          res.json({
            success: true,
            campaignId,
            message: 'Campaign berhasil dibuat',
          });
        }
      });
    });
  });
});

// Get semua campaigns
app.get('/api/campaigns', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  
  db.getCampaigns(limit, (err, campaigns) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: campaigns });
  });
});

// Get campaign by ID
app.get('/api/campaigns/:id', (req, res) => {
  const campaignId = req.params.id;
  
  db.getCampaignById(campaignId, (err, campaign) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign tidak ditemukan' });
    }
    res.json({ success: true, data: campaign });
  });
});

// Start campaign
app.post('/api/campaigns/:id/start', async (req, res) => {
  const campaignId = req.params.id;
  const { sessionName } = req.body;

  // Get campaign details
  db.getCampaignById(campaignId, async (err, campaign) => {
    if (err || !campaign) {
      return res.status(404).json({ success: false, error: 'Campaign tidak ditemukan' });
    }

    // Update status menjadi running
    db.updateCampaignStatus(campaignId, 'running', (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
    });

    res.json({ success: true, message: 'Campaign dimulai' });

    // Proses pengiriman di background
    const sessionToUse = sessionName || campaign.sessionName || SESSION_NAME;
    processCampaign(campaignId, campaign, sessionToUse);
  });
});

// Fungsi untuk memproses campaign
async function processCampaign(campaignId, campaign, sessionName = SESSION_NAME) {
  console.log(`🚀 Memulai campaign: ${campaign.name} (session: ${sessionName})`);

  // Get pending messages
  db.getPendingMessages(campaignId, async (err, messages) => {
    if (err || !messages || messages.length === 0) {
      db.updateCampaignStatus(campaignId, 'completed', () => {});
      return;
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const cleanPhone = formatPhoneNumber(msg.phone_number);
      const chatId = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;

      console.log(`📱 Processing phone: ${msg.phone_number} -> ${chatId}`);

      try {
        console.log(`📤 Mengirim pesan ${i + 1}/${messages.length} ke ${msg.phone_number}`);

        if (campaign.type === 'text') {
          await sendMessageWithTyping(sessionName, chatId, msg.message, msg.id, campaign.typing_duration);
        } else if (campaign.type === 'image') {
          await sendMediaWithTyping(sessionName, chatId, campaign.image_url, msg.message, msg.id, campaign.typing_duration);
        }

        // Update campaign stats
        db.updateCampaignStats(campaignId, () => {});

        // Update contact
        db.upsertContact(msg.phone_number, null, () => {});
        db.updateContactStats(msg.phone_number, () => {});

        // Delay sebelum pesan berikutnya
        if (i < messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, campaign.delay_between_messages));
        }
      } catch (error) {
        console.error(`❌ Error mengirim ke ${msg.phone_number}:`, error.message);
      }
    }

    // Update status campaign menjadi completed
    db.updateCampaignStatus(campaignId, 'completed', () => {});
    db.updateCampaignStats(campaignId, () => {});
    console.log(`✅ Campaign selesai: ${campaign.name}`);
  });
}

// Stop campaign
app.post('/api/campaigns/:id/stop', (req, res) => {
  const campaignId = req.params.id;
  
  db.updateCampaignStatus(campaignId, 'stopped', (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Campaign dihentikan' });
  });
});

// Delete campaign
app.delete('/api/campaigns/:id', (req, res) => {
  const campaignId = req.params.id;
  
  db.deleteCampaign(campaignId, (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Campaign dihapus' });
  });
});

// ============ MESSAGE ENDPOINTS ============

// Get messages by campaign
app.get('/api/campaigns/:id/messages', (req, res) => {
  const campaignId = req.params.id;
  
  db.getMessagesByCampaign(campaignId, (err, messages) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: messages });
  });
});

// Get messages by phone
app.get('/api/messages/phone/:phone', (req, res) => {
  const phone = req.params.phone;
  
  db.getMessagesByPhone(phone, (err, messages) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: messages });
  });
});

// ============ REPLY ENDPOINTS ============

// Get replies by campaign
app.get('/api/campaigns/:id/replies', (req, res) => {
  const campaignId = req.params.id;
  
  db.getRepliesByCampaign(campaignId, (err, replies) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: replies });
  });
});

// Get unread replies
app.get('/api/replies/unread', (req, res) => {
  db.getUnreadReplies((err, replies) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: replies });
  });
});

// Mark reply as read
app.post('/api/replies/:id/read', (req, res) => {
  const replyId = req.params.id;
  
  db.markReplyAsRead(replyId, (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Reply ditandai sudah dibaca' });
  });
});

// ============ CONTACT ENDPOINTS ============

// Get all contacts
app.get('/api/contacts', (req, res) => {
  db.getContacts((err, contacts) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: contacts });
  });
});

// Block contact
app.post('/api/contacts/:phone/block', (req, res) => {
  const phone = req.params.phone;
  
  db.blockContact(phone, (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'Kontak diblokir' });
  });
});

// ============ STATISTICS ENDPOINTS ============

// Get statistics
app.get('/api/statistics', (req, res) => {
  db.getStatistics((err, stats) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: stats });
  });
});

// ============ SINGLE MESSAGE ENDPOINTS ============

// Kirim pesan single
app.post('/api/send-message', async (req, res) => {
  try {
    const { phone, message, typingDuration, sessionName } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone dan message harus diisi',
      });
    }

    const cleanPhone = formatPhoneNumber(phone);
    const chatId = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;

    console.log('📱 Formatted chatId:', chatId);

    const sessionToUse = sessionName || SESSION_NAME;
    const result = await sendMessageWithTyping(sessionToUse, chatId, message, null, typingDuration || 3000);

    res.json(result);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============ DYNAMIC SESSION MANAGEMENT ENDPOINTS ============

// Get all available sessions from WAHA
app.get('/api/sessions', async (req, res) => {
  try {
    const { url } = req.query;
    const wahaUrl = url || WAHA_URL;

    console.log('📡 Fetching sessions from WAHA:', wahaUrl);

    const response = await axios.get(`${wahaUrl}/api/sessions`, {
      headers: {
        'X-Api-Key': WAHA_API_KEY,
      },
    });

    res.json({
      success: true,
      sessions: response.data,
      wahaUrl: wahaUrl
    });
  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Pastikan WAHA Plus berjalan dan API key benar'
    });
  }
});

// Get specific session details
app.get('/api/sessions/:sessionName', async (req, res) => {
  try {
    const { url } = req.query;
    const sessionName = req.params.sessionName;
    const wahaUrl = url || WAHA_URL;

    console.log(`🔍 Checking session: ${sessionName} from ${wahaUrl}`);

    const response = await axios.get(`${wahaUrl}/api/sessions/${sessionName}`, {
      headers: {
        'X-Api-Key': WAHA_API_KEY,
      },
    });

    res.json({
      success: true,
      session: response.data,
      wahaUrl: wahaUrl
    });
  } catch (error) {
    console.error('Error checking session:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============ WAHA SESSION ENDPOINTS ============

// Cek status sesi (legacy endpoint)
app.get('/api/session-status', async (req, res) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/sessions/${SESSION_NAME}`, {
      headers: {
        'X-Api-Key': WAHA_API_KEY,
      },
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get QR code (legacy endpoint)
app.get('/api/qr-code', async (req, res) => {
  try {
    const response = await axios.get(
      `${WAHA_URL}/api/sessions/${SESSION_NAME}/qr`,
      {
        headers: {
          'X-Api-Key': WAHA_API_KEY,
        },
        responseType: 'arraybuffer',
      }
    );

    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============ WEBHOOK ENDPOINT ============

// Webhook untuk menerima pesan masuk
app.post('/api/webhook', async (req, res) => {
  try {
    const webhook = req.body;
    console.log('📥 Webhook received:', webhook.event);

    // Proses webhook berdasarkan event
    if (webhook.event === 'message') {
      const message = webhook.payload;
      
      // Cek apakah ini balasan dari campaign
      if (message.from && !message.fromMe) {
        const phoneNumber = message.from.split('@')[0];
        
        // Cari message terakhir yang dikirim ke nomor ini
        db.getMessagesByPhone(phoneNumber, (err, messages) => {
          if (!err && messages && messages.length > 0) {
            const lastMessage = messages[0];
            
            // Simpan reply ke database
            db.createReply({
              messageId: lastMessage.id,
              campaignId: lastMessage.campaign_id,
              phoneNumber: phoneNumber,
              replyText: message.body || '',
              replyType: message.type || 'text',
              mediaUrl: message.mediaUrl || null,
              wahaReplyId: message.id,
            }, (err, replyId) => {
              if (!err) {
                console.log(`✅ Reply tersimpan dari ${phoneNumber}`);
                
                // Update campaign stats
                if (lastMessage.campaign_id) {
                  db.updateCampaignStats(lastMessage.campaign_id, () => {});
                }
                
                // Update contact stats
                db.updateContactStats(phoneNumber, () => {});
              }
            });
          }
        });
      }
    }

    // Update status message berdasarkan webhook
    if (webhook.event === 'message.ack') {
      const ack = webhook.payload;
      
      // Cari message berdasarkan waha_message_id
      db.db.get(
        'SELECT * FROM messages WHERE waha_message_id = ?',
        [ack.id],
        (err, message) => {
          if (!err && message) {
            let status = message.status;
            
            // Update status berdasarkan ack
            if (ack.ack === 1) status = 'sent';
            else if (ack.ack === 2) status = 'delivered';
            else if (ack.ack === 3) status = 'read';
            
            db.updateMessageStatus(message.id, status, null, null, (err) => {
              if (!err && message.campaign_id) {
                db.updateCampaignStats(message.campaign_id, () => {});
              }
            });
          }
        }
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============ CONFIG ENDPOINTS ============

// Get config
app.get('/api/config', (req, res) => {
  res.json({
    wahaUrl: WAHA_URL,
    sessionName: SESSION_NAME,
    apiKey: WAHA_API_KEY ? '***' : '',
    wahaVersion: 'plus',
    typingEnabled: true,
    typingDuration: 3000
  });
});

// Save config
app.post('/api/config', (req, res) => {
  // Config disimpan di .env, jadi hanya return success
  res.json({
    success: true,
    message: 'Konfigurasi disimpan! Restart server untuk apply perubahan.'
  });
});

// ============ TEST ENDPOINTS ============

// Test connection
app.get('/api/test', async (req, res) => {
  try {
    const response = await axios.get(`${WAHA_URL}/api/sessions`, {
      headers: {
        'X-Api-Key': WAHA_API_KEY,
      },
    });

    res.json({
      success: true,
      sessions: response.data,
      wahaUrl: WAHA_URL
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Pastikan WAHA Plus berjalan di ' + WAHA_URL
    });
  }
});

// Test send message
app.post('/api/test/send', async (req, res) => {
  try {
    const { phoneNumber, message, type, imageUrl, sessionName } = req.body;
    
    console.log('📤 Test send request:', { phoneNumber, message, type, imageUrl });
    
    // Format nomor
    const cleanPhone = formatPhoneNumber(phoneNumber);
    const chatId = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@c.us`;
    
    console.log('📱 Formatted chatId:', chatId);

    const sessionToUse = sessionName || SESSION_NAME;

    if (type === 'image' && imageUrl) {
      // Use network URL if provided (for WAHA Docker compatibility)
      const finalImageUrl = imageUrl.startsWith('http://localhost') ?
        imageUrl.replace('localhost', '192.168.18.171') : imageUrl;

      console.log('🔗 Using image URL for WAHA:', finalImageUrl);

      // Kirim gambar sebagai inline image
      const response = await axios.post(
        `${WAHA_URL}/api/sendImage`,
        {
          session: sessionToUse,
          chatId: chatId,
          file: {
            url: finalImageUrl,
            filename: 'image.jpg',
            mimetype: 'image/jpeg'
          },
          caption: message || '',
          reply_to: null
        },
        {
          headers: {
            'X-Api-Key': WAHA_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('✅ Image sent:', response.data);
      
      res.json({
        success: true,
        phone: phoneNumber,
        message: 'Gambar berhasil dikirim',
        data: response.data
      });
    } else {
      // Kirim text
      const response = await axios.post(
        `${WAHA_URL}/api/sendText`,
        {
          session: sessionToUse,
          chatId: chatId,
          text: message,
        },
        {
          headers: {
            'X-Api-Key': WAHA_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('✅ Text sent:', response.data);
      
      res.json({
        success: true,
        phone: phoneNumber,
        message: 'Pesan berhasil dikirim',
        data: response.data
      });
    }
  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data || null,
      hint: 'Pastikan WAHA Plus berjalan dan session WhatsApp aktif (sudah scan QR)'
    });
  }
});

// ============ BLAST ENDPOINTS ============

// Blast text
app.post('/api/blast/text', async (req, res) => {
  try {
    const { phoneNumbers, message, delayConfig, campaignName, sessionName } = req.body;
    
    if (!phoneNumbers || !message) {
      return res.status(400).json({
        success: false,
        error: 'phoneNumbers dan message harus diisi'
      });
    }
    
    const phones = phoneNumbers.split('\n').filter(p => p.trim()).map(p => p.trim());
    
    console.log('📤 Creating text blast campaign:', campaignName);
    console.log('📱 Total phones:', phones.length);

    // Create campaign
    db.createCampaign({
      name: campaignName || 'Text Blast ' + new Date().toLocaleString(),
      message: message,
      type: 'text',
      totalTargets: phones.length,
      typingDuration: 3000,
      delayBetweenMessages: delayConfig && delayConfig.type === 'fix' ? delayConfig.value * 1000 : 5000,
      sessionName: sessionName || SESSION_NAME,
    }, (err, campaignId) => {
      if (err) {
        console.error('❌ Error creating campaign:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      console.log('✅ Campaign created with ID:', campaignId);

      // Create messages for each phone
      let messagesCreated = 0;
      phones.forEach((phone) => {
        db.createMessage({
          campaignId,
          phoneNumber: phone,
          message: message,
          status: 'pending',
        }, (err) => {
          messagesCreated++;
          
          // Setelah semua message dibuat, return response
          if (messagesCreated === phones.length) {
            res.json({
              success: true,
              total: phones.length,
              campaignId: campaignId,
              message: 'Campaign berhasil dibuat! Pesan akan dikirim dalam beberapa saat.'
            });

            // Process campaign in background
            setTimeout(() => {
              processCampaign(campaignId, {
                name: campaignName,
                type: 'text',
                message: message,
                typing_duration: 3000,
                delay_between_messages: delayConfig && delayConfig.type === 'fix' ? delayConfig.value * 1000 : 5000,
              }, sessionName || SESSION_NAME);
            }, 1000);
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Blast text error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Blast image
app.post('/api/blast/image', async (req, res) => {
  try {
    const { phoneNumbers, imageUrl, message, delayConfig, campaignName, sessionName } = req.body;
    
    if (!phoneNumbers || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'phoneNumbers dan imageUrl harus diisi'
      });
    }
    
    const phones = phoneNumbers.split('\n').filter(p => p.trim()).map(p => p.trim());
    
    console.log('📤 Creating image blast campaign:', campaignName);
    console.log('🖼️ Image URL:', imageUrl);
    console.log('📱 Total phones:', phones.length);

    db.createCampaign({
      name: campaignName || 'Image Blast ' + new Date().toLocaleString(),
      message: message,
      imageUrl: imageUrl,
      type: 'image',
      totalTargets: phones.length,
      typingDuration: 3000,
      delayBetweenMessages: delayConfig && delayConfig.type === 'fix' ? delayConfig.value * 1000 : 5000,
      sessionName: sessionName || SESSION_NAME,
    }, (err, campaignId) => {
      if (err) {
        console.error('❌ Error creating campaign:', err);
        return res.status(500).json({ success: false, error: err.message });
      }

      console.log('✅ Campaign created with ID:', campaignId);

      let messagesCreated = 0;
      phones.forEach((phone) => {
        db.createMessage({
          campaignId,
          phoneNumber: phone,
          message: message,
          status: 'pending',
        }, (err) => {
          messagesCreated++;
          
          if (messagesCreated === phones.length) {
            res.json({
              success: true,
              total: phones.length,
              campaignId: campaignId,
              message: 'Campaign berhasil dibuat! Gambar akan dikirim dalam beberapa saat.'
            });

            // Process campaign in background
            setTimeout(() => {
              processCampaign(campaignId, {
                name: campaignName,
                type: 'image',
                image_url: imageUrl,
                message: message,
                typing_duration: 3000,
                delay_between_messages: delayConfig && delayConfig.type === 'fix' ? delayConfig.value * 1000 : 5000,
              }, sessionName || SESSION_NAME);
            }, 1000);
          }
        });
      });
    });
  } catch (error) {
    console.error('❌ Blast image error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload image and return HTTP URL
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const imageFile = req.file;
    const imageId = generateImageId();
    
    // Store image data
    uploadedImages.set(imageId, {
      buffer: imageFile.buffer,
      mimeType: imageFile.mimetype,
      timestamp: Date.now()
    });
    
    // Create HTTP URL for the image (use network IP for WAHA Docker, but localhost for frontend)
    const port = process.env.PORT || 4000;
    const networkUrl = `http://192.168.18.171:${port}/temp-images/${imageId}`;
    const localUrl = `http://localhost:${port}/temp-images/${imageId}`;

    console.log('📤 Image uploaded:', imageId, 'Size:', imageFile.buffer.length, 'bytes');
    console.log('🔗 Network URL (for WAHA):', networkUrl);
    console.log('🔗 Local URL (for frontend):', localUrl);
    
    res.json({
      success: true,
      imageUrl: localUrl,  // For frontend access
      networkUrl: networkUrl,  // For WAHA access
      imageId: imageId
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Blast with upload (temporarily disabled)
app.post('/api/blast/upload', async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Upload feature belum tersedia. Gunakan URL gambar di tab "Blast Gambar" sebagai gantinya.'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('==============================================');
  console.log('🚀 WAHA Plus API Server Started');
  console.log('==============================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 WAHA Plus URL: ${WAHA_URL}`);
  console.log(`📱 Session: ${SESSION_NAME}`);
  console.log(`💾 Database: wa_blast.db`);
  console.log('==============================================');
  console.log('📋 Available Endpoints:');
  console.log(`   POST   /api/campaigns - Buat campaign`);
  console.log(`   GET    /api/campaigns - List campaigns`);
  console.log(`   POST   /api/campaigns/:id/start - Start campaign`);
  console.log(`   POST   /api/campaigns/:id/stop - Stop campaign`);
  console.log(`   GET    /api/campaigns/:id/messages - Messages per campaign`);
  console.log(`   GET    /api/campaigns/:id/replies - Replies per campaign`);
  console.log(`   GET    /api/replies/unread - Unread replies`);
  console.log(`   GET    /api/statistics - Dashboard statistics`);
  console.log(`   GET    /api/session-status - WhatsApp session status`);
  console.log(`   GET    /api/qr-code - Get QR code`);
  console.log(`   POST   /api/webhook - Webhook untuk pesan masuk`);
  console.log('==============================================');
});