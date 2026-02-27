const mongoose = require('mongoose');

// Import all models
const User = require('./User');
const Event = require('./Event');

// Export all models
module.exports = {
  User,
  Event
};