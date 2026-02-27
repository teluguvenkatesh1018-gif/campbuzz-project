import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { toast } from 'react-toastify';
import QRScanner from './QRScanner';

const AttendanceManager = ({ event }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualUserId, setManualUserId] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [event._id]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getAttendance(event._id);
      setAttendance(response.data.attendance);
    } catch (error) {
      toast.error('Failed to fetch attendance');
      console.error('Attendance fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.generateQR(event._id);
      
      // Create download link for QR code
      const link = document.createElement('a');
      link.href = response.data.qrCode;
      link.download = `attendance-qr-${event.title}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR code generated and downloaded!');
    } catch (error) {
      toast.error('Failed to generate QR code');
      console.error('QR generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markManualAttendance = async () => {
    if (!manualUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      setLoading(true);
      await attendanceAPI.markManualAttendance(event._id, { userId: manualUserId });
      toast.success('Attendance marked successfully!');
      setManualUserId('');
      setShowManualEntry(false);
      fetchAttendance(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
      console.error('Manual attendance error:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAttendance = async () => {
    try {
      const response = await attendanceAPI.exportAttendance(event._id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${event.title}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Attendance exported successfully!');
    } catch (error) {
      toast.error('Failed to export attendance');
      console.error('Export error:', error);
    }
  };

  const handleScanComplete = (scanData) => {
    fetchAttendance(); // Refresh attendance list
    setShowQRScanner(false);
  };

  if (loading && attendance.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold">Attendance Management</h3>
          <p className="text-gray-600">Event: {event.title}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-600">{attendance.length}</p>
          <p className="text-sm text-gray-500">Attendees</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={generateQRCode}
          disabled={loading}
          className="bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center space-x-2"
        >
          <span>📄</span>
          <span>Generate QR Code</span>
        </button>

        <button
          onClick={() => setShowQRScanner(true)}
          className="bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 flex items-center justify-center space-x-2"
        >
          <span>📱</span>
          <span>Scan QR Code</span>
        </button>

        <button
          onClick={() => setShowManualEntry(true)}
          className="bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 flex items-center justify-center space-x-2"
        >
          <span>👤</span>
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">Manual Attendance Entry</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                  placeholder="Enter user ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={markManualAttendance}
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Mark Attendance
                </button>
                <button
                  onClick={() => setShowManualEntry(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <QRScanner 
            event={event}
            onScanComplete={handleScanComplete}
            onClose={() => setShowQRScanner(false)}
          />
        </div>
      )}

      {/* Attendance List */}
      <div className="border rounded-lg">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h4 className="font-semibold">Attendance List</h4>
          <div className="flex space-x-2">
            <button
              onClick={fetchAttendance}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Refresh
            </button>
            <button
              onClick={exportAttendance}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Export CSV
            </button>
          </div>
        </div>

        {attendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No attendance records yet</p>
            <p className="text-sm">Generate a QR code or scan to start marking attendance</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">College Roll</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Scanned At</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendance.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {record.user.avatar ? (
                          <img 
                            src={record.user.avatar} 
                            alt={record.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {record.user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{record.user.name}</p>
                          <p className="text-sm text-gray-500">{record.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.user.collegeRoll}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(record.scannedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.method === 'qr_code' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {record.method === 'qr_code' ? 'QR Code' : 'Manual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceManager;