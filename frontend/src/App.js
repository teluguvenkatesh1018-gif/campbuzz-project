import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { setCredentials, logout } from './store/slices/authSlice';
import { DarkModeProvider } from './contexts/DarkModeContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterStudent from './pages/RegisterStudent';
import RegisterAdmin from './pages/RegisterAdmin';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import PersonalCalendar from './components/PersonalCalendar';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          // Verify token is not expired
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            dispatch(setCredentials({
              token,
              user: JSON.parse(userData)
            }));
          } else {
            // Token expired
            dispatch(logout());
          }
        } catch (error) {
          console.error('Auth check error:', error);
          dispatch(logout());
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [dispatch]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading CampBuzz...</p>
        </div>
      </div>
    );
  }

  return (
    <DarkModeProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
            <Routes>
              {/* Home page - role-based redirection */}
              <Route 
                path="/" 
                element={
                  isAuthenticated ? (
                    user?.role === 'admin' ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <Home />
                    )
                  ) : (
                    <Home />
                  )
                } 
              />
              
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
              />
              <Route 
                path="/register" 
                element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} 
              />
              <Route 
                path="/register-student" 
                element={!isAuthenticated ? <RegisterStudent /> : <Navigate to="/dashboard" replace />} 
              />
              <Route 
                path="/register-admin" 
                element={!isAuthenticated ? <RegisterAdmin /> : <Navigate to="/dashboard" replace />} 
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected Routes - Role-based Dashboard */}
              <Route 
                path="/dashboard" 
                element={
                  isAuthenticated ? (
                    user?.role === 'admin' ? (
                      <Dashboard />
                    ) : (
                      <StudentDashboard />
                    )
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />
              
              {/* Protected Routes - Requires Authentication */}
              <Route 
                path="/events" 
                element={isAuthenticated ? <Events /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/event/:id" 
                element={isAuthenticated ? <EventDetails /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/profile" 
                element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} 
              />
              <Route 
                path="/my-calendar" 
                element={isAuthenticated ? <PersonalCalendar /> : <Navigate to="/login" replace />} 
              />
              <Route path="/home" element={<Home />} />

              {/* Admin Only Routes */}
              <Route 
                path="/create-event" 
                element={
                  isAuthenticated && user?.role === 'admin' ? 
                  <CreateEvent /> : 
                  <Navigate to="/dashboard" replace />
                } 
              />
              <Route 
                path="/edit-event/:id" 
                element={
                  isAuthenticated && user?.role === 'admin' ? 
                  <EditEvent /> : 
                  <Navigate to="/dashboard" replace />
                } 
              />
              
              {/* Catch all route - redirect to appropriate page */}
              <Route 
                path="*" 
                element={
                  <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
                } 
              />
            </Routes>
          </main>
          
          <footer className="bg-gray-800 dark:bg-gray-900 text-white py-8 mt-16 transition-colors duration-300">
            <div className="container mx-auto px-4 text-center">
              <p className="text-lg font-semibold">🎓 CampBuzz - Campus Events Hub</p>
              <p className="text-gray-400 dark:text-gray-300 mt-2">
                Never miss out on campus life again. Stay updated with all events, hackathons, and workshops.
              </p>
              <div className="mt-4 flex justify-center space-x-6">
                <span className="text-gray-400 dark:text-gray-300">📧 contact@campbuzz.com</span>
                <span className="text-gray-400 dark:text-gray-300">📱 +1 (555) 123-4567</span>
                <span className="text-gray-400 dark:text-gray-300">🏫 Campus University</span>
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <a href="#" className="text-gray-400 dark:text-gray-300 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 dark:text-gray-300 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 dark:text-gray-300 hover:text-white transition-colors">Contact Support</a>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-6">
                © 2024 CampBuzz. All rights reserved. Built with ❤️ for students.
              </p>
            </div>
          </footer>

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </DarkModeProvider>
  );
}

export default App;