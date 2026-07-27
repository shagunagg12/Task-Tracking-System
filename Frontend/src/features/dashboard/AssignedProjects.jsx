import React from 'react';
import './AssignedProjects.css';

const AssignedProjects = () => {
  return (
    <div className="assigned-projects-container">
      <div className="assigned-projects-header">
        <h1>Projects</h1>
      </div>

      <div className="assigned-grid">
        
        {/* 1. Priority Task */}
        <div className="ap-card col-span-2 priority-task-card">
          <div className="ap-card-title">
            <span>Priority Task</span>
            <span className="priority-tag">High Priority</span>
          </div>
          <h2 className="priority-title">Website Redesign (Phase 2)</h2>
          <p className="priority-desc">
            Complete the frontend overhaul for the client portal. Ensure all new UI components follow the updated glassmorphic design system. The deadline is approaching rapidly.
          </p>
          <div className="priority-meta">
            <span><span style={{ color: 'var(--accent-green)' }}>📅</span> Due: Aug 15</span>
            <span><span style={{ color: 'var(--accent-green)' }}>⏱️</span> 12h remaining</span>
          </div>
          <button className="priority-action">Jump to Task</button>
        </div>

        {/* 5. Progress */}
        <div className="ap-card col-span-1">
          <div className="ap-card-title">Overall Progress</div>
          <div className="progress-container">
            <div className="circular-progress">
              <span className="progress-value">75%</span>
            </div>
            <span className="progress-label">On track for delivery</span>
          </div>
        </div>

        {/* 2. Tasks */}
        <div className="ap-card col-span-1">
          <div className="ap-card-title">Tasks</div>
          <div className="task-list">
            <div className="task-item">
              <div className="task-info">
                <h4>Design System Update</h4>
                <p>Update color tokens</p>
              </div>
              <span className="task-status status-done">Done</span>
            </div>
            <div className="task-item">
              <div className="task-info">
                <h4>API Integration</h4>
                <p>Connect user endpoints</p>
              </div>
              <span className="task-status status-inprogress">In Progress</span>
            </div>
            <div className="task-item">
              <div className="task-info">
                <h4>Code Review</h4>
                <p>Review PR #42</p>
              </div>
              <span className="task-status status-review">Review</span>
            </div>
            <div className="task-item">
              <div className="task-info">
                <h4>Write Unit Tests</h4>
                <p>Coverage for auth</p>
              </div>
              <span className="task-status status-inprogress">In Progress</span>
            </div>
          </div>
        </div>

        {/* 4. Deadlines */}
        <div className="ap-card col-span-1">
          <div className="ap-card-title">Upcoming Deadlines</div>
          <div className="deadline-list">
            <div className="deadline-item">
              <div className="deadline-date">
                <div className="day">05</div>
                <div className="month">Aug</div>
              </div>
              <div className="deadline-info">
                <h4>Design Sign-off</h4>
                <p>Client approval needed</p>
              </div>
            </div>
            <div className="deadline-item">
              <div className="deadline-date" style={{ background: 'rgba(255, 159, 10, 0.1)', color: '#FF9F0A' }}>
                <div className="day">12</div>
                <div className="month">Aug</div>
              </div>
              <div className="deadline-info">
                <h4>Beta Release</h4>
                <p>Deploy to staging</p>
              </div>
            </div>
            <div className="deadline-item">
              <div className="deadline-date" style={{ background: 'rgba(48, 209, 88, 0.1)', color: '#30D158' }}>
                <div className="day">15</div>
                <div className="month">Aug</div>
              </div>
              <div className="deadline-info">
                <h4>Final Delivery</h4>
                <p>Production deployment</p>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Feedback & 7. Hours Devoted */}
        <div className="ap-card col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ flex: 1 }}>
            <div className="ap-card-title">Hours Devoted</div>
            <div className="hours-content">
              <div className="hours-large">128.5</div>
              <div className="hours-trend">
                <span className="up">↗ 12%</span> vs last week
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
             <div className="ap-card-title">Recent Feedback</div>
             <div className="feedback-bubble">
               <p className="feedback-text">"The new glassmorphic design looks incredible. Great work on the animations!"</p>
               <div className="feedback-author">
                 <img src="https://ui-avatars.com/api/?name=Sarah+Manager&background=random" alt="Manager" />
                 <span>Sarah, Project Manager</span>
               </div>
             </div>
          </div>

        </div>

        {/* 3. Team Members */}
        <div className="ap-card col-span-3">
          <div className="ap-card-title">Team Members</div>
          <div className="team-avatars">
            <div className="team-member">
              <img src="https://ui-avatars.com/api/?name=Alice+Wonder&background=random" alt="Alice" />
              <span>Alice</span>
            </div>
            <div className="team-member">
              <img src="https://ui-avatars.com/api/?name=Bob+Builder&background=random" alt="Bob" />
              <span>Bob</span>
            </div>
            <div className="team-member">
              <img src="https://ui-avatars.com/api/?name=Charlie+Day&background=random" alt="Charlie" />
              <span>Charlie</span>
            </div>
            <div className="team-member">
              <img src="https://ui-avatars.com/api/?name=Diana+Prince&background=random" alt="Diana" />
              <span>Diana</span>
            </div>
             <div className="team-member">
              <img src="https://ui-avatars.com/api/?name=Ethan+Hunt&background=random" alt="Ethan" />
              <span>Ethan</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssignedProjects;
