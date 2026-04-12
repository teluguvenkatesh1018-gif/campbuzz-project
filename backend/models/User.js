const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  collegeRoll: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  // Phone Verification
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  // Social Media Links
  socialMedia: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    twitter: { type: String, default: '' },
    portfolio: { type: String, default: '' }
  },
  // Achievement Badges
  badges: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: '🏆'
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['participation', 'creation', 'excellence', 'community'],
      default: 'participation'
    }
  }],
  // Event History
  eventHistory: [{
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'attended', 'liked', 'favorited', 'registered', 'commented', 'added_to_calendar'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      default: 0
    }
  }],
  // User Stats
  totalPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  // NEW: Calendar Integration
  calendarEvents: [{
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    calendarType: {
      type: String,
      enum: ['personal', 'google', 'outlook', 'apple'],
      default: 'personal'
    },
    reminders: [{
      type: {
        type: String,
        enum: ['email', 'push', 'sms'],
        default: 'email'
      },
      time: {
        type: String,
        enum: ['1 day before', '2 hours before', '1 hour before', '30 minutes before', '15 minutes before'],
        default: '1 hour before'
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    }],
    customNotes: {
      type: String,
      maxlength: 500
    }
  }],
  // NEW: Search Preferences
  searchPreferences: {
    preferredEventTypes: [{
      type: String,
      enum: ['workshop', 'hackathon', 'seminar', 'club-activity', 'sports', 'cultural', 'conference', 'webinar', 'competition']
    }],
    notificationSettings: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      eventReminders: { type: Boolean, default: true },
      newEventsInPreferredTypes: { type: Boolean, default: true }
    },
    savedSearches: [{
      name: String,
      query: String,
      filters: mongoose.Schema.Types.Mixed,
      createdAt: { type: Date, default: Date.now }
    }]
  },
  // NEW: Privacy Settings
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    showEventHistory: { type: Boolean, default: true },
    showBadges: { type: Boolean, default: true }
  },
  // NEW: Account Status
  accountStatus: {
    isActive: { type: Boolean, default: true },
    suspendedUntil: Date,
    suspensionReason: String,
    lastActive: { type: Date, default: Date.now }
  },
  // NEW: Statistics
  statistics: {
    eventsCreated: { type: Number, default: 0 },
    eventsAttended: { type: Number, default: 0 },
    commentsPosted: { type: Number, default: 0 },
    likesGiven: { type: Number, default: 0 },
    favoritesAdded: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastActivityDate: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Add achievement badge
userSchema.methods.addBadge = function(badgeName, description, category = 'participation', icon = '🏆') {
  this.badges.push({
    name: badgeName,
    description: description,
    icon: icon,
    category: category,
    earnedAt: new Date()
  });
  
  // Auto-calculate level based on badges
  this.level = Math.floor(this.badges.length / 5) + 1;
};

// Add event to history
userSchema.methods.addEventToHistory = function(eventId, action, points = 0) {
  this.eventHistory.push({
    event: eventId,
    action: action,
    points: points
  });
  
  this.totalPoints += points;
  
  // Update statistics
  this.updateStatistics(action);
  
  // Update last active
  this.accountStatus.lastActive = new Date();
};

// Update user statistics
userSchema.methods.updateStatistics = function(action) {
  if (!this.statistics) {
    this.statistics = {
      eventsCreated: 0,
      eventsAttended: 0,
      commentsPosted: 0,
      likesGiven: 0,
      favoritesAdded: 0,
      streakDays: 0,
      lastActivityDate: new Date()
    };
  }
  
  switch (action) {
    case 'created':
      this.statistics.eventsCreated += 1;
      break;
    case 'attended':
      this.statistics.eventsAttended += 1;
      break;
    case 'commented':
      this.statistics.commentsPosted += 1;
      break;
    case 'liked':
      this.statistics.likesGiven += 1;
      break;
    case 'favorited':
      this.statistics.favoritesAdded += 1;
      break;
  }
  
  // Update streak
  this.updateStreak();
};

// Update user streak
userSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.statistics.lastActivityDate 
    ? new Date(this.statistics.lastActivityDate) 
    : null;
  
  if (lastActivity) {
    lastActivity.setHours(0, 0, 0, 0);
    const diffTime = today - lastActivity;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day
      this.statistics.streakDays += 1;
    } else if (diffDays > 1) {
      // Streak broken
      this.statistics.streakDays = 1;
    }
    // diffDays === 0 means same day, no change
  } else {
    // First activity
    this.statistics.streakDays = 1;
  }
  
  this.statistics.lastActivityDate = new Date();
};

// Check if event is in user's calendar
userSchema.methods.hasEventInCalendar = function(eventId) {
  return this.calendarEvents.some(calEvent => 
    calEvent.event.toString() === eventId
  );
};

// Add event to calendar
userSchema.methods.addToCalendar = function(eventId, calendarType = 'personal', reminders = []) {
  if (this.hasEventInCalendar(eventId)) {
    throw new Error('Event already in calendar');
  }
  
  this.calendarEvents.push({
    event: eventId,
    calendarType,
    reminders: reminders.length > 0 ? reminders : [
      { type: 'email', time: '1 hour before' },
      { type: 'push', time: '30 minutes before' }
    ]
  });
};

// Remove event from calendar
userSchema.methods.removeFromCalendar = function(eventId) {
  this.calendarEvents = this.calendarEvents.filter(
    calEvent => calEvent.event.toString() !== eventId
  );
};

// Add search preference
userSchema.methods.addSearchPreference = function(eventType) {
  if (!this.searchPreferences.preferredEventTypes.includes(eventType)) {
    this.searchPreferences.preferredEventTypes.push(eventType);
  }
};

// Save search query
userSchema.methods.saveSearch = function(name, query, filters = {}) {
  this.searchPreferences.savedSearches.push({
    name,
    query,
    filters,
    createdAt: new Date()
  });
  
  // Keep only last 10 saved searches
  if (this.searchPreferences.savedSearches.length > 10) {
    this.searchPreferences.savedSearches = this.searchPreferences.savedSearches.slice(-10);
  }
};

// Virtual for full user profile URL
userSchema.virtual('profileUrl').get(function() {
  return `/profile/${this.collegeRoll}`;
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ collegeRoll: 1 });
userSchema.index({ 'accountStatus.lastActive': -1 });
userSchema.index({ 'statistics.streakDays': -1 });
userSchema.index({ totalPoints: -1 });

// Transform output to remove password and add virtuals
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.emailVerificationToken;
    return ret;
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);