import React, { useState, useEffect } from 'react';
import { Save, Bell, Lock, Monitor, Globe, Shield, User, Palette, Users, ShieldAlert } from 'lucide-react';
import './SuperAdminSettings.css';

const SuperAdminSettings = () => {
  const [activeTab, setActiveTab] = useState('superadmins');

  const [superAdmins, setSuperAdmins] = useState([]);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, user: null, action: 'promote' });
  const [toastMessage, setToastMessage] = useState(null);

  const [isSuperAdminSession, setIsSuperAdminSession] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [employees, setEmployees] = useState([]);

  const handleSuperAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api'));
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCreds)
      });
      const data = await res.json();
      if (res.ok && data.user && data.user.isSuperAdmin) {
        setIsSuperAdminSession(true);
        setLoginCreds({ email: '', password: '' });
        fetchEmployees();
      } else {
        setLoginError('Invalid credentials or not a Super Admin.');
      }
    } catch (err) {
      setLoginError('Network error.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/AdminUsers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) { console.error(e); }
  };

  const requestPromoteEmployee = (user) => {
    setConfirmModal({ isOpen: true, user, action: 'promote' });
  };

  const requestDemoteEmployee = (user) => {
    setConfirmModal({ isOpen: true, user, action: 'demote' });
  };

  const showToast = (message, type) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const executeAction = async () => {
    const { user, action } = confirmModal;
    if (!user) return;
    setConfirmModal({ isOpen: false, user: null, action: 'promote' });
    
    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'promote' 
        ? `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/AdminUsers/${user.id}/promote`
        : `${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')}/AdminUsers/${user.id}/demote`;
        
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const successMsg = action === 'promote' ? `${user.fullName} promoted to Admin!` : `${user.fullName} demoted to Employee!`;
        showToast(successMsg, 'success');
        fetchEmployees();
      } else {
        const data = await res.json();
        showToast(data.message || `Failed to ${action}`, 'error');
      }
    } catch (e) {
      showToast(`Error trying to ${action} user`, 'error');
    }
  };

  const fetchSuperAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/superadmins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSuperAdmins(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeTab === 'superadmins') {
      fetchSuperAdmins();
    }
  }, [activeTab]);





  return (
    <div className="sa-dashboard">
      <header className="sa-dash-header">
        <div>
          <h1 className="sa-dash-title">Platform Settings</h1>
          <p className="sa-dash-subtitle">Manage Super Admins and capabilities.</p>
        </div>
      </header>

      <div className="sa-settings-layout">
        <aside className="sa-settings-sidebar">
          <nav className="sa-settings-nav">
            <button 
              className={`sa-settings-tab ${activeTab === 'superadmins' ? 'active' : ''}`}
              onClick={() => setActiveTab('superadmins')}
            >
              <Users size={18} />
              Super Admins
            </button>
          </nav>
        </aside>

        <main className="sa-settings-content">
          <div className="sa-settings-card fade-in">

            {activeTab === 'superadmins' && (
              <>
                <div className="sa-card-header">
                  <h2>Super Admins Management</h2>
                  <p>Authenticate as a Super Admin to unlock advanced capabilities.</p>
                </div>
                
                {!isSuperAdminSession ? (
                  <form className="sa-superadmin-form" onSubmit={handleSuperAdminLogin}>
                    <h3>Sign In as Super Admin</h3>
                    {loginError && <div className="sa-alert error">{loginError}</div>}
                    
                    <div className="sa-form-group">
                      <label>Email Address</label>
                      <div className="sa-input-wrapper">
                        <Globe size={18} className="sa-input-icon" />
                        <input 
                          type="email" 
                          required 
                          value={loginCreds.email} 
                          onChange={(e) => setLoginCreds({...loginCreds, email: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="sa-form-group">
                      <label>Password</label>
                      <div className="sa-input-wrapper">
                        <Lock size={18} className="sa-input-icon" />
                        <input 
                          type="password" 
                          required 
                          value={loginCreds.password} 
                          onChange={(e) => setLoginCreds({...loginCreds, password: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <button type="submit" className="sa-btn-primary" disabled={isLoggingIn}>
                      {isLoggingIn ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <div className="sa-superadmin-unlocked">
                    <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '24px', color: '#10b981', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldAlert size={20} /> Super Admin Capabilities Unlocked
                    </div>
                    
                    <div className="sa-superadmin-list">
                      <h3>Employee Promotion Management</h3>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '14px' }}>Promote standard employees to full Admins.</p>
                      <table className="sa-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map(user => (
                            <tr key={user.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <img 
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`} 
                                    alt={user.fullName} 
                                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                                  />
                                  {user.fullName}
                                </div>
                              </td>
                              <td>{user.email}</td>
                              <td>{user.role}</td>
                              <td>
                                {user.role !== 'Admin' ? (
                                  <button 
                                    className="sa-btn-primary" 
                                    style={{ background: '#10b981', padding: '6px 12px', fontSize: '13px' }}
                                    onClick={() => requestPromoteEmployee(user)}
                                  >
                                    Promote to Admin
                                  </button>
                                ) : (
                                  <button 
                                    className="sa-btn-outline" 
                                    style={{ padding: '6px 12px', fontSize: '13px', borderColor: '#ef4444', color: '#ef4444' }}
                                    onClick={() => requestDemoteEmployee(user)}
                                  >
                                    Remove Admin
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {employees.length === 0 && (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>No employees found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="sa-divider" style={{ margin: '32px 0' }}></div>

                <div className="sa-superadmin-list">
                  <h3>Existing Super Admins</h3>
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {superAdmins.map(admin => (
                        <tr key={admin.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img 
                                src={admin.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.fullName)}&background=random`} 
                                alt={admin.fullName} 
                                style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                              />
                              {admin.fullName}
                            </div>
                          </td>
                          <td>{admin.email}</td>
                        </tr>
                      ))}
                      {superAdmins.length === 0 && (
                        <tr><td colSpan="2" style={{ textAlign: 'center' }}>No super admins found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {confirmModal.isOpen && (
        <div className="sa-custom-modal-overlay">
          <div className="sa-custom-modal">
            <h3>{confirmModal.action === 'promote' ? 'Promote to Admin?' : 'Demote from Admin?'}</h3>
            <p>
              Are you sure you want to {confirmModal.action === 'promote' ? 'promote' : 'demote'} <strong>{confirmModal.user?.fullName}</strong> 
              {confirmModal.action === 'promote' ? ' to Admin?' : ' back to an Employee?'}
            </p>
            <div className="sa-custom-modal-actions">
              <button className="sa-btn-outline" onClick={() => setConfirmModal({ isOpen: false, user: null, action: 'promote' })}>Cancel</button>
              <button 
                className="sa-btn-primary" 
                style={{ background: confirmModal.action === 'promote' ? '#10b981' : '#ef4444' }} 
                onClick={executeAction}
              >
                {confirmModal.action === 'promote' ? 'Yes, Promote' : 'Yes, Demote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`sa-custom-toast ${toastMessage.type}`}>
          {toastMessage.message}
        </div>
      )}
    </div>
  );
};

export default SuperAdminSettings;
