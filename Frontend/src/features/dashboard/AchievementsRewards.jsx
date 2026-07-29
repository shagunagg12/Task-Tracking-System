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
      title: 'Fast Starter',
      description: 'Finish a task within 1 hour of assignment.',
      icon: '⚡',
      status: 'unlocked',
      progress: { current: 1, total: 1 },
      date: 'July 25, 2026'
    },
    {
      id: 2,
      title: 'Team Player',
      description: 'Receive 5 high-fives or peer appreciations.',
      icon: '🤝',
      status: 'unlocked',
      progress: { current: 5, total: 5 },
      date: 'July 28, 2026'
    },
    {
      id: 3,
      title: 'Consistency King',
      description: 'Maintain a 5-day active task completion streak.',
      icon: '🔥',
      status: 'unlocked',
      progress: { current: 5, total: 5 },
      date: 'July 29, 2026'
    },
    {
      id: 4,
      title: 'Bug Squasher',
      description: 'Resolve 3 critical project bugs.',
      icon: '🐛',
      status: 'in-progress',
      progress: { current: 2, total: 3 }
    },
    {
      id: 5,
      title: 'Overachiever',
      description: 'Complete 20 tasks in a single month.',
      icon: '🏆',
      status: 'in-progress',
      progress: { current: 12, total: 20 }
    },
    {
      id: 6,
      title: 'Mentor Mindset',
      description: 'Help a teammate resolve their blocker.',
      icon: '🎓',
      status: 'locked',
      progress: { current: 0, total: 1 }
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
            <h2>🌟 Unlocked & Active Achievements</h2>
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
                        style={{ width: `${(item.progress.current / item.progress.total) * 100}%` }}
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
          <h2>🎁 Rewards Store</h2>
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
