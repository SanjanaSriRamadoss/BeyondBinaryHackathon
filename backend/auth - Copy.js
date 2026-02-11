const jwt = require('jsonwebtoken');
const Activity = require('../models/Activity');

// Verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

// Check if user owns the activity
exports.checkActivityOwnership = async (req, res, next) => {
  try {
    const activityId = req.params.id;
    const activity = await Activity.findById(activityId);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    if (activity.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own activities.'
      });
    }

    req.activity = activity;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking activity ownership',
      error: error.message
    });
  }
};
