import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Folder, CheckSquare, Plus, Search, ChevronRight, Briefcase 
} from 'lucide-react';
import './SuperAdminProjects.css';

const SuperAdminProjects = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const [newProjectName, setNewProjectName] = useState('');
  
  // Task & Project states
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [newDetails, setNewDetails] = useState({ priorityTaskTitle: '', priorityTaskDesc: '', priorityTaskDue: '', priorityTaskTimeRemaining: '', hours: 0, hoursTrend: '' });
  const [newTeamMember, setNewTeamMember] = useState({ name: '' });
  const [newDeadline, setNewDeadline] = useState({ title: '', description: '', day: '', month: '', color: 'green' });
  const [newFeedback, setNewFeedback] = useState({ text: '', authorName: '' });

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5024/api/AdminProjects/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        if (data.length > 0 && !selectedUser) {
          setSelectedUser(data[0]);
        } else if (selectedUser) {
           // Update selected user data if it already exists
           const updatedSelected = data.find(u => u.id === selectedUser.id);
           if (updatedSelected) setSelectedUser(updatedSelected);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim() || !selectedUser) return;
    
    try {
      const response = await fetch('http://localhost:5024/api/AdminProjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, name: newProjectName })
      });
      if (response.ok) {
        setNewProjectName('');
        setShowProjectModal(false);
        fetchUsers(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to assign project:', error);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !activeProjectId) return;

    try {
      const response = await fetch(`http://localhost:5024/api/AdminProjects/${activeProjectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (response.ok) {
        setNewTask({ title: '', description: '' });
        setShowTaskModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!activeProjectId) return;
    try {
      const response = await fetch(`http://localhost:5024/api/AdminProjects/${activeProjectId}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDetails)
      });
      if (response.ok) {
        setShowDetailsModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update details:', error);
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !newTeamMember.name.trim()) return;
    try {
      const response = await fetch(`http://localhost:5024/api/AdminProjects/${activeProjectId}/team-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeamMember)
      });
      if (response.ok) {
        setNewTeamMember({ name: '' });
        setShowTeamModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to add team member:', error);
    }
  };

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !newDeadline.title.trim()) return;
    try {
      const response = await fetch(`http://localhost:5024/api/AdminProjects/${activeProjectId}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeadline)
      });
      if (response.ok) {
        setNewDeadline({ title: '', description: '', day: '', month: '', color: 'green' });
        setShowDeadlineModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to add deadline:', error);
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    if (!activeProjectId || !newFeedback.text.trim()) return;
    try {
      const response = await fetch(`http://localhost:5024/api/AdminProjects/${activeProjectId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFeedback)
      });
      if (response.ok) {
        setNewFeedback({ text: '', authorName: '' });
        setShowFeedbackModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to add feedback:', error);
    }
  };

  if (loading) {
    return <div className="sap-loading">Loading Enterprise Data...</div>;
  }

  return (
    <div className="sap-container">
      {/* SIDEBAR: Users List */}
      <div className="sap-sidebar">
        <div className="sap-sidebar-header">
          <h2>Employees</h2>
          <div className="sap-search-box">
            <Search size={16} />
            <input type="text" placeholder="Search employees..." />
          </div>
        </div>
        <div className="sap-users-list">
          {users.map(user => (
            <div 
              key={user.id} 
              className={`sap-user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
              onClick={() => setSelectedUser(user)}
            >
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=random`} alt="Avatar" />
              <div className="sap-user-info">
                <h4>{user.fullName || 'No Name'}</h4>
                <p>{user.email}</p>
              </div>
              <ChevronRight size={18} className="sap-chevron" />
            </div>
          ))}
        </div>
      </div>

      {/* MAIN AREA: Projects & Tasks */}
      <div className="sap-main">
        {selectedUser ? (
          <>
            <div className="sap-main-header">
               <div>
                  <h1>{selectedUser.fullName || selectedUser.email}'s Workload</h1>
                  <p>Manage projects and tasks assigned to this employee.</p>
               </div>
               <button className="sap-btn-primary" onClick={() => setShowProjectModal(true)}>
                 <Plus size={18} /> Assign New Project
               </button>
            </div>

            <div className="sap-projects-grid">
               {selectedUser.projects && selectedUser.projects.length > 0 ? (
                 selectedUser.projects.map(project => (
                   <motion.div 
                      key={project.id} 
                      className="sap-project-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                   >
                      <div className="sap-project-header">
                         <div className="sap-project-title">
                            <div className="sap-project-icon"><Folder size={20} /></div>
                            <h3>{project.name}</h3>
                         </div>
                         <span className="sap-status-badge">{project.status}</span>
                      </div>
                      
                      <div className="sap-project-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '0 20px', marginBottom: '15px' }}>
                        <button className="sap-btn-icon" style={{background: 'rgba(255,255,255,0.05)', padding: '6px 10px'}} onClick={() => { 
                          setActiveProjectId(project.id); 
                          setNewDetails({
                            priorityTaskTitle: project.priorityTaskTitle || '',
                            priorityTaskDesc: project.priorityTaskDesc || '',
                            priorityTaskDue: project.priorityTaskDue || '',
                            priorityTaskTimeRemaining: project.priorityTaskTimeRemaining || '',
                            hours: project.hours || 0,
                            hoursTrend: project.hoursTrend || ''
                          });
                          setShowDetailsModal(true); 
                        }}>Edit Details</button>
                        <button className="sap-btn-icon" style={{background: 'rgba(255,255,255,0.05)', padding: '6px 10px'}} onClick={() => { setActiveProjectId(project.id); setShowTeamModal(true); }}>+ Team Member</button>
                        <button className="sap-btn-icon" style={{background: 'rgba(255,255,255,0.05)', padding: '6px 10px'}} onClick={() => { setActiveProjectId(project.id); setShowDeadlineModal(true); }}>+ Deadline</button>
                        <button className="sap-btn-icon" style={{background: 'rgba(255,255,255,0.05)', padding: '6px 10px'}} onClick={() => { setActiveProjectId(project.id); setShowFeedbackModal(true); }}>+ Feedback</button>
                      </div>
                      
                      <div className="sap-tasks-section">
                         <div className="sap-tasks-header">
                            <h4>Tasks ({project.tasks?.length || 0})</h4>
                            <button 
                              className="sap-btn-icon" 
                              onClick={() => {
                                setActiveProjectId(project.id);
                                setNewTask({ title: '', description: '' });
                                setShowTaskModal(true);
                              }}
                            >
                              <Plus size={14} /> Add Task
                            </button>
                         </div>
                         
                         {project.tasks && project.tasks.length > 0 ? (
                           <ul className="sap-tasks-list">
                             {project.tasks.map(task => (
                               <li key={task.id} className="sap-task-item">
                                  <CheckSquare size={16} className={`sap-task-icon ${task.statusClass}`} />
                                  <div className="sap-task-details">
                                     <span className="sap-task-title">{task.title}</span>
                                     <span className="sap-task-desc">{task.description}</span>
                                  </div>
                                  <span className={`sap-task-status ${task.statusClass}`}>{task.status}</span>
                               </li>
                             ))}
                           </ul>
                         ) : (
                           <div className="sap-empty-tasks">No tasks assigned yet.</div>
                         )}
                      </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="sap-empty-state">
                    <Briefcase size={48} />
                    <h3>No Projects Assigned</h3>
                    <p>This employee doesn't have any active projects yet.</p>
                 </div>
               )}
            </div>
          </>
        ) : (
          <div className="sap-empty-state">
             <Users size={48} />
             <h3>Select an Employee</h3>
             <p>Choose an employee from the sidebar to view their workload.</p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {showProjectModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="sap-modal" initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}}>
              <h2>Assign New Project</h2>
              <form onSubmit={handleAssignProject}>
                <div className="sap-form-group">
                  <label>Project Name</label>
                  <input 
                    type="text" 
                    value={newProjectName} 
                    onChange={e => setNewProjectName(e.target.value)} 
                    placeholder="e.g. Q3 Marketing Campaign"
                    autoFocus 
                  />
                </div>
                <div className="sap-modal-actions">
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Assign Project</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showTaskModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="sap-modal" initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}}>
              <h2>Add New Task</h2>
              <form onSubmit={handleAddTask}>
                <div className="sap-form-group">
                  <label>Task Title</label>
                  <input 
                    type="text" 
                    value={newTask.title} 
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })} 
                    placeholder="e.g. Design landing page"
                    autoFocus 
                  />
                </div>
                <div className="sap-form-group">
                  <label>Description (Optional)</label>
                  <textarea 
                    value={newTask.description} 
                    onChange={e => setNewTask({ ...newTask, description: e.target.value })} 
                    placeholder="Task details..."
                    rows="3"
                  ></textarea>
                </div>
                <div className="sap-modal-actions">
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Add Task</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        {showDetailsModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="sap-modal" initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}}>
              <h2>Edit Project Details</h2>
              <form onSubmit={handleUpdateDetails}>
                <div className="sap-form-group">
                  <label>Priority Task Title</label>
                  <input type="text" value={newDetails.priorityTaskTitle} onChange={e => setNewDetails({...newDetails, priorityTaskTitle: e.target.value})} placeholder="e.g. Server Migration" />
                </div>
                <div className="sap-form-group">
                  <label>Priority Task Description</label>
                  <textarea value={newDetails.priorityTaskDesc} onChange={e => setNewDetails({...newDetails, priorityTaskDesc: e.target.value})} placeholder="Details..." rows="2"></textarea>
                </div>
                <div className="sap-form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Due Date</label>
                    <input type="text" value={newDetails.priorityTaskDue} onChange={e => setNewDetails({...newDetails, priorityTaskDue: e.target.value})} placeholder="e.g. Aug 23" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Time Remaining</label>
                    <input type="text" value={newDetails.priorityTaskTimeRemaining} onChange={e => setNewDetails({...newDetails, priorityTaskTimeRemaining: e.target.value})} placeholder="e.g. 46h remaining" />
                  </div>
                </div>
                <div className="sap-form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Hours Devoted</label>
                    <input type="number" step="0.1" value={newDetails.hours} onChange={e => setNewDetails({...newDetails, hours: parseFloat(e.target.value)})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Hours Trend</label>
                    <input type="text" value={newDetails.hoursTrend} onChange={e => setNewDetails({...newDetails, hoursTrend: e.target.value})} placeholder="e.g. ↗ 12%" />
                  </div>
                </div>
                <div className="sap-modal-actions">
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowDetailsModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Save Details</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showTeamModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="sap-modal" initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}}>
              <h2>Add Team Member</h2>
              <form onSubmit={handleAddTeamMember}>
                <div className="sap-form-group">
                  <label>Member Name</label>
                  <input type="text" value={newTeamMember.name} onChange={e => setNewTeamMember({ name: e.target.value })} placeholder="e.g. Alice Smith" autoFocus />
                </div>
                <div className="sap-modal-actions">
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowTeamModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Add Member</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showDeadlineModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="sap-modal" initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}}>
              <h2>Add Deadline</h2>
              <form onSubmit={handleAddDeadline}>
                <div className="sap-form-group">
                  <label>Title</label>
                  <input type="text" value={newDeadline.title} onChange={e => setNewDeadline({...newDeadline, title: e.target.value})} placeholder="e.g. Milestone Deadline" autoFocus />
                </div>
                <div className="sap-form-group">
                  <label>Description</label>
                  <input type="text" value={newDeadline.description} onChange={e => setNewDeadline({...newDeadline, description: e.target.value})} placeholder="e.g. Important delivery" />
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
                    <select value={newDeadline.color} onChange={e => setNewDeadline({...newDeadline, color: e.target.value})} style={{width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px'}}>
                      <option value="green">Green</option>
                      <option value="orange">Orange</option>
                      <option value="red">Red</option>
                    </select>
                  </div>
                </div>
                <div className="sap-modal-actions">
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowDeadlineModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Add Deadline</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showFeedbackModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="sap-modal" initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}}>
              <h2>Add Feedback</h2>
              <form onSubmit={handleAddFeedback}>
                <div className="sap-form-group">
                  <label>Feedback Text</label>
                  <textarea value={newFeedback.text} onChange={e => setNewFeedback({...newFeedback, text: e.target.value})} placeholder="e.g. Great work so far!" rows="3" autoFocus></textarea>
                </div>
                <div className="sap-form-group">
                  <label>Author Name</label>
                  <input type="text" value={newFeedback.authorName} onChange={e => setNewFeedback({...newFeedback, authorName: e.target.value})} placeholder="e.g. Manager" />
                </div>
                <div className="sap-modal-actions">
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Add Feedback</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminProjects;
