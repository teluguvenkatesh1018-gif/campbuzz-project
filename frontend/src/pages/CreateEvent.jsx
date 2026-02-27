import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/api';

const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'workshop',
    customType: '',
    date: '',
    time: '',
    venue: '',
    collegeName: '',
    registrationLink: '',
    isPaid: false,
    price: 0,
    tags: '',
    status: 'draft',
    socialMedia: {
      instagram: '',
      twitter: '',
      facebook: '',
      website: '',
      linkedin: '',
      youtube: ''
    },
    teamMembers: [],
    // NEW: Registration Fields
    maxParticipants: 0,
    registrationOpen: true,
    registrationDeadline: '',
    registrationFields: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [activeSection, setActiveSection] = useState('basic');
  
  // NEW: Registration Field State
  const [currentField, setCurrentField] = useState({
    fieldName: '',
    fieldType: 'text',
    required: false,
    options: []
  });
  const [newOption, setNewOption] = useState('');

  const navigate = useNavigate();

  const eventTypes = [
    { value: 'workshop', label: 'Workshop', icon: '🔧' },
    { value: 'hackathon', label: 'Hackathon', icon: '💻' },
    { value: 'seminar', label: 'Seminar', icon: '🎓' },
    { value: 'club-activity', label: 'Club Activity', icon: '👥' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'cultural', label: 'Cultural', icon: '🎭' },
    { value: 'conference', label: 'Conference', icon: '🏛️' },
    { value: 'webinar', label: 'Webinar', icon: '📹' },
    { value: 'competition', label: 'Competition', icon: '🏆' },
    { value: 'custom', label: 'Custom Type', icon: '✨' }
  ];

  // NEW: Field Types for Registration Form
  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
    { value: 'select', label: 'Dropdown Select', icon: '📋' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('socialMedia.')) {
      const socialMediaField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialMediaField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTeamMemberChange = (index, field, value) => {
    const updatedTeamMembers = [...formData.teamMembers];
    updatedTeamMembers[index] = {
      ...updatedTeamMembers[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
  };

  const addTeamMember = () => {
    setFormData(prev => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        { name: '', email: '', role: '', phone: '', department: '' }
      ]
    }));
  };

  const removeTeamMember = (index) => {
    const updatedTeamMembers = formData.teamMembers.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      teamMembers: updatedTeamMembers
    }));
  };

  // NEW: Registration Field Handlers
  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addOption = () => {
    if (newOption.trim() && !currentField.options.includes(newOption.trim())) {
      setCurrentField(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setCurrentField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const addRegistrationField = () => {
    if (!currentField.fieldName.trim()) {
      setError('Please enter a field name');
      return;
    }

    // Check for duplicate field names
    if (formData.registrationFields.some(field => field.fieldName === currentField.fieldName)) {
      setError('Field name already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      registrationFields: [...prev.registrationFields, { ...currentField }]
    }));

    // Reset current field
    setCurrentField({
      fieldName: '',
      fieldType: 'text',
      required: false,
      options: []
    });
    setNewOption('');
    setError('');
  };

  const removeRegistrationField = (index) => {
    setFormData(prev => ({
      ...prev,
      registrationFields: prev.registrationFields.filter((_, i) => i !== index)
    }));
  };

  const moveField = (index, direction) => {
    const fields = [...formData.registrationFields];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < fields.length) {
      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
      setFormData(prev => ({ ...prev, registrationFields: fields }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.description.trim()) newErrors.description = 'Event description is required';
    if (!formData.date) newErrors.date = 'Event date is required';
    if (!formData.time) newErrors.time = 'Event time is required';
    if (!formData.venue.trim()) newErrors.venue = 'Event venue is required';
    if (!formData.collegeName.trim()) newErrors.collegeName = 'College name is required';

    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Event date cannot be in the past';
      }
    }

    if (formData.isPaid) {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Please enter a valid price';
      } else if (price === 0) {
        newErrors.price = 'Price must be greater than 0 for paid events';
      }
    }

    formData.teamMembers.forEach((member, index) => {
      if (member.name && (!member.email || !member.role)) {
        newErrors[`teamMember_${index}`] = 'Team member must have both email and role';
      }
      if (member.email && !member.name) {
        newErrors[`teamMember_${index}`] = 'Team member must have a name';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const cleanTeamMembers = formData.teamMembers.filter(member => 
        member.name.trim() && member.email.trim() && member.role.trim()
      );

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type === 'custom' ? formData.customType : formData.type,
        date: formData.date,
        time: formData.time,
        venue: formData.venue.trim(),
        collegeName: formData.collegeName.trim(),
        registrationLink: formData.registrationLink.trim(),
        isPaid: formData.isPaid,
        price: formData.isPaid ? parseFloat(formData.price) : 0,
        tags: formData.tags,
        status: formData.status,
        socialMedia: formData.socialMedia,
        teamMembers: cleanTeamMembers,
        // NEW: Registration Data
        maxParticipants: parseInt(formData.maxParticipants) || 0,
        registrationOpen: formData.registrationOpen,
        registrationDeadline: formData.registrationDeadline || undefined,
        registrationFields: formData.registrationFields
      };

      const response = await eventsAPI.createEvent(eventData);
      alert('🎉 Event created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Create event error:', error);
      if (error.response?.data?.errors) {
        setError('Please fix the following errors:');
        const serverErrors = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors 
          : [error.response.data.errors];
        
        setErrors(serverErrors.reduce((acc, err) => {
          if (err.includes('title')) acc.title = err;
          else if (err.includes('description')) acc.description = err;
          else if (err.includes('date')) acc.date = err;
          else if (err.includes('time')) acc.time = err;
          else if (err.includes('venue')) acc.venue = err;
          else if (err.includes('price')) acc.price = err;
          else acc.general = err;
          return acc;
        }, {}));
      } else {
        setError(error.response?.data?.message || 'Failed to create event');
      }
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'details', label: 'Event Details', icon: '📅' },
    { id: 'registration', label: 'Registration', icon: '📋' }, // NEW SECTION
    { id: 'team', label: 'Team Members', icon: '👥' },
    { id: 'social', label: 'Social Links', icon: '🔗' },
    { id: 'publish', label: 'Publish', icon: '🚀' }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter an engaging event title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-2">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  College Name *
                </label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.collegeName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Your college name"
                />
                {errors.collegeName && <p className="text-red-500 text-sm mt-2">{errors.collegeName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Event Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="5"
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your event in detail... What will attendees learn? What makes it special?"
              />
              {errors.description && <p className="text-red-500 text-sm mt-2">{errors.description}</p>}
              <p className="text-sm text-gray-500 mt-2">{formData.description.length}/500 characters</p>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            {/* Event Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Event Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {eventTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <span className="text-2xl mb-2">{type.icon}</span>
                    <span className="text-sm font-medium text-center">{type.label}</span>
                  </label>
                ))}
              </div>
              
              {formData.type === 'custom' && (
                <div className="mt-4">
                  <input
                    type="text"
                    name="customType"
                    value={formData.customType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your custom event type..."
                  />
                </div>
              )}
            </div>

            {/* Date, Time & Venue */}
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📅 Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={getMinDate()}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date && <p className="text-red-500 text-sm mt-2">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  ⏰ Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.time ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.time && <p className="text-red-500 text-sm mt-2">{errors.time}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📍 Venue *
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    errors.venue ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Auditorium, Lab, Ground, etc."
                />
                {errors.venue && <p className="text-red-500 text-sm mt-2">{errors.venue}</p>}
              </div>
            </div>

            {/* Registration & Tags */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🔗 Registration Link
                </label>
                <input
                  type="url"
                  name="registrationLink"
                  value={formData.registrationLink}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="https://forms.google.com/your-form"
                />
                <p className="text-sm text-gray-500 mt-2">External registration link (optional)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🏷️ Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="technology, coding, workshop, innovation"
                />
                <p className="text-sm text-gray-500 mt-2">Separate tags with commas</p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-blue-100">
              <h3 className="text-lg font-semibold mb-4">💰 Payment Information</h3>
              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isPaid"
                      checked={formData.isPaid}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full transition-all duration-300 ${
                      formData.isPaid ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${
                      formData.isPaid ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">This is a paid event</span>
                </label>
              </div>
              
              {formData.isPaid && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Price (₹ Indian Rupees) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500">₹</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-sm mt-2">{errors.price}</p>}
                </div>
              )}
            </div>
          </div>
        );

      case 'registration': // NEW SECTION
        return (
          <div className="space-y-6">
            {/* Registration Settings */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border-2 border-green-100">
              <h3 className="text-lg font-semibold mb-4">📋 Registration Settings</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Maximum Participants
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="0 for unlimited"
                  />
                  <p className="text-sm text-gray-500 mt-2">Set to 0 for unlimited registrations</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    min={getMinDate()}
                    max={formData.date}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <p className="text-sm text-gray-500 mt-2">Leave empty to accept registrations until event date</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="registrationOpen"
                      checked={formData.registrationOpen}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`block w-14 h-8 rounded-full transition-all duration-300 ${
                      formData.registrationOpen ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${
                      formData.registrationOpen ? 'transform translate-x-6' : ''
                    }`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Accept registrations</span>
                </label>
              </div>
            </div>

            {/* Custom Registration Fields */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-100">
              <h3 className="text-lg font-semibold mb-4">📝 Custom Registration Form</h3>
              <p className="text-sm text-gray-600 mb-6">Add custom fields to your registration form</p>

              {/* Add New Field Form */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 mb-6">
                <h4 className="text-md font-semibold mb-4">Add New Field</h4>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Name *
                    </label>
                    <input
                      type="text"
                      name="fieldName"
                      value={currentField.fieldName}
                      onChange={handleFieldChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="e.g., Phone Number, Department, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Type *
                    </label>
                    <select
                      name="fieldType"
                      value={currentField.fieldType}
                      onChange={handleFieldChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    >
                      {fieldTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Options for Select Fields */}
                {currentField.fieldType === 'select' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter an option"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      />
                      <button
                        type="button"
                        onClick={addOption}
                        className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentField.options.map((option, index) => (
                        <div key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-xl text-sm flex items-center">
                          {option}
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="required"
                      checked={currentField.required}
                      onChange={handleFieldChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Required field
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={addRegistrationField}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Existing Fields List */}
              {formData.registrationFields.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">Current Fields</h4>
                  {formData.registrationFields.map((field, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 border-2 border-gray-200 flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900">{field.fieldName}</span>
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                            {fieldTypes.find(ft => ft.value === field.fieldType)?.label}
                          </span>
                          {field.required && (
                            <span className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-lg">
                              Required
                            </span>
                          )}
                          {field.fieldType === 'select' && field.options.length > 0 && (
                            <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-lg">
                              {field.options.length} options
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => moveField(index, -1)}
                          disabled={index === 0}
                          className="text-gray-500 hover:text-gray-700 disabled:opacity-50 text-lg"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 1)}
                          disabled={index === formData.registrationFields.length - 1}
                          className="text-gray-500 hover:text-gray-700 disabled:opacity-50 text-lg"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRegistrationField(index)}
                          className="text-red-500 hover:text-red-700 text-lg font-bold"
                          title="Remove field"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-lg font-medium">No registration fields added yet</p>
                  <p className="text-sm">Add fields above to customize the registration form</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border-2 border-green-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">👥 Team Members & Coordinators</h3>
                  <p className="text-sm text-gray-600 mt-1">Add teammates who can help manage this event</p>
                </div>
                <button
                  type="button"
                  onClick={addTeamMember}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center"
                >
                  <span className="mr-2">+</span> Add Team Member
                </button>
              </div>
              
              {formData.teamMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-lg font-medium">No team members added yet</p>
                  <p className="text-sm">Add your first team member to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.teamMembers.map((member, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-lg flex items-center">
                          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </span>
                          Team Member
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeTeamMember(index)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Enter full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                          <input
                            type="email"
                            value={member.email}
                            onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="email@college.edu"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Coordinator, Manager, Volunteer"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <input
                            type="tel"
                            value={member.phone}
                            onChange={(e) => handleTeamMemberChange(index, 'phone', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="+91 9876543210"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                          <input
                            type="text"
                            value={member.department}
                            onChange={(e) => handleTeamMemberChange(index, 'department', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            placeholder="Computer Science, Electronics, Mechanical, etc."
                          />
                        </div>
                      </div>
                      {errors[`teamMember_${index}`] && (
                        <p className="text-red-500 text-sm mt-3 font-medium">{errors[`teamMember_${index}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-100">
              <h3 className="text-lg font-semibold mb-4">🌐 Social Media & Links</h3>
              <p className="text-sm text-gray-600 mb-6">Add your event's social media presence to reach more attendees</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Instagram */}
                <div className="bg-white p-4 rounded-xl border-2 border-pink-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-pink-500 text-lg mr-2">📷</span>
                    Instagram
                  </label>
                  <input
                    type="text"
                    name="socialMedia.instagram"
                    value={formData.socialMedia.instagram}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200"
                    placeholder="@username"
                  />
                </div>

                {/* Twitter */}
                <div className="bg-white p-4 rounded-xl border-2 border-blue-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-blue-400 text-lg mr-2">🐦</span>
                    Twitter/X
                  </label>
                  <input
                    type="text"
                    name="socialMedia.twitter"
                    value={formData.socialMedia.twitter}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                    placeholder="@username"
                  />
                </div>

                {/* Facebook */}
                <div className="bg-white p-4 rounded-xl border-2 border-blue-300">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-blue-600 text-lg mr-2">📘</span>
                    Facebook
                  </label>
                  <input
                    type="text"
                    name="socialMedia.facebook"
                    value={formData.socialMedia.facebook}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all duration-200"
                    placeholder="Page name or URL"
                  />
                </div>

                {/* LinkedIn */}
                <div className="bg-white p-4 rounded-xl border-2 border-blue-400">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-blue-700 text-lg mr-2">💼</span>
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="socialMedia.linkedin"
                    value={formData.socialMedia.linkedin}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition-all duration-200"
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>

                {/* YouTube */}
                <div className="bg-white p-4 rounded-xl border-2 border-red-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-red-600 text-lg mr-2">📺</span>
                    YouTube
                  </label>
                  <input
                    type="url"
                    name="socialMedia.youtube"
                    value={formData.socialMedia.youtube}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all duration-200"
                    placeholder="https://youtube.com/channel/..."
                  />
                </div>

                {/* Website */}
                <div className="bg-white p-4 rounded-xl border-2 border-green-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <span className="text-green-600 text-lg mr-2">🌐</span>
                    Website
                  </label>
                  <input
                    type="url"
                    name="socialMedia.website"
                    value={formData.socialMedia.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all duration-200"
                    placeholder="https://yourevent.com"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'publish':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-2xl border-2 border-orange-200 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Launch Your Event!</h3>
              <p className="text-gray-600 mb-6">Review your event details and choose how you want to publish it</p>
              
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 mb-6">
                <h4 className="font-semibold text-lg mb-4">Event Status</h4>
                <div className="flex flex-wrap gap-4 justify-center">
                  <label className="flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 bg-blue-50 border-blue-200">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <span className="text-2xl mb-2">📝</span>
                    <span className="font-medium">Save as Draft</span>
                    <span className="text-sm text-gray-600 mt-1">Work on it later</span>
                  </label>
                  
                  <label className="flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 bg-green-50 border-green-200">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={formData.status === 'published'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <span className="text-2xl mb-2">🎉</span>
                    <span className="font-medium">Publish Now</span>
                    <span className="text-sm text-gray-600 mt-1">Make it live</span>
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">📋 Quick Preview</h4>
                <div className="text-left space-y-2 text-sm">
                  <p><strong>Title:</strong> {formData.title || 'Not set'}</p>
                  <p><strong>Type:</strong> {formData.type === 'custom' ? formData.customType : formData.type}</p>
                  <p><strong>Date:</strong> {formData.date || 'Not set'}</p>
                  <p><strong>Venue:</strong> {formData.venue || 'Not set'}</p>
                  <p><strong>Registration:</strong> {formData.registrationOpen ? 'Open' : 'Closed'}</p>
                  <p><strong>Custom Fields:</strong> {formData.registrationFields.length} fields</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Create Amazing Event
            </h1>
            <p className="text-gray-600 text-lg">Fill in the details below to create an unforgettable campus experience</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4 bg-gray-100 rounded-2xl p-2">
              {sections.map((section, index) => (
                <React.Fragment key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 ${
                      activeSection === section.id
                        ? 'bg-white shadow-lg text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.label}
                  </button>
                  {index < sections.length - 1 && (
                    <div className="w-4 h-0.5 bg-gray-300"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-6 py-4 rounded-xl mb-6">
              <strong>⚠️ Error:</strong> {error}
              {errors.general && <div className="mt-2">{errors.general}</div>}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderSection()}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === activeSection);
                  if (currentIndex > 0) {
                    setActiveSection(sections[currentIndex - 1].id);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
              >
                {activeSection === 'basic' ? '← Dashboard' : '← Previous'}
              </button>

              {activeSection === 'publish' ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Event...
                    </span>
                  ) : (
                    `🎉 ${formData.status === 'published' ? 'Publish Event' : 'Save as Draft'}`
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = sections.findIndex(s => s.id === activeSection);
                    if (currentIndex < sections.length - 1) {
                      setActiveSection(sections[currentIndex + 1].id);
                    }
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  Next →
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;