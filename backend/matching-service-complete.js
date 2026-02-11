/**
 * Complete Matching Service - Firebase Version
 * Handles BOTH activity matching AND user profile matching
 * Integrates with questionnaire data for smart recommendations
 */

const MatchingService = {
  
  // ===== INTEREST & PREFERENCE MATCHING =====
  
  /**
   * Calculate interest overlap between two entities
   * Works for user-activity OR user-user matching
   */
  calculateInterestOverlap(interests1, interests2) {
    if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
      return { score: 0, matchedInterests: [], percentage: 0, totalMatches: 0 };
    }

    const set1 = new Set(interests1.map(i => i.toLowerCase().trim()));
    const set2 = new Set(interests2.map(i => i.toLowerCase().trim()));
    
    const matchedInterests = [...set1].filter(interest => set2.has(interest));
    
    // Calculate percentage based on first entity's interests
    const percentage = interests1.length > 0 
      ? (matchedInterests.length / interests1.length) * 100 
      : 0;
    
    // Score: weighted by number of matches and percentage
    const score = matchedInterests.length * 10 + percentage;
    
    return {
      score: Math.round(score),
      matchedInterests,
      percentage: Math.round(percentage),
      totalMatches: matchedInterests.length
    };
  },
  
  /**
   * Calculate preference compatibility between two users
   * Uses questionnaire preferences for deeper matching
   */
  calculatePreferenceCompatibility(prefs1, prefs2) {
    if (!prefs1 || !prefs2) {
      return 50; // Neutral score if preferences missing
    }

    let compatibilityScore = 0;
    let totalFactors = 0;
    
    // Social style compatibility
    if (prefs1.socialStyle && prefs2.socialStyle) {
      const socialMatch = {
        'extroverted-extroverted': 100,
        'introverted-introverted': 100,
        'extroverted-ambivert': 80,
        'extroverted-balanced': 75,
        'introverted-ambivert': 80,
        'introverted-balanced': 75,
        'balanced-balanced': 90,
        'ambivert-ambivert': 95,
        'extroverted-introverted': 40
      };
      
      const key = [prefs1.socialStyle, prefs2.socialStyle].sort().join('-');
      compatibilityScore += socialMatch[key] || 50;
      totalFactors++;
    }
    
    // Activity level compatibility
    if (prefs1.activityLevel && prefs2.activityLevel) {
      const levels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active'];
      const index1 = levels.indexOf(prefs1.activityLevel);
      const index2 = levels.indexOf(prefs2.activityLevel);
      
      if (index1 !== -1 && index2 !== -1) {
        const diff = Math.abs(index1 - index2);
        compatibilityScore += Math.max(0, 100 - (diff * 30));
        totalFactors++;
      }
    }
    
    // Budget level compatibility
    if (prefs1.budgetLevel && prefs2.budgetLevel) {
      const budgets = ['low', 'medium', 'high', 'flexible'];
      
      if (prefs1.budgetLevel === 'flexible' || prefs2.budgetLevel === 'flexible') {
        compatibilityScore += 90;
      } else {
        const index1 = budgets.indexOf(prefs1.budgetLevel);
        const index2 = budgets.indexOf(prefs2.budgetLevel);
        
        if (index1 !== -1 && index2 !== -1) {
          const diff = Math.abs(index1 - index2);
          compatibilityScore += Math.max(0, 100 - (diff * 25));
        }
      }
      totalFactors++;
    }
    
    // Time preference compatibility
    if (prefs1.timePreference && prefs2.timePreference) {
      if (prefs1.timePreference === prefs2.timePreference || 
          prefs1.timePreference === 'flexible' || 
          prefs2.timePreference === 'flexible') {
        compatibilityScore += 100;
      } else {
        compatibilityScore += 60;
      }
      totalFactors++;
    }
    
    // Day preference compatibility
    if (prefs1.dayPreference && prefs2.dayPreference) {
      if (prefs1.dayPreference === prefs2.dayPreference || 
          prefs1.dayPreference === 'both' || 
          prefs2.dayPreference === 'both') {
        compatibilityScore += 100;
      } else {
        compatibilityScore += 50;
      }
      totalFactors++;
    }
    
    // Group size compatibility
    if (prefs1.preferredGroupSize && prefs2.preferredGroupSize) {
      const sizes = ['small', 'medium', 'large'];
      const index1 = sizes.indexOf(prefs1.preferredGroupSize);
      const index2 = sizes.indexOf(prefs2.preferredGroupSize);
      
      if (index1 !== -1 && index2 !== -1) {
        const diff = Math.abs(index1 - index2);
        compatibilityScore += Math.max(0, 100 - (diff * 25));
        totalFactors++;
      }
    }
    
    return totalFactors > 0 ? Math.round(compatibilityScore / totalFactors) : 50;
  },
  
  // ===== USER PROFILE MATCHING =====
  
  /**
   * Find users with similar interests and compatible preferences
   * Main function for user-to-user matching
   */
  async findMatchedUsers(currentUserId, options = {}) {
    const { limit = 10, minOverlap = 1 } = options;
    
    try {
      // Get current user
      const currentUserDoc = await db.collection('users').doc(currentUserId).get();
      if (!currentUserDoc.exists) {
        console.error('Current user not found');
        return [];
      }
      
      const currentUser = { id: currentUserDoc.id, ...currentUserDoc.data() };
      
      // Get all users who completed questionnaire (excluding current user)
      const usersSnapshot = await db.collection('users')
        .where('questionnaireCompleted', '==', true)
        .get();
      
      const matchedUsers = [];
      
      usersSnapshot.forEach(doc => {
        if (doc.id === currentUserId) return; // Skip current user
        
        const user = { id: doc.id, ...doc.data() };
        
        // Calculate interest overlap
        const interestMatch = this.calculateInterestOverlap(
          currentUser.interests || [],
          user.interests || []
        );
        
        // Calculate preference compatibility
        const preferenceScore = this.calculatePreferenceCompatibility(
          currentUser.preferences || {},
          user.preferences || {}
        );
        
        // Combined score: 60% interests + 40% preferences
        const combinedPercentage = Math.round(
          (interestMatch.percentage * 0.6) + 
          (preferenceScore * 0.4)
        );
        
        matchedUsers.push({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          profilePicture: user.profilePicture,
          bio: user.bio,
          location: user.location,
          interests: user.interests,
          preferences: user.preferences,
          interestMatch: {
            ...interestMatch,
            percentage: combinedPercentage,
            preferenceScore,
            interestPercentage: interestMatch.percentage
          }
        });
      });
      
      // Filter and sort
      return matchedUsers
        .filter(user => {
          return user.interestMatch.totalMatches >= minOverlap || 
                 user.interestMatch.preferenceScore >= 60;
        })
        .sort((a, b) => b.interestMatch.percentage - a.interestMatch.percentage)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error finding matched users:', error);
      return [];
    }
  },
  
  /**
   * Get match explanation between two users
   * Shows why they were matched
   */
  generateMatchExplanation(user1, user2) {
    const interestMatch = this.calculateInterestOverlap(
      user1.interests || [],
      user2.interests || []
    );
    
    const preferenceScore = this.calculatePreferenceCompatibility(
      user1.preferences || {},
      user2.preferences || {}
    );

    const explanation = {
      overallMatch: Math.round(
        (interestMatch.percentage * 0.6) + (preferenceScore * 0.4)
      ),
      reasons: []
    };

    // Shared interests
    if (interestMatch.matchedInterests.length > 0) {
      explanation.reasons.push({
        type: 'interests',
        message: `You share ${interestMatch.matchedInterests.length} interests`,
        details: interestMatch.matchedInterests.slice(0, 5)
      });
    }

    // Similar social style
    if (user1.preferences?.socialStyle === user2.preferences?.socialStyle) {
      explanation.reasons.push({
        type: 'social',
        message: `Both prefer ${user1.preferences.socialStyle} settings`
      });
    }

    // Similar activity level
    if (user1.preferences?.activityLevel === user2.preferences?.activityLevel) {
      explanation.reasons.push({
        type: 'activity',
        message: `Similar activity levels: ${user1.preferences.activityLevel.replace('_', ' ')}`
      });
    }

    // Compatible time preferences
    if (user1.preferences?.timePreference && user2.preferences?.timePreference) {
      if (user1.preferences.timePreference === user2.preferences.timePreference ||
          user1.preferences.timePreference === 'flexible' ||
          user2.preferences.timePreference === 'flexible') {
        explanation.reasons.push({
          type: 'timing',
          message: 'Compatible availability'
        });
      }
    }

    return explanation;
  },
  
  // ===== ACTIVITY MATCHING =====
  
  /**
   * Calculate distance between two coordinates (Haversine formula)
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
  },
  
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  },
  
  /**
   * Calculate time relevance score
   */
  calculateTimeScore(activityDate) {
    const now = new Date();
    const activity = new Date(activityDate);
    const daysUntil = (activity - now) / (1000 * 60 * 60 * 24);
    
    if (daysUntil < 0) return 0;
    if (daysUntil >= 2 && daysUntil <= 14) return 100;
    if (daysUntil < 2) return 50 + (daysUntil / 2) * 50;
    return Math.max(0, 100 - (daysUntil - 14) * 5);
  },
  
  /**
   * Score activity for a specific user
   */
  scoreActivity(user, activity) {
    const weights = {
      interests: 0.45,
      distance: 0.25,
      time: 0.15,
      popularity: 0.10,
      recency: 0.05
    };

    // Interest score
    const interestMatch = this.calculateInterestOverlap(
      user.interests, 
      activity.interests
    );
    const interestScore = Math.min(100, interestMatch.score);

    // Distance score
    const distance = this.calculateDistance(
      user.location, 
      activity.location
    );
    const distanceScore = distance === Infinity ? 0 : 
      Math.max(0, 100 - (distance * 2));

    // Time score
    const timeScore = this.calculateTimeScore(activity.date);

    // Popularity score
    const maxParticipants = activity.maxParticipants || 20;
    const currentParticipants = activity.participants?.length || 0;
    const popularityScore = Math.min(
      100, 
      (currentParticipants / maxParticipants) * 150
    );

    // Recency score
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
      activityId: activity.id,
      totalScore: Math.round(totalScore),
      breakdown: {
        interestScore: Math.round(interestScore),
        distanceScore: Math.round(distanceScore),
        timeScore: Math.round(timeScore),
        popularityScore: Math.round(popularityScore),
        recencyScore: Math.round(recencyScore)
      },
      interestMatch,
      distance: Math.round(distance * 10) / 10,
      daysUntil: Math.round(
        (new Date(activity.date) - Date.now()) / (1000 * 60 * 60 * 24)
      )
    };
  },
  
  /**
   * Generate personalized activity recommendations
   */
  async getRecommendedActivities(userId, options = {}) {
    const {
      limit = 20,
      minScore = 30,
      excludeJoined = true,
      excludePast = true
    } = options;
    
    try {
      // Get current user
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return [];
      
      const user = { id: userDoc.id, ...userDoc.data() };
      
      // Get all activities
      const activitiesSnapshot = await db.collection('activities')
        .where('status', '==', 'active')
        .get();
      
      const activities = [];
      activitiesSnapshot.forEach(doc => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      
      // Filter activities
      const joinedActivityIds = new Set(user.joinedActivities || []);
      
      const filteredActivities = activities.filter(activity => {
        if (excludePast && new Date(activity.date) < new Date()) return false;
        if (activity.createdBy === userId) return false;
        if (excludeJoined && joinedActivityIds.has(activity.id)) return false;
        if (activity.participants?.length >= activity.maxParticipants) return false;
        return true;
      });
      
      // Score all activities
      const scoredActivities = filteredActivities.map(activity => ({
        ...activity,
        matchData: this.scoreActivity(user, activity)
      }));
      
      // Filter by minimum score and sort
      return scoredActivities
        .filter(a => a.matchData.totalScore >= minScore)
        .sort((a, b) => b.matchData.totalScore - a.matchData.totalScore)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error getting recommended activities:', error);
      return [];
    }
  },
  
  // ===== UTILITY METHODS =====
  
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
};

// Make available globally
if (typeof window !== 'undefined') {
  window.MatchingService = MatchingService;
}
