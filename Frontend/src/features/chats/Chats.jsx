import React, { useState, useRef, useEffect } from 'react';
import './Chats.css';

const MOCK_CONVERSATIONS = [
  {
    id: 1,
    name: 'Project Alpha Team',
    avatar: 'https://ui-avatars.com/api/?name=Project+Alpha&background=0D8ABC&color=fff',
    lastMessage: 'Let\'s finalize the deployment today.',
    time: '10:30 AM',
    unread: 2,
    isGroup: true,
    status: 'online',
    messages: [
      { id: 1, sender: 'Alice', text: 'Are we still on track for Friday?', time: '10:15 AM', isMine: false },
      { id: 2, sender: 'Me', text: 'Yes, just finishing up the last few bugs.', time: '10:20 AM', isMine: true },
      { id: 3, sender: 'Bob', text: 'Let\'s finalize the deployment today.', time: '10:30 AM', isMine: false },
    ]
  },
  {
    id: 2,
    name: 'Sarah Connor',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=4CAF50&color=fff',
    lastMessage: 'Got it, thanks!',
    time: 'Yesterday',
    unread: 0,
    isGroup: false,
    status: 'away',
    messages: [
      { id: 1, sender: 'Me', text: 'I sent you the documents.', time: 'Yesterday 2:00 PM', isMine: true },
      { id: 2, sender: 'Sarah', text: 'Got it, thanks!', time: 'Yesterday 2:15 PM', isMine: false },
    ]
  },
  {
    id: 3,
    name: 'Design Sync',
    avatar: 'https://ui-avatars.com/api/?name=Design+Sync&background=E91E63&color=fff',
    lastMessage: 'The new mockups look great.',
    time: 'Monday',
    unread: 0,
    isGroup: true,
    status: 'offline',
    messages: [
      { id: 1, sender: 'Mike', text: 'Check out the Figma link.', time: 'Monday 9:00 AM', isMine: false },
      { id: 2, sender: 'Me', text: 'The new mockups look great.', time: 'Monday 9:15 AM', isMine: true },
    ]
  },
  {
    id: 4,
    name: 'IT Support',
    avatar: 'https://ui-avatars.com/api/?name=IT+Support&background=F44336&color=fff',
    lastMessage: 'Your ticket has been resolved.',
    time: 'Aug 21',
    unread: 0,
    isGroup: false,
    status: 'online',
    messages: [
      { id: 1, sender: 'Support', text: 'Your ticket has been resolved.', time: 'Aug 21 11:00 AM', isMine: false }
    ]
  }
];

const Chats = () => {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [activeChatId, setActiveChatId] = useState(MOCK_CONVERSATIONS[0].id);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const activeChat = conversations.find(c => c.id === activeChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: 'Me',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true
    };

    setConversations(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: inputText,
          time: newMessage.time
        };
      }
      return chat;
    }));

    setInputText('');
  };

  const markAsRead = (id) => {
    setConversations(prev => prev.map(chat => 
      chat.id === id ? { ...chat, unread: 0 } : chat
    ));
    setActiveChatId(id);
  };

  return (
    <div className="chats-container">
      {/* Left Sidebar - Chat List */}
      <div className="chats-sidebar">
        <div className="chats-sidebar-header">
          <h2>Chats</h2>
          <div className="chats-actions">
            <button className="icon-btn" title="Filter"><FilterIcon /></button>
            <button className="icon-btn new-chat-btn" title="New Chat"><NewChatIcon /></button>
          </div>
        </div>
        <div className="chats-search">
          <div className="search-input-wrapper">
            <SearchIcon />
            <input type="text" placeholder="Search chats..." />
          </div>
        </div>
        <div className="chats-list">
          {conversations.map(chat => (
            <div 
              key={chat.id} 
              className={`chat-item ${activeChatId === chat.id ? 'active' : ''} ${chat.unread > 0 ? 'unread' : ''}`}
              onClick={() => markAsRead(chat.id)}
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
          ))}
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
                    {activeChat.isGroup ? 'Group Chat' : activeChat.status.charAt(0).toUpperCase() + activeChat.status.slice(1)}
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

            <div className="chat-messages-area">
              <div className="date-divider"><span>Today</span></div>
              {activeChat.messages.map((msg, index) => {
                const showSender = !msg.isMine && (index === 0 || activeChat.messages[index - 1].sender !== msg.sender);
                return (
                  <div key={msg.id} className={`message-wrapper ${msg.isMine ? 'mine' : 'theirs'}`}>
                    {!msg.isMine && showSender && (
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender)}&background=random`} 
                        alt={msg.sender} 
                        className="message-avatar" 
                      />
                    )}
                    {!msg.isMine && !showSender && <div className="message-avatar-spacer"></div>}
                    <div className="message-content">
                      {showSender && <div className="message-sender">{msg.sender}</div>}
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
                    placeholder="Type a new message"
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
const FilterIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
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
