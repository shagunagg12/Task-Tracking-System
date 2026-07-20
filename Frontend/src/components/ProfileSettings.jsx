import React, { useState, useEffect } from 'react';

export default function ProfileSettings() {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    designation: '',
    department: '',
    location: '',
    bio: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5024/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile({
          fullName: data.fullName || '',
          email: data.email || '',
          designation: data.designation || '',
          department: data.department || '',
          location: data.location || '',
          bio: data.bio || ''
        });
      } else {
        setError("Could not load profile data.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5024/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      
      if (res.ok) {
        setMessage("Profile updated successfully!");
      } else {
        setError("Failed to update profile.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-main)', padding: '20px' }}>Loading profile...</div>;
  }

  return (
    <div style={{ padding: '20px', color: 'var(--text-main)' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '24px' }}>Profile Settings</h2>
      
      {message && <div style={{ backgroundColor: 'rgba(81, 207, 102, 0.1)', color: '#51cf66', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{message}</div>}
      {error && <div style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '8px', fontWeight: '500', color: 'var(--text-muted)' }}>Full Name</label>
          <input 
            type="text" 
            name="fullName"
            value={profile.fullName}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white' }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '8px', fontWeight: '500', color: 'var(--text-muted)' }}>Email Address</label>
          <input 
            type="email" 
            name="email"
            value={profile.email}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '8px', fontWeight: '500', color: 'var(--text-muted)' }}>Designation</label>
          <input 
            type="text" 
            name="designation"
            placeholder="e.g. Senior Developer"
            value={profile.designation}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '8px', fontWeight: '500', color: 'var(--text-muted)' }}>Department</label>
          <input 
            type="text" 
            name="department"
            placeholder="e.g. Engineering"
            value={profile.department}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <label style={{ marginBottom: '8px', fontWeight: '500', color: 'var(--text-muted)' }}>Location</label>
          <input 
            type="text" 
            name="location"
            placeholder="e.g. New York, USA"
            value={profile.location}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
          <label style={{ marginBottom: '8px', fontWeight: '500', color: 'var(--text-muted)' }}>Bio</label>
          <textarea 
            name="bio"
            rows="4"
            placeholder="Tell us about yourself..."
            value={profile.bio}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: 'var(--accent-green)', 
              color: '#111', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
