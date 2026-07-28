import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import axios from 'axios';
import { Send, User, MessageCircle, MoreVertical, Search } from 'lucide-react';
import { format } from 'date-fns';
import './ChatLayout.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5024/api';
// Determine the base URL for SignalR from the API_URL
const BASE_URL = API_URL.replace('/api', '');

const ChatLayout = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [connection, setConnection] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const messagesEndRef = useRef(null);
  
  const token = localStorage.getItem('token');
  
  // Parse user ID from JWT token
  const getUserIdFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.nameid || payload.sub;
    } catch(e) {
      return null;
    }
  };

  const userId = getUserIdFromToken(token);

  useEffect(() => {
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }
    
    // Fetch users list
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/Users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter out current user from the list
        setUsers(response.data.filter(u => u.id !== parseInt(userId)));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    
    fetchUsers();

    // Setup SignalR Connection
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/chatHub?userId=${userId}`)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection && connection.state === signalR.HubConnectionState.Disconnected) {
      connection.start()
        .then(() => {
          console.log('Connected to SignalR Chat Hub!');
        })
        .catch(e => console.log('Connection failed: ', e));
    }
  }, [connection]);

  useEffect(() => {
    if (!connection) return;

    const handleReceiveMessage = (message) => {
      setMessages((prevMessages) => {
        // Ensure we only add the message if it belongs to the current chat
        if (
          (message.senderId === selectedUser?.id) || 
          (message.senderId === currentUserId && message.receiverId === selectedUser?.id)
        ) {
          // Clear typing indicator when a message arrives from them
          if (message.senderId === selectedUser?.id) {
             setIsTyping(false);
          }
          
          // Avoid duplicates
          if (!prevMessages.find(m => m.id === message.id && message.id !== 0)) {
             return [...prevMessages, message];
          }
        }
        return prevMessages;
      });
    };

    const handleUserTyping = (senderId) => {
      if (selectedUser && senderId === selectedUser.id) {
        setIsTyping(true);
        
        // Auto-hide typing indicator after 3 seconds
        if (typingTimeout) clearTimeout(typingTimeout);
        const timeout = setTimeout(() => setIsTyping(false), 3000);
        setTypingTimeout(timeout);
      }
    };

    connection.on('ReceiveMessage', handleReceiveMessage);
    connection.on('UserTyping', handleUserTyping);

    return () => {
      connection.off('ReceiveMessage', handleReceiveMessage);
      connection.off('UserTyping', handleUserTyping);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [connection, selectedUser, currentUserId, typingTimeout]);

  useEffect(() => {
    if (selectedUser) {
      // Fetch chat history
      const fetchHistory = async () => {
        try {
          const response = await axios.get(`${API_URL}/Messages/history/${selectedUser.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching chat history:', error);
        }
      };
      
      fetchHistory();
    }
  }, [selectedUser]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Notify the other user that we are typing
    if (connection && selectedUser) {
      connection.invoke('SendTyping', currentUserId, selectedUser.id).catch(e => console.error('Typing indicator failed:', e));
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !connection || !selectedUser) return;

    try {
      await connection.invoke('SendMessage', currentUserId, selectedUser.id, newMessage);
      setNewMessage('');
    } catch (e) {
      console.error('Send message failed:', e);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2><MessageCircle className="icon" /> Messages</h2>
        </div>
        <div className="sidebar-search">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="users-list">
          {filteredUsers.map((u) => (
            <div 
              key={u.id} 
              className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(u)}
            >
              <div className="user-avatar">
                {u.avatar ? <img src={u.avatar} alt={u.name} /> : <User size={20} />}
              </div>
              <div className="user-info">
                <h4>{u.name || u.email.split('@')[0]}</h4>
                <p className="user-status">Online</p>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="no-users">No users found.</div>
          )}
        </div>
      </div>
      
      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                   <User size={24} />
                </div>
                <div>
                  <h3>{selectedUser.name || selectedUser.email.split('@')[0]}</h3>
                  <span className="status-indicator"></span>
                </div>
              </div>
              <div className="chat-header-actions">
                <MoreVertical className="action-icon" />
              </div>
            </div>
            
            <div className="messages-area">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id || index} 
                  className={`message-bubble-wrapper ${msg.senderId === currentUserId ? 'sent' : 'received'}`}
                >
                  <div className="message-bubble">
                    <p className="message-content">{msg.content}</p>
                    <span className="message-time">
                      {msg.timestamp ? format(new Date(msg.timestamp), 'HH:mm') : format(new Date(), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="message-bubble-wrapper received">
                  <div className="message-bubble typing-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            <form className="message-input-area" onSubmit={sendMessage}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={newMessage}
                onChange={handleTyping}
              />
              <button type="submit" disabled={!newMessage.trim()}>
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-icon">
              <MessageCircle size={64} />
            </div>
            <h2>Your Messages</h2>
            <p>Select a user from the sidebar to start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
