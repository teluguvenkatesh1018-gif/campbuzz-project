console.log("🔥 NEW BUILD WORKING");
import axios from 'axios';

const API_BASE_URL = 'https://campbuzz-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
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

// ==================== AUTH API ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  uploadAvatar: (formData) => api.post('/auth/upload-avatar-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  addBadge: (badgeData) => api.post('/auth/add-badge', badgeData),
  getEventHistory: () => api.get('/auth/event-history'),
  getUserStats: () => api.get('/auth/stats'),
  checkAchievements: () => api.post('/auth/check-achievements'),
};

// ==================== EVENTS API ====================
export const eventsAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  registerForEvent: (eventId, registrationData) => api.post(`/events/${eventId}/register`, registrationData),
  unregisterFromEvent: (eventId) => api.delete(`/events/${eventId}/register`),
  getUserEvents: () => api.get('/events/user/my-events'),
  getEventRegistrations: (eventId) => api.get(`/events/${eventId}/registrations`),
};

// ==================== COMMENTS API ====================
export const commentsAPI = {
  getComments: (eventId) => api.get(`/comments/${eventId}/comments`),
  addComment: (eventId, data) => api.post(`/comments/${eventId}/comments`, data),
  deleteComment: (eventId, commentId) => api.delete(`/comments/${eventId}/comments/${commentId}`),
};

// ==================== LIKES API ====================
export const likesAPI = {
  likeEvent: (eventId) => api.post(`/likes/${eventId}/like`),
  unlikeEvent: (eventId) => api.delete(`/likes/${eventId}/like`),
  getEventLikes: (eventId) => api.get(`/likes/${eventId}/likes`),
};

// ==================== FAVORITES API ====================
export const favoritesAPI = {
  addFavorite: (eventId) => api.post('/favorites/add', { eventId }),
  removeFavorite: (eventId) => api.delete(`/favorites/remove/${eventId}`),
  getFavorites: () => api.get('/favorites'),
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
  generateQR: (eventId) => api.post(`/attendance/events/${eventId}/generate-qr`),
  scanAttendance: (eventId, qrData) => api.post(`/attendance/events/${eventId}/scan-attendance`, { qrData }),
  manualAttendance: (eventId, userId) => api.post(`/attendance/events/${eventId}/manual-attendance`, { userId }),
  getAttendanceList: (eventId) => api.get(`/attendance/events/${eventId}/attendance`),
  getMyAttendance: (params) => api.get('/attendance/my-attendance', { params }),
  exportAttendance: (eventId) => api.get(`/attendance/events/${eventId}/attendance/export`, {
    responseType: 'blob',
  }),
};

// ==================== SEARCH API ====================
export const searchAPI = {
  advancedSearch: (params) => api.get('/search/events', { params }),
  getSearchSuggestions: (query) => api.get('/search/suggestions', { params: { q: query } }),
  getSearchFilters: () => api.get('/search/filters'),
};

// ==================== CALENDAR API ====================
export const calendarAPI = {
  addToCalendar: (eventId, data) => api.post('/calendar/add', { eventId, ...data }),
  removeFromCalendar: (eventId) => api.delete(`/calendar/remove/${eventId}`),
  getMyCalendar: () => api.get('/calendar/my-calendar'),
  syncGoogleCalendar: (data) => api.post('/calendar/sync/google', data),
  syncOutlookCalendar: (data) => api.post('/calendar/sync/outlook', data),
};

// ==================== REGISTRATION API ====================
export const registrationAPI = {
  getRegistrationFields: (eventId) => api.get(`/registrations/${eventId}/fields`),
  registerForEvent: (eventId, data) => api.post(`/registrations/${eventId}/register`, data),
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  cancelRegistration: (eventId) => api.delete(`/registrations/${eventId}/cancel`),
  getEventRegistrations: (eventId) => api.get(`/registrations/${eventId}/registrants`),
};

// ==================== OTP API ====================
export const otpAPI = {
  sendOtp: (data) => api.post('/otp/send-otp', data),
  verifyOtp: (data) => api.post('/otp/verify-otp', data),
};

// ==================== UPLOAD API ====================
export const uploadAPI = {
  uploadImage: (file, type = 'avatar') => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/upload/${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ==================== USER API ====================
export const userAPI = {
  getEventsByOrganizer: (organizerId) => api.get(`/events?organizer=${organizerId}`),
  getUserRankings: (userId) => api.get(`/users/rankings/${userId}`),
  getPublicProfile: (userId) => api.get(`/users/${userId}`),
};

export default api;