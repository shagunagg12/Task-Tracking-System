import React, { useState, useEffect } from 'react';
import './NewMeetingModal.css';

const NewMeetingModal = ({ isOpen, onClose, selectedSlot, currentMonthName, currentYear }) => {
  const [users, setUsers] = useState([]);
  const [participantInput, setParticipantInput] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');

  const dayStr = selectedSlot ? selectedSlot.day.date.toString().padStart(2, '0') : '';
  const initialDate = selectedSlot ? `${currentYear}-07-${dayStr}` : '';
  const initialStartHour = selectedSlot ? selectedSlot.hour.toString().padStart(2, '0') + ':00' : '';
  const endHour = selectedSlot ? (selectedSlot.hour + 1 > 23 ? 0 : selectedSlot.hour + 1) : 0;
  const initialEndHour = selectedSlot ? endHour.toString().padStart(2, '0') + ':00' : '';

  const [startDate, setStartDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialStartHour);
  const [endDate, setEndDate] = useState(initialDate);
  const [endTime, setEndTime] = useState(initialEndHour);

  useEffect(() => {
    if (selectedSlot) {
      setStartDate(`${currentYear}-07-${selectedSlot.day.date.toString().padStart(2, '0')}`);
      setEndDate(`${currentYear}-07-${selectedSlot.day.date.toString().padStart(2, '0')}`);
      setStartTime(selectedSlot.hour.toString().padStart(2, '0') + ':00');
      const nextHour = selectedSlot.hour + 1 > 23 ? 0 : selectedSlot.hour + 1;
      setEndTime(nextHour.toString().padStart(2, '0') + ':00');
    }
  }, [selectedSlot, currentYear]);

  const [successData, setSuccessData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccessData(null);
      setIsLoading(false);
      setTitle('');
      setBrief('');
      setParticipantInput('');
      setSelectedParticipants([]);
      
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:5024/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            let data = await response.json();
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const emailClaim = payload.email || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
              if (emailClaim) {
                data = data.filter(u => u.email !== emailClaim);
              }
            } catch (e) {
              console.error("Error decoding token for user filtering", e);
            }
            setUsers(data);
          }
        } catch (error) {
          console.error("Failed to fetch users:", error);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!title) {
      alert("Please enter a meeting title.");
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const meetingData = {
        title,
        brief,
        startDate,
        startTime,
        endDate,
        endTime,
        participants: selectedParticipants
      };

      const response = await fetch('http://localhost:5024/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(meetingData)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessData({ meetLink: result.meetLink, title });
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Failed to save meeting", error);
      alert("Failed to save meeting");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (successData) {
    return (
      <div className="teams-modal-overlay" onClick={onClose}>
        <div className="success-modal-content" onClick={e => e.stopPropagation()}>
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-green)' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2 className="success-title">Meeting Scheduled Successfully</h2>
          <p className="success-subtitle">Invitations are being sent to attendees for <strong>{successData.title}</strong>.</p>
          
          <div className="meet-link-box">
            <div className="meet-link-label">Meeting Link</div>
            <a href={successData.meetLink} target="_blank" rel="noopener noreferrer" className="meet-link-url">{successData.meetLink}</a>
            <button 
              className="btn-copy-link" 
              onClick={() => {
                navigator.clipboard.writeText(successData.meetLink);
              }}
            >
              Copy Link
            </button>
          </div>
          
          <button className="btn-done" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }



  return (
    <div className="teams-modal-overlay" onClick={onClose}>
      <div className="teams-modal-content" onClick={e => e.stopPropagation()}>
        
        <div className="teams-modal-header">
          <div className="header-left">
            <div className="calendar-app-icon" style={{background: 'transparent', color: 'var(--accent-green)', padding: 0}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <h2>New meeting</h2>
            <div className="header-tab active">Details</div>
          </div>
          <div className="header-right">
            <button className="btn-save" onClick={handleSave} disabled={isLoading} style={isLoading ? {opacity: 0.7, cursor: 'not-allowed'} : {}}>
              {isLoading ? 'Creating...' : 'Create'}
            </button>
            <button className="btn-close-modal" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="teams-modal-body">
          <div className="timezone-row">
            Time zone: (UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi <span className="chevron">⌄</span>
          </div>

          <div className="form-layout">
            <div className="form-row">
              <div className="row-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </div>
              <input 
                type="text" 
                className="form-input large-input" 
                placeholder="Add title" 
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-row align-top">
              <div className="row-icon" style={{ marginTop: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <div className="participant-input-container">
                <input 
                  type="text" 
                  className="form-input w-100" 
                  placeholder="Enter name or e-mail" 
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onFocus={() => setUsers([...users])}
                />
                
                {participantInput.length > 0 && users.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {users
                      .filter(u => {
                        const searchStr = participantInput.toLowerCase();
                        const nameMatch = u.fullName ? u.fullName.toLowerCase().includes(searchStr) : false;
                        const emailMatch = u.email ? u.email.toLowerCase().includes(searchStr) : false;
                        return nameMatch || emailMatch;
                      })
                      .map(u => (
                        <div 
                          key={u.id} 
                          className="autocomplete-item"
                          onClick={() => {
                            if (!selectedParticipants.find(p => p.id === u.id)) {
                              setSelectedParticipants([...selectedParticipants, u]);
                            }
                            setParticipantInput('');
                          }}
                        >
                          <div className="avatar">{(u.fullName || u.email.split('@')[0]).charAt(0).toUpperCase()}</div>
                          <div className="user-info">
                            <span className="user-name">{u.fullName || u.email.split('@')[0]}</span>
                            <span className="user-email">{u.email}</span>
                          </div>
                        </div>
                    ))}
                  </div>
                )}

                {selectedParticipants.length > 0 && (
                  <div className="participant-pills">
                    {selectedParticipants.map(p => (
                      <div key={p.id} className="participant-pill">
                        <div className="pill-avatar">{(p.fullName || p.email.split('@')[0]).charAt(0).toUpperCase()}</div>
                        <span className="pill-name">{p.fullName || p.email.split('@')[0]}</span>
                        <button 
                          type="button"
                          className="pill-remove" 
                          onClick={() => setSelectedParticipants(selectedParticipants.filter(sp => sp.id !== p.id))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row date-time-row">
              <div className="row-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div className="datetime-controls">
                <input type="date" className="form-input dt-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <input type="time" className="form-input time-select" value={startTime} onChange={e => setStartTime(e.target.value)} />
                <span className="arrow">→</span>
                <input type="date" className="form-input dt-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                <input type="time" className="form-input time-select" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <div className="row-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <input type="text" className="form-input" placeholder="Add location" />
            </div>

            <div className="form-row align-top">
              <div className="row-icon" style={{ marginTop: '10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              </div>
              <textarea 
                className="form-input" 
                placeholder="Brief" 
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={brief}
                onChange={e => setBrief(e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewMeetingModal;
