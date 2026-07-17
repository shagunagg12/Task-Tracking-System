import React, { useEffect, useState } from 'react';
import './Preloader.css';

const Preloader = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Fade out the entire preloader slowly
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onFinish();
      }, 1500); // 1.5s fade out
    }, 950); // Start fading out after 0.95s

    return () => {
      clearTimeout(fadeTimer);
    };
  }, [onFinish]);

  return (
    <div className={`preloader-container ${isFadingOut ? 'fade-out' : ''}`}>
      <div className="logo-wrapper">
        <img 
          src="/image/logo.png" 
          alt="MATTS Logo" 
          className="preloader-logo-img" 
        />
      </div>
    </div>
  );
};

export default Preloader;
