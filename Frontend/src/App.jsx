import React, { useState } from 'react';
import DashboardLayout from './features/dashboard/DashboardLayout';
import SuperAdminLayout from './features/admin/SuperAdminLayout';
import Preloader from './components/common/Preloader';
import Login from './components/Login';
import * as signalR from '@microsoft/signalr';
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

  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    if (user && user.isAdmin) {
      setIsAdmin(true);
    }
  };

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    let userId = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    } catch (e) {}

    if (!userId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl((import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5024') + '/adminDashboardHub')
      .withAutomaticReconnect()
      .build();

    connection.on("ForceLogout", (blockedUserId) => {
      if (userId == blockedUserId) {
        localStorage.clear();
        setIsAuthenticated(false);
        setIsAdmin(false);
        setShowAdminPanel(false);
        alert("Your account has been blocked by the administrator.");
      }
    });

    const startPromise = connection.start().catch(e => {
      if (e.name !== 'AbortError' && e.message !== 'The connection was stopped during negotiation.') {
        console.error("SignalR Global App connection error:", e);
      }
    });

    return () => {
      startPromise.then(() => {
        connection.stop();
      });
    };
  }, [isAuthenticated]);

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
