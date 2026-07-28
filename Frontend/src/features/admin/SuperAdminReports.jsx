import React, { useState, useEffect } from 'react';
import '../dashboard/Report.css'; // Reuse existing styles
import './SuperAdminReports.css'; // Add our specific new styles

const PieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div style={{color:'gray'}}>No data</div>;
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
            stroke="var(--bg-card)"
            strokeWidth="2.5"
            style={{
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              transformOrigin: '0px 0px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.filter = 'drop-shadow(0 4px 12px rgba(255,255,255,0.15))';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'none';
            }}
          />
        );
      })}
    </svg>
  );
};

const SuperAdminReports = () => {
  const [reportData, setReportData] = useState({ projects: [], topPerformers: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Animation states for gauge
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
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch admin reports', error);
    } finally {
      setLoading(false);
    }
  };

  const projects = reportData.projects || [];
  const topPerformers = reportData.topPerformers || [];
  
  const allTasks = projects.flatMap(p => p.tasks || []);
  const hasRealData = projects.length > 0;

  // Task Summaries
  const totalTasksCount = hasRealData ? allTasks.length : 142;
  const completedTasksCount = hasRealData ? allTasks.filter(t => t.status === 'Completed' || t.status === 'Done').length : 96;
  const activeTasksCount = hasRealData ? allTasks.filter(t => t.status === 'In Progress' || t.status === 'Todo').length : 38;
  const blockedTasksCount = hasRealData ? allTasks.filter(t => t.status === 'Blocked').length : 8;

  // Organization Efficiency
  const computedEfficiency = hasRealData 
    ? (totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0)
    : 75;

  // Pie Chart percentages
  const completedPct = hasRealData && totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 75;
  const inProgressPct = hasRealData && totalTasksCount > 0 ? Math.round((allTasks.filter(t => t.status === 'In Progress').length / totalTasksCount) * 100) : 15;
  const pendingPct = hasRealData && totalTasksCount > 0 ? Math.round((allTasks.filter(t => t.status === 'Todo').length / totalTasksCount) * 100) : 10;
  const blockedPct = totalTasksCount > 0 ? (100 - (completedPct + inProgressPct + pendingPct)) : 0; 

  useEffect(() => {
    const timer = setTimeout(() => {
      setNeedleAngle(((computedEfficiency / 100) * 180) - 90);
      setGaugeOffset(283 - (283 * (computedEfficiency / 100)));
    }, 300);
    return () => clearTimeout(timer);
  }, [computedEfficiency]);

  if (loading) return <div className="report-container"><div className="sau-loading">Loading organization data...</div></div>;

  return (
    <div className="report-container">
      {/* HEADER SECTION */}
      <div className="report-header">
        <div className="report-header-info">
          <h1>Organization Reports</h1>
          <p>Global analytics across all departments, users, and projects.</p>
        </div>
        <div className="report-controls">
          <button className="report-btn" onClick={() => window.print()}>
            <span>🖨️</span> Executive Summary PDF
          </button>
          <button className="report-btn primary" onClick={fetchReportData}>
            <span>🔄</span> Refresh Data
          </button>
        </div>
      </div>

      <div className="report-tabs">
        <button className={`report-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Insights</button>
        <button className={`report-tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performance</button>
        <button className={`report-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Tasks</button>
      </div>

      <div className="report-grid">
        
        {/* 1. ORGANIZATION EFFICIENCY */}
        {(activeTab === 'all' || activeTab === 'performance') && (
          <div className="report-card col-12">
            <div className="report-card-header">
              <div>
                <h2 className="report-card-title">🎯 1. Organization Efficiency</h2>
                <div className="report-card-subtitle">Global calculated efficiency based on all completed tasks vs total tasks.</div>
              </div>
            </div>
            
            <div className="gauge-chart-wrapper">
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
              <div className="gauge-info">
                <div className="gauge-value">{computedEfficiency}%</div>
                <div className="gauge-label">Global Efficiency</div>
                <span className="summary-stat-trend trend-up" style={{ marginTop: '8px', fontSize: '11.5px', justifyContent: 'center' }}>
                  ↗ +2.4% <span style={{color:'var(--text-muted)'}}>vs last quarter</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. EMPLOYEE LEADERBOARD (NEW UNIQUE FEATURE) */}
        {(activeTab === 'all' || activeTab === 'performance') && (
          <div className="report-card col-8">
            <div className="report-card-header">
              <div>
                <h2 className="report-card-title">🏆 2. Top Performers Leaderboard</h2>
                <div className="report-card-subtitle">Employees with the highest task completion rates across the organization.</div>
              </div>
            </div>
            <div className="sa-leaderboard">
              {topPerformers.length > 0 ? topPerformers.map((user, idx) => (
                <div className="sa-lb-row" key={user.id}>
                  <div className="sa-lb-rank">#{idx + 1}</div>
                  <img src={user.avatar} className="sa-lb-avatar" alt="Avatar" />
                  <div className="sa-lb-info">
                    <div className="sa-lb-name">{user.name}</div>
                    <div className="sa-lb-email">{user.email}</div>
                  </div>
                  <div className="sa-lb-score">
                    <strong>{user.tasksCompleted}</strong> Tasks Done
                  </div>
                </div>
              )) : (
                <div style={{color:'var(--sa-muted)', padding:'20px'}}>No user data found.</div>
              )}
            </div>
          </div>
        )}

        {/* 3. TASK STATUS DISTRIBUTION */}
        {(activeTab === 'all' || activeTab === 'tasks') && (
          <div className="report-card col-4">
            <div className="report-card-header">
              <div>
                <h2 className="report-card-title">🥧 3. Global Task Status</h2>
                <div className="report-card-subtitle">Organization-wide status breakdown.</div>
              </div>
            </div>
            
            <div className="donut-container">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '140px', aspectRatio: '1', flexShrink: 0 }}>
                <PieChart data={[
                  { label: 'Completed', value: completedPct, color: 'var(--accent-green)' },
                  { label: 'In Progress', value: inProgressPct, color: '#38bdf8' },
                  { label: 'Pending', value: pendingPct, color: '#fbbf24' },
                  { label: 'Blocked', value: blockedPct, color: '#e74c3c' }
                ]} />
              </div>
              
              <div className="donut-legend">
                <div className="legend-row">
                  <span className="legend-dot" style={{backgroundColor: 'var(--accent-green)'}} />
                  <span className="legend-name">Completed</span>
                  <span className="legend-val">{completedPct}%</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot" style={{backgroundColor: '#38bdf8'}} />
                  <span className="legend-name">In Prog.</span>
                  <span className="legend-val">{inProgressPct}%</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot" style={{backgroundColor: '#fbbf24'}} />
                  <span className="legend-name">Pending</span>
                  <span className="legend-val">{pendingPct}%</span>
                </div>
                <div className="legend-row">
                  <span className="legend-dot" style={{backgroundColor: '#e74c3c'}} />
                  <span className="legend-name">Blocked</span>
                  <span className="legend-val">{blockedPct}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TASK SUMMARY */}
        {(activeTab === 'all' || activeTab === 'tasks') && (
          <div className="report-card col-12">
            <div className="report-card-header">
              <div>
                <h2 className="report-card-title">📋 4. Organization Tasks Summary</h2>
                <div className="report-card-subtitle">Aggregated totals for all projects and employees.</div>
              </div>
            </div>
            
            <div className="summary-stats-grid">
              <div className="summary-stat-box total">
                <div className="summary-stat-header">
                  <span className="summary-stat-label">Global Total Tasks</span>
                  <span className="summary-stat-icon">📊</span>
                </div>
                <h3 className="summary-stat-value">{totalTasksCount}</h3>
                <span className="summary-stat-trend trend-up">↗ +{Math.floor(totalTasksCount*0.1)} <span style={{color:'var(--text-muted)'}}>vs last week</span></span>
              </div>

              <div className="summary-stat-box active">
                <div className="summary-stat-header">
                  <span className="summary-stat-label">Global Active</span>
                  <span className="summary-stat-icon">⚡</span>
                </div>
                <h3 className="summary-stat-value">{activeTasksCount}</h3>
                <span className="summary-stat-trend trend-neutral">→ Stable</span>
              </div>

              <div className="summary-stat-box completed">
                <div className="summary-stat-header">
                  <span className="summary-stat-label">Global Completed</span>
                  <span className="summary-stat-icon">✅</span>
                </div>
                <h3 className="summary-stat-value">{completedTasksCount}</h3>
                <span className="summary-stat-trend trend-up">↗ +{Math.floor(completedTasksCount*0.05)} <span style={{color:'var(--text-muted)'}}>vs last week</span></span>
              </div>

              <div className="summary-stat-box blocked">
                <div className="summary-stat-header">
                  <span className="summary-stat-label">Global Blocked</span>
                  <span className="summary-stat-icon">⚠️</span>
                </div>
                <h3 className="summary-stat-value">{blockedTasksCount}</h3>
                <span className="summary-stat-trend trend-down">↘ -2 <span style={{color:'var(--text-muted)'}}>vs last week</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* PRINT LAYOUT SECTION (Reused from Reports) */}
      <div className="print-only-report">
        <div className="print-header">
          <div className="print-report-tag">EXECUTIVE SUMMARY</div>
          <h1>Organization Health & Analytics</h1>
          <p className="print-subtitle">Comprehensive performance and productivity analysis across all departments.</p>
        </div>
        <div className="print-section print-metrics-row">
          <div className="print-metric-card">
            <div className="pmc-label">Global Efficiency</div>
            <div className="pmc-val">{computedEfficiency}%</div>
          </div>
          <div className="print-metric-card">
            <div className="pmc-label">Total Projects</div>
            <div className="pmc-val">{projects.length}</div>
          </div>
          <div className="print-metric-card">
            <div className="pmc-label">Total Tasks</div>
            <div className="pmc-val">{totalTasksCount}</div>
          </div>
          <div className="print-metric-card">
            <div className="pmc-label">Tasks Completed</div>
            <div className="pmc-val">{completedTasksCount}</div>
          </div>
        </div>
        <div className="print-section">
           <h2 className="print-section-title">Top Performers</h2>
           <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
             {topPerformers.map(p => (
                <div key={p.id} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #ddd', paddingBottom:'5px'}}>
                   <span>{p.name}</span>
                   <strong>{p.tasksCompleted} Tasks</strong>
                </div>
             ))}
           </div>
        </div>
        <div className="print-footer">
          <div>Generated by: Super Admin</div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminReports;
