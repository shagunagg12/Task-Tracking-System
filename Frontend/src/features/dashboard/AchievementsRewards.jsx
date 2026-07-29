import React, { useState } from 'react';
import './AchievementsRewards.css';

const AchievementsRewards = () => {
  const [points, setPoints] = useState(1250);
  const [redeemedItems, setRedeemedItems] = useState([]);
  const [redemptionSuccess, setRedemptionSuccess] = useState(null);

  const [efficiencyMilestones, setEfficiencyMilestones] = useState([
    {
      id: 'weekly-streak',
      title: 'Weekly Consistency Streak',
      requirement: 'Maintain >90% efficiency for 7 days in a row',
      rewardPoints: 100,
      status: 'claimable',
      progress: { current: 7, total: 7 }
    },
    {
      id: 'monthly-consistency',
      title: 'Monthly Peak Performance',
      requirement: 'Maintain continuous 90% efficiency for 1 month',
      rewardPoints: 500,
      status: 'in-progress',
      progress: { current: 21, total: 30 }
    },
    {
      id: 'excellence-bonus',
      title: 'Overall Excellence Bonus',
      requirement: 'Achieve an efficiency score of 95% or higher',
      rewardPoints: 250,
      status: 'claimed',
      progress: { current: 96, total: 95 }
    }
  ]);

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
      status: 'unlocked',
      progress: { current: 10, total: 10 },
      date: 'July 25, 2026'
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
      status: 'in-progress',
      progress: { current: 1, total: 2 }
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
      status: 'unlocked',
      progress: { current: 92, total: 90 },
      date: 'July 29, 2026'
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

  const handleRedeem = (reward) => {
    if (points >= reward.points) {
      setPoints(prev => prev - reward.points);
      setRedeemedItems(prev => [...prev, reward.title]);
      setRedemptionSuccess(`Successfully redeemed ${reward.title}! Check your email for details.`);
      setTimeout(() => setRedemptionSuccess(null), 4000);
    }
  };

  const handleClaimBonus = (milestone) => {
    if (milestone.status === 'claimable') {
      setPoints(prev => prev + milestone.rewardPoints);
      setEfficiencyMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, status: 'claimed' } : m));
      setRedemptionSuccess(`Claimed +${milestone.rewardPoints} points for completing "${milestone.title}"! 🎉`);
      setTimeout(() => setRedemptionSuccess(null), 4000);
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
            <span className="ar-stat-icon">🪙</span>
            <div className="ar-stat-details">
              <span className="ar-stat-val">{points.toLocaleString()}</span>
              <span className="ar-stat-lbl">Available Points</span>
            </div>
          </div>
          <div className="ar-stat-card streak-card">
            <span className="ar-stat-icon flame-icon">🔥</span>
            <div className="ar-stat-details">
              <span className="ar-stat-val">5 Days</span>
              <span className="ar-stat-lbl">Active Streak</span>
            </div>
          </div>
          <div className="ar-stat-card level-card">
            <span className="ar-stat-icon">🌟</span>
            <div className="ar-stat-details">
              <span className="ar-stat-val">Level 4</span>
              <span className="ar-stat-lbl">Gold Tier</span>
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
                    Progress: {m.progress.current} / {m.progress.total} {m.id === 'excellence-bonus' ? '%' : 'days'}
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
                      Progress: {item.progress.current} / {item.progress.total}
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
              if (isRare) {
                return (
                  <div key={reward.id} className={`reward-item-card rare-reward-landscape ${!canAfford ? 'locked-reward' : ''}`}>
                    <div className="rare-reward-shine-overlay"></div>
                    <div className="rare-left">
                      <span className="reward-large-icon">{reward.icon}</span>
                      <span className="reward-cat-tag rare-tag">{reward.category}</span>
                    </div>
                    <div className="rare-middle">
                      <h3>{reward.title}</h3>
                      <p>{reward.description}</p>
                    </div>
                    <div className="rare-right">
                      <span className="reward-cost gold-glow">🪙 {reward.points} pts</span>
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
              }
              return (
                <div key={reward.id} className={`reward-item-card ${!canAfford ? 'locked-reward' : ''}`}>
                  <div className="reward-card-header">
                    <span className="reward-cat-tag">{reward.category}</span>
                    <span className="reward-cost">🪙 {reward.points} pts</span>
                  </div>
                  <div className="reward-main-info">
                    <span className="reward-large-icon">{reward.icon}</span>
                    <h3>{reward.title}</h3>
                    <p>{reward.description}</p>
                  </div>
                  <button 
                    className={`redeem-btn ${canAfford ? 'active' : 'disabled'}`}
                    disabled={!canAfford}
                    onClick={() => handleRedeem(reward)}
                  >
                    {canAfford ? 'Redeem Now' : 'Need More Points'}
                  </button>
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
