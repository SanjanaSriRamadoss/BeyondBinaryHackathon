/**
 * Matching & Recommendation Service
 * Handles user-activity matching and personalized recommendations
 */

class MatchingService {
  /**
   * Calculate interest overlap between user and activity
   * @param {Array} userInterests - User's interest tags
   * @param {Array} activityInterests - Activity's interest tags
   * @returns {Object} - Overlap score and details
   */
  calculateInterestOverlap(userInterests, activityInterests) {
    if (!userInterests || !activityInterests) {
      return { score: 0, matchedInterests: [], percentage: 0 };
    }

    const userSet = new Set(userInterests.map(i => i.toLowerCase()));
    const activitySet = new Set(activityInterests.map(i => i.toLowerCase()));
    
    const matchedInterests = [...userSet].filter(interest => 
      activitySet.has(interest)
    );
    
    // Calculate percentage based on user's interests
    const percentage = userInterests.length > 0 
      ? (matchedInterests.length / userInterests.length) * 100 
      : 0;
    
    // Score: weighted by number of matches and percentage
    const score = matchedInterests.length * 10 + percentage;
    
    return {
      score: Math.round(score),
      matchedInterests,
      percentage: Math.round(percentage),
      totalMatches: matchedInterests.length
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {Object} point1 - {lat, lng}
   * @param {Object} point2 - {lat, lng}
   * @returns {Number} - Distance in kilometers
   */
  calculateDistance(point1, point2) {
    if (!point1 || !point2) return Infinity;
    
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * 
      Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calculate time relevance score
   * Activities happening soon get higher scores
   */
  calculateTimeScore(activityDate) {
    const now = new Date();
    const activity = new Date(activityDate);
    const daysUntil = (activity - now) / (1000 * 60 * 60 * 24);
    
    // Activities in the past get 0
    if (daysUntil < 0) return 0;
    
    // Optimal window: 2-14 days away
    if (daysUntil >= 2 && daysUntil <= 14) return 100;
    
    // Too soon (less than 2 days)
    if (daysUntil < 2) return 50 + (daysUntil / 2) * 50;
    
    // Too far (more than 14 days) - decreasing score
    return Math.max(0, 100 - (daysUntil - 14) * 5);
  }

  /**
   * Main matching algorithm
   * Scores activities based on multiple factors
   */
  scoreActivity(user, activity) {
    const weights = {
      interests: 0.45,      // 45% weight on interest match
      distance: 0.25,       // 25% weight on proximity
      time: 0.15,           // 15% weight on timing
      popularity: 0.10,     // 10% weight on participant count
      recency: 0.05         // 5% weight on how recently created
    };

    // Interest score
    const interestMatch = this.calculateInterestOverlap(
      user.interests, 
      activity.interests
    );
    const interestScore = Math.min(100, interestMatch.score);

    // Distance score (inverse - closer is better)
    const distance = this.calculateDistance(
      user.location, 
      activity.location
    );
    const distanceScore = distance === Infinity ? 0 : 
      Math.max(0, 100 - (distance * 2)); // Penalty of 2 points per km

    // Time score
    const timeScore = this.calculateTimeScore(activity.date);

    // Popularity score (based on participant count)
    const maxParticipants = activity.maxParticipants || 20;
    const currentParticipants = activity.participants?.length || 0;
    const popularityScore = Math.min(
      100, 
      (currentParticipants / maxParticipants) * 150
    );

    // Recency score (newly created activities get a boost)
    const createdDate = new Date(activity.createdAt);
    const daysOld = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 100 - (daysOld * 10));

    // Calculate weighted total score
    const totalScore = 
      (interestScore * weights.interests) +
      (distanceScore * weights.distance) +
      (timeScore * weights.time) +
      (popularityScore * weights.popularity) +
      (recencyScore * weights.recency);

    return {
      activityId: activity._id,
      totalScore: Math.round(totalScore),
      breakdown: {
        interestScore: Math.round(interestScore),
        distanceScore: Math.round(distanceScore),
        timeScore: Math.round(timeScore),
        popularityScore: Math.round(popularityScore),
        recencyScore: Math.round(recencyScore)
      },
      interestMatch,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      daysUntil: Math.round(
        (new Date(activity.date) - Date.now()) / (1000 * 60 * 60 * 24)
      )
    };
  }

  /**
   * Generate personalized recommendations
   * @param {Object} user - User object with interests and location
   * @param {Array} activities - All available activities
   * @param {Object} options - Filtering options
   * @returns {Array} - Sorted array of recommended activities
   */
  generateRecommendations(user, activities, options = {}) {
    const {
      limit = 20,
      minScore = 30,
      excludeJoined = true,
      excludePast = true
    } = options;

    // Get user's joined activity IDs
    const joinedIds = new Set(
      user.joinedActivities?.map(a => a.toString()) || []
    );

    // Filter activities
    let filteredActivities = activities.filter(activity => {
      // Exclude past activities
      if (excludePast && new Date(activity.date) < new Date()) {
        return false;
      }

      // Exclude activities user created
      if (activity.createdBy.toString() === user._id.toString()) {
        return false;
      }

      // Exclude already joined activities
      if (excludeJoined && joinedIds.has(activity._id.toString())) {
        return false;
      }

      // Exclude full activities
      if (activity.participants?.length >= activity.maxParticipants) {
        return false;
      }

      return true;
    });

    // Score all activities
    const scoredActivities = filteredActivities.map(activity => ({
      ...activity,
      matchData: this.scoreActivity(user, activity)
    }));

    // Filter by minimum score and sort
    const recommendations = scoredActivities
      .filter(a => a.matchData.totalScore >= minScore)
      .sort((a, b) => b.matchData.totalScore - a.matchData.totalScore)
      .slice(0, limit);

    return recommendations;
  }

  /**
   * Find users with similar interests
   * For displaying compatible users in activities
   */
  findMatchedUsers(currentUser, allUsers, options = {}) {
    const { limit = 10, minOverlap = 2 } = options;

    const matchedUsers = allUsers
      .filter(user => user._id.toString() !== currentUser._id.toString())
      .map(user => {
        const overlap = this.calculateInterestOverlap(
          currentUser.interests,
          user.interests
        );

        return {
          ...user,
          interestMatch: overlap
        };
      })
      .filter(user => user.interestMatch.totalMatches >= minOverlap)
      .sort((a, b) => b.interestMatch.score - a.interestMatch.score)
      .slice(0, limit);

    return matchedUsers;
  }

  /**
   * Get compatibility level label
   */
  getCompatibilityLabel(percentage) {
    if (percentage >= 80) return 'Excellent Match';
    if (percentage >= 60) return 'Great Match';
    if (percentage >= 40) return 'Good Match';
    if (percentage >= 20) return 'Moderate Match';
    return 'Some Common Interests';
  }
}

module.exports = new MatchingService();