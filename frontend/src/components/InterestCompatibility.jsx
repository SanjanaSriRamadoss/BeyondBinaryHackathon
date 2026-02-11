/**
 * InterestCompatibility Component
 * Visual indicator showing interest match between user and activity/user
 */

import React from 'react';
import './InterestCompatibility.css';

const InterestCompatibility = ({ 
  matchedInterests = [], 
  percentage = 0, 
  totalMatches = 0,
  showDetails = true,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  
  const getCompatibilityLevel = () => {
    if (percentage >= 80) return {
      label: 'Excellent Match',
      color: '#22c55e',
      emoji: '🌟'
    };
    if (percentage >= 60) return {
      label: 'Great Match',
      color: '#3b82f6',
      emoji: '✨'
    };
    if (percentage >= 40) return {
      label: 'Good Match',
      color: '#f59e0b',
      emoji: '👍'
    };
    if (percentage >= 20) return {
      label: 'Moderate Match',
      color: '#8b5cf6',
      emoji: '🤝'
    };
    return {
      label: 'Some Interests',
      color: '#6b7280',
      emoji: '💡'
    };
  };

  const compatibility = getCompatibilityLevel();

  // Calculate circle progress for visual indicator
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`interest-compatibility ${size}`}>
      {/* Circular Progress Indicator */}
      <div className="compatibility-circle">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={compatibility.color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            className="progress-ring"
          />
        </svg>
        
        {/* Center content */}
        <div className="circle-content">
          <span className="percentage">{Math.round(percentage)}%</span>
          <span className="emoji">{compatibility.emoji}</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="compatibility-details">
          <h4 className="compatibility-label" style={{ color: compatibility.color }}>
            {compatibility.label}
          </h4>
          
          <p className="match-count">
            {totalMatches} {totalMatches === 1 ? 'interest' : 'interests'} in common
          </p>

          {/* Matched Interests Tags */}
          {matchedInterests.length > 0 && (
            <div className="matched-interests-list">
              {matchedInterests.map((interest, idx) => (
                <span 
                  key={idx} 
                  className="interest-badge"
                  style={{ 
                    backgroundColor: `${compatibility.color}15`,
                    color: compatibility.color,
                    borderColor: `${compatibility.color}40`
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterestCompatibility;
