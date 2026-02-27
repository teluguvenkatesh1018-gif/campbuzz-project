const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();

// Get comments for an event
router.get('/:eventId/comments', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('comments.user', 'name email')
      .select('comments');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ comments: event.comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to event
router.post('/:eventId/comments', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const comment = {
      text: req.body.text,
      user: req.user.id,
      createdAt: new Date()
    };

    event.comments.unshift(comment);
    await event.save();

    await event.populate('comments.user', 'name email');

    const newComment = event.comments[0];
    res.status(201).json({ comment: newComment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment
router.delete('/:eventId/comments/:commentId', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const comment = event.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (req.user.role !== 'admin' && comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    event.comments.pull({ _id: req.params.commentId });
    await event.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;