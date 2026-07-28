import React from 'react';
import { 
  Users, Activity, CheckCircle, Clock, 
  Briefcase, TrendingUp, Building2, UserPlus
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import './SuperAdminDashboard.css';

const dataArea = [
  { name: 'Jan', current: 4000, previous: 2400 },
  { name: 'Feb', current: 3000, previous: 1398 },
  { name: 'Mar', current: 2000, previous: 9800 },
  { name: 'Apr', current: 2780, previous: 3908 },
  { name: 'May', current: 1890, previous: 4800 },
  { name: 'Jun', current: 2390, previous: 3800 },
  { name: 'Jul', current: 3490, previous: 4300 },
];

const dataBar = [
  { name: 'Engineering', active: 120, total: 130 },
  { name: 'Marketing', active: 80, total: 95 },
  { name: 'Sales', active: 100, total: 110 },
  { name: 'HR', active: 30, total: 32 },
  { name: 'Finance', active: 40, total: 45 },
];

const dataPie = [
  { name: 'Remote', value: 400 },
  { name: 'On-site', value: 300 },
  { name: 'Hybrid', value: 300 },
];

const COLORS = ['#6366F1', '#10B981', '#F59E0B'];

const SuperAdminDashboard = () => {
  return (
    <div className="sa-dashboard">
      <div className="sa-dash-header">
        <div>
          <h1 className="sa-dash-title">Organization Overview</h1>
          <p className="sa-dash-subtitle">Welcome back, Super Admin. Here's what's happening today.</p>
        </div>
        <div className="sa-dash-actions">
          <select className="sa-dash-select">
            <option>Last 30 Days</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <button className="sa-btn-outline">Export Report</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="sa-kpi-grid">
        <div className="sa-kpi-card">
          <div className="sa-kpi-header">
            <span className="sa-kpi-title">Total Employees</span>
            <div className="sa-kpi-icon primary"><Users size={20} /></div>
          </div>
          <div className="sa-kpi-value">2,842</div>
          <div className="sa-kpi-footer">
            <span className="sa-trend positive"><TrendingUp size={14} /> 12.5%</span>
            <span className="sa-kpi-subtext">vs last month</span>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-header">
            <span className="sa-kpi-title">Active Today</span>
            <div className="sa-kpi-icon success"><Activity size={20} /></div>
          </div>
          <div className="sa-kpi-value">2,610</div>
          <div className="sa-kpi-footer">
            <span className="sa-trend positive"><TrendingUp size={14} /> 4.2%</span>
            <span className="sa-kpi-subtext">attendance rate (92%)</span>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-header">
            <span className="sa-kpi-title">Running Projects</span>
            <div className="sa-kpi-icon warning"><Briefcase size={20} /></div>
          </div>
          <div className="sa-kpi-value">148</div>
          <div className="sa-kpi-footer">
            <span className="sa-trend neutral"><Clock size={14} /> 12</span>
            <span className="sa-kpi-subtext">pending approvals</span>
          </div>
        </div>

        <div className="sa-kpi-card">
          <div className="sa-kpi-header">
            <span className="sa-kpi-title">Tasks Completed</span>
            <div className="sa-kpi-icon primary"><CheckCircle size={20} /></div>
          </div>
          <div className="sa-kpi-value">14,239</div>
          <div className="sa-kpi-footer">
            <span className="sa-trend positive"><TrendingUp size={14} /> 18.2%</span>
            <span className="sa-kpi-subtext">productivity score</span>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="sa-charts-grid">
        <div className="sa-chart-card sa-col-2">
          <div className="sa-chart-header">
             <h3>Productivity Trend</h3>
             <button className="sa-icon-btn small">⋮</button>
          </div>
          <div className="sa-chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dataArea} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="current" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrent)" />
                <Area type="monotone" dataKey="previous" stroke="#64748B" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrevious)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="sa-chart-card">
          <div className="sa-chart-header">
             <h3>Workforce Distribution</h3>
             <button className="sa-icon-btn small">⋮</button>
          </div>
          <div className="sa-chart-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dataPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {dataPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="sa-chart-legend">
             <div className="sa-legend-item"><span className="sa-dot" style={{background: COLORS[0]}}></span> Remote (40%)</div>
             <div className="sa-legend-item"><span className="sa-dot" style={{background: COLORS[1]}}></span> On-site (30%)</div>
             <div className="sa-legend-item"><span className="sa-dot" style={{background: COLORS[2]}}></span> Hybrid (30%)</div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="sa-charts-grid">
         <div className="sa-chart-card sa-col-2">
            <div className="sa-chart-header">
               <h3>Department Performance</h3>
               <button className="sa-icon-btn small">⋮</button>
            </div>
            <div className="sa-chart-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataBar} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }} cursor={{fill: '#1F2937'}} />
                  <Bar dataKey="active" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="total" fill="#374151" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="sa-chart-card">
            <div className="sa-chart-header">
               <h3>Recent Onboarding</h3>
               <button className="sa-btn-text">View All</button>
            </div>
            <div className="sa-recent-list">
               {[1, 2, 3, 4, 5].map(i => (
                 <div className="sa-recent-item" key={i}>
                    <img src={`https://ui-avatars.com/api/?name=New+Hire+${i}&background=random`} alt="Avatar" />
                    <div className="sa-recent-info">
                       <p className="sa-recent-name">Sarah Connor {i}</p>
                       <p className="sa-recent-role">Senior Engineer</p>
                    </div>
                    <span className="sa-status-badge pending">In Progress</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
