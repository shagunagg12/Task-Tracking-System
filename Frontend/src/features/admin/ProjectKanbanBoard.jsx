import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, CheckSquare, GripVertical, Edit2, Trash2, Check, ChevronDown } from 'lucide-react';
import './ProjectKanbanBoard.css';

const ProjectKanbanBoard = ({ project, onClose, onTasksChanged }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  
  // New task state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [taskToDelete, setTaskToDelete] = useState(null);
  
  const [activeTab, setActiveTab] = useState('tasks'); // tasks, details, team, deadlines, feedback
  
  // Project Details State
  const [projectDetails, setProjectDetails] = useState({
    priorityTaskTitle: '',
    priorityTaskDesc: '',
    priorityTaskDue: '',
    priorityTaskTimeRemaining: '',
    hours: 0,
    hoursTrend: ''
  });
  
  // Add new states
  const [newTeamMember, setNewTeamMember] = useState({ name: '' });
  const [newDeadline, setNewDeadline] = useState({ title: '', description: '', day: '', month: '', color: 'green' });
  const [newFeedback, setNewFeedback] = useState({ text: '', authorName: '' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (project && project.tasks) {
      setTasks(project.tasks);
      setProjectDetails({
        priorityTaskTitle: project.priorityTaskTitle || '',
        priorityTaskDesc: project.priorityTaskDesc || '',
        priorityTaskDue: project.priorityTaskDue || '',
        priorityTaskTimeRemaining: project.priorityTaskTimeRemaining || '',
        hours: project.hours || 0,
        hoursTrend: project.hoursTrend || ''
      });
      setLoading(false);
    }
  }, [project]);

  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (activeTab === 'team') {
      const fetchUsers = async () => {
        try {
          const res = await fetch('http://localhost:5024/api/AdminUsers');
          if (res.ok) {
            const data = await res.json();
            setAllUsers(data);
          }
        } catch (e) {
          console.error('Failed to fetch users', e);
        }
      };
      fetchUsers();
    }
  }, [activeTab]);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to prevent the dragged element from immediately snapping back
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedTask) return;
    
    // Status mappings
    const statusMap = {
      'Pending': { status: 'Pending', statusClass: 'pending' },
      'In Progress': { status: 'In Progress', statusClass: 'in-progress' },
      'Completed': { status: 'Completed', statusClass: 'done' },
      'Done': { status: 'Done', statusClass: 'done' }
    };
    
    const newStatusInfo = statusMap[targetStatus] || { status: targetStatus, statusClass: 'pending' };
    if (draggedTask.status === targetStatus) return; // No change

    // Optimistically update UI
    const updatedTasks = tasks.map(t => {
      if (t.id === draggedTask.id) {
        return { ...t, status: newStatusInfo.status, statusClass: newStatusInfo.statusClass };
      }
      return t;
    });
    setTasks(updatedTasks);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/tasks/${draggedTask.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatusInfo.status, statusClass: newStatusInfo.statusClass })
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      onTasksChanged(); // Tell parent to refresh users
    } catch (error) {
      console.error(error);
      // Revert on error
      setTasks(project.tasks);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/${project.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, description: '' })
      });
      if (response.ok) {
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setShowAddTask(false);
        onTasksChanged();
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleEditSubmit = async (e, taskId) => {
    e.preventDefault();
    if (!editTaskTitle.trim()) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTaskTitle })
      });
      if (response.ok) {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, title: editTaskTitle } : t));
        setEditingTaskId(null);
        onTasksChanged();
      }
    } catch (error) {
      console.error('Failed to edit task:', error);
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/tasks/${taskToDelete}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== taskToDelete));
        onTasksChanged();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/${project.id}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectDetails)
      });
      if (response.ok) {
        onTasksChanged();
      }
    } catch (error) {
      console.error('Failed to update details:', error);
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!newTeamMember.name) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/${project.id}/team-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeamMember)
      });
      if (response.ok) {
        setNewTeamMember({ name: '' });
        onTasksChanged();
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteTeamMember = async (memberId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/${project.id}/team-members/${memberId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onTasksChanged();
      }
    } catch (error) {
      console.error('Failed to delete team member:', error);
    }
  };

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/${project.id}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeadline)
      });
      if (response.ok) {
        setNewDeadline({ title: '', description: '', day: '', month: '', color: 'green' });
        onTasksChanged();
      }
    } catch (error) { console.error(error); }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminProjects/${project.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeedback)
      });
      if (response.ok) {
        setNewFeedback({ text: '', authorName: '' });
        onTasksChanged();
      }
    } catch (error) { console.error(error); }
  };

  const columns = ['Pending', 'In Progress', 'Completed'];

  return (
    <div className="kanban-overlay">
      <motion.div 
        className="kanban-modal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="kanban-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2>{project.name}</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button className="sap-btn-secondary" onClick={() => setActiveTab('tasks')} style={{ border: activeTab === 'tasks' ? '1px solid var(--sa-primary)' : '1px solid transparent', color: activeTab === 'tasks' ? 'var(--sa-primary)' : 'var(--sa-text)', whiteSpace: 'nowrap' }}>Tasks Board</button>
              <button className="sap-btn-secondary" onClick={() => setActiveTab('details')} style={{ border: activeTab === 'details' ? '1px solid var(--sa-primary)' : '1px solid transparent', color: activeTab === 'details' ? 'var(--sa-primary)' : 'var(--sa-text)', whiteSpace: 'nowrap' }}>Priority Details</button>
              <button className="sap-btn-secondary" onClick={() => setActiveTab('team')} style={{ border: activeTab === 'team' ? '1px solid var(--sa-primary)' : '1px solid transparent', color: activeTab === 'team' ? 'var(--sa-primary)' : 'var(--sa-text)', whiteSpace: 'nowrap' }}>Team Members</button>
              <button className="sap-btn-secondary" onClick={() => setActiveTab('deadlines')} style={{ border: activeTab === 'deadlines' ? '1px solid var(--sa-primary)' : '1px solid transparent', color: activeTab === 'deadlines' ? 'var(--sa-primary)' : 'var(--sa-text)', whiteSpace: 'nowrap' }}>Deadlines</button>
              <button className="sap-btn-secondary" onClick={() => setActiveTab('feedback')} style={{ border: activeTab === 'feedback' ? '1px solid var(--sa-primary)' : '1px solid transparent', color: activeTab === 'feedback' ? 'var(--sa-primary)' : 'var(--sa-text)', whiteSpace: 'nowrap' }}>Feedback History</button>
            </div>
          </div>
          <button className="kanban-close-btn" onClick={onClose} style={{ alignSelf: 'flex-start' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
          {activeTab === 'tasks' && (
            <div className="kanban-board">
              {columns.map(column => {
                const columnTasks = tasks.filter(t => {
                   if (column === 'Completed' && (t.status === 'Completed' || t.status === 'Done')) return true;
                   return t.status === column;
                });
                
                return (
                <div 
                  key={column} 
                  className="kanban-column"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column)}
                >
                  <div className="kanban-column-header">
                    <h3>{column}</h3>
                    <span className="task-count">{columnTasks.length}</span>
                  </div>
                  
                  <div className="kanban-column-body">
                    {columnTasks.map(task => (
                      <div 
                        key={task.id} 
                        className="kanban-task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="task-drag-handle">
                          <GripVertical size={16} />
                        </div>
                        <div className="task-content" style={{ flex: 1, minWidth: 0 }}>
                          {editingTaskId === task.id ? (
                             <form onSubmit={(e) => handleEditSubmit(e, task.id)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                               <input 
                                 type="text" 
                                 value={editTaskTitle} 
                                 onChange={(e) => setEditTaskTitle(e.target.value)} 
                                 style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px' }}
                                 autoFocus
                               />
                               <button type="submit" style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0 }}><Check size={16} /></button>
                               <button type="button" onClick={() => setEditingTaskId(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><X size={16} /></button>
                             </form>
                          ) : (
                             <>
                               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                 <h4 className="task-title" style={{ margin: 0 }}>{task.title}</h4>
                                 <div className="task-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                    <button onClick={() => { setEditingTaskId(task.id); setEditTaskTitle(task.title); }} style={{ background: 'none', border: 'none', color: 'var(--sa-muted)', cursor: 'pointer', padding: 0, opacity: 0.7 }}><Edit2 size={14} /></button>
                                    <button onClick={() => setTaskToDelete(task.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, opacity: 0.7 }}><Trash2 size={14} /></button>
                                 </div>
                               </div>
                               {task.description && <p className="task-desc">{task.description}</p>}
                             </>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {column === 'Pending' && !showAddTask && (
                      <button className="kanban-add-task-btn" onClick={() => setShowAddTask(true)}>
                        <Plus size={16} /> Add a card
                      </button>
                    )}
                    
                    {column === 'Pending' && showAddTask && (
                      <form onSubmit={handleAddTask} className="kanban-add-task-form">
                        <input 
                          type="text" 
                          placeholder="Enter a title for this card..." 
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          autoFocus
                        />
                        <div className="kanban-add-task-actions">
                          <button type="submit" className="sap-btn-primary">Add</button>
                          <button type="button" className="kanban-cancel-btn" onClick={() => setShowAddTask(false)}>
                            <X size={20} />
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {activeTab === 'details' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <form onSubmit={handleSaveDetails}>
                <div className="sap-form-group">
                  <label>Priority Task Title</label>
                  <input type="text" value={projectDetails.priorityTaskTitle} onChange={e => setProjectDetails({...projectDetails, priorityTaskTitle: e.target.value})} placeholder="e.g. Server Migration" />
                </div>
                <div className="sap-form-group">
                  <label>Priority Task Description</label>
                  <textarea value={projectDetails.priorityTaskDesc} onChange={e => setProjectDetails({...projectDetails, priorityTaskDesc: e.target.value})} placeholder="Details..." rows="2"></textarea>
                </div>
                <div className="sap-form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Due Date</label>
                    <input type="text" value={projectDetails.priorityTaskDue} onChange={e => setProjectDetails({...projectDetails, priorityTaskDue: e.target.value})} placeholder="e.g. Aug 23" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Time Remaining</label>
                    <input type="text" value={projectDetails.priorityTaskTimeRemaining} onChange={e => setProjectDetails({...projectDetails, priorityTaskTimeRemaining: e.target.value})} placeholder="e.g. 46h remaining" />
                  </div>
                </div>
                <div className="sap-form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Hours Devoted</label>
                    <input type="number" step="0.1" value={projectDetails.hours} onChange={e => setProjectDetails({...projectDetails, hours: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Hours Trend</label>
                    <input type="text" value={projectDetails.hoursTrend} onChange={e => setProjectDetails({...projectDetails, hoursTrend: e.target.value})} placeholder="e.g. ↗ 12%" />
                  </div>
                </div>
                <div className="sap-modal-actions">
                  <button type="submit" className="sap-btn-primary">Save Details</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'team' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <form onSubmit={handleAddTeamMember}>
                <div className="sap-form-group">
                  <label>Select New Member</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      style={{
                        background: 'rgba(255,255,255,0.05)', 
                        color: '#fff', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        padding: '12px 16px', 
                        borderRadius: '12px', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      {newTeamMember.name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <img src={newTeamMember.avatar || newTeamMember.profilePictureUrl || `https://ui-avatars.com/api/?name=${newTeamMember.name}&background=random`} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                           <span>{newTeamMember.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Select a team member...</span>
                      )}
                      <ChevronDown size={16} />
                    </div>

                    {isDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        background: '#1e1e1e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        maxHeight: '250px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                      }}>
                        {allUsers.map(u => (
                          <div 
                            key={u.id}
                            onClick={() => {
                              setNewTeamMember({...newTeamMember, name: u.fullName});
                              setIsDropdownOpen(false);
                            }}
                            style={{
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.fullName}&background=random`} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                            <div>
                              <div style={{ color: '#fff', fontWeight: '500' }}>{u.fullName}</div>
                              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{u.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="sap-modal-actions">
                  <button type="submit" className="sap-btn-primary"><Plus size={16} /> Add Member</button>
                </div>
                {project.teamMembers && project.teamMembers.length > 0 && (
                  <div style={{ marginTop: '32px' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '16px' }}>Current Team Members</h4>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {project.teamMembers.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                           <img src={m.image} alt={m.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                           <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '600' }}>{m.name}</span>
                           <button 
                             type="button"
                             onClick={() => handleDeleteTeamMember(m.id)}
                             style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: '4px' }}
                             title="Remove Member"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'deadlines' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <form onSubmit={handleAddDeadline}>
                <div className="sap-form-group">
                  <label>Title</label>
                  <input type="text" value={newDeadline.title} onChange={e => setNewDeadline({...newDeadline, title: e.target.value})} placeholder="e.g. Milestone 1" required />
                </div>
                <div className="sap-form-group">
                  <label>Description</label>
                  <input type="text" value={newDeadline.description} onChange={e => setNewDeadline({...newDeadline, description: e.target.value})} placeholder="Details..." />
                </div>
                <div className="sap-form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Day</label>
                    <input type="text" value={newDeadline.day} onChange={e => setNewDeadline({...newDeadline, day: e.target.value})} placeholder="e.g. 29" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Month</label>
                    <input type="text" value={newDeadline.month} onChange={e => setNewDeadline({...newDeadline, month: e.target.value})} placeholder="e.g. AUG" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Color</label>
                    <select value={newDeadline.color} onChange={e => setNewDeadline({...newDeadline, color: e.target.value})} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: '#fff' }}>
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="red">Red</option>
                    </select>
                  </div>
                </div>
                <div className="sap-modal-actions">
                  <button type="submit" className="sap-btn-primary"><Plus size={16} /> Add Deadline</button>
                </div>
                {project.deadlines && project.deadlines.length > 0 && (
                  <div style={{ marginTop: '32px' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '16px' }}>Current Deadlines</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {project.deadlines.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                           <div style={{ background: d.color === 'red' ? '#ef4444' : d.color === 'yellow' ? '#eab308' : '#22c55e', color: '#fff', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', minWidth: '60px' }}>
                              <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{d.day}</div>
                              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>{d.month}</div>
                           </div>
                           <div>
                              <div style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{d.title}</div>
                              {d.description && <div style={{ color: 'var(--sa-muted)', fontSize: '0.85rem' }}>{d.description}</div>}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <form onSubmit={handleAddFeedback}>
                <div className="sap-form-group">
                  <label>Feedback Text</label>
                  <textarea value={newFeedback.text} onChange={e => setNewFeedback({...newFeedback, text: e.target.value})} placeholder="e.g. Great work!" rows="3" required></textarea>
                </div>
                <div className="sap-form-group">
                  <label>Author Name</label>
                  <input type="text" value={newFeedback.authorName} onChange={e => setNewFeedback({...newFeedback, authorName: e.target.value})} placeholder="e.g. John Doe" required />
                </div>
                <div className="sap-modal-actions">
                  <button type="submit" className="sap-btn-primary"><Plus size={16} /> Add Feedback</button>
                </div>
                {project.feedbacks && project.feedbacks.length > 0 && (
                  <div style={{ marginTop: '32px' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '16px' }}>Feedback History</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {project.feedbacks.map((f, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                           <p style={{ color: '#fff', fontStyle: 'italic', margin: '0 0 12px 0', fontSize: '0.95rem' }}>"{f.text}"</p>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <img src={f.authorImage} alt={f.authorName} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                             <span style={{ color: 'var(--sa-muted)', fontSize: '0.85rem' }}>{f.authorName}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

        </div>
      </motion.div>

      {taskToDelete && (
        <div className="kanban-overlay" style={{ zIndex: 1100 }}>
          <motion.div 
            className="kanban-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ maxWidth: '400px', textAlign: 'center', padding: '32px 24px', height: 'auto', minHeight: 'auto' }}
          >
            <div style={{ color: '#ef4444', marginBottom: '16px' }}>
              <Trash2 size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ marginBottom: '16px', color: '#fff' }}>Delete Task?</h2>
            <p style={{ color: 'var(--sa-muted)', marginBottom: '24px' }}>
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="sap-btn-secondary" onClick={() => setTaskToDelete(null)}>Cancel</button>
              <button className="sap-btn-primary" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={confirmDeleteTask}>Delete Task</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectKanbanBoard;
