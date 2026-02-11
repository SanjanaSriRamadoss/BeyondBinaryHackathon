/**
 * Recommendation Routes
 * API endpoints for matching and recommendations
 */

const express = require('express');
const router = express.Router();
const matchingService = require('../services/matchingService');
const auth = require('../middleware/auth'); // Your auth middleware
const Activity = require('../models/Activity'); // Your Activity model
const User = require('../models/User'); // Your User model

/**
 * GET /api/recommendations
 * Get personalized activity recommendations for the logged-in user
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth middleware sets req.user
    
    // Get query parameters
    const {
      limit = 20,
      minScore = 30,
      excludeJoined = 'true',
      excludePast = 'true'
    } = req.query;

    // Fetch current user with full details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch all available activities
    const activities = await Activity.find()
      .populate('createdBy', 'name profilePicture')
      .populate('participants', 'name profilePicture interests');

    // Generate recommendations
    const recommendations = matchingService.generateRecommendations(
      user,
      activities,
      {
        limit: parseInt(limit),
        minScore: parseInt(minScore),
        excludeJoined: excludeJoined === 'true',
        excludePast: excludePast === 'true'
      }
    );

    res.json({
      success: true,
      count: recommendations.length,
      recommendations: recommendations.map(activity => ({
        _id: activity._id,
        title: activity.title,
        description: activity.description,
        interests: activity.interests,
        date: activity.date,
        location: activity.location,
        createdBy: activity.createdBy,
        participants: activity.participants,
        maxParticipants: activity.maxParticipants,
        imageUrl: activity.imageUrl,
        // Match data
        matchScore: activity.matchData.totalScore,
        interestMatch: activity.matchData.interestMatch,
        distance: activity.matchData.distance,
        daysUntil: activity.matchData.daysUntil,
        compatibilityLabel: matchingService.getCompatibilityLabel(
          activity.matchData.interestMatch.percentage
        ),
        scoreBreakdown: activity.matchData.breakdown
      }))
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      message: error.message 
    });
  }
});

/**
 * GET /api/recommendations/matched-users
 * Find users with similar interests to the logged-in user
 */
router.get('/matched-users', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, minOverlap = 2 } = req.query;

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allUsers = await User.find({ _id: { $ne: userId } })
      .select('name email interests profilePicture location');

    const matchedUsers = matchingService.findMatchedUsers(
      currentUser,
      allUsers,
      {
        limit: parseInt(limit),
        minOverlap: parseInt(minOverlap)
      }
    );

    res.json({
      success: true,
      count: matchedUsers.length,
      matchedUsers: matchedUsers.map(user => ({
        _id: user._id,
        name: user.name,
        profilePicture: user.profilePicture,
        interests: user.interests,
        location: user.location,
        interestMatch: user.interestMatch,
        compatibilityLabel: matchingService.getCompatibilityLabel(
          user.interestMatch.percentage
        )
      }))
    });

  } catch (error) {
    console.error('Error finding matched users:', error);
    res.status(500).json({ 
      error: 'Failed to find matched users',
      message: error.message 
    });
  }
});

/**
 * POST /api/recommendations/score-activity
 * Get match score for a specific activity
 * Useful for showing compatibility on activity detail pages
 */
router.post('/score-activity', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityId } = req.body;

    if (!activityId) {
      return res.status(400).json({ error: 'Activity ID is required' });
    }

    const user = await User.findById(userId);
    const activity = await Activity.findById(activityId)
      .populate('participants', 'name profilePicture interests');

    if (!user || !activity) {
      return res.status(404).json({ error: 'User or activity not found' });
    }

    const matchData = matchingService.scoreActivity(user, activity);

    res.json({
      success: true,
      activityId,
      matchScore: matchData.totalScore,
      interestMatch: matchData.interestMatch,
      distance: matchData.distance,
      daysUntil: matchData.daysUntil,
      compatibilityLabel: matchingService.getCompatibilityLabel(
        matchData.interestMatch.percentage
      ),
      scoreBreakdown: matchData.breakdown
    });

  } catch (error) {
    console.error('Error scoring activity:', error);
    res.status(500).json({ 
      error: 'Failed to score activity',
      message: error.message 
    });
  }
});

/**
 * GET /api/recommendations/activity/:activityId/matched-participants
 * Get users in an activity who match your interests
 */
router.get('/activity/:activityId/matched-participants', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityId } = req.params;

    const currentUser = await User.findById(userId);
    const activity = await Activity.findById(activityId)
      .populate('participants', 'name profilePicture interests');

    if (!currentUser || !activity) {
      return res.status(404).json({ error: 'User or activity not found' });
    }

    // Find matched participants
    const participants = activity.participants.filter(
      p => p._id.toString() !== userId
    );

    const matchedParticipants = participants.map(participant => {
      const overlap = matchingService.calculateInterestOverlap(
        currentUser.interests,
        participant.interests
      );

      return {
        _id: participant._id,
        name: participant.name,
        profilePicture: participant.profilePicture,
        interests: participant.interests,
        interestMatch: overlap,
        compatibilityLabel: matchingService.getCompatibilityLabel(
          overlap.percentage
        )
      };
    }).sort((a, b) => b.interestMatch.score - a.interestMatch.score);

    res.json({
      success: true,
      activityId,
      count: matchedParticipants.length,
      matchedParticipants
    });

  } catch (error) {
    console.error('Error finding matched participants:', error);
    res.status(500).json({ 
      error: 'Failed to find matched participants',
      message: error.message 
    });
  }
});

module.exports = router;