import React, { useState, useEffect } from 'react';
import Chatbot from '../../components/Chatbot';
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

const DashboardLayout = () => {
  const [activeMenu, setActiveMenu] = useState('Assigned Projects');
  const [isBrightTheme, setIsBrightTheme] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const toggleTheme = () => {
    setIsBrightTheme(!isBrightTheme);
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen(!isRightSidebarOpen);
  };

  const menuItems = [
    { id: 'Assigned Projects', icon: '💼', text: 'Assigned Projects' },
    { id: 'Social Scoring', icon: '🤝', text: 'Social Scoring' },
    { id: 'Efficiency', icon: '⚙️', text: 'Efficiency' },
    { id: 'Learning', icon: '🎓', text: 'Learning' },
    { id: 'Rewards', icon: '🎁', text: 'Rewards' },
    { id: 'Performance', icon: '🚀', text: 'Performance' },
    { id: 'Report Generation', icon: '📊', text: 'Report Generation' },
    { id: 'Appreciation', icon: '🌟', text: 'Appreciation' },
  ];

  return (
    <div className={`layout-container ${isBrightTheme ? 'bright-theme' : ''}`}>
      {/* LEFT SIDEBAR */}
      <aside className="left-sidebar">
        <div className="user-profile-header">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="user-avatar" />
          <span className="user-name">Guy Hawkins</span>
        </div>

        <div className="sidebar-section">
          <ul className="sidebar-menu">
            {menuItems.map((item) => (
              <li 
                key={item.id}
                className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => setActiveMenu(item.id)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="sidebar-footer">
           <div className="dwison-logo">
             <img src="/image/logo.png" alt="MATTS Logo" className="matts-sidebar-logo" />
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <span className="header-icon">❖</span>
            <span className="header-icon">⭐</span>
            <span className="breadcrumb">Dashboards / <span className="current">Overview</span></span>
          </div>
          <div className="header-right">
             <div className="header-actions">
               <span className="action-icon" onClick={toggleTheme} title="Toggle Theme">
                 {isBrightTheme ? '☀️' : '🌙'}
               </span>
               <span className="action-icon" onClick={() => window.location.reload()} title="Refresh">↻</span>
               <span className="action-icon" onClick={toggleRightSidebar} title="Notifications">🔔</span>
               <span className="action-icon" title="Language">🌐</span>
             </div>
          </div>
        </header>

        <div className="content-scroll">
          {/* Overview Top Stats */}
          <section className="section-overview">
            <div className="section-header">
              <h2>Overview</h2>
              <div className="date-filter">Today <span>⌄</span></div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-title">Active Tasks</p>
                <h3 className="stat-value"><AnimatedCounter end="124" duration={2000} /></h3>
                <p className="stat-trend positive">↗ 12% <span className="trend-text">vs last month</span></p>
              </div>
              <div className="stat-card">
                <p className="stat-title">Completed Projects</p>
                <h3 className="stat-value"><AnimatedCounter end="45" duration={2000} /></h3>
                <p className="stat-trend positive">↗ 5% <span className="trend-text">vs last quarter</span></p>
              </div>
              <div className="stat-card">
                <p className="stat-title">Efficiency Score</p>
                <div className="gauge-container">
                  <div className="gauge-text">
                     <h3 className="stat-value"><AnimatedCounter end="92" duration={2500} suffix="%" /></h3>
                     <p className="stat-subtitle">Goal: 100%</p>
                  </div>
                  <div className="gauge-visual">
                    <div className="gauge-arc animate-spin"></div>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <p className="stat-title">Reward Points</p>
                <h3 className="stat-value"><AnimatedCounter end="1,250" duration={2000} /></h3>
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
                        <span className="chart-number">124</span>
                        <span className="chart-label">Active Tasks</span>
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
                    <div className="legend-item">
                      <span className="dot dot-white"></span>
                      <span className="legend-name">Development</span>
                      <span className="legend-val">45%</span>
                    </div>
                    <div className="legend-item">
                      <span className="dot dot-green"></span>
                      <span className="legend-name">Marketing</span>
                      <span className="legend-val">30%</span>
                    </div>
                    <div className="legend-item">
                      <span className="dot dot-light-green"></span>
                      <span className="legend-name">Design</span>
                      <span className="legend-val">15%</span>
                    </div>
                    <div className="legend-item">
                      <span className="dot dot-dark-green"></span>
                      <span className="legend-name">Operations</span>
                      <span className="legend-val">10%</span>
                    </div>
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
                    <span className="sc-val">15</span>
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
                    <span className="sc-val">850</span>
                    <span className="sc-trend positive">+42</span>
                 </div>
                 <p className="sc-subtitle">Total Points</p>
               </div>
               
               <div className="total-profit-chart-card todays-progress-card">
                  <div className="todays-progress-content">
                    <p className="tp-title">Today's Tasks</p>
                    
                    <div className="progress-dots-container">
                      <span className="dot empty"></span>
                      <span className="dot empty"></span>
                      <span className="dot empty"></span>
                      <span className="dot empty"></span>
                      <span className="dot filled"></span>
                      <span className="dot filled"></span>
                      <span className="dot filled"></span>
                      <span className="dot filled"></span>
                    </div>
                    
                    <h3 className="tp-val">68%</h3>
                    
                    <div className="progress-details">
                      <p className="pd-row"><span>17</span> Completed</p>
                      <p className="pd-row"><span>8</span> Remaining</p>
                    </div>
                  </div>
                  
                  <div className="tp-chart-area">
                     <svg viewBox="0 0 100 30" className="sparkline" preserveAspectRatio="none">
                       <path d="M0,30 L0,25 L10,20 L20,28 L30,15 L40,18 L50,10 L60,15 L70,12 L80,20 L90,15 L100,9.6 L100,30 Z" fill="rgba(190, 242, 100, 0.2)"></path>
                       <path d="M0,25 L10,20 L20,28 L30,15 L40,18 L50,10 L60,15 L70,12 L80,20 L90,15 L100,9.6" fill="none" stroke="#BEF264" strokeWidth="1.5"></path>
                       <circle cx="100" cy="9.6" r="2" fill="#202226" stroke="#BEF264" strokeWidth="1.5" />
                       <text x="96" y="8" fill="#BEF264" fontSize="5" fontWeight="600" textAnchor="end">68%</text>
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
                  <tr>
                    <td>
                      <div className="user-cell">
                        <img src="https://i.pravatar.cc/150?u=1" alt="Danny" />
                        <div className="user-info">
                          <p className="name">Danny Liu</p>
                          <p className="email">Development</p>
                        </div>
                      </div>
                    </td>
                    <td>142</td>
                    <td>12,431</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="user-cell">
                        <img src="https://i.pravatar.cc/150?u=2" alt="Bella" />
                        <div className="user-info">
                          <p className="name">Bella Deviant</p>
                          <p className="email">Marketing</p>
                        </div>
                      </div>
                    </td>
                    <td>96</td>
                    <td>10,423</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="user-cell">
                        <img src="https://i.pravatar.cc/150?u=3" alt="Darrell" />
                        <div className="user-info">
                          <p className="name">Darrell Steward</p>
                          <p className="email">Design</p>
                        </div>
                      </div>
                    </td>
                    <td>84</td>
                    <td>8,549</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="premium-plan-card">
               <div className="premium-header">
                 <div className="premium-tag">⚡ Available Rewards</div>
                 <span className="more-options">⋮</span>
               </div>
               <div className="premium-price">
                 <h2>1,250</h2>
                 <div className="price-details">
                   <p>Points</p>
                   <p>Available</p>
                 </div>
               </div>
               <p className="premium-desc">Claim your reward points to get gift cards, extra time off, or company merch! 🎁</p>
               <div className="premium-actions">
                 <button className="get-started-btn">Redeem Now</button>
                 <button className="star-btn">★</button>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className={`right-sidebar ${isRightSidebarOpen ? 'open' : 'closed'}`}>
        
        <div className="right-section">
          <h3 className="right-title">Notifications</h3>
          <ul className="list-items">
            <li className="list-item">
              <div className="icon-circle green">📋</div>
              <div className="item-details">
                <p className="item-title">New project 'Website Redesign' assigned.</p>
                <p className="item-time">Just now</p>
              </div>
            </li>
            <li className="list-item">
              <div className="icon-circle outline">✉</div>
              <div className="item-details">
                <p className="item-title">Feedback received from Manager.</p>
                <p className="item-time">59 Minutes ago</p>
              </div>
            </li>
            <li className="list-item">
              <div className="icon-circle outline">🎁</div>
              <div className="item-details">
                <p className="item-title">150 Reward points credited.</p>
                <p className="item-time">12 Hours ago</p>
              </div>
            </li>
            <li className="list-item">
              <div className="icon-circle outline">💬</div>
              <div className="item-details">
                <p className="item-title">5 Unread team messages.</p>
                <p className="item-time">Today, 11:59 PM</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="right-section">
          <h3 className="right-title">Activities</h3>
          <ul className="list-items activities-list">
            <li className="list-item">
              <img src="https://i.pravatar.cc/150?u=4" alt="user" className="tiny-avatar" />
              <div className="item-details">
                <p className="item-title">Completed task 'Update Homepage'.</p>
                <p className="item-time">Just now</p>
              </div>
            </li>
            <li className="list-item">
              <img src="https://i.pravatar.cc/150?u=5" alt="user" className="tiny-avatar" />
              <div className="item-details">
                <p className="item-title">Earned 'Fast Learner' badge.</p>
                <p className="item-time">47 Minutes ago</p>
              </div>
            </li>
            <li className="list-item">
              <img src="https://i.pravatar.cc/150?u=6" alt="user" className="tiny-avatar" />
              <div className="item-details">
                <p className="item-title">Submitted weekly performance report.</p>
                <p className="item-time">1 Days ago</p>
              </div>
            </li>
            <li className="list-item">
              <img src="https://i.pravatar.cc/150?u=7" alt="user" className="tiny-avatar" />
              <div className="item-details">
                <p className="item-title">Appreciated Danny Liu.</p>
                <p className="item-time">Feb 2, 2026</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="right-section">
          <h3 className="right-title">Team Members</h3>
          <ul className="list-items contacts-list">
            <li className="list-item contact-item">
              <img src="https://i.pravatar.cc/150?u=8" alt="user" className="tiny-avatar" />
              <p className="item-title">Daniel Craig</p>
              <span className="more-options">⋯</span>
            </li>
            <li className="list-item contact-item">
              <img src="https://i.pravatar.cc/150?u=9" alt="user" className="tiny-avatar" />
              <p className="item-title">Kate Morrison</p>
              <span className="more-options">⋯</span>
            </li>
            <li className="list-item contact-item active-contact">
              <img src="https://i.pravatar.cc/150?u=10" alt="user" className="tiny-avatar" />
              <p className="item-title">Nataniel Donowan</p>
              <div className="contact-actions">
                 <span className="c-action">✉</span>
                 <span className="c-action">📞</span>
              </div>
            </li>
            <li className="list-item contact-item">
              <img src="https://i.pravatar.cc/150?u=11" alt="user" className="tiny-avatar" />
              <p className="item-title">Elisabeth Wayne</p>
              <span className="more-options">⋯</span>
            </li>
            <li className="list-item contact-item">
              <img src="https://i.pravatar.cc/150?u=12" alt="user" className="tiny-avatar" />
              <p className="item-title">Felicia Raspet</p>
              <span className="more-options">⋯</span>
            </li>
          </ul>
        </div>

      </aside>
      <Chatbot isSidebarOpen={isRightSidebarOpen} />
    </div>
  );
};

export default DashboardLayout;
