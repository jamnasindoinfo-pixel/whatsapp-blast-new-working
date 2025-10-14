require('dotenv').config();
const axios = require('axios');

const WAHA_URL = process.env.WAHA_URL || 'http://localhost:5000';
const WAHA_API_KEY = process.env.WAHA_API_KEY || 'your-secret-api-key-here';
const SESSION_NAME = process.env.SESSION_NAME || 'default';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/api/webhook';

async function setupWebhook() {
  console.log('🔧 Setting up webhook...');
  console.log('📡 WAHA URL:', WAHA_URL);
  console.log('🔗 Webhook URL:', WEBHOOK_URL);
  
  try {
    const response = await axios.post(
      `${WAHA_URL}/api/sessions/${SESSION_NAME}/webhook`,
      {
        url: WEBHOOK_URL,
        events: [
          'message',
          'message.ack',
          'state.change'
        ],
        hmac: null,
        retries: null,
        customHeaders: null
      },
      {
        headers: {
          'X-Api-Key': WAHA_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Webhook berhasil disetup!');
    console.log('📋 Response:', response.data);
    console.log('');
    console.log('🎉 Setup selesai! Server siap menerima webhook dari WAHA Plus');
    console.log('');
    console.log('📝 Events yang dimonitor:');
    console.log('   - message: Pesan masuk (balasan dari customer)');
    console.log('   - message.ack: Status pengiriman (sent/delivered/read)');
    console.log('   - state.change: Perubahan status sesi WhatsApp');
    
  } catch (error) {
    console.error('❌ Error setup webhook:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.log('');
    console.log('💡 Tips:');
    console.log('   1. Pastikan WAHA Plus sudah running');
    console.log('   2. Pastikan API Key benar di file .env');
    console.log('   3. Pastikan session sudah tersambung (scan QR)');
  }
}

// Check webhook status
async function checkWebhook() {
  console.log('🔍 Checking webhook status...');
  
  try {
    const response = await axios.get(
      `${WAHA_URL}/api/sessions/${SESSION_NAME}`,
      {
        headers: {
          'X-Api-Key': WAHA_API_KEY,
        },
      }
    );

    console.log('✅ Session status:', response.data.status);
    if (response.data.config && response.data.config.webhooks) {
      console.log('📋 Webhook config:', response.data.config.webhooks);
    } else {
      console.log('⚠️  Webhook belum dikonfigurasi');
    }
  } catch (error) {
    console.error('❌ Error checking webhook:', error.message);
  }
}

// Main
const command = process.argv[2];

if (command === 'check') {
  checkWebhook();
} else {
  setupWebhook();
}