import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Building2, Shield, CheckSquare, 
  Briefcase, Calendar, Clock, DollarSign, Star, 
  BarChart2, LineChart, Bell, FileText, Activity, Settings, 
  Search, Plus, ChevronDown, Moon, Sun, X
} from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import './SuperAdminLayout.css';
import SuperAdminDashboard from './SuperAdminDashboard';
import SuperAdminProjects from './SuperAdminProjects';
import SuperAdminUsers from './SuperAdminUsers';
import SuperAdminReports from './SuperAdminReports';

const SuperAdminLayout = ({ onSwitchToUser }) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Determine the base URL for SignalR
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = isDevelopment ? 'http://localhost:5024' : window.location.origin;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${backendUrl}/hubs/admindashboard`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveNotification", (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      // Optional: Add a toast popup here if desired
    });

    connection.start()
      .then(() => console.log("Connected to Admin Dashboard Hub for Notifications"))
      .catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
      connection.stop();
    };
  }, []);

  const toggleTheme = () => setIsDarkTheme(!isDarkTheme);
  const unreadCount = notifications.length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    window.location.reload();
  };

  const menuItems = [
    { id: 'Dashboard', icon: <LayoutDashboard size={20} />, text: 'Dashboard' },
    { id: 'User Management', icon: <Users size={20} />, text: 'User Management' },
    { id: 'Departments', icon: <Building2 size={20} />, text: 'Departments' },
    { id: 'Roles & Permissions', icon: <Shield size={20} />, text: 'Roles & Permissions' },
    { id: 'Task Management', icon: <CheckSquare size={20} />, text: 'Task Management' },
    { id: 'Projects', icon: <Briefcase size={20} />, text: 'Projects' },
    { id: 'Attendance', icon: <Clock size={20} />, text: 'Attendance' },
    { id: 'Leave Management', icon: <Calendar size={20} />, text: 'Leave Management' },
    { id: 'Payroll', icon: <DollarSign size={20} />, text: 'Payroll' },
    { id: 'Performance Reviews', icon: <Star size={20} />, text: 'Performance Reviews' },
    { id: 'Reports', icon: <FileText size={20} />, text: 'Reports' },
    { id: 'Analytics', icon: <LineChart size={20} />, text: 'Analytics' },
    { id: 'Notifications', icon: <Bell size={20} />, text: 'Notifications' },
    { id: 'Audit Logs', icon: <FileText size={20} />, text: 'Audit Logs' },
    { id: 'Activity Logs', icon: <Activity size={20} />, text: 'Activity Logs' },
    { id: 'Settings', icon: <Settings size={20} />, text: 'Settings' },
  ];

  return (
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
            <button className="sa-btn-primary">
              <Plus size={18} />
              <span>Create New</span>
            </button>
            
            <div className="sa-nav-divider"></div>
            
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
            <div style={{ position: 'relative' }}>
              <button className="sa-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="sa-notification-dot"></span>}
              </button>
              
              {showNotifications && (
                <div className="sa-notifications-dropdown" style={{
                  position: 'absolute', top: '100%', right: '0', width: '320px', 
                  background: 'var(--sa-card)', border: '1px solid var(--sa-border)', 
                  borderRadius: '12px', padding: '16px', zIndex: 100,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                     <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--sa-text)' }}>Notifications</h3>
                     <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--sa-muted)', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                       <p style={{ color: 'var(--sa-muted)', fontSize: '0.85rem' }}>No new notifications.</p>
                    ) : (
                       notifications.map((notif, idx) => (
                         <div key={idx} style={{ padding: '10px', borderBottom: '1px solid var(--sa-border)', fontSize: '0.85rem' }}>
                           <strong style={{ color: 'var(--sa-primary)', display: 'block', marginBottom: '4px' }}>{notif.title}</strong>
                           <span style={{ color: 'var(--sa-text)' }}>{notif.message}</span>
                           <div style={{ color: 'var(--sa-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{new Date(notif.time).toLocaleTimeString()}</div>
                         </div>
                       ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="sa-profile-dropdown" onClick={handleLogout}>
              <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Profile" className="sa-avatar" />
              <div className="sa-profile-info">
                <span className="sa-profile-name">Super Admin</span>
                <span className="sa-profile-role">System Admin</span>
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
           ) : activeMenu === 'Reports' ? (
             <SuperAdminReports />
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
  );
};

export default SuperAdminLayout;
