import React from 'react';

const QuickStats = ({ stats }) => {
  const statCards = [
    {
      label: 'Total Events',
      value: stats.total,
      icon: '📊',
      color: 'blue'
    },
    {
      label: 'Published',
      value: stats.published,
      icon: '✅',
      color: 'green'
    },
    {
      label: 'Drafts',
      value: stats.draft,
      icon: '📝',
      color: 'yellow'
    },
    {
      label: 'Upcoming',
      value: stats.upcoming,
      icon: '📅',
      color: 'purple'
    },
    {
      label: 'Past Events',
      value: stats.past,
      icon: '⏰',
      color: 'gray'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
      gray: 'bg-gray-100 text-gray-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;