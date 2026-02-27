const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const registrationRoutes = require('./routes/registrations');
require('dotenv').config();


const app = express();
const server = http.createServer(app);

// Configure Socket.IO for real-time features
let io;
try {
  const { configureSocket } = require('./socket/socket');
  io = configureSocket(server);
  console.log('✅ Socket.IO configured successfully');
} catch (error) {
  console.log('⚠️ Socket.IO not configured - run: npm install socket.io');
  io = null;
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/registrations', registrationRoutes);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/campbuzz';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed through app termination');
  process.exit(0);
});

// Import routes
console.log('🔄 Loading API routes...');

// Core routes
const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const commentsRoutes = require('./routes/comments');
const likesRoutes = require('./routes/likes');
const otpRoutes = require('./routes/otp');
const favoritesRoutes = require('./routes/favorites');
const attendanceRoutes = require('./routes/attendance');

// New enhancement routes
const ticketsRoutes = require('./routes/tickets');
const calendarRoutes = require('./routes/calendar');
const searchRoutes = require('./routes/search');

console.log('✅ All routes loaded successfully');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/attendance', attendanceRoutes);

// New enhancement routes
app.use('/api/tickets', ticketsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/search', searchRoutes);

// Basic API information route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎓 CampBuzz API Server is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      comments: '/api/comments',
      tickets: '/api/tickets',
      likes: '/api/likes',
      favorites: '/api/favorites',
      otp: '/api/otp',
      calendar: '/api/calendar',
      search: '/api/search'
    },
    features: {
      realTime: io ? 'enabled' : 'disabled',
      calendarExport: 'enabled',
      advancedSearch: 'enabled',
      qrTickets: 'enabled'
    }
  });
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    realTime: io ? 'Enabled' : 'Disabled',
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(healthStatus);
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    service: 'CampBuzz Backend API',
    version: '1.0.0',
    status: 'operational',
    features: {
      authentication: 'enabled',
      realTime: io ? 'enabled' : 'disabled',
      fileUpload: 'enabled',
      qrTickets: 'enabled',
      calendarExport: 'enabled',
      advancedSearch: 'enabled',
      notifications: 'enabled'
    },
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor(process.uptime()) + ' seconds'
    }
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Global Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate field value: ${field}. Please use another value.`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please log in again.'
    });
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field. Please check your upload.'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    suggestion: 'Check the API documentation for available endpoints'
  });
});

// General 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableRoutes: {
      api: '/api',
      health: '/health',
      status: '/api/status'
    }
  });
});

// Security headers middleware
app.use((req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
});

// Server startup
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎓 CAMPBUZZ BACKEND SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log(`🚀 Server running on port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💾 Database: ${MONGODB_URI}`);
  console.log(`🔌 Real-time: ${io ? 'Socket.IO enabled' : 'Disabled - install socket.io'}`);
  console.log(`📊 API URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📋 API Status: http://localhost:${PORT}/api/status`);
  console.log('='.repeat(60));
  console.log('✨ Features Available:');
  console.log('   ✅ User Authentication & Authorization');
  console.log('   ✅ Event Management (CRUD)');
  console.log('   ✅ Real-time Notifications');
  console.log('   ✅ QR Code Ticketing System');
  console.log('   ✅ Comments & Likes System');
  console.log('   ✅ Favorites & Bookmarks');
  console.log('   ✅ Calendar Export & Integration');
  console.log('   ✅ Advanced Search & Filters');
  console.log('   ✅ File Upload (Avatars)');
  console.log('   ✅ Email & OTP Services');
  console.log('   ✅ Gamification (Badges & Points)');
  console.log('='.repeat(60) + '\n');
});

// Export for testing purposes
module.exports = { app, server, io };