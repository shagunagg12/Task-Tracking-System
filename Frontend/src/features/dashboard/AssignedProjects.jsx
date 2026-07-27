import React, { useState, useEffect } from 'react';
import './AssignedProjects.css';

const AssignedProjects = () => {
  const [projectsData, setProjectsData] = useState([]);
  const [taskFilter, setTaskFilter] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5024/api/projects', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setProjectsData(data);
        if (data && data.length > 0) {
            setSelectedProjectId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (isLoading) {
    return <div style={{ color: 'white', padding: '20px' }}>Loading projects...</div>;
  }

  if (projectsData.length === 0) {
    return <div style={{ color: 'white', padding: '20px' }}>No projects found. Please add a project.</div>;
  }

  const activeProject = projectsData.find(p => p.id == selectedProjectId) || projectsData[0];

  const filteredTasks = taskFilter === 'Ongoing' 
    ? activeProject.tasks?.filter(t => t.status === 'In Progress' || t.status === 'Review') || []
    : activeProject.tasks || [];

  const getDeadlineStyle = (color) => {
    if (color === 'orange') return { background: 'rgba(255, 159, 10, 0.1)', color: '#FF9F0A' };
    if (color === 'green') return { background: 'rgba(48, 209, 88, 0.1)', color: '#30D158' };
    return {}; // default red
  };

  return (
    <div className="assigned-projects-container">
      <div className="assigned-projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1>Projects</h1>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {projectsData.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="assigned-grid">
        
        {/* 1. Priority Task */}
        <div className="ap-card col-span-2 priority-task-card">
          <div className="ap-card-title">
            <span>Priority Task</span>
            <span className="priority-tag">High Priority</span>
          </div>
          <h2 className="priority-title">{activeProject.priorityTaskTitle}</h2>
          <p className="priority-desc">
            {activeProject.priorityTaskDesc}
          </p>
          <div className="priority-meta">
            <span><span style={{ color: 'var(--accent-green)' }}>📅</span> Due: {activeProject.priorityTaskDue}</span>
            <span><span style={{ color: 'var(--accent-green)' }}>⏱️</span> {activeProject.priorityTaskTimeRemaining}</span>
          </div>
          <button className="priority-action">Jump to Task</button>
        </div>

        {/* 5. Progress */}
        <div className="ap-card col-span-1">
          <div className="ap-card-title">Overall Progress</div>
          <div className="progress-container">
            <div className="circular-progress" style={{ background: `conic-gradient(var(--accent-green) ${activeProject.progress}%, rgba(255, 255, 255, 0.1) 0)` }}>
              <span className="progress-value">{activeProject.progress}%</span>
            </div>
            <span className="progress-label">On track for delivery</span>
          </div>
        </div>

        {/* 2. Tasks */}
        <div className="ap-card col-span-1">
          <div className="ap-card-title">
            <span>Tasks</span>
            <select 
              value={taskFilter} 
              onChange={(e) => setTaskFilter(e.target.value)}
              style={{
                background: 'var(--bg-dark)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All</option>
              <option value="Ongoing">Ongoing</option>
            </select>
          </div>
          <div className="task-list">
            {filteredTasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-info">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                </div>
                <span className={`task-status ${task.statusClass}`}>{task.status}</span>
              </div>
            ))}
            {filteredTasks.length === 0 && (
               <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '13px' }}>No ongoing tasks.</div>
            )}
          </div>
        </div>

        {/* 4. Deadlines */}
        <div className="ap-card col-span-1">
          <div className="ap-card-title">Upcoming Deadlines</div>
          <div className="deadline-list">
            {activeProject.deadlines?.map((dl, idx) => (
              <div key={idx} className="deadline-item">
                <div className="deadline-date" style={getDeadlineStyle(dl.color)}>
                  <div className="day">{dl.day}</div>
                  <div className="month">{dl.month}</div>
                </div>
                <div className="deadline-info">
                  <h4>{dl.title}</h4>
                  <p>{dl.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Feedback & 7. Hours Devoted */}
        <div className="ap-card col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ flex: 1 }}>
            <div className="ap-card-title">Hours Devoted</div>
            <div className="hours-content">
              <div className="hours-large">{activeProject.hours}</div>
              <div className="hours-trend">
                <span className="up">{activeProject.hoursTrend}</span> vs last week
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
             <div className="ap-card-title">Recent Feedback</div>
             {activeProject.feedbacks?.length > 0 ? (
                 <div className="feedback-bubble">
                   <p className="feedback-text">{activeProject.feedbacks[0].text}</p>
                   <div className="feedback-author">
                     <img src={activeProject.feedbacks[0].authorImage} alt="Manager" />
                     <span>{activeProject.feedbacks[0].authorName}</span>
                   </div>
                 </div>
             ) : (
                 <div style={{color: 'var(--text-muted)', fontSize: '13px'}}>No feedback yet.</div>
             )}
          </div>

        </div>

        {/* 3. Team Members */}
        <div className="ap-card col-span-3">
          <div className="ap-card-title">Team Members</div>
          <div className="team-avatars">
            {activeProject.teamMembers?.map((member, idx) => (
              <div key={idx} className="team-member">
                <img src={member.image} alt={member.name} />
                <span>{member.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssignedProjects;
