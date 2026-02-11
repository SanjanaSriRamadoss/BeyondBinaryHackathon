const Activity = require('../models/Activity');

class ActivityService {
  // Create new activity
  async createActivity(activityData, userId) {
    const activity = new Activity({
      ...activityData,
      creator: userId,
      participants: [userId],
      currentParticipants: 1
    });

    await activity.save();
    await activity.populate('creator', 'name email');
    return activity;
  }

  // Get user's activities
  async getUserActivities(userId, filters = {}) {
    const { status, sort } = filters;
    
    let query = { creator: userId };
    if (status) query.status = status;

    let sortOption = { createdAt: -1 };
    if (sort === 'date') sortOption = { date: 1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    return await Activity.find(query)
      .sort(sortOption)
      .populate('creator', 'name email')
      .populate('participants', 'name email');
  }

  // Get single activity
  async getActivityById(activityId) {
    const activity = await Activity.findById(activityId)
      .populate('creator', 'name email interests')
      .populate('participants', 'name email interests');
    
    if (!activity) {
      throw new Error('Activity not found');
    }
    return activity;
  }

  // Update activity
  async updateActivity(activityId, updates, currentActivity) {
    const allowedUpdates = [
      'title', 'description', 'category', 'interests',
      'date', 'time', 'duration', 'location',
      'maxParticipants', 'status', 'isPublic'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Validate maxParticipants
    if (filteredUpdates.maxParticipants && 
        filteredUpdates.maxParticipants < currentActivity.currentParticipants) {
      throw new Error(`Cannot reduce max participants below current count (${currentActivity.currentParticipants})`);
    }

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).populate('creator', 'name email');

    return activity;
  }

  // Delete activity
  async deleteActivity(activityId) {
    await Activity.findByIdAndDelete(activityId);
    return { message: 'Activity deleted successfully' };
  }

  // Get activity statistics
  async getActivityStats(userId) {
    const stats = await Activity.aggregate([
      { $match: { creator: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const total = await Activity.countDocuments({ creator: userId });
    const upcoming = await Activity.countDocuments({ 
      creator: userId, 
      status: 'upcoming',
      date: { $gte: new Date() }
    });

    return {
      total,
      upcoming,
      byStatus: stats
    };
  }
}

module.exports = new ActivityService();
