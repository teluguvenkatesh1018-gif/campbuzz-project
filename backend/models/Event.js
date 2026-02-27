const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['workshop', 'hackathon', 'seminar', 'club-activity', 'sports', 'cultural', 'conference', 'webinar', 'competition'],
    required: true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled'],
    default: 'draft'
  },
  maxParticipants: {
    type: Number,
    default: 0 // 0 means unlimited
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  price: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    default: ''
  },
  // NEW: Registration Fields
  registrationFields: [{
    fieldName: {
      type: String,
      required: true
    },
    fieldType: {
      type: String,
      enum: ['text', 'email', 'number', 'select', 'textarea', 'checkbox'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [String] // For select fields
  }],
  registrationOpen: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date
  },
  // Registration tracking
  registeredUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registrationData: mongoose.Schema.Types.Mixed, // Stores custom form data
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    }
  }],
  // Social features
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    text: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Attendance tracking
  attendance: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scannedAt: {
      type: Date,
      default: Date.now
    },
    method: {
      type: String,
      enum: ['qr_code', 'manual'],
      default: 'qr_code'
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Virtual for registration count
eventSchema.virtual('registrationCount').get(function() {
  return this.registeredUsers.filter(reg => reg.status === 'registered').length;
});

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  if (this.maxParticipants === 0) return 'Unlimited';
  const registeredCount = this.registeredUsers.filter(reg => reg.status === 'registered').length;
  return Math.max(0, this.maxParticipants - registeredCount);
});

// Check if registration is open
eventSchema.methods.isRegistrationOpen = function() {
  if (!this.registrationOpen) return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
  if (this.maxParticipants > 0) {
    const registeredCount = this.registeredUsers.filter(reg => reg.status === 'registered').length;
    return registeredCount < this.maxParticipants;
  }
  return true;
};

// Check if user is registered
eventSchema.methods.isUserRegistered = function(userId) {
  return this.registeredUsers.some(reg => 
    reg.user.toString() === userId.toString() && reg.status === 'registered'
  );
};

// Add registration
eventSchema.methods.addRegistration = function(userId, registrationData = {}) {
  if (!this.isRegistrationOpen()) {
    throw new Error('Registration is closed for this event');
  }
  
  if (this.isUserRegistered(userId)) {
    throw new Error('User is already registered for this event');
  }

  this.registeredUsers.push({
    user: userId,
    registrationData: registrationData,
    status: 'registered'
  });

  return this.save();
};

// Remove registration
eventSchema.methods.removeRegistration = function(userId) {
  this.registeredUsers = this.registeredUsers.filter(reg => 
    reg.user.toString() !== userId.toString()
  );
  return this.save();
};

// Update registration status
eventSchema.methods.updateRegistrationStatus = function(userId, status) {
  const registration = this.registeredUsers.find(reg => 
    reg.user.toString() === userId.toString()
  );
  
  if (registration) {
    registration.status = status;
    return this.save();
  }
  
  throw new Error('Registration not found');
};

module.exports = mongoose.model('Event', eventSchema);