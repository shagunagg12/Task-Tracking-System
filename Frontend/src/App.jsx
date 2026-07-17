import React, { useState } from 'react';
import DashboardLayout from './features/dashboard/DashboardLayout';
import Preloader from './components/common/Preloader';
import './styles/index.css';

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && <Preloader onFinish={() => setLoading(false)} />}
      <DashboardLayout />
    </>
  );
}

export default App;
