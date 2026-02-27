const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Event = require('../models/Event');
const mongoose = require('mongoose');

const router = express.Router();

console.log('!!! LIKES.JS LOADED SUCCESSFULLY! DEBUG MESSAGE!');

// Like an event
router.post('/:eventId/like', authMiddleware, async (req, res) => {
  console.log('!!! LIKE ENDPOINT HIT!');
  console.log('Request received - Event ID:', req.params.eventId);
  console.log('User ID:', req.user.id);

  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    console.log('Looking for event:', eventId);

    // Validate event ID
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      console.log('Invalid event ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format'
      });
    }

    // Find the event
    const event = await Event.findById(eventId);
    if (!event) {
      console.log('Event not found in database');
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    console.log('Event found:', event.title);
    console.log('Current likes:', event.likes ? event.likes.length : 0);

    // Ensure likes array exists
    if (!event.likes) {
      event.likes = [];
      console.log('Initialized empty likes array');
    }

    // Check if user already liked
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = event.likes.some(likeId => 
      likeId.toString() === userObjectId.toString()
    );

    console.log(`User liked status: ${alreadyLiked}`);

    // Update likes using findByIdAndUpdate (bypasses validation issues)
    if (alreadyLiked) {
      // Unlike
      await Event.findByIdAndUpdate(
        eventId,
        { $pull: { likes: userObjectId } }
      );
      console.log('User unliked event');
    } else {
      // Like
      await Event.findByIdAndUpdate(
        eventId,
        { $addToSet: { likes: userObjectId } }
      );
      console.log('User liked event');
    }

    // Get updated event
    const updatedEvent = await Event.findById(eventId);
    console.log('Event updated successfully');
    console.log('New likes count:', updatedEvent.likes.length);

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: updatedEvent.likes.length,
      message: `Event ${alreadyLiked ? 'unliked' : 'liked'} successfully`
    });

  } catch (error) {
    console.error('LIKE ERROR:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    res.status(500).json({
      success: false,
      message: `Like failed: ${error.message}`,
      error: error.message
    });
  }
});

module.exports = router;