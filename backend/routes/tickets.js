const express = require('express');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const User = require('../models/User');
const QRCodeService = require('../utils/qrGenerator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendNotificationToUser } = require('../socket/socket');

const router = express.Router();

// Generate ticket for event registration
router.post('/events/:eventId/tickets', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists and is published
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate ticket for unpublished event'
      });
    }

    // Check if user already has a ticket
    const existingTicket = await Ticket.findOne({
      event: eventId,
      user: req.user.id,
      status: 'active'
    });

    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: 'You already have a ticket for this event'
      });
    }

    // Generate ticket data
    const user = await User.findById(req.user.id);
    const ticketId = QRCodeService.generateTicketId(eventId, req.user.id);

    const ticketData = {
      ticketId,
      eventId,
      userId: req.user.id,
      eventTitle: event.title,
      userName: user.name,
      timestamp: new Date().toISOString()
    };

    // Generate QR code
    const qrCode = await QRCodeService.generateQRCode(ticketData);

    // Create ticket
    const ticket = new Ticket({
      ticketId,
      event: eventId,
      user: req.user.id,
      qrCode,
      metadata: {
        generatedAt: new Date(),
        ticketType: 'general'
      }
    });

    await ticket.save();
    await ticket.populate('event', 'title date venue');
    await ticket.populate('user', 'name email collegeRoll');

    // Add to user's event history
    user.addEventToHistory(eventId, 'registered', 5); // 5 points for registration
    await user.save();

    // Send notification
    sendNotificationToUser(req.user.id, {
      type: 'TICKET_GENERATED',
      message: `Your ticket for ${event.title} is ready!`,
      eventId: eventId,
      ticketId: ticketId,
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Ticket generated successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        qrCode: ticket.qrCode,
        event: ticket.event,
        status: ticket.status,
        metadata: ticket.metadata
      }
    });
  } catch (error) {
    console.error('Generate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating ticket',
      error: error.message
    });
  }
});

// Check in ticket (Admin only)
router.post('/tickets/:ticketId/checkin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({ ticketId })
      .populate('event', 'title date venue organizer')
      .populate('user', 'name email collegeRoll');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already checked in'
      });
    }

    if (ticket.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not active'
      });
    }

    // Check if event organizer is performing check-in
    if (ticket.event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only event organizer can check in tickets'
      });
    }

    // Perform check-in
    await ticket.checkIn(req.user.id);

    // Add to user's event history
    const user = await User.findById(ticket.user._id);
    user.addEventToHistory(ticket.event._id, 'attended', 10); // 10 points for attendance
    await user.save();

    // Send notification to user
    sendNotificationToUser(ticket.user._id, {
      type: 'CHECKED_IN',
      message: `You've been checked in to ${ticket.event.title}`,
      eventId: ticket.event._id,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Ticket checked in successfully',
      ticket: {
        ticketId: ticket.ticketId,
        event: ticket.event.title,
        user: ticket.user.name,
        checkedInAt: ticket.checkedInAt
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check-in',
      error: error.message
    });
  }
});

// Get user's tickets
router.get('/tickets/my-tickets', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .populate('event', 'title date venue type status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.json({
      success: true,
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalTickets: total
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tickets',
      error: error.message
    });
  }
});

// Verify QR code (for scanning)
router.post('/tickets/verify', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      });
    }

    const verification = QRCodeService.verifyQRCode(qrData);

    if (!verification.isValid) {
      return res.status(400).json({
        success: false,
        message: verification.error
      });
    }

    // Find ticket in database
    const ticket = await Ticket.findOne({ ticketId: verification.data.ticketId })
      .populate('event', 'title date venue organizer')
      .populate('user', 'name email collegeRoll avatar');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found in system'
      });
    }

    res.json({
      success: true,
      message: 'QR code verified successfully',
      ticket: {
        ticketId: ticket.ticketId,
        event: ticket.event,
        user: ticket.user,
        status: ticket.status,
        checkedIn: ticket.checkedIn,
        checkedInAt: ticket.checkedInAt
      },
      canCheckIn: !ticket.checkedIn && ticket.status === 'active'
    });
  } catch (error) {
    console.error('Verify QR error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying QR code',
      error: error.message
    });
  }
});

module.exports = router;