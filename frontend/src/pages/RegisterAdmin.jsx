import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, otpAPI } from '../services/api';

const RegisterAdmin = () => {
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    rollNo: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Admin Information
    collegeName: '',
    adminFor: '', // Department, College, etc.
    branch: '',
    section: '',
    position: '', // HOD, Professor, Coordinator, etc.
    
    // Verification Documents
    idCard: null,
    authorizationLetter: null,
    
    // Security
    securityQuestion: '',
    securityAnswer: '',
    
    // OTP Verification
    otp: '',
    isOtpSent: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Basic info, 2: Documents, 3: OTP verification
  const [idCardPreview, setIdCardPreview] = useState('');
  const [letterPreview, setLetterPreview] = useState('');
  const navigate = useNavigate();

  const branches = [
    'Computer Science & Engineering',
    'Electronics & Communication', 
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Information Technology',
    'College Level',
    'Other'
  ];

  const positions = [
    'Head of Department',
    'Professor',
    'Assistant Professor',
    'Event Coordinator',
    'Student Coordinator',
    'Club President',
    'Other'
  ];

  const securityQuestions = [
    'What was your first pet\'s name?',
    'What elementary school did you attend?',
    'What is your mother\'s maiden name?',
    'What city were you born in?',
    'What was your first car model?'
  ];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files) {
      setFormData({
        ...formData,
        [name]: files[0]
      });
      
      // Create preview for images
      if (files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (name === 'idCard') {
            setIdCardPreview(e.target.result);
          } else if (name === 'authorizationLetter') {
            setLetterPreview(e.target.result);
          }
        };
        reader.readAsDataURL(files[0]);
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateStep1 = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.rollNo.trim()) errors.push('Roll Number/Employee ID is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.email.endsWith('.edu') && !formData.email.includes('@college')) {
      errors.push('Please use your college email address');
    }
    if (!formData.phone.trim()) errors.push('Phone number is required');
    if (!formData.collegeName.trim()) errors.push('College name is required');
    if (!formData.adminFor.trim()) errors.push('Please specify what you are admin for');
    if (!formData.branch) errors.push('Branch/Department is required');
    if (!formData.position) errors.push('Position is required');
    if (!formData.securityQuestion) errors.push('Security question is required');
    if (!formData.securityAnswer.trim()) errors.push('Security answer is required');
    if (formData.password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.push('Password must contain uppercase, lowercase letters and numbers');
    }
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    
    return errors;
  };

  const validateStep2 = () => {
    const errors = [];
    
    if (!formData.idCard) errors.push('ID Card photo is required');
    if (!formData.authorizationLetter) errors.push('Authorization letter is required');
    
    return errors;
  };

  const handleSendOtp = async () => {
    const errors = [...validateStep1(), ...validateStep2()];
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Real OTP API call
      await otpAPI.sendOtp({
        email: formData.email,
        phone: formData.phone,
        purpose: 'admin-verification'
      });
      
      setFormData(prev => ({ ...prev, isOtpSent: true }));
      setStep(3);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP first
      await otpAPI.verifyOtp({
        email: formData.email,
        otp: formData.otp
      });

      // If OTP verified, proceed with admin registration
      const submitData = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (key !== 'confirmPassword' && key !== 'otp' && key !== 'isOtpSent') {
          submitData.append(key, formData[key]);
        }
      });
      
      submitData.append('role', 'admin');
      submitData.append('status', 'pending'); // Admin accounts need approval
      
      const response = await authAPI.registerAdmin(submitData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      alert('Admin registration submitted for approval! You will be notified once verified by the college administration.');
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <span className="text-4xl">👨‍💼</span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
              Admin Registration
            </h1>
            <p className="mt-2 text-gray-600">
              Register as an admin to manage campus events (Verification Required)
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map(stepNum => (
                <React.Fragment key={stepNum}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= stepNum ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-1 ${
                      step > stepNum ? 'bg-green-600' : 'bg-gray-300'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Roll Number / Employee ID *
                  </label>
                  <input
                    type="text"
                    name="rollNo"
                    value={formData.rollNo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="name@college.edu"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be a valid college email address</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                {/* Admin Information */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Information</h3>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College/University Name *
                  </label>
                  <input
                    type="text"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your institution name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin For *
                  </label>
                  <input
                    type="text"
                    name="adminFor"
                    value={formData.adminFor}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., CSE Department, College Events"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch/Department *
                  </label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Branch/Department</option>
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section (if applicable)
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., A, B, C"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position/Role *
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Position</option>
                    {positions.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>

                {/* Security */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Question *
                  </label>
                  <select
                    name="securityQuestion"
                    value={formData.securityQuestion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Security Question</option>
                    {securityQuestions.map(question => (
                      <option key={question} value={question}>{question}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Answer *
                  </label>
                  <input
                    type="text"
                    name="securityAnswer"
                    value={formData.securityAnswer}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your answer"
                    required
                  />
                </div>

                {/* Password */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter password (min. 8 characters)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must contain uppercase, lowercase letters and numbers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Link
                  to="/login"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Login
                </Link>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue to Document Upload
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-900">Verification Documents</h3>
                <p className="text-gray-600 mt-2">
                  Upload required documents for admin verification
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Card Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    College ID Card *
                  </label>
                  <input
                    type="file"
                    name="idCard"
                    onChange={handleChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="idCard"
                    required
                  />
                  <label
                    htmlFor="idCard"
                    className="cursor-pointer bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors inline-block"
                  >
                    Choose File
                  </label>
                  {formData.idCard && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {formData.idCard.name}
                    </p>
                  )}
                  {idCardPreview && (
                    <div className="mt-4">
                      <img 
                        src={idCardPreview} 
                        alt="ID Card Preview" 
                        className="max-w-full h-32 object-contain mx-auto"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Upload clear photo of your college ID card
                  </p>
                </div>

                {/* Authorization Letter */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Authorization Letter *
                  </label>
                  <input
                    type="file"
                    name="authorizationLetter"
                    onChange={handleChange}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    id="authorizationLetter"
                    required
                  />
                  <label
                    htmlFor="authorizationLetter"
                    className="cursor-pointer bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors inline-block"
                  >
                    Choose File
                  </label>
                  {formData.authorizationLetter && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {formData.authorizationLetter.name}
                    </p>
                  )}
                  {letterPreview && (
                    <div className="mt-4">
                      <img 
                        src={letterPreview} 
                        alt="Letter Preview" 
                        className="max-w-full h-32 object-contain mx-auto"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Upload authorization letter from college authorities
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Admin accounts require manual verification by college authorities</li>
                  <li>Verification may take 24-48 hours</li>
                  <li>Ensure all documents are clear and valid</li>
                  <li>You will be notified via email once verified</li>
                </ul>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP & Submit for Verification'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-xl font-semibold text-gray-900">Final Verification</h3>
                <p className="text-gray-600 mt-2">
                  Enter the OTP sent to your email and phone for final verification
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP *
                </label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl tracking-widest"
                  placeholder="000000"
                  required
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-green-600 hover:text-green-500 text-sm"
                >
                  Resend OTP
                </button>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center border-t pt-6">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterAdmin;