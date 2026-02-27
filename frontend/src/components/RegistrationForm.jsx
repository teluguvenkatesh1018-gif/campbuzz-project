import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { registrationAPI } from '../services/api';
import { toast } from 'react-toastify';

const RegistrationForm = ({ event, onClose, onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [registrationFields, setRegistrationFields] = useState([]);
  const [registrationInfo, setRegistrationInfo] = useState(null);
  
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchRegistrationFields();
  }, [event._id]);

  const fetchRegistrationFields = async () => {
    try {
      const response = await registrationAPI.getRegistrationFields(event._id);
      setRegistrationFields(response.data.registrationFields);
      setRegistrationInfo({
        registrationOpen: response.data.registrationOpen,
        maxParticipants: response.data.maxParticipants,
        registeredCount: response.data.registeredCount
      });
    } catch (error) {
      console.error('Error fetching registration fields:', error);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      for (const field of registrationFields) {
        if (field.required && !formData[field.fieldName]) {
          toast.error(`Please fill in ${field.fieldName}`);
          setLoading(false);
          return;
        }
      }

      await registrationAPI.registerForEvent(event._id, formData);
      toast.success('Successfully registered for the event!');
      
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register for event');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const commonProps = {
      value: formData[field.fieldName] || '',
      onChange: (e) => handleInputChange(field.fieldName, e.target.value),
      required: field.required,
      className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
      disabled: loading
    };

    switch (field.fieldType) {
      case 'textarea':
        return <textarea {...commonProps} rows="4" placeholder={`Enter ${field.fieldName}`} />;
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.fieldName}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={!!formData[field.fieldName]}
            onChange={(e) => handleInputChange(field.fieldName, e.target.checked)}
            disabled={loading}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        );
      
      case 'email':
        return <input type="email" {...commonProps} placeholder={`Enter ${field.fieldName}`} />;
      
      case 'number':
        return <input type="number" {...commonProps} placeholder={`Enter ${field.fieldName}`} />;
      
      default:
        return <input type="text" {...commonProps} placeholder={`Enter ${field.fieldName}`} />;
    }
  };

  if (!registrationInfo) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!registrationInfo.registrationOpen) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Registration Closed</h3>
        <p className="text-yellow-700">
          Registration for this event is currently closed.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Register for {event.title}</h2>
          <p className="text-gray-600 mt-1">Fill in the details below to register</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Registration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Available Spots:</span>{' '}
            {registrationInfo.maxParticipants === 0 
              ? 'Unlimited' 
              : `${registrationInfo.availableSpots} remaining`
            }
          </div>
          <div>
            <span className="font-semibold">Total Registered:</span>{' '}
            {registrationInfo.registeredCount}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto-filled user info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={user.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>
        </div>

        {/* Dynamic registration fields */}
        {registrationFields.map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.fieldName}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
            {field.fieldType === 'checkbox' && (
              <span className="ml-2 text-sm text-gray-600">{field.fieldName}</span>
            )}
          </div>
        ))}

        {/* Submit Button */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? 'Registering...' : 'Register Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;