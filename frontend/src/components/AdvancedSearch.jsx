import React, { useState, useEffect } from 'react';
import { searchAPI } from '../services/api';
import { toast } from 'react-toastify';

const AdvancedSearch = ({ onSearchResults, onClose }) => {
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    dateRange: '',
    startDate: '',
    endDate: '',
    price: '',
    venue: '',
    tags: '',
    sortBy: 'date',
    sortOrder: 'asc'
  });
  
  const [filterOptions, setFilterOptions] = useState({
    eventTypes: [],
    popularTags: [],
    venueCities: []
  });
  
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const response = await searchAPI.getSearchFilters();
      setFilterOptions(response.data.filters);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await searchAPI.advancedSearch(filters);
      onSearchResults(response.data);
      toast.success(`Found ${response.data.pagination.total} events`);
    } catch (error) {
      toast.error('Search failed');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    
    // Show suggestions for search query
    if (field === 'q' && value.length >= 2) {
      try {
        const response = await searchAPI.getSearchSuggestions(value);
        setSuggestions(response.data.suggestions);
      } catch (error) {
        console.error('Suggestions error:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      type: '',
      dateRange: '',
      startDate: '',
      endDate: '',
      price: '',
      venue: '',
      tags: '',
      sortBy: 'date',
      sortOrder: 'asc'
    });
    setSuggestions([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Advanced Search</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-6">
        {/* Search Query */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Events
          </label>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => handleInputChange('q', e.target.value)}
            placeholder="Search by title, description, venue..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (suggestion.type === 'event') {
                      window.location.href = `/event/${suggestion.id}`;
                    } else {
                      handleInputChange('tags', suggestion.title);
                    }
                    setSuggestions([]);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-medium">{suggestion.title}</div>
                  <div className="text-sm text-gray-600">{suggestion.subtitle}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Event Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {filterOptions.eventTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleInputChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past Events</option>
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <select
              value={filters.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Prices</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Venue Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue
            </label>
            <input
              type="text"
              value={filters.venue}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              placeholder="Filter by venue..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={filters.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Enter tags..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleInputChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Event Date</option>
              <option value="created">Recently Added</option>
              <option value="title">Title</option>
              <option value="popularity">Popularity</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {(filters.dateRange === 'custom' || (!filters.dateRange && (filters.startDate || filters.endDate))) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            type="button"
            onClick={clearFilters}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Clear All
          </button>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Events'}
            </button>
          </div>
        </div>
      </form>

      {/* Popular Tags */}
      {filterOptions.popularTags.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.popularTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => handleInputChange('tags', tag)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;