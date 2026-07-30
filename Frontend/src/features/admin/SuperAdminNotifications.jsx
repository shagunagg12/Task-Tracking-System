import React, { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, UserPlus, FileText, ShieldAlert, Check } from 'lucide-react';
import './SuperAdminNotifications.css';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

const getIconForType = (type) => {
  switch (type) {
    case 'alert': return <AlertTriangle size={20} className="text-danger" />;
    case 'success': return <CheckCircle size={20} className="text-success" />;
    case 'info': return <FileText size={20} className="text-primary" />;
    case 'user': return <UserPlus size={20} className="text-info" />;
    case 'warning': return <ShieldAlert size={20} className="text-warning" />;
    case 'task_update': return <Check size={20} className="text-success" />;
    case 'project_update': return <FileText size={20} className="text-primary" />;
    default: return <Bell size={20} className="text-primary" />;
  }
};

const SuperAdminNotifications = ({ notifications = [], setNotifications, unreadCount, setUnreadCount }) => {
  const [filter, setFilter] = useState('all');

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`http://localhost:5024/api/AdminDashboard/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
      if (setUnreadCount) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`http://localhost:5024/api/AdminDashboard/notifications/read-all`, { method: 'PATCH' });
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      if (setUnreadCount) setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const notifToDelete = notifications.find(n => n.id === id);
      await fetch(`http://localhost:5024/api/AdminDashboard/notifications/${id}`, { method: 'DELETE' });
      setNotifications(notifications.filter(notif => notif.id !== id));
      if (notifToDelete && !notifToDelete.isRead && setUnreadCount) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    return true;
  });

  return (
    <div className="sa-dashboard">
      <header className="sa-dash-header">
        <div>
          <h1 className="sa-dash-title">Notifications</h1>
          <p className="sa-dash-subtitle">View and manage system alerts and activity updates.</p>
        </div>
        <div className="sa-dash-actions">
          <select 
            className="sau-select" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread ({unreadCount})</option>
          </select>
          <button 
            className="sa-btn-outline" 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Check size={16} />
            Mark All as Read
          </button>
        </div>
      </header>

      <div className="sa-notifications-layout">
        {filteredNotifications.length === 0 ? (
          <div className="sa-empty-state">
            <Bell size={48} className="sa-empty-icon" />
            <h3>No notifications found</h3>
            <p>You're all caught up! There are no {filter === 'unread' ? 'unread ' : ''}notifications to display.</p>
          </div>
        ) : (
          <div className="sa-notifications-list">
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`sa-notification-card ${!notif.isRead ? 'unread' : ''} fade-in`}
              >
                <div className="sa-notif-icon-container">
                  {getIconForType(notif.type)}
                </div>
                <div className="sa-notif-content">
                  <div className="sa-notif-header">
                    <h4>{notif.title}</h4>
                    <span className="sa-notif-time">{formatTimeAgo(notif.createdAt)}</span>
                  </div>
                  <p>{notif.message}</p>
                </div>
                <div className="sa-notif-actions">
                  {!notif.isRead && (
                    <button 
                      className="sa-btn-text" 
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as read"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button 
                    className="sa-btn-text danger-text" 
                    onClick={() => handleDelete(notif.id)}
                    title="Remove notification"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminNotifications;
