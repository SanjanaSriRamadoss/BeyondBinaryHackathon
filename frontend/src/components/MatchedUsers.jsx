/**
 * MatchedUsers Component
 * Displays users with similar interests
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MatchedUsers.css';

const MatchedUsers = ({ activityId = null }) => {
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatchedUsers();
  }, [activityId]);

  const fetchMatchedUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let endpoint;
      if (activityId) {
        // Get matched participants in a specific activity
        endpoint = `/api/recommendations/activity/${activityId}/matched-participants`;
      } else {
        // Get general matched users
        endpoint = '/api/recommendations/matched-users';
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const users = activityId 
        ? response.data.matchedParticipants 
        : response.data.matchedUsers;

      setMatchedUsers(users);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load matched users');
      console.error('Error fetching matched users:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCompatibilityColor = (percentage) => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#6b7280';
  };

  if (loading) {
    return (
      <div className="matched-users-loading">
        <div className="spinner-small"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="matched-users-error">
        <p>{error}</p>
      </div>
    );
  }

  if (matchedUsers.length === 0) {
    return (
      <div className="matched-users-empty">
        <p>No matched users found yet</p>
      </div>
    );
  }

  return (
    <div className="matched-users">
      <h3 className="matched-users-title">
        {activityId ? 'People You Might Connect With' : 'Users Like You'}
      </h3>
      
      <div className="users-list">
        {matchedUsers.map((user) => (
          <div key={user._id} className="user-card">
            {/* Profile Picture */}
            <div className="user-avatar">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="user-info">
              <h4 className="user-name">{user.name}</h4>
              
              {/* Compatibility Badge */}
              <div 
                className="compatibility-badge"
                style={{ 
                  backgroundColor: getCompatibilityColor(
                    user.interestMatch.percentage
                  ) 
                }}
              >
                {user.interestMatch.percentage}% Match
              </div>

              {/* Matched Interests */}
              {user.interestMatch.matchedInterests.length > 0 && (
                <div className="user-interests">
                  <span className="interests-label">Shared interests:</span>
                  <div className="interests-tags">
                    {user.interestMatch.matchedInterests.slice(0, 3).map((interest, idx) => (
                      <span key={idx} className="interest-tag-small">
                        {interest}
                      </span>
                    ))}
                    {user.interestMatch.matchedInterests.length > 3 && (
                      <span className="interest-tag-small more">
                        +{user.interestMatch.matchedInterests.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* View Profile Button */}
            <button 
              className="view-profile-btn"
              onClick={() => window.location.href = `/users/${user._id}`}
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchedUsers;
