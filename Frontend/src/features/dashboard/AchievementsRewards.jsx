import React, { useState } from 'react';
import './AchievementsRewards.css';

const AchievementsRewards = () => {
  const [points, setPoints] = useState(1250);
  const [redeemedItems, setRedeemedItems] = useState([]);
  const [redemptionSuccess, setRedemptionSuccess] = useState(null);

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
      title: 'MATTS Custom Hoodie',
      points: 800,
      icon: '👕',
      category: 'Merch',
      description: 'Premium quality ultra-soft MATTS branded hoodie.'
    },
    {
      id: 4,
      title: 'Extra Day Off',
      points: 1500,
      icon: '🏖️',
      category: 'Perk',
      description: 'Request a paid leave day with manager approval.'
    },
    {
      id: 5,
      title: 'Noise Cancelling Headphones',
      points: 5000,
      icon: '🎧',
      category: 'Tech',
      description: 'Premium wireless active noise cancelling headphones.'
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

  return (
    <div className="achievements-rewards-container">
      {/* HEADER SUMMARY */}
      <div className="ar-hero-header">
        <div className="ar-hero-info">
          <h1>Achievements & Rewards</h1>
          <p>Earn points by completing tasks and unlock premium rewards!</p>
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
