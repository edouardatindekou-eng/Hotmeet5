const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    bio: String
    age: Int
    location: String
    latitude: Float
    longitude: Float
    interests: [String!]
    photos: [Photo!]
    isPremium: Boolean!
    subscriptionType: String
    subscriptionExpiry: String
    profileComplete: Boolean!
    createdAt: String!
  }

  type Photo {
    id: ID!
    userId: ID!
    photoUrl: String!
    photoOrder: Int!
  }

  type Like {
    id: ID!
    likerId: ID!
    likedId: ID!
    createdAt: String!
  }

  type Message {
    id: ID!
    senderId: ID!
    recipientId: ID!
    content: String!
    isRead: Boolean!
    readAt: String
    createdAt: String!
  }

  type Conversation {
    id: ID!
    user1Id: ID!
    user2Id: ID!
    lastMessageAt: String
    createdAt: String!
  }

  type Notification {
    id: ID!
    userId: ID!
    type: String!
    title: String!
    message: String!
    relatedUserId: ID
    isRead: Boolean!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type SearchResult {
    users: [User!]!
    total: Int!
  }

  type Query {
    me: User
    user(id: ID!): User
    searchUsers(filters: SearchFilters!): SearchResult!
    getMessages(conversationId: ID!): [Message!]!
    getConversations: [Conversation!]!
    getNotifications: [Notification!]!
    getUnreadCount: Int!
  }

  input SearchFilters {
    minAge: Int
    maxAge: Int
    location: String
    latitude: Float
    longitude: Float
    radius: Float
    interests: [String!]
    limit: Int
    offset: Int
  }

  type Mutation {
    register(email: String!, password: String!, firstName: String!, lastName: String!, age: Int!, location: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    updateProfile(firstName: String, lastName: String, bio: String, age: Int, location: String, latitude: Float, longitude: Float, interests: [String!]): User!
    uploadPhoto(photoUrl: String!, photoOrder: Int!): Photo!
    deletePhoto(photoId: ID!): Boolean!
    likeUser(likedId: ID!): Like!
    unlikeUser(likedId: ID!): Boolean!
    sendMessage(recipientId: ID!, content: String!): Message!
    markMessageAsRead(messageId: ID!): Boolean!
    blockUser(blockedId: ID!): Boolean!
    unblockUser(blockedId: ID!): Boolean!
    upgradeToPremium(subscriptionType: String!): User!
    cancelSubscription: User!
  }

  type Subscription {
    messageReceived(recipientId: ID!): Message!
    notificationReceived(userId: ID!): Notification!
  }
`;

module.exports = typeDefs;
