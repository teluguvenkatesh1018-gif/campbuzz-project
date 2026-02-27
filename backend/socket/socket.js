const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const configureSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join admin to admin room if applicable
    if (socket.userRole === 'admin') {
      socket.join('admin_room');
    }

    // Handle event creation notifications
    socket.on('event_created', (data) => {
      socket.to('admin_room').emit('new_event', {
        type: 'NEW_EVENT',
        message: `New event created: ${data.eventTitle}`,
        eventId: data.eventId,
        timestamp: new Date()
      });
    });

    // Handle event registration
    socket.on('event_registered', (data) => {
      socket.to(`user_${data.organizerId}`).emit('event_registration', {
        type: 'EVENT_REGISTRATION',
        message: `${data.userName} registered for your event: ${data.eventTitle}`,
        eventId: data.eventId,
        timestamp: new Date()
      });
    });

    // Handle comments
    socket.on('new_comment', (data) => {
      socket.to(`user_${data.eventOrganizerId}`).emit('event_comment', {
        type: 'NEW_COMMENT',
        message: `${data.userName} commented on your event: ${data.eventTitle}`,
        eventId: data.eventId,
        commentId: data.commentId,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.userId} disconnected`);
    });
  });

  return io;
};

// Utility function to send notifications
const sendNotificationToUser = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('notification', notification);
  }
};

const sendNotificationToAdmins = (notification) => {
  if (io) {
    io.to('admin_room').emit('notification', notification);
  }
};

const sendNotificationToAll = (notification) => {
  if (io) {
    io.emit('notification', notification);
  }
};

module.exports = {
  configureSocket,
  sendNotificationToUser,
  sendNotificationToAdmins,
  sendNotificationToAll,
  getIO: () => io
};