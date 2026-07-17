import React, { useState } from 'react';
import avatar from '../assets/chatbot-avatar.png';
import Preloader from './common/Preloader';

const Chatbot = ({ isSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = () => {
    if (!isOpen) {
      setIsLoading(true);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {isLoading && <Preloader onFinish={() => setIsLoading(false)} />}
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: isSidebarOpen ? '320px' : '20px', 
        zIndex: 9999,
        transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {isOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--bg-dark)',
            color: 'var(--text-main)',
            zIndex: 99998,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-main)'
          }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src={avatar} alt="AI" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-green)' }} />
                <span style={{ fontWeight: '600', fontSize: '20px', color: 'var(--text-main)' }}>AI Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '36px', lineHeight: '1' }}>&times;</button>
            </div>
            <div style={{ flex: 1, padding: '60px 40px', overflowY: 'auto', backgroundColor: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '40px', textAlign: 'center' }}>
                Choose your friend according to the task you intend to do today
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', width: '100%', maxWidth: '1000px' }}>
                
                {/* Option 1 */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }} 
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <img src="https://i.pravatar.cc/150?img=11" alt="Developer" style={{ width: '90px', height: '90px', borderRadius: '50%', marginBottom: '20px', objectFit: 'cover', border: '3px solid var(--border-color)' }} />
                  <h3 style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '10px', fontWeight: '600' }}>Code Whisperer</h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>Helps you with complex coding, debugging, and building software architecture.</p>
                </div>
                
                {/* Option 2 */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }} 
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <img src="https://i.pravatar.cc/150?img=32" alt="Designer" style={{ width: '90px', height: '90px', borderRadius: '50%', marginBottom: '20px', objectFit: 'cover', border: '3px solid var(--border-color)' }} />
                  <h3 style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '10px', fontWeight: '600' }}>Creative Muse</h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>Assists with creative UI/UX design, vibrant color palettes, and visual assets.</p>
                </div>
                
                {/* Option 3 */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }} 
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <img src="https://i.pravatar.cc/150?img=68" alt="Analyst" style={{ width: '90px', height: '90px', borderRadius: '50%', marginBottom: '20px', objectFit: 'cover', border: '3px solid var(--border-color)' }} />
                  <h3 style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '10px', fontWeight: '600' }}>Data Master</h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>Analyzes raw data, generates insightful reports, and predicts market trends.</p>
                </div>
                
                {/* Option 4 */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }} 
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <img src="https://i.pravatar.cc/150?img=44" alt="Writer" style={{ width: '90px', height: '90px', borderRadius: '50%', marginBottom: '20px', objectFit: 'cover', border: '3px solid var(--border-color)' }} />
                  <h3 style={{ fontSize: '20px', color: 'var(--text-main)', marginBottom: '10px', fontWeight: '600' }}>Wordsmith</h3>
                  <p style={{ fontSize: '15px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5' }}>Writes compelling copy, excellent documentation, and edits your daily texts.</p>
                </div>

              </div>
            </div>
          </div>
        )}
        <button 
          onClick={handleToggle}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundImage: `url(${avatar})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '3px solid #fff',
          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          padding: 0,
          outline: 'none',
          float: 'right',
          transition: 'transform 0.2s ease-in-out',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Chat with AI"
        />
      </div>
    </>
  );
};

export default Chatbot;
