import React from 'react';

interface RatingStarsProps {
  rating: number; // Rating out of 5
  maxRating?: number; // Maximum rating (default 5)
  size?: string; // Size of stars (small, medium, large)
  showValue?: boolean; // Whether to show the rating value
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 'medium',
  showValue = true
}) => {
  // Calculate size class
  const sizeClass = size === 'small' ? 'fs-6' : size === 'large' ? 'fs-4' : 'fs-5';
  
  // Ensure rating is between 0 and maxRating
  const safeRating = Math.max(0, Math.min(rating, maxRating));
  
  // Calculate full stars
  const fullStars = Math.floor(safeRating);
  
  // Calculate if there should be a half star
  const hasHalfStar = safeRating % 1 >= 0.5;
  
  // Calculate empty stars
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="rating-stars d-flex align-items-center">
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <i key={`full-${i}`} className={`bi bi-star-fill text-warning ${sizeClass}`}></i>
      ))}
      
      {/* Half star */}
      {hasHalfStar && (
        <i className={`bi bi-star-half text-warning ${sizeClass}`}></i>
      )}
      
      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <i key={`empty-${i}`} className={`bi bi-star text-warning ${sizeClass}`}></i>
      ))}
      
      {/* Show numerical value if requested */}
      {showValue && (
        <span className="ms-2 text-white" style={{ fontWeight: 600 }}>
          {safeRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default RatingStars; 