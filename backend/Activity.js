const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Sports', 'Music', 'Arts', 'Food', 'Gaming', 'Study', 'Travel', 'Social', 'Other']
  },
  
  interests: [{
    type: String,
    trim: true
  }],
  
  // Date & Time
  date: {
    type: Date,
    required: [true, 'Activity date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Activity date must be in the future'
    }
  },
  
  time: {
    type: String,
    required: [true, 'Activity time is required']
  },
  
  duration: {
    type: Number,
    default: 60
  },
  
  // Location
  location: {
    address: {
      type: String,
      required: [true, 'Location address is required']
    },
    city: {
      type: String,
      required: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Participants
  maxParticipants: {
    type: Number,
    default: 10,
    min: [2, 'Activity must allow at least 2 participants'],
    max: [100, 'Cannot exceed 100 participants']
  },
  
  currentParticipants: {
    type: Number,
    default: 1
  },
  
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Owner Info
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  
  isPublic: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true
});

// Indexes
activitySchema.index({ creator: 1, createdAt: -1 });
activitySchema.index({ date: 1, status: 1 });
activitySchema.index({ category: 1, 'location.city': 1 });

module.exports = mongoose.model('Activity', activitySchema);
