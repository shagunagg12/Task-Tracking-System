import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import './Chats.css';

const Chats = () => {
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'groups', 'direct'
  const [connection, setConnection] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const take = 50;
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const skipRef = useRef(0);

  // Helper to get my name/id
  const getUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.nameid || null;
    } catch(e) {
      return null;
    }
  };
  const myUserId = getUserId();

  // Initialize SignalR Connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5024/chathub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('Connected to SignalR');
          connection.on('ReceiveMessage', (message) => {
            if (message.chatSessionId.toString() === currentChatIdRef.current?.toString()) {
              setMessages(prev => {
                // If message already exists, don't add it
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
              });
              
              // Update last message in sidebar
              setConversations(prev => prev.map(chat => {
                if (chat.id.toString() === message.chatSessionId.toString()) {
                  return { ...chat, lastMessage: message.text, time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                }
                return chat;
              }));
              
              // Only auto scroll to bottom if we are receiving a new message (not loading old ones)
              setTimeout(scrollToBottom, 100);
            } else {
               // Update unread count or last message in sidebar for other chats
               setConversations(prev => prev.map(chat => {
                if (chat.id.toString() === message.chatSessionId.toString()) {
                  return { 
                    ...chat, 
                    lastMessage: message.text, 
                    time: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: (chat.unread || 0) + 1
                  };
                }
                return chat;
              }));
            }
          });
        })
        .catch(e => console.log('Connection failed: ', e));

      return () => {
         connection.off('ReceiveMessage');
         connection.stop();
      }
    }
  }, [connection]);

  // Fetch Sessions
  const fetchSessions = useCallback(async (setActive = true) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5024/api/chats/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.map(c => ({
           ...c,
           unread: 0
        })));
        if (setActive && data.length > 0 && !activeChatId) {
          setActiveChatId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeChatId]);

  useEffect(() => {
    fetchSessions(true);
  }, [fetchSessions]);

  // Search Users
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5024/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            setSearchResults(await response.json());
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStartDM = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5024/api/chats/dm/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        await fetchSessions(false); // Refresh list
        setActiveChatId(data.sessionId);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (e) {
      console.error("Error starting DM:", e);
    }
  };

  const loadMessages = async (chatId, currentSkip) => {
    try {
      setIsMessagesLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5024/api/chats/${chatId}/messages?skip=${currentSkip}&take=${take}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // The API returns newest first (descending). We need ascending order for display.
        const sortedData = data.reverse();
        
        if (sortedData.length < take) {
           setHasMore(false);
        } else {
           setHasMore(true);
        }

        if (currentSkip === 0) {
          setMessages(sortedData);
          setTimeout(scrollToBottom, 100);
        } else {
          // Prepend older messages
          const scrollHeightBefore = messagesContainerRef.current?.scrollHeight;
          setMessages(prev => [...sortedData, ...prev]);
          
          // Maintain scroll position
          setTimeout(() => {
            if (messagesContainerRef.current) {
               messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - scrollHeightBefore;
            }
          }, 0);
        }
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  // Change Active Chat
  useEffect(() => {
    if (activeChatId) {
       // Leave old group if any
       if (currentChatIdRef.current && connection?.state === 'Connected') {
          connection.invoke('LeaveChat', currentChatIdRef.current.toString()).catch(console.error);
       }
       
       currentChatIdRef.current = activeChatId;
       
       // Join new group
       if (connection?.state === 'Connected') {
          connection.invoke('JoinChat', activeChatId.toString()).catch(console.error);
       }
       
       setMessages([]);
       setSkip(0);
       skipRef.current = 0;
       setHasMore(true);
       
       loadMessages(activeChatId, 0);

       // Mark as read
       setConversations(prev => prev.map(chat => 
        chat.id === activeChatId ? { ...chat, unread: 0 } : chat
      ));
    }
  }, [activeChatId, connection]);

  const handleScroll = (e) => {
     if (e.target.scrollTop === 0 && hasMore && !isMessagesLoading) {
         const newSkip = skipRef.current + take;
         setSkip(newSkip);
         skipRef.current = newSkip;
         loadMessages(activeChatId, newSkip);
     }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    if (connection?.state === 'Connected') {
      try {
        await connection.invoke('SendMessage', activeChatId.toString(), inputText);
        setInputText('');
      } catch (err) {
        console.error("Error sending message:", err);
      }
    } else {
      console.warn('SignalR not connected');
    }
  };

  const activeChat = conversations.find(c => c.id === activeChatId);

  const filteredConversations = conversations.filter(c => {
    if (filter === 'groups') return c.isGroup;
    if (filter === 'direct') return !c.isGroup;
    return true; // all
  });

  if (isLoading) {
    return (
      <div className="chats-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="chats-container">
      {/* Left Sidebar - Chat List */}
      <div className="chats-sidebar">
        <div className="chats-sidebar-header">
          <h2>Chats</h2>
          <div className="chats-actions">
            <button className="icon-btn new-chat-btn" title="New Chat"><NewChatIcon /></button>
          </div>
        </div>
        <div className="chats-search">
          <div className="search-input-wrapper">
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Search users or chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Chat Filters */}
        <div style={{ display: 'flex', padding: '0 20px 10px', gap: '10px' }}>
          <button 
            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: filter === 'all' ? 'var(--accent-color)' : 'var(--bg-card-hover)', color: filter === 'all' ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setFilter('all')}
          >All</button>
          <button 
            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: filter === 'groups' ? 'var(--accent-color)' : 'var(--bg-card-hover)', color: filter === 'groups' ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setFilter('groups')}
          >Teams</button>
          <button 
            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: 'none', background: filter === 'direct' ? 'var(--accent-color)' : 'var(--bg-card-hover)', color: filter === 'direct' ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setFilter('direct')}
          >Direct</button>
        </div>

        <div className="chats-list">
          {searchQuery.trim().length > 0 ? (
            <div className="search-results">
              {isSearching ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</div>
              ) : (
                searchResults.map(user => (
                  <div 
                    key={user.id} 
                    className="chat-item"
                    onClick={() => handleStartDM(user.id)}
                  >
                    <div className="chat-avatar-container">
                      <img src={user.avatar} alt={user.name} className="chat-avatar" />
                    </div>
                    <div className="chat-item-content">
                      <div className="chat-item-top">
                         <span className="chat-name">{user.name}</span>
                      </div>
                      <div className="chat-item-bottom">
                         <span className="chat-last-message">Start a direct message</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No chats found.</div>
          ) : (
            filteredConversations.map(chat => (
              <div 
                key={chat.id} 
                className={`chat-item ${activeChatId === chat.id ? 'active' : ''} ${chat.unread > 0 ? 'unread' : ''}`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <div className="chat-avatar-container">
                  <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
                  <span className={`status-indicator ${chat.status}`}></span>
                </div>
                <div className="chat-item-content">
                  <div className="chat-item-top">
                     <span className="chat-name">{chat.name}</span>
                     <span className="chat-time">{chat.time}</span>
                  </div>
                  <div className="chat-item-bottom">
                     <span className="chat-last-message">{chat.lastMessage}</span>
                     {chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Main Area - Active Chat */}
      <div className="chats-main">
        {activeChat ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar-container">
                  <img src={activeChat.avatar} alt={activeChat.name} className="chat-avatar" />
                  <span className={`status-indicator ${activeChat.status}`}></span>
                </div>
                <div>
                  <h3 className="chat-header-name">{activeChat.name}</h3>
                  <span className="chat-header-status">
                    {activeChat.isGroup ? `Project Team` : activeChat.status.charAt(0).toUpperCase() + activeChat.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="icon-btn header-btn"><VideoIcon /></button>
                <button className="icon-btn header-btn"><PhoneIcon /></button>
                <button className="icon-btn header-btn"><ScreenShareIcon /></button>
                <div className="divider"></div>
                <button className="icon-btn header-btn"><MoreIcon /></button>
              </div>
            </div>

            <div className="chat-messages-area" ref={messagesContainerRef} onScroll={handleScroll}>
              {isMessagesLoading && <div style={{textAlign: 'center', padding: '10px', color: 'var(--text-muted)'}}>Loading older messages...</div>}
              {messages.length === 0 && !isMessagesLoading && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
                  No messages yet. Start the conversation!
                </div>
              )}
              {messages.map((msg, index) => {
                const isMine = msg.senderId.toString() === myUserId?.toString();
                const showSender = !isMine && (index === 0 || messages[index - 1].senderId !== msg.senderId);
                return (
                  <div key={msg.id} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                    {!isMine && showSender && (
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=random`} 
                        alt={msg.senderName} 
                        className="message-avatar" 
                      />
                    )}
                    {!isMine && !showSender && <div className="message-avatar-spacer"></div>}
                    <div className="message-content">
                      {showSender && <div className="message-sender">{msg.senderName}</div>}
                      <div className="message-bubble">
                        {msg.text}
                      </div>
                      <div className="message-time">{msg.time}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <form onSubmit={handleSendMessage} className="chat-input-form">
                <div className="chat-toolbar">
                  <button type="button" className="icon-btn"><FormatIcon /></button>
                  <button type="button" className="icon-btn"><AttachmentIcon /></button>
                  <button type="button" className="icon-btn"><EmojiIcon /></button>
                  <button type="button" className="icon-btn"><GifIcon /></button>
                </div>
                <div className="input-row">
                  <textarea 
                    placeholder={`Message ${activeChat.name}`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    rows={1}
                  />
                  <button type="submit" className="send-btn" disabled={!inputText.trim()}>
                    <SendIcon />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon"><ChatBubbleIcon /></div>
            <h3>Select a chat to start messaging</h3>
          </div>
        )}
      </div>
    </div>
  );
};

// SVG Icons
const NewChatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SearchIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const VideoIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const PhoneIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const ScreenShareIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>;
const MoreIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>;
const FormatIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>;
const AttachmentIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>;
const EmojiIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>;
const GifIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect><path d="M6 14h2"></path><path d="M14 14V10"></path><path d="M18 10v4"></path></svg>;
const SendIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const ChatBubbleIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;

export default Chats;
