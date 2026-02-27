import React, { useState } from 'react';
import { calendarAPI } from '../services/api';
import { toast } from 'react-toastify';

const CalendarExport = ({ event }) => {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const exportToGoogleCalendar = async () => {
    setLoading(true);
    try {
      const response = await calendarAPI.getCalendarLinks(event._id);
      window.open(response.data.calendarLinks.google, '_blank');
      toast.success('Opening Google Calendar...');
    } catch (error) {
      toast.error('Failed to open Google Calendar');
      console.error('Google Calendar export error:', error);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  const exportToICal = async () => {
    setLoading(true);
    try {
      const response = await calendarAPI.exportToICal(event._id);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campbuzz-${event.title}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('iCal file downloaded!');
    } catch (error) {
      toast.error('Failed to download iCal file');
      console.error('iCal export error:', error);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  const addToPersonalCalendar = async () => {
    setLoading(true);
    try {
      await calendarAPI.addToCalendar(event._id);
      toast.success('Event added to your personal calendar!');
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info('Event already in your calendar');
      } else {
        toast.error('Failed to add to calendar');
      }
      console.error('Add to calendar error:', error);
    } finally {
      setLoading(false);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={loading}
        className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        <span>📅</span>
        <span>{loading ? 'Loading...' : 'Add to Calendar'}</span>
      </button>

      {showOptions && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3">
            <h4 className="font-semibold mb-2">Export to Calendar</h4>
            <div className="space-y-2">
              <button
                onClick={exportToGoogleCalendar}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
              >
                <span className="text-red-500">🔴</span>
                <span>Google Calendar</span>
              </button>
              
              <button
                onClick={exportToICal}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
              >
                <span className="text-blue-500">🔵</span>
                <span>Download iCal File</span>
              </button>
              
              <button
                onClick={addToPersonalCalendar}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center space-x-2"
              >
                <span className="text-green-500">🟢</span>
                <span>Add to Personal Calendar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarExport;