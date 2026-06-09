import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import '../styles/Messages.css';

const GET_CONVERSATIONS = gql`
  query GetConversations {
    getConversations {
      id
      user1Id
      user2Id
      lastMessageAt
    }
  }
`;

const GET_MESSAGES = gql`
  query GetMessages($conversationId: ID!) {
    getMessages(conversationId: $conversationId) {
      id
      senderId
      recipientId
      content
      isRead
      createdAt
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($recipientId: ID!, $content: String!) {
    sendMessage(recipientId: $recipientId, content: $content) {
      id
      content
      createdAt
    }
  }
`;

function Messages() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const { data: conversationsData } = useQuery(GET_CONVERSATIONS);
  const [sendMessage] = useMutation(SEND_MESSAGE);

  const conversations = conversationsData?.getConversations || [];

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedConversation) return;

    try {
      await sendMessage({
        variables: {
          recipientId: selectedConversation,
          content: messageContent,
        },
      });
      setMessageContent('');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  return (
    <div className="messages">
      <div className="container">
        <h1>Messages</h1>
        <div className="messages-container">
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <p>Aucune conversation</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${selectedConversation === conv.id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <p>Conversation {conv.id}</p>
                  <small>{new Date(conv.lastMessageAt).toLocaleDateString()}</small>
                </div>
              ))
            )}
          </div>

          <div className="chat-window">
            {selectedConversation ? (
              <>
                <div className="messages-area">
                  {/* Messages will be displayed here */}
                </div>
                <div className="message-input">
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Écrivez un message..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="btn btn-primary" onClick={handleSendMessage}>
                    Envoyer
                  </button>
                </div>
              </>
            ) : (
              <p className="no-selection">Sélectionnez une conversation</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
