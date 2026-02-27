import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventsAPI, favoritesAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EventCalendar from '../components/EventCalendar';

const StudentDashboard = () => {
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Simulated data - in real app, this would come from APIs
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all events
      const eventsResponse = await eventsAPI.getEvents();
      const allEvents = eventsResponse.data.events || [];
      setEvents(allEvents);

      // Fetch user's favorites
      const favoritesResponse = await favoritesAPI.getFavorites();
      setFavorites(favoritesResponse.data.favorites || []);

      // Simulate registered events (you'll need to implement registration API)
      const registered = allEvents
        .filter(event => Math.random() > 0.7) // Random simulation
        .slice(0, 5);
      setRegisteredEvents(registered);

      // Simulate attended events
      const attended = allEvents
        .filter(event => new Date(event.date) < new Date() && Math.random() > 0.5)
        .slice(0, 3);
      setAttendedEvents(attended);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFavorite = async (eventId) => {
    try {
      await favoritesAPI.addFavorite(eventId);
      fetchDashboardData();
      alert('Event added to favorites!');
    } catch (error) {
      console.error('Error adding favorite:', error);
      alert('Failed to add to favorites');
    }
  };

  const handleRemoveFavorite = async (eventId) => {
    try {
      await favoritesAPI.removeFavorite(eventId);
      fetchDashboardData();
      alert('Event removed from favorites!');
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove from favorites');
    }
  };

  const handleRegisterForEvent = async (eventId) => {
    try {
      // You'll need to implement this API endpoint
      await eventsAPI.registerForEvent(eventId);
      alert('Successfully registered for event!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Failed to register for event');
    }
  };

  const handleUnregisterFromEvent = async (eventId) => {
    try {
      // You'll need to implement this API endpoint
      await eventsAPI.unregisterFromEvent(eventId);
      alert('Successfully unregistered from event!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error unregistering from event:', error);
      alert('Failed to unregister from event');
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

  // Filter events
  const upcomingEvents = events.filter(event => new Date(event.date) > new Date());
  const pastEvents = events.filter(event => new Date(event.date) <= new Date());
  const featuredEvents = events.filter(event => event.status === 'published').slice(0, 6);
  const myUpcomingEvents = registeredEvents.filter(event => new Date(event.date) > new Date());
  const missedEvents = pastEvents.filter(event => 
    !attendedEvents.some(attended => attended._id === event._id) &&
    registeredEvents.some(reg => reg._id === event._id)
  );

  // Statistics
  const stats = {
    totalRegistered: registeredEvents.length,
    upcomingRegistered: myUpcomingEvents.length,
    attended: attendedEvents.length,
    missed: missedEvents.length,
    favorites: favorites.length,
    totalEvents: events.length
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="text-gray-600 mt-2">Your personalized campus events hub</p>
            </div>
            <div className="flex space-x-3">
              <Link
                to="/events"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse All Events
              </Link>
              <button
                onClick={fetchDashboardData}
                className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRegistered}</div>
            <div className="text-sm text-gray-600">Registered</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.upcomingRegistered}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.attended}</div>
            <div className="text-sm text-gray-600">Attended</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.missed}</div>
            <div className="text-sm text-gray-600">Missed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.favorites}</div>
            <div className="text-sm text-gray-600">Favorites</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.totalEvents}</div>
            <div className="text-sm text-gray-600">Total Events</div>
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
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Upcoming Registered Events */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Upcoming Events</h3>
                  {myUpcomingEvents.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="text-gray-400 text-4xl mb-2">📅</div>
                      <p className="text-gray-600">No upcoming registered events</p>
                      <Link
                        to="/events"
                        className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Browse Events →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {myUpcomingEvents.map((event) => (
                        <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{event.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{event.venue}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>📅 {formatDate(event.date)}</span>
                                <span>⏰ {getTimeRemaining(event.date)}</span>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleUnregisterFromEvent(event._id)}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                              >
                                Unregister
                              </button>
                              <Link
                                to={`/event/${event._id}`}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
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

                {/* Recommended Events */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recommended For You</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredEvents.slice(0, 3).map((event) => (
                      <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <button
                            onClick={() => 
                              isEventFavorite(event._id) 
                                ? handleRemoveFavorite(event._id)
                                : handleAddFavorite(event._id)
                            }
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            {isEventFavorite(event._id) ? '❤️' : '🤍'}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                          <span>📅 {formatDate(event.date)}</span>
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex space-x-2">
                          {!isEventRegistered(event._id) ? (
                            <button
                              onClick={() => handleRegisterForEvent(event._id)}
                              className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Register
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnregisterFromEvent(event._id)}
                              className="flex-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700 transition-colors"
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
                </div>
              </div>
            )}

            {/* My Events Tab */}
            {activeTab === 'my-events' && (
              <div className="space-y-6">
                {/* Registered Events */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Registered Events ({registeredEvents.length})</h3>
                  {registeredEvents.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">You haven't registered for any events yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {registeredEvents.map((event) => (
                        <div key={event._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div>
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-600">{formatDate(event.date)} • {event.venue}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              new Date(event.date) > new Date() 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Link
                              to={`/event/${event._id}`}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                            >
                              View
                            </Link>
                            {new Date(event.date) > new Date() && (
                              <button
                                onClick={() => handleUnregisterFromEvent(event._id)}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                              >
                                Unregister
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attendance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Events Attended</h4>
                    {attendedEvents.length === 0 ? (
                      <p className="text-green-600">No events attended yet</p>
                    ) : (
                      <div className="space-y-2">
                        {attendedEvents.map((event) => (
                          <div key={event._id} className="text-sm text-green-700">
                            ✅ {event.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Events Missed</h4>
                    {missedEvents.length === 0 ? (
                      <p className="text-red-600">No missed events</p>
                    ) : (
                      <div className="space-y-2">
                        {missedEvents.map((event) => (
                          <div key={event._id} className="text-sm text-red-700">
                            ❌ {event.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Favorite Events ({favorites.length})</h3>
                {favorites.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 text-4xl mb-2">❤️</div>
                    <p className="text-gray-600">No favorite events yet</p>
                    <Link
                      to="/events"
                      className="inline-block mt-2 text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Browse Events →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((favorite) => {
                      const event = events.find(e => e._id === favorite.eventId || e._id === favorite._id);
                      if (!event) return null;
                      
                      return (
                        <div key={event._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{event.title}</h4>
                            <button
                              onClick={() => handleRemoveFavorite(event._id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              ❤️
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                          <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                            <span>📅 {formatDate(event.date)}</span>
                            <span>{event.venue}</span>
                          </div>
                          <div className="flex space-x-2">
                            {!isEventRegistered(event._id) ? (
                              <button
                                onClick={() => handleRegisterForEvent(event._id)}
                                className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                Register
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnregisterFromEvent(event._id)}
                                className="flex-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700 transition-colors"
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
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Event Calendar</h3>
                <div className="bg-white rounded-lg shadow">
                  <EventCalendar events={events} />
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Legend</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                        <span>All Events</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                        <span>Registered Events</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                        <span>Favorite Events</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Quick Stats</h4>
                    <div className="text-sm space-y-1">
                      <div>📅 Events this month: {events.filter(e => {
                        const eventDate = new Date(e.date);
                        const now = new Date();
                        return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                      }).length}</div>
                      <div>✅ Your registered events: {registeredEvents.length}</div>
                      <div>❤️ Your favorite events: {favorites.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/events"
              className="bg-blue-100 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-200 transition-colors"
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-semibold">Browse Events</div>
            </Link>
            
            <Link
              to="/events?type=workshop"
              className="bg-green-100 text-green-700 p-4 rounded-lg text-center hover:bg-green-200 transition-colors"
            >
              <div className="text-2xl mb-2">⚡</div>
              <div className="font-semibold">Workshops</div>
            </Link>
            
            <Link
              to="/events?type=hackathon"
              className="bg-purple-100 text-purple-700 p-4 rounded-lg text-center hover:bg-purple-200 transition-colors"
            >
              <div className="text-2xl mb-2">💻</div>
              <div className="font-semibold">Hackathons</div>
            </Link>
            
            <Link
              to="/profile"
              className="bg-orange-100 text-orange-700 p-4 rounded-lg text-center hover:bg-orange-200 transition-colors"
            >
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