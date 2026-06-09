const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { authenticateToken } = require('./middleware/auth');
const messageHandler = require('./websocket/messageHandler');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(authenticateToken);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Apollo Server
const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      userId: req.user?.id || null,
      user: req.user || null,
    }),
  });

  await server.start();
  server.applyMiddleware({ app });

  const httpServer = http.createServer(app);

  // WebSocket setup
  const wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');

    ws.on('message', (data) => {
      messageHandler.handleMessage(ws, data, wss);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 GraphQL available at http://localhost:${PORT}${server.graphqlPath}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
