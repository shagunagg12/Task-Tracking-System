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
  const [newProjectName, setNewProjectName] = useState('');
  
  // Task state
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: null });

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
    if (!newTask.title.trim() || !newTask.projectId) return;

    try {
      const response = await fetch(`http://localhost:5024/api/AdminProjects/${newTask.projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTask.title, description: newTask.description })
      });
      if (response.ok) {
        setNewTask({ title: '', description: '', projectId: null });
        setShowTaskModal(false);
        fetchUsers(); // Refresh data
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
                            <h3>{project.name}</h3>
                         </div>
                         <span className="sap-status-badge">{project.status}</span>
                      </div>
                      
                      <div className="sap-tasks-section">
                         <div className="sap-tasks-header">
                            <h4>Tasks ({project.tasks?.length || 0})</h4>
                            <button 
                              className="sap-btn-icon" 
                              onClick={() => {
                                setNewTask({ ...newTask, projectId: project.id });
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
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminProjects;
