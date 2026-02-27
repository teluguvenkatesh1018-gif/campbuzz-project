import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { eventsAPI } from '../services/api';
import { toast } from 'react-toastify';

const EditEvent = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    type: 'workshop',
    maxParticipants: 0,
    isPaid: false,
    price: 0,
    tags: '',
    registrationOpen: true,
    registrationDeadline: '',
    registrationFields: [],
    status: 'draft',
    collegeName: '',
    contactEmail: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [currentField, setCurrentField] = useState({
    fieldName: '',
    fieldType: 'text',
    required: false,
    options: []
  });
  const [newOption, setNewOption] = useState('');

  const eventTypes = [
    { value: 'workshop', label: 'Workshop', icon: '🔧' },
    { value: 'hackathon', label: 'Hackathon', icon: '💻' },
    { value: 'seminar', label: 'Seminar', icon: '🎓' },
    { value: 'club-activity', label: 'Club Activity', icon: '👥' },
    { value: 'sports', label: 'Sports', icon: '⚽' },
    { value: 'cultural', label: 'Cultural', icon: '🎭' },
    { value: 'conference', label: 'Conference', icon: '🏛️' },
    { value: 'webinar', label: 'Webinar', icon: '📹' },
    { value: 'competition', label: 'Competition', icon: '🏆' }
  ];

  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'phone', label: 'Phone', icon: '📱' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
    { value: 'select', label: 'Dropdown Select', icon: '📋' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' }
  ];

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getEvent(id);
      const event = response.data;
      
      if (event.organizer._id !== user.id && user.role !== 'admin') {
        toast.error('You are not authorized to edit this event');
        navigate('/dashboard');
        return;
      }

      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date ? event.date.split('T')[0] : '',
        time: event.time || '',
        venue: event.venue || '',
        type: event.type || 'workshop',
        maxParticipants: event.maxParticipants || 0,
        isPaid: event.isPaid || false,
        price: event.price || 0,
        tags: event.tags ? event.tags.join(', ') : '',
        registrationOpen: event.registrationOpen !== undefined ? event.registrationOpen : true,
        registrationDeadline: event.registrationDeadline ? event.registrationDeadline.split('T')[0] : '',
        registrationFields: event.registrationFields || [],
        status: event.status || 'draft',
        collegeName: event.collegeName || '',
        contactEmail: event.contactEmail || user.email
      });
      
    } catch (error) {
      console.error('Fetch event error:', error);
      toast.error('Failed to load event');
      navigate('/dashboard');
    } finally {
      setFetching(false);
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

    // Date validation
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = 'Event date cannot be in the past';
      }
    }

    // Registration deadline validation
    if (formData.registrationDeadline && formData.date) {
      const deadline = new Date(formData.registrationDeadline);
      const eventDate = new Date(formData.date);
      if (deadline > eventDate) {
        newErrors.registrationDeadline = 'Registration deadline cannot be after event date';
      }
    }

    // Price validation for paid events
    if (formData.isPaid) {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = 'Please enter a valid price';
      } else if (price === 0) {
        newErrors.price = 'Price must be greater than 0 for paid events';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Clear options when field type changes from select
      ...(name === 'fieldType' && value !== 'select' && { options: [] })
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
      toast.error('Please enter a field name');
      return;
    }

    if (formData.registrationFields.some(field => field.fieldName === currentField.fieldName)) {
      toast.error('Field name already exists');
      return;
    }

    setFormData(prev => ({
      ...prev,
      registrationFields: [...prev.registrationFields, { ...currentField }]
    }));

    setCurrentField({
      fieldName: '',
      fieldType: 'text',
      required: false,
      options: []
    });
    setNewOption('');
    toast.success('Field added successfully!');
  };

  const removeRegistrationField = (index) => {
    setFormData(prev => ({
      ...prev,
      registrationFields: prev.registrationFields.filter((_, i) => i !== index)
    }));
    toast.info('Field removed');
  };

  const moveField = (index, direction) => {
    const fields = [...formData.registrationFields];
    const newIndex = index + direction;
    
    if (newIndex >= 0 && newIndex < fields.length) {
      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
      setFormData(prev => ({ ...prev, registrationFields: fields }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      const eventData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        registrationDeadline: formData.registrationDeadline || undefined,
        price: formData.isPaid ? parseFloat(formData.price) : 0,
        maxParticipants: parseInt(formData.maxParticipants) || 0
      };

      await eventsAPI.updateEvent(id, eventData);
      toast.success('🎉 Event updated successfully!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Update event error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update event';
      
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        setErrors(serverErrors.reduce((acc, err) => {
          if (err.includes('title')) acc.title = err;
          else if (err.includes('description')) acc.description = err;
          else if (err.includes('date')) acc.date = err;
          else if (err.includes('venue')) acc.venue = err;
          else if (err.includes('price')) acc.price = err;
          return acc;
        }, {}));
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Edit Event</h1>
            <p className="text-gray-600 text-lg">Update your event details and registration options</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mt-4 rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-blue-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">📋</span>
                Basic Event Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
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
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      errors.collegeName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Your college name"
                  />
                  {errors.collegeName && <p className="text-red-500 text-sm mt-2">{errors.collegeName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Event Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Contact email for queries"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📅 Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
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
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      errors.time ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.time && <p className="text-red-500 text-sm mt-2">{errors.time}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📍 Venue *
                  </label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      errors.venue ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Auditorium, Lab, Ground, etc."
                  />
                  {errors.venue && <p className="text-red-500 text-sm mt-2">{errors.venue}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📝 Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describe your event in detail..."
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-2">{errors.description}</p>}
                  <p className="text-sm text-gray-500 mt-2">{formData.description.length}/2000 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🏷️ Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="technology, coding, workshop, innovation"
                  />
                  <p className="text-sm text-gray-500 mt-2">Separate tags with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Registration & Payment Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-2xl border-2 border-green-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">🎯</span>
                Registration & Payment
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Maximum Participants
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    min={getMinDate()}
                    max={formData.date}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                      errors.registrationDeadline ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.registrationDeadline && <p className="text-red-500 text-sm mt-2">{errors.registrationDeadline}</p>}
                  <p className="text-sm text-gray-500 mt-2">Leave empty to accept until event date</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="registrationOpen"
                        checked={formData.registrationOpen}
                        onChange={handleInputChange}
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

                <div className="flex items-center space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="isPaid"
                        checked={formData.isPaid}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`block w-14 h-8 rounded-full transition-all duration-300 ${
                        formData.isPaid ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${
                        formData.isPaid ? 'transform translate-x-6' : ''
                      }`}></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">Paid event</span>
                  </label>
                </div>
              </div>

              {formData.isPaid && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Price (₹ Indian Rupees) *
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-4 top-3 text-gray-500 text-lg">₹</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="1"
                      step="1"
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        errors.price ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-sm mt-2">{errors.price}</p>}
                </div>
              )}
            </div>

            {/* Registration Fields Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-3">📝</span>
                Custom Registration Form
              </h2>
              <p className="text-gray-600 mb-6">Add custom fields to collect specific information from registrants</p>

              {/* Add New Field */}
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Field</h3>
                
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
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700">
                      Required field
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={addRegistrationField}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Existing Fields */}
              {formData.registrationFields.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Registration Fields</h3>
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

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Updating Event...
                  </>
                ) : (
                  'Update Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;