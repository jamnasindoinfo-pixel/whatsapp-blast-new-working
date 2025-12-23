function formatPhoneNumber(phone) {
    if (!phone) return '';
    let formatted = phone.toString().trim();
    formatted = formatted.replace(/[^\d+]/g, ''); // Remove non-digit except +
    formatted = formatted.replace(/[\s\/'"]/g, ''); // Remove spaces, quotes
    if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
    if (formatted.startsWith('62') && !formatted.startsWith('628')) formatted = '62' + formatted.substring(2);
    if (!formatted.startsWith('+') && !formatted.startsWith('62')) formatted = '62' + formatted;
    return formatted.replace('+', ''); // WhatsApp ID format usually doesn't have +
}

module.exports = {
    formatPhoneNumber
};
