import React, { useState } from 'react';
import './AssignedProjects.css';

const projectsData = [
  {
    id: 'proj1',
    name: 'Website Redesign (Phase 2)',
    priorityTask: {
      title: 'Website Redesign (Phase 2)',
      desc: 'Complete the frontend overhaul for the client portal. Ensure all new UI components follow the updated glassmorphic design system. The deadline is approaching rapidly.',
      due: 'Aug 15',
      timeRemaining: '12h remaining'
    },
    progress: 75,
    tasks: [
      { id: 1, title: 'Design System Update', desc: 'Update color tokens', status: 'Done', statusClass: 'status-done' },
      { id: 2, title: 'API Integration', desc: 'Connect user endpoints', status: 'In Progress', statusClass: 'status-inprogress' },
      { id: 3, title: 'Code Review', desc: 'Review PR #42', status: 'Review', statusClass: 'status-review' },
      { id: 4, title: 'Write Unit Tests', desc: 'Coverage for auth', status: 'In Progress', statusClass: 'status-inprogress' }
    ],
    deadlines: [
      { day: '05', month: 'Aug', title: 'Design Sign-off', desc: 'Client approval needed', color: 'red' },
      { day: '12', month: 'Aug', title: 'Beta Release', desc: 'Deploy to staging', color: 'orange' },
      { day: '15', month: 'Aug', title: 'Final Delivery', desc: 'Production deployment', color: 'green' }
    ],
    hours: 128.5,
    hoursTrend: '↗ 12%',
    feedback: {
      text: '"The new glassmorphic design looks incredible. Great work on the animations!"',
      authorName: 'Sarah, Project Manager',
      authorImage: 'https://ui-avatars.com/api/?name=Sarah+Manager&background=random'
    },
    team: [
      { name: 'Alice', image: 'https://ui-avatars.com/api/?name=Alice+Wonder&background=random' },
      { name: 'Bob', image: 'https://ui-avatars.com/api/?name=Bob+Builder&background=random' },
      { name: 'Charlie', image: 'https://ui-avatars.com/api/?name=Charlie+Day&background=random' },
      { name: 'Diana', image: 'https://ui-avatars.com/api/?name=Diana+Prince&background=random' },
      { name: 'Ethan', image: 'https://ui-avatars.com/api/?name=Ethan+Hunt&background=random' }
    ]
  },
  {
    id: 'proj2',
    name: 'Mobile App Launch',
    priorityTask: {
      title: 'Fix Authentication Bug',
      desc: 'Users are experiencing intermittent logouts on iOS 17. Investigate the token refresh flow and patch immediately.',
      due: 'Aug 10',
      timeRemaining: '24h remaining'
    },
    progress: 45,
    tasks: [
      { id: 1, title: 'Test Token Refresh', desc: 'Simulate expiry', status: 'Done', statusClass: 'status-done' },
      { id: 2, title: 'Patch iOS Bug', desc: 'Update Keychain logic', status: 'In Progress', statusClass: 'status-inprogress' },
      { id: 3, title: 'App Store Review', desc: 'Submit v1.2', status: 'Review', statusClass: 'status-review' }
    ],
    deadlines: [
      { day: '10', month: 'Aug', title: 'Hotfix Release', desc: 'Fix auth bug', color: 'red' },
      { day: '20', month: 'Aug', title: 'Marketing Campaign', desc: 'Launch promo', color: 'green' }
    ],
    hours: 85.0,
    hoursTrend: '↗ 8%',
    feedback: {
      text: '"Thanks for jumping on that iOS bug so quickly. We need it fixed ASAP."',
      authorName: 'David, Tech Lead',
      authorImage: 'https://ui-avatars.com/api/?name=David+Lead&background=random'
    },
    team: [
      { name: 'Alice', image: 'https://ui-avatars.com/api/?name=Alice+Wonder&background=random' },
      { name: 'Frank', image: 'https://ui-avatars.com/api/?name=Frank+Castle&background=random' },
      { name: 'Grace', image: 'https://ui-avatars.com/api/?name=Grace+Hopper&background=random' }
    ]
  }
];

const AssignedProjects = () => {
  const [taskFilter, setTaskFilter] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState(projectsData[0].id);

  const activeProject = projectsData.find(p => p.id === selectedProjectId) || projectsData[0];

  const filteredTasks = taskFilter === 'Ongoing' 
    ? activeProject.tasks.filter(t => t.status === 'In Progress' || t.status === 'Review')
    : activeProject.tasks;

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
          <h2 className="priority-title">{activeProject.priorityTask.title}</h2>
          <p className="priority-desc">
            {activeProject.priorityTask.desc}
          </p>
          <div className="priority-meta">
            <span><span style={{ color: 'var(--accent-green)' }}>📅</span> Due: {activeProject.priorityTask.due}</span>
            <span><span style={{ color: 'var(--accent-green)' }}>⏱️</span> {activeProject.priorityTask.timeRemaining}</span>
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
                  <p>{task.desc}</p>
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
            {activeProject.deadlines.map((dl, idx) => (
              <div key={idx} className="deadline-item">
                <div className="deadline-date" style={getDeadlineStyle(dl.color)}>
                  <div className="day">{dl.day}</div>
                  <div className="month">{dl.month}</div>
                </div>
                <div className="deadline-info">
                  <h4>{dl.title}</h4>
                  <p>{dl.desc}</p>
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
             <div className="feedback-bubble">
               <p className="feedback-text">{activeProject.feedback.text}</p>
               <div className="feedback-author">
                 <img src={activeProject.feedback.authorImage} alt="Manager" />
                 <span>{activeProject.feedback.authorName}</span>
               </div>
             </div>
          </div>

        </div>

        {/* 3. Team Members */}
        <div className="ap-card col-span-3">
          <div className="ap-card-title">Team Members</div>
          <div className="team-avatars">
            {activeProject.team.map((member, idx) => (
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
