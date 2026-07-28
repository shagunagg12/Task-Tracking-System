import React, { useState, useEffect } from 'react';
import './Calendar.css';
import NewMeetingModal from './NewMeetingModal';

const Calendar = () => {
  const [currentTimeLine, setCurrentTimeLine] = useState(0);

  // Constants to match the screenshot or requirements
  const startHour = 1;
  const endHour = 23;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5024/api/meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Failed to fetch meetings:", error);
    }
  };

  useEffect(() => {
    const getWeekDays = (date) => {
      const dayOfWeek = date.getDay(); // 0 is Sunday
      const firstDayOfWeek = new Date(date);
      firstDayOfWeek.setDate(date.getDate() - dayOfWeek);
      
      const weekDays = [];
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const todayString = new Date().toDateString();
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(firstDayOfWeek);
        d.setDate(firstDayOfWeek.getDate() + i);
        
        weekDays.push({
          id: i + 1,
          date: d.getDate(),
          dayName: dayNames[i],
          active: d.toDateString() === todayString, // Highlight actual today
          fullDate: d
        });
      }
      return weekDays;
    };
    
    setDays(getWeekDays(currentDate));
    fetchMeetings();
  }, [currentDate]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleDayClick = (clickedId) => {
    setDays(days.map(d => ({ ...d, active: d.id === clickedId })));
  };

  const handleCellClick = (day, hour) => {
    handleDayClick(day.id);
    setSelectedSlot({ day, hour });
    setMeetingTitle('');
    setGeneratedLink('');
    setIsModalOpen(true);
  };

  const handleGenerateLink = (e) => {
    e.preventDefault();
    // Simulate generating a unique Google Meet link
    const randomId = Math.random().toString(36).substring(2, 12);
    setGeneratedLink(`https://meet.google.com/${randomId.match(/.{1,3}/g).join('-')}`);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    fetchMeetings();
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentDate(nextWeek);
  };

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentDate(prevWeek);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleConnectGoogle = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5024/api/auth/google/login', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        console.error("Failed to get Google login URL");
      }
    } catch (error) {
      console.error("Error connecting to Google:", error);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  useEffect(() => {
    const updateTimeLine = () => {
      // Use fake time for testing to match screenshot 
      // The screenshot shows a line at roughly 13:40
      const hour = 13;
      const minutes = 40;
      
      // Calculate top percentage. Each row is 1 hour.
      if (hour >= startHour && hour <= endHour) {
         const rowIndex = hour - startHour;
         const totalMinutes = (endHour - startHour + 1) * 60;
         const elapsedMinutes = (rowIndex * 60) + minutes;
         setCurrentTimeLine((elapsedMinutes / totalMinutes) * 100);
      }
    };
    
    updateTimeLine();
  }, []);

  return (
    <div className="teams-calendar-container">
      {/* Calendar Header */}
      <header className="calendar-top-header">
        <div className="calendar-header-left">
          <div className="calendar-icon">📅</div>
          <h2>Calendar</h2>
        </div>
        <div className="calendar-header-right">
          <button className="btn-secondary" onClick={handleConnectGoogle}>
            🔗 Connect Google Calendar
          </button>
          <button className="btn-secondary"># Join with an ID</button>
          <button className="btn-secondary"><span className="icon-video">📹</span> Meet now</button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}><span className="icon-plus">+</span> New meeting</button>
        </div>
      </header>

      {/* Calendar Toolbar */}
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="btn-today" onClick={handleToday}>
            <span className="icon-calendar">📅</span> Today
          </button>
          <div className="nav-arrows">
            <button className="nav-btn" onClick={handlePrevWeek}>‹</button>
            <button className="nav-btn" onClick={handleNextWeek}>›</button>
          </div>
          <div className="current-month-year">
            {currentMonthName} {currentYear} <span className="chevron-down">⌄</span>
          </div>
        </div>
        <div className="toolbar-right">
          <span className="up-to-date-text">You're up to date!</span>
          <button className="btn-view-toggle">
            <span className="icon-list">⊟</span> Work week <span className="chevron-down">⌄</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid Area */}
      <div className="calendar-grid-wrapper">
        <div className="calendar-grid">
          {/* Top Left Corner */}
          <div className="grid-corner">
            <span className="timezone-label">GMT+05:30</span>
          </div>

          {/* Day Headers */}
          {days.map((day, idx) => (
            <div 
              key={idx} 
              className={`day-header ${day.active ? 'active-day' : ''}`}
              onClick={() => handleDayClick(day.id)}
            >
              <div className="day-name">{day.dayName}</div>
              <div className="day-number-wrapper">
                <div className="day-number">{day.date}</div>
              </div>
            </div>
          ))}

          {/* Time Rows and Grid Cells */}
          {hours.map((hour, hourIdx) => (
            <React.Fragment key={`hour-${hour}`}>
              {/* Hour Label */}
              <div className="time-label">
                <span className="time-text">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </span>
              </div>
              
              {/* Grid Cells for this hour */}
              {days.map((day, dayIdx) => (
                <div 
                  key={`cell-${hourIdx}-${dayIdx}`} 
                  className={`grid-cell ${day.active ? 'active-column' : ''}`}
                  onClick={() => handleCellClick(day, hour)}
                ></div>
              ))}
            </React.Fragment>
          ))}
          
          {/* Current Time Indicator Line */}
          <div 
            className="current-time-indicator" 
            style={{ 
              top: `calc(${currentTimeLine}% + 90px)`, // 90px is header row height
              width: '100%' 
            }}
          >
            <div className="time-line"></div>
          </div>
          
          {/* Render Meeting Blocks */}
          {meetings.map((meeting) => {
            const start = new Date(meeting.startTime);
            const end = new Date(meeting.endTime);
            const now = new Date();
            const isPast = end < now;
            
            // Check if meeting is in the current week view
            const meetingDayId = start.getDay() || 7; // Convert 0 (Sun) to 7 or just map correctly
            // Actually, we mapped days in getWeekDays. Let's find the matching day index
            const dayIndex = days.findIndex(d => d.date === start.getDate() && d.fullDate.getMonth() === start.getMonth());
            
            if (dayIndex === -1) return null; // Meeting is not in this week's view

            const startH = start.getHours();
            const startM = start.getMinutes();
            const endH = end.getHours();
            const endM = end.getMinutes();

            // Calculate position
            // top = 90px (header) + (hour - 1) * 80px + (min / 60) * 80px
            const topOffset = 90 + (startH - 1) * 80 + (startM / 60) * 80;
            
            // height = duration in mins / 60 * 80px (minimum 40px to ensure visibility)
            let durationMins = (end - start) / (1000 * 60);
            if (durationMins <= 0 || isNaN(durationMins)) durationMins = 30; // Default to 30 mins if invalid or 0
            const height = Math.max((durationMins / 60) * 80, 40);

            // left = 70px (time col) + (dayIndex * (100% - 70px) / 7)
            const leftCalc = `calc(70px + ((100% - 70px) / 7) * ${dayIndex})`;
            const widthCalc = `calc((100% - 70px) / 7 - 10px)`;

            return (
              <div 
                key={meeting.id} 
                className={`meeting-block ${isPast ? 'meeting-past' : ''}`}
                style={{
                  top: `${topOffset}px`,
                  left: leftCalc,
                  height: `${height}px`,
                  width: widthCalc
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMeeting(meeting);
                }}
              >
                <div className="meeting-block-title">{meeting.title}</div>
                <div className="meeting-block-time">
                  {startH}:{startM.toString().padStart(2, '0')} - {endH}:{endM.toString().padStart(2, '0')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Details Popup */}
      {selectedMeeting && (
        <div className="meeting-details-overlay" onClick={() => setSelectedMeeting(null)}>
          <div className="meeting-details-card" onClick={e => e.stopPropagation()}>
            <div className="details-header">
              <h3>{selectedMeeting.title}</h3>
              <button className="btn-close-details" onClick={() => setSelectedMeeting(null)}>&times;</button>
            </div>
            
            <div className="details-body">
              <div className="detail-row">
                <span className="detail-icon">🕒</span>
                <span className="detail-text">
                  {new Date(selectedMeeting.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedMeeting.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-icon">📝</span>
                <span className="detail-text">{selectedMeeting.brief}</span>
              </div>

              {selectedMeeting.meetLink && (
                <div className="detail-row">
                  <span className="detail-icon">🔗</span>
                  <a href={selectedMeeting.meetLink} target="_blank" rel="noopener noreferrer" className="detail-link">
                    Join Google Meet
                  </a>
                </div>
              )}
              
              <div className="participants-section">
                <h4>Participants ({selectedMeeting.participants?.length || 0})</h4>
                <div className="participants-list">
                  {selectedMeeting.participants?.map(p => (
                    <div key={p.id} className="participant-avatar" title={`${p.fullName} (${p.email})`}>
                      {p.fullName ? p.fullName.charAt(0).toUpperCase() : '?'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      <NewMeetingModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedSlot={selectedSlot}
        currentMonthName={currentMonthName}
        currentYear={currentYear}
      />
    </div>
  );
};

export default Calendar;
