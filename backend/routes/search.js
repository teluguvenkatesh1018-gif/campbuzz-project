const express = require('express');
const Event = require('../models/Event');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Advanced event search with filters
router.get('/events', authMiddleware, async (req, res) => {
  try {
    const {
      q = '', // search query
      type = '', // event type
      category = '', // category filter
      dateRange = '', // today, week, month, custom
      startDate = '',
      endDate = '',
      venue = '',
      organizer = '',
      price = '', // free, paid
      status = 'published',
      sortBy = 'date',
      sortOrder = 'asc',
      page = 1,
      limit = 12,
      tags = '',
      distance = '',
      location = ''
    } = req.query;

    // Build search query
    const query = { status: 'published' };

    // Text search across multiple fields
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { venue: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Event type filter
    if (type) {
      query.type = type;
    }

    // Category filter (you might want to map categories to types)
    if (category) {
      query.type = category;
    }

    // Date range filter
    if (dateRange || startDate || endDate) {
      query.date = {};
      
      if (dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        query.date.$gte = today;
        query.date.$lt = tomorrow;
      } else if (dateRange === 'week') {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        query.date.$gte = today;
        query.date.$lte = nextWeek;
      } else if (dateRange === 'month') {
        const today = new Date();
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        query.date.$gte = today;
        query.date.$lte = nextMonth;
      } else if (dateRange === 'upcoming') {
        query.date.$gte = new Date();
      } else if (dateRange === 'past') {
        query.date.$lt = new Date();
      }

      // Custom date range
      if (startDate) {
        query.date.$gte = query.date.$gte || {};
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = query.date.$lte || {};
        query.date.$lte = new Date(endDate);
      }
    }

    // Venue filter
    if (venue) {
      query.venue = { $regex: venue, $options: 'i' };
    }

    // Organizer filter
    if (organizer) {
      query.organizer = organizer;
    }

    // Price filter
    if (price === 'free') {
      query.isPaid = false;
      query.price = 0;
    } else if (price === 'paid') {
      query.isPaid = true;
      query.price = { $gt: 0 };
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case 'date':
        sort = { date: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'created':
        sort = { createdAt: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'title':
        sort = { title: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'popularity':
        sort = { likes: sortOrder === 'desc' ? -1 : 1 };
        break;
      case 'price':
        sort = { price: sortOrder === 'desc' ? -1 : 1 };
        break;
      default:
        sort = { date: 1 };
    }

    // Execute search with pagination
    const events = await Event.find(query)
      .populate('organizer', 'name avatar collegeRoll')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    // Get aggregations for filters
    const typeAggregation = await Event.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const tagAggregation = await Event.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        types: typeAggregation,
        popularTags: tagAggregation
      },
      searchMeta: {
        query: q,
        resultsCount: total,
        hasResults: total > 0
      }
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message
    });
  }
});

// Quick search suggestions
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    // Search events
    const eventResults = await Event.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { venue: { $regex: q, $options: 'i' } }
      ],
      status: 'published'
    })
    .select('title type date venue')
    .limit(5);

    // Search tags
    const tagResults = await Event.aggregate([
      {
        $match: {
          tags: { $regex: q, $options: 'i' },
          status: 'published'
        }
      },
      { $unwind: '$tags' },
      {
        $match: {
          tags: { $regex: q, $options: 'i' }
        }
      },
      { $group: { _id: '$tags' } },
      { $limit: 5 }
    ]);

    const suggestions = [
      ...eventResults.map(event => ({
        type: 'event',
        title: event.title,
        subtitle: `${event.type} • ${new Date(event.date).toLocaleDateString()}`,
        id: event._id
      })),
      ...tagResults.map(tag => ({
        type: 'tag',
        title: tag._id,
        subtitle: 'Popular tag',
        id: tag._id
      }))
    ];

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 8) // Limit total suggestions
    });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search suggestions',
      error: error.message
    });
  }
});

// Get search filters metadata
router.get('/filters', authMiddleware, async (req, res) => {
  try {
    const eventTypes = await Event.distinct('type', { status: 'published' });
    const popularTags = await Event.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    const venueCities = await Event.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$venue', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      filters: {
        eventTypes,
        popularTags: popularTags.map(tag => tag._id),
        venueCities: venueCities.map(venue => venue._id),
        dateRanges: [
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past Events' }
        ],
        priceRanges: [
          { value: 'free', label: 'Free' },
          { value: 'paid', label: 'Paid' }
        ]
      }
    });
  } catch (error) {
    console.error('Filters metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching filter metadata',
      error: error.message
    });
  }
});

module.exports = router;