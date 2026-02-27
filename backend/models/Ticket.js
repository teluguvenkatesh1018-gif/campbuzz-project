const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qrCode: {
    type: String, // Base64 encoded QR code
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'cancelled'],
    default: 'active'
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    seatNumber: String,
    ticketType: {
      type: String,
      default: 'general'
    },
    price: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ event: 1, user: 1 });
ticketSchema.index({ status: 1 });

// Method to check in ticket
ticketSchema.methods.checkIn = function(adminId) {
  this.checkedIn = true;
  this.checkedInAt = new Date();
  this.checkedInBy = adminId;
  this.status = 'used';
  return this.save();
};

module.exports = mongoose.model('Ticket', ticketSchema);