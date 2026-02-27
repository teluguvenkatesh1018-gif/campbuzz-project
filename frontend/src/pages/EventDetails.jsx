// src/pages/EventDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  eventsAPI,
  likesAPI,
  favoritesAPI,
  attendanceAPI,
  registrationAPI
} from '../services/api';
import { useSelector } from 'react-redux';
import QRScanner from '../components/QRScanner';
import AttendanceManager from '../components/AttendanceManager';
import CalendarExport from '../components/CalendarExport';
import RegistrationForm from '../components/RegistrationForm';
import EventRegistrations from '../components/EventRegistrations';
import { toast } from 'react-toastify';

const statusClassMap = {
  cancelled: { pill: 'bg-red-500/20', text: 'Cancelled' },
  completed: { pill: 'bg-blue-500/20', text: 'Completed' },
  past: { pill: 'bg-gray-500/20', text: 'Past Event' },
  upcoming: { pill: 'bg-green-500/20', text: 'Upcoming' },
  ongoing: { pill: 'bg-orange-500/20', text: 'Happening Now' },
};

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth || {});

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [activeTab, setActiveTab] = useState('details');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [userAttendance, setUserAttendance] = useState(null);

  // Registration state
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    fetchEvent();
    if (isAuthenticated) {
      checkUserAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuthenticated]);

  // Check registration status whenever event or user changes
  useEffect(() => {
    checkRegistrationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, user]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getEvent(id);
      const ev = response.data;
      setEvent(ev);
      setLikesCount(ev?.likes?.length || 0);
      setFavoritesCount(ev?.favorites?.length || 0);

      // Check if current user has liked/favorited
      if (user && ev?.likes) {
        setIsLiked(Array.isArray(ev.likes) && ev.likes.includes(user.id));
      } else {
        setIsLiked(false);
      }
      if (user && ev?.favorites) {
        setIsFavorited(Array.isArray(ev.favorites) && ev.favorites.includes(user.id));
      } else {
        setIsFavorited(false);
      }

      // Calculate attendance stats
      if (ev?.attendance && ev?.registeredUsers) {
        const stats = {
          totalRegistered: ev.registeredUsers.length,
          totalAttended: ev.attendance.length,
          attendanceRate:
            ev.registeredUsers.length > 0
              ? Math.round((ev.attendance.length / ev.registeredUsers.length) * 100)
              : 0
        };
        setAttendanceStats(stats);
      } else {
        setAttendanceStats(null);
      }
    } catch (error) {
      console.error('Fetch event error:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const checkUserAttendance = async () => {
    try {
      const response = await attendanceAPI.getMyAttendance();
      const userAttendanceRecord = response.data.attendanceHistory?.find(
        (item) => {
          const evId = item?.event?.id ?? item?.event?._id ?? item?.event;
          return String(evId) === String(id) || String(evId) === String(event?._id);
        }
      );
      setUserAttendance(userAttendanceRecord || null);
    } catch (error) {
      console.error('Check attendance error:', error);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!event || !user) return;
    try {
      const response = await registrationAPI.getMyRegistrations();
      const userRegistration = response.data?.registrations?.find((reg) => {
        const regEventId = reg?.event?.id ?? reg?.event?._id ?? reg?.event;
        return String(regEventId) === String(event._id) || String(regEventId) === String(id);
      });
      setIsRegistered(!!userRegistration);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like events');
      return;
    }

    try {
      await likesAPI.likeEvent(id);
      setIsLiked((prev) => {
        const next = !prev;
        setLikesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
        return next;
      });
      toast.success(isLiked ? 'Removed like' : 'Event liked!');
    } catch (error) {
      console.error('Like error:', error);
      toast.error('Failed to update like');
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to favorite events');
      return;
    }

    try {
      await favoritesAPI.addFavorite(id);
      setIsFavorited((prev) => {
        const next = !prev;
        setFavoritesCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
        return next;
      });
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites!');
    } catch (error) {
      console.error('Favorite error:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleScanAttendance = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to mark attendance');
      return;
    }
    setShowQRScanner(true);
  };

  const handleScanComplete = (scanData) => {
    toast.success('Attendance marked successfully!');
    setUserAttendance({
      event: event,
      scannedAt: new Date(),
      method: 'qr_code'
    });
    fetchEvent(); // Refresh event data
  };

  // Registration handlers
  const handleRegister = () => {
    if (!isAuthenticated) {
      toast.error('Please login to register');
      return;
    }
    setShowRegistrationForm(true);
  };

  const handleUnregister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to unregister');
      return;
    }
    if (!window.confirm('Are you sure you want to unregister from this event?')) return;

    try {
      await registrationAPI.unregisterFromEvent(event._id ?? id);
      toast.success('Successfully unregistered from the event');
      setIsRegistered(false);
      fetchEvent();
    } catch (error) {
      console.error('Unregister error:', error);
      toast.error('Failed to unregister from event');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getEventStatus = (ev) => {
    const now = new Date();
    const eventDate = ev?.date ? new Date(ev.date) : null;

    if (ev?.status === 'cancelled') return { status: 'cancelled', color: 'red', text: 'Cancelled' };
    if (ev?.status === 'completed') return { status: 'completed', color: 'blue', text: 'Completed' };
    if (eventDate && eventDate < now) return { status: 'past', color: 'gray', text: 'Past Event' };
    if (eventDate && eventDate > now) return { status: 'upcoming', color: 'green', text: 'Upcoming' };
    return { status: 'ongoing', color: 'orange', text: 'Happening Now' };
  };

  const eventStatus = event ? getEventStatus(event) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Event Not Found</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            ← Back to Events
          </button>
          <div className="flex space-x-4">
            {user?.role === 'admin' && event.organizer?._id === user.id && (
              <Link
                to={`/edit-event/${event._id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Event
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Event Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
                    {String(event.type || '').charAt(0).toUpperCase() + (event.type || '').slice(1)}
                  </span>
                  {eventStatus && (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusClassMap[eventStatus.status]?.pill || 'bg-gray-200'}`}>
                      {eventStatus.text}
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-white text-opacity-90">
                  <div className="flex items-center">
                    <span className="mr-2">📅</span>
                    <span>{formatDate(event.date)}{event.time ? ` at ${event.time}` : ''}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">📍</span>
                    <span>{event.venue}</span>
                  </div>
                  {event.isPaid && (
                    <div className="flex items-center">
                      <span className="mr-2">💰</span>
                      <span>₹{event.price}</span>
                    </div>
                  )}
                  {attendanceStats && (
                    <div className="flex items-center">
                      <span className="mr-2">👥</span>
                      <span>{attendanceStats.totalAttended} attended</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-4 ml-6">
                <button
                  onClick={handleLike}
                  className={`p-3 rounded-full transition-colors ${isLiked ? 'bg-red-500' : 'bg-white bg-opacity-20 hover:bg-opacity-30'}`}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  ❤️ {likesCount}
                </button>
                <button
                  onClick={handleFavorite}
                  className={`p-3 rounded-full transition-colors ${isFavorited ? 'bg-yellow-500' : 'bg-white bg-opacity-20 hover:bg-opacity-30'}`}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  ⭐ {favoritesCount}
                </button>
                <CalendarExport event={event} />
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-gray-50 border-b px-8 py-4">
            <div className="flex flex-wrap gap-4">
              {isAuthenticated && eventStatus?.status === 'ongoing' && !userAttendance && (
                <button
                  onClick={handleScanAttendance}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <span>📱</span>
                  <span>Scan QR for Attendance</span>
                </button>
              )}

              {userAttendance && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex items-center space-x-2">
                  <span>✅</span>
                  <span>Attendance marked on {new Date(userAttendance.scannedAt).toLocaleDateString()}</span>
                </div>
              )}

              {event.registrationLink && (
                <a
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <span>🎫</span>
                  <span>{event.isPaid ? `Register - ₹${event.price}` : 'Register Now'}</span>
                </a>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'details' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                📋 Event Details
              </button>

              {user?.role === 'admin' && event.organizer?._id === user.id && (
                <button
                  onClick={() => setActiveTab('attendance')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'attendance' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  👥 Attendance Management
                </button>
              )}

              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'schedule' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                🕒 Event Schedule
              </button>

              {event.teamMembers && event.teamMembers.length > 0 && (
                <button
                  onClick={() => setActiveTab('team')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'team' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  👥 Team & Organizers
                </button>
              )}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'details' && (
              <div className="space-y-8">
                {/* Event Description */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Event</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
                </div>

                {/* Event Details Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Event Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{event.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(event.date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{event.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Venue:</span>
                        <span className="font-medium">{event.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration:</span>
                        <span className="font-medium">{event.isPaid ? `₹${event.price}` : 'Free'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium capitalize ${event.status === 'published' ? 'text-green-600' : event.status === 'cancelled' ? 'text-red-600' : event.status === 'completed' ? 'text-blue-600' : 'text-gray-600'}`}>
                          {event.status}
                        </span>
                      </div>
                      {attendanceStats && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Registered:</span>
                            <span className="font-medium">{attendanceStats.totalRegistered}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Attended:</span>
                            <span className="font-medium">{attendanceStats.totalAttended}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Attendance Rate:</span>
                            <span className="font-medium">{attendanceStats.attendanceRate}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Registration & Actions */}
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Registration & Actions</h3>
                    <div className="space-y-4">
                      {event.registrationLink ? (
                        <a
                          href={event.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          {event.isPaid ? `Register Now - ₹${event.price}` : 'Register for Free'}
                        </a>
                      ) : (
                        <div className="text-center py-4 text-gray-600">Registration details coming soon...</div>
                      )}

                      {/* NEW: Register / Unregister for students */}
                      {user && user.role === 'student' && (
                        <div className="mt-6">
                          {isRegistered ? (
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800 font-semibold">✅ You are registered for this event</p>
                              </div>
                              <button
                                onClick={handleUnregister}
                                className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-semibold"
                              >
                                Unregister from Event
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={handleRegister}
                              disabled={!event.registrationOpen}
                              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                              Register Now
                            </button>
                          )}
                        </div>
                      )}

                      {/* NEW: Admin view registrations button */}
                      {user && user.role === 'admin' && event.organizer?._id === user.id && (
                        <div className="mt-6">
                          <button
                            onClick={() => setShowRegistrations(true)}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
                          >
                            View Registrations ({event.registrationCount || (event.registeredUsers?.length ?? 0)})
                          </button>
                        </div>
                      )}

                      {isAuthenticated && eventStatus?.status === 'ongoing' && !userAttendance && (
                        <button
                          onClick={handleScanAttendance}
                          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center space-x-2"
                        >
                          <span>📱</span>
                          <span>Mark Attendance with QR</span>
                        </button>
                      )}

                      {userAttendance && (
                        <div className="bg-green-100 border border-green-200 rounded-lg p-4 text-center">
                          <div className="text-green-800 font-medium mb-1">✅ Attendance Confirmed</div>
                          <div className="text-green-700 text-sm">Scanned on {new Date(userAttendance.scannedAt).toLocaleString()}</div>
                          <div className="text-green-600 text-xs mt-1">Method: {userAttendance.method === 'qr_code' ? 'QR Code' : 'Manual'}</div>
                        </div>
                      )}

                      <div className="text-sm text-gray-600 space-y-2">
                        <p>📍 <strong>Venue:</strong> {event.venue}</p>
                        <p>📅 <strong>Date:</strong> {formatDate(event.date)}</p>
                        <p>⏰ <strong>Time:</strong> {event.time}</p>
                        {event.capacity > 0 && (
                          <p>👥 <strong>Capacity:</strong> {event.registeredUsers?.length || 0}/{event.capacity}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                {(event.socialMedia?.instagram || event.socialMedia?.twitter || event.socialMedia?.facebook || event.socialMedia?.website) && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect With Us</h2>
                    <div className="flex flex-wrap gap-4">
                      {event.socialMedia.instagram && (
                        <a
                          href={event.socialMedia.instagram.startsWith('http') ? event.socialMedia.instagram : `https://instagram.com/${event.socialMedia.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center space-x-2"
                        >
                          <span>📷</span>
                          <span>Instagram</span>
                        </a>
                      )}
                      {event.socialMedia.twitter && (
                        <a
                          href={event.socialMedia.twitter.startsWith('http') ? event.socialMedia.twitter : `https://twitter.com/${event.socialMedia.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
                        >
                          <span>🐦</span>
                          <span>Twitter/X</span>
                        </a>
                      )}
                      {event.socialMedia.facebook && (
                        <a
                          href={event.socialMedia.facebook.startsWith('http') ? event.socialMedia.facebook : `https://facebook.com/${event.socialMedia.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <span>📘</span>
                          <span>Facebook</span>
                        </a>
                      )}
                      {event.socialMedia.website && (
                        <a
                          href={event.socialMedia.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                        >
                          <span>🌐</span>
                          <span>Website</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && user?.role === 'admin' && event.organizer?._id === user.id && (
              <AttendanceManager event={event} />
            )}

            {activeTab === 'schedule' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Schedule</h2>
                {event.schedule && event.schedule.length > 0 ? (
                  <div className="space-y-4">
                    {event.schedule.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
                            <p className="text-gray-600 mt-1">{item.description}</p>
                            {item.speaker && (
                              <p className="text-sm text-gray-500 mt-2">
                                👤 {item.speaker.name} - {item.speaker.role}
                                {item.speaker.company && ` at ${item.speaker.company}`}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{item.time}</p>
                            {item.duration && <p className="text-sm text-gray-500">{item.duration} mins</p>}
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">{item.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-4">🕒</div>
                    <p>Schedule details coming soon...</p>
                    <p className="text-sm mt-2">Check back later for the complete event timeline</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'team' && event.teamMembers && event.teamMembers.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Team & Organizers</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {event.teamMembers.map((member, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">{member.name}</h4>
                      <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center"><span className="mr-2">📧</span>{member.email}</p>
                        {member.phone && <p className="flex items-center"><span className="mr-2">📞</span>{member.phone}</p>}
                        {member.department && <p className="flex items-center"><span className="mr-2">🏫</span>{member.department}</p>}
                      </div>
                      {member.isVerified && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✅ Verified Organizer</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <QRScanner event={event} onScanComplete={handleScanComplete} onClose={() => setShowQRScanner(false)} />
        </div>
      )}

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <RegistrationForm
            event={event}
            onClose={() => setShowRegistrationForm(false)}
            onRegistrationSuccess={() => {
              setIsRegistered(true);
              setShowRegistrationForm(false);
              fetchEvent();
            }}
          />
        </div>
      )}

      {/* Registrations List Modal (Admin) */}
      {showRegistrations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <EventRegistrations event={event} onClose={() => setShowRegistrations(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
