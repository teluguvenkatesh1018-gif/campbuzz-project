// Register.jsx - Registration Selection Page
import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <span className="text-6xl">🎓</span>
          </div>
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
            Join CampBuzz
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose your account type to get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Student Registration Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all">
            <div className="text-center">
              <div className="text-4xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Student Account</h2>
              <p className="text-gray-600 mb-6">
                Join as a student to explore and participate in campus events, workshops, and activities.
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-2 mb-6">
                <li>✅ Browse all campus events</li>
                <li>✅ Register for events</li>
                <li>✅ Save favorite events</li>
                <li>✅ Connect with peers</li>
                <li>✅ Get event notifications</li>
              </ul>
              <Link
                to="/register-student"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-block font-semibold"
              >
                Register as Student
              </Link>
            </div>
          </div>

          {/* Admin Registration Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-200 hover:border-green-400 transition-all">
            <div className="text-center">
              <div className="text-4xl mb-4">👨‍💼</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Account</h2>
              <p className="text-gray-600 mb-6">
                Register as an admin to create and manage campus events. Requires verification.
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-2 mb-6">
                <li>✅ Create and manage events</li>
                <li>✅ Approve event registrations</li>
                <li>✅ Manage event teams</li>
                <li>✅ Access analytics dashboard</li>
                <li>⚠️ Requires college verification</li>
              </ul>
              <Link
                to="/register-admin"
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors inline-block font-semibold"
              >
                Register as Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;