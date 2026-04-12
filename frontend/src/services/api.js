import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://campbuzz-backend.onrender.com';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),

  // ✅ UPDATED ONLY THESE TWO
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),

  uploadAvatar: (avatarData) => api.post('/auth/upload-avatar', avatarData),
  uploadAvatarFile: (formData) => api.post('/auth/upload-avatar-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
  getStats: () => api.get('/auth/stats'),
  addBadge: (badgeData) => api.post('/auth/add-badge', badgeData),
  getEventHistory: () => api.get('/auth/event-history'),
  checkAchievements: () => api.post('/auth/check-achievements'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// OTP API
export const otpAPI = {
  sendOtp: (data) => api.post('/otp/send-otp', data),
  verifyOtp: (data) => api.post('/otp/verify-otp', data),
};

// Events API
export const eventsAPI = {
  getEvents: (params = {}) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  
  registerForEvent: (eventId) => api.post(`/events/${eventId}/register`),
  unregisterFromEvent: (eventId) => api.delete(`/events/${eventId}/register`),
  getRegisteredEvents: () => api.get('/events/registered'),
  markAttendance: (eventId) => api.post(`/events/${eventId}/attend`),
  getAttendance: (eventId) => api.get(`/events/${eventId}/attendance`),
  
  getEventTypes: () => api.get('/events/types'),
  getEventsByCategory: (category) => api.get(`/events/category/${category}`),
  getUpcomingEvents: () => api.get('/events/upcoming'),
  getPastEvents: () => api.get('/events/past'),
  
  searchEvents: (query) => api.get('/events/search', { params: { q: query } }),
};

// Likes API
export const likesAPI = {
  likeEvent: (eventId) => api.post(`/events/${eventId}/like`),
  unlikeEvent: (eventId) => api.delete(`/events/${eventId}/like`),
  getLikeStatus: (eventId) => api.get(`/events/${eventId}/like-status`),
  getLikedEvents: () => api.get('/events/liked'),
};

// Favorites API
export const favoritesAPI = {
  getFavorites: () => api.get('/favorites'),
  addFavorite: (eventId) => api.post('/favorites', { eventId }),
  removeFavorite: (eventId) => api.delete(`/favorites/${eventId}`),
  checkFavorite: (eventId) => api.get(`/favorites/${eventId}/check`),
};

// Comments API
export const commentsAPI = {
  getComments: (eventId) => api.get(`/events/${eventId}/comments`),
  addComment: (eventId, commentData) => api.post(`/events/${eventId}/comments`, commentData),
  updateComment: (eventId, commentId, commentData) => api.put(`/events/${eventId}/comments/${commentId}`, commentData),
  deleteComment: (eventId, commentId) => api.delete(`/events/${eventId}/comments/${commentId}`),
  likeComment: (eventId, commentId) => api.post(`/events/${eventId}/comments/${commentId}/like`),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  getUserEvents: (userId) => api.get(`/users/${userId}/events`),
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
  getUserActivity: (userId) => api.get(`/users/${userId}/activity`),
};

// Dashboard API
export const dashboardAPI = {
  getStudentStats: () => api.get('/dashboard/student/stats'),
  getStudentUpcomingEvents: () => api.get('/dashboard/student/upcoming'),
  getStudentRegisteredEvents: () => api.get('/dashboard/student/registered'),
  getStudentAttendance: () => api.get('/dashboard/student/attendance'),
  getStudentRecommendations: () => api.get('/dashboard/student/recommendations'),
  
  getAdminStats: () => api.get('/dashboard/admin/stats'),
  getAdminRecentEvents: () => api.get('/dashboard/admin/recent-events'),
  getAdminUserActivity: () => api.get('/dashboard/admin/user-activity'),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
};

// Analytics API
export const analyticsAPI = {
  getEventAnalytics: (eventId) => api.get(`/analytics/events/${eventId}`),
  getUserAnalytics: () => api.get('/analytics/users'),
  getPlatformAnalytics: () => api.get('/analytics/platform'),
  getPopularEvents: () => api.get('/analytics/popular-events'),
};

// Uploads API
export const uploadsAPI = {
  uploadImage: (formData) => api.post('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadFile: (formData) => api.post('/uploads/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (fileId) => api.delete(`/uploads/${fileId}`),
};

// Clubs & Organizations API
export const clubsAPI = {
  getClubs: () => api.get('/clubs'),
  getClub: (id) => api.get(`/clubs/${id}`),
  getClubEvents: (clubId) => api.get(`/clubs/${clubId}/events`),
  followClub: (clubId) => api.post(`/clubs/${clubId}/follow`),
  unfollowClub: (clubId) => api.delete(`/clubs/${clubId}/follow`),
  getFollowedClubs: () => api.get('/clubs/followed'),
};

// Calendar API
export const calendarAPI = {
  getCalendarLinks: (eventId) => api.get(`/calendar/events/${eventId}/calendar-links`),
  exportToICal: (eventId) => api.get(`/calendar/events/${eventId}/export/ical`, {
    responseType: 'blob'
  }),
  addToCalendar: (eventId, data) => api.post(`/calendar/events/${eventId}/add-to-calendar`, data),
  getMyCalendar: (params = {}) => api.get('/calendar/my-calendar', { params }),
  removeFromCalendar: (eventId) => api.delete(`/calendar/events/${eventId}/remove-from-calendar`),
  syncWithExternal: (data) => api.post('/calendar/sync/external', data),
};

// Search API
export const searchAPI = {
  advancedSearch: (params) => api.get('/search/events', { params }),
  getSearchSuggestions: (query) => api.get('/search/suggestions', { params: { q: query } }),
  getSearchFilters: () => api.get('/search/filters'),
};

// Tickets API
export const ticketsAPI = {
  generateTicket: (eventId) => api.post(`/tickets/events/${eventId}/tickets`),
  checkInTicket: (ticketId) => api.post(`/tickets/${ticketId}/checkin`),
  getMyTickets: (params = {}) => api.get('/tickets/my-tickets', { params }),
  verifyQRCode: (qrData) => api.post('/tickets/verify', { qrData }),
};

// Attendance API
export const attendanceAPI = {
  generateQR: (eventId) => api.post(`/attendance/events/${eventId}/generate-qr`),
  scanAttendance: (eventId, data) => api.post(`/attendance/events/${eventId}/scan-attendance`, data),
  markManualAttendance: (eventId, data) => api.post(`/attendance/events/${eventId}/manual-attendance`, data),
  getAttendance: (eventId) => api.get(`/attendance/events/${eventId}/attendance`),
  getMyAttendance: (params = {}) => api.get('/attendance/my-attendance', { params }),
  exportAttendance: (eventId) => api.get(`/attendance/events/${eventId}/attendance/export`, {
    responseType: 'blob'
  }),
};

// Registration API
export const registrationAPI = {
  registerForEvent: (eventId, registrationData) => api.post(`/registrations/events/${eventId}/register`, { registrationData }),
  unregisterFromEvent: (eventId) => api.delete(`/registrations/events/${eventId}/unregister`),
  getEventRegistrations: (eventId, params = {}) => api.get(`/registrations/events/${eventId}/registrations`, { params }),
  updateRegistrationStatus: (eventId, userId, status) => api.put(`/registrations/events/${eventId}/registrations/${userId}/status`, { status }),
  exportRegistrations: (eventId) => api.get(`/registrations/events/${eventId}/registrations/export`, { responseType: 'blob' }),
  getMyRegistrations: (params = {}) => api.get('/registrations/my-registrations', { params }),
  getRegistrationFields: (eventId) => api.get(`/events/${eventId}/registration-fields`),
  updateRegistrationFields: (eventId, registrationFields) => api.put(`/events/${eventId}/registration-fields`, { registrationFields }),
};

// User API
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),

  // ✅ INSERTED (as you requested)
  getEventsByOrganizer: (organizerId) => api.get(`/events?organizer=${organizerId}`),

  getUserRankings: (userId) => api.get(`/users/rankings/${userId}`)
};

export default api;