const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const Event = require('../models/Event');

const router = express.Router();

// Get user's favorite events
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.json({ 
      success: true,
      favorites: user.favorites || [] 
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Failed to fetch favorites' });
  }
});

// Add event to favorites - UPDATED to match frontend
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.body; // Get eventId from request body
    const user = await User.findById(req.user.id);
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (!user.favorites.includes(eventId)) {
      user.favorites.push(eventId);
      await user.save();
    }
    
    res.json({ 
      success: true,
      message: 'Event added to favorites', 
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Failed to add to favorites' });
  }
});

// Remove event from favorites
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(fav => fav.toString() !== req.params.eventId);
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Event removed from favorites', 
      favorites: user.favorites 
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Failed to remove from favorites' });
  }
});

module.exports = router;