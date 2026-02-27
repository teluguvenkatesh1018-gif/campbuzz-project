import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';

const Header = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getHomeRoute = () => {
    return isAuthenticated ? '/home' : '/';
  };

  return (
    <header className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to={getHomeRoute()} className="flex items-center space-x-2 hover:opacity-80 transition duration-200">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <span className="text-xl font-bold">🎓</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CampBuzz</h1>
              <span className="text-sm text-gray-600">Campus Events Hub</span>
            </div>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            {/* Home Link */}
            <Link 
              to={getHomeRoute()} 
              className={`font-medium hover:text-blue-600 transition duration-200 px-3 py-2 rounded-lg ${
                isActiveRoute('/') || isActiveRoute('/home') 
                  ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              🏠 Home
            </Link>

            {/* Dashboard Link */}
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className={`font-medium hover:text-blue-600 transition duration-200 px-3 py-2 rounded-lg ${
                  isActiveRoute('/dashboard') 
                    ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📊 Dashboard
              </Link>
            )}

            {/* Events Link */}
            {isAuthenticated && (
              <Link 
                to="/events" 
                className={`font-medium hover:text-blue-600 transition duration-200 px-3 py-2 rounded-lg ${
                  isActiveRoute('/events') 
                    ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📅 Events
              </Link>
            )}

            {/* Profile Link - ADDED */}
            {isAuthenticated && (
              <Link 
                to="/profile" 
                className={`font-medium hover:text-blue-600 transition duration-200 px-3 py-2 rounded-lg ${
                  isActiveRoute('/profile') 
                    ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                👤 Profile
              </Link>
            )}

            {/* Admin Links */}
            {isAuthenticated && user?.role === 'admin' && (
              <Link 
                to="/create-event" 
                className={`font-medium hover:text-green-600 transition duration-200 px-3 py-2 rounded-lg ${
                  isActiveRoute('/create-event') 
                    ? 'text-green-600 bg-green-50 border border-green-200' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                ➕ Create Event
              </Link>
            )}

            {/* User Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700 hidden md:block">Hi, {user?.name}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition duration-200 font-medium"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="font-medium text-gray-700 hover:text-blue-600 transition duration-200 px-4 py-2 rounded-lg hover:bg-gray-100"
                >
                  🔑 Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
                >
                  📝 Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;