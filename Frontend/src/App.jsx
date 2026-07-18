import React, { useState } from 'react';
import DashboardLayout from './features/dashboard/DashboardLayout';
import Preloader from './components/common/Preloader';
import Login from './components/Login';
import './styles/index.css';

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <>
      {loading && <Preloader onFinish={() => setLoading(false)} />}
      {!isAuthenticated ? (
        <Login onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <DashboardLayout />
      )}
    </>
  );
}

export default App;
