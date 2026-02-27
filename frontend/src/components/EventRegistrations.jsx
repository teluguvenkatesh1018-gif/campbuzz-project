import React, { useState, useEffect } from 'react';
import { registrationAPI } from '../services/api';
import { toast } from 'react-toastify';

const EventRegistrations = ({ event }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchRegistrations();
  }, [event._id, filters]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await registrationAPI.getEventRegistrations(event._id, filters);
      setRegistrations(response.data.registrations);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch registrations');
      console.error('Fetch registrations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (userId, newStatus) => {
    try {
      await registrationAPI.updateRegistrationStatus(event._id, userId, newStatus);
      toast.success(`Registration status updated to ${newStatus}`);
      fetchRegistrations(); // Refresh the list
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Update status error:', error);
    }
  };

  const exportRegistrations = async () => {
    try {
      const response = await registrationAPI.exportRegistrations(event._id);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `registrations-${event.title}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Registrations exported successfully!');
    } catch (error) {
      toast.error('Failed to export registrations');
      console.error('Export error:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      registered: 'bg-blue-100 text-blue-800',
      attended: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && registrations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Event Registrations</h3>
          <p className="text-gray-600">Manage registrations for {event.title}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportRegistrations}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={fetchRegistrations}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="registered">Registered</option>
          <option value="attended">Attended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Registrations List */}
      <div className="border rounded-lg">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h4 className="font-semibold">
            Registrations ({pagination.total || 0})
          </h4>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>No registrations yet</p>
            <p className="text-sm">Registrations will appear here when students register</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">College Roll</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Registered At</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrations.map((registration, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {registration.user.avatar ? (
                          <img 
                            src={registration.user.avatar} 
                            alt={registration.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {registration.user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{registration.user.name}</p>
                          <p className="text-sm text-gray-500">{registration.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {registration.user.collegeRoll}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(registration.registeredAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(registration.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {registration.status !== 'attended' && (
                          <button
                            onClick={() => updateStatus(registration.user._id, 'attended')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                            title="Mark as attended"
                          >
                            Mark Attended
                          </button>
                        )}
                        {registration.status !== 'cancelled' && (
                          <button
                            onClick={() => updateStatus(registration.user._id, 'cancelled')}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            title="Cancel registration"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {((filters.page - 1) * filters.limit) + 1} to {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} entries
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={filters.page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={filters.page === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRegistrations;