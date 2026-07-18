import React, { useState } from 'react';
import avatar from '../assets/chatbot-avatar.png';
import Preloader from './common/Preloader';
import imgSquat from '../assets/male_squat.png';
import imgPunch from '../assets/male_punch.png';
import imgJump from '../assets/male_jump.png';
import imgRun from '../assets/male_run.png';

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
      <style>{`
        @keyframes floatAnim { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulseAnim { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes swayAnim { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
        @keyframes bounceAnim { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>
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
                <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))' }}>
                  <path d="M 50 10 C 22.4 10 0 30 0 55 C 0 69.5 7.8 82.5 20 90 L 15 100 L 32 93.5 C 38 95.3 44 96 50 96 C 77.6 96 100 76 100 55 C 100 30 77.6 10 50 10 Z" fill="var(--accent-green)" />
                  <text x="50" y="66" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="30" fill="#111" textAnchor="middle" letterSpacing="1">DARK</text>
                </svg>
                <span style={{ fontWeight: '600', fontSize: '20px', color: 'var(--text-main)' }}>AI Assistant</span>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '36px', lineHeight: '1' }}>&times;</button>
            </div>
            <div style={{ flex: 1, padding: '60px 40px', overflowY: 'auto', backgroundColor: 'var(--bg-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '80px', textAlign: 'center' }}>
                Choose your friend according to the task you intend to do today
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', width: '100%', maxWidth: '1000px' }}>
                
                {/* Option 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, textAlign: 'center', fontFamily: '"Norwester", sans-serif', color: 'var(--text-main)' }}>
                    <span style={{ fontSize: '48px', fontWeight: 'bold' }}>D</span><span style={{ fontSize: '24px' }}>aksh</span>
                  </h3>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                       onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                       onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <video src="/image/daksh.mp4" autoPlay muted playsInline loop ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                  </div>
                </div>
                
                {/* Option 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, textAlign: 'center', fontFamily: '"Norwester", sans-serif', color: 'var(--text-main)' }}>
                    <span style={{ fontSize: '48px', fontWeight: 'bold' }}>A</span><span style={{ fontSize: '24px' }}>yush</span>
                  </h3>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                       onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                       onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <video src="/image/Ayush%20Badola%20Video.mp4" autoPlay muted playsInline loop ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                  </div>
                </div>
                
                {/* Option 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, textAlign: 'center', fontFamily: '"Norwester", sans-serif', color: 'var(--text-main)' }}>
                    <span style={{ fontSize: '48px', fontWeight: 'bold' }}>R</span><span style={{ fontSize: '24px' }}>achit</span>
                  </h3>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                       onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                       onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <video src="/image/rachit.mp4" autoPlay muted playsInline loop ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                  </div>
                </div>
                
                {/* Option 4 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ margin: 0, textAlign: 'center', fontFamily: '"Norwester", sans-serif', color: 'var(--text-main)' }}>
                    <span style={{ fontSize: '48px', fontWeight: 'bold' }}>K</span><span style={{ fontSize: '24px' }}>artik</span>
                  </h3>
                  <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                       onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                       onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <video src="/image/kartik.mp4" autoPlay muted playsInline loop ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <button 
          onClick={handleToggle}
          style={{
            width: '100px',
            height: '100px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            outline: 'none',
            float: 'right',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))',
            animation: 'floatAnim 3s ease-in-out infinite'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.filter = 'drop-shadow(0 12px 30px var(--accent-green))';
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))';
            e.currentTarget.style.animationPlayState = 'running';
          }}
          title="Chat with AI"
        >
          <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M 50 10 C 22.4 10 0 30 0 55 C 0 69.5 7.8 82.5 20 90 L 15 100 L 32 93.5 C 38 95.3 44 96 50 96 C 77.6 96 100 76 100 55 C 100 30 77.6 10 50 10 Z" fill="var(--accent-green)" />
            <text x="50" y="66" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="30" fill="#111" textAnchor="middle" letterSpacing="1">DARK</text>
          </svg>
        </button>
      </div>
    </>
  );
};

export default Chatbot;
