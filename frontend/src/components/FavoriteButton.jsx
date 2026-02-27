import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { favoritesAPI } from '../services/api';

const FavoriteButton = ({ eventId, size = 'normal' }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    checkIfFavorite();
  }, [eventId]);

  const checkIfFavorite = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await favoritesAPI.getFavorites();
      const isFav = response.data.favorites.some(fav => fav._id === eventId);
      setIsFavorite(isFav);
    } catch (error) {
      console.error('Error checking favorites:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      alert('Please login to add favorites');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await favoritesAPI.removeFavorite(eventId);
        setIsFavorite(false);
      } else {
        await favoritesAPI.addFavorite(eventId);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
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
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-1 rounded-full transition-all duration-200 ${
        isFavorite 
          ? 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200' 
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
      } ${sizes[size]} flex items-center justify-center`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <svg 
          className="w-full h-full" 
          fill={isFavorite ? "currentColor" : "none"} 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 
               8.63 2 9.24l5.46 4.73L5.82 21z" 
          />
        </svg>
      )}
    </button>
  );
};

export default FavoriteButton;
