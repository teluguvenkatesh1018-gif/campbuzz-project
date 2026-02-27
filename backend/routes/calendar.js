const express = require('express');
const Event = require('../models/Event');
const CalendarService = require('../utils/calendarExport');
const { authMiddleware } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Export event to iCal file
router.get('/events/:eventId/export/ical', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const user = await require('../models/User').findById(req.user.id);
    const icsFile = await CalendarService.createICSFile(event, user);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${icsFile.filename}"`);

    // Send file and clean up
    res.send(icsFile.content);

    // Clean up temp file after sending
    setTimeout(() => {
      if (fs.existsSync(icsFile.filepath)) {
        fs.unlinkSync(icsFile.filepath);
      }
    }, 5000);

  } catch (error) {
    console.error('iCal export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting event to calendar',
      error: error.message
    });
  }
});

// Get calendar links for all platforms
router.get('/events/:eventId/calendar-links', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate('organizer', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const links = {
      google: CalendarService.generateGoogleCalendarUrl(event),
      outlook: CalendarService.generateOutlookCalendarUrl(event),
      apple: `/api/calendar/events/${eventId}/export/ical`,
      ics: `/api/calendar/events/${eventId}/export/ical`
    };

    res.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue
      },
      calendarLinks: links
    });
  } catch (error) {
    console.error('Calendar links error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating calendar links',
      error: error.message
    });
  }
});

// Add event to user's personal calendar (stores in user profile)
router.post('/events/:eventId/add-to-calendar', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarType = 'personal' } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    // Check if event already in calendar
    const existingCalendarItem = user.calendarEvents.find(
      item => item.event.toString() === eventId
    );

    if (existingCalendarItem) {
      return res.status(400).json({
        success: false,
        message: 'Event already in your calendar'
      });
    }

    // Add to user's calendar
    user.calendarEvents.push({
      event: eventId,
      addedAt: new Date(),
      calendarType,
      reminders: [
        { type: 'email', time: '1 hour before', sent: false },
        { type: 'push', time: '30 minutes before', sent: false }
      ]
    });

    await user.save();

    // Add to event history
    user.addEventToHistory(eventId, 'added_to_calendar', 1);
    await user.save();

    res.json({
      success: true,
      message: 'Event added to your calendar',
      calendarEvent: {
        event: eventId,
        addedAt: new Date(),
        reminders: ['1 hour before', '30 minutes before']
      }
    });
  } catch (error) {
    console.error('Add to calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding event to calendar',
      error: error.message
    });
  }
});

// Get user's calendar events
router.get('/my-calendar', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    const User = require('../models/User');
    const user = await User.findById(req.user.id)
      .populate({
        path: 'calendarEvents.event',
        select: 'title date time venue type description organizer status',
        populate: {
          path: 'organizer',
          select: 'name avatar'
        }
      })
      .select('calendarEvents');

    let calendarEvents = user.calendarEvents;

    // Filter by date range if provided
    if (startDate && endDate) {
      calendarEvents = calendarEvents.filter(item => {
        const eventDate = new Date(item.event.date);
        return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
      });
    }

    // Sort by event date
    calendarEvents.sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedEvents = calendarEvents.slice(startIndex, endIndex);

    res.json({
      success: true,
      calendarEvents: paginatedEvents,
      totalEvents: calendarEvents.length,
      totalPages: Math.ceil(calendarEvents.length / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching calendar events',
      error: error.message
    });
  }
});

// Remove event from calendar
router.delete('/events/:eventId/remove-from-calendar', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    const User = require('../models/User');
    const user = await User.findById(req.user.id);

    // Remove from calendar
    user.calendarEvents = user.calendarEvents.filter(
      item => item.event.toString() !== eventId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Event removed from your calendar'
    });
  } catch (error) {
    console.error('Remove from calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing event from calendar',
      error: error.message
    });
  }
});

// Sync user calendar with external services (webhook)
router.post('/sync/external', authMiddleware, async (req, res) => {
  try {
    const { service, action } = req.body; // google, outlook, apple

    // This would typically integrate with external calendar APIs
    // For now, we'll just acknowledge the request

    res.json({
      success: true,
      message: `Calendar sync with ${service} initiated`,
      syncId: `sync_${Date.now()}`,
      status: 'pending'
    });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing calendar',
      error: error.message
    });
  }
});

module.exports = router;