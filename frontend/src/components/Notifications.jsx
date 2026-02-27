// src/components/Notifications.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);

  // Mock notifications - in real app, these would come from backend
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        title: 'New Event Added',
        message: 'Web Development Workshop has been scheduled',
        type: 'info',
        timestamp: new Date(),
        read: false
      },
      {
        id: 2,
        title: 'Registration Reminder',
        message: 'Don\'t forget to register for the Hackathon',
        type: 'warning',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      },
      {
        id: 3,
        title: 'Welcome to CampBuzz!',
        message: 'Start exploring campus events',
        type: 'success',
        timestamp: new Date(Date.now() - 86400000),
        read: true
      }
    ];
    setNotifications(mockNotifications);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-blue-700 rounded-full transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V7a4 4 0 00-8 0v10h5l-5 5-5-5h5V7a7 7 0 0114 0v10z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                      <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {notification.timestamp.toLocaleDateString()} at{' '}
                    {notification.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t">
            <button className="w-full text-center text-blue-600 hover:underline py-2">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;