const pool = require('../db/pool');

const messageService = {
  async sendMessage(senderId, recipientId, content) {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, recipient_id, content) VALUES ($1, $2, $3) RETURNING *',
      [senderId, recipientId, content]
    );
    return this.formatMessage(result.rows[0]);
  },

  async getMessages(conversationId, userId) {
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 OR recipient_id = $1) 
       ORDER BY created_at ASC`,
      [userId]
    );
    return result.rows.map(msg => this.formatMessage(msg));
  },

  async getConversations(userId) {
    const result = await pool.query(
      `SELECT DISTINCT ON (user_1_id, user_2_id) * FROM conversations 
       WHERE user_1_id = $1 OR user_2_id = $1 
       ORDER BY last_message_at DESC`,
      [userId]
    );
    return result.rows.map(conv => this.formatConversation(conv));
  },

  async getNotifications(userId) {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return result.rows.map(notif => this.formatNotification(notif));
  },

  async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE recipient_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  async markMessageAsRead(messageId, userId) {
    const result = await pool.query(
      'UPDATE messages SET is_read = true, read_at = NOW() WHERE id = $1 AND recipient_id = $2',
      [messageId, userId]
    );
    return result.rowCount > 0;
  },

  formatMessage(message) {
    return {
      id: message.id,
      senderId: message.sender_id,
      recipientId: message.recipient_id,
      content: message.content,
      isRead: message.is_read,
      readAt: message.read_at,
      createdAt: message.created_at,
    };
  },

  formatConversation(conversation) {
    return {
      id: conversation.id,
      user1Id: conversation.user_1_id,
      user2Id: conversation.user_2_id,
      lastMessageAt: conversation.last_message_at,
      createdAt: conversation.created_at,
    };
  },

  formatNotification(notif) {
    return {
      id: notif.id,
      userId: notif.user_id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      relatedUserId: notif.related_user_id,
      isRead: notif.is_read,
      createdAt: notif.created_at,
    };
  },
};

module.exports = messageService;
