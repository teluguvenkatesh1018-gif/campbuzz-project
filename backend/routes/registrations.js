const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Register for event
router.post('/events/:eventId/register', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { registrationData = {} } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if registration is open
    if (!event.isRegistrationOpen()) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this event'
      });
    }

    // Check if already registered
    if (event.isUserRegistered(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event'
      });
    }

    // Add registration
    await event.addRegistration(req.user.id, registrationData);

    // Populate the updated event
    const updatedEvent = await Event.findById(eventId)
      .populate('organizer', 'name email')
      .populate('registeredUsers.user', 'name email collegeRoll avatar');

    // Add to user's event history
    const user = await User.findById(req.user.id);
    user.addEventToHistory(eventId, 'registered', 5); // 5 points for registration
    await user.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: `Registration Confirmed - ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🎉 Registration Confirmed!</h2>
            <p>Hello ${user.name},</p>
            <p>Your registration for <strong>${event.title}</strong> has been confirmed.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Event Details:</h3>
              <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${event.time}</p>
              <p><strong>Venue:</strong> ${event.venue}</p>
            </div>
            <p>We look forward to seeing you there!</p>
            <p>Best regards,<br>The CampBuzz Team</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Successfully registered for the event',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to register for event'
    });
  }
});

// Unregister from event
router.delete('/events/:eventId/unregister', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is registered
    if (!event.isUserRegistered(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not registered for this event'
      });
    }

    // Remove registration
    await event.removeRegistration(req.user.id);

    res.json({
      success: true,
      message: 'Successfully unregistered from the event'
    });

  } catch (error) {
    console.error('Unregistration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister from event'
    });
  }
});

// Get event registrations (Admin only)
router.get('/events/:eventId/registrations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const event = await Event.findById(eventId)
      .populate({
        path: 'registeredUsers.user',
        select: 'name email collegeRoll phone department avatar'
      })
      .populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the event organizer or admin
    if (event.organizer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only event organizer can view registrations'
      });
    }

    let registrations = event.registeredUsers;

    // Filter by status if provided
    if (status) {
      registrations = registrations.filter(reg => reg.status === status);
    }

    // Sort by registration date
    registrations.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedRegistrations = registrations.slice(startIndex, endIndex);

    res.json({
      success: true,
      registrations: paginatedRegistrations,
      event: {
        id: event._id,
        title: event.title,
        maxParticipants: event.maxParticipants,
        registrationCount: event.registrationCount,
        availableSpots: event.availableSpots
      },
      pagination: {
        total: registrations.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(registrations.length / limit)
      }
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations'
    });
  }
});

// Update registration status (Admin only)
router.put('/events/:eventId/registrations/:userId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { status } = req.body;

    if (!['registered', 'attended', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the event organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only event organizer can update registration status'
      });
    }

    await event.updateRegistrationStatus(userId, status);

    // If marking as attended, add to attendance and award points
    if (status === 'attended') {
      const user = await User.findById(userId);
      user.addEventToHistory(eventId, 'attended', 10);
      await user.save();
    }

    res.json({
      success: true,
      message: `Registration status updated to ${status}`
    });

  } catch (error) {
    console.error('Update registration status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update registration status'
    });
  }
});

// Export registrations as CSV (Admin only)
router.get('/events/:eventId/registrations/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('registeredUsers.user', 'name email collegeRoll phone department')
      .populate('organizer', 'name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the event organizer
    if (event.organizer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only event organizer can export registrations'
      });
    }

    // Generate CSV content
    let csvContent = 'Name,Email,College Roll,Phone,Department,Registered At,Status\n';
    
    event.registeredUsers.forEach(registration => {
      const user = registration.user;
      csvContent += `"${user.name}","${user.email}","${user.collegeRoll}","${user.phone}","${user.department}","${registration.registeredAt}","${registration.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=registrations-${event.title}-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export registrations'
    });
  }
});

// Get user's registered events
router.get('/my-registrations', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const events = await Event.find({
      'registeredUsers.user': req.user.id,
      ...(status && { 'registeredUsers.status': status })
    })
    .populate('organizer', 'name avatar')
    .sort({ date: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Event.countDocuments({
      'registeredUsers.user': req.user.id,
      ...(status && { 'registeredUsers.status': status })
    });

    const registrations = events.map(event => {
      const registration = event.registeredUsers.find(reg => 
        reg.user.toString() === req.user.id
      );
      return {
        event: {
          id: event._id,
          title: event.title,
          date: event.date,
          time: event.time,
          venue: event.venue,
          type: event.type,
          organizer: event.organizer
        },
        registration: {
          registeredAt: registration.registeredAt,
          status: registration.status,
          registrationData: registration.registrationData
        }
      };
    });

    res.json({
      success: true,
      registrations,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalRegistrations: total
    });

  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your registrations'
    });
  }
});

module.exports = router;