import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Folder, CheckSquare, Plus, Search, ChevronRight, Briefcase, Trash2
} from 'lucide-react';
import ProjectKanbanBoard from './ProjectKanbanBoard';
import './SuperAdminProjects.css';

const SuperAdminProjects = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [kanbanProject, setKanbanProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  
  // Unified Project Creation State
  const [newProject, setNewProject] = useState({
    name: '',
    priorityTaskTitle: '',
    priorityTaskDesc: '',
    priorityTaskDue: '',
    priorityTaskTimeRemaining: '',
    hours: '',
    hoursTrend: '',
    teamMemberName: '',
    deadlineTitle: '',
    deadlineDesc: '',
    deadlineDay: '',
    deadlineMonth: '',
    deadlineColor: 'green',
    feedbackText: '',
    feedbackAuthorName: ''
  });
  
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

  const handleDeleteProjectClick = (projectId, e) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
    setDeleteError('');
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const response = await fetch(`http://localhost:5024/api/AdminProjects/${projectToDelete}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchUsers();
        if (kanbanProject && kanbanProject.id === projectToDelete) {
          setKanbanProject(null);
        }
        setProjectToDelete(null);
      } else {
        setDeleteError('Failed to delete project. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      setDeleteError('An unexpected error occurred.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!newProject.name.trim() || !selectedUser) return;
    
    try {
      const payload = {
        userId: selectedUser.id,
        name: newProject.name,
        priorityTaskTitle: newProject.priorityTaskTitle,
        priorityTaskDesc: newProject.priorityTaskDesc,
        priorityTaskDue: newProject.priorityTaskDue,
        priorityTaskTimeRemaining: newProject.priorityTaskTimeRemaining,
        hours: newProject.hours ? parseFloat(newProject.hours) : 0,
        hoursTrend: newProject.hoursTrend,
        teamMemberName: newProject.teamMemberName,
        deadlineTitle: newProject.deadlineTitle,
        deadlineDesc: newProject.deadlineDesc,
        deadlineDay: newProject.deadlineDay,
        deadlineMonth: newProject.deadlineMonth,
        deadlineColor: newProject.deadlineColor,
        feedbackText: newProject.feedbackText,
        feedbackAuthorName: newProject.feedbackAuthorName
      };

      const response = await fetch('http://localhost:5024/api/AdminProjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setNewProject({
          name: '', priorityTaskTitle: '', priorityTaskDesc: '', priorityTaskDue: '', priorityTaskTimeRemaining: '',
          hours: '', hoursTrend: '', teamMemberName: '', deadlineTitle: '', deadlineDesc: '', deadlineDay: '',
          deadlineMonth: '', deadlineColor: 'green', feedbackText: '', feedbackAuthorName: ''
        });
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
                            <div>
                               <h3>{project.name}</h3>
                               <span className="sap-project-meta">Created recently</span>
                            </div>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <span className={`sap-status-badge ${project.status === 'Completed' ? 'completed' : 'in-progress'}`}>
                             {project.status || 'In Progress'}
                           </span>
                           <button onClick={(e) => handleDeleteProjectClick(project.id, e)} className="sap-btn-icon-danger" title="Delete Project">
                             <Trash2 size={16} />
                           </button>
                         </div>
                      </div>
                      
                      <div className="sap-project-stats">
                         <div className="sap-stat">
                            <span className="sap-stat-value">{project.tasks?.length || 0}</span>
                            <span className="sap-stat-label">Tasks</span>
                         </div>
                         <div className="sap-stat">
                            <span className="sap-stat-value">{project.teamMembers?.length || 0}</span>
                            <span className="sap-stat-label">Members</span>
                         </div>
                         <div className="sap-stat">
                            <span className="sap-stat-value">{project.deadlines?.length || 0}</span>
                            <span className="sap-stat-label">Deadlines</span>
                         </div>
                      </div>
                      
                      <div className="sap-tasks-section" style={{ padding: '0', marginTop: 'auto' }}>
                         <button 
                           className="sap-btn-manage-tasks" 
                           onClick={() => setKanbanProject(project)}
                         >
                            <CheckSquare size={18} /> Manage Project & Tasks
                         </button>
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
            <motion.div className="sap-modal" initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}} style={{ maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
              <h2>Assign New Project</h2>
              <form onSubmit={handleAssignProject}>
                <div className="sap-form-group">
                  <label>Project Name *</label>
                  <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Q3 Marketing Campaign" required autoFocus />
                </div>
                
                <h3 style={{ marginTop: '20px', fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Initial Team Member (Optional)</h3>
                <div className="sap-form-group">
                  <label>Member Name</label>
                  <input type="text" value={newProject.teamMemberName} onChange={e => setNewProject({...newProject, teamMemberName: e.target.value})} placeholder="e.g. Alice Smith" />
                </div>

                <h3 style={{ marginTop: '20px', fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Initial Deadline (Optional)</h3>
                <div className="sap-form-group">
                  <label>Deadline Title</label>
                  <input type="text" value={newProject.deadlineTitle} onChange={e => setNewProject({...newProject, deadlineTitle: e.target.value})} placeholder="e.g. Milestone Deadline" />
                </div>
                <div className="sap-form-group">
                  <label>Description</label>
                  <input type="text" value={newProject.deadlineDesc} onChange={e => setNewProject({...newProject, deadlineDesc: e.target.value})} placeholder="e.g. Important delivery" />
                </div>
                <div className="sap-form-group" style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Day</label>
                    <input type="text" value={newProject.deadlineDay} onChange={e => setNewProject({...newProject, deadlineDay: e.target.value})} placeholder="e.g. 29" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Month</label>
                    <input type="text" value={newProject.deadlineMonth} onChange={e => setNewProject({...newProject, deadlineMonth: e.target.value})} placeholder="e.g. AUG" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Color</label>
                    <select value={newProject.deadlineColor} onChange={e => setNewProject({...newProject, deadlineColor: e.target.value})} style={{width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px'}}>
                      <option value="green">Green</option>
                      <option value="orange">Orange</option>
                      <option value="red">Red</option>
                    </select>
                  </div>
                </div>

                <h3 style={{ marginTop: '20px', fontSize: '16px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Initial Feedback (Optional)</h3>
                <div className="sap-form-group">
                  <label>Feedback Text</label>
                  <textarea value={newProject.feedbackText} onChange={e => setNewProject({...newProject, feedbackText: e.target.value})} placeholder="e.g. Great work so far!" rows="2"></textarea>
                </div>
                <div className="sap-form-group">
                  <label>Author Name</label>
                  <input type="text" value={newProject.feedbackAuthorName} onChange={e => setNewProject({...newProject, feedbackAuthorName: e.target.value})} placeholder="e.g. Manager" />
                </div>

                <div className="sap-modal-actions" style={{ position: 'sticky', bottom: '-20px', background: '#1a1a1a', padding: '20px 0 0 0', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Assign Full Project</button>
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

        {projectToDelete && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="sap-modal" initial={{scale: 0.9, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.9, y: 20}} style={{ maxWidth: '400px', textAlign: 'center' }}>
              <div style={{ color: '#ef4444', marginBottom: '16px' }}>
                <Trash2 size={48} style={{ margin: '0 auto' }} />
              </div>
              <h2 style={{ marginBottom: '16px' }}>Delete Project?</h2>
              <p style={{ color: 'var(--sa-muted)', marginBottom: '24px' }}>
                Are you sure you want to delete this entire project? This action cannot be undone and will permanently delete all tasks, members, and data associated with it.
              </p>
              {deleteError && (
                <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                  {deleteError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="sap-btn-secondary" onClick={() => setProjectToDelete(null)}>Cancel</button>
                <button className="sap-btn-primary" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={confirmDeleteProject}>Delete Project</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {kanbanProject && (
          <ProjectKanbanBoard 
            project={kanbanProject} 
            onClose={() => setKanbanProject(null)} 
            onTasksChanged={() => {
              // Re-fetch users to get updated tasks, then update the selected user and the kanban project
              fetch('http://localhost:5024/api/AdminProjects/users')
                .then(res => res.json())
                .then(data => {
                  setUsers(data);
                  const updatedUser = data.find(u => u.id === selectedUser.id);
                  if (updatedUser) {
                    setSelectedUser(updatedUser);
                    const updatedProject = updatedUser.projects.find(p => p.id === kanbanProject.id);
                    if (updatedProject) {
                      setKanbanProject(updatedProject);
                    }
                  }
                });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminProjects;
