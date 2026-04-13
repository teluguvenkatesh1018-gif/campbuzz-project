console.log("🔥 NEW BUILD WORKING");
import axios from 'axios';

const API_URL = 'https://campbuzz-backend.onrender.com/api';

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
  (error) => Promise.reject(error)
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
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  uploadAvatar: (avatarData) => api.post('/auth/upload-avatar', avatarData),
  uploadAvatarFile: (formData) =>
    api.post('/auth/upload-avatar-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
  addComment: (eventId, data) => api.post(`/events/${eventId}/comments`, data),
  updateComment: (eventId, commentId, data) =>
    api.put(`/events/${eventId}/comments/${commentId}`, data),
  deleteComment: (eventId, commentId) =>
    api.delete(`/events/${eventId}/comments/${commentId}`),
  likeComment: (eventId, commentId) =>
    api.post(`/events/${eventId}/comments/${commentId}/like`),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStudentStats: () => api.get('/dashboard/student/stats'),
  getAdminStats: () => api.get('/dashboard/admin/stats'),
};
//attendance API
export const attendanceAPI = {
  markAttendance: (eventId) => api.post(`/events/${eventId}/attend`),
  getAttendance: (eventId) => api.get(`/events/${eventId}/attendance`),
};
export default api;