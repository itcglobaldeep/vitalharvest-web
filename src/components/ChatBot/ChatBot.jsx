import React, { useState } from 'react';
import { sendMessage } from '../../services/chatService';
import './ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your VitalHarvest wellness assistant. How can I help you today?",
      sender: 'bot'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessage(inputMessage);
      const botResponse = {
        id: messages.length + 2,
        text: response.message,
        sender: 'bot'
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chatbot ${isOpen ? 'open' : ''}`}>
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '×' : 'Chat with us'}
      </button>

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <h3>VitalHarvest Assistant</h3>
          </div>
          
          <div className="chatbot-messages">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.sender}`}
              >
                {message.text}
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                <span className="loading-dots">...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot;