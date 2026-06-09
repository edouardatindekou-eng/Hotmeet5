const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const messageService = require('../services/messageService');
const likeService = require('../services/likeService');

const resolvers = {
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return userService.getUserById(userId);
    },

    user: async (_, { id }) => {
      return userService.getUserById(id);
    },

    searchUsers: async (_, { filters }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return userService.searchUsers(userId, filters);
    },

    getMessages: async (_, { conversationId }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return messageService.getMessages(conversationId, userId);
    },

    getConversations: async (_, __, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return messageService.getConversations(userId);
    },

    getNotifications: async (_, __, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return messageService.getNotifications(userId);
    },

    getUnreadCount: async (_, __, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return messageService.getUnreadCount(userId);
    },
  },

  Mutation: {
    register: async (_, { email, password, firstName, lastName, age, location }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (email, password, first_name, last_name, age, location, subscription_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [email, hashedPassword, firstName, lastName, age, location, 'free']
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
      return { token, user: userService.formatUser(user) };
    },

    login: async (_, { email, password }) => {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];
      if (!user) throw new Error('User not found');
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) throw new Error('Invalid password');
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
      return { token, user: userService.formatUser(user) };
    },

    updateProfile: async (_, { firstName, lastName, bio, age, location, latitude, longitude, interests }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return userService.updateProfile(userId, { firstName, lastName, bio, age, location, latitude, longitude, interests });
    },

    uploadPhoto: async (_, { photoUrl, photoOrder }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      if (photoOrder > 4) throw new Error('Maximum 4 photos allowed');
      return userService.uploadPhoto(userId, photoUrl, photoOrder);
    },

    deletePhoto: async (_, { photoId }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return userService.deletePhoto(photoId, userId);
    },

    likeUser: async (_, { likedId }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return likeService.likeUser(userId, likedId);
    },

    unlikeUser: async (_, { likedId }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return likeService.unlikeUser(userId, likedId);
    },

    sendMessage: async (_, { recipientId, content }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return messageService.sendMessage(userId, recipientId, content);
    },

    markMessageAsRead: async (_, { messageId }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return messageService.markMessageAsRead(messageId, userId);
    },

    blockUser: async (_, { blockedId }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return userService.blockUser(userId, blockedId);
    },

    unblockUser: async (_, { blockedId }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return userService.unblockUser(userId, blockedId);
    },

    upgradeToPremium: async (_, { subscriptionType }, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return userService.upgradeToPremium(userId, subscriptionType);
    },

    cancelSubscription: async (_, __, { userId }) => {
      if (!userId) throw new Error('Authentication required');
      return userService.cancelSubscription(userId);
    },
  },
};

module.exports = resolvers;
