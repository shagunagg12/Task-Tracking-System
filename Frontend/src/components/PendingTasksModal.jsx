import React from 'react';
import './PendingTasksModal.css';

const PendingTasksModal = ({ tasks, onClose }) => {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="pending-tasks-overlay">
      <div className="pending-tasks-content">
        <div className="pending-tasks-header">
          <h2>Action Items</h2>
        </div>

        <div className="pending-tasks-body">
          <p className="pending-tasks-subtitle">
            You have {tasks.length} pending task{tasks.length > 1 ? 's' : ''} that require your attention.
          </p>
          
          <div className="task-list">
            {tasks.map((task, index) => (
              <div className="task-item" key={index} onClick={() => task.onClick()}>
                <div className="task-icon">{task.icon || '🔥'}</div>
                <div className="task-details">
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                </div>
                <div className="task-action">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pending-tasks-actions">
            <button 
              className="pt-btn pt-btn-secondary" 
              onClick={onClose}
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingTasksModal;
