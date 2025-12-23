const axios = require('axios');

const API_URL = 'http://localhost:4000/api';

// Colors for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testStatistics() {
  log('cyan', '\n📊 Testing Statistics Endpoint...');
  try {
    const response = await axios.get(`${API_URL}/statistics`);
    log('green', '✅ Statistics OK');
    console.log(JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return false;
  }
}

async function testSessionStatus() {
  log('cyan', '\n📱 Testing Session Status...');
  try {
    const response = await axios.get(`${API_URL}/session-status`);
    log('green', '✅ Session Status OK');
    console.log(`Status: ${response.data.data.status}`);
    if (response.data.data.me) {
      console.log(`WhatsApp: ${response.data.data.me.user}`);
    }
    return true;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return false;
  }
}

async function testCreateCampaign(phoneNumber) {
  log('cyan', '\n📋 Testing Create Campaign...');

  if (!phoneNumber) {
    log('yellow', '⚠️  Phone number not provided, skipping...');
    return null;
  }

  try {
    const response = await axios.post(`${API_URL}/campaigns`, {
      name: `Test Campaign - ${new Date().toISOString()}`,
      message: 'Halo! Ini adalah test message dari WAHA Plus API. Tolong balas pesan ini untuk test reply monitoring.',
      type: 'text',
      contacts: [phoneNumber],
      typingDuration: 3000,
      delayBetweenMessages: 5000
    });

    log('green', '✅ Campaign Created');
    console.log(`Campaign ID: ${response.data.campaignId}`);
    return response.data.campaignId;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return null;
  }
}

async function testGetCampaigns() {
  log('cyan', '\n📋 Testing Get Campaigns...');
  try {
    const response = await axios.get(`${API_URL}/campaigns`);
    log('green', `✅ Found ${response.data.data.length} campaigns`);

    if (response.data.data.length > 0) {
      console.log('\nRecent campaigns:');
      response.data.data.slice(0, 3).forEach(c => {
        console.log(`  - ${c.name} (${c.status}) - ${c.sent_count}/${c.total_targets} sent`);
      });
    }
    return response.data.data;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return [];
  }
}

async function testStartCampaign(campaignId) {
  log('cyan', `\n▶️  Testing Start Campaign ${campaignId}...`);
  try {
    const response = await axios.post(`${API_URL}/campaigns/${campaignId}/start`);
    log('green', '✅ Campaign Started');
    console.log('Message:', response.data.message);
    return true;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetCampaignMessages(campaignId) {
  log('cyan', `\n📨 Testing Get Campaign Messages ${campaignId}...`);
  try {
    const response = await axios.get(`${API_URL}/campaigns/${campaignId}/messages`);
    log('green', `✅ Found ${response.data.data.length} messages`);

    if (response.data.data.length > 0) {
      console.log('\nMessages:');
      response.data.data.forEach(m => {
        console.log(`  - ${m.phone_number}: ${m.status}`);
      });
    }
    return true;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetUnreadReplies() {
  log('cyan', '\n💬 Testing Get Unread Replies...');
  try {
    const response = await axios.get(`${API_URL}/replies/unread`);
    log('green', `✅ Found ${response.data.data.length} unread replies`);

    if (response.data.data.length > 0) {
      console.log('\nUnread replies:');
      response.data.data.slice(0, 5).forEach(r => {
        console.log(`  - ${r.phone_number}: ${r.reply_text}`);
      });
    }
    return true;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetContacts() {
  log('cyan', '\n👥 Testing Get Contacts...');
  try {
    const response = await axios.get(`${API_URL}/contacts`);
    log('green', `✅ Found ${response.data.data.length} contacts`);

    if (response.data.data.length > 0) {
      console.log('\nRecent contacts:');
      response.data.data.slice(0, 5).forEach(c => {
        console.log(`  - ${c.phone_number}: ${c.total_messages_sent} messages, ${c.total_replies} replies`);
      });
    }
    return true;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return false;
  }
}

async function testSingleMessage(phoneNumber) {
  log('cyan', '\n📤 Testing Send Single Message...');

  if (!phoneNumber) {
    log('yellow', '⚠️  Phone number not provided, skipping...');
    return false;
  }

  try {
    const response = await axios.post(`${API_URL}/send-message`, {
      phone: phoneNumber,
      message: 'Test single message dengan typing indicator! 👋',
      typingDuration: 2000
    });

    log('green', '✅ Message Sent');
    console.log('Message ID:', response.data.data.id);
    return true;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return false;
  }
}

async function testSendMedia(phoneNumber, type = 'image') {
  log('cyan', `\n📤 Testing Send ${type}...`);

  if (!phoneNumber) {
    log('yellow', '⚠️  Phone number not provided, skipping...');
    return false;
  }

  const mediaUrls = {
    image: 'https://via.placeholder.com/150.png',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4' // Public test video
  };

  try {
    const response = await axios.post(`${API_URL}/send-media`, {
      phone: phoneNumber,
      mediaUrl: mediaUrls[type],
      caption: `Test sending ${type} from WAHA Plus API! 📸`,
      type: type
    });

    log('green', `✅ ${type} Sent`);
    console.log('Message ID:', response.data.data.id);
    return true;
  } catch (error) {
    log('red', `❌ Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  const phoneNumber = args[1];

  log('blue', '═══════════════════════════════════════════════');
  log('blue', '   WAHA Plus API - Testing Suite');
  log('blue', '═══════════════════════════════════════════════');

  if (testType === 'help' || testType === '-h' || testType === '--help') {
    console.log('\nUsage: node test-api.js [test-type] [phone-number]');
    console.log('\nTest types:');
    console.log('  all              - Run all tests (default)');
    console.log('  basic            - Run basic tests only (no message sending)');
    console.log('  campaign         - Test campaign creation and sending');
    console.log('  single           - Test single message sending');
    console.log('  statistics       - Test statistics endpoint');
    console.log('  session          - Test session status');
    console.log('  replies          - Test replies endpoint');
    console.log('  contacts         - Test contacts endpoint');
    console.log('\nExamples:');
    console.log('  node test-api.js basic');
    console.log('  node test-api.js campaign 628123456789');
    console.log('  node test-api.js single 628123456789');
    console.log('  node test-api.js all 628123456789');
    return;
  }

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Basic tests (always run)
    if (testType === 'all' || testType === 'basic' || testType === 'statistics') {
      if (await testStatistics()) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    if (testType === 'all' || testType === 'basic' || testType === 'session') {
      if (await testSessionStatus()) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    if (testType === 'all' || testType === 'basic') {
      if (await testGetCampaigns()) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    if (testType === 'all' || testType === 'basic' || testType === 'replies') {
      if (await testGetUnreadReplies()) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    if (testType === 'all' || testType === 'basic' || testType === 'contacts') {
      if (await testGetContacts()) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    // Campaign tests (requires phone number)
    if (testType === 'all' || testType === 'campaign') {
      if (!phoneNumber) {
        log('yellow', '\n⚠️  Skipping campaign test - phone number required');
        log('yellow', '   Usage: node test-api.js campaign 628123456789');
        results.skipped++;
      } else {
        const campaignId = await testCreateCampaign(phoneNumber);
        if (campaignId) {
          results.passed++;

          // Wait a bit before starting
          log('yellow', '\n⏳ Waiting 2 seconds before starting campaign...');
          await new Promise(resolve => setTimeout(resolve, 2000));

          if (await testStartCampaign(campaignId)) {
            results.passed++;
          } else {
            results.failed++;
          }

          // Wait for campaign to process
          log('yellow', '\n⏳ Waiting 5 seconds for campaign to process...');
          await new Promise(resolve => setTimeout(resolve, 5000));

          if (await testGetCampaignMessages(campaignId)) {
            results.passed++;
          } else {
            results.failed++;
          }
        } else {
          results.failed++;
        }
      }
    }

    // Single message test
    if (testType === 'single') {
      if (!phoneNumber) {
        log('yellow', '\n⚠️  Phone number required for single message test');
        log('yellow', '   Usage: node test-api.js single 628123456789');
        results.skipped++;
      } else {
        if (await testSingleMessage(phoneNumber)) {
          results.passed++;
        } else {
          results.failed++;
        }
      }
    }

    // Media tests
    if (testType === 'media' || testType === 'all') {
      if (!phoneNumber) {
        if (testType === 'media') {
          log('yellow', '\n⚠️  Phone number required for media test');
          results.skipped++;
        }
      } else {
        // Test Image
        if (await testSendMedia(phoneNumber, 'image')) {
          results.passed++;
        } else {
          results.failed++;
        }

        // Test Video
        if (await testSendMedia(phoneNumber, 'video')) {
          results.passed++;
        } else {
          results.failed++;
        }
      }
    }

  } catch (error) {
    log('red', `\n❌ Unexpected error: ${error.message}`);
  }

  // Summary
  log('blue', '\n═══════════════════════════════════════════════');
  log('blue', '   Test Summary');
  log('blue', '═══════════════════════════════════════════════');
  log('green', `✅ Passed: ${results.passed}`);
  if (results.failed > 0) {
    log('red', `❌ Failed: ${results.failed}`);
  }
  if (results.skipped > 0) {
    log('yellow', `⏭️  Skipped: ${results.skipped}`);
  }
  log('blue', '═══════════════════════════════════════════════\n');

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log('red', `\n❌ Fatal error: ${error.message}`);
  process.exit(1);
});