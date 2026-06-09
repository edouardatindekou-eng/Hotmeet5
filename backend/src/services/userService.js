const pool = require('../db/pool');

const userService = {
  async getUserById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.formatUser(result.rows[0]) : null;
  },

  async searchUsers(userId, filters) {
    let query = 'SELECT * FROM users WHERE id != $1';
    const params = [userId];
    let paramCount = 2;

    if (filters.minAge) {
      query += ` AND age >= $${paramCount}`;
      params.push(filters.minAge);
      paramCount++;
    }

    if (filters.maxAge) {
      query += ` AND age <= $${paramCount}`;
      params.push(filters.maxAge);
      paramCount++;
    }

    if (filters.location) {
      query += ` AND location ILIKE $${paramCount}`;
      params.push(`%${filters.location}%`);
      paramCount++;
    }

    if (filters.interests && filters.interests.length > 0) {
      query += ` AND interests && $${paramCount}`;
      params.push(filters.interests);
      paramCount++;
    }

    query += ` LIMIT ${filters.limit || 20} OFFSET ${filters.offset || 0}`;

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM users WHERE id != $1', [userId]);

    return {
      users: result.rows.map(user => this.formatUser(user)),
      total: parseInt(countResult.rows[0].count),
    };
  },

  async updateProfile(userId, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (data.firstName) {
      updates.push(`first_name = $${paramCount}`);
      values.push(data.firstName);
      paramCount++;
    }
    if (data.lastName) {
      updates.push(`last_name = $${paramCount}`);
      values.push(data.lastName);
      paramCount++;
    }
    if (data.bio) {
      updates.push(`bio = $${paramCount}`);
      values.push(data.bio);
      paramCount++;
    }
    if (data.age) {
      updates.push(`age = $${paramCount}`);
      values.push(data.age);
      paramCount++;
    }
    if (data.location) {
      updates.push(`location = $${paramCount}`);
      values.push(data.location);
      paramCount++;
    }
    if (data.latitude) {
      updates.push(`latitude = $${paramCount}`);
      values.push(data.latitude);
      paramCount++;
    }
    if (data.longitude) {
      updates.push(`longitude = $${paramCount}`);
      values.push(data.longitude);
      paramCount++;
    }
    if (data.interests) {
      updates.push(`interests = $${paramCount}`);
      values.push(data.interests);
      paramCount++;
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return this.formatUser(result.rows[0]);
  },

  async uploadPhoto(userId, photoUrl, photoOrder) {
    const result = await pool.query(
      'INSERT INTO profile_photos (user_id, photo_url, photo_order) VALUES ($1, $2, $3) ON CONFLICT (user_id, photo_order) DO UPDATE SET photo_url = $2 RETURNING *',
      [userId, photoUrl, photoOrder]
    );
    return this.formatPhoto(result.rows[0]);
  },

  async deletePhoto(photoId, userId) {
    const result = await pool.query(
      'DELETE FROM profile_photos WHERE id = $1 AND user_id = $2',
      [photoId, userId]
    );
    return result.rowCount > 0;
  },

  async blockUser(userId, blockedId) {
    await pool.query(
      'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, blockedId]
    );
    return true;
  },

  async unblockUser(userId, blockedId) {
    const result = await pool.query(
      'DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [userId, blockedId]
    );
    return result.rowCount > 0;
  },

  async upgradeToPremium(userId, subscriptionType) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days
    const result = await pool.query(
      'UPDATE users SET is_premium = true, subscription_type = $1, subscription_expiry = $2 WHERE id = $3 RETURNING *',
      [subscriptionType, expiryDate, userId]
    );
    return this.formatUser(result.rows[0]);
  },

  async cancelSubscription(userId) {
    const result = await pool.query(
      'UPDATE users SET is_premium = false, subscription_type = $1, subscription_expiry = null WHERE id = $2 RETURNING *',
      ['free', userId]
    );
    return this.formatUser(result.rows[0]);
  },

  formatUser(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      bio: user.bio,
      age: user.age,
      location: user.location,
      latitude: user.latitude,
      longitude: user.longitude,
      interests: user.interests,
      isPremium: user.is_premium,
      subscriptionType: user.subscription_type,
      subscriptionExpiry: user.subscription_expiry,
      profileComplete: user.profile_complete,
      createdAt: user.created_at,
    };
  },

  formatPhoto(photo) {
    return {
      id: photo.id,
      userId: photo.user_id,
      photoUrl: photo.photo_url,
      photoOrder: photo.photo_order,
    };
  },
};

module.exports = userService;
