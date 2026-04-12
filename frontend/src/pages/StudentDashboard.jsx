import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI, favoritesAPI, registrationAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EventCalendar from '../components/EventCalendar';
import { toast } from 'react-toastify';

const StudentDashboard = () => {
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    level: 1,
    badgesCount: 0
  });

  useEffect(() => {
    fetchDashboardData();
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      // Adjust endpoint if needed – fallback to local storage
      const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
      setUserStats({
        totalPoints: userProfile.totalPoints || 0,
        level: userProfile.level || 1,
        badgesCount: (userProfile.badges || []).length
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all published events
      const eventsResponse = await eventsAPI.getEvents({ status: 'published' });
      const allEvents = eventsResponse?.data?.events || [];
      setEvents(allEvents);

      // Fetch user's favorites
      const favoritesResponse = await favoritesAPI.getFavorites();
      setFavorites(favoritesResponse?.data?.favorites || []);

      // Fetch user's registered events – ensure array
      let registered = [];
      try {
        const registeredResponse = await registrationAPI.getMyRegistrations();
        registered = registeredResponse?.data || [];
      } catch (err) {
        console.warn('Could not fetch registrations, using empty array', err);
        registered = [];
      }
      setRegisteredEvents(Array.isArray(registered) ? registered : []);

      // Attended events from user's eventHistory (stored in localStorage)
      const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
      const eventHistory = userProfile.eventHistory || [];
      const attended = eventHistory.filter(e => e.action === 'attended').map(e => e.event);
      setAttendedEvents(Array.isArray(attended) ? attended : []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (eventId) => {
    try {
      await favoritesAPI.addFavorite(eventId);
      await fetchDashboardData();
      toast.success('Added to favorites');
    } catch (error) {
      toast.error('Failed to add to favorites');
    }
  };

  const handleRemoveFavorite = async (eventId) => {
    try {
      await favoritesAPI.removeFavorite(eventId);
      await fetchDashboardData();
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await registrationAPI.registerForEvent(eventId);
      toast.success('Registered successfully!');
      await fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  const handleUnregister = async (eventId) => {
    if (window.confirm('Are you sure you want to unregister?')) {
      try {
        await registrationAPI.unregisterFromEvent(eventId);
        toast.success('Unregistered successfully');
        await fetchDashboardData();
      } catch (error) {
        toast.error('Failed to unregister');
      }
    }
  };

  const isEventFavorite = (eventId) => {
    return favorites.some(fav => fav.eventId === eventId || fav._id === eventId);
  };

  const isEventRegistered = (eventId) => {
    return registeredEvents.some(reg => reg._id === eventId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (eventDate) => {
    const now = new Date();
    const eventTime = new Date(eventDate);
    const diff = eventTime - now;
    if (diff <= 0) return 'Event passed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  // Safe filters – ensure arrays exist
  const upcomingEvents = (events || []).filter(event => new Date(event.date) > new Date());
  const myUpcomingEvents = (registeredEvents || []).filter(event => new Date(event.date) > new Date());
  const recommendedEvents = upcomingEvents.filter(event => !isEventRegistered(event._id)).slice(0, 6);
  
  const stats = {
    registered: (registeredEvents || []).length,
    upcomingRegistered: myUpcomingEvents.length,
    attended: (attendedEvents || []).length,
    favorites: (favorites || []).length,
    totalPoints: userStats.totalPoints,
    level: userStats.level
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Student Dashboard</h1>
              <p className="text-blue-100 mt-2">Your personalized campus events hub</p>
            </div>
            <Link
              to="/events"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-md"
            >
              Browse All Events
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
            <div className="text-2xl font-bold">{stats.registered}</div>
            <div className="text-sm text-blue-100">Registered Events</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
            <div className="text-2xl font-bold">{stats.upcomingRegistered}</div>
            <div className="text-sm text-green-100">Upcoming</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-4 text-white">
            <div className="text-2xl font-bold">{stats.attended}</div>
            <div className="text-sm text-purple-100">Attended</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-lg shadow p-4 text-white">
            <div className="text-2xl font-bold">{stats.favorites}</div>
            <div className="text-sm text-pink-100">Favorites</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow p-4 text-white">
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <div className="text-sm text-yellow-100">Points (Lv.{stats.level})</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['overview', 'my-events', 'favorites', 'calendar'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'overview' ? 'Overview' : 
                   tab === 'my-events' ? 'My Events' :
                   tab === 'favorites' ? 'Favorites' : 'Calendar'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">📅 Your Upcoming Events</h3>
                  {myUpcomingEvents.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="text-5xl mb-3">📅</div>
                      <p className="text-gray-600">No upcoming registered events</p>
                      <Link to="/events" className="inline-block mt-3 text-blue-600 hover:underline">Browse Events →</Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {myUpcomingEvents.map((event) => (
                        <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{event.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{event.venue}</p>
                              <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                <span>📅 {formatDate(event.date)}</span>
                                <span>⏰ {getTimeRemaining(event.date)}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUnregister(event._id)}
                                className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-200 transition-colors"
                              >
                                Unregister
                              </button>
                              <Link
                                to={`/event/${event._id}`}
                                className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-sm hover:bg-blue-200 transition-colors"
                              >
                                Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">✨ Recommended For You</h3>
                  {recommendedEvents.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No recommendations available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {recommendedEvents.map((event) => (
                        <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h4>
                            <button
                              onClick={() => 
                                isEventFavorite(event._id) 
                                  ? handleRemoveFavorite(event._id)
                                  : handleAddFavorite(event._id)
                              }
                              className="text-xl hover:scale-110 transition-transform"
                            >
                              {isEventFavorite(event._id) ? '❤️' : '🤍'}
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                          <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                            <span>📅 {formatDate(event.date)}</span>
                            <span>{event.venue}</span>
                          </div>
                          <div className="flex gap-2">
                            {!isEventRegistered(event._id) ? (
                              <button
                                onClick={() => handleRegister(event._id)}
                                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded text-sm hover:opacity-90 transition-colors"
                              >
                                Register
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnregister(event._id)}
                                className="flex-1 bg-red-500 text-white py-2 rounded text-sm hover:bg-red-600 transition-colors"
                              >
                                Registered
                              </button>
                            )}
                            <Link
                              to={`/event/${event._id}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Events Tab */}
            {activeTab === 'my-events' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 My Registered Events</h3>
                {registeredEvents.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">You haven't registered for any events yet.</p>
                    <Link to="/events" className="inline-block mt-3 text-blue-600 hover:underline">Browse Events →</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {registeredEvents.map((event) => (
                      <div key={event._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <p className="text-sm text-gray-600">{formatDate(event.date)} • {event.venue}</p>
                          <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${
                            new Date(event.date) > new Date() 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-0">
                          <Link to={`/event/${event._id}`} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded text-sm hover:bg-blue-200">View Details</Link>
                          {new Date(event.date) > new Date() && (
                            <button onClick={() => handleUnregister(event._id)} className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-sm hover:bg-red-200">Unregister</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">❤️ Favorite Events ({favorites.length})</h3>
                {favorites.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-3">❤️</div>
                    <p className="text-gray-600">No favorite events yet</p>
                    <Link to="/events" className="inline-block mt-3 text-blue-600 hover:underline">Browse Events →</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((fav) => {
                      const event = events.find(e => e._id === fav.eventId || e._id === fav._id);
                      if (!event) return null;
                      return (
                        <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 line-clamp-1">{event.title}</h4>
                            <button onClick={() => handleRemoveFavorite(event._id)} className="text-red-500 hover:scale-110 transition-transform">❤️</button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                          <div className="flex justify-between text-sm text-gray-500 mb-3">
                            <span>📅 {formatDate(event.date)}</span>
                            <span>{event.venue}</span>
                          </div>
                          <div className="flex gap-2">
                            {!isEventRegistered(event._id) ? (
                              <button onClick={() => handleRegister(event._id)} className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700">Register</button>
                            ) : (
                              <button onClick={() => handleUnregister(event._id)} className="flex-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700">Registered</button>
                            )}
                            <Link to={`/event/${event._id}`} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">View</Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📅 Event Calendar</h3>
                <div className="bg-white rounded-lg shadow">
                  <EventCalendar events={events} />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Legend</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-2"></div><span>All Events</span></div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded mr-2"></div><span>Registered Events</span></div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded mr-2"></div><span>Favorite Events</span></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Quick Stats</h4>
                    <div className="text-sm space-y-1">
                      <div>📅 Events this month: {events.filter(e => {
                        const d = new Date(e.date);
                        const now = new Date();
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                      }).length}</div>
                      <div>✅ Registered: {registeredEvents.length}</div>
                      <div>❤️ Favorites: {favorites.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/events" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center hover:opacity-90 transition-colors">
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold">Browse Events</div>
            </Link>
            <Link to="/events?type=workshop" className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg text-center hover:opacity-90">
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold">Workshops</div>
            </Link>
            <Link to="/events?type=hackathon" className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center hover:opacity-90">
              <div className="text-2xl mb-2">💻</div>
              <div className="font-semibold">Hackathons</div>
            </Link>
            <Link to="/profile" className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-lg text-center hover:opacity-90">
              <div className="text-2xl mb-2">👤</div>
              <div className="font-semibold">My Profile</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;