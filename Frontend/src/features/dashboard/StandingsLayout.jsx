import React, { useState, useEffect } from 'react';
import './StandingsLayout.css';

const StandingsLayout = ({ setActiveMenu }) => {
  const [activeTab, setActiveTab] = useState('social');
  const [socialSubTab, setSocialSubTab] = useState('dashboard');
  const [myDashboard, setMyDashboard] = useState(null);
  const [socialStandings, setSocialStandings] = useState([]);
  const [efficiencyStandings, setEfficiencyStandings] = useState([]);
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'Dinner',
    eventDate: '',
    durationHours: 1,
    location: '',
    points: 10,
    invitedUserIds: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // New States for expanded views
  const [showAllInvites, setShowAllInvites] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState('This Month');

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const token = localStorage.getItem('token');
  const [myUserId, setMyUserId] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const id = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.nameid || payload.sub;
        if (id) setMyUserId(parseInt(id, 10));
      } catch (e) {
        console.error("Failed to parse token for UserId", e);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchMyDashboard();
    fetchSocialStandings();
    fetchEfficiencyStandings();
    fetchEvents();
  }, [activeTab]);

  useEffect(() => {
    fetchSocialStandings();
  }, [leaderboardTimeframe]);

  const fetchMyDashboard = async () => {
    try {
      const res = await fetch('http://localhost:5024/api/standings/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyDashboard(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSocialStandings = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/standings/social?timeframe=${leaderboardTimeframe}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSocialStandings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEfficiencyStandings = async () => {
    try {
      const res = await fetch('http://localhost:5024/api/standings/efficiency', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEfficiencyStandings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5024/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getImageForEventType = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('dinner')) return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=200';
    if (t.includes('outing')) return 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=200';
    if (t.includes('workshop') || t.includes('meeting')) return 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&q=80&w=200';
    if (t.includes('celebration') || t.includes('party')) return 'https://images.unsplash.com/photo-1530103862676-de8892b12a15?auto=format&fit=crop&q=80&w=200';
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=200';
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchedUsers([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetchSearchedUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchSearchedUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/users/search?q=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchedUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5024/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        showNotification('Event successfully created! An invitation email has been sent to the selected colleagues.', 'success');
        setShowEventModal(false);
        setNewEvent({ ...newEvent, title: '', description: '', invitedUserIds: [], eventDate: '', location: '' });
        fetchEvents();
        fetchMyDashboard();
        fetchSocialStandings(); // Update points for organizer
      } else {
        const errText = await res.text();
        showNotification(`Failed to create event: ${errText}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('An error occurred while connecting to the backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchEvents();
        fetchMyDashboard();
        fetchSocialStandings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="standings-container">
      <div className="standings-header" style={{ justifyContent: 'center', borderBottom: 'none', marginBottom: '40px', marginTop: '20px' }}>
        <div className="standings-tabs premium-hover" style={{ display: 'flex', gap: '15px', padding: '10px', borderRadius: '50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <button 
            className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
            style={{ padding: '15px 40px', fontSize: '1.2rem', borderRadius: '40px', fontWeight: 'bold', whiteSpace: 'nowrap', transition: 'all 0.3s ease', background: activeTab === 'social' ? 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-dark) 100%)' : 'transparent', color: activeTab === 'social' ? '#101213' : 'var(--text-muted)' }}
          >
            Social Standings
          </button>
          <button 
            className={`tab-btn ${activeTab === 'efficiency' ? 'active' : ''}`}
            onClick={() => setActiveTab('efficiency')}
            style={{ padding: '15px 40px', fontSize: '1.2rem', borderRadius: '40px', fontWeight: 'bold', whiteSpace: 'nowrap', transition: 'all 0.3s ease', background: activeTab === 'efficiency' ? 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-dark) 100%)' : 'transparent', color: activeTab === 'efficiency' ? '#101213' : 'var(--text-muted)' }}
          >
            Efficiency Standings
          </button>
        </div>
      </div>

      <div className="standings-content">
        {activeTab === 'social' && (
          <div className="social-dashboard">
          <div className="social-dashboard-grid fade-in">
            {/* Top Left: Event Invitations */}
            <div className="social-card invites-card">
              <div className="card-header">
                <h3><span className="icon">✉️</span> Event Invitations</h3>
                <button className="view-all-btn" onClick={() => setShowAllInvites(true)}>View all</button>
              </div>
              <div className="invites-list-new">
                {myDashboard?.pendingInvitations?.length === 0 ? (
                  <p className="empty-state">No pending invitations.</p>
                ) : (
                  myDashboard?.pendingInvitations?.map(inv => (
                    <div key={inv.id} className="invite-row" style={{ display: 'flex', flexDirection: 'column', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <div className="event-cover" style={{ width: '80px', height: '60px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                          <img src={getImageForEventType(inv.type)} alt={inv.type} className="cover-image" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        </div>
                        <div className="event-details" style={{ flex: 1 }}>
                          <h4>{inv.title} {inv.type === 'Celebration' ? '🎂' : inv.type === 'Outing' ? '🌲' : ''}</h4>
                          <p>{new Date(inv.eventDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                        </div>
                        <div className="invite-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button className="accept-btn" onClick={() => handleRsvp(inv.id, 'Going')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '0.85rem' }}>Going</button>
                          <button className="decline-btn" onClick={() => handleRsvp(inv.id, 'Declined')} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '0.85rem' }}>Decline</button>
                        </div>
                      </div>
                      
                      {inv.attendeesList && inv.attendeesList.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar-group">
                              {inv.attendeesList.map((att, i) => (
                                <img key={i} src={att.avatar} alt={att.name} className="stacked-avatar" style={{ width: '24px', height: '24px' }} />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{inv.totalAttendees} attending</span>
                          </div>
                          <button style={{ background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }} onClick={() => { setSelectedEventForParticipants(inv); setShowParticipantsModal(true); }}>See all</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Right: Your Social Score */}
            <div className="social-card score-card">
              <div className="score-header-top">
                <h3>Your Social Score</h3>
                <div className="info-tooltip-container">
                  <span className="info-icon">i</span>
                  <div className="info-tooltip">
                    Your Social Score reflects your overall engagement in company events and activities.
                  </div>
                </div>
              </div>
              <div className="score-main">
                <div className="score-number-area">
                  <h1 className="huge-score">{myDashboard?.score?.toLocaleString()}</h1>
                  <p className="monthly-gain">↑ {myDashboard?.pointsThisMonth || 0} this month</p>
                </div>
                <div className="level-circle">
                  <div className="level-content">
                    <span className="star-icon">⭐</span>
                    <p>Level {myDashboard?.level || 1}</p>
                  </div>
                </div>
              </div>
              <div className="score-stats-grid">
                <div className="stat-col">
                  <span className="stat-icon">👥</span>
                  <p>Events<br/>Attended</p>
                  <h4>{myDashboard?.attendedEvents?.length || 0}</h4>
                </div>
                <div className="stat-col">
                  <span className="stat-icon">📅</span>
                  <p>Events<br/>Organized</p>
                  <h4>{myDashboard?.eventsOrganized || 0}</h4>
                </div>
                <div className="stat-col">
                  <span className="stat-icon">🏅</span>
                  <p>Badges<br/>Earned</p>
                  <h4>{myDashboard?.badgesEarned || 0}</h4>
                </div>
                <div className="stat-col">
                  <span className="stat-icon">⏱️</span>
                  <p>Attendance<br/>Rate</p>
                  <h4>{myDashboard?.attendanceRate || 0}%</h4>
                </div>
              </div>
            </div>

            {/* Bottom Left: Upcoming Events */}
            <div className="social-card upcoming-events-card">
              <div className="card-header">
                <h3><span className="icon">📅</span> Upcoming Events</h3>
                <div className="header-actions">
                  <button className="create-event-btn gradient-btn" onClick={() => setShowEventModal(true)}>+ New</button>
                  <button className="view-all-btn" onClick={() => setActiveMenu && setActiveMenu('Calendar')}>View calendar</button>
                </div>
              </div>
              <div className="events-list-new">
                {events.length === 0 ? (
                  <p className="empty-state">No upcoming events.</p>
                ) : (
                  events.slice(0, 3).map(ev => {
                    const dateObj = new Date(ev.eventDate);
                    return (
                      <div key={ev.id} className="event-row" style={{ display: 'flex', flexDirection: 'column', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <div className="date-block">
                            <span className="month">{dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                            <span className="day">{dateObj.getDate()}</span>
                          </div>
                          <div className="event-cover" style={{ width: '80px', height: '60px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={getImageForEventType(ev.type)} alt={ev.type} className="cover-image" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          </div>
                          <div className="event-details" style={{ flex: 1 }}>
                            <h4>{ev.title}</h4>
                            <p>{ev.location}</p>
                          </div>
                          <div className="going-status">
                            {ev.isOrganizer ? (
                              <span className="going-text green">Organizer</span>
                            ) : ev.userRsvpStatus === 'Going' ? (
                              <span className="going-text green">Going</span>
                            ) : (
                              <button style={{ background: 'var(--accent-green)', color: '#101213', border: 'none', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); handleRsvp(ev.id, 'Going'); }}>RSVP</button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar-group">
                              {ev.attendeesList?.map((att, i) => (
                                <img key={i} src={att.avatar} alt={att.name} className="stacked-avatar" style={{ width: '28px', height: '28px' }} />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ev.totalAttendees > 0 ? `${ev.totalAttendees} attending` : 'Be the first to RSVP!'}</span>
                          </div>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }} onClick={() => { setSelectedEventForParticipants(ev); setShowParticipantsModal(true); }}>See all</button>
                        </div>
                      </div>
                    );
                  })
                )}
                <div className="view-all-footer">
                  <button className="view-all-btn" onClick={() => setShowAllEvents(true)}>View all events</button>
                </div>
              </div>
            </div>

            {/* Bottom Right: Social Leaderboard */}
            <div className="social-card leaderboard-new-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '350px' }}>
              <div className="card-header">
                <h3>Social Leaderboard</h3>
                <button className="view-all-btn dropdown-btn" onClick={() => setLeaderboardTimeframe(prev => prev === 'This Month' ? 'All Time' : 'This Month')}>{leaderboardTimeframe} ▾</button>
              </div>
              <div className="leaderboard-list-new" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {socialStandings.length > 0 ? socialStandings.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className={`leaderboard-row ${user.userId === (myDashboard?.userId || myDashboard?.UserId) ? 'is-me' : ''}`}>
                    <div className={`rank-circle rank-${index + 1}`}>{index + 1}</div>
                    <img src={user.avatar} alt="Avatar" className="user-avatar-small" />
                    <div className="user-name">
                      {user.name} {user.userId === (myDashboard?.userId || myDashboard?.UserId) ? <span className="you-text">(You)</span> : ''}
                    </div>
                    <div className="user-score-right">
                      {user.score?.toLocaleString() || 0} <span className="star-icon">⭐</span>
                    </div>
                  </div>
                )) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '0.95rem', padding: '20px', textAlign: 'center', gap: '15px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(185, 246, 90, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="7"></circle>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h4 style={{ color: '#e5e7eb', marginBottom: '8px', fontSize: '1.1rem' }}>No standings yet</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>The leaderboard is waiting for its first champion. Attend or organize events to start earning points!</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="view-all-footer" style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <button className="view-all-btn" onClick={() => setShowFullLeaderboard(true)}>View full leaderboard</button>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'efficiency' && (
          <div className="efficiency-dashboard fade-in">
            <div className="efficiency-header">
              <h2>Efficiency Leaderboard</h2>
              <p>Top performers based on task completion and quality</p>
            </div>
            
            {myDashboard && efficiencyStandings && (
              (() => {
                const currentId = myUserId || myDashboard?.userId || myDashboard?.UserId;
                const myIndex = currentId !== undefined ? efficiencyStandings.findIndex(u => (u.userId ?? u.UserId) === currentId) : -1;
                const myStats = myIndex !== -1 ? efficiencyStandings[myIndex] : null;
                
                if (myStats) {
                   const effScore = myStats.score ?? myStats.Score ?? 0;
                   return (
                     <div style={{ marginBottom: '40px', width: '100%' }}>
                       <h3 style={{ marginBottom: '15px', color: '#e5e7eb', fontSize: '1.2rem', paddingLeft: '10px', borderLeft: '4px solid var(--accent-green)' }}>Your Performance Details</h3>
                       
                       <div className="premium-hover" style={{ background: 'rgba(185, 246, 90, 0.05)', border: '1px solid rgba(185, 246, 90, 0.15)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                         
                         <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                           <div className="rank-circle" style={{ background: 'linear-gradient(135deg, var(--accent-green) 0%, var(--accent-green-dark) 100%)', width: '60px', height: '60px', fontSize: '1.5rem', color: '#101213', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(185, 246, 90, 0.2)' }}>
                             #{myIndex + 1}
                           </div>
                           <img src={myStats.avatar || myStats.Avatar || 'https://via.placeholder.com/80'} alt="Avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                           <div style={{ flex: 1 }}>
                             <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', color: '#fff' }}>{myStats.name || myStats.Name}</h3>
                             <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>{myStats.department || myStats.Department || 'Employee'}</p>
                           </div>
                         </div>
                         
                         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                           <div style={{ textAlign: 'center' }}>
                             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Total Assigned</div>
                             <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{myStats.totalTasks ?? myStats.TotalTasks ?? 0}</div>
                           </div>
                           <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Tasks Completed</div>
                             <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{myStats.completedTasks ?? myStats.CompletedTasks ?? 0}</div>
                           </div>
                           <div style={{ textAlign: 'center' }}>
                             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Efficiency Score</div>
                             <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{effScore}%</div>
                           </div>
                         </div>
                         
                         <div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                             <span style={{ color: 'var(--text-muted)' }}>Completion Progress</span>
                             <span style={{ color: '#fff', fontWeight: '600' }}>{effScore}%</span>
                           </div>
                           <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', overflow: 'hidden' }}>
                             <div style={{ width: `${effScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-green), #10b981)', transition: 'width 1s ease-out' }}></div>
                           </div>
                         </div>
                         
                       </div>
                     </div>
                   );
                }
                return null;
              })()
            )}

            <h3 style={{ marginBottom: '20px', color: '#e5e7eb', fontSize: '1.2rem' }}>Global Standings</h3>
            <div className="leaderboard-grid">
              {efficiencyStandings.map((user, index) => {
                const isMe = (myUserId ?? myDashboard?.userId ?? myDashboard?.UserId) !== undefined && 
                             (user.userId ?? user.UserId) === (myUserId ?? myDashboard?.userId ?? myDashboard?.UserId);
                return (
                <div key={user.userId || user.UserId || index} className={`efficiency-card ${isMe ? 'is-me-card' : ''}`}>
                  <div className="rank-badge">{index + 1}</div>
                  <img src={user.avatar || user.Avatar || 'https://via.placeholder.com/80'} alt={user.name || user.Name} className="user-avatar" />
                  <h4>{user.name || user.Name}</h4>
                  <p>{user.department || user.Department || 'Employee'}</p>
                  
                  <div className="stats">
                    <div className="stat">
                      <span>Tasks</span>
                      <strong>{user.completedTasks ?? user.CompletedTasks ?? 0}</strong>
                    </div>
                    <div className="stat">
                      <span>Efficiency</span>
                      <strong>{user.score ?? user.Score ?? 0}%</strong>
                    </div>
                  </div>
                </div>
              )})}
              {efficiencyStandings.length === 0 && (
                <p className="empty-state">No efficiency data available.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showEventModal && (
        <div className="modal-overlay">
          <div className="event-modal premium-modal">
            <div className="modal-header">
              <h2>Initiate an Event</h2>
              <p>Bring the team together and earn social points</p>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="premium-form-body">
                <div className="form-group full-width">
                  <label>Event Title</label>
                  <input required type="text" placeholder="e.g. Team Dinner at Downtown" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea required placeholder="What is the event about?" rows="3" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Type</label>
                    <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
                      <option>Dinner</option>
                      <option>Workshop</option>
                      <option>Outing</option>
                      <option>Celebration</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Points Reward</label>
                    <input type="number" required value={newEvent.points} onChange={e => setNewEvent({...newEvent, points: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date & Time</label>
                    <input type="datetime-local" required value={newEvent.eventDate} onChange={e => setNewEvent({...newEvent, eventDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <select required value={newEvent.durationHours} onChange={e => setNewEvent({...newEvent, durationHours: parseInt(e.target.value)})}>
                      <option value={1}>1 Hour</option>
                      <option value={2}>2 Hours</option>
                      <option value={3}>3 Hours</option>
                      <option value={4}>4 Hours</option>
                      <option value={5}>5 Hours</option>
                      <option value={8}>8 Hours (All day)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input type="text" required placeholder="e.g. 123 Main St" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Invite Colleagues</label>
                  <input 
                    type="text" 
                    placeholder="Search colleagues by name..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ marginBottom: '10px' }}
                  />
                  <div className="user-select-list">
                    {(searchQuery.trim() !== '' ? searchedUsers : socialStandings).map(user => {
                      const uid = user.userId || user.id;
                      return (
                      <label key={uid} className={`user-checkbox ${newEvent.invitedUserIds.includes(uid) ? 'checked' : ''}`}>
                        <input 
                          type="checkbox" 
                          className="native-checkbox"
                          checked={newEvent.invitedUserIds.includes(uid)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewEvent({...newEvent, invitedUserIds: [...newEvent.invitedUserIds, uid]});
                            } else {
                              setNewEvent({...newEvent, invitedUserIds: newEvent.invitedUserIds.filter(id => id !== uid)});
                            }
                          }}
                        />
                        <img src={user.avatar} alt={user.name} className="tiny-avatar" />
                        <span>{user.name}</span>
                      </label>
                    )})}
                  </div>
                </div>
              </div>
              <div className="modal-actions premium-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEventModal(false)} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="save-btn gradient-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex-center gap-2">
                      <span className="loading-spinner"></span> Creating...
                    </div>
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAllInvites && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowAllInvites(false); }}>
          <div className="event-modal premium-modal">
            <div className="modal-header">
              <h2>All Pending Invitations</h2>
              <p>Review and RSVP to your event invitations</p>
            </div>
            <div className="premium-form-body">
              <div className="invites-list-new">
                {myDashboard?.pendingInvitations?.length === 0 ? (
                  <p className="empty-state">No pending invitations.</p>
                ) : (
                  myDashboard?.pendingInvitations?.map(inv => (
                    <div key={inv.id} className="invite-row" style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '10px' }}>
                      <div className="event-cover">
                        <div className={`cover-image cover-${inv.type.toLowerCase()}`}></div>
                      </div>
                      <div className="event-details">
                        <h4>{inv.title}</h4>
                        <p>{new Date(inv.eventDate).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                      </div>
                      <div className="action-buttons" style={{ flexDirection: 'row' }}>
                        <button className="accept-btn" onClick={() => handleRsvp(inv.id, 'Going')}>Accept</button>
                        <button className="ignore-btn" onClick={() => handleRsvp(inv.id, 'Declined')}>Ignore</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-actions premium-actions">
              <button className="cancel-btn" onClick={() => setShowAllInvites(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showAllEvents && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowAllEvents(false); }}>
          <div className="event-modal premium-modal">
            <div className="modal-header">
              <h2>All Upcoming Events</h2>
              <p>A full view of upcoming company events</p>
            </div>
            <div className="premium-form-body">
              <div className="events-list-new">
                {events.length === 0 ? (
                  <p className="empty-state">No upcoming events.</p>
                ) : (
                  events.map(ev => {
                    const dateObj = new Date(ev.eventDate);
                    return (
                      <div key={ev.id} className="event-row" style={{ display: 'flex', flexDirection: 'column', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                          <div className="date-block">
                            <span className="month">{dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                            <span className="day">{dateObj.getDate()}</span>
                          </div>
                          <div className="event-cover" style={{ width: '80px', height: '60px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={getImageForEventType(ev.type)} alt={ev.type} className="cover-image" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          </div>
                          <div className="event-details" style={{ flex: 1 }}>
                            <h4>{ev.title}</h4>
                            <p>{ev.location}</p>
                          </div>
                          <div className="going-status">
                            {ev.isOrganizer ? (
                              <span className="going-text green">Organizer</span>
                            ) : ev.userRsvpStatus === 'Going' ? (
                              <span className="going-text green">Going</span>
                            ) : (
                              <button style={{ background: 'var(--accent-green)', color: '#101213', border: 'none', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }} onClick={(e) => { e.stopPropagation(); handleRsvp(ev.id, 'Going'); }}>RSVP</button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar-group">
                              {ev.attendeesList?.map((att, i) => (
                                <img key={i} src={att.avatar} alt={att.name} className="stacked-avatar" style={{ width: '28px', height: '28px' }} />
                              ))}
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ev.totalAttendees > 0 ? `${ev.totalAttendees} attending` : 'Be the first to RSVP!'}</span>
                          </div>
                          <button style={{ background: 'transparent', border: 'none', color: 'var(--accent-green)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }} onClick={() => { setSelectedEventForParticipants(ev); setShowParticipantsModal(true); }}>See all</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="modal-actions premium-actions">
              <button className="cancel-btn" onClick={() => setShowAllEvents(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showFullLeaderboard && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowFullLeaderboard(false); }}>
          <div className="event-modal premium-modal">
            <div className="modal-header">
              <h2>Full Social Leaderboard</h2>
              <p>Complete ranking for {leaderboardTimeframe.toLowerCase()}</p>
            </div>
            <div className="premium-form-body">
              <div className="leaderboard-list-new">
                {socialStandings.map((user, index) => (
                  <div key={user.userId || index} className={`leaderboard-row ${user.userId === (myUserId ?? myDashboard?.userId ?? myDashboard?.UserId) ? 'is-me' : ''}`} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div className={`rank-circle rank-${index + 1}`}>{index + 1}</div>
                    <img src={user.avatar} alt="Avatar" className="user-avatar-small" />
                    <div className="user-name">
                      {user.name} {user.userId === (myUserId ?? myDashboard?.userId ?? myDashboard?.UserId) ? <span className="you-text">(You)</span> : ''}
                    </div>
                    <div className="user-score-right">
                      {user.score.toLocaleString()} <span className="star-icon">⭐</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-actions premium-actions">
              <button className="cancel-btn" onClick={() => setShowFullLeaderboard(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setNotification({ show: false, message: '', type: 'success' }); }}>
          <div className="event-modal premium-modal">
            <div className="modal-header">
              <h2>{notification.type === 'success' ? 'Notification' : 'Alert'}</h2>
              <p>System message</p>
            </div>
            <div className="premium-form-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                <p style={{ fontStyle: 'italic', color: 'var(--text-muted, #9ca3af)', textAlign: 'center', fontSize: '1.05rem' }}>
                  {notification.message}
                </p>
              </div>
            </div>
            <div className="modal-actions premium-actions">
              <button className="cancel-btn" onClick={() => setNotification({ show: false, message: '', type: 'success' })}>Close</button>
            </div>
          </div>
        </div>
      )}
      {showParticipantsModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowParticipantsModal(false); }}>
          <div className="event-modal premium-modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Attendees</h2>
              <p>{selectedEventForParticipants?.title}</p>
            </div>
            <div className="premium-form-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '300px', overflowY: 'auto' }}>
                {selectedEventForParticipants && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={selectedEventForParticipants.organizerAvatar} alt={selectedEventForParticipants.organizer} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600' }}>{selectedEventForParticipants.organizer}</span>
                      <span style={{ fontSize: '0.8rem', color: '#8b5cf6', fontWeight: '500' }}>Organizer</span>
                    </div>
                  </div>
                )}
                
                {selectedEventForParticipants?.attendeesList?.length > 0 ? (
                  <>
                    {selectedEventForParticipants.attendeesList.map((att, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <img src={att.avatar} alt={att.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span style={{ fontWeight: '500' }}>{att.name}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="empty-state" style={{ marginTop: '10px' }}>No other attendees yet.</p>
                )}
              </div>
            </div>
            <div className="modal-actions premium-actions">
              <button className="cancel-btn" onClick={() => setShowParticipantsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandingsLayout;
