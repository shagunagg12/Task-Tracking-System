import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, FileText, X, Activity, Briefcase, CheckCircle, Clock } from 'lucide-react';
import '../dashboard/Report.css';
import './SuperAdminReports.css';

// Reusable PieChart Component for individual user reports
const PieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div style={{color:'gray', fontSize:'0.85rem', textAlign:'center', marginTop:'40px'}}>No data</div>;
  let accumulatedAngle = 0;

  return (
    <svg width="100%" height="100%" viewBox="-100 -100 200 200" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
      {data.map((item, index) => {
        if (item.value === 0) return null;
        const percentage = item.value / total;
        const angle = percentage * 360;
        
        const startAngle = accumulatedAngle;
        const endAngle = accumulatedAngle + angle;
        accumulatedAngle = endAngle;

        const radStart = (startAngle * Math.PI) / 180;
        const radEnd = (endAngle * Math.PI) / 180;

        const r = 90;
        const x1 = r * Math.cos(radStart);
        const y1 = r * Math.sin(radStart);
        const x2 = r * Math.cos(radEnd);
        const y2 = r * Math.sin(radEnd);

        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = `
          M 0 0
          L ${x1} ${y1}
          A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}
          Z
        `;

        return (
          <path
            key={index}
            d={pathData}
            fill={item.color}
            stroke="var(--sa-card)"
            strokeWidth="2.5"
            style={{ transition: 'all 0.3s' }}
          />
        );
      })}
    </svg>
  );
};

const SuperAdminReports = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  
  // Drawer state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  
  // Gauge animation inside drawer
  const [needleAngle, setNeedleAngle] = useState(-90);
  const [gaugeOffset, setGaugeOffset] = useState(283);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      const response = await fetch('http://localhost:5024/api/AdminReports/overview');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.userReports || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin reports', error);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All', ...new Set(users.map(u => u.department))];

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'All' || u.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const openUserReport = (user) => {
    setSelectedUser(user);
    setShowDrawer(true);
    // Reset gauge animation for new user
    setNeedleAngle(-90);
    setGaugeOffset(283);
    
    // Calculate efficiency for the user
    const eff = user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0;
    setTimeout(() => {
      setNeedleAngle(((eff / 100) * 180) - 90);
      setGaugeOffset(283 - (283 * (eff / 100)));
    }, 200);
  };

  const exportAllToCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Department', 'Total Projects', 'Total Tasks', 'Completed', 'In Progress', 'Efficiency (%)'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => {
        const eff = u.totalTasks > 0 ? Math.round((u.completedTasks / u.totalTasks) * 100) : 0;
        return `${u.id},"${u.name}","${u.email}","${u.department}",${u.totalProjects},${u.totalTasks},${u.completedTasks},${u.inProgressTasks},${eff}`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `org_reports_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerPrintDrawer = (user) => {
    // A real implementation would open a print layout specifically for this user
    alert(`Downloading PDF report for ${user.name}...`);
  };

  return (
    <div className="sau-container">
      {/* Header Section */}
      <div className="sau-header">
        <div>
          <h1 className="sau-title">Reports Control Center</h1>
          <p className="sau-subtitle">View, manage, and export detailed performance reports for every employee.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="sap-btn-primary" onClick={exportAllToCSV}>
            <Download size={18} /> Bulk Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="sau-controls">
        <div className="sau-search">
          <Search size={18} className="sau-search-icon" />
          <input 
            type="text" 
            placeholder="Search employee reports..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="sau-filters">
          <select className="sau-select" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
            {departments.map(dept => <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>)}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="sau-table-container">
        {loading ? (
           <div className="sau-loading">Loading reports data...</div>
        ) : (
          <table className="sau-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Projects</th>
                <th>Tasks (Done / Total)</th>
                <th>Efficiency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const efficiency = user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0;
                
                return (
                  <tr key={user.id} className="sau-row-clickable" onClick={() => openUserReport(user)}>
                    <td>
                      <div className="sau-user-cell">
                        <img src={user.avatar} alt={user.name} className="sau-avatar" />
                        <div>
                          <div className="sau-name">{user.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--sa-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="sau-status-badge active">{user.department}</span></td>
                    <td><strong>{user.totalProjects}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{user.completedTasks}</span>
                         <span style={{ color: 'var(--sa-muted)' }}>/ {user.totalTasks}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                           <div style={{ width: `${efficiency}%`, height: '100%', background: efficiency > 70 ? 'var(--accent-green)' : efficiency > 30 ? '#fbbf24' : '#ef4444' }} />
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>{efficiency}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="sau-actions-cell">
                        <button className="sau-action-btn" onClick={(e) => { e.stopPropagation(); openUserReport(user); }} title="View Detailed Report">
                          <FileText size={16} />
                        </button>
                        <button className="sau-action-btn" onClick={(e) => { e.stopPropagation(); triggerPrintDrawer(user); }} title="Download PDF">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="sau-empty-state">No employee reports found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* INDIVIDUAL USER REPORT DRAWER */}
      <AnimatePresence>
        {showDrawer && selectedUser && (
          <>
            <motion.div className="sau-drawer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDrawer(false)} style={{ zIndex: 2000 }} />
            <motion.div className="sau-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ width: '500px', zIndex: 2001 }}>
              <div className="sau-drawer-header">
                <h2>{selectedUser.name}'s Report</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <button className="sap-btn-icon" onClick={() => triggerPrintDrawer(selectedUser)}><Download size={18} /></button>
                   <button className="sap-btn-icon" onClick={() => setShowDrawer(false)}><X size={20} /></button>
                </div>
              </div>
              <div className="sau-drawer-content" style={{ background: '#09090b' }}>
                
                {/* 1. Efficiency Gauge */}
                <div className="report-card col-12" style={{ marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="report-card-header">
                    <div>
                      <h2 className="report-card-title">🎯 Efficiency Report</h2>
                    </div>
                  </div>
                  <div className="gauge-chart-wrapper" style={{ height: '160px' }}>
                    <svg className="gauge-svg" viewBox="0 0 200 120">
                      <defs>
                        <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#e74c3c" />
                          <stop offset="50%" stopColor="#f1c40f" />
                          <stop offset="100%" stopColor="var(--accent-green)" />
                        </linearGradient>
                      </defs>
                      <path d="M 20,100 A 80,80 0 0,1 180,100" className="gauge-background" />
                      <path d="M 20,100 A 80,80 0 0,1 180,100" className="gauge-fill" style={{ strokeDashoffset: gaugeOffset }} />
                      
                      {Array.from({ length: 11 }).map((_, i) => {
                        const pct = i * 10;
                        const angleDeg = (pct / 100) * 180 - 180;
                        const angleRad = (angleDeg * Math.PI) / 180;
                        const x1 = 100 + 74 * Math.cos(angleRad);
                        const y1 = 100 + 74 * Math.sin(angleRad);
                        const x2 = 100 + 82 * Math.cos(angleRad);
                        const y2 = 100 + 82 * Math.sin(angleRad);
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />;
                      })}

                      <line x1="100" y1="100" x2="100" y2="40" className="gauge-needle" 
                            style={{ transform: `rotate(${needleAngle}deg)` }} 
                            stroke="var(--text-main)" strokeWidth="3.5" strokeLinecap="round" />
                      <circle cx="100" cy="100" r="7" fill="var(--text-main)" />
                    </svg>
                    <div className="gauge-info" style={{ bottom: '-10px' }}>
                      <div className="gauge-value">{selectedUser.totalTasks > 0 ? Math.round((selectedUser.completedTasks / selectedUser.totalTasks) * 100) : 0}%</div>
                    </div>
                  </div>
                </div>

                {/* 2. Tasks Summary */}
                <div className="report-card col-12" style={{ marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="report-card-header">
                     <h2 className="report-card-title">📋 Task Summary</h2>
                  </div>
                  <div className="summary-stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px' }}>
                    
                    <div className="summary-stat-box active" style={{ padding: '12px' }}>
                      <div className="summary-stat-header"><span className="summary-stat-label">Active</span><Activity size={16} /></div>
                      <h3 className="summary-stat-value" style={{ fontSize: '1.5rem' }}>{selectedUser.inProgressTasks + selectedUser.pendingTasks}</h3>
                    </div>
                    
                    <div className="summary-stat-box completed" style={{ padding: '12px' }}>
                      <div className="summary-stat-header"><span className="summary-stat-label">Completed</span><CheckCircle size={16} /></div>
                      <h3 className="summary-stat-value" style={{ fontSize: '1.5rem' }}>{selectedUser.completedTasks}</h3>
                    </div>

                  </div>
                </div>

                {/* 3. Status Distribution */}
                <div className="report-card col-12" style={{ marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="report-card-header">
                     <h2 className="report-card-title">🥧 Status Distribution</h2>
                  </div>
                  <div className="donut-container" style={{ padding: '20px' }}>
                    <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                      <PieChart data={[
                        { label: 'Completed', value: selectedUser.completedTasks, color: 'var(--accent-green)' },
                        { label: 'In Progress', value: selectedUser.inProgressTasks, color: '#38bdf8' },
                        { label: 'Pending', value: selectedUser.pendingTasks, color: '#fbbf24' },
                        { label: 'Blocked', value: selectedUser.blockedTasks, color: '#e74c3c' }
                      ]} />
                    </div>
                    <div className="donut-legend" style={{ flex: 1, paddingLeft: '20px' }}>
                       <div className="legend-row"><span className="legend-dot" style={{backgroundColor: 'var(--accent-green)'}} /><span>Completed</span><span className="legend-val">{selectedUser.completedTasks}</span></div>
                       <div className="legend-row"><span className="legend-dot" style={{backgroundColor: '#38bdf8'}} /><span>In Progress</span><span className="legend-val">{selectedUser.inProgressTasks}</span></div>
                       <div className="legend-row"><span className="legend-dot" style={{backgroundColor: '#fbbf24'}} /><span>Pending</span><span className="legend-val">{selectedUser.pendingTasks}</span></div>
                       <div className="legend-row"><span className="legend-dot" style={{backgroundColor: '#e74c3c'}} /><span>Blocked</span><span className="legend-val">{selectedUser.blockedTasks}</span></div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminReports;
