import React, { useState, useEffect, useRef } from 'react';
import './ProfileSettings.css';

export default function ProfileSettings() {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    designation: '',
    department: '',
    location: '',
    bio: '',
    profilePictureUrl: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const [isHovering, setIsHovering] = useState(false);
  const [departments, setDepartments] = useState([
    "Engineering", "Marketing", "Sales", "Human Resources", "Product"
  ]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch user profile
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setProfile({
            fullName: data.fullName || '',
            email: data.email || '',
            designation: data.designation || '',
            department: data.department || '',
            location: data.location || '',
            bio: data.bio || '',
            profilePictureUrl: data.profilePictureUrl || ''
          });
        }

        // Fetch departments
        const deptResponse = await fetch(`${import.meta.env.VITE_API_URL}/departments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData.map(d => d.name));
        }
      } catch (err) {
        setError("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/profile/picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, profilePictureUrl: data.url }));
        localStorage.setItem('profilePic', data.url);
        
        // Dispatch an event to update the sidebar instantly without reload
        window.dispatchEvent(new Event('profilePicUpdated'));
        
        setMessage("Profile picture updated successfully!");
      } else {
        const errData = await res.text();
        setError(`Failed to upload image: ${errData}`);
      }
    } catch (err) {
      setError("Failed to upload image. Please check your connection.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });
      
      if (res.ok) {
        if (profile.fullName) localStorage.setItem('userName', profile.fullName);
        window.dispatchEvent(new Event('profileUpdated'));
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
      
      <div className="profile-settings-avatar-container">
        <img 
          src={profile.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=random&size=128`} 
          alt="Profile" 
          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} 
        />
        <div>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            style={{ display: 'none' }} 
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: 'var(--bg-card)', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '6px', 
              cursor: uploadingImage ? 'not-allowed' : 'pointer',
              fontWeight: '500'
            }}
          >
            {uploadingImage ? 'Uploading...' : 'Change Picture'}
          </button>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>JPG, GIF or PNG. Max size of 800K</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-settings-form">
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
          <select 
            name="designation"
            value={profile.designation}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }}
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

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ marginBottom: '8px', fontWeight: '500', color: 'var(--text-muted)' }}>Department</label>
          <select 
            name="department"
            value={profile.department}
            onChange={handleChange}
            style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'white', outline: 'none' }}
          >
            <option value="">Select Department...</option>
            {departments.map((dept, idx) => (
              <option key={idx} value={dept}>{dept}</option>
            ))}
          </select>
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
