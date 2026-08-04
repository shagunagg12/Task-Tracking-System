import React, { useState, useEffect } from 'react';
import './AchievementsRewards.css';

const AnimatedCounter = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
      const currentVal = Math.floor(start + (end - start) * ease);

      setDisplayValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const AchievementsRewards = () => {
  const [points, setPoints] = useState(0);
  const [redeemedItems, setRedeemedItems] = useState([]);
  const [redemptionSuccess, setRedemptionSuccess] = useState(null);
  const [allAchievementsClaimed, setAllAchievementsClaimed] = useState(false);
  const [claimedBonuses, setClaimedBonuses] = useState([]);

  // Real database metrics
  const [dbStats, setDbStats] = useState({
    completedTasks: 0,
    completedProjects: 0,
    efficiency: 75,
    weeklyLogins: 7,
    monthlyLogins: 21
  });

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/rewards/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const pts = data.points !== undefined ? data.points : (data.Points !== undefined ? data.Points : 0);
        const bonuses = data.claimedBonuses || data.ClaimedBonuses || [];
        setPoints(pts);
        setClaimedBonuses(bonuses);
        setDbStats({
          completedTasks: data.completedTasks !== undefined ? data.completedTasks : (data.CompletedTasks !== undefined ? data.CompletedTasks : 0),
          completedProjects: data.completedProjects !== undefined ? data.completedProjects : (data.CompletedProjects !== undefined ? data.CompletedProjects : 0),
          efficiency: data.efficiency !== undefined ? data.efficiency : (data.Efficiency !== undefined ? data.Efficiency : 0),
          weeklyLogins: data.weeklyLogins !== undefined ? data.weeklyLogins : (data.WeeklyLogins !== undefined ? data.WeeklyLogins : 0),
          monthlyLogins: data.monthlyLogins !== undefined ? data.monthlyLogins : (data.MonthlyLogins !== undefined ? data.MonthlyLogins : 0)
        });
        if (bonuses.includes('all-star-completion')) {
          setAllAchievementsClaimed(true);
        }
      }
    } catch (error) {
      console.error('Error fetching rewards status:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const achievements = [
    {
      id: 1,
      title: 'Task Champion',
      description: 'Complete 10 assigned project tasks successfully.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
      status: dbStats.completedTasks >= 10 ? 'unlocked' : 'in-progress',
      progress: { current: dbStats.completedTasks, total: 10 },
      date: dbStats.completedTasks >= 10 ? 'Unlocked' : null
    },
    {
      id: 2,
      title: 'Project Deliverer',
      description: 'Complete 2 full development projects.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
      status: dbStats.completedProjects >= 2 ? 'unlocked' : 'in-progress',
      progress: { current: dbStats.completedProjects, total: 2 },
      date: dbStats.completedProjects >= 2 ? 'Unlocked' : null
    },
    {
      id: 3,
      title: 'Efficiency Elite',
      description: 'Maintain an overall task efficiency rating of 90% or above.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="6"></circle>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      ),
      status: dbStats.efficiency >= 90 ? 'unlocked' : 'in-progress',
      progress: { current: dbStats.efficiency, total: 90 },
      date: dbStats.efficiency >= 90 ? 'Unlocked' : null
    }
  ];

  const efficiencyMilestones = [
    {
      id: 'task-rookie',
      title: 'Task Rookie Milestone',
      requirement: 'Complete 5 tasks in total',
      rewardPoints: 100,
      status: claimedBonuses.includes('task-rookie') ? 'claimed' : (dbStats.completedTasks >= 5 ? 'claimable' : 'in-progress'),
      progress: { current: dbStats.completedTasks, total: 5 }
    },
    {
      id: 'task-master',
      title: 'Task Master Milestone',
      requirement: 'Complete 20 tasks in total',
      rewardPoints: 500,
      status: claimedBonuses.includes('task-master') ? 'claimed' : (dbStats.completedTasks >= 20 ? 'claimable' : 'in-progress'),
      progress: { current: dbStats.completedTasks, total: 20 }
    },
    {
      id: 'excellence-bonus',
      title: 'Overall Excellence Bonus',
      requirement: 'Achieve an efficiency score of 95% or higher',
      rewardPoints: 250,
      status: claimedBonuses.includes('excellence-bonus') ? 'claimed' : (dbStats.efficiency >= 95 ? 'claimable' : 'in-progress'),
      progress: { current: dbStats.efficiency, total: 95 }
    },
    {
      id: 'daily-checkin',
      title: 'Daily Dashboard Check-in',
      requirement: 'Open the MATTS dashboard to review daily priorities',
      rewardPoints: 10,
      status: claimedBonuses.includes('daily-checkin') ? 'claimed' : 'claimable',
      progress: { current: 1, total: 1 }
    },
    {
      id: 'task-verify',
      title: 'Task Verification',
      requirement: 'Verify task status changes for today',
      rewardPoints: 15,
      status: claimedBonuses.includes('task-verify') ? 'claimed' : 'claimable',
      progress: { current: 1, total: 1 }
    },
    {
      id: 'profile-pic-task',
      title: 'Profile Customization',
      requirement: 'Upload a custom profile picture',
      rewardPoints: 20,
      status: claimedBonuses.includes('profile-pic-task') ? 'claimed' : 'claimable',
      progress: { current: 1, total: 1 }
    }
  ];

  const rewards = [
    {
      id: 1,
      title: 'Starbucks Voucher ($5)',
      points: 250,
      icon: '☕',
      category: 'Gift Card',
      description: 'Start your morning with a premium coffee on us.'
    },
    {
      id: 2,
      title: 'Amazon Gift Card ($10)',
      points: 500,
      icon: '🎁',
      category: 'Gift Card',
      description: 'Redeemable for anything in the global Amazon store.'
    },
    {
      id: 3,
      title: 'Leave Voucher (Approved by HR)',
      points: 1000,
      icon: '🎫',
      category: 'Perk',
      description: 'Redeem 1000 points for a paid leave voucher approved by HR.'
    }
  ];

  const handleRedeem = async (reward) => {
    if (points >= reward.points) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/rewards/redeem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            rewardId: reward.id === 3 ? 'leave-voucher' : (reward.id === 1 ? 'starbucks' : 'amazon'),
            title: reward.title,
            points: reward.points
          })
        });
        if (response.ok) {
          const data = await response.json();
          const pts = data.points !== undefined ? data.points : (data.Points !== undefined ? data.Points : 0);
          setPoints(pts);
          setRedeemedItems(prev => [...prev, reward.title]);
          setRedemptionSuccess(`Successfully redeemed ${reward.title}! Check your email for details.`);
          setTimeout(() => setRedemptionSuccess(null), 4000);
        }
      } catch (error) {
        console.error('Error redeeming reward:', error);
      }
    }
  };

  const handleClaimBonus = async (milestone) => {
    if (milestone.status === 'claimable') {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/rewards/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bonusId: milestone.id,
            rewardPoints: milestone.rewardPoints
          })
        });
        if (response.ok) {
          const data = await response.json();
          const pts = data.points !== undefined ? data.points : (data.Points !== undefined ? data.Points : 0);
          setPoints(pts);
          setClaimedBonuses(prev => [...prev, milestone.id]);
          setRedemptionSuccess(`Claimed +${milestone.rewardPoints} points for completing "${milestone.title}"! 🎉`);
          setTimeout(() => setRedemptionSuccess(null), 4000);
        }
      } catch (error) {
        console.error('Error claiming bonus:', error);
      }
    }
  };

  const allAchievementsUnlocked = achievements.every(a => a.status === 'unlocked');

  const handleClaimAllAchievementsBonus = async () => {
    if (allAchievementsUnlocked && !allAchievementsClaimed) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:5024/api')) + '/rewards/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bonusId: 'all-star-completion',
            rewardPoints: 500
          })
        });
        if (response.ok) {
          const data = await response.json();
          const pts = data.points !== undefined ? data.points : (data.Points !== undefined ? data.Points : 0);
          setPoints(pts);
          setAllAchievementsClaimed(true);
          setClaimedBonuses(prev => [...prev, 'all-star-completion']);
          setRedemptionSuccess(`Claimed +500 All-Star Completion Bonus points! 🏆`);
          setTimeout(() => setRedemptionSuccess(null), 4000);
        }
      } catch (error) {
        console.error('Error claiming completion bonus:', error);
      }
    }
  };

  return (
    <div className="achievements-rewards-container">
      {/* HEADER SUMMARY */}
      <div className="ar-hero-header">
        <div className="ar-hero-info">
          <h1>Achievements & Rewards</h1>
          <p>Earn points by completing tasks and maintaining high efficiency!</p>
        </div>
        <div className="ar-stats-row">
          <div className="ar-stat-card points-card">
            <span className="ar-stat-icon">
              <svg className="ar-gold-coin-svg" viewBox="0 0 24 24" width="32" height="32">
                <circle cx="12" cy="12" r="10" fill="url(#goldGradient)" stroke="#d4af37" strokeWidth="1"></circle>
                <circle cx="12" cy="12" r="7" fill="none" stroke="#f0c23a" strokeWidth="1.5" strokeDasharray="3 3"></circle>
                <text x="12" y="16.5" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#f0c23a" textAnchor="middle">P</text>
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffd700"></stop>
                    <stop offset="50%" stopColor="#cca01a"></stop>
                    <stop offset="100%" stopColor="#ffd700"></stop>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <div className="ar-stat-details">
              <span className="ar-stat-val"><AnimatedCounter value={points} /></span>
              <span className="ar-stat-lbl">Available Points</span>
            </div>
          </div>
        </div>
      </div>

      {redemptionSuccess && (
        <div className="ar-toast-notification">
          <span>🎉</span> {redemptionSuccess}
        </div>
      )}

      {/* EFFICIENCY CREDIT SYSTEM */}
      <div className="ar-efficiency-credits-container">
        <div className="ar-section-header">
          <h2>🎯 Efficiency Milestones & Credits</h2>
          <p>Earn point credits by keeping your efficiency levels high.</p>
        </div>
        <div className="ar-milestones-grid">
          {efficiencyMilestones.map(m => (
            <div key={m.id} className={`ar-milestone-card ${m.status}`}>
              <div className="ar-milestone-info">
                <h3>{m.title}</h3>
                <p className="ar-req-desc">{m.requirement}</p>
                <div className="ar-milestone-progress">
                  <div className="ar-progress-text">
                    Progress: {Math.min(m.progress.current, m.progress.total)} / {m.progress.total} {m.id === 'excellence-bonus' ? '%' : (m.id === 'task-rookie' || m.id === 'task-master' ? 'tasks' : 'days')}
                  </div>
                  <div className="ar-progress-track">
                    <div 
                      className="ar-progress-fill" 
                      style={{ width: `${Math.min((m.progress.current / m.progress.total) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="ar-milestone-action">
                <span className="ar-milestone-points">🪙 +{m.rewardPoints} pts</span>
                <button 
                  className={`claim-btn ${m.status}`}
                  disabled={m.status !== 'claimable'}
                  onClick={() => handleClaimBonus(m)}
                >
                  {m.status === 'claimable' && 'Claim Points'}
                  {m.status === 'claimed' && 'Claimed ✓'}
                  {m.status === 'in-progress' && 'In Progress'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="ar-grid">
        {/* LEFT COLUMN: ACHIEVEMENTS */}
        <div className="ar-section achievements-section">
          <div className="section-title-row">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
              Unlocked & Active Achievements
            </h2>
            <span className="badge-count">
              {achievements.filter(a => a.status === 'unlocked').length} / {achievements.length} Completed
            </span>
          </div>

          <div className="achievements-list">
            {achievements.map((item) => (
              <div key={item.id} className={`achievement-item-card ${item.status}`}>
                <div className="achievement-icon-wrapper">
                  <span className="ach-icon">{item.icon}</span>
                  {item.status === 'unlocked' && <span className="check-badge">✓</span>}
                </div>
                <div className="achievement-details">
                  <div className="ach-top-line">
                    <h3>{item.title}</h3>
                    {item.date && <span className="ach-date">{item.date}</span>}
                  </div>
                  <p>{item.description}</p>
                  
                  <div className="ach-progress-bar-wrapper">
                    <div className="ach-progress-text">
                      Progress: {Math.min(item.progress.current, item.progress.total)} / {item.progress.total}
                    </div>
                    <div className="ach-progress-track">
                      <div 
                        className="ach-progress-fill" 
                        style={{ width: `${Math.min((item.progress.current / item.progress.total) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* EXTRA COMPLETION BONUS */}
          <div className={`ar-completion-bonus-card ${allAchievementsUnlocked ? 'unlocked' : 'locked'} ${allAchievementsClaimed ? 'claimed' : ''}`}>
            <div className="bonus-content">
              <span className="bonus-trophy">🏆</span>
              <div className="bonus-details">
                <h3>All-Star Completion Bonus</h3>
                <p>Unlock all 3 achievements to earn an extra 500 points!</p>
                <div className="bonus-badges-row">
                  {achievements.map(a => (
                    <div key={a.id} className={`bonus-badge-slot ${a.status}`} title={`${a.title}: ${a.status}`}>
                      <span className="slot-icon-wrapper">{a.icon}</span>
                      {a.status === 'unlocked' && <span className="slot-check">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button 
              className={`claim-bonus-btn ${allAchievementsUnlocked && !allAchievementsClaimed ? 'active' : 'disabled'}`}
              disabled={!allAchievementsUnlocked || allAchievementsClaimed}
              onClick={handleClaimAllAchievementsBonus}
            >
              {allAchievementsClaimed ? 'Claimed ✓' : 'Claim +500 pts'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: REWARDS STORE */}
        <div className="ar-section rewards-section">
          <h2>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <polyline points="21 8 21 21 3 21 3 8"></polyline>
              <rect x="1" y="3" width="22" height="5"></rect>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
            Rewards Store
          </h2>
          <p className="section-desc">Spend your hard-earned points to redeem vouchers, merchandise, or corporate benefits.</p>

          <div className="rewards-grid">
            {rewards.map((reward) => {
              const canAfford = points >= reward.points;
              const isRare = reward.id === 3;
              return (
                <div key={reward.id} className={`reward-item-card ${isRare ? 'rare-reward-landscape' : 'standard-reward-landscape'} ${!canAfford ? 'locked-reward' : ''}`}>
                  {isRare && <div className="rare-reward-shine-overlay"></div>}
                  <div className="rare-left">
                    <span className="reward-large-icon">{reward.icon}</span>
                    <span className={`reward-cat-tag ${isRare ? 'rare-tag' : ''}`}>{reward.category}</span>
                  </div>
                  <div className="rare-middle">
                    <h3>{reward.title}</h3>
                    <p>{reward.description}</p>
                  </div>
                  <div className="rare-right">
                    <span className={`reward-cost ${isRare ? 'gold-glow' : ''}`}>🪙 {reward.points} pts</span>
                    <button 
                      className={`redeem-btn ${canAfford ? 'active' : 'disabled'}`}
                      disabled={!canAfford}
                      onClick={() => handleRedeem(reward)}
                    >
                      {canAfford ? 'Redeem Now' : 'Need More Points'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsRewards;
