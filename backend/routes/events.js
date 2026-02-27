const express = require('express');
const Event = require('../models/Event');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;

    const events = await Event.find(query)
      .populate('organizer', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});
// Get registration fields for an event
router.get('/:id/registration-fields', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      registrationFields: event.registrationFields || [],
      registrationOpen: event.isRegistrationOpen(),
      maxParticipants: event.maxParticipants,
      registeredCount: event.registrationCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registration fields', error: error.message });
  }
});

// Update registration fields (Admin only)
router.put('/:id/registration-fields', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { registrationFields } = req.body;
    
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    event.registrationFields = registrationFields;
    await event.save();

    res.json({
      message: 'Registration fields updated successfully',
      registrationFields: event.registrationFields
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating registration fields', error: error.message });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('likes', 'name email')
      .populate('favorites', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
});

// Create event (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.id
    };

    // Convert tags string to array
    if (eventData.tags && typeof eventData.tags === 'string') {
      eventData.tags = eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const event = new Event(eventData);
    await event.save();
    await event.populate('organizer', 'name email');

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
});

// Update event (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const updates = { ...req.body };

    // Convert tags string to array if needed
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('organizer', 'name email');

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
});

// Delete event (Admin only) - FIXED ROUTE
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
});

// Like event
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const hasLiked = event.likes.includes(req.user.id);
    if (hasLiked) {
      event.likes.pull(req.user.id);
    } else {
      event.likes.push(req.user.id);
    }

    await event.save();
    res.json({ 
      message: hasLiked ? 'Event unliked' : 'Event liked',
      likes: event.likes.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating like', error: error.message });
  }
});

// Add to favorites
router.post('/:id/favorite', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const isFavorited = event.favorites.includes(req.user.id);
    if (isFavorited) {
      event.favorites.pull(req.user.id);
    } else {
      event.favorites.push(req.user.id);
    }

    await event.save();
    res.json({ 
      message: isFavorited ? 'Removed from favorites' : 'Added to favorites',
      favorites: event.favorites.length 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating favorites', error: error.message });
  }
});

module.exports = router;