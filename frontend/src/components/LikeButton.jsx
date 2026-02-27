import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { likesAPI } from '../services/api';

const LikeButton = ({ eventId, initialLikes = 0, size = 'normal' }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    checkLikeStatus();
  }, [eventId]);

  const checkLikeStatus = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await likesAPI.getLikeStatus(eventId);
      setIsLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please login to like events');
      return;
    }

    setLoading(true);
    try {
      const response = await likesAPI.likeEvent(eventId);
      setIsLiked(response.data.liked);
      setLikesCount(response.data.likesCount);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizes = {
    small: 'w-6 h-6',
    normal: 'w-8 h-8',
    large: 'w-10 h-10'
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`p-1 rounded-full transition-all duration-200 ${
          isLiked 
            ? 'bg-red-100 text-red-500 hover:bg-red-200' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        } ${sizes[size]} flex items-center justify-center`}
        title={isLiked ? 'Unlike' : 'Like'}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : (
          <svg 
            className="w-full h-full" 
            fill={isLiked ? "currentColor" : "none"} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
      </button>
      <span className={`font-medium ${
        sizes[size] === 'w-6 h-6' ? 'text-sm' : 
        sizes[size] === 'w-8 h-8' ? 'text-base' : 'text-lg'
      }`}>
        {likesCount}
      </span>
    </div>
  );
};

export default LikeButton;