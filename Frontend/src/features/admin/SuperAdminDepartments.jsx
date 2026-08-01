import React, { useState, useEffect } from 'react';
import { Plus, Users, Building2 } from 'lucide-react';
import './SuperAdminDepartments.css';

const SuperAdminDepartments = ({ addToast }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail view state
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  useEffect(() => {
    if (selectedDepartment) {
      fetchAnnouncements(selectedDepartment.name);
    } else {
      setAnnouncements([]);
    }
  }, [selectedDepartment]);

  const fetchAnnouncements = async (deptName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/DepartmentNotifications/${encodeURIComponent(deptName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/DepartmentNotifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        if (addToast) addToast({ type: 'success', text: 'Announcement deleted' });
        fetchAnnouncements(selectedDepartment.name);
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const submitEditAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnnouncement.title.trim() || !editingAnnouncement.message.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/DepartmentNotifications/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editingAnnouncement.title, message: editingAnnouncement.message })
      });
      if (response.ok) {
        if (addToast) addToast({ type: 'success', text: 'Announcement updated' });
        setEditingAnnouncement(null);
        fetchAnnouncements(selectedDepartment.name);
      }
    } catch (error) {
      console.error('Failed to update announcement:', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/departments/with-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      if (addToast) addToast({ type: 'default', text: 'Failed to fetch departments' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDeptName.trim() })
      });

      if (response.ok) {
        setNewDeptName('');
        setShowModal(false);
        fetchDepartments(); // Refresh the list
        if (addToast) addToast({ type: 'project_update', text: 'Department created successfully' });
      } else {
        const errorData = await response.json();
        if (addToast) addToast({ type: 'default', text: errorData.message || 'Failed to create department' });
      }
    } catch (error) {
      console.error('Failed to create department:', error);
      if (addToast) addToast({ type: 'default', text: 'Failed to create department' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationTitle.trim() || !notificationMessage.trim() || !selectedDepartment) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/DepartmentNotifications/${encodeURIComponent(selectedDepartment.name)}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: notificationTitle, message: notificationMessage })
      });

      if (response.ok) {
        if (addToast) addToast({ type: 'project_update', text: 'Notification sent successfully' });
        setNotificationTitle('');
        setNotificationMessage('');
        fetchAnnouncements(selectedDepartment.name);
      } else {
        if (addToast) addToast({ type: 'default', text: 'Failed to send notification' });
      }
    } catch (error) {
      console.error(error);
      if (addToast) addToast({ type: 'default', text: 'Failed to send notification' });
    } finally {
      setIsSending(false);
    }
  };

  if (selectedDepartment) {
    return (
      <div className="sad-container">
        <div className="sad-header">
          <div className="sad-title">
            <h2>{selectedDepartment.name} Department</h2>
            <p>Manage personnel and broadcast notifications</p>
          </div>
          <div className="sad-actions">
            <button className="sad-btn-cancel" onClick={() => setSelectedDepartment(null)}>
              Back to Departments
            </button>
          </div>
        </div>

        <div className="sad-grid">
          {/* Personnel List */}
          <div className="sad-card" style={{ gridColumn: 'span 1' }}>
            <div className="sad-card-header">
              <div className="sad-dept-name">Personnel</div>
              <div className="sad-dept-count">{selectedDepartment.users?.length || 0} Members</div>
            </div>
            <div className="sad-users-list">
              {selectedDepartment.users && selectedDepartment.users.length > 0 ? (
                selectedDepartment.users.map((user) => (
                  <div key={user.id} className="sad-user-item">
                    <img src={user.avatar} alt={user.name} className="sad-user-avatar" />
                    <div className="sad-user-info">
                      <span className="sad-user-name">{user.name}</span>
                      <span className="sad-user-role">{user.designation || 'No designation'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="sad-no-users">No personnel assigned to this department yet.</div>
              )}
            </div>
          </div>

          {/* Send Notification Form */}
          <div className="sad-card" style={{ gridColumn: 'span 1' }}>
            <div className="sad-card-header">
              <div className="sad-dept-name">Broadcast Notification</div>
            </div>
            <form onSubmit={handleSendNotification}>
              <div className="sad-input-group">
                <label>Notification Title</label>
                <input 
                  type="text" 
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="e.g. Mandatory Team Meeting"
                  required
                />
              </div>
              <div className="sad-input-group">
                <label>Message</label>
                <textarea 
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Type your message here..."
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--sa-border)', borderRadius: '8px', color: 'white', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="submit" className="sad-btn-primary" disabled={isSending}>
                  {isSending ? 'Sending...' : 'Send to Department'}
                </button>
              </div>
            </form>
          </div>

          {/* Announcement History */}
          <div className="sad-card" style={{ gridColumn: 'span 2', marginTop: '20px' }}>
            <div className="sad-card-header">
              <div className="sad-dept-name">Recent Announcements</div>
            </div>
            <div className="sad-users-list" style={{ padding: '20px' }}>
              {announcements.length > 0 ? (
                announcements.map((ann) => (
                  <div key={ann.id} style={{ marginBottom: '16px', padding: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--sa-border)', borderRadius: '8px' }}>
                    {editingAnnouncement && editingAnnouncement.id === ann.id ? (
                      <form onSubmit={submitEditAnnouncement}>
                        <input 
                          type="text" 
                          value={editingAnnouncement.title}
                          onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})}
                          style={{ width: '100%', marginBottom: '8px', padding: '8px', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          required
                        />
                        <textarea 
                          value={editingAnnouncement.message}
                          onChange={(e) => setEditingAnnouncement({...editingAnnouncement, message: e.target.value})}
                          style={{ width: '100%', marginBottom: '8px', padding: '8px', background: 'var(--bg-secondary)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', minHeight: '80px', resize: 'vertical' }}
                          required
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => setEditingAnnouncement(null)} className="sad-btn-cancel" style={{ padding: '4px 12px' }}>Cancel</button>
                          <button type="submit" className="sad-btn-primary" style={{ padding: '4px 12px' }}>Save</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{ann.title}</h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(ann.createdAt).toLocaleDateString()} {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setEditingAnnouncement(ann)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}>Edit</button>
                            <button onClick={() => handleDeleteAnnouncement(ann.id)} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '0.9rem' }}>Delete</button>
                          </div>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{ann.message}</p>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="sad-no-users" style={{ border: 'none' }}>No announcements have been made to this department.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sad-container">
      <div className="sad-header">
        <div className="sad-title">
          <h2>Departments</h2>
          <p>Manage organizational departments and view assigned personnel</p>
        </div>
        <div className="sad-actions">
          <button className="sad-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Create Department
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--sa-muted)', textAlign: 'center', marginTop: '40px' }}>Loading departments...</div>
      ) : (
        <div className="sad-grid">
          {departments.map((dept) => (
            <div key={dept.id} className="sad-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedDepartment(dept)}>
              <div className="sad-card-header">
                <div className="sad-dept-name">
                  <Building2 size={18} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                  {dept.name}
                </div>
                <div className="sad-dept-count">
                  <Users size={14} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                  {dept.users ? dept.users.length : 0}
                </div>
              </div>
              
              <div className="sad-users-list">
                {dept.users && dept.users.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ display: 'flex', position: 'relative' }}>
                      {dept.users.slice(0, 4).map((user, index) => (
                        <img 
                          key={user.id} 
                          src={user.avatar} 
                          alt={user.name} 
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            border: '2px solid #1a1a1a', 
                            marginLeft: index === 0 ? '0' : '-12px',
                            position: 'relative',
                            zIndex: 10 - index,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} 
                          title={`${user.name} - ${user.designation || 'No designation'}`}
                        />
                      ))}
                      {dept.users.length > 4 && (
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          border: '2px solid #1a1a1a',
                          marginLeft: '-12px',
                          position: 'relative',
                          zIndex: 0,
                          backdropFilter: 'blur(4px)'
                        }}>
                          +{dept.users.length - 4}
                        </div>
                      )}
                    </div>
                    <div style={{ marginLeft: '16px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      Click to view {dept.users.length} member{dept.users.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ) : (
                  <div className="sad-no-users" style={{ marginTop: '16px', fontSize: '0.9rem' }}>No personnel assigned yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="sad-modal-overlay">
          <div className="sad-modal">
            <h3>Create New Department</h3>
            <form onSubmit={handleCreateDepartment}>
              <div className="sad-input-group">
                <label>Department Name</label>
                <input 
                  type="text" 
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Finance"
                  autoFocus
                  required
                />
              </div>
              <div className="sad-modal-actions">
                <button 
                  type="button" 
                  className="sad-btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setNewDeptName('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="sad-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDepartments;
