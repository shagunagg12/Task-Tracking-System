import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as signalR from '@microsoft/signalr';
import Chatbot from '../../components/Chatbot';
import PendingTasksModal from '../../components/PendingTasksModal';
import ProfileSettings from '../../components/ProfileSettings';
import AssignedProjects from './AssignedProjects';
import Report from './Report';
import StandingsLayout from './StandingsLayout';
import ChatLayout from './ChatLayout';
import Calendar from './Calendar';
import AchievementsRewards from './AchievementsRewards';
import './DashboardLayout.css';

const AnimatedCounter = ({ end, duration, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let reqId = null;
    // parse float in case there are decimals, otherwise int
    const endVal = parseFloat(end.replace(/,/g, ''));
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // ease out cubic
      setCount(ease * endVal);
      if (progress < 1) {
        reqId = window.requestAnimationFrame(step);
      } else {
        setCount(endVal);
      }
    };
    
    // start animation
    reqId = window.requestAnimationFrame(step);
    
    return () => {
      if (reqId) window.cancelAnimationFrame(reqId);
    };
  }, [end, duration]);

  const formatNumber = (num) => {
    // If it was a string with commas originally, format it back
    if (end.includes(',')) {
      return Math.floor(num).toLocaleString();
    }
    // If it has decimals or k
    if (end.includes('.') || suffix) {
      return (Math.floor(num * 10) / 10).toString(); 
    }
    return Math.floor(num);
  };

  return <span>{prefix}{formatNumber(count)}{suffix}</span>;
};

const DashboardLayout = ({ isAdmin, onSwitchToAdmin }) => {
  const [activeMenu, setActiveMenu] = useState(() => {
    return localStorage.getItem('activeMenu') || localStorage.getItem('lastActiveMenu') || 'Overview';
  });
  
  const [activeChatUserId, setActiveChatUserId] = useState(null);

  const [showPendingTasks, setShowPendingTasks] = useState(false);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [userProfileData, setUserProfileData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Toasts and Modals
  const [toasts, setToasts] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Analytics state
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [orgAnalytics, setOrgAnalytics] = useState(null);
  const [deptAnalytics, setDeptAnalytics] = useState(null);

  const fetchAnalytics = async (userId, department) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const userRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/analytics/user/${userId}`, { headers });
      if (userRes.ok) setUserAnalytics(await userRes.json());

      const orgRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/analytics/organization`, { headers });
      if (orgRes.ok) setOrgAnalytics(await orgRes.json());

      if (department) {
        const deptRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/analytics/department/${encodeURIComponent(department)}`, { headers });
        if (deptRes.ok) {
           const deptData = await deptRes.json();
           setDeptAnalytics(deptData);
           if (deptData.topPerformers) {
              setTeamMembers(deptData.topPerformers.map(u => ({
                 id: u.userId,
                 name: u.fullName,
                 designation: u.department,
                 avatar: u.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=random`,
                 email: u.email
              })));
           }
        }
      }
    } catch (err) {
      console.error("Error fetching analytics", err);
    }
  };
  
  const addToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...toast }]);
    setTimeout(() => dismissToast(id), 5000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Notifications
  const [notifications, setNotifications] = useState([]);

  const [activities, setActivities] = useState([]);

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/standings/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        let allActivities = [];
        if (data.pendingInvitations) {
           allActivities = [...allActivities, ...data.pendingInvitations];
        }
        if (data.attendedEvents) {
           allActivities = [...allActivities, ...data.attendedEvents];
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        allActivities = allActivities.filter(a => new Date(a.eventDate || a.EventDate) >= today);
        
        allActivities.sort((a, b) => new Date(b.eventDate || b.EventDate) - new Date(a.eventDate || a.EventDate));
        setActivities(allActivities.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching activities", err);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfileData(data);
          
          fetchActivities();
          
          if (data.fullName) {
            setUserName(data.fullName);
            localStorage.setItem('userName', data.fullName);
          }
          if (data.profilePictureUrl) {
            setUserPic(data.profilePictureUrl);
            localStorage.setItem('profilePic', data.profilePictureUrl);
          }
          
          if (data.id) {
            fetchAnalytics(data.id, data.department);
          }
          
          const tasks = [];
          if (!data.designation || !data.department || !data.location || !data.bio) {
            tasks.push({
              id: 'complete-profile',
              title: 'Complete Your Profile',
              description: 'Missing details like Designation, Department, Location, or Bio.',
              icon: '👤',
              onClick: () => {
                setShowPendingTasks(false);
                setActiveMenu('Profile');
              }
            });
          }
          
          if (tasks.length > 0) {
            setPendingTasks(tasks);
            setShowPendingTasks(true);
          }

          // Fetch notifications
          try {
            const notifRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/DepartmentNotifications/${encodeURIComponent(data.department)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (notifRes.ok) {
              const notifData = await notifRes.json();
              setNotifications(notifData);
            }
          } catch(err) {
            console.error(err);
          }
          
          // Fetch team members
          try {
            const membersRes = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/profile/department-members`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (membersRes.ok) {
              const membersData = await membersRes.json();
              setTeamMembers(membersData.filter(m => m.id !== data.id));
            }
          } catch(err) {
            console.error(err);
          }
        }
      } catch (err) {
        console.error("Error fetching profile", err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!userProfileData) return;

    // Connect to SignalR
    const connection = new signalR.HubConnectionBuilder()
      .withUrl((import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5024') + '/adminDashboardHub')
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveUserNotification", (notification) => {
      // Check if notification belongs to this user's department
      if (notification.department === userProfileData.department) {
        addToast({
          title: notification.title,
          message: notification.message
        });
        setNotifications(prev => [{
          id: Date.now(), // temporary id
          title: notification.title,
          message: notification.message,
          createdAt: new Date().toISOString(),
          isRead: false
        }, ...prev]);
      }
    });

    const startPromise = connection.start().catch(err => {
      if (err.name !== 'AbortError' && err.message !== 'The connection was stopped during negotiation.' && !err.message.includes('HttpConnection before stop')) {
        console.error("SignalR Connection Error: ", err);
      }
    });

    return () => {
      startPromise.then(() => {
        connection.stop();
      });
    };
  }, [userProfileData]);

  useEffect(() => {
    localStorage.setItem('activeMenu', activeMenu);
    localStorage.setItem('lastActiveMenu', activeMenu);
  }, [activeMenu]);
  const [isBrightTheme, setIsBrightTheme] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth > 768);

  const toggleTheme = () => {
    setIsBrightTheme(!isBrightTheme);
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen(!isRightSidebarOpen);
  };

  const toggleLeftSidebar = () => {
    setIsLeftSidebarOpen(!isLeftSidebarOpen);
  };

  const getUserData = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { name: 'User', pic: '' };
      const payload = JSON.parse(atob(token.split('.')[1]));
      const name = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 
             payload.unique_name || 
             payload.name || 
             'User';
             
      let pic = localStorage.getItem('profilePic');
      if (!pic) {
        pic = payload['ProfilePictureUrl'] || '';
        if (pic) localStorage.setItem('profilePic', pic);
      }
      return { name, pic };
    } catch(e) {
      return { name: 'User', pic: '' };
    }
  };

  const initialData = getUserData();
  const [userPic, setUserPic] = useState(initialData.pic);
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || initialData.name);

  useEffect(() => {
    const handlePicUpdate = () => {
      setUserPic(localStorage.getItem('profilePic') || '');
    };
    const handleProfileUpdate = () => {
      setUserName(localStorage.getItem('userName') || initialData.name);
    };
    window.addEventListener('profilePicUpdated', handlePicUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profilePicUpdated', handlePicUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const menuItems = [
    { id: 'Overview', icon: '📊', text: 'Overview' },
    { id: 'Projects', icon: '💼', text: 'Projects' },
    { id: 'Standings', icon: '🏆', text: 'Standings' },
    { id: 'Calendar', icon: '📅', text: 'Calendar' },
    { id: 'Chats', icon: '💬', text: 'Chats' },
    { id: 'AchievementsRewards', icon: '🏆', text: 'Achievements & Rewards' },
    { id: 'Report', icon: '📈', text: 'Report' },
    { id: 'Profile', icon: '👤', text: 'Profile' },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'AdminPanel', icon: '🛡️', text: 'Admin Panel' });
  }

  return (
    <div className={`layout-container ${isBrightTheme ? 'bright-theme' : ''}`}>
      {showPendingTasks && pendingTasks.length > 0 && (
        <PendingTasksModal 
          tasks={pendingTasks} 
          onClose={() => setShowPendingTasks(false)}
        />
      )}
      {/* LEFT SIDEBAR */}
      <aside className={`left-sidebar ${isLeftSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <img src="/image/logo.png" alt="MATTS Logo" className="matts-sidebar-logo" style={{ maxWidth: '120px', height: 'auto' }} />
          <button className="mobile-close-btn" onClick={toggleLeftSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div className="sidebar-section">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li 
                key={item.id}
                className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (item.id === 'AdminPanel') {
                    onSwitchToAdmin();
                  } else {
                    setActiveMenu(item.id);
                  }
                  if (window.innerWidth <= 768) {
                    setIsLeftSidebarOpen(false);
                  }
                }}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-dark)', 
            padding: '20px 0', 
            borderTop: '1px solid var(--border-color)',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={userPic ? userPic : `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`} 
                alt="User" 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
              />
              <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{userName}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('isAdmin');
                  localStorage.removeItem('isSuperAdmin');
                  localStorage.removeItem('profilePic');
                  window.location.reload();
                }}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer', 
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'; e.currentTarget.style.color = '#ff6b6b'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Logout"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <span className="action-icon" onClick={toggleLeftSidebar} title="Toggle Sidebar" style={{ cursor: 'pointer', marginRight: '16px' }}>☰</span>
            <span className="header-icon">❖</span>
            <span className="header-icon">⭐</span>
            <span className="breadcrumb">Dashboards / <span className="current">{activeMenu}</span></span>
          </div>
          <div className="header-right">
             <div className="header-actions">
               <span className="action-icon" onClick={toggleTheme} title="Toggle Theme">
                 {isBrightTheme ? '☀️' : '🌙'}
               </span>
               <span className="action-icon" onClick={toggleRightSidebar} title="Notifications">🔔</span>
               <span className="action-icon" title="Language">🌐</span>
             </div>
          </div>
        </header>

        {activeMenu === 'Calendar' ? (
          <div className="calendar-full-page-wrapper" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Calendar 
               isProfileComplete={userProfileData ? !!(userProfileData.designation && userProfileData.department && userProfileData.location && userProfileData.bio) : false}
               setActiveMenu={setActiveMenu}
               addToast={addToast}
            />
          </div>
        ) : (activeMenu === 'Chats' || activeMenu === 'Chat') ? (
          <div className="chat-full-page-wrapper" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatLayout />
          </div>
        ) : (
        <div className="content-scroll">
          {activeMenu === 'Profile' ? (
            <ProfileSettings />
          ) : activeMenu === 'Standings' ? (
            <StandingsLayout setActiveMenu={setActiveMenu} />
          ) : activeMenu === 'Projects' ? (
            <AssignedProjects />
          ) : activeMenu === 'Report' ? (
            <Report />
          ) : activeMenu === 'AchievementsRewards' ? (
            <AchievementsRewards />

          ) : activeMenu === 'Overview' ? (
            <>
              {/* Overview Top Stats */}
              <section className="section-overview">
                <div className="section-header">
                  <h2>{activeMenu}</h2>
              <div className="date-filter">Today <span>⌄</span></div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-title">Active Tasks</p>
                <h3 className="stat-value"><AnimatedCounter end={userAnalytics ? (userAnalytics.totalTasksAssigned - userAnalytics.tasksCompleted).toString() : "0"} duration={2000} /></h3>
                <p className="stat-trend positive">↗ 12% <span className="trend-text">vs last month</span></p>
              </div>
              <div className="stat-card">
                <p className="stat-title">Completed Projects</p>
                <h3 className="stat-value"><AnimatedCounter end={userAnalytics ? userAnalytics.completedProjects.toString() : "0"} duration={2000} /></h3>
                <p className="stat-trend positive">↗ 5% <span className="trend-text">vs last quarter</span></p>
              </div>
              <div className="stat-card">
                <p className="stat-title">Efficiency Score</p>
                <div className="gauge-container">
                  <div className="gauge-text">
                     <h3 className="stat-value"><AnimatedCounter end={userAnalytics ? userAnalytics.completionRate.toString() : "0"} duration={2500} suffix="%" /></h3>
                     <p className="stat-subtitle">Goal: 100%</p>
                  </div>
                  <div className="gauge-visual">
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--brand-primary)" strokeWidth="3" strokeDasharray={`${userAnalytics ? userAnalytics.completionRate : 0}, 100`} />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <p className="stat-title">Reward Points</p>
                <h3 className="stat-value"><AnimatedCounter end={userAnalytics ? userAnalytics.totalPoints.toLocaleString() : "0"} duration={2000} /></h3>
                <p className="stat-trend positive">↗ 150 <span className="trend-text">vs last month</span></p>
              </div>
            </div>
          </section>

          {/* Middle Row */}
          <div className="middle-row-grid">
            <div className="sales-overview-card">
              <div className="card-header">
                <h2>Project Distribution</h2>
                <span className="more-options">⋮</span>
              </div>
              <div className="sales-content">
                <div className="doughnut-chart-wrapper">
                  <div className="doughnut-chart-circle">
                     <div className="doughnut-inner">
                        <span className="chart-number">{orgAnalytics ? orgAnalytics.totalProjects : "0"}</span>
                        <span className="chart-label">Total Projects</span>
                     </div>
                  </div>
                </div>
                <div className="sales-legend-area">
                  <div className="total-sales-tag">
                     <span className="tag-icon">📋</span>
                     <div className="tag-info">
                       <p className="tag-label">Total Capacity</p>
                       <p className="tag-value">100%</p>
                     </div>
                  </div>
                  <div className="legend-grid">
                    {orgAnalytics && orgAnalytics.departmentDistribution ? orgAnalytics.departmentDistribution.map((d, i) => (
                      <div className="legend-item" key={i}>
                        <span className={`dot dot-${['white', 'green', 'light-green', 'dark-green'][i % 4]}`}></span>
                        <span className="legend-name">{d.departmentName}</span>
                        <span className="legend-val">{Math.round((d.userCount / orgAnalytics.totalUsers) * 100)}%</span>
                      </div>
                    )) : (
                      <div className="legend-item">
                        <span className="legend-name">Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="small-cards-column">
               <div className="small-card new-customers">
                 <div className="card-icon-header">
                    <span className="green-icon">🌟</span>
                 </div>
                 <p className="small-card-title">Recent Appreciations:</p>
                 <div className="small-card-val-row">
                    <span className="sc-val">{userAnalytics ? userAnalytics.rewardsClaimed : "0"}</span>
                    <span className="sc-trend positive">+3%</span>
                 </div>
                 <p className="sc-subtitle">Last Week</p>
               </div>
               
               <div className="small-card total-profit-small">
                 <div className="card-icon-header">
                    <span className="green-icon">🏆</span>
                 </div>
                 <p className="small-card-title">Social Score:</p>
                 <div className="small-card-val-row">
                    <span className="sc-val">{userAnalytics ? userAnalytics.totalPoints : "0"}</span>
                    <span className="sc-trend positive">+42</span>
                 </div>
                 <p className="sc-subtitle">Total Points</p>
               </div>
               
               <div className="total-profit-chart-card todays-progress-card">
                  <div className="todays-progress-content">
                    <p className="tp-title">Your Tasks</p>
                    
                    <div className="progress-dots-container">
                      {Array.from({ length: 8 }).map((_, i) => {
                         const rate = userAnalytics ? userAnalytics.completionRate : 0;
                         const filledCount = Math.round((rate / 100) * 8);
                         return <span key={i} className={`dot ${i < filledCount ? 'filled' : 'empty'}`}></span>;
                      })}
                    </div>
                    
                    <h3 className="tp-val">{userAnalytics ? userAnalytics.completionRate : "0"}%</h3>
                    
                    <div className="progress-details">
                      <p className="pd-row"><span>{userAnalytics ? userAnalytics.tasksCompleted : "0"}</span> Completed</p>
                      <p className="pd-row"><span>{userAnalytics ? (userAnalytics.totalTasksAssigned - userAnalytics.tasksCompleted) : "0"}</span> Remaining</p>
                    </div>
                  </div>
                  
                  <div className="tp-chart-area">
                     <svg viewBox="0 0 100 30" className="sparkline" preserveAspectRatio="none">
                       <path d="M0,30 L0,25 L10,20 L20,28 L30,15 L40,18 L50,10 L60,15 L70,12 L80,20 L90,15 L100,9.6 L100,30 Z" fill="rgba(190, 242, 100, 0.2)"></path>
                       <path d="M0,25 L10,20 L20,28 L30,15 L40,18 L50,10 L60,15 L70,12 L80,20 L90,15 L100,9.6" fill="none" stroke="#BEF264" strokeWidth="1.5"></path>
                       <circle cx="100" cy="9.6" r="2" fill="#202226" stroke="#BEF264" strokeWidth="1.5" />
                       <text x="96" y="8" fill="#BEF264" fontSize="5" fontWeight="600" textAnchor="end">{userAnalytics ? userAnalytics.completionRate : "0"}%</text>
                     </svg>
                  </div>
               </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="bottom-row-grid">
            <div className="customer-list-card">
              <div className="card-header">
                <h2>Top Performers</h2>
                <span className="more-options">⋮</span>
              </div>
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Name ↕</th>
                    <th>Tasks Completed ↕</th>
                    <th>Total Points ↕</th>
                  </tr>
                </thead>
                <tbody>
                  {deptAnalytics && deptAnalytics.topPerformers ? deptAnalytics.topPerformers.map((performer, index) => (
                    <tr key={index}>
                      <td>
                        <div className="user-cell">
                          <img src={performer.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(performer.fullName)}&background=random`} alt={performer.fullName} />
                          <div className="user-info">
                            <p className="name">{performer.fullName}</p>
                            <p className="email">{deptAnalytics.departmentName}</p>
                          </div>
                        </div>
                      </td>
                      <td>{performer.completedTasks}</td>
                      <td>{performer.points.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3">Loading...</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="premium-plan-card">
               <div className="premium-header">
                 <div className="premium-tag">⚡ Available Rewards</div>
                 <span className="more-options">⋮</span>
               </div>
               <div className="premium-price">
                 <h2>{userAnalytics ? userAnalytics.totalPoints.toLocaleString() : "0"}</h2>
                 <div className="price-details">
                   <p>Points</p>
                   <p>Available</p>
                 </div>
               </div>
               <p className="premium-desc">Claim your reward points to get gift cards, extra time off, or company merch! 🎁</p>
                <div className="premium-actions">
                  <button className="get-started-btn" onClick={() => setActiveMenu('AchievementsRewards')}>Redeem Now</button>
                  <button className="star-btn">★</button>
                </div>
             </div>
          </div>
          </>
          ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
               <h2>{activeMenu}</h2>
               <p style={{ marginTop: '10px' }}>This section is currently under development.</p>
             </div>
          )}
        </div>
        )}
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className={`right-sidebar ${isRightSidebarOpen ? 'open' : 'closed'}`}>
        
        <div className="right-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 className="right-title" style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>Notifications</h3>
            <button 
              onClick={toggleRightSidebar} 
              className="right-sidebar-close-btn"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '24px', cursor: 'pointer', display: 'none' }}
              aria-label="Close Notifications"
            >
              ×
            </button>
          </div>
          <ul className="list-items">
            {notifications.length === 0 ? (
              <li className="list-item" style={{ justifyContent: 'center', opacity: 0.5, paddingTop: '10px' }}>
                <p>No notifications</p>
              </li>
            ) : (
              notifications.map((notif) => (
                <li 
                  key={notif.id} 
                  className="list-item" 
                  style={{ cursor: 'pointer', transition: 'background 0.2s', padding: '8px', borderRadius: '8px' }}
                  onClick={() => setSelectedNotification(notif)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div className="icon-circle outline">✉</div>
                  <div className="item-details">
                    <p className="item-title">{notif.title}</p>
                    <p className="item-time">
                      {new Date(notif.createdAt).toLocaleDateString()}{' '}
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="right-section">
          <h3 className="right-title">Activities</h3>
          <ul className="list-items activities-list">
            {activities.length > 0 ? (
              activities.map((act, index) => (
                <li key={act.id || index} className="list-item">
                  <div className="tiny-avatar" style={{ background: `hsl(${Math.random() * 360}, 70%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px' }}>
                    {(act.title || 'Event').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="item-details">
                    <p className="item-title">{act.title || 'Untitled Event'}</p>
                    <p className="item-time">
                      {new Date(act.eventDate || act.EventDate).toLocaleDateString()}
                      {' '}
                      <span style={{color: 'var(--brand-primary)', fontSize: '0.7rem', paddingLeft: '4px'}}>{act.status || act.Status}</span>
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>No recent activities found.</p>
            )}
          </ul>
        </div>

        <div className="right-section">
          <h3 className="right-title">Team Members</h3>
          <ul className="list-items contacts-list">
            {teamMembers.length > 0 ? (
              teamMembers.map(member => (
                <li key={member.id} className="list-item contact-item">
                  <img src={member.avatar} alt="user" className="tiny-avatar" />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p className="item-title" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{member.name}</p>
                    {member.designation && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{member.designation}</p>}
                  </div>
                  <div className="contact-actions" style={{ display: 'flex', gap: '8px' }}>
                     <div onClick={() => { setActiveChatUserId(member.id); handleMenuClick('Chat'); }} style={{ textDecoration: 'none', color: 'inherit' }}>
                       <span className="c-action" style={{ cursor: 'pointer' }} title="Chat">💬</span>
                     </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="list-item contact-item" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                No other team members found.
              </li>
            )}
          </ul>
        </div>

      </aside>
      {activeMenu !== 'Chat' && <Chatbot isSidebarOpen={isRightSidebarOpen} />}
      
      {/* Notification Details Modal */}
      {selectedNotification && createPortal(
        <div className="dashboard-modal-overlay" onClick={() => setSelectedNotification(null)}>
          <div className="dashboard-modal" onClick={e => e.stopPropagation()}>
            <div className="dashboard-modal-header">
              <h3>{selectedNotification.title}</h3>
              <button className="dashboard-modal-close" onClick={() => setSelectedNotification(null)}>×</button>
            </div>
            <div className="dashboard-modal-body">
              <p className="dashboard-modal-date">
                {new Date(selectedNotification.createdAt).toLocaleDateString()}{' '}
                {new Date(selectedNotification.createdAt).toLocaleTimeString()}
              </p>
              <div className="dashboard-modal-message">
                {selectedNotification.message}
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-modal-btn" onClick={() => setSelectedNotification(null)}>Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toasts */}
      {createPortal(
        <div className="dashboard-toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className="dashboard-toast">
              <div className="dashboard-toast-title">{toast.title}</div>
              <div className="dashboard-toast-message">{toast.message}</div>
              <button className="dashboard-toast-close" onClick={() => dismissToast(toast.id)}>×</button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default DashboardLayout;
