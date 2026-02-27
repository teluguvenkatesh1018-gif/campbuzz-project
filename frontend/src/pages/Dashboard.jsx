// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import QuickStats from '../components/QuickStats';
import EventCalendar from '../components/EventCalendar';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    upcoming: 0,
    past: 0
  });

  // Registration stats (ADDED)
  const [registrationStats, setRegistrationStats] = useState({
    totalRegistrations: 0,
    recentRegistrations: [],
    popularEvents: []
  });

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  // Fetch registration stats on mount (ADDED)
  useEffect(() => {
    fetchRegistrationStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvents();
      const allEvents = response?.data?.events || [];
      setEvents(allEvents);
      calculateStats(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // NEW: fetch registration-related stats
  const fetchRegistrationStats = async () => {
    try {
      // You might want to create a dedicated API for dashboard stats
      const eventsResponse = await eventsAPI.getEvents({ limit: 50 });
      const eventsList = eventsResponse?.data?.events || [];

      let totalRegistrations = 0;
      const popularEvents = [];

      eventsList.forEach((ev) => {
        const regCount = Array.isArray(ev.registeredUsers) ? ev.registeredUsers.length : 0;
        totalRegistrations += regCount;

        if (regCount > 0) {
          popularEvents.push({
            id: ev._id,
            title: ev.title,
            registrations: regCount
          });
        }
      });

      // Sort by registration count desc
      popularEvents.sort((a, b) => b.registrations - a.registrations);

      setRegistrationStats({
        totalRegistrations,
        popularEvents: popularEvents.slice(0, 5),
        recentRegistrations: [] // leave empty unless you have a dedicated endpoint
      });
    } catch (error) {
      console.error('Error fetching registration stats:', error);
      // non-blocking: dashboard still shows events
    }
  };

  const calculateStats = (events) => {
    const now = new Date();
    const st = {
      total: events.length,
      published: events.filter((event) => event.status === 'published').length,
      draft: events.filter((event) => event.status === 'draft').length,
      upcoming: events.filter((event) => new Date(event.date) > now).length,
      past: events.filter((event) => new Date(event.date) <= now).length
    };
    setStats(st);
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      try {
        await eventsAPI.deleteEvent(eventId);
        alert('Event deleted successfully!');
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    try {
      await eventsAPI.updateEvent(eventId, { status: newStatus });
      alert(`Event status updated to ${newStatus}`);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Failed to update event status');
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'published' && event.status === 'published') ||
      (filter === 'draft' && event.status === 'draft') ||
      (filter === 'upcoming' && new Date(event.date) > new Date()) ||
      (filter === 'past' && new Date(event.date) <= new Date());

    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (event.title || '').toLowerCase().includes(term) ||
      (event.description || '').toLowerCase().includes(term) ||
      (event.type || '').toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusColors = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {String(status || '').charAt(0).toUpperCase() + String(status || '').slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    return (
      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
        {String(type || '').charAt(0).toUpperCase() + String(type || '').slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              <h1 className="text-3xl font-bold text-gray-900">Event Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage all your campus events in one place</p>
            </div>
            <Link
              to="/create-event"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <span className="mr-2">+</span> Create New Event
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        <QuickStats stats={stats} />

        {/* Registration Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 text-green-600">
                <span className="text-xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{registrationStats.totalRegistrations ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                <span className="text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Events</p>
                <p className="text-2xl font-bold text-gray-900">{events.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                <span className="text-xl">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Popular</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registrationStats.popularEvents?.[0]?.registrations ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Events by Registration */}
        {Array.isArray(registrationStats.popularEvents) && registrationStats.popularEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Events</h3>
            <div className="space-y-3">
              {registrationStats.popularEvents.map((event, index) => (
                <div key={event.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-gray-500">#{index + 1}</span>
                    <span className="font-medium text-gray-900">{event.title}</span>
                  </div>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">
                    {event.registrations} registrations
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All Events
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'published' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Published
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'draft' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Drafts
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'upcoming' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'past' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Past Events
              </button>
            </div>

            <div className="w-full md:w-auto">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Updated Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Events Table - Takes 3/4 of the space */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first event'}
                  </p>
                  <Link
                    to="/create-event"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <span className="mr-2">+</span> Create Event
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEvents.map((event) => (
                        <tr key={event._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="flex items-center">
                                <h3 className="text-sm font-semibold text-gray-900">{event.title}</h3>
                                {event.isPaid && (
                                  <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                                    ₹{event.price}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {(event.description || '').substring(0, 100)}...
                              </p>
                              <p className="text-sm text-gray-400 mt-1">{event.venue}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col space-y-2">
                              <span className="text-sm text-gray-900 font-medium">{formatDate(event.date)}</span>
                              <span className="text-sm text-gray-500">{event.time}</span>
                              {getTypeBadge(event.type)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col space-y-2">
                              {getStatusBadge(event.status)}
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleStatusChange(event._id, 'published')}
                                  disabled={event.status === 'published'}
                                  className={`text-xs px-2 py-1 rounded ${event.status === 'published' ? 'bg-green-100 text-green-800 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                  Publish
                                </button>
                                <button
                                  onClick={() => handleStatusChange(event._id, 'draft')}
                                  disabled={event.status === 'draft'}
                                  className={`text-xs px-2 py-1 rounded ${event.status === 'draft' ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                  Draft
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Link
                                to={`/event/${event._id}`}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                              >
                                View
                              </Link>
                              <Link
                                to={`/edit-event/${event._id}`}
                                className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteEvent(event._id, event.title)}
                                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Takes 1/4 of the space */}
          <div className="lg:col-span-1 space-y-4">
            {/* Even Smaller Calendar */}
            <div className="bg-white rounded-lg shadow p-3">
              <div className="text-center mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Event Calendar</h3>
              </div>
              <EventCalendar events={events} />
            </div>

            {/* Quick Actions and Recent Activity Stacked */}
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick Actions</h3>
                <div className="space-y-1">
                  <Link
                    to="/create-event"
                    className="w-full bg-blue-600 text-white p-1.5 rounded text-xs hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <span className="mr-1">➕</span>
                    Create Event
                  </Link>

                  <button
                    onClick={fetchEvents}
                    className="w-full bg-green-600 text-white p-1.5 rounded text-xs hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <span className="mr-1">🔄</span>
                    Refresh
                  </button>

                  <Link
                    to="/events"
                    className="w-full bg-purple-600 text-white p-1.5 rounded text-xs hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <span className="mr-1">👀</span>
                    View Events
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h3>
                <div className="space-y-1">
                  {filteredEvents.slice(0, 3).map((event) => (
                    <div key={event._id} className="flex items-center space-x-1 p-1 hover:bg-gray-50 rounded">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500 truncate">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REGISTRATION STATS (ADDED) */}
              <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Registrations</h3>
                <div className="text-sm text-gray-700 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total registrations</span>
                    <span className="text-sm font-medium">{registrationStats.totalRegistrations ?? 0}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Popular events</h4>
                  {Array.isArray(registrationStats.popularEvents) && registrationStats.popularEvents.length > 0 ? (
                    <ul className="space-y-2">
                      {registrationStats.popularEvents.map((pe) => (
                        <li key={pe.id} className="flex justify-between items-center text-xs">
                          <span className="truncate mr-2">{pe.title}</span>
                          <span className="text-xs text-gray-500">{pe.registrations}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500">No registration data yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
};

export default Dashboard;
