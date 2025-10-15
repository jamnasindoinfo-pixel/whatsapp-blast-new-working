const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, 'wa_blast.db');

// Initialize database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error membuka database:', err);
  } else {
    console.log('✅ Database terhubung:', DB_PATH);
    initTables();
  }
});

// Create tables
function initTables() {
  // Table: campaigns
  db.run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      message TEXT,
      image_url TEXT,
      caption TEXT,
      type TEXT DEFAULT 'text',
      total_targets INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      delivered_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      typing_duration INTEGER DEFAULT 3000,
      delay_between_messages INTEGER DEFAULT 5000,
      session_name TEXT DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME
    )
  `);

  // Add session_name column to existing campaigns table if it doesn't exist
  db.all("PRAGMA table_info(campaigns)", (err, columns) => {
    if (!err && columns && !columns.find(col => col.name === 'session_name')) {
      db.run("ALTER TABLE campaigns ADD COLUMN session_name TEXT DEFAULT 'default'", (alterErr) => {
        if (alterErr) {
          console.error('❌ Error adding session_name column:', alterErr);
        } else {
          console.log('✅ Added session_name column to campaigns table');
        }
      });
    }
  });

  // Table: messages
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      phone_number TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      waha_message_id TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sent_at DATETIME,
      delivered_at DATETIME,
      read_at DATETIME,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )
  `);

  // Table: replies
  db.run(`
    CREATE TABLE IF NOT EXISTS replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER,
      campaign_id INTEGER,
      phone_number TEXT NOT NULL,
      reply_text TEXT,
      reply_type TEXT DEFAULT 'text',
      media_url TEXT,
      waha_reply_id TEXT,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read BOOLEAN DEFAULT 0,
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )
  `);

  // Table: contacts
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE NOT NULL,
      name TEXT,
      last_message_at DATETIME,
      total_messages_sent INTEGER DEFAULT 0,
      total_replies INTEGER DEFAULT 0,
      is_blocked BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Semua tabel berhasil dibuat');
}

// ============ CAMPAIGN FUNCTIONS ============

function createCampaign(data, callback) {
  const { name, message, imageUrl, caption, type, totalTargets, typingDuration, delayBetweenMessages, sessionName } = data;

  const sql = `
    INSERT INTO campaigns (name, message, image_url, caption, type, total_targets, typing_duration, delay_between_messages, session_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [name, message, imageUrl, caption, type || 'text', totalTargets, typingDuration || 3000, delayBetweenMessages || 5000, sessionName || 'default'], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

function updateCampaignStatus(campaignId, status, callback) {
  const sql = `
    UPDATE campaigns 
    SET status = ?, 
        started_at = CASE WHEN ? = 'running' THEN CURRENT_TIMESTAMP ELSE started_at END,
        completed_at = CASE WHEN ? IN ('completed', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE id = ?
  `;
  
  db.run(sql, [status, status, status, campaignId], callback);
}

function updateCampaignStats(campaignId, callback) {
  const sql = `
    UPDATE campaigns
    SET 
      sent_count = (SELECT COUNT(*) FROM messages WHERE campaign_id = ? AND status IN ('sent', 'delivered', 'read')),
      delivered_count = (SELECT COUNT(*) FROM messages WHERE campaign_id = ? AND status IN ('delivered', 'read')),
      failed_count = (SELECT COUNT(*) FROM messages WHERE campaign_id = ? AND status = 'failed'),
      reply_count = (SELECT COUNT(*) FROM replies WHERE campaign_id = ?)
    WHERE id = ?
  `;
  
  db.run(sql, [campaignId, campaignId, campaignId, campaignId, campaignId], callback);
}

function getCampaigns(limit, callback) {
  const sql = `
    SELECT * FROM campaigns 
    ORDER BY created_at DESC 
    LIMIT ?
  `;
  
  db.all(sql, [limit || 50], callback);
}

function getCampaignById(campaignId, callback) {
  const sql = `SELECT * FROM campaigns WHERE id = ?`;
  db.get(sql, [campaignId], callback);
}

function deleteCampaign(campaignId, callback) {
  db.serialize(() => {
    db.run('DELETE FROM replies WHERE campaign_id = ?', [campaignId]);
    db.run('DELETE FROM messages WHERE campaign_id = ?', [campaignId]);
    db.run('DELETE FROM campaigns WHERE id = ?', [campaignId], callback);
  });
}

// ============ MESSAGE FUNCTIONS ============

function createMessage(data, callback) {
  const { campaignId, phoneNumber, message, status } = data;
  
  const sql = `
    INSERT INTO messages (campaign_id, phone_number, message, status)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(sql, [campaignId, phoneNumber, message, status || 'pending'], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

function updateMessageStatus(messageId, status, wahaMessageId, errorMessage, callback) {
  const sql = `
    UPDATE messages 
    SET status = ?, 
        waha_message_id = ?,
        error_message = ?,
        sent_at = CASE WHEN ? IN ('sent', 'delivered', 'read') THEN COALESCE(sent_at, CURRENT_TIMESTAMP) ELSE sent_at END,
        delivered_at = CASE WHEN ? IN ('delivered', 'read') THEN COALESCE(delivered_at, CURRENT_TIMESTAMP) ELSE delivered_at END,
        read_at = CASE WHEN ? = 'read' THEN CURRENT_TIMESTAMP ELSE read_at END
    WHERE id = ?
  `;
  
  db.run(sql, [status, wahaMessageId, errorMessage, status, status, status, messageId], callback);
}

function getMessagesByPhone(phoneNumber, callback) {
  const sql = `
    SELECT m.*, c.name as campaign_name
    FROM messages m
    LEFT JOIN campaigns c ON m.campaign_id = c.id
    WHERE m.phone_number = ?
    ORDER BY m.created_at DESC
  `;
  
  db.all(sql, [phoneNumber], callback);
}

function getMessagesByCampaign(campaignId, callback) {
  const sql = `
    SELECT * FROM messages 
    WHERE campaign_id = ?
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [campaignId], callback);
}

function getPendingMessages(campaignId, callback) {
  const sql = `
    SELECT * FROM messages 
    WHERE campaign_id = ? AND status = 'pending'
    ORDER BY id ASC
  `;
  
  db.all(sql, [campaignId], callback);
}

// ============ REPLY FUNCTIONS ============

function createReply(data, callback) {
  const { messageId, campaignId, phoneNumber, replyText, replyType, mediaUrl, wahaReplyId } = data;
  
  const sql = `
    INSERT INTO replies (message_id, campaign_id, phone_number, reply_text, reply_type, media_url, waha_reply_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [messageId, campaignId, phoneNumber, replyText, replyType || 'text', mediaUrl, wahaReplyId], function(err) {
    callback(err, this ? this.lastID : null);
  });
}

function getRepliesByPhone(phoneNumber, callback) {
  const sql = `
    SELECT r.*, c.name as campaign_name
    FROM replies r
    LEFT JOIN campaigns c ON r.campaign_id = c.id
    WHERE r.phone_number = ?
    ORDER BY r.received_at DESC
  `;
  
  db.all(sql, [phoneNumber], callback);
}

function getRepliesByCampaign(campaignId, callback) {
  const sql = `
    SELECT * FROM replies 
    WHERE campaign_id = ?
    ORDER BY received_at DESC
  `;
  
  db.all(sql, [campaignId], callback);
}

function getUnreadReplies(callback) {
  const sql = `
    SELECT r.*, c.name as campaign_name
    FROM replies r
    LEFT JOIN campaigns c ON r.campaign_id = c.id
    WHERE r.is_read = 0
    ORDER BY r.received_at DESC
  `;
  
  db.all(sql, [], callback);
}

function markReplyAsRead(replyId, callback) {
  const sql = `UPDATE replies SET is_read = 1 WHERE id = ?`;
  db.run(sql, [replyId], callback);
}

// ============ CONTACT FUNCTIONS ============

function upsertContact(phoneNumber, name, callback) {
  const sql = `
    INSERT INTO contacts (phone_number, name, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(phone_number) 
    DO UPDATE SET 
      name = COALESCE(?, name),
      updated_at = CURRENT_TIMESTAMP
  `;
  
  db.run(sql, [phoneNumber, name, name], callback);
}

function updateContactStats(phoneNumber, callback) {
  const sql = `
    UPDATE contacts
    SET 
      last_message_at = (SELECT MAX(sent_at) FROM messages WHERE phone_number = ?),
      total_messages_sent = (SELECT COUNT(*) FROM messages WHERE phone_number = ?),
      total_replies = (SELECT COUNT(*) FROM replies WHERE phone_number = ?)
    WHERE phone_number = ?
  `;
  
  db.run(sql, [phoneNumber, phoneNumber, phoneNumber, phoneNumber], callback);
}

function getContacts(callback) {
  const sql = `
    SELECT * FROM contacts 
    WHERE is_blocked = 0
    ORDER BY last_message_at DESC
  `;
  
  db.all(sql, [], callback);
}

function blockContact(phoneNumber, callback) {
  const sql = `UPDATE contacts SET is_blocked = 1 WHERE phone_number = ?`;
  db.run(sql, [phoneNumber], callback);
}

// ============ STATISTICS FUNCTIONS ============

function getStatistics(callback) {
  const queries = {
    totalCampaigns: 'SELECT COUNT(*) as count FROM campaigns',
    activeCampaigns: "SELECT COUNT(*) as count FROM campaigns WHERE status = 'running'",
    totalMessages: 'SELECT COUNT(*) as count FROM messages',
    sentMessages: "SELECT COUNT(*) as count FROM messages WHERE status IN ('sent', 'delivered', 'read')",
    failedMessages: "SELECT COUNT(*) as count FROM messages WHERE status = 'failed'",
    totalReplies: 'SELECT COUNT(*) as count FROM replies',
    unreadReplies: 'SELECT COUNT(*) as count FROM replies WHERE is_read = 0',
    totalContacts: 'SELECT COUNT(*) as count FROM contacts WHERE is_blocked = 0'
  };

  const stats = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, [], (err, row) => {
      if (!err) {
        stats[key] = row.count;
      }
      completed++;
      if (completed === total) {
        callback(null, stats);
      }
    });
  });
}

// Export functions
module.exports = {
  db,
  // Campaign
  createCampaign,
  updateCampaignStatus,
  updateCampaignStats,
  getCampaigns,
  getCampaignById,
  deleteCampaign,
  // Message
  createMessage,
  updateMessageStatus,
  getMessagesByPhone,
  getMessagesByCampaign,
  getPendingMessages,
  // Reply
  createReply,
  getRepliesByPhone,
  getRepliesByCampaign,
  getUnreadReplies,
  markReplyAsRead,
  // Contact
  upsertContact,
  updateContactStats,
  getContacts,
  blockContact,
  // Statistics
  getStatistics
};