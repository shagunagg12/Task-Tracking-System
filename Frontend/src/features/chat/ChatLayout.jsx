import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import axios from 'axios';
import { Send, User, MessageCircle, MoreVertical, Search, Users, Mic, Paperclip, FileText, Image as ImageIcon, Trash2, Smile, Reply, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { format } from 'date-fns';
import './ChatLayout.css';

const API_URL = `${import.meta.env.VITE_API_URL}`;
const BASE_URL = API_URL.replace('/api', '');

const ChatLayout = () => {
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' | 'projects'
  
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [connection, setConnection] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Mentions
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const inputRef = useRef(null);

  // Use refs for closure access in SignalR event listeners
  const selectedUserRef = useRef(null);
  const selectedProjectRef = useRef(null);
  const currentUserIdRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Emojis
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Replies
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  
  // Media and Upload
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { selectedProjectRef.current = selectedProject; }, [selectedProject]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  const token = localStorage.getItem('token');

  const getUserIdFromToken = (token) => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.nameid || payload.sub;
    } catch (e) {
      return null;
    }
  };

  const userId = getUserIdFromToken(token);

  useEffect(() => {
    if (userId) {
      setCurrentUserId(parseInt(userId));
    }

    const fetchData = async () => {
      try {
        const [usersRes, projectsRes] = await Promise.all([
          axios.get(`${API_URL}/Users`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/Projects`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUsers(usersRes.data.filter(u => u.id !== parseInt(userId)));
        setProjects(projectsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

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
          connection.invoke('GetOnlineUsers')
            .then(users => {
              setOnlineUsers(new Set(users.map(String)));
            })
            .catch(e => console.error('Error fetching online users:', e));
        })
        .catch(e => console.log('Connection failed: ', e));
    }
  }, [connection]);

  // Join Project Groups when projects load
  useEffect(() => {
    if (connection?.state === signalR.HubConnectionState.Connected && projects.length > 0) {
      projects.forEach(p => {
        connection.invoke('JoinProjectGroup', p.id).catch(e => console.error('Join group failed', e));
      });
    }
  }, [connection, projects]);

  useEffect(() => {
    if (!connection) return;

    const handleReceiveMessage = (message) => {
      const currentSelectedUser = selectedUserRef.current;
      const currentId = currentUserIdRef.current;

      const msgSenderId = message.senderId ?? message.SenderId;
      const msgReceiverId = message.receiverId ?? message.ReceiverId;
      const msgId = message.id ?? message.Id;

      if (msgSenderId !== currentId && msgSenderId === currentSelectedUser?.id) {
        axios.put(`${API_URL}/Messages/mark-read/${msgSenderId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(e => console.error('Failed to mark incoming active message as read:', e));
      }

      setMessages((prevMessages) => {
        if (
          (msgSenderId === currentSelectedUser?.id) ||
          (msgSenderId === currentId && msgReceiverId === currentSelectedUser?.id)
        ) {
          if (msgSenderId === currentSelectedUser?.id) setIsTyping(false);
          if (!prevMessages.find(m => (m.id ?? m.Id) === msgId && msgId !== 0)) {
            return [...prevMessages, message];
          }
        }
        return prevMessages;
      });

      setUsers(prevUsers => {
        const newUsers = [...prevUsers];
        const userIndex = newUsers.findIndex(u => u.id === (msgSenderId === currentId ? msgReceiverId : msgSenderId));
        
        if (userIndex !== -1) {
          const updatedUser = { ...newUsers[userIndex] };
          const timestamp = message.timestamp ?? message.Timestamp;
          updatedUser.lastMessageTime = timestamp || new Date().toISOString();
          
          if (msgSenderId !== currentId && msgSenderId !== currentSelectedUser?.id) {
            updatedUser.unreadCount = (updatedUser.unreadCount || 0) + 1;
          } else if (msgSenderId !== currentId && msgSenderId === currentSelectedUser?.id) {
            updatedUser.unreadCount = 0;
          }
          
          newUsers.splice(userIndex, 1);
          newUsers.unshift(updatedUser);
        }
        return newUsers;
      });
    };

    const handleReceiveProjectMessage = (message) => {
      const currentSelectedProject = selectedProjectRef.current;
      const msgProjectId = message.projectId ?? message.ProjectId;
      
      if (currentSelectedProject && msgProjectId === currentSelectedProject.id) {
        setMessages(prev => {
          if (!prev.find(m => (m.id ?? m.Id) === (message.id ?? message.Id))) {
            return [...prev, message];
          }
          return prev;
        });
      } else {
        // Increment unread count for project
        setProjects(prevProjects => {
          const newProjects = [...prevProjects];
          const projIndex = newProjects.findIndex(p => p.id === msgProjectId);
          if (projIndex !== -1) {
            const updatedProj = { ...newProjects[projIndex] };
            updatedProj.unreadCount = (updatedProj.unreadCount || 0) + 1;
            newProjects.splice(projIndex, 1);
            newProjects.unshift(updatedProj);
          }
          return newProjects;
        });
      }
    };

    const handleUserTyping = (senderId) => {
      const currentSelectedUser = selectedUserRef.current;
      if (currentSelectedUser && senderId === currentSelectedUser.id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleUserOnline = (userId) => {
      setOnlineUsers(prev => new Set(prev).add(String(userId)));
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    };

    const handleMessageDeleted = (id) => {
      setMessages(prev => prev.filter(m => (m.id ?? m.Id) !== id));
    };

    const handleProjectMessageDeleted = (id) => {
      setMessages(prev => prev.filter(m => (m.id ?? m.Id) !== id));
    };

    connection.on('ReceiveMessage', handleReceiveMessage);
    connection.on('ReceiveProjectMessage', handleReceiveProjectMessage);
    connection.on('UserTyping', handleUserTyping);
    connection.on('UserOnline', handleUserOnline);
    connection.on('UserOffline', handleUserOffline);
    connection.on('MessageDeleted', handleMessageDeleted);
    connection.on('ProjectMessageDeleted', handleProjectMessageDeleted);

    return () => {
      connection.off('ReceiveMessage', handleReceiveMessage);
      connection.off('ReceiveProjectMessage', handleReceiveProjectMessage);
      connection.off('UserTyping', handleUserTyping);
      connection.off('UserOnline', handleUserOnline);
      connection.off('UserOffline', handleUserOffline);
      connection.off('MessageDeleted', handleMessageDeleted);
      connection.off('ProjectMessageDeleted', handleProjectMessageDeleted);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [connection]);

  // Load chat history for selected user
  useEffect(() => {
    if (selectedUser) {
      setSelectedProject(null); // Deselect project
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
      if (showProfile) setShowProfile(false);

      if (selectedUser.unreadCount > 0) {
        axios.put(`${API_URL}/Messages/mark-read/${selectedUser.id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(() => {
          setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unreadCount: 0 } : u));
        }).catch(console.error);
      }
    }
  }, [selectedUser]);

  // Load chat history for selected project
  useEffect(() => {
    if (selectedProject) {
      setSelectedUser(null); // Deselect user
      const fetchProjectHistory = async () => {
        try {
          const response = await axios.get(`${API_URL}/Messages/project-history/${selectedProject.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMessages(response.data);
        } catch (error) {
          console.error('Error fetching project history:', error);
        }
      };
      
      fetchProjectHistory();
      if (showProfile) setShowProfile(false);
      
      if (selectedProject.unreadCount > 0) {
         setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, unreadCount: 0 } : p));
      }
    }
  }, [selectedProject]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    
    // Check for mentions trigger
    if (selectedProject) {
      const cursor = e.target.selectionStart;
      const textBeforeCursor = val.slice(0, cursor);
      const match = textBeforeCursor.match(/@(\w*)$/);
      
      if (match) {
        setShowMentions(true);
        setMentionFilter(match[1]);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    }

    if (connection && selectedUser) {
      connection.invoke('SendTyping', currentUserId, selectedUser.id).catch(console.error);
    }
  };

  const handleMentionSelect = (member) => {
    const cursor = inputRef.current.selectionStart;
    const textBefore = newMessage.slice(0, cursor);
    const textAfter = newMessage.slice(cursor);
    
    const newTextBefore = textBefore.replace(/@(\w*)$/, `@${member.name || 'User'} `);
    
    setNewMessage(newTextBefore + textAfter);
    setShowMentions(false);
    inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (showMentions && selectedProject) {
      const filteredMembers = selectedProject.teamMembers?.filter(m => 
        (m.name || '').toLowerCase().includes(mentionFilter.toLowerCase())
      ) || [];
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMembers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMembers[mentionIndex]) {
          handleMentionSelect(filteredMembers[mentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const uploadAndSend = async (file, fileType) => {
    if (!selectedUser && !selectedProject) return;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    try {
      const response = await axios.post(`${API_URL}/Upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      const { url, type } = response.data;
      
      const msgText = type === 'audio' ? '[Voice Message]' : (type === 'image' ? '[Image]' : '[Attachment]');
      
      if (selectedUser) {
        await connection.invoke('SendMessage', currentUserId, selectedUser.id, msgText, url, type, replyingToMessage?.id || null);
      } else if (selectedProject) {
        await connection.invoke('SendProjectMessage', selectedProject.id, currentUserId, msgText, url, type, replyingToMessage?.id || null);
      }
      setReplyingToMessage(null);
    } catch (e) {
      console.error('Upload failed:', e);
      alert('Failed to upload file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    uploadAndSend(file, isImage ? 'image' : 'raw');
    e.target.value = null; // reset
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_${new Date().getTime()}.webm`, { type: 'audio/webm' });
        uploadAndSend(file, 'audio');
        
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connection) return;
    if (!selectedUser && !selectedProject) return;

    const msgText = newMessage;
    setNewMessage('');
    setShowMentions(false);
    setShowEmojiPicker(false);

    try {
      if (selectedUser) {
        await connection.invoke('SendMessage', currentUserId, selectedUser.id, msgText, null, null, replyingToMessage?.id || null);
      } else if (selectedProject) {
        await connection.invoke('SendProjectMessage', selectedProject.id, currentUserId, msgText, null, null, replyingToMessage?.id || null);
      }
      setReplyingToMessage(null);
    } catch (e) {
      console.error('Send message failed:', e);
    }
  };

  const deleteMessage = (msgId, isProject) => {
    setMessageToDelete({ id: msgId, isProject });
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    const { id: msgId, isProject } = messageToDelete;
    setMessageToDelete(null);
    try {
      const endpoint = isProject ? `${API_URL}/Messages/project/${msgId}` : `${API_URL}/Messages/${msgId}`;
      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The local state will be updated automatically via the SignalR deletion event
    } catch (e) {
      console.error('Delete message failed:', e);
      alert('Failed to delete message.');
    }
  };

  const toggleProfile = () => {
    if (!showProfile && selectedUser) {
      setIsLoadingProfile(true);
      axios.get(`${API_URL}/Users/${selectedUser.id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setProfileData(res.data))
        .catch(console.error)
        .finally(() => setIsLoadingProfile(false));
    }
    setShowProfile(!showProfile);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (searchQuery.trim() === '') {
      return u.lastMessageTime != null;
    } else {
      return matchesSearch;
    }
  });
  
  const filteredProjects = projects.filter(p =>
    p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h2><MessageCircle className="icon" /> Messages</h2>
        </div>
        
        <div className="sidebar-tabs">
          <button className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`} onClick={() => setActiveTab('direct')}>Direct</button>
          <button className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>Projects</button>
        </div>

        <div className="sidebar-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="users-list">
          {activeTab === 'direct' ? (
            <>
              {filteredUsers.map((u) => {
                const isOnline = onlineUsers.has(String(u.id));
                return (
                <div key={u.id} className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`} onClick={() => setSelectedUser(u)}>
                  <div className="user-avatar-container">
                    <div className="user-avatar">
                      {u.avatar ? <img src={u.avatar} alt={u.name} /> : <User size={20} />}
                    </div>
                    <span className={`status-indicator-dot ${isOnline ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="user-info">
                    <h4>{u.name || u.email.split('@')[0]}</h4>
                    <p className="user-status" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                      {u.lastMessageContent || (isOnline ? 'Online' : 'Offline')}
                    </p>
                  </div>
                  {u.unreadCount > 0 && <div className="unread-badge">{u.unreadCount}</div>}
                </div>
                );
              })}
              {filteredUsers.length === 0 && <div className="no-users">No users found.</div>}
            </>
          ) : (
            <>
              {filteredProjects.map((p) => (
                <div key={p.id} className={`user-item ${selectedProject?.id === p.id ? 'active' : ''}`} onClick={() => setSelectedProject(p)}>
                  <div className="user-avatar-container">
                    <div className="user-avatar">
                      <Users size={20} />
                    </div>
                  </div>
                  <div className="user-info">
                    <h4>{p.name}</h4>
                    <p className="user-status">{p.teamMembers?.length || 0} Members</p>
                  </div>
                  {p.unreadCount > 0 && <div className="unread-badge">{p.unreadCount}</div>}
                </div>
              ))}
              {filteredProjects.length === 0 && <div className="no-users">No projects found.</div>}
            </>
          )}
        </div>
      </div>

      <div className="chat-main">
        {(selectedUser || selectedProject) ? (
          <>
            <div className="chat-header">
              {selectedUser ? (
                <div className="chat-header-info clickable-profile" onClick={toggleProfile} title="View Profile">
                  <div className="user-avatar-container">
                    <div className="chat-header-avatar">
                      {selectedUser.avatar ? <img src={selectedUser.avatar} alt={selectedUser.name} /> : <User size={24} />}
                    </div>
                    <span className={`status-indicator-dot header-dot ${onlineUsers.has(String(selectedUser.id)) ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="chat-header-text">
                    <h3>{selectedUser.name || selectedUser.email.split('@')[0]}</h3>
                    <p className="header-status-text">{onlineUsers.has(String(selectedUser.id)) ? 'Active now' : 'Offline'}</p>
                  </div>
                </div>
              ) : (
                <div className="chat-header-info clickable-profile" onClick={() => setShowProfile(!showProfile)} title="View Project Details">
                  <div className="user-avatar-container">
                    <div className="chat-header-avatar project-avatar">
                      <Users size={24} />
                    </div>
                  </div>
                  <div className="chat-header-text">
                    <h3>{selectedProject.name}</h3>
                    <p className="header-status-text">{selectedProject.teamMembers?.length || 0} Members</p>
                  </div>
                </div>
              )}
            </div>

            <div className="messages-area">
              {messages.map((msg, index) => {
                const msgId = msg.id ?? msg.Id ?? index;
                const msgSenderId = msg.senderId ?? msg.SenderId;
                const msgContent = msg.content ?? msg.Content;
                const msgTimestamp = msg.timestamp ?? msg.Timestamp;
                const msgSenderName = msg.senderName ?? msg.SenderName;

                const msgReplyToId = msg.replyToMessageId ?? msg.ReplyToMessageId;
                const quotedMsg = msgReplyToId ? messages.find(m => (m.id ?? m.Id) === msgReplyToId) : null;

                return (
                  <div key={msgId} className={`message-bubble-wrapper ${msgSenderId === currentUserId ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                      {quotedMsg && (
                        <div className="quoted-message-block">
                          <span className="quoted-sender">{quotedMsg.senderName ?? quotedMsg.SenderName ?? 'User'}</span>
                          <p className="quoted-text">
                            {(quotedMsg.content ?? quotedMsg.Content) || 'Media file'}
                          </p>
                        </div>
                      )}
                      
                      {selectedProject && msgSenderId !== currentUserId && (
                        <div className="message-sender-name">{msgSenderName}</div>
                      )}
                      
                      {msg.fileUrl || msg.FileUrl ? (
                        <div className="message-attachment">
                          {(msg.fileType || msg.FileType) === 'audio' || (msg.fileType || msg.FileType) === 'video' ? (
                            <audio controls src={msg.fileUrl || msg.FileUrl} className="audio-player" />
                          ) : (msg.fileType || msg.FileType) === 'image' ? (
                            <img src={msg.fileUrl || msg.FileUrl} alt="attachment" className="image-attachment" onClick={() => window.open(msg.fileUrl || msg.FileUrl, '_blank')} style={{cursor: 'pointer'}} />
                          ) : (
                            <a href={msg.fileUrl || msg.FileUrl} target="_blank" rel="noopener noreferrer" className="raw-attachment">
                              <FileText size={16} /> Download File
                            </a>
                          )}
                        </div>
                      ) : (
                        <p className="message-content">
                           {msgContent.split(/(@\w+)/g).map((part, i) => 
                             part.startsWith('@') ? <span key={i} className="mention-highlight">{part}</span> : part
                           )}
                        </p>
                      )}
                      
                      <span className="message-time">
                        {msgTimestamp ? format(new Date(msgTimestamp), 'HH:mm') : format(new Date(), 'HH:mm')}
                      </span>
                    </div>
                    <div className="message-actions">
                      <button 
                        className="reply-msg-btn" 
                        onClick={() => setReplyingToMessage({ id: msgId, senderName: msgSenderName ?? 'User', content: msgContent })}
                        title="Reply to Message"
                      >
                        <Reply size={14} />
                      </button>
                      {msgSenderId === currentUserId && (
                        <button 
                          className="delete-msg-btn" 
                          onClick={() => deleteMessage(msgId, !!selectedProject)}
                          title="Delete Message"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {isTyping && selectedUser && (
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

            {replyingToMessage && (
              <div className="reply-banner">
                <div className="reply-banner-content">
                  <span className="replying-to-label">Replying to {replyingToMessage.senderName}</span>
                  <p className="replying-to-text">{replyingToMessage.content || 'Media file'}</p>
                </div>
                <button className="cancel-reply-btn" onClick={() => setReplyingToMessage(null)}>
                  <X size={16} />
                </button>
              </div>
            )}

            <form className="message-input-area" onSubmit={sendMessage}>
              {showMentions && selectedProject && (
                <div className="mentions-popup">
                  {(selectedProject.teamMembers?.filter(m => (m.name || '').toLowerCase().includes(mentionFilter.toLowerCase())) || []).map((member, i) => (
                    <div 
                      key={i} 
                      className={`mention-item ${i === mentionIndex ? 'active' : ''}`}
                      onClick={() => handleMentionSelect(member)}
                    >
                      {member.image ? <img src={member.image} alt="" className="mention-avatar"/> : <User size={16} />}
                      <span>{member.name || 'User'}</span>
                    </div>
                  ))}
                </div>
              )}

              {showEmojiPicker && (
                <div className="emoji-picker-wrapper">
                  <EmojiPicker 
                    onEmojiClick={(emojiObject) => {
                      setNewMessage(prev => prev + emojiObject.emoji);
                    }} 
                    theme="dark"
                    skinTonesDisabled={true}
                    previewConfig={{ showPreview: false }}
                    emojiStyle="apple"
                  />
                </div>
              )}
              
              <button type="button" className="attachment-btn" onClick={() => setShowEmojiPicker(prev => !prev)} disabled={isUploading || isRecording}>
                <Smile size={18} />
              </button>
              
              <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} />
              
              <button type="button" className="attachment-btn" onClick={handleFileClick} disabled={isUploading || isRecording}>
                <Paperclip size={18} />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder={isRecording ? "Recording audio..." : (isUploading ? "Uploading file..." : "Type a message...")}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isRecording || isUploading}
              />
              
              {newMessage.trim() ? (
                <button type="submit" disabled={isUploading}>
                  <Send size={18} />
                </button>
              ) : (
                <button 
                  type="button" 
                  className={`mic-btn ${isRecording ? 'recording' : ''}`}
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  disabled={isUploading}
                >
                  <Mic size={18} />
                </button>
              )}
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-icon">
              <MessageCircle size={64} />
            </div>
            <h2>Your Messages</h2>
            <p>Select a user or project from the sidebar to start a conversation.</p>
          </div>
        )}
      </div>

      {messageToDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Delete Message</h3>
            <p>Are you sure you want to delete this message? This action cannot be undone.</p>
            <div className="delete-modal-actions">
              <button className="cancel-delete-btn" onClick={() => setMessageToDelete(null)}>Cancel</button>
              <button className="confirm-delete-btn" onClick={confirmDeleteMessage}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showProfile && (selectedUser || selectedProject) && (
        <div className="profile-sidebar">
          <div className="profile-header">
            <h3>{selectedUser ? 'Contact Info' : 'Project Details'}</h3>
            <button className="close-profile-btn" onClick={() => setShowProfile(false)}>×</button>
          </div>
          <div className="profile-content-area">
            {selectedUser ? (
              isLoadingProfile ? (
                <div className="profile-loading">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              ) : profileData ? (
                <div className="profile-details-card">
                  <div className="profile-avatar-large">
                    {profileData.avatar ? <img src={profileData.avatar} alt={profileData.name} /> : <User size={80} />}
                  </div>
                  <h2 className="profile-name">{profileData.name}</h2>
                  <p className="profile-designation">{profileData.designation}</p>
                  
                  <div className="profile-info-group">
                    <div className="profile-info-item">
                      <span className="info-label">Email</span>
                      <span className="info-value">{profileData.email}</span>
                    </div>
                    {profileData.department && (
                      <div className="profile-info-item">
                        <span className="info-label">Department</span>
                        <span className="info-value">{profileData.department}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="profile-error">Failed to load profile.</p>
              )
            ) : (
              <div className="profile-details-card">
                <div className="profile-avatar-large project-avatar" style={{ marginBottom: '12px' }}>
                  <Users size={48} />
                </div>
                <h2 className="profile-name">{selectedProject.name}</h2>
                <p className="profile-designation">{selectedProject.teamMembers?.length || 0} Members</p>
                
                <h4 style={{ color: '#fafafa', alignSelf: 'flex-start', marginTop: '16px', marginBottom: '8px', fontSize: '0.9rem' }}>Team Members</h4>
                <div className="profile-info-group" style={{ gap: '1px' }}>
                  {selectedProject.teamMembers?.map((member, i) => (
                    <div 
                      key={i} 
                      className="profile-info-item" 
                      style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#18181b'}
                      onClick={() => {
                        const targetUser = users.find(u => u.id === member.userId || (u.name && u.name.toLowerCase() === (member.name || '').toLowerCase()));
                        if (targetUser) {
                          setShowProfile(false);
                          setActiveTab('direct');
                          setSelectedProject(null);
                          setSelectedUser(targetUser);
                        } else {
                          alert('This member does not have a registered account.');
                        }
                      }}
                    >
                      {member.image ? <img src={member.image} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} alt=""/> : <User size={32} />}
                      <span className="info-value" style={{ fontWeight: '500' }}>{member.name || 'User'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLayout;
