import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Preloader from './common/Preloader';

const CustomGoogleLoginButton = ({ onSuccess, onError }) => {
  const login = useGoogleLogin({
    onSuccess: tokenResponse => onSuccess(tokenResponse.access_token),
    onError: onError
  });

  return (
    <button
      onClick={() => login()}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color)',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        <path fill="none" d="M0 0h48v48H0z"/>
      </svg>
    </button>
  );
};

const CustomGithubLoginButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: '1px solid var(--border-color)',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginLeft: '15px'
      }}
      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <svg height="22" width="22" viewBox="0 0 16 16" version="1.1" aria-hidden="true">
        <path fill="var(--text-main)" d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
      </svg>
    </button>
  );
};

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleGithubLogin(code);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const initiateGithubLogin = () => {
    const clientId = 'Ov23li3e1HH72JlSYEuv';
    // Let GitHub use the default callback URL configured in the OAuth App settings
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
  };

  const handleGithubLogin = async (code) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL}`;
    const endpoint = `${API_URL}/auth/github-login`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, isRegistering })
      });
      
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.message || 'GitHub sign-in failed.';
        setError(errorMsg);
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem('token', data.token);
      if (data.user && data.user.isAdmin) {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }
      if (data.user && data.user.isSuperAdmin) {
        localStorage.setItem('isSuperAdmin', 'true');
      } else {
        localStorage.removeItem('isSuperAdmin');
      }
      localStorage.removeItem('profilePic');
      
      // Delay to let preloader play out
      setTimeout(() => {
        if (onLogin) onLogin(data.user);
      }, 500);
      
    } catch (err) {
      setError('Failed to connect to the server for GitHub login.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL}`;
    const endpoint = `${API_URL}/auth/google-login`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential, isRegistering })
      });
      
      const data = await response.json();
      if (!response.ok) {
        const errorMsg = data.message || 'Google sign-in failed.';
        setError(errorMsg);
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem('token', data.token);
      if (data.user && data.user.isAdmin) {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.removeItem('isAdmin');
      }
      if (data.user && data.user.isSuperAdmin) {
        localStorage.setItem('isSuperAdmin', 'true');
      } else {
        localStorage.removeItem('isSuperAdmin');
      }
      localStorage.removeItem('profilePic');
      
      setTimeout(() => {
        if (onLogin) onLogin(data.user);
      }, 500);
      
    } catch (err) {
      setError('Failed to connect to the server.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL}`;
    const endpoint = isRegistering ? `${API_URL}/auth/register` : `${API_URL}/auth/login`;
    const bodyData = isRegistering 
      ? { fullName, email, password } 
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'An error occurred.');
        setIsLoading(false);
        return;
      }

      if (isRegistering) {
        setSuccess('Registration successful! You can now sign in.');
        setIsRegistering(false);
        setPassword('');
        setIsLoading(false);
      } else {
        localStorage.setItem('token', data.token);
        if (data.user && data.user.isAdmin) {
          localStorage.setItem('isAdmin', 'true');
        } else {
          localStorage.removeItem('isAdmin');
        }
        if (data.user && data.user.isSuperAdmin) {
          localStorage.setItem('isSuperAdmin', 'true');
        } else {
          localStorage.removeItem('isSuperAdmin');
        }
        localStorage.removeItem('profilePic');
        
        setTimeout(() => {
          if (onLogin) onLogin(data.user);
        }, 500);
      }
    } catch (err) {
      setError('Failed to connect to the server.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Preloader onFinish={() => {}} />;
  }

  return (
    <div className="login-container" style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', fontFamily: 'var(--font-main)' }}>
      <div className="login-video-section" style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRight: '1px solid var(--border-color)' }}>
        <div className="login-mobile-logo" style={{ padding: '20px', display: 'none', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
          <img src="/image/logo.png" alt="MATTS Logo" style={{ maxWidth: '150px', height: 'auto', filter: 'brightness(0) invert(1)' }} />
        </div>
        <video 
          key={isRegistering ? 'register' : 'login'}
          src="/image/login_page.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      </div>
      
      <div className="login-form-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-main)' }}>
            {isRegistering ? 'Sign Up' : 'Sign In'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
            {isRegistering ? 'Please fill in your details to create an account.' : 'Please enter your details to continue.'}
          </p>
          
          {error && <div style={{ color: '#ff6b6b', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(255, 107, 107, 0.1)', borderRadius: '5px' }}>{error}</div>}
          {success && <div style={{ color: '#51cf66', marginBottom: '15px', padding: '10px', backgroundColor: 'rgba(81, 207, 102, 0.1)', borderRadius: '5px' }}>{success}</div>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isRegistering && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)' }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ 
                    width: '100%', padding: '12px 16px', 
                    backgroundColor: 'var(--bg-dark)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    color: 'var(--text-main)',
                    outline: 'none', boxSizing: 'border-box'
                  }} 
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)' }}>Email Address</label>
              <input 
                type="email" 
                placeholder="you@example.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 16px', 
                  backgroundColor: 'var(--bg-dark)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  color: 'var(--text-main)',
                  outline: 'none', boxSizing: 'border-box'
                }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)' }}>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: '100%', padding: '12px 16px', 
                  backgroundColor: 'var(--bg-dark)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px', 
                  color: 'var(--text-main)',
                  outline: 'none', boxSizing: 'border-box'
                }} 
              />
            </div>
            
            <button 
              type="submit" 
              style={{ 
                marginTop: '10px', padding: '14px', 
                backgroundColor: 'var(--accent-green)', 
                color: '#111', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px', 
                fontWeight: '600', 
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2ab76b'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'var(--accent-green)'}
            >
              {isRegistering ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <CustomGoogleLoginButton 
              onSuccess={(token) => handleGoogleLogin({ credential: token })} 
              onError={() => setError('Google sign-in failed.')}
            />
            <CustomGithubLoginButton onClick={initiateGithubLogin} />
          </div>
          
          <p style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {isRegistering ? "Already have an account? " : "Don't have an account? "}
            <span 
              style={{ color: 'var(--accent-green)', cursor: 'pointer' }}
              onClick={() => { setIsRegistering(!isRegistering); setError(null); setSuccess(null); }}
            >
              {isRegistering ? "Sign in" : "Sign up"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
