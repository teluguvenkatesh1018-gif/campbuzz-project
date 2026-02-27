const express = require('express');
const QRCode = require('qrcode');
const Event = require('../models/Event');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Generate QR Code for event check-in
router.post('/events/:eventId/generate-qr', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the event organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only event organizer can generate QR codes'
      });
    }

    // Create QR data
    const qrData = {
      eventId: event._id.toString(),
      eventTitle: event.title,
      organizerId: event.organizer.toString(),
      timestamp: new Date().toISOString(),
      type: 'attendance'
    };

    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    res.json({
      success: true,
      message: 'QR code generated successfully',
      qrCode: qrCode,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        venue: event.venue
      }
    });
  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR code',
      error: error.message
    });
  }
});

// Scan QR code and mark attendance
router.post('/events/:eventId/scan-attendance', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Validate QR data
    if (parsedData.type !== 'attendance' || parsedData.eventId !== eventId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code for this event'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is already marked attendance
    if (event.attendance && event.attendance.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this event'
      });
    }

    // Initialize attendance array if not exists
    if (!event.attendance) {
      event.attendance = [];
    }

    // Mark attendance
    event.attendance.push({
      user: req.user.id,
      scannedAt: new Date(),
      method: 'qr_code'
    });

    await event.save();

    // Add to user's event history
    const user = await User.findById(req.user.id);
    if (user && user.addEventToHistory) {
      user.addEventToHistory(eventId, 'attended', 10); // 10 points for attendance
      await user.save();
    }

    res.json({
      success: true,
      message: 'Attendance marked successfully!',
      attendance: {
        event: event.title,
        scannedAt: new Date(),
        user: user.name
      }
    });
  } catch (error) {
    console.error('Attendance scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// Manual attendance marking (Admin only)
router.post('/events/:eventId/manual-attendance', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the event organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only event organizer can mark attendance'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already marked
    if (event.attendance && event.attendance.some(a => a.user.toString() === userId)) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this user'
      });
    }

    // Initialize attendance array if not exists
    if (!event.attendance) {
      event.attendance = [];
    }

    // Mark attendance
    event.attendance.push({
      user: userId,
      scannedAt: new Date(),
      method: 'manual',
      markedBy: req.user.id
    });

    await event.save();

    // Add to user's event history
    if (user.addEventToHistory) {
      user.addEventToHistory(eventId, 'attended', 10);
      await user.save();
    }

    res.json({
      success: true,
      message: `Attendance marked for ${user.name}`,
      attendance: {
        user: user.name,
        scannedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Manual attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking manual attendance',
      error: error.message
    });
  }
});

// Get attendance list for an event
router.get('/events/:eventId/attendance', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('attendance.user', 'name email collegeRoll avatar')
      .populate('organizer', 'name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is organizer or admin
    if (event.organizer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only event organizer can view attendance'
      });
    }

    res.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        venue: event.venue
      },
      attendance: event.attendance || [],
      totalAttendees: event.attendance ? event.attendance.length : 0
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// Get user's attendance history
router.get('/my-attendance', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const events = await Event.find({
      'attendance.user': req.user.id
    })
    .populate('organizer', 'name avatar')
    .sort({ 'attendance.scannedAt': -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Event.countDocuments({
      'attendance.user': req.user.id
    });

    const attendanceHistory = events.map(event => {
      const userAttendance = event.attendance.find(a => a.user.toString() === req.user.id);
      return {
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          venue: event.venue,
          type: event.type
        },
        scannedAt: userAttendance.scannedAt,
        method: userAttendance.method,
        organizer: event.organizer
      };
    });

    res.json({
      success: true,
      attendanceHistory,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalAttendance: total
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance history',
      error: error.message
    });
  }
});

// Export attendance as CSV
router.get('/events/:eventId/attendance/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('attendance.user', 'name email collegeRoll department')
      .populate('organizer', 'name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is organizer
    if (event.organizer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only event organizer can export attendance'
      });
    }

    // Generate CSV content
    let csvContent = 'Name,Email,College Roll,Department,Scanned At,Method\n';
    
    if (event.attendance && event.attendance.length > 0) {
      event.attendance.forEach(record => {
        csvContent += `"${record.user.name}","${record.user.email}","${record.user.collegeRoll}","${record.user.department}","${record.scannedAt}","${record.method}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${event.title}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting attendance',
      error: error.message
    });
  }
});

module.exports = router;