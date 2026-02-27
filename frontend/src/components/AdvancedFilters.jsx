import React from 'react';

const AdvancedFilters = ({ filters, onFilterChange, onClear }) => {
  const eventTypes = ['hackathon', 'workshop', 'seminar', 'club-activity', 'sports', 'cultural'];
  const popularTags = ['coding', 'webdev', 'ai', 'machinelearning', 'beginners', 'advanced', 'networking'];

  const handleTagToggle = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFilterChange({ ...filters, tags: newTags });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Advanced Filters</h3>
        <button 
          onClick={onClear}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Clear All
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({...filters, search: e.target.value})}
            placeholder="Search events..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({...filters, type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({...filters, dateRange: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="week">Next 7 Days</option>
            <option value="month">Next 30 Days</option>
            <option value="past">Past Events</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({...filters, sortBy: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Date (Soonest)</option>
            <option value="title">Title (A-Z)</option>
            <option value="type">Event Type</option>
          </select>
        </div>
      </div>

      {/* Tags Filter */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Popular Tags</label>
        <div className="flex flex-wrap gap-2">
          {popularTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filters.tags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
        {filters.tags.length > 0 && (
          <div className="mt-2">
            <span className="text-sm text-gray-600">Selected: </span>
            {filters.tags.map(tag => (
              <span key={tag} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFilters;