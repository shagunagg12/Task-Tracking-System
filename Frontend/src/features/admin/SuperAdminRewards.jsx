import React, { useState, useEffect } from 'react';
import { Download, Check, Clock, Award, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';
import './SuperAdminRewards.css';

const SuperAdminRewards = () => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All', 'Pending', 'Approved'
  const [successMessage, setSuccessMessage] = useState('');

  const fetchRedemptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rewards/all-redemptions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRedemptions(data);
      }
    } catch (error) {
      console.error('Failed to fetch rewards redemptions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rewards/approve-redemption/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setSuccessMessage('Reward redemption approved successfully!');
        fetchRedemptions();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (error) {
      console.error('Error approving reward:', error);
    }
  };

  const handleDecline = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/rewards/decline-redemption/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setSuccessMessage('Reward redemption declined and points refunded!');
        fetchRedemptions();
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (error) {
      console.error('Error declining reward:', error);
    }
  };

  // Metrics calculations
  const totalPoints = redemptions.reduce((sum, r) => sum + r.pointsSpent, 0);
  const pendingApprovals = redemptions.filter(r => r.status.toLowerCase().includes('pending')).length;
  const approvedRedemptions = redemptions.filter(r => r.status.toLowerCase() === 'approved').length;

  const filteredRedemptions = redemptions.filter(r => {
    if (filter === 'Pending') return r.status.toLowerCase().includes('pending');
    if (filter === 'Approved') return r.status.toLowerCase() === 'approved';
    return true;
  });

  return (
    <div className="sar-container">
      {/* Header */}
      <div className="sar-header">
        <div>
          <h1 className="sar-title">Rewards & Vouchers Control Center</h1>
          <p className="sar-subtitle">Review, approve, and audit employee reward redemption requests and HR leave vouchers.</p>
        </div>
      </div>

      {successMessage && (
        <div className="sar-toast-notification">
          <span>🎉</span> {successMessage}
        </div>
      )}

      {/* Cards */}
      <div className="sar-scorecards">
        <div className="sar-glass-card">
          <div className="sar-gc-icon"><Award size={24} /></div>
          <div className="sar-gc-info">
            <div className="sar-gc-val">{redemptions.length}</div>
            <div className="sar-gc-lbl">Total Redemptions</div>
          </div>
        </div>
        <div className="sar-glass-card">
          <div className="sar-gc-icon" style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.1)' }}><Clock size={24} /></div>
          <div className="sar-gc-info">
            <div className="sar-gc-val">{pendingApprovals}</div>
            <div className="sar-gc-lbl">Pending Approvals</div>
          </div>
        </div>
        <div className="sar-glass-card">
          <div className="sar-gc-icon" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.1)' }}><CheckCircle2 size={24} /></div>
          <div className="sar-gc-info">
            <div className="sar-gc-val">{approvedRedemptions}</div>
            <div className="sar-gc-lbl">Approved Vouchers</div>
          </div>
        </div>
        <div className="sar-glass-card">
          <div className="sar-gc-icon" style={{ color: '#a855f7', background: 'rgba(168,85,247,0.1)' }}><UserCheck size={24} /></div>
          <div className="sar-gc-info">
            <div className="sar-gc-val">{totalPoints.toLocaleString()}</div>
            <div className="sar-gc-lbl">Points Exchanged</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sar-filter-bar">
        <div className="sar-filter-pills">
          <button className={`sar-filter-pill ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>All requests</button>
          <button className={`sar-filter-pill ${filter === 'Pending' ? 'active' : ''}`} onClick={() => setFilter('Pending')}>Pending Approval</button>
          <button className={`sar-filter-pill ${filter === 'Approved' ? 'active' : ''}`} onClick={() => setFilter('Approved')}>Approved</button>
        </div>
      </div>

      {/* Table */}
      <div className="sar-table-container">
        {loading ? (
          <div className="sar-loading">Loading redemption history...</div>
        ) : (
          <table className="sar-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Voucher / Reward</th>
                <th>Points Spent</th>
                <th>Redeemed Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRedemptions.map((item) => {
                const isPending = item.status.toLowerCase().includes('pending');
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="sar-user-cell">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName)}&background=random`} alt={item.userName} className="sar-avatar" onError={(e) => { e.target.onerror = null; e.target.src = "https://ui-avatars.com/api/?name=User&background=random"; }} />
                        <div>
                          <div className="sar-name">{item.userName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--sa-muted)' }}>{item.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{item.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--sa-muted)' }}>ID: {item.rewardId}</div>
                    </td>
                    <td>
                      <span className="sar-points">🪙 {item.pointsSpent} pts</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem' }}>{new Date(item.redeemedAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--sa-muted)' }}>
                        {new Date(item.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span className={`sa-badge-glow ${isPending ? 'warning' : 'engineering'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="sar-approve-btn" onClick={() => handleApprove(item.id)} title="Approve Request">
                            <Check size={16} /> Approve
                          </button>
                          <button 
                            className="sar-decline-btn" 
                            onClick={() => handleDecline(item.id)} 
                            title="Decline Request" 
                            style={{ background: 'var(--accent-red)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <ShieldAlert size={16} /> Decline
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--accent-green)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={16} /> Closed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredRedemptions.length === 0 && (
                <tr>
                  <td colSpan="6" className="sar-empty-state">No reward redemption requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SuperAdminRewards;
