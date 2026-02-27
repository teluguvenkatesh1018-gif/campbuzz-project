import React, { useState } from 'react';

const ShareButton = ({ event, size = 'normal' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = `${window.location.origin}/event/${event._id}`;
  const shareText = `Check out "${event.title}" on CampBuzz! ${event.description.substring(0, 100)}...`;

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: '🔗',
      action: () => {
        navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        setIsOpen(false);
      }
    },
    {
      name: 'Share on WhatsApp',
      icon: '💬',
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: 'Share on Twitter',
      icon: '🐦',
      action: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        setIsOpen(false);
      }
    },
    {
      name: 'Share on Facebook',
      icon: '📘',
      action: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        setIsOpen(false);
      }
    }
  ];

  const sizes = {
    small: 'w-6 h-6',
    normal: 'w-8 h-8',
    large: 'w-10 h-10'
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors ${sizes[size]} flex items-center justify-center`}
        title="Share event"
      >
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 border">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={option.action}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 first:rounded-t-lg last:rounded-b-lg"
            >
              <span>{option.icon}</span>
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShareButton;