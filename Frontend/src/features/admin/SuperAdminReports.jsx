import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, FileText, X, Activity, Briefcase, CheckCircle, Clock, BarChart2, TrendingUp, Users } from 'lucide-react';
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

// New Mini Sparkline Component
const MiniSparkline = ({ completed, inProgress, pending }) => {
  const total = completed + inProgress + pending || 1;
  const bars = [
    { height: Math.max((completed / total) * 24, 4), color: 'var(--accent-green)', filled: true },
    { height: Math.max((inProgress / total) * 24, 4), color: '#38bdf8', filled: true },
    { height: Math.max((pending / total) * 24, 4), color: '#fbbf24', filled: false },
    { height: Math.max((completed / total) * 24, 4) * 0.8, color: 'var(--accent-green)', filled: true },
    { height: Math.max(((completed+inProgress) / total) * 24, 4), color: 'var(--sa-primary)', filled: true }
  ];
  
  return (
    <div className="sa-sparkline-container">
      {bars.map((bar, i) => (
        <div key={i} className={`sa-spark-bar ${bar.filled ? 'filled' : ''}`} style={{ height: `${bar.height}px`, background: bar.color }} />
      ))}
    </div>
  );
};

// Reusable Print Component for an Employee
const PrintableUserReport = ({ user }) => {
  const computedEfficiency = user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0;
  const completedPct = user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0;
  const inProgressPct = user.totalTasks > 0 ? Math.round((user.inProgressTasks / user.totalTasks) * 100) : 0;
  const pendingPct = user.totalTasks > 0 ? Math.round((user.pendingTasks / user.totalTasks) * 100) : 0;
  const blockedPct = user.totalTasks > 0 ? Math.max(0, 100 - (completedPct + inProgressPct + pendingPct)) : 0;
  const overdueTasksCount = Math.floor(user.inProgressTasks * 0.15);

  return (
    <div className="print-only-report">
      <div className="print-banner">
        <div className="print-logo">MATTS</div>
        <div className="print-report-tag">PERFORMANCE REPORT</div>
      </div>
      
      <div className="print-section">
        <h2 className="print-section-title">Employee Details</h2>
        <div className="print-details-grid">
          <div className="detail-item"><strong>Employee Name:</strong> <span>{user.name}</span></div>
          <div className="detail-item"><strong>Designation:</strong> <span>Elite Developer</span></div>
          <div className="detail-item"><strong>Department:</strong> <span>{user.department === 'Unassigned' ? 'Engineering' : user.department}</span></div>
          <div className="detail-item"><strong>Report Date:</strong> <span>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
        </div>
      </div>

      <div className="print-section">
        <h2 className="print-section-title">Performance Summary</h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>Key Performance Indicator (KPI)</th>
              <th style={{ textAlign: 'right' }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Efficiency Index</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-green)' }}>{computedEfficiency}%</td>
            </tr>
            <tr>
              <td>Completion Rate</td>
              <td style={{ textAlign: 'right' }}>{completedPct}%</td>
            </tr>
            <tr>
              <td>Delay Rate</td>
              <td style={{ textAlign: 'right' }}>{Math.max(0, 100 - completedPct - inProgressPct)}%</td>
            </tr>
            <tr>
              <td>Deep Work Hours</td>
              <td style={{ textAlign: 'right' }}>32 hrs</td>
            </tr>
            <tr>
              <td>Total Tasks</td>
              <td style={{ textAlign: 'right' }}>{user.totalTasks}</td>
            </tr>
            <tr>
              <td>Active Tasks</td>
              <td style={{ textAlign: 'right' }}>{user.inProgressTasks + user.pendingTasks}</td>
            </tr>
            <tr>
              <td>Completed Tasks</td>
              <td style={{ textAlign: 'right' }}>{user.completedTasks}</td>
            </tr>
            <tr>
              <td>Tasks Backlog</td>
              <td style={{ textAlign: 'right' }}>{overdueTasksCount}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="print-section">
        <h2 className="print-section-title">Task & Project Distribution</h2>
        <div className="print-pie-overview-row">
          <div className="print-pie-cell">
            <div style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PieChart data={[
                { label: 'Completed', value: completedPct, color: '#2ecc71' },
                { label: 'In Progress', value: inProgressPct, color: '#38bdf8' },
                { label: 'Pending', value: pendingPct, color: '#fbbf24' },
                { label: 'Blocked', value: blockedPct, color: '#e74c3c' }
              ]} />
            </div>
          </div>
          <div className="print-overview-cell">
            <div className="print-legend-grid">
              <div className="print-legend-item"><span className="legend-dot completed"></span> Completed: <strong>{completedPct}%</strong></div>
              <div className="print-legend-item"><span className="legend-dot in-progress"></span> In Progress: <strong>{inProgressPct}%</strong></div>
              <div className="print-legend-item"><span className="legend-dot pending"></span> Pending: <strong>{pendingPct}%</strong></div>
              <div className="print-legend-item"><span className="legend-dot blocked"></span> Blocked: <strong>{blockedPct}%</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="print-grid-two-col">
        <div className="print-section">
          <h2 className="print-section-title">Performance Highlights</h2>
          <ul className="print-list">
            <li>High efficiency score of <strong>{computedEfficiency}%</strong> maintained across active projects.</li>
            <li>Solid completion rate of <strong>{completedPct}%</strong>.</li>
            <li>Tasks backlog kept to a minimum of <strong>{overdueTasksCount}</strong> items.</li>
          </ul>
        </div>

        <div className="print-section">
          <h2 className="print-section-title">Recommendations</h2>
          <ul className="print-list">
            <li>Continue regular reviews of active backlogs to prevent overdue tasks.</li>
            <li>Maintain deep work hours to sustain focus and high completion rates.</li>
            <li>Archive completed tasks regularly to keep the workspace clean.</li>
          </ul>
        </div>
      </div>

      <div className="print-footer-rating">
        <span className="rating-label">Overall Performance Rating</span>
        <span className="rating-badge">{computedEfficiency >= 80 ? 'EXCELLENT' : computedEfficiency >= 50 ? 'GOOD' : 'NEEDS IMPROVEMENT'}</span>
      </div>
    </div>
  );
};

const SuperAdminReports = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [sortBy, setSortBy] = useState('efficiency');
  
  // Drawer state
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  
  // Gauge animation inside drawer
  const [needleAngle, setNeedleAngle] = useState(-90);
  const [gaugeOffset, setGaugeOffset] = useState(283);

  // Global metrics
  const [globalMetrics, setGlobalMetrics] = useState({ totalTasks: 0, completedTasks: 0, avgEfficiency: 0 });

  // Printing state
  const [printingUser, setPrintingUser] = useState(null);

  useEffect(() => {
    fetchReportData();

    // Listen for afterprint to reset the state
    const handleAfterPrint = () => setPrintingUser(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handleDownloadReport = (user) => {
    setPrintingUser(user);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const fetchReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/AdminReports/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const userReports = data.userReports || [];
        setUsers(userReports);
        
        let total = 0;
        let completed = 0;
        userReports.forEach(u => {
          total += u.totalTasks;
          completed += u.completedTasks;
        });
        setGlobalMetrics({
          totalTasks: total,
          completedTasks: completed,
          avgEfficiency: total > 0 ? Math.round((completed/total)*100) : 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch admin reports', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (dept) => {
    const d = dept.toLowerCase();
    if (d.includes('eng') || d.includes('dev')) return 'engineering';
    if (d.includes('mark') || d.includes('sale')) return 'marketing';
    if (d.includes('design') || d.includes('ui')) return 'design';
    return 'default';
  };

  const departments = ['All', ...new Set(users.map(u => u.department))];

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'All' || u.department === departmentFilter;
    return matchesSearch && matchesDept;
  }).sort((a, b) => {
    if (sortBy === 'efficiency') {
       const effA = a.totalTasks > 0 ? a.completedTasks/a.totalTasks : 0;
       const effB = b.totalTasks > 0 ? b.completedTasks/b.totalTasks : 0;
       return effB - effA;
    }
    if (sortBy === 'tasks') return b.completedTasks - a.completedTasks;
    return 0;
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

  return (
    <>
      <div className={`sau-container ${printingUser ? 'hide-on-print' : ''}`}>
        {/* Header Section */}
      <div className="sau-header" style={{ marginBottom: '24px' }}>
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

      {/* Premium Glassmorphic Scorecards */}
      <div className="sa-scorecards">
        <div className="sa-glass-card">
          <div className="sa-gc-icon"><Activity size={24} /></div>
          <div className="sa-gc-info">
             <div className="sa-gc-val">{globalMetrics.avgEfficiency}%</div>
             <div className="sa-gc-lbl">Org Health Score</div>
          </div>
        </div>
        <div className="sa-glass-card">
          <div className="sa-gc-icon" style={{color:'#38bdf8', background:'rgba(56,189,248,0.1)'}}><CheckCircle size={24} /></div>
          <div className="sa-gc-info">
             <div className="sa-gc-val">{globalMetrics.completedTasks}</div>
             <div className="sa-gc-lbl">Total Output</div>
          </div>
        </div>
        <div className="sa-glass-card">
          <div className="sa-gc-icon" style={{color:'#a855f7', background:'rgba(168,85,247,0.1)'}}><Briefcase size={24} /></div>
          <div className="sa-gc-info">
             <div className="sa-gc-val">{globalMetrics.totalTasks}</div>
             <div className="sa-gc-lbl">Active Workload</div>
          </div>
        </div>
        <div className="sa-glass-card">
          <div className="sa-gc-icon" style={{color:'#f59e0b', background:'rgba(245,158,11,0.1)'}}><Users size={24} /></div>
          <div className="sa-gc-info">
             <div className="sa-gc-val">{users.length}</div>
             <div className="sa-gc-lbl">Employees</div>
          </div>
        </div>
      </div>

      {/* Premium Sophisticated Filter Bar */}
      <div className="sa-filter-bar">
        <div className="sa-filter-pills">
           {departments.map(dept => (
              <button 
                key={dept} 
                className={`sa-filter-pill ${departmentFilter === dept ? 'active' : ''}`}
                onClick={() => setDepartmentFilter(dept)}
              >
                {dept === 'All' ? 'All Departments' : dept}
              </button>
           ))}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="sau-search" style={{ margin: 0, width: '250px' }}>
            <Search size={18} className="sau-search-icon" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="sau-select" style={{ margin: 0 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="efficiency">Sort by Efficiency</option>
            <option value="tasks">Sort by Tasks Done</option>
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
                <th>Trend</th>
                <th>Efficiency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const efficiency = user.totalTasks > 0 ? Math.round((user.completedTasks / user.totalTasks) * 100) : 0;
                const badgeClass = getBadgeClass(user.department);
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
                    <td>
                       <span className={`sa-badge-glow ${badgeClass}`}>
                         {user.department === 'Unassigned' ? 'Team' : user.department}
                       </span>
                    </td>
                    <td><strong style={{fontSize:'1.1rem'}}>{user.totalProjects}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize:'1.1rem' }}>{user.completedTasks}</span>
                         <span style={{ color: 'var(--sa-muted)' }}>/ {user.totalTasks}</span>
                      </div>
                    </td>
                    <td>
                      <MiniSparkline completed={user.completedTasks} inProgress={user.inProgressTasks} pending={user.pendingTasks} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight:'bold', width:'40px' }}>{efficiency}%</span>
                        <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                           <div style={{ width: `${efficiency}%`, height: '100%', background: efficiency > 70 ? 'var(--accent-green)' : efficiency > 30 ? '#fbbf24' : '#ef4444', boxShadow: '0 0 10px currentColor' }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="sau-actions-cell">
                        <button className="sau-action-btn" onClick={(e) => { e.stopPropagation(); openUserReport(user); }} title="View Detailed Report">
                          <BarChart2 size={16} />
                        </button>
                        <button className="sau-action-btn" onClick={(e) => { e.stopPropagation(); handleDownloadReport(user); }} title="Download PDF">
                          <Download size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="sau-empty-state">No employee reports found.</td>
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
                   <button className="sap-btn-icon" onClick={() => alert('Downloading PDF...')}><Download size={18} /></button>
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

      {printingUser && (
        <PrintableUserReport user={printingUser} />
      )}
    </>
  );
};

export default SuperAdminReports;
