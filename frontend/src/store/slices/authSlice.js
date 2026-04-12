// src/store/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Helper function to validate token expiration
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

// Helper function to get initial state from localStorage
const getInitialState = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user && !isTokenExpired(token)) {
    try {
      return {
        user: JSON.parse(user),
        token: token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    } catch (error) {
      console.error('Error parsing stored user data:', error);
    }
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },

    updateProfile: (state, action) => {
      if (!state.user) return;

      state.user = {
        ...state.user,
        ...action.payload
      };

      localStorage.setItem('user', JSON.stringify(state.user));
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    }
  },
});

export const { 
  setCredentials, 
  updateProfile,   // ✅ added export
  logout, 
  setLoading, 
  clearError 
} = authSlice.actions;

export default authSlice.reducer;