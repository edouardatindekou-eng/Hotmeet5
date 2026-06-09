const messageHandler = {
  handleMessage(ws, data, wss) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'message':
          this.broadcastMessage(message, wss);
          break;
        case 'notification':
          this.sendNotification(message, wss);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  },

  broadcastMessage(message, wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({
          type: 'message',
          data: message.data,
        }));
      }
    });
  },

  sendNotification(message, wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'notification',
          data: message.data,
        }));
      }
    });
  },
};

module.exports = messageHandler;
