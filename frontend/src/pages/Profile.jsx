import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { authAPI } from '../services/api';

const Profile = () => {
  const { user: currentUser } = useSelector(state => state.auth);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState({
    eventsCreated: 0,
    favoritesCount: 0,
    likesCount: 0,
    registeredEvents: 0,
    totalPoints: 0,
    level: 1,
    badgesCount: 0,
    eventHistoryCount: 0
  });

  const [formData, setFormData] = useState({
    name: '',
    collegeRoll: '',
    phone: '',
    department: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data;
      setUser(userData);
      setFormData({
        name: userData.name || '',
        collegeRoll: userData.collegeRoll || '',
        phone: userData.phone || '',
        department: userData.department || '',
        bio: userData.bio || ''
      });

      await fetchUserStats();
      
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await authAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.updateProfile(formData);
      setUser(response.data);
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await authAPI.uploadAvatarFile(formData);
      setUser({ ...user, avatar: response.data.avatar });
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload profile picture');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            
            {/* Avatar Section */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white"
                    />
                  ) : (
                    <span className="text-4xl text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-2 right-2 bg-white text-blue-600 p-2 rounded-full cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 border border-blue-200">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              </div>
            </div>

            {/* User Info Section */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {user?.name || 'User'}
              </h1>
              <p className="text-xl text-gray-600 mb-4">{user?.collegeRoll}</p>
              
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  user?.role === 'admin' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                    : 'bg-green-100 text-green-800 border border-green-200'
                }`}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
                <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
                  Level {stats.level}
                </span>
                <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold border border-orange-200">
                  {stats.totalPoints} Points
                </span>
              </div>

              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  {editMode ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                
                {user?.department && (
                  <span className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl border border-gray-200 font-medium">
                    {user.department}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.eventsCreated}</div>
            <div className="text-sm text-gray-600 font-medium">Events Created</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-200">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.favoritesCount}</div>
            <div className="text-sm text-gray-600 font-medium">Favorites</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.likesCount}</div>
            <div className="text-sm text-gray-600 font-medium">Likes</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center hover:shadow-xl transition-all duration-200">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.registeredEvents}</div>
            <div className="text-sm text-gray-600 font-medium">Registered</div>
          </div>
        </div>

        {/* Edit Form / Profile Info */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {editMode ? (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    College Roll Number *
                  </label>
                  <input
                    type="text"
                    name="collegeRoll"
                    value={formData.collegeRoll}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Tell us about yourself..."
                  maxLength="200"
                />
                <p className="text-sm text-gray-500 mt-2 text-right">
                  {formData.bio.length}/200 characters
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="bg-gray-500 text-white px-8 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Personal Details</h3>
                    <div className="space-y-4">
                      <div>
                        <span className="font-medium text-blue-700">College Roll:</span>
                        <p className="text-blue-900 font-semibold text-lg">{user?.collegeRoll}</p>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Full Name:</span>
                        <p className="text-blue-900">{user?.name}</p>
                      </div>
                      {user?.phone && (
                        <div>
                          <span className="font-medium text-blue-700">Phone:</span>
                          <p className="text-blue-900">{user.phone}</p>
                        </div>
                      )}
                      {user?.department && (
                        <div>
                          <span className="font-medium text-blue-700">Department:</span>
                          <p className="text-blue-900">{user.department}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4">About Me</h3>
                    <p className="text-purple-900 leading-relaxed">
                      {user?.bio || 'No bio provided yet. Share something about yourself!'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-semibold mb-3">Achievement Progress</h3>
                    <div className="flex justify-between items-center mb-2">
                      <span>Level {stats.level}</span>
                      <span className="font-bold">{stats.totalPoints} pts</span>
                    </div>
                    <div className="w-full bg-blue-400 rounded-full h-3">
                      <div 
                        className="bg-white rounded-full h-3 transition-all duration-500"
                        style={{ width: `${(stats.totalPoints % 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-blue-100 text-sm mt-2 text-center">
                      {100 - (stats.totalPoints % 100)} points to level {stats.level + 1}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Badges Section */}
        {stats.badgesCount > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.badges?.slice(0, 6).map((badge, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 text-center hover:shadow-lg transition-all duration-200">
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{badge.name}</h3>
                  <p className="text-gray-600 text-sm">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;