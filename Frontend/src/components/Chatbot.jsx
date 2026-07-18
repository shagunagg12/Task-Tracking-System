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
  const [videoEnded, setVideoEnded] = useState({ 1: false, 2: false, 3: false, 4: false });

  const handleToggle = () => {
    if (!isOpen) {
      setIsLoading(true);
      setIsOpen(true);
      setVideoEnded({ 1: false, 2: false, 3: false, 4: false }); // Reset state when opening
    } else {
      setIsOpen(false);
    }
  };

  const handleVideoEnd = (id) => {
    setVideoEnded(prev => ({ ...prev, [id]: true }));
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
                <img src={avatar} alt="AI" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-green)' }} />
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
                <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <video src="/image/chatbot/generate_a_video_of_one_animat.mp4" autoPlay muted playsInline onEnded={() => handleVideoEnd(1)} ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                  {videoEnded[1] && (
                    <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(20,20,20,0.95)', border: '2px solid var(--accent-green)', borderRadius: '20px', padding: '12px 16px', boxShadow: '0 0 20px var(--accent-green)', color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center', width: '90%', boxSizing: 'border-box', animation: 'floatAnim 2s ease-in-out infinite', zIndex: 20 }}>
                      <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid var(--accent-green)' }} />
                      "I'm Code Whisperer! Pick me for coding & architecture!"
                    </div>
                  )}
                </div>
                
                {/* Option 2 */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <video src="/image/chatbot/The_video_frames_in_the_grid_a.mp4" autoPlay muted playsInline onEnded={() => handleVideoEnd(2)} ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                  {videoEnded[2] && (
                    <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(20,20,20,0.95)', border: '2px solid var(--accent-green)', borderRadius: '20px', padding: '12px 16px', boxShadow: '0 0 20px var(--accent-green)', color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center', width: '90%', boxSizing: 'border-box', animation: 'floatAnim 2s ease-in-out infinite', zIndex: 20 }}>
                      <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid var(--accent-green)' }} />
                      "I'm Creative Muse! Pick me for UI/UX & design!"
                    </div>
                  )}
                </div>
                
                {/* Option 3 */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <video src="/src/assets/video_jump.mp4" autoPlay muted playsInline onEnded={() => handleVideoEnd(3)} ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                  {videoEnded[3] && (
                    <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(20,20,20,0.95)', border: '2px solid var(--accent-green)', borderRadius: '20px', padding: '12px 16px', boxShadow: '0 0 20px var(--accent-green)', color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center', width: '90%', boxSizing: 'border-box', animation: 'floatAnim 2s ease-in-out infinite', zIndex: 20 }}>
                      <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid var(--accent-green)' }} />
                      "I'm Data Master! Pick me for data analysis & trends!"
                    </div>
                  )}
                </div>
                
                {/* Option 4 */}
                <div style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-color)', borderRadius: '16px', height: '350px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }} 
                     onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)'; }}
                     onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <video src="/src/assets/video_sprint.mp4" autoPlay muted playsInline onEnded={() => handleVideoEnd(4)} ref={(el) => { if (el) el.playbackRate = 1.5; }} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
                  {videoEnded[4] && (
                    <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(20,20,20,0.95)', border: '2px solid var(--accent-green)', borderRadius: '20px', padding: '12px 16px', boxShadow: '0 0 20px var(--accent-green)', color: '#fff', fontSize: '14px', fontWeight: '600', textAlign: 'center', width: '90%', boxSizing: 'border-box', animation: 'floatAnim 2s ease-in-out infinite', zIndex: 20 }}>
                      <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid var(--accent-green)' }} />
                      "I'm Wordsmith! Pick me for copywriting & editing!"
                    </div>
                  )}
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
