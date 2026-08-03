import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, Users, Building2, Shield, CheckSquare, 
  Briefcase, Calendar, Clock, DollarSign, Star, 
  BarChart2, LineChart, Bell, FileText, Activity, Settings, 
  Search, Plus, ChevronDown, Moon, Sun, X, CheckCircle2,
  AlertCircle, Briefcase as BriefcaseIcon, ChevronRight, Inbox
} from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import './SuperAdminLayout.css';
import './AdminToast.css';
import SuperAdminDashboard from './SuperAdminDashboard';
import SuperAdminProjects from './SuperAdminProjects';
import SuperAdminUsers from './SuperAdminUsers';
import SuperAdminReports from './SuperAdminReports';
import SuperAdminSettings from './SuperAdminSettings';
import SuperAdminNotifications from './SuperAdminNotifications';
import SuperAdminDepartments from './SuperAdminDepartments';
import SuperAdminAnalytics from './SuperAdminAnalytics';
import SuperAdminRewards from './SuperAdminRewards';

// ─── Toast Notification Component ────────────────────────────────────────────
const ToastNotification = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 50);
    // Auto-dismiss after 5s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 400);
    }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  const typeConfig = {
    task_update:    { icon: <CheckCircle2 size={20} />, color: '#bef264', label: 'Task Update' },
    project_update: { icon: <BriefcaseIcon size={20} />, color: '#60a5fa', label: 'Project Update' },
    default:        { icon: <AlertCircle size={20} />, color: '#fbbf24', label: 'Activity' },
  };
  const cfg = typeConfig[toast.type] || typeConfig.default;
  const time = toast.createdAt ? new Date(toast.createdAt) : new Date();

  return (
    <div className={`sa-toast ${visible ? 'sa-toast-visible' : ''}`}>
      <div className="sa-toast-accent" style={{ background: cfg.color }} />
      <div className="sa-toast-icon" style={{ color: cfg.color }}>
        {cfg.icon}
      </div>
      <div className="sa-toast-body">
        <div className="sa-toast-label" style={{ color: cfg.color }}>{cfg.label}</div>
        <div className="sa-toast-title">{toast.title}</div>
        <div className="sa-toast-msg">{toast.message}</div>
        <div className="sa-toast-time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <button className="sa-toast-close" onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 400); }}>
        <X size={14} />
      </button>
      <div className="sa-toast-progress" style={{ '--toast-color': cfg.color }} />
    </div>
  );
};

// ─── Notification Panel Item ──────────────────────────────────────────────────
const NotifItem = ({ notif }) => {
  const typeConfig = {
    task_update:    { icon: <CheckCircle2 size={16} />, color: '#bef264', label: 'Task' },
    project_update: { icon: <BriefcaseIcon size={16} />, color: '#60a5fa', label: 'Project' },
    default:        { icon: <AlertCircle size={16} />, color: '#fbbf24', label: 'System' },
  };
  const cfg = typeConfig[notif.type] || typeConfig.default;
  const time = notif.createdAt ? new Date(notif.createdAt) : new Date();
  const timeStr = time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="sa-notif-item">
      <div className="sa-notif-item-icon" style={{ background: `${cfg.color}18`, color: cfg.color }}>
        {cfg.icon}
      </div>
      <div className="sa-notif-item-body">
        <div className="sa-notif-item-header">
          <span className="sa-notif-item-badge" style={{ background: `${cfg.color}20`, color: cfg.color }}>{cfg.label}</span>
          <span className="sa-notif-item-time">{timeStr}</span>
        </div>
        <div className="sa-notif-item-title">{notif.title}</div>
        <div className="sa-notif-item-msg">{notif.message}</div>
      </div>
    </div>
  );
};

// ─── Main Layout ─────────────────────────────────────────────────────────────
const SuperAdminLayout = ({ onSwitchToUser }) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminProfile, setAdminProfile] = useState(null);
  const notifRef = useRef(null);
  const toastIdRef = useRef(0);
  const addToastRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Keep addToast in a ref so the SignalR closure always has the latest version
  const addToast = useCallback((notification) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { ...notification, id }]);
  }, []);

  // Sync ref to latest callback
  addToastRef.current = addToast;

  useEffect(() => {
    const isDevelopment = import.meta.env.DEV;
    const backendUrl = isDevelopment ? (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5024') : window.location.origin;

    // Track the highest ID already loaded from DB — don't toast these
    let highestLoadedId = 0;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/api/AdminDashboard/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
          // Record the max ID already known — SignalR events with this ID or below are NOT new
          if (data.length > 0) {
            highestLoadedId = Math.max(...data.map(n => n.id || 0));
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial notifications", err);
      }
    };
    fetchNotifications();

    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/api/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdminProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin profile", err);
      }
    };
    fetchAdminProfile();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${backendUrl}/adminDashboardHub`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
      // Only toast truly NEW notifications (ID higher than what we loaded from DB)
      const notifId = notification.id || 0;
      if (notifId > highestLoadedId) {
        addToastRef.current(notification);
      }
      highestLoadedId = Math.max(highestLoadedId, notifId);
    });

    const startPromise = connection.start().catch(err => {
      if (err.name !== 'AbortError' && err.message !== 'The connection was stopped during negotiation.' && !err.message.includes('HttpConnection before stop')) {
        console.error("SignalR SuperAdmin Connection Error: ", err);
      }
    });

    return () => {
      startPromise.then(() => {
        connection.stop();
      });
    };
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      setUnreadCount(0); // mark as read locally
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      try {
        const token = localStorage.getItem('token');
        await fetch(`${backendUrl}/api/AdminDashboard/notifications/read-all`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to mark notifications as read", err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isSuperAdmin');
    window.location.reload();
  };

  const menuItems = [
    { id: 'Dashboard', icon: <LayoutDashboard size={20} />, text: 'Dashboard' },
    { id: 'User Management', icon: <Users size={20} />, text: 'User Management' },
    { id: 'Departments', icon: <Building2 size={20} />, text: 'Departments' },
    { id: 'Projects', icon: <Briefcase size={20} />, text: 'Projects' },
    { id: 'Reports', icon: <FileText size={20} />, text: 'Reports' },
    { id: 'Analytics', icon: <LineChart size={20} />, text: 'Analytics' },
    { id: 'Rewards', icon: <Star size={20} />, text: 'Rewards & Vouchers' },
    { id: 'Notifications', icon: <Bell size={20} />, text: 'Notifications' },
    { id: 'Settings', icon: <Settings size={20} />, text: 'Settings' },
  ];

  return (
    <>
    <div className={`sa-layout ${isDarkTheme ? 'sa-dark' : 'sa-light'}`}>
      
      {/* SIDEBAR */}
      <aside className="sa-sidebar">
        <div className="sa-sidebar-header">
          <div className="sa-logo">
            <div className="sa-logo-mark"></div>
            <span>Workspace</span>
          </div>
        </div>

        <div className="sa-sidebar-content">
          <div className="sa-menu-group-title">MAIN MENU</div>
          <ul className="sa-menu">
            {menuItems.map((item) => (
              <li 
                key={item.id}
                className={`sa-menu-item ${activeMenu === item.id ? 'sa-active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <span className="sa-menu-icon">{item.icon}</span>
                <span className="sa-menu-text">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="sa-main">
        {/* TOP NAV */}
        <header className="sa-topnav">
          <div className="sa-search-container">
            <Search className="sa-search-icon" size={18} />
            <input type="text" placeholder="Search across organization..." className="sa-search-input" />
            <div className="sa-shortcut">Ctrl K</div>
          </div>
          
          <div className="sa-topnav-actions">

            
            <button 
              className="sa-btn-outline" 
              onClick={onSwitchToUser}
              style={{ marginRight: '8px', fontSize: '13px' }}
              title="Switch to User Dashboard"
            >
              Back to User View
            </button>

            <button className="sa-icon-btn" onClick={toggleTheme}>
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* ── Notification Bell ── */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="sa-icon-btn" onClick={handleOpenNotifications}>
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="sa-notification-dot">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="sa-notif-panel">
                  {/* Panel Header */}
                  <div className="sa-notif-panel-header">
                    <div>
                      <h3 className="sa-notif-panel-title">Notifications</h3>
                      <p className="sa-notif-panel-sub">{notifications.length} total activities</p>
                    </div>
                    <button className="sa-notif-close-btn" onClick={() => setShowNotifications(false)}>
                      <X size={16} />
                    </button>
                  </div>

                  {/* Filter Tabs */}
                  <div className="sa-notif-tabs">
                    <button className="sa-notif-tab sa-notif-tab-active">All</button>
                    <button className="sa-notif-tab">Tasks</button>
                    <button className="sa-notif-tab">Projects</button>
                  </div>

                  {/* Notification List */}
                  <div className="sa-notif-list">
                    {notifications.length === 0 ? (
                      <div className="sa-notif-empty">
                        <Inbox size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                        <p>No notifications yet.</p>
                        <span>User activity will appear here in real-time.</span>
                      </div>
                    ) : (
                      notifications.map((notif, idx) => (
                        <NotifItem key={idx} notif={notif} />
                      ))
                    )}
                  </div>

                  {/* Panel Footer */}
                  {notifications.length > 0 && (
                    <div className="sa-notif-panel-footer">
                      <button className="sa-notif-view-all">
                        View All Activity <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="sa-profile-dropdown" onClick={handleLogout}>
              <img 
                src={adminProfile?.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminProfile?.fullName || 'Admin')}&background=random`} 
                alt="Profile" 
                className="sa-avatar" 
              />
              <div className="sa-profile-info">
                <span className="sa-profile-name">{adminProfile?.fullName || 'Super Admin'}</span>
                <span className="sa-profile-role">{adminProfile?.designation || 'System Admin'}</span>
              </div>
              <ChevronDown size={16} className="sa-profile-chevron" />
            </div>
          </div>
        </header>

        {/* CONTENT SCROLL */}
        <main className="sa-content-area">
           {activeMenu === 'Dashboard' ? (
             <SuperAdminDashboard />
           ) : activeMenu === 'Projects' ? (
             <SuperAdminProjects />
           ) : activeMenu === 'User Management' ? (
             <SuperAdminUsers />
           ) : activeMenu === 'Departments' ? (
             <SuperAdminDepartments addToast={addToast} />
           ) : activeMenu === 'Reports' ? (
             <SuperAdminReports />
           ) : activeMenu === 'Notifications' ? (
             <SuperAdminNotifications 
               notifications={notifications} 
               setNotifications={setNotifications} 
               unreadCount={unreadCount} 
               setUnreadCount={setUnreadCount} 
             />
           ) : activeMenu === 'Analytics' ? (
             <SuperAdminAnalytics />
           ) : activeMenu === 'Rewards' ? (
             <SuperAdminRewards />
           ) : activeMenu === 'Settings' ? (
             <SuperAdminSettings />
           ) : (
             <div className="sa-placeholder">
                <div className="sa-placeholder-icon">{menuItems.find(m => m.id === activeMenu)?.icon}</div>
                <h2>{activeMenu}</h2>
                <p>Enterprise Module Active</p>
             </div>
           )}
        </main>
      </div>
    </div>

    {/* ── TOAST PORTAL (renders directly to document.body to escape overflow:hidden) ── */}
    {createPortal(
      <div className="sa-toast-container">
        {toasts.map(toast => (
          <ToastNotification key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>,
      document.body
    )}
    </>
  );
};

export default SuperAdminLayout;
