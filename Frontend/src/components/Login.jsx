import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', fontFamily: 'var(--font-main)' }}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRight: '1px solid var(--border-color)' }}>
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
      
      {/* Right side with login form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--text-main)' }}>
            {isRegistering ? 'Sign Up' : 'Sign In'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
            {isRegistering ? 'Please fill in your details to create an account.' : 'Please enter your details to continue.'}
          </p>
          
          <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {isRegistering && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-main)' }}>Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  required
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
          
          <p style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {isRegistering ? "Already have an account? " : "Don't have an account? "}
            <span 
              style={{ color: 'var(--accent-green)', cursor: 'pointer' }}
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Sign in" : "Sign up"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
