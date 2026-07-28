import React, { useState } from 'react';
import DashboardLayout from './features/dashboard/DashboardLayout';
import SuperAdminLayout from './features/admin/SuperAdminLayout';
import Preloader from './components/common/Preloader';
import Login from './components/Login';
import './styles/index.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check if user is already logged in on page load
    return !!localStorage.getItem('token');
  });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  const [showAdminPanel, setShowAdminPanel] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true'; // Default to admin panel if they are admin
  });

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    if (user && user.isAdmin) {
      setIsAdmin(true);
      setShowAdminPanel(true);
    }
  };

  return (
    <>
      {loading && <Preloader onFinish={() => setLoading(false)} />}
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        isAdmin && showAdminPanel ? (
          <SuperAdminLayout onSwitchToUser={() => setShowAdminPanel(false)} />
        ) : (
          <DashboardLayout 
            isAdmin={isAdmin} 
            onSwitchToAdmin={() => setShowAdminPanel(true)} 
          />
        )
      )}
    </>
  );
}

export default App;
