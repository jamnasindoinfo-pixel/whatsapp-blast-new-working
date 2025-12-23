const assert = require('assert');
const { formatPhoneNumber } = require('./utils');

console.log('🧪 Running Unit Tests...');

try {
    // Test Case 1: Normal 08xxx
    assert.strictEqual(formatPhoneNumber('08123456789'), '628123456789', 'Failed: 08xxx format');

    // Test Case 2: Already 628xxx
    assert.strictEqual(formatPhoneNumber('628123456789'), '628123456789', 'Failed: 628xxx format');

    // Test Case 3: With +62
    assert.strictEqual(formatPhoneNumber('+628123456789'), '628123456789', 'Failed: +628xxx format');

    // Test Case 4: With spaces and dashes
    assert.strictEqual(formatPhoneNumber('0812-3456 789'), '628123456789', 'Failed: Space/Dash format');

    // Test Case 5: Empty
    assert.strictEqual(formatPhoneNumber(''), '', 'Failed: Empty input');

    console.log('✅ All Unit Tests Passed!');
} catch (error) {
    console.error('❌ Unit Test Failed:', error.message);
    process.exit(1);
}
