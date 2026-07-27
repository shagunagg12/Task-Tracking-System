import React, { useState, useEffect } from 'react';
import './AssignedProjects.css';

const AssignedProjects = () => {
  const [projectsData, setProjectsData] = useState([]);
  const [taskFilter, setTaskFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [completionModalData, setCompletionModalData] = useState(null);
  const [viewMode, setViewMode] = useState('list');

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

  const updateTaskStatus = async (task, projectId, nextStatus) => {
    // 1. Compute completion status strictly BEFORE any state mutation
    const targetProject = projectsData.find(p => p.id == projectId);
    let computedAllDone = false;
    let currentProjectStatus = 'In Progress';
    
    if (targetProject) {
        currentProjectStatus = targetProject.status;
        const allTasks = targetProject.tasks || [];
        // If there are tasks, check if every task will be 'Done' after this change
        if (allTasks.length > 0) {
            computedAllDone = allTasks.every(t => {
                if (t.id === task.id) return nextStatus === 'Done';
                return t.status === 'Done';
            });
        }
    }

    // 2. Perform immutable optimistic update
    const previousProjects = JSON.parse(JSON.stringify(projectsData));
    setProjectsData(prev => prev.map(p => {
        if (p.id == projectId) {
            return {
                ...p,
                tasks: p.tasks.map(t => {
                    if (t.id === task.id) {
                        let newClass = "";
                        if (nextStatus === "Done") newClass = "status-done";
                        else if (nextStatus === "In Progress") newClass = "status-inprogress";
                        else if (nextStatus === "Review") newClass = "status-review";
                        return { ...t, status: nextStatus, statusClass: newClass };
                    }
                    return t;
                })
            };
        }
        return p;
    }));

    // 3. Make the API call
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5024/api/projects/tasks/${task.id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: nextStatus })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update task status');
        }

        // 4. Trigger modal if all tasks are now complete and project is not already completed
        if (computedAllDone && currentProjectStatus !== 'Completed') {
            setCompletionModalData(projectId);
        }

    } catch (err) {
        console.error('Error updating task status:', err);
        setProjectsData(previousProjects); // revert
    }
  };

  const handleConfirmCompletion = async () => {
    if (!completionModalData) return;
    const projectId = completionModalData;
    setCompletionModalData(null);
    
    try {
        const token = localStorage.getItem('token');
        const projResponse = await fetch(`http://localhost:5024/api/projects/${projectId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'Completed' })
        });
        if (projResponse.ok) {
            setProjectsData(prev => prev.map(p => p.id == projectId ? { ...p, status: 'Completed' } : p));
        }
    } catch (err) {
        console.error("Failed to update project status:", err);
    }
  };

  const filteredProjects = projectsData.filter(p => {
    if (projectFilter === 'Completed') return p.status === 'Completed';
    if (projectFilter === 'In Progress') return p.status === 'In Progress';
    return true;
  });

  const activeProject = filteredProjects.find(p => p.id == selectedProjectId) || filteredProjects[0] || projectsData[0];

  const totalTasks = activeProject.tasks?.length || 0;
  const completedTasks = activeProject.tasks?.filter(t => t.status === 'Done').length || 0;
  const computedProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const filteredTasks = activeProject.tasks?.filter(t => {
    if (taskFilter === 'Completed') return t.status === 'Done';
    if (taskFilter === 'Ongoing') return t.status === 'In Progress';
    if (taskFilter === 'Pending') return t.status === 'Review';
    return true;
  }) || [];

  const getDeadlineStyle = (color) => {
    if (color === 'orange') return { background: 'rgba(255, 159, 10, 0.1)', color: '#FF9F0A' };
    if (color === 'green') return { background: 'rgba(48, 209, 88, 0.1)', color: '#30D158' };
    return {}; // default red
  };

  return (
    <div className="assigned-projects-container">
      {viewMode === 'list' ? (
        <>
          <div className="assigned-projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <h1>Projects</h1>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status Filter:</span>
                <select 
                  value={projectFilter} 
                  onChange={(e) => setProjectFilter(e.target.value)}
                  style={{
                    background: 'var(--bg-dark)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="project-cards-grid">
            {filteredProjects.length === 0 ? (
                <div style={{ color: 'var(--text-muted)' }}>No projects match this filter.</div>
            ) : (
                filteredProjects.map(proj => {
                    const total = proj.tasks?.length || 0;
                    const completed = proj.tasks?.filter(t => t.status === 'Done').length || 0;
                    const prog = total === 0 ? 0 : Math.round((completed / total) * 100);
                    return (
                      <div 
                        key={proj.id} 
                        className="project-card"
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setViewMode('detail');
                        }}
                      >
                        <div className="project-card-header">
                          <h3>{proj.name}</h3>
                          <span className={`status-badge ${proj.status === 'Completed' ? 'status-done' : 'status-inprogress'}`}>
                            {proj.status}
                          </span>
                        </div>
                        <div className="project-card-stats">
                          <div className="stat-row">
                            <span className="stat-label">Tasks Completed</span>
                            <span className="stat-value">{completed} / {total}</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Overall Progress</span>
                            <span className="stat-value">{prog}%</span>
                          </div>
                          <div className="stat-row">
                            <span className="stat-label">Hours Devoted</span>
                            <span className="stat-value">{proj.hours}h</span>
                          </div>
                        </div>
                        <div className="project-card-progress">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${prog}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                })
            )}
          </div>
        </>
      ) : (
        <>
          <div className="assigned-projects-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                className="back-to-projects-btn"
                onClick={() => setViewMode('list')}
              >
                ⬅ Back to Projects
              </button>
              <h1 style={{ margin: 0, fontSize: '24px' }}>{activeProject?.name}</h1>
              {activeProject?.status === 'Completed' && (
                <span className="status-badge status-done">Completed</span>
              )}
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
            <div className="circular-progress" style={{ background: `conic-gradient(var(--accent-green) ${computedProgress}%, rgba(255, 255, 255, 0.1) 0)` }}>
              <span className="progress-value">{computedProgress}%</span>
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
              className="task-filter-select"
            >
              <option value="All">All</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
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
                <select 
                  className={`task-status ${task.statusClass}`}
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task, activeProject.id, e.target.value)}
                  style={{ 
                    cursor: 'pointer', 
                    border: 'none', 
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    textAlign: 'center',
                    paddingRight: '10px'
                  }}
                  title="Change status"
                >
                  <option value="In Progress" style={{ background: 'var(--bg-card)', color: '#0A84FF' }}>In Progress</option>
                  <option value="Review" style={{ background: 'var(--bg-card)', color: '#FF9F0A' }}>Review</option>
                  <option value="Done" style={{ background: 'var(--bg-card)', color: '#30D158' }}>Done</option>
                </select>
              </div>
            ))}
            {filteredTasks.length === 0 && (
               <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '13px' }}>No tasks found for this filter.</div>
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

      {completionModalData && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <div className="custom-modal-icon">🎉</div>
            <h3 className="custom-modal-title">All Tasks Completed!</h3>
            <p className="custom-modal-text">You have successfully finished all tasks for this project. Would you like to mark the entire project as completed?</p>
            <div className="custom-modal-actions">
              <button className="custom-modal-btn cancel" onClick={() => setCompletionModalData(null)}>Not Yet</button>
              <button className="custom-modal-btn confirm" onClick={handleConfirmCompletion}>Mark as Completed</button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AssignedProjects;
