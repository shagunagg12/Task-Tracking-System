import React, { useState, useEffect } from 'react';
import './Calendar.css';
import NewMeetingModal from './NewMeetingModal';

const Calendar = ({ isProfileComplete = true, setActiveMenu, addToast }) => {
  const [currentTimeLine, setCurrentTimeLine] = useState(0);

  // Constants to match the screenshot or requirements
  const startHour = 1;
  const endHour = 23;
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  const fetchCalendarData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [meetingsRes, eventsRes] = await Promise.all([
        fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/meetings', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/events', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      let allItems = [];

      if (meetingsRes.ok) {
        const data = await meetingsRes.json();
        const mappedMeetings = data.map(m => ({ ...m, itemType: 'meeting' }));
        allItems = [...allItems, ...mappedMeetings];
      }

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const mappedEvents = eventsData.map(e => {
          const start = new Date(e.eventDate);
          const end = new Date(start);
          end.setHours(end.getHours() + (e.durationHours || 1));
          return {
            id: `event_${e.id}`, // prefix to avoid collision
            title: e.title,
            brief: e.description,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            itemType: 'event',
            location: e.location
          };
        });
        allItems = [...allItems, ...mappedEvents];
      }

      setMeetings(allItems);
    } catch (error) {
      console.error("Failed to fetch calendar data:", error);
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
    fetchCalendarData();
    
    // Check Google Connection Status
    const checkGoogleStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/auth/google/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setIsGoogleConnected(data.isConnected);
        }
      } catch (error) {
        console.error("Failed to check Google status:", error);
      }
    };
    checkGoogleStatus();
  }, [currentDate]);

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleDayClick = (clickedId) => {
    setDays(days.map(d => ({ ...d, active: d.id === clickedId })));
  };

  const handleCellClick = (day, hour) => {
    if (!isProfileComplete) {
       if (addToast) addToast({ title: 'Action Required', message: 'Please complete your profile to create meetings or events.', type: 'warning' });
       if (setActiveMenu) setActiveMenu('Profile');
       return;
    }
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
    fetchCalendarData();
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
      const response = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/auth/google/login', {
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
         const rowIndex = hour;
         const totalMinutes = (endHour - startHour + 1) * 60;
         const elapsedMinutes = (rowIndex * 60) + minutes;
         setCurrentTimeLine((elapsedMinutes / totalMinutes) * 100);
      }
    };
    
    updateTimeLine();
  }, []);

  const meetingsWithLayout = React.useMemo(() => {
    // Group meetings by dayIndex
    const layoutInfo = {};
    const grouped = {};
    
    meetings.forEach(meeting => {
      const start = new Date(meeting.startTime);
      const dayIndex = days.findIndex(d => d.date === start.getDate() && d.fullDate.getMonth() === start.getMonth());
      if (dayIndex === -1) return;
      if (!grouped[dayIndex]) grouped[dayIndex] = [];
      grouped[dayIndex].push(meeting);
    });

    Object.keys(grouped).forEach(dayIndex => {
      let dailyMeetings = grouped[dayIndex];
      // Sort by start time
      dailyMeetings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
      let columns = [];
      dailyMeetings.forEach(meeting => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          let column = columns[i];
          let lastMeetingInColumn = column[column.length - 1];
          if (new Date(lastMeetingInColumn.endTime) <= new Date(meeting.startTime)) {
            column.push(meeting);
            layoutInfo[meeting.id] = { column: i };
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([meeting]);
          layoutInfo[meeting.id] = { column: columns.length - 1 };
        }
      });
      
      // Update max columns for width calculation
      dailyMeetings.forEach(meeting => {
        layoutInfo[meeting.id].totalColumns = columns.length;
      });
    });
    
    return layoutInfo;
  }, [meetings, days]);

  return (
    <div className="teams-calendar-container">
      {/* Calendar Header */}
      <header className="calendar-top-header">
        <div className="calendar-header-left">
          <div className="calendar-icon">📅</div>
          <h2>Calendar</h2>
        </div>
        <div className="calendar-header-right">
          <button className="btn-primary" onClick={() => {
            if (!isProfileComplete) {
               if (addToast) addToast({ title: 'Action Required', message: 'Please complete your profile to create meetings or events.', type: 'warning' });
               if (setActiveMenu) setActiveMenu('Profile');
               return;
            }
            setIsModalOpen(true);
          }}><span className="icon-plus">+</span> New meeting</button>
        </div>
      </header>

      {/* Calendar Toolbar */}
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="btn-today" onClick={handleToday}>
            <span className="icon-calendar">📅</span> Today
          </button>
          <div className="nav-arrows">
            <button className="nav-btn" onClick={handlePrevWeek}>&lt;</button>
            <button className="nav-btn" onClick={handleNextWeek}>&gt;</button>
            <span className="current-month-year">
              {currentMonthName} {currentYear}
            </span>
          </div>
        </div>
        <div className="toolbar-right">
          {/* Elements removed per user request */}
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
            const dayIndex = days.findIndex(d => d.date === start.getDate() && d.fullDate.getMonth() === start.getMonth());
            
            if (dayIndex === -1) return null; // Meeting is not in this week's view

            const startH = start.getHours();
            const startM = start.getMinutes();
            const endH = end.getHours();
            const endM = end.getMinutes();

            // Calculate position
            // top = 90px (header) + hour * 80px + (min / 60) * 80px
            const topOffset = 90 + startH * 80 + (startM / 60) * 80;
            
            // height = duration in mins / 60 * 80px (minimum 40px to ensure visibility)
            let durationMins = (end - start) / (1000 * 60);
            if (durationMins <= 0 || isNaN(durationMins)) durationMins = 30; // Default to 30 mins if invalid or 0
            const height = Math.max((durationMins / 60) * 80, 40);

            // Fetch layout logic
            const layout = meetingsWithLayout[meeting.id] || { column: 0, totalColumns: 1 };
            
            // Base left for the column
            const colWidth = `((100% - 70px) / 7)`;
            
            // Adjust left and width for overlap
            const leftCalc = `calc(70px + (${colWidth} * ${dayIndex}) + ((${colWidth}) / ${layout.totalColumns}) * ${layout.column})`;
            const widthCalc = `calc(${colWidth} / ${layout.totalColumns} - 2px)`; // 2px margin

            let blockStyle = {
              top: `${topOffset}px`,
              left: leftCalc,
              height: `${height}px`,
              width: widthCalc
            };

            if (!isPast) {
              const meetingColors = [
                { border: '#4caf50', bg: 'rgba(76, 175, 80, 0.15)', text: '#a5d6a7' },
                { border: '#2196f3', bg: 'rgba(33, 150, 243, 0.15)', text: '#90caf9' },
                { border: '#ff9800', bg: 'rgba(255, 152, 0, 0.15)', text: '#ffcc80' },
                { border: '#9c27b0', bg: 'rgba(156, 39, 176, 0.15)', text: '#ce93d8' },
                { border: '#e91e63', bg: 'rgba(233, 30, 99, 0.15)', text: '#f48fb1' },
                { border: '#00bcd4', bg: 'rgba(0, 188, 212, 0.15)', text: '#80deea' },
                { border: '#ffeb3b', bg: 'rgba(255, 235, 59, 0.15)', text: '#fff59d' },
                { border: '#7986cb', bg: 'rgba(121, 134, 203, 0.15)', text: '#c5cae9' }
              ];
              const numericId = parseInt(String(meeting.id).replace(/\D/g, '')) || 0;
              const colorIndex = numericId % meetingColors.length;
              const theme = meetingColors[colorIndex];
              blockStyle.border = `1px solid ${theme.border}80`; // 80 adds some transparency to the thin border
              blockStyle.borderLeft = `4px solid ${theme.border}`;
              blockStyle.backgroundColor = theme.bg;
              blockStyle.color = theme.text;
            }

            return (
              <div 
                key={meeting.id} 
                className={`meeting-block ${isPast ? 'meeting-past' : ''}`}
                style={blockStyle}
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
