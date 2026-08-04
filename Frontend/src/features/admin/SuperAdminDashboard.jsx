import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, CheckCircle, Clock, 
  Briefcase, TrendingUp, Building2, UserPlus
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { motion, animate } from 'framer-motion';
import * as signalR from '@microsoft/signalr';
import './SuperAdminDashboard.css';

const COLORS = ['#BEF264', '#10B981', '#F59E0B'];

const Counter = ({ from, to, duration = 1.5, format = (v) => v }) => {
  const [value, setValue] = useState(from);

  useEffect(() => {
    const controls = animate(from, to, {
      duration: duration,
      ease: "easeOut",
      onUpdate(v) {
        setValue(format(Math.round(v)));
      }
    });
    return () => controls.stop();
  }, [from, to, duration]); // Removed format to prevent re-triggering on every render

  return <span>{value}</span>;
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1, 
    transition: { type: 'spring', stiffness: 300, damping: 24 } 
  }
};

const SuperAdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeToday: 0,
    runningProjects: 0,
    tasksCompleted: 0,
    productivityTrend: [],
    workforceDistribution: [],
    departmentPerformance: [],
    recentOnboarding: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/AdminDashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalEmployees: data.totalEmployees,
          activeToday: data.activeToday,
          runningProjects: data.runningProjects,
          tasksCompleted: data.tasksCompleted,
          productivityTrend: data.productivityTrend,
          workforceDistribution: data.workforceDistribution,
          departmentPerformance: data.departmentPerformance,
          recentOnboarding: data.recentOnboarding
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl((import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5024') + '/adminDashboardHub')
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveStatsUpdate", () => {
      console.log("Real-time update received! Fetching latest stats...");
      fetchStats();
    });

    const startPromise = connection.start().catch(err => {
      if (err.name !== 'AbortError' && err.message !== 'The connection was stopped during negotiation.' && !err.message.includes('HttpConnection before stop')) {
        console.error("SignalR Connection Error: ", err);
      }
    });

    return () => {
      startPromise.then(() => {
        connection.stop();
      });
    };
  }, []);

  if (loading) {
    return <div style={{ color: '#fafafa', padding: '40px' }}>Loading Dashboard...</div>;
  }

  return (
    <motion.div 
      className="sa-dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="sa-dash-header">
        <div>
          <h1 className="sa-dash-title">Organization Overview</h1>
          <p className="sa-dash-subtitle">Welcome back, Super Admin. Here's what's happening today. (Real-time)</p>
        </div>
        <div className="sa-dash-actions">
          <select className="sa-dash-select">
            <option>Last 30 Days</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <button className="sa-btn-outline">Export Report</button>
        </div>
      </motion.div>

      {/* KPI CARDS */}
      <motion.div variants={containerVariants} className="sa-kpi-grid">
        <motion.div variants={itemVariants} className="sa-kpi-card group">
          <div className="sa-kpi-header">
            <span className="sa-kpi-title">Total Employees</span>
            <div className="sa-kpi-icon primary group-hover:scale-110 transition-transform"><Users size={20} /></div>
          </div>
          <div className="sa-kpi-value">
            <Counter from={0} to={stats.totalEmployees} format={(v) => v.toLocaleString()} />
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-trend positive"><TrendingUp size={14} /> Live Sync</span>
            <span className="sa-kpi-subtext">from database</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="sa-kpi-card group">
          <div className="sa-kpi-header">
            <span className="sa-kpi-title">Active Today</span>
            <div className="sa-kpi-icon success group-hover:scale-110 transition-transform"><Activity size={20} /></div>
          </div>
          <div className="sa-kpi-value">
            <Counter from={0} to={stats.activeToday} format={(v) => v.toLocaleString()} />
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-trend positive"><TrendingUp size={14} /> Live Sync</span>
            <span className="sa-kpi-subtext">estimated active</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="sa-kpi-card group">
          <div className="sa-kpi-header">
            <span className="sa-kpi-title">Running Projects</span>
            <div className="sa-kpi-icon warning group-hover:scale-110 transition-transform"><Briefcase size={20} /></div>
          </div>
          <div className="sa-kpi-value">
            <Counter from={0} to={stats.runningProjects} />
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-trend neutral"><Clock size={14} /> Live Sync</span>
            <span className="sa-kpi-subtext">in progress</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="sa-kpi-card group">
          <div className="sa-kpi-header">
            <span className="sa-kpi-title">Tasks Completed</span>
            <div className="sa-kpi-icon primary group-hover:scale-110 transition-transform"><CheckCircle size={20} /></div>
          </div>
          <div className="sa-kpi-value">
            <Counter from={0} to={stats.tasksCompleted} format={(v) => v.toLocaleString()} />
          </div>
          <div className="sa-kpi-footer">
            <span className="sa-trend positive"><TrendingUp size={14} /> Live Sync</span>
            <span className="sa-kpi-subtext">all time</span>
          </div>
        </motion.div>
      </motion.div>

      {/* CHARTS ROW 1 */}
      <motion.div variants={containerVariants} className="sa-charts-grid">
        <motion.div variants={itemVariants} className="sa-chart-card sa-col-2">
          <div className="sa-chart-header">
             <h3>Productivity Trend</h3>
             <button className="sa-icon-btn small">⋮</button>
          </div>
          <div className="sa-chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.productivityTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BEF264" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#BEF264" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="current" stroke="#BEF264" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" animationDuration={2000} />
                <Area type="monotone" dataKey="previous" stroke="#64748B" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrevious)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </motion.div>

      {/* CHARTS ROW 2 */}
      <motion.div variants={containerVariants} className="sa-charts-grid">
         <motion.div variants={itemVariants} className="sa-chart-card sa-col-2">
            <div className="sa-chart-header">
               <h3>Department Performance</h3>
               <button className="sa-icon-btn small">⋮</button>
            </div>
            <div className="sa-chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.departmentPerformance} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                  <Bar dataKey="active" fill="#BEF264" radius={[6, 6, 0, 0]} barSize={28} animationDuration={1500} />
                  <Bar dataKey="total" fill="rgba(255,255,255,0.1)" radius={[6, 6, 0, 0]} barSize={28} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </motion.div>

         <motion.div variants={itemVariants} className="sa-chart-card">
            <div className="sa-chart-header">
               <h3>Recent Onboarding</h3>
               <button className="sa-btn-text" onClick={() => onNavigate && onNavigate('User Management')}>View All</button>
            </div>
            <div className="sa-recent-list">
               {stats.recentOnboarding && stats.recentOnboarding.length > 0 ? (
                 stats.recentOnboarding.map((user, index) => (
                   <motion.div 
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      className="sa-recent-item" 
                      key={user.id}
                   >
                      <img src={user.avatar || user.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`} alt="Avatar" onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=User&background=random"; }} />
                      <div className="sa-recent-info">
                         <p className="sa-recent-name">{user.name || 'Unknown'}</p>
                         <p className="sa-recent-role">{user.email}</p>
                      </div>
                      <span className="sa-status-badge pending">Pending Profile</span>
                   </motion.div>
                 ))
               ) : (
                 <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                    All users have completed their profiles.
                 </div>
               )}
            </div>
         </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default SuperAdminDashboard;
