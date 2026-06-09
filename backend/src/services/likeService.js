const pool = require('../db/pool');

const likeService = {
  async likeUser(likerId, likedId) {
    const result = await pool.query(
      'INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [likerId, likedId]
    );
    
    // Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_user_id) 
       VALUES ($1, $2, $3, $4, $5)`,
      [likedId, 'like', 'New Like!', 'Someone liked your profile', likerId]
    );

    return this.formatLike(result.rows[0]);
  },

  async unlikeUser(likerId, likedId) {
    const result = await pool.query(
      'DELETE FROM likes WHERE liker_id = $1 AND liked_id = $2',
      [likerId, likedId]
    );
    return result.rowCount > 0;
  },

  formatLike(like) {
    return {
      id: like.id,
      likerId: like.liker_id,
      likedId: like.liked_id,
      createdAt: like.created_at,
    };
  },
};

module.exports = likeService;
