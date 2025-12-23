const assert = require('assert');
const { formatPhoneNumber } = require('./utils');

// Mock external dependencies
const mockDb = {
    createCampaign: (data, callback) => {
        console.log('📝 Mock DB: Creating campaign', data.name);
        callback(null, 123); // Return mock ID
    },
    updateCampaignStatus: (id, status) => {
        console.log(`📝 Mock DB: Campaign ${id} status updated to ${status}`);
    },
    logMessage: (data) => {
        console.log(`📝 Mock DB: Logged message for ${data.phoneNumber}: ${data.status}`);
    },
    incrementSentCount: (id) => { },
    incrementFailedCount: (id) => { }
};

// Mock WhatsApp Client
const mockClient = {
    sendMessage: async (chatId, content, options) => {
        console.log(`📤 Mock Client: Sending to ${chatId}`);
        if (content.includes('FAIL')) throw new Error('Simulated failure');
        return { id: { fromMe: true, remote: chatId, id: 'MOCK_MSG_ID' } };
    }
};

// Mock Database Module for require
const mockDatabaseModule = mockDb;

console.log('🧪 Running Comprehensive Unit Tests...');

async function runTests() {
    try {
        // --- Test 1: Utils - Phone Number Formatting ---
        console.log('\n🔹 Test 1: Phone Formatting');
        assert.strictEqual(formatPhoneNumber('08123'), '628123', 'Failed: 08xxx format');
        assert.strictEqual(formatPhoneNumber('+628123'), '628123', 'Failed: +628xxx format');
        console.log('✅ Phone formatting verified');

        // --- Test 2: Delay Logic Simulation ---
        console.log('\n🔹 Test 2: Delay Logic Simulation');
        const campaign = {
            delay_min: 100, // 100ms for test
            delay_between_messages: 200 // 200ms max
        };

        const start = Date.now();
        // Simulate delay
        let delay;
        if (campaign.delay_min > 0 && campaign.delay_between_messages > campaign.delay_min) {
            delay = Math.floor(Math.random() * (campaign.delay_between_messages - campaign.delay_min + 1)) + campaign.delay_min;
        } else {
            delay = campaign.delay_between_messages;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        const duration = Date.now() - start;

        assert.ok(duration >= 100, 'Delay too short');
        console.log(`✅ Delay verified: ${duration}ms (Expected range 100-200ms)`);

        // --- Test 3: Campaign Processing Logic (Mocked) ---
        console.log('\n🔹 Test 3: Campaign Processing Logic');
        const phoneNumbers = ['628111111', '628222222', '628333333'];
        const message = 'Test Broadcast';

        let sentCount = 0;
        let failedCount = 0;

        for (const phone of phoneNumbers) {
            try {
                const chatId = phone + '@c.us';
                await mockClient.sendMessage(chatId, message);
                sentCount++;
                mockDb.logMessage({ campaignId: 123, phoneNumber: phone, status: 'sent' });
            } catch (error) {
                failedCount++;
                mockDb.logMessage({ campaignId: 123, phoneNumber: phone, status: 'failed' });
            }
        }

        assert.strictEqual(sentCount, 3, 'Should verify 3 sent messages');
        console.log(`✅ Processed ${sentCount} messages successfully`);

        // --- Test 4: Failure Handling ---
        console.log('\n🔹 Test 4: Failure Handling');
        try {
            await mockClient.sendMessage('628999999@c.us', 'FAIL_THIS_MESSAGE');
            assert.fail('Should have thrown error');
        } catch (error) {
            assert.strictEqual(error.message, 'Simulated failure');
            console.log('✅ Error handling verified');
        }

        console.log('\n✅✅✅ ALL COMPREHENSIVE TESTS PASSED ✅✅✅');

    } catch (error) {
        console.error('❌ TESTS FAILED:', error);
        process.exit(1);
    }
}

runTests();
