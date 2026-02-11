const express = require('express');
const router = express.Router();
const activityService = require('../services/activityService');
const { authenticate, checkActivityOwnership } = require('../middleware/auth');
const { createActivityValidation, updateActivityValidation } = require('../validators/activityValidator');
const { validationResult } = require('express-validator');

// All routes require authentication
router.use(authenticate);

// POST /api/activities - Create new activity
router.post('/', createActivityValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const activity = await activityService.createActivity(req.body, req.userId);
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating activity',
      error: error.message
    });
  }
});

// GET /api/activities/my-activities - Get user's activities
router.get('/my-activities', async (req, res) => {
  try {
    const activities = await activityService.getUserActivities(req.userId, req.query);
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
});

// GET /api/activities/stats - Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await activityService.getActivityStats(req.userId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// GET /api/activities/:id - Get single activity
router.get('/:id', async (req, res) => {
  try {
    const activity = await activityService.getActivityById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /api/activities/:id - Update activity (owner only)
router.put('/:id', checkActivityOwnership, updateActivityValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const activity = await activityService.updateActivity(
      req.params.id,
      req.body,
      req.activity
    );
    
    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// DELETE /api/activities/:id - Delete activity (owner only)
router.delete('/:id', checkActivityOwnership, async (req, res) => {
  try {
    await activityService.deleteActivity(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting activity',
      error: error.message
    });
  }
});

module.exports = router;
