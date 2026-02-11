/**
 * RecommendedActivities Component
 * Displays personalized "Suggested for You" activity feed
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RecommendedActivities.css';

const RecommendedActivities = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    minScore: 30,
    limit: 20
  });

  useEffect(() => {
    fetchRecommendations();
  }, [filters]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // Adjust based on your auth setup
      
      const response = await axios.get('/api/recommendations', {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });

      setRecommendations(response.data.recommendations);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 60) return '#3b82f6'; // Blue
    if (score >= 40) return '#f59e0b'; // Orange
    return '#6b7280'; // Gray
  };

  const getMatchScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Great';
    if (score >= 40) return 'Good';
    return 'Fair';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Finding activities you'll love...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchRecommendations} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="recommended-activities">
      <div className="header">
        <h1>Suggested for You</h1>
        <p className="subtitle">
          Activities matched to your interests and location
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>No recommendations yet</h3>
          <p>Try updating your interests in your profile to get personalized suggestions</p>
        </div>
      ) : (
        <div className="activities-grid">
          {recommendations.map((activity) => (
            <div key={activity._id} className="activity-card">
              {/* Match Score Badge */}
              <div 
                className="match-badge"
                style={{ backgroundColor: getMatchScoreColor(activity.matchScore) }}
              >
                <span className="match-score">{activity.matchScore}</span>
                <span className="match-label">{getMatchScoreLabel(activity.matchScore)} Match</span>
              </div>

              {/* Activity Image */}
              {activity.imageUrl && (
                <div className="activity-image">
                  <img src={activity.imageUrl} alt={activity.title} />
                </div>
              )}

              {/* Activity Content */}
              <div className="activity-content">
                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-description">{activity.description}</p>

                {/* Interest Match Indicator */}
                <div className="interest-match">
                  <div className="match-header">
                    <span className="match-icon">✨</span>
                    <span className="compatibility-label">
                      {activity.compatibilityLabel}
                    </span>
                    <span className="match-percentage">
                      {activity.interestMatch.percentage}%
                    </span>
                  </div>
                  
                  {activity.interestMatch.matchedInterests.length > 0 && (
                    <div className="matched-interests">
                      {activity.interestMatch.matchedInterests.map((interest, idx) => (
                        <span key={idx} className="interest-tag matched">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activity Details */}
                <div className="activity-details">
                  <div className="detail-item">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{formatDate(activity.date)}</span>
                  </div>

                  <div className="detail-item">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>
                      {activity.distance < 1 
                        ? 'Nearby' 
                        : `${activity.distance} km away`}
                    </span>
                  </div>

                  <div className="detail-item">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>
                      {activity.participants.length}/{activity.maxParticipants} joined
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  className="join-button"
                  onClick={() => window.location.href = `/activities/${activity._id}`}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendedActivities;
