import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-toastify';
import { updateProfile } from '../store/slices/authSlice';
import { authAPI, userAPI } from '../services/api';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    bio: '',
    socialMedia: { linkedin: '', github: '', twitter: '', portfolio: '' }
  });
  const [adminEvents, setAdminEvents] = useState([]);

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        socialMedia: user.socialMedia || { linkedin: '', github: '', twitter: '', portfolio: '' }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminEvents();
    }
  }, [user]);

  const fetchAdminEvents = async () => {
    try {
      const response = await userAPI.getEventsByOrganizer(user.id);
      setAdminEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to fetch admin events', error);
      setAdminEvents([]);
    }
  };

  const getStudentStats = () => {
    const eventHistory = user?.eventHistory || [];
    const attended = eventHistory.filter(e => e.action === 'attended').length;
    const registered = eventHistory.filter(e => e.action === 'registered').length;
    const missed = Math.max(0, registered - attended);
    const completedEvents = attended;
    const totalPoints = user?.totalPoints || 0;
    const level = user?.level || 1;
    return { attended, registered, missed, completedEvents, totalPoints, level };
  };

  const getAdminStats = () => {
    const eventsCreated = user?.statistics?.eventsCreated || 0;
    const now = new Date();
    const upcoming = adminEvents.filter(e => new Date(e.date) > now).length;
    const completed = adminEvents.filter(e => new Date(e.date) < now && e.status === 'published').length;
    const totalAttendees = adminEvents.reduce((sum, e) => sum + (e.attendance?.length || 0), 0);
    return { eventsCreated, upcoming, completed, totalAttendees };
  };

  const studentStats = getStudentStats();
  const adminStats = getAdminStats();

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.updateProfile(editForm);
      dispatch(updateProfile(response.data.user));
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (platform, value) => {
    setEditForm(prev => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [platform]: value }
    }));
  };

  const qrData = JSON.stringify({
    userId: user?.id,
    name: user?.name,
    roll: user?.collegeRoll,
    timestamp: Date.now(),
    type: 'profile'
  });

  if (!isAuthenticated || !user) {
    return <div className="text-center py-10">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Top Row: Full gradient card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Left: User details */}
            <div className="flex-1 p-6 md:p-8 text-white">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-lg border-2 border-white">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">{user.name}</h1>
                  <p className="text-blue-100 text-lg mt-1">{user.collegeRoll}</p>
                  <p className="text-blue-100 mt-1">
                    {user.department || 'AIML'} • {user.course || 'B.Tech'}
                  </p>
                  {user.role === 'admin' && (
                    <span className="inline-block mt-2 bg-yellow-400 text-gray-800 text-xs px-2 py-1 rounded-full">
                      Administrator
                    </span>
                  )}
                  <div className="mt-4 flex space-x-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-100">Email:</span>
                  <p className="font-medium text-white">{user.email}</p>
                </div>
                <div>
                  <span className="text-blue-100">Phone:</span>
                  <p className="font-medium text-white">{user.phone || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-blue-100">Member since:</span>
                  <p className="font-medium text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-blue-100">Bio:</span>
                  <p className="font-medium text-white">{user.bio || 'No bio yet'}</p>
                </div>
              </div>
            </div>

            {/* Right: QR Code – now also on gradient */}
            <div className="md:border-l border-white/20 p-6 md:p-8 flex flex-col items-center justify-center text-white">
              <h3 className="text-lg font-semibold text-white mb-2">Profile QR</h3>
              <p className="text-blue-100 text-center mb-4">
                Scan to view profile or mark attendance
              </p>
              <div id="profile-qr" className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={qrData} size={160} level="H" includeMargin={true} />
              </div>
              <button
                onClick={() => {
                  const svg = document.querySelector('#profile-qr svg');
                  if (svg) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL('image/png');
                      const downloadLink = document.createElement('a');
                      downloadLink.download = 'profile-qr.png';
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                  }
                }}
                className="mt-4 text-sm text-white underline hover:text-blue-200"
              >
                Download QR Code
              </button>
              <p className="text-xs text-blue-100 mt-3">
                QR code changes with each visit for security.
              </p>
            </div>
          </div>
        </div>

        {/* Performance Overview (unchanged) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center mr-3">
              📊
            </span>
            Performance Overview
          </h3>

          {user.role === 'student' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Events Attended" value={studentStats.attended} color="green" />
              <StatCard label="Events Missed" value={studentStats.missed} color="red" />
              <StatCard label="Completed Events" value={studentStats.completedEvents} color="blue" />
              <StatCard label="Total Points" value={studentStats.totalPoints} color="purple" />
              <StatCard label="Level" value={studentStats.level} color="orange" />
              <StatCard label="Events Registered" value={studentStats.registered} color="indigo" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Events Created" value={adminStats.eventsCreated} color="blue" />
              <StatCard label="Upcoming Events" value={adminStats.upcoming} color="green" />
              <StatCard label="Completed Events" value={adminStats.completed} color="purple" />
              <StatCard label="Total Attendees" value={adminStats.totalAttendees} color="orange" />
            </div>
          )}
        </div>

        {/* Recent Activity (unchanged) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="bg-gray-100 text-gray-600 w-8 h-8 rounded-full flex items-center justify-center mr-3">
              📋
            </span>
            Recent Activity
          </h3>
          {user.eventHistory && user.eventHistory.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {user.eventHistory.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium text-gray-800">
                      {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                    </p>
                    <p className="text-sm text-gray-500">Event ID: {activity.event}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recent activity.</p>
          )}
        </div>

        {/* Social Links (unchanged) */}
        {user.socialMedia && Object.values(user.socialMedia).some(v => v) && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🔗 Connect with me</h3>
            <div className="flex flex-wrap gap-4">
              {user.socialMedia.linkedin && (
                <a href={user.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">LinkedIn</a>
              )}
              {user.socialMedia.github && (
                <a href={user.socialMedia.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:underline">GitHub</a>
              )}
              {user.socialMedia.twitter && (
                <a href={user.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Twitter</a>
              )}
              {user.socialMedia.portfolio && (
                <a href={user.socialMedia.portfolio} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">Portfolio</a>
              )}
            </div>
          </div>
        )}

        {/* Badges Section (unchanged) */}
        {user.badges && user.badges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🏅 Badges & Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge, idx) => (
                <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 flex items-center text-sm">
                  <span className="mr-1">{badge.icon || '🏆'}</span>
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleInputChange} className="mt-1 w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input type="tel" name="phone" value={editForm.phone} onChange={handleInputChange} className="mt-1 w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea name="bio" rows="3" value={editForm.bio} onChange={handleInputChange} className="mt-1 w-full border rounded-lg p-2"></textarea>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Social Media</h3>
                  <div className="space-y-2">
                    <input type="url" placeholder="LinkedIn URL" value={editForm.socialMedia.linkedin} onChange={(e) => handleSocialChange('linkedin', e.target.value)} className="w-full border rounded-lg p-2" />
                    <input type="url" placeholder="GitHub URL" value={editForm.socialMedia.github} onChange={(e) => handleSocialChange('github', e.target.value)} className="w-full border rounded-lg p-2" />
                    <input type="url" placeholder="Twitter URL" value={editForm.socialMedia.twitter} onChange={(e) => handleSocialChange('twitter', e.target.value)} className="w-full border rounded-lg p-2" />
                    <input type="url" placeholder="Portfolio URL" value={editForm.socialMedia.portfolio} onChange={(e) => handleSocialChange('portfolio', e.target.value)} className="w-full border rounded-lg p-2" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {isChangingPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Change Password</h2>
                <button onClick={() => setIsChangingPassword(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="mt-1 w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="mt-1 w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1 w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setIsChangingPassword(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Password</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    indigo: 'bg-indigo-100 text-indigo-800'
  };
  return (
    <div className={`rounded-xl p-4 text-center ${colorClasses[color]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
};

export default Profile;