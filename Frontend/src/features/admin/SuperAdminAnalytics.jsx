import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Briefcase, CheckSquare, Building2, TrendingUp, Search, Star,
  MessageSquare, Video, Gift, Key
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import './SuperAdminAnalytics.css';

const COLORS = ['#b4ff39', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="sa-custom-tooltip">
        <p className="label">{label}</p>
        <p className="value">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const SuperAdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('organization'); // organization, department, user
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [orgData, setOrgData] = useState(null);
  const [deptData, setDeptData] = useState(null);
  const [userData, setUserData] = useState(null);

  // Filter States
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  // Determine backend URL
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const backendUrl = isDevelopment ? (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5024') : window.location.origin;

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    if (activeTab === 'organization') {
      fetchOrgData();
    }
  }, [activeTab]);

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      const deptRes = await fetch(`${backendUrl}/api/analytics/filters/departments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (deptRes.ok) setDepartments(await deptRes.json());

      const userRes = await fetch(`${backendUrl}/api/analytics/filters/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) setUsers(await userRes.json());
    } catch (err) {
      console.error("Failed to fetch filters:", err);
    }
  };

  const fetchOrgData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/analytics/organization`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setOrgData(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch org analytics:", err);
    }
    setLoading(false);
  };

  const fetchDeptData = async (deptName) => {
    if (!deptName) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/analytics/department/${encodeURIComponent(deptName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDeptData(await res.json());
      } else {
        setDeptData(null); // Not found
      }
    } catch (err) {
      console.error("Failed to fetch dept analytics:", err);
    }
    setLoading(false);
  };

  const fetchUserData = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/api/analytics/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUserData(await res.json());
      } else {
        setUserData(null);
      }
    } catch (err) {
      console.error("Failed to fetch user analytics:", err);
    }
    setLoading(false);
  };

  const handleDeptChange = (e) => {
    const val = e.target.value;
    setSelectedDept(val);
    if (val) fetchDeptData(val);
  };

  const handleUserChange = (e) => {
    const val = e.target.value;
    setSelectedUser(val);
    if (val) fetchUserData(val);
  };

  // ─── Render Helpers ───

  const renderKPI = (title, value, icon, color) => (
    <div className="sa-kpi-card">
      <div className="sa-kpi-icon" style={{ background: `${color}15`, color: color }}>
        {icon}
      </div>
      <div>
        <div className="sa-kpi-title">{title}</div>
        <div className="sa-kpi-value">{value}</div>
      </div>
    </div>
  );

  const renderOrganizationView = () => {
    if (!orgData) return null;
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="sa-kpi-grid">
          {renderKPI("Total Users", orgData.totalUsers, <Users />, "#b4ff39")}
          {renderKPI("Active Projects", orgData.totalProjects, <Briefcase />, "#60a5fa")}
          {renderKPI("Tasks Completed", `${orgData.completedTasks} / ${orgData.totalTasks}`, <CheckSquare />, "#a78bfa")}
          {renderKPI("Completion Rate", `${orgData.taskCompletionRate}%`, <TrendingUp />, "#f472b6")}
          
          {/* New Metrics */}
          {renderKPI("Total Meetings", orgData.totalMeetings, <Video />, "#fbbf24")}
          {renderKPI("Messages Exchanged", orgData.totalMessages, <MessageSquare />, "#34d399")}
          {renderKPI("Rewards Claimed", orgData.totalRewardsRedeemed, <Gift />, "#f87171")}
        </div>

        <div className="sa-charts-grid">
          <div className="sa-chart-container">
            <h3 className="sa-chart-title">User Distribution by Department</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={orgData.departmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="userCount"
                    nameKey="departmentName"
                  >
                    {orgData.departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="sa-chart-container">
            <h3 className="sa-chart-title">Overall Task Status</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={orgData.taskStatusDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="status" stroke="#a3a3a3" />
                  <YAxis stroke="#a3a3a3" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#b4ff39" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderDepartmentView = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="sa-analytics-filters">
        <select 
          className="sa-analytics-search" 
          value={selectedDept} 
          onChange={handleDeptChange}
          style={{ appearance: 'none', cursor: 'pointer' }}
        >
          <option value="" disabled>Select a Department...</option>
          {departments.map((d, i) => (
            <option key={i} value={d.name}>{d.name}</option>
          ))}
        </select>
      </div>

      {!deptData && !loading && selectedDept && (
        <div style={{ color: '#a3a3a3', textAlign: 'center', marginTop: '40px' }}>
          No users or data found for this department.
        </div>
      )}

      {deptData && (
        <>
          <h2 style={{ marginBottom: '24px', color: '#b4ff39' }}>{deptData.departmentName} Analytics</h2>
          <div className="sa-kpi-grid">
            {renderKPI("Dept Users", deptData.totalUsers, <Users />, "#b4ff39")}
            {renderKPI("Total Points", deptData.totalPoints, <Star />, "#fbbf24")}
            {renderKPI("Avg Points/User", deptData.averagePointsPerUser, <TrendingUp />, "#60a5fa")}
            {renderKPI("Projects Handled", deptData.totalProjects, <Briefcase />, "#a78bfa")}
            
            {/* New Metrics */}
            {renderKPI("Meetings Organized", deptData.totalMeetingsOrganized, <Video />, "#34d399")}
            {renderKPI("Rewards Claimed", deptData.totalRewardsClaimed, <Gift />, "#f87171")}
          </div>

          <div className="sa-charts-grid">
            <div className="sa-chart-container">
              <h3 className="sa-chart-title">Task Progress</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={deptData.taskStatusDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="status" stroke="#a3a3a3" />
                    <YAxis stroke="#a3a3a3" />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#60a5fa" fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="sa-chart-container">
              <h3 className="sa-chart-title">Top Performers</h3>
              <ul className="sa-top-performers">
                {deptData.topPerformers.map((user, idx) => (
                  <li key={idx} className="sa-performer-item">
                    <img src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.fullName}`} alt={user.fullName} className="sa-performer-avatar" onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=User&background=random"; }} />
                    <div className="sa-performer-info">
                      <div className="sa-performer-name">{user.fullName}</div>
                      <div className="sa-performer-points">{user.points} pts</div>
                    </div>
                  </li>
                ))}
                {deptData.topPerformers.length === 0 && <li style={{color:'#a3a3a3'}}>No users found.</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );

  const renderUserView = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="sa-analytics-filters">
        <select 
          className="sa-analytics-search" 
          value={selectedUser} 
          onChange={handleUserChange}
          style={{ appearance: 'none', cursor: 'pointer' }}
        >
          <option value="" disabled>Select an Employee...</option>
          {users.map((u, i) => (
            <option key={i} value={u.id}>{u.fullName} (ID: {u.id})</option>
          ))}
        </select>
      </div>

      {!userData && !loading && selectedUser && (
        <div style={{ color: '#a3a3a3', textAlign: 'center', marginTop: '40px' }}>
          User data could not be loaded.
        </div>
      )}

      {userData && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
            <h2 style={{ margin: 0, color: '#b4ff39' }}>{userData.fullName}</h2>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px', fontSize: '14px' }}>
              {userData.department || 'No Department'}
            </span>
          </div>

          <div className="sa-kpi-grid">
            {renderKPI("Total Points", userData.totalPoints, <Star />, "#fbbf24")}
            {renderKPI("Projects", userData.totalProjects, <Briefcase />, "#60a5fa")}
            {renderKPI("Tasks Assigned", userData.totalTasksAssigned, <CheckSquare />, "#a78bfa")}
            {renderKPI("Completion Rate", `${userData.completionRate}%`, <TrendingUp />, "#34d399")}
            
            {/* New Metrics */}
            {renderKPI("Meetings Organized", userData.meetingsOrganized, <Video />, "#f472b6")}
            {renderKPI("Messages Sent", userData.messagesSent, <MessageSquare />, "#60a5fa")}
            {renderKPI("Rewards Claimed", userData.rewardsClaimed, <Gift />, "#f87171")}
          </div>

          <div className="sa-charts-grid">
            <div className="sa-chart-container">
              <h3 className="sa-chart-title">User Task Distribution</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={userData.taskStatusDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="status" stroke="#a3a3a3" />
                    <YAxis stroke="#a3a3a3" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#f472b6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );

  return (
    <div className="sa-analytics-container">
      <div className="sa-analytics-header">
        <h1 className="sa-analytics-title">Advanced Analytics</h1>
        <p className="sa-analytics-subtitle">Detailed real-time insights across your organization.</p>
      </div>

      <div className="sa-analytics-tabs">
        <button 
          className={`sa-analytics-tab ${activeTab === 'organization' ? 'active' : ''}`}
          onClick={() => { setActiveTab('organization'); }}
        >
          Organization
        </button>
        <button 
          className={`sa-analytics-tab ${activeTab === 'department' ? 'active' : ''}`}
          onClick={() => { setActiveTab('department'); setDeptData(null); setSelectedDept(''); }}
        >
          Department Drilldown
        </button>
        <button 
          className={`sa-analytics-tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => { setActiveTab('user'); setUserData(null); setSelectedUser(''); }}
        >
          Individual User
        </button>
      </div>

      {loading ? (
        <div className="sa-loader-container">
          <div className="sa-loader"></div>
        </div>
      ) : (
        <>
          {activeTab === 'organization' && renderOrganizationView()}
          {activeTab === 'department' && renderDepartmentView()}
          {activeTab === 'user' && renderUserView()}
        </>
      )}
    </div>
  );
};

export default SuperAdminAnalytics;
