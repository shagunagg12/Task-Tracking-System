import React, { useState } from 'react';
import { Save, Bell, Lock, Monitor, Globe, Shield, User, Palette } from 'lucide-react';
import './SuperAdminSettings.css';

const SuperAdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [settings, setSettings] = useState({
    workspaceName: 'Matts Enterprise',
    supportEmail: 'admin@matts.com',
    timezone: 'UTC',
    emailNotifications: true,
    pushNotifications: false,
    darkMode: true,
    maintenanceMode: false,
    twoFactorAuth: false
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="sa-dashboard">
      <header className="sa-dash-header">
        <div>
          <h1 className="sa-dash-title">Platform Settings</h1>
          <p className="sa-dash-subtitle">Manage your enterprise workspace preferences and security configurations.</p>
        </div>
        <button 
          className="sa-btn-primary" 
          onClick={handleSave}
          disabled={isSaving}
          style={saveSuccess ? { background: '#10b981', color: '#fff' } : {}}
        >
          {isSaving ? (
            'Saving...'
          ) : saveSuccess ? (
            'Saved Successfully!'
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </header>

      <div className="sa-settings-layout">
        <aside className="sa-settings-sidebar">
          <nav className="sa-settings-nav">
            <button 
              className={`sa-settings-tab ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <Globe size={18} />
              General
            </button>
            <button 
              className={`sa-settings-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} />
              Security
            </button>
            <button 
              className={`sa-settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} />
              Notifications
            </button>
            <button 
              className={`sa-settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={18} />
              Appearance
            </button>
          </nav>
        </aside>

        <main className="sa-settings-content">
          <div className="sa-settings-card fade-in">
            {activeTab === 'general' && (
              <>
                <div className="sa-card-header">
                  <h2>General Settings</h2>
                  <p>Basic configuration for your enterprise workspace.</p>
                </div>
                
                <div className="sa-form-group">
                  <label>Workspace Name</label>
                  <div className="sa-input-wrapper">
                    <Monitor size={18} className="sa-input-icon" />
                    <input 
                      type="text" 
                      name="workspaceName" 
                      value={settings.workspaceName} 
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="sa-form-group">
                  <label>Support Email</label>
                  <div className="sa-input-wrapper">
                    <User size={18} className="sa-input-icon" />
                    <input 
                      type="email" 
                      name="supportEmail" 
                      value={settings.supportEmail} 
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="sa-form-group">
                  <label>Default Timezone</label>
                  <select name="timezone" value={settings.timezone} onChange={handleChange} className="sau-select" style={{ width: '100%', padding: '12px 16px' }}>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                    <option value="IST">IST (Indian Standard Time)</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'security' && (
              <>
                <div className="sa-card-header">
                  <h2>Security Configuration</h2>
                  <p>Protect your enterprise data and manage access policies.</p>
                </div>
                
                <div className="sa-toggle-row">
                  <div className="sa-toggle-info">
                    <h3>Two-Factor Authentication (2FA)</h3>
                    <p>Require 2FA for all administrative accounts.</p>
                  </div>
                  <label className="sa-switch">
                    <input type="checkbox" checked={settings.twoFactorAuth} onChange={() => handleToggle('twoFactorAuth')} />
                    <span className="sa-slider"></span>
                  </label>
                </div>

                <div className="sa-divider"></div>

                <div className="sa-form-group">
                  <label>Admin Password Reset</label>
                  <div className="sa-input-wrapper">
                    <Lock size={18} className="sa-input-icon" />
                    <input type="password" placeholder="Enter new master password" />
                  </div>
                  <button className="sa-btn-secondary mt-3">Update Password</button>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <>
                <div className="sa-card-header">
                  <h2>Notification Preferences</h2>
                  <p>Control how and when the system sends alerts.</p>
                </div>
                
                <div className="sa-toggle-row">
                  <div className="sa-toggle-info">
                    <h3>Email Notifications</h3>
                    <p>Receive daily summaries and critical system alerts via email.</p>
                  </div>
                  <label className="sa-switch">
                    <input type="checkbox" checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />
                    <span className="sa-slider"></span>
                  </label>
                </div>

                <div className="sa-toggle-row">
                  <div className="sa-toggle-info">
                    <h3>Push Notifications</h3>
                    <p>Real-time browser notifications for important events.</p>
                  </div>
                  <label className="sa-switch">
                    <input type="checkbox" checked={settings.pushNotifications} onChange={() => handleToggle('pushNotifications')} />
                    <span className="sa-slider"></span>
                  </label>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div className="sa-card-header">
                  <h2>Appearance & Behavior</h2>
                  <p>Customize the look and feel of the admin dashboard.</p>
                </div>
                
                <div className="sa-toggle-row">
                  <div className="sa-toggle-info">
                    <h3>Dark Mode</h3>
                    <p>Use a darker, high-contrast theme across the application.</p>
                  </div>
                  <label className="sa-switch">
                    <input type="checkbox" checked={settings.darkMode} onChange={() => handleToggle('darkMode')} />
                    <span className="sa-slider"></span>
                  </label>
                </div>

                <div className="sa-divider"></div>

                <div className="sa-toggle-row">
                  <div className="sa-toggle-info">
                    <h3>Maintenance Mode</h3>
                    <p className="text-warning">Prevents non-admin users from accessing the system.</p>
                  </div>
                  <label className="sa-switch danger">
                    <input type="checkbox" checked={settings.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} />
                    <span className="sa-slider"></span>
                  </label>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
