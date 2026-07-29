import React, { useState, useEffect } from 'react';
import './StandingsLayout.css';

const StandingsLayout = () => {
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
    location: '',
    points: 10,
    invitedUserIds: []
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMyDashboard();
    fetchSocialStandings();
    fetchEfficiencyStandings();
    fetchEvents();
  }, [activeTab]);

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
      const res = await fetch('http://localhost:5024/api/standings/social', {
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

  const handleCreateEvent = async (e) => {
    e.preventDefault();
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
        setShowEventModal(false);
        setNewEvent({ ...newEvent, title: '', description: '', invitedUserIds: [] });
        fetchEvents();
        fetchMyDashboard();
        fetchSocialStandings(); // Update points for organizer
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRsvp = async (eventId, status) => {
    try {
      const res = await fetch(`http://localhost:5024/api/events/${eventId}/rsvp`, {
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
      <div className="standings-header">
        <h1>Company Standings & Engagements</h1>
        <div className="standings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => setActiveTab('social')}
          >
            Social Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'efficiency' ? 'active' : ''}`}
            onClick={() => setActiveTab('efficiency')}
          >
            Efficiency Dashboard
          </button>
        </div>
      </div>

      <div className="standings-content">
        {activeTab === 'social' && (
          <div className="social-dashboard">
            <div className="social-sub-nav">
              <button 
                className={`sub-nav-btn ${socialSubTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setSocialSubTab('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`sub-nav-btn ${socialSubTab === 'events' ? 'active' : ''}`}
                onClick={() => setSocialSubTab('events')}
              >
                Events
              </button>
              <button 
                className={`sub-nav-btn ${socialSubTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setSocialSubTab('leaderboard')}
              >
                Leaderboard
              </button>
            </div>

            {socialSubTab === 'dashboard' && myDashboard && (
              <div className="social-dashboard-view fade-in">
                <div className="dashboard-stats-row">
                  <div className="dash-stat-card glass-panel">
                    <h3>My Social Score</h3>
                    <div className="stat-value highlight">{myDashboard.score} <span className="pts">pts</span></div>
                    <p>Rank: #{myDashboard.rank} of {myDashboard.totalUsers}</p>
                  </div>
                  <div className="dash-stat-card glass-panel">
                    <h3>Events Attended</h3>
                    <div className="stat-value">{myDashboard.attendedEvents.length}</div>
                    <p>Total events participated</p>
                  </div>
                </div>

                <div className="dashboard-main-area">
                  <div className="invitations-section glass-panel">
                    <h2>Pending Invitations</h2>
                    {myDashboard.pendingInvitations.length === 0 ? (
                      <p className="empty-state">No pending invitations right now.</p>
                    ) : (
                      <div className="invites-list">
                        {myDashboard.pendingInvitations.map(inv => (
                          <div key={inv.id} className="invite-card">
                            <div className="invite-info">
                              <span className="event-type">{inv.type}</span>
                              <h4>{inv.title}</h4>
                              <p className="invite-meta">📅 {new Date(inv.eventDate).toLocaleString()} | 📍 {inv.location}</p>
                              <p className="invite-org">From: {inv.organizer}</p>
                            </div>
                            <div className="invite-actions">
                              <button className="btn-accept" onClick={() => handleRsvp(inv.id, 'Going')}>Accept</button>
                              <button className="btn-decline" onClick={() => handleRsvp(inv.id, 'Declined')}>Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="attended-section glass-panel">
                    <h2>Past Attended Events</h2>
                    {myDashboard.attendedEvents.length === 0 ? (
                      <p className="empty-state">You haven't attended any events yet.</p>
                    ) : (
                      <div className="attended-list">
                        {myDashboard.attendedEvents.map(ev => (
                          <div key={ev.id} className="attended-card">
                            <h4>{ev.title} <span className="pts-badge">+{ev.points} pts</span></h4>
                            <p>{new Date(ev.eventDate).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {socialSubTab === 'events' && (
              <div className="events-section glass-panel fade-in">
                <div className="events-header">
                  <h2>Upcoming Events</h2>
                  <button className="create-event-btn gradient-btn" onClick={() => setShowEventModal(true)}>
                    + Initiate Event
                  </button>
                </div>
                <div className="events-list">
                  {events.length === 0 ? (
                    <p className="empty-state">No upcoming events found.</p>
                  ) : (
                    events.map(ev => (
                      <div key={ev.id} className="event-card">
                        <div className="event-info">
                          <span className="event-type">{ev.type}</span>
                          <h3>{ev.title}</h3>
                          <p>{ev.description}</p>
                          <div className="event-meta">
                            <span>📅 {new Date(ev.eventDate).toLocaleString()}</span>
                            <span>📍 {ev.location}</span>
                            <span>🎁 +{ev.points} pts</span>
                          </div>
                          <p className="event-organizer">Organized by {ev.organizer}</p>
                        </div>
                        <div className="event-actions">
                          {ev.userRsvpStatus === 'Going' ? (
                            <button className="rsvp-btn going" onClick={() => handleRsvp(ev.id, 'Declined')}>
                              Going (Cancel)
                            </button>
                          ) : (
                            <button className="rsvp-btn" onClick={() => handleRsvp(ev.id, 'Going')}>
                              RSVP: Going
                            </button>
                          )}
                          <span className="attendees-count">{ev.totalAttendees} going</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {socialSubTab === 'leaderboard' && (
              <div className="leaderboard-section glass-panel fade-in">
                <h2>Top Socialites</h2>
                <div className="leaderboard-list">
                  {socialStandings.map((user, index) => (
                    <div key={user.userId} className="leaderboard-item">
                      <div className="rank">#{index + 1}</div>
                      <img src={user.avatar} alt="Avatar" className="user-avatar" />
                      <div className="user-details">
                        <h4>{user.name}</h4>
                        <p>{user.department}</p>
                      </div>
                      <div className="score-badge">
                        <span className="score">{user.score}</span>
                        <span className="pts">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    <label>Location</label>
                    <input type="text" required placeholder="e.g. 123 Main St" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
                  </div>
                </div>
                <div className="form-group full-width">
                  <label>Invite Colleagues</label>
                  <div className="user-select-list">
                    {socialStandings.map(user => (
                      <label key={user.userId} className="user-checkbox">
                        <input 
                          type="checkbox" 
                          className="native-checkbox"
                          checked={newEvent.invitedUserIds.includes(user.userId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewEvent({...newEvent, invitedUserIds: [...newEvent.invitedUserIds, user.userId]});
                            } else {
                              setNewEvent({...newEvent, invitedUserIds: newEvent.invitedUserIds.filter(id => id !== user.userId)});
                            }
                          }}
                        />
                        <img src={user.avatar} alt={user.name} className="tiny-avatar" />
                        <span>{user.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-actions premium-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEventModal(false)}>Cancel</button>
                <button type="submit" className="save-btn gradient-btn">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandingsLayout;
