import React, { useState, useEffect } from 'react';
import { calendarAPI } from '../services/api';
import { toast } from 'react-toastify';

const PersonalCalendar = () => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' or 'calendar'

  useEffect(() => {
    fetchPersonalCalendar();
  }, []);

  const fetchPersonalCalendar = async () => {
    try {
      const response = await calendarAPI.getMyCalendar();
      setCalendarEvents(response.data.calendarEvents);
    } catch (error) {
      toast.error('Failed to load personal calendar');
      console.error('Failed to fetch personal calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCalendar = async (eventId) => {
    try {
      await calendarAPI.removeFromCalendar(eventId);
      setCalendarEvents(prev => prev.filter(item => item.event._id !== eventId));
      toast.success('Event removed from calendar');
    } catch (error) {
      toast.error('Failed to remove from calendar');
      console.error('Failed to remove from calendar:', error);
    }
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    return calendarEvents
      .filter(item => new Date(item.event.date) >= today)
      .sort((a, b) => new Date(a.event.date) - new Date(b.event.date));
  };

  const getPastEvents = () => {
    const today = new Date();
    return calendarEvents
      .filter(item => new Date(item.event.date) < today)
      .sort((a, b) => new Date(b.event.date) - new Date(a.event.date));
  };

  const refreshCalendar = () => {
    setLoading(true);
    fetchPersonalCalendar();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your calendar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">My Personal Calendar</h3>
              <p className="text-gray-600 mt-1">
                {calendarEvents.length} events in your calendar
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshCalendar}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
              <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('list')}
                  className={`px-4 py-2 rounded ${
                    view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={`px-4 py-2 rounded ${
                    view === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Calendar View
                </button>
              </div>
            </div>
          </div>

          {calendarEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Your calendar is empty</h3>
              <p className="text-gray-600 mb-6">Start adding events to your personal calendar!</p>
              <button
                onClick={() => window.location.href = '/events'}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-medium"
              >
                Browse Events
              </button>
            </div>
          ) : view === 'list' ? (
            <div className="space-y-6">
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-green-600">
                      Upcoming Events ({upcomingEvents.length})
                    </h4>
                    <span className="text-sm text-gray-500">
                      Next event: {upcomingEvents[0] && new Date(upcomingEvents[0].event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {upcomingEvents.map((item) => (
                      <EventCard key={item._id} item={item} onRemove={removeFromCalendar} />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-600 mb-4">
                    Past Events ({pastEvents.length})
                  </h4>
                  <div className="space-y-4">
                    {pastEvents.map((item) => (
                      <EventCard key={item._id} item={item} onRemove={removeFromCalendar} isPast={true} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <CalendarView events={calendarEvents} onRemove={removeFromCalendar} />
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Event Card Component
const EventCard = ({ item, onRemove, isPast = false }) => {
  const eventDate = new Date(item.event.date);
  const today = new Date();
  const isToday = eventDate.toDateString() === today.toDateString();
  const isTomorrow = new Date(today.setDate(today.getDate() + 1)).toDateString() === eventDate.toDateString();

  const getEventIcon = (type) => {
    const icons = {
      hackathon: '💻', workshop: '🔧', seminar: '🎤', 
      'club-activity': '👥', sports: '⚽', cultural: '🎭',
      conference: '🏢', webinar: '💻', competition: '🏆'
    };
    return icons[type] || '📅';
  };

  const getEventColor = (type) => {
    const colors = {
      hackathon: 'bg-purple-100 text-purple-800',
      workshop: 'bg-blue-100 text-blue-800',
      seminar: 'bg-green-100 text-green-800',
      'club-activity': 'bg-yellow-100 text-yellow-800',
      sports: 'bg-red-100 text-red-800',
      cultural: 'bg-pink-100 text-pink-800',
      conference: 'bg-indigo-100 text-indigo-800',
      webinar: 'bg-teal-100 text-teal-800',
      competition: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`border rounded-lg p-4 flex justify-between items-start transition-all duration-200 hover:shadow-md ${
      isPast ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
    } ${isToday ? 'border-blue-500 border-2 bg-blue-50' : ''}`}>
      <div className="flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className={`text-2xl ${isPast ? 'text-gray-400' : 'text-blue-500'}`}>
              {getEventIcon(item.event.type)}
            </span>
            <div>
              <h4 className={`font-semibold ${isPast ? 'text-gray-600' : 'text-gray-900'}`}>
                {item.event.title}
                {isToday && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Today</span>
                )}
                {isTomorrow && !isToday && (
                  <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">Tomorrow</span>
                )}
              </h4>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center space-x-1">
                  <span>📅</span>
                  <span>{eventDate.toLocaleDateString()} at {item.event.time}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>📍</span>
                  <span>{item.event.venue}</span>
                </span>
                <span className={`inline-block ${getEventColor(item.event.type)} text-xs px-2 py-1 rounded-full uppercase font-semibold`}>
                  {item.event.type}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {item.event.description && (
          <p className="text-gray-600 mb-3 text-sm line-clamp-2">
            {item.event.description}
          </p>
        )}
        
        {item.customNotes && (
          <div className="mt-2 p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium">📝 Your Notes:</p>
            <p className="text-sm text-yellow-700 mt-1">{item.customNotes}</p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {item.reminders.map((reminder, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-1 rounded ${
                reminder.sent 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              ⏰ {reminder.time} {reminder.sent && '✓'}
            </span>
          ))}
          <span className="text-xs text-gray-500">
            Added on {new Date(item.addedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2 ml-4">
        <button
          onClick={() => window.location.href = `/event/${item.event._id}`}
          className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
        >
          View
        </button>
        <button
          onClick={() => onRemove(item.event._id)}
          className="text-red-500 hover:text-red-700 text-sm px-3 py-1 border border-red-200 rounded hover:bg-red-50 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

// Enhanced Calendar View Component
const CalendarView = ({ events, onRemove }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDay = (day) => {
    return events.filter(item => {
      const eventDate = new Date(item.event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const calendarDays = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="h-32 border border-gray-200 bg-gray-50"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = day === new Date().getDate() && 
                     currentDate.getMonth() === new Date().getMonth() && 
                     currentDate.getFullYear() === new Date().getFullYear();

      calendarDays.push(
        <div key={day} className={`h-32 border border-gray-200 p-2 overflow-hidden ${
          isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
        }`}>
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${
              isToday 
                ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                : 'text-gray-900'
            }`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {dayEvents.slice(0, 3).map((item, index) => (
              <div
                key={item._id}
                className="text-xs bg-blue-100 text-blue-800 px-1 rounded truncate cursor-pointer hover:bg-blue-200"
                title={item.event.title}
                onClick={() => window.location.href = `/event/${item.event._id}`}
              >
                {item.event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return calendarDays;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </button>
        <h4 className="text-lg font-medium text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {days.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-3 border-b border-gray-200">
            {day}
          </div>
        ))}
        {renderCalendar()}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Has events</span>
            </div>
          </div>
          <span>{events.length} events this month</span>
        </div>
      </div>
    </div>
  );
};

export default PersonalCalendar;