// src/pages/Home.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Home = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold mb-4">Welcome to CampBuzz! 🎓</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Never miss out on campus life again. Stay updated with all events, hackathons, and workshops happening around you.
            </p>
            <div className="space-x-4">
              <Link 
                to="/login" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
              >
                Join Now
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose CampBuzz?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-semibold mb-2">All Events in One Place</h3>
                <p className="text-gray-600">
                  From hackathons to workshops, never miss an important campus event again.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold mb-2">Smart Reminders</h3>
                <p className="text-gray-600">
                  Get notified about events you're interested in and never forget to register.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-2">Connect with Peers</h3>
                <p className="text-gray-600">
                  Discover what events your friends are attending and join the campus community.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">1</span>
                </div>
                <h3 className="font-semibold mb-2">Sign Up</h3>
                <p className="text-gray-600 text-sm">Create your student account</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">2</span>
                </div>
                <h3 className="font-semibold mb-2">Explore</h3>
                <p className="text-gray-600 text-sm">Browse campus events</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">3</span>
                </div>
                <h3 className="font-semibold mb-2">Register</h3>
                <p className="text-gray-600 text-sm">Join events you like</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">4</span>
                </div>
                <h3 className="font-semibold mb-2">Participate</h3>
                <p className="text-gray-600 text-sm">Attend and enjoy events</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-gray-600">Events Listed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">2K+</div>
                <div className="text-gray-600">Active Students</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">50+</div>
                <div className="text-gray-600">Clubs & Orgs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">24/7</div>
                <div className="text-gray-600">Updated</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of students already using CampBuzz to stay connected with campus life.
            </p>
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Create Your Account
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // Show logged-in user content
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section for Logged-in Users */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Welcome back, {user?.name}! 👋</h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Ready to explore the latest campus events, hackathons, and workshops? 
            Stay connected with your college community and discover exciting opportunities.
          </p>
          <div className="space-x-4">
            <Link 
              to="/events" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Browse Events
            </Link>
            <Link 
              to="/dashboard" 
              className="border border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Campus Overview</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Upcoming Events</h3>
              <p className="text-gray-600">
                Check out the latest hackathons, workshops, and activities happening on campus this week.
              </p>
              <Link 
                to="/events" 
                className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-semibold"
              >
                View All Events →
              </Link>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">Your Favorites</h3>
              <p className="text-gray-600">
                Access your saved events and get reminders for the activities you're interested in.
              </p>
              <Link 
                to="/dashboard?tab=favorites" 
                className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-semibold"
              >
                View Favorites →
              </Link>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Club Activities</h3>
              <p className="text-gray-600">
                Explore events from various clubs and organizations across the campus.
              </p>
              <Link 
                to="/events?type=club-activity" 
                className="inline-block mt-4 text-blue-600 hover:text-blue-800 font-semibold"
              >
                Browse Clubs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (Updated for logged-in users) */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Make the Most of CampBuzz</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="text-xl font-semibold mb-2">Like & Save Events</h3>
              <p className="text-gray-600">
                Heart your favorite events and save them to your personal dashboard for quick access.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold mb-2">Get Notified</h3>
              <p className="text-gray-600">
                Receive instant notifications about event updates, new activities, and deadline reminders.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Social Features</h3>
              <p className="text-gray-600">
                Like, comment, and share events with friends. Connect with other students on campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <Link 
              to="/events" 
              className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold mb-2">Browse Events</h3>
              <p className="text-gray-600 text-sm">Discover upcoming activities</p>
            </Link>
            
            <Link 
              to="/create-event" 
              className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-3">➕</div>
              <h3 className="font-semibold mb-2">Create Event</h3>
              <p className="text-gray-600 text-sm">Organize an activity</p>
            </Link>
            
            <Link 
              to="/profile" 
              className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-3">👤</div>
              <h3 className="font-semibold mb-2">Profile</h3>
              <p className="text-gray-600 text-sm">Manage your account</p>
            </Link>
            
            <Link 
              to="/dashboard" 
              className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow"
            >
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">Dashboard</h3>
              <p className="text-gray-600 text-sm">Your activity hub</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Activity Preview */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Engaged</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Check back regularly for new events and updates from your campus community.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">🎯 Pro Tip</h3>
              <p className="text-gray-700">
                Use the favorite feature to bookmark events you're interested in. You'll get reminders before they start!
              </p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">💡 Suggestion</h3>
              <p className="text-gray-700">
                Follow your favorite clubs and organizations to get personalized event recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section (Updated for logged-in context) */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">New</div>
              <div className="text-gray-600">Events This Week</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">Active</div>
              <div className="text-gray-600">Clubs & Organizations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">Your</div>
              <div className="text-gray-600">Upcoming Events</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">Campus</div>
              <div className="text-gray-600">Community</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;