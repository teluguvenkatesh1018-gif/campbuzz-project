const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const Event = require('../models/Event');
const { sendVerificationEmail } = require('../utils/emailService');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// ========== AUTHENTICATION ROUTES ==========

// Login route - ADDED
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        collegeRoll: user.collegeRoll,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile - ADDED
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('badges')
      .populate('eventHistory.event', 'title type date');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register - UPDATED WITH BADGES
router.post('/register', async (req, res) => {
  try {
    const { name, collegeRoll, email, password, role } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ email }, { collegeRoll }] 
    });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email or college roll number' 
      });
    }

    const user = new User({
      name,
      collegeRoll,
      email,
      password,
      role: role || 'student'
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // For development: Auto-verify email
    // For production: Send actual verification email
    if (process.env.NODE_ENV === 'production') {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(user.email, user.name, verificationUrl);
    } else {
      // Auto-verify in development
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        collegeRoll: user.collegeRoll,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    // Add verification badge
    user.addBadge(
      'Email Verified', 
      'Successfully verified email address', 
      'community', 
      '✅'
    );

    await user.save();

    res.json({ message: 'Email verified successfully!' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend Verification Email
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    if (process.env.NODE_ENV === 'production') {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail(user.email, user.name, verificationUrl);
    } else {
      // Auto-verify in development
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
    }

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile - ENHANCED WITH SOCIAL MEDIA
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, collegeRoll, email, phone, department, bio, socialMedia } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if collegeRoll is being changed
    if (collegeRoll && collegeRoll !== user.collegeRoll) {
      const existingUser = await User.findOne({ collegeRoll });
      if (existingUser) {
        return res.status(400).json({ message: 'College roll number already taken' });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (collegeRoll) user.collegeRoll = collegeRoll;
    if (email && email !== user.email) {
      user.email = email;
      user.isEmailVerified = false; // Require re-verification if email changes
      user.generateEmailVerificationToken();
    }
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (bio) user.bio = bio;
    if (socialMedia) {
      user.socialMedia = { ...user.socialMedia, ...socialMedia };
    }

    await user.save();

    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('eventHistory.event', 'title type date')
      .populate('badges');

    res.json(userResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password - FIXED ROUTE
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload avatar
router.post('/upload-avatar', authMiddleware, async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.avatar = avatarUrl;
    await user.save();

    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== NEW AVATAR UPLOAD ROUTE ==========
// Upload avatar via file upload (NEW ROUTE)
router.post('/upload-avatar-file', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Upload to Cloudinary if configured, otherwise use local file
    let avatarUrl;
    
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name') {
      // Upload to Cloudinary
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'campbuzz/avatars',
          width: 200,
          height: 200,
          crop: 'fill'
        });
        avatarUrl = result.secure_url;
        console.log('✅ Avatar uploaded to Cloudinary:', avatarUrl);
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed, using local file:', cloudinaryError);
        avatarUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      // Use local file path (for development)
      avatarUrl = `/uploads/${req.file.filename}`;
      console.log('✅ Avatar saved locally:', avatarUrl);
    }

    user.avatar = avatarUrl;
    await user.save();

    res.json({ 
      success: true, 
      avatar: user.avatar,
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
});

// Add Achievement Badge
router.post('/add-badge', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, icon } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.addBadge(name, description, category, icon);
    await user.save();

    res.json({ message: 'Badge added successfully', badges: user.badges });
  } catch (error) {
    console.error('Add badge error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user event history
router.get('/event-history', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('eventHistory.event', 'title type date venue organizer')
      .populate('eventHistory.event.organizer', 'name collegeRoll')
      .select('eventHistory');

    res.json(user.eventHistory);
  } catch (error) {
    console.error('Get event history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user statistics - ENHANCED
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const eventsCreated = await Event.countDocuments({ organizer: userId });
    const user = await User.findById(userId);
    const favoritesCount = user.favorites ? user.favorites.length : 0;
    const likesCount = await Event.countDocuments({ likes: userId });
    
    let registeredEvents = 0;
    try {
      registeredEvents = await Event.countDocuments({ registeredUsers: userId });
    } catch (error) {
      console.log('Registered users field not found');
    }

    // Enhanced stats
    const enhancedStats = {
      eventsCreated: eventsCreated || 0,
      favoritesCount: favoritesCount || 0,
      likesCount: likesCount || 0,
      registeredEvents: registeredEvents || 0,
      totalPoints: user.totalPoints || 0,
      level: user.level || 1,
      badgesCount: user.badges ? user.badges.length : 0,
      eventHistoryCount: user.eventHistory ? user.eventHistory.length : 0
    };

    res.json(enhancedStats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      eventsCreated: 0,
      favoritesCount: 0,
      likesCount: 0,
      registeredEvents: 0,
      totalPoints: 0,
      level: 1,
      badgesCount: 0,
      eventHistoryCount: 0
    });
  }
});

// Auto-assign badges based on activity
router.post('/check-achievements', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('eventHistory.event')
      .populate('badges');

    const stats = await Event.aggregate([
      { $match: { organizer: user._id } },
      { $group: { _id: null, eventsCreated: { $sum: 1 } } }
    ]);

    const eventsCreated = stats[0]?.eventsCreated || 0;
    const favoritesCount = user.favorites ? user.favorites.length : 0;
    const eventHistoryCount = user.eventHistory ? user.eventHistory.length : 0;

    const newBadges = [];

    // Check for various achievements
    if (eventsCreated >= 1 && !user.badges.some(b => b.name === 'Event Creator')) {
      user.addBadge('Event Creator', 'Created your first event', 'creation', '🎯');
      newBadges.push('Event Creator');
    }

    if (eventsCreated >= 5 && !user.badges.some(b => b.name === 'Event Organizer')) {
      user.addBadge('Event Organizer', 'Created 5+ events', 'creation', '📅');
      newBadges.push('Event Organizer');
    }

    if (favoritesCount >= 10 && !user.badges.some(b => b.name === 'Event Enthusiast')) {
      user.addBadge('Event Enthusiast', 'Favorited 10+ events', 'participation', '❤️');
      newBadges.push('Event Enthusiast');
    }

    if (eventHistoryCount >= 20 && !user.badges.some(b => b.name === 'Active Participant')) {
      user.addBadge('Active Participant', 'Participated in 20+ activities', 'participation', '⚡');
      newBadges.push('Active Participant');
    }

    if (user.totalPoints >= 100 && !user.badges.some(b => b.name === 'Point Master')) {
      user.addBadge('Point Master', 'Earned 100+ points', 'excellence', '⭐');
      newBadges.push('Point Master');
    }

    await user.save();

    res.json({ 
      message: 'Achievements checked', 
      newBadges,
      totalBadges: user.badges.length 
    });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;