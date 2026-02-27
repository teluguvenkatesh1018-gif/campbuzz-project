import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { eventsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import AdvancedFilters from '../components/AdvancedFilters';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    dateRange: '',
    tags: [],
    sortBy: 'date'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvents({ limit: 50 });
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.venue.toLowerCase().includes(searchTerm) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(event => event.type === filters.type);
    }

    // Date range filter
    if (filters.dateRange) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filters.dateRange) {
        case 'today':
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today && eventDate <= nextWeek;
          });
          break;
        case 'month':
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today && eventDate <= nextMonth;
          });
          break;
        case 'past':
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate < today;
          });
          break;
        default:
          break;
      }
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(event =>
        event.tags?.some(tag => filters.tags.includes(tag))
      );
    }

    // Sort events
    switch (filters.sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
        break;
      default:
        break;
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      dateRange: '',
      tags: [],
      sortBy: 'date'
    });
  };

  const getEventTypeIcon = (type) => {
    const icons = {
      workshop: '🔧',
      hackathon: '💻',
      seminar: '🎓',
      'club-activity': '👥',
      sports: '⚽',
      cultural: '🎭',
      conference: '🏛️',
      webinar: '📹',
      competition: '🏆'
    };
    return icons[type] || '🎯';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading events..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Campus Events
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing events, workshops, and activities happening across campus
          </p>
        </div>

        {/* Filters Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-gray-600">
            Showing <span className="font-semibold">{filteredEvents.length}</span> events
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <span>🔍</span>
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <AdvancedFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClear={clearFilters}
          />
        )}

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or check back later for new events.</p>
            <button
              onClick={clearFilters}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                {/* Event Image */}
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
                  {event.image ? (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                      {getEventTypeIcon(event.type)}
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold capitalize">
                      {event.type}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    {event.isPaid ? (
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        ₹{event.price}
                      </span>
                    ) : (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Free
                      </span>
                    )}
                  </div>
                </div>

                {/* Event Content */}
                <div className="p-6">
                  {/* Event Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Event Description */}
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 mr-2">📅</span>
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 mr-2">⏰</span>
                      <span>{formatTime(event.time)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-5 mr-2">📍</span>
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                    {event.collegeName && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="w-5 mr-2">🏫</span>
                        <span>{event.collegeName}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {event.tags.length > 3 && (
                        <span className="text-gray-500 text-xs">
                          +{event.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Registration Info (Admin Only) */}
                  {user?.role === 'admin' && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-blue-700">
                          📊 {event.registeredUsers?.length || 0} registrations
                        </span>
                        {event.maxParticipants > 0 && (
                          <span className="text-green-600 font-medium">
                            {event.maxParticipants - (event.registeredUsers?.length || 0)} spots left
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        ❤️ {event.likes?.length || 0}
                      </span>
                      <span className="flex items-center">
                        ⭐ {event.favorites?.length || 0}
                      </span>
                    </div>
                    <div className="text-right">
                      {event.status === 'published' ? (
                        <span className="text-green-600 font-semibold">• Live</span>
                      ) : (
                        <span className="text-yellow-600 font-semibold">• Draft</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons - ONLY VIEW DETAILS */}
                  <div className="flex space-x-3">
                    <Link
                      to={`/event/${event._id}`}
                      className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button (if needed) */}
        {filteredEvents.length > 0 && filteredEvents.length >= 50 && (
          <div className="text-center mt-8">
            <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors">
              Load More Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;