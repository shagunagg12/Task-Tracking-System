import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, X, Shield, Mail, User, ShieldAlert, Download, Copy, CheckCircle, Activity, Briefcase, ChevronRight } from 'lucide-react';
import './SuperAdminUsers.css';

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });

  // Drawer state
  const [showDrawer, setShowDrawer] = useState(false);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.map(d => d.name));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5024/api/AdminUsers');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5024/api/AdminUsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        setShowAddModal(false);
        setFormData({ fullName: '', email: '', password: '' });
        fetchUsers();
      } else {
        const err = await response.text();
        alert(err);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5024/api'}/AdminUsers/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName: formData.fullName, 
          email: formData.email,
          department: formData.department,
          designation: formData.designation
        })
      });
      if (response.ok) {
        setShowEditModal(false);
        fetchUsers();
        if (showDrawer && insights) {
          // close drawer on edit for simplicity, or re-fetch
          setShowDrawer(false);
        }
      } else {
        const err = await response.text();
        alert(err);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch(`http://localhost:5024/api/AdminUsers/${selectedUser.id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setShowDeleteModal(false);
        setShowDrawer(false);
        fetchUsers();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleStatus = async (user, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5024/api/AdminUsers/${user.id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchUsers();
        if (selectedUser && selectedUser.id === user.id) {
            setSelectedUser({...selectedUser, status: selectedUser.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'});
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (user, e) => {
    e.stopPropagation();
    setSelectedUser(user);
    setFormData({ 
      fullName: user.fullName, 
      email: user.email, 
      password: '',
      department: insights?.profile?.department || '',
      designation: insights?.profile?.designation || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user, e) => {
    e.stopPropagation();
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openInsightsDrawer = async (user) => {
    setSelectedUser(user);
    setShowDrawer(true);
    setInsights(null);
    setLoadingInsights(true);
    try {
      const response = await fetch(`http://localhost:5024/api/AdminUsers/${user.id}/insights`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error("Failed to load insights", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Full Name', 'Email', 'Role', 'Status'];
    const csvContent = [
      headers.join(','),
      ...users.map(u => `${u.id},"${u.fullName}","${u.email}",${u.role},${u.status}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyEmail = (email, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All Status' || 
                          (statusFilter === 'Active' && u.status === 'ACTIVE') || 
                          (statusFilter === 'Inactive' && u.status === 'BLOCKED');
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="sau-container">
      <div className="sau-header">
        <div>
          <h1 className="sau-title">User Management</h1>
          <p className="sau-subtitle">Manage employees, roles, and access across the organization.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="sap-btn-secondary" onClick={exportToCSV}>
            <Download size={18} /> Export Data
          </button>
          <button className="sap-btn-primary" onClick={() => { setFormData({ fullName: '', email: '', password: '' }); setShowAddModal(true); }}>
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      <div className="sau-controls">
        <div className="sau-search">
          <Search size={18} className="sau-search-icon" />
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sau-filters">
          <select className="sau-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="All Roles">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Employee">Employee</option>
          </select>
          <select className="sau-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="sau-table-container">
        <table className="sau-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} onClick={() => openInsightsDrawer(user)} className="sau-row-clickable">
                <td>
                  <div className="sau-user-cell">
                    <img src={user.avatar} alt={user.fullName} className="sau-avatar" />
                    <div>
                      <div className="sau-name">{user.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--sa-muted)' }}>ID: #{user.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="sau-contact-cell" onClick={(e) => copyEmail(user.email, e)} title="Click to copy email">
                    {copiedEmail === user.email ? <CheckCircle size={14} color="#4ade80" /> : <Mail size={14} />}
                    <span style={{ cursor: 'pointer' }}>{user.email}</span>
                  </div>
                </td>
                <td>
                  <div className="sau-role-cell">
                    <Shield size={14} />
                    <span>{user.role}</span>
                  </div>
                </td>
                <td>
                  <span 
                    className={`sau-status-badge ${user.status.toLowerCase()}`}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => handleToggleStatus(user, e)}
                    title="Click to toggle status"
                  >
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="sau-actions-cell">
                    <button className="sau-action-btn" onClick={(e) => openEditModal(user, e)} title="Edit"><Edit2 size={16} /></button>
                    <button className="sau-action-btn delete" onClick={(e) => openDeleteModal(user, e)} title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="sau-empty-state">
                  No users found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {/* INSIGHTS DRAWER */}
        {showDrawer && selectedUser && (
          <>
            <motion.div className="sau-drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDrawer(false)} />
            <motion.div className="sau-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
              <div className="sau-drawer-header">
                <h2>User Insights</h2>
                <button className="sap-btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
              </div>
              <div className="sau-drawer-content">
                <div className="sau-drawer-profile">
                  <img src={selectedUser.avatar} alt={selectedUser.fullName} className="sau-drawer-avatar" />
                  <div className="sau-drawer-info">
                    <h3>{selectedUser.fullName}</h3>
                    <p>{selectedUser.email}</p>
                    <span className={`sau-status-badge ${selectedUser.status.toLowerCase()}`}>{selectedUser.status}</span>
                  </div>
                </div>

                {loadingInsights ? (
                  <div className="sau-loading">Loading insights...</div>
                ) : insights ? (
                  <div className="sau-insights-body">
                    <div className="sau-stats-grid">
                      <div className="sau-stat-card">
                        <div className="sau-stat-icon"><Briefcase size={18} /></div>
                        <div className="sau-stat-val">{insights.activeProjects}</div>
                        <div className="sau-stat-label">Active Projects</div>
                      </div>
                      <div className="sau-stat-card">
                        <div className="sau-stat-icon success"><CheckCircle size={18} /></div>
                        <div className="sau-stat-val">{insights.completionRate}%</div>
                        <div className="sau-stat-label">Task Completion</div>
                      </div>
                    </div>

                    <div className="sau-drawer-section">
                      <h4>Bio & Details</h4>
                      {insights.profile ? (
                        <div className="sau-drawer-bio">
                          <p><strong>Designation:</strong> {insights.profile.designation || 'Not set'}</p>
                          <p><strong>Department:</strong> {insights.profile.department || 'Not set'}</p>
                          <p><strong>Bio:</strong> {insights.profile.bio || 'No bio provided'}</p>
                        </div>
                      ) : (
                        <p className="sau-empty-text">No profile information available.</p>
                      )}
                    </div>

                    <div className="sau-drawer-section">
                      <h4>Recent Projects</h4>
                      {insights.recentProjects && insights.recentProjects.length > 0 ? (
                        <ul className="sau-drawer-projects">
                          {insights.recentProjects.map(p => (
                            <li key={p.id}>
                              <div className="sau-dp-info">
                                <span className="sau-dp-title">{p.name}</span>
                                <span className="sau-dp-status">{p.status}</span>
                              </div>
                              <ChevronRight size={16} className="sau-dp-icon" />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="sau-empty-text">User is not assigned to any projects.</p>
                      )}
                    </div>

                    <div className="sau-drawer-actions">
                      <button className="sap-btn-secondary" onClick={(e) => openEditModal(selectedUser, e)}>
                        <Edit2 size={16} /> Edit Profile
                      </button>
                      <button 
                        className="sap-btn-primary" 
                        style={{ background: selectedUser.status === 'ACTIVE' ? '#ef4444' : '#10b981', color: '#fff', borderColor: selectedUser.status === 'ACTIVE' ? '#ef4444' : '#10b981' }} 
                        onClick={(e) => handleToggleStatus(selectedUser, e)}
                      >
                        {selectedUser.status === 'ACTIVE' ? <><Trash2 size={16} /> Block User</> : <><CheckCircle size={16} /> Unblock User</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="sau-error">Could not load insights.</div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* ADD MODAL */}
        {showAddModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} style={{ zIndex: 1000 }}>
            <motion.div className="sap-modal" initial={{scale: 0.95, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.95, y: 20}}>
              <div className="sap-modal-header">
                <h2>Add New Employee</h2>
                <button className="sap-btn-icon" onClick={() => setShowAddModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleAddUser}>
                <div className="sap-form-group">
                  <label><User size={14} /> Full Name</label>
                  <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="e.g. Jane Doe" />
                </div>
                <div className="sap-form-group">
                  <label><Mail size={14} /> Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@example.com" />
                </div>
                <div className="sap-form-group">
                  <label><ShieldAlert size={14} /> Temporary Password</label>
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Must be at least 6 characters" />
                </div>
                <div className="sap-modal-actions">
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Create Account</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* EDIT MODAL */}
        {showEditModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} style={{ zIndex: 1000 }}>
            <motion.div className="sap-modal" initial={{scale: 0.95, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.95, y: 20}}>
              <div className="sap-modal-header">
                <h2>Edit Employee</h2>
                <button className="sap-btn-icon" onClick={() => setShowEditModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleEditUser}>
                <div className="sap-form-group">
                  <label><User size={14} /> Full Name</label>
                  <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="sap-form-group">
                  <label><Mail size={14} /> Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="sap-form-group">
                  <label>Department</label>
                  <select 
                    value={formData.department || ''} 
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    className="sau-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Department...</option>
                    {departments.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="sap-form-group">
                  <label>Designation</label>
                  <select 
                    value={formData.designation || ''} 
                    onChange={e => setFormData({...formData, designation: e.target.value})}
                    className="sau-select"
                    style={{ width: '100%' }}
                  >
                    <option value="">Select Designation...</option>
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Senior Developer">Senior Developer</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="Team Lead">Team Lead</option>
                  </select>
                </div>
                <div className="sap-modal-actions">
                  <button type="button" className="sap-btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="sap-btn-primary">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <motion.div className="sap-modal-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} style={{ zIndex: 1000 }}>
            <motion.div className="sap-modal" initial={{scale: 0.95, y: 20}} animate={{scale: 1, y: 0}} exit={{scale: 0.95, y: 20}} style={{ maxWidth: '400px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '60px', height: '60px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <Trash2 size={30} />
                </div>
                <h2 style={{ margin: '0 0 8px 0' }}>Delete Employee?</h2>
                <p style={{ color: 'var(--sa-muted)', margin: 0, fontSize: '0.95rem' }}>
                  Are you sure you want to delete <strong>{selectedUser?.fullName}</strong>? This will permanently remove their account, projects, and tasks.
                </p>
              </div>
              <div className="sap-modal-actions" style={{ justifyContent: 'center', gap: '16px' }}>
                <button className="sap-btn-secondary" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="sap-btn-primary" onClick={handleDeleteUser} style={{ flex: 1, background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminUsers;
