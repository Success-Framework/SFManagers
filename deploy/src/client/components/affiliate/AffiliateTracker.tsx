import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

/**
 * Component that silently tracks affiliate link clicks
 * It looks for the 'ref' parameter in the URL and sends a tracking request
 */
const AffiliateTracker: React.FC = () => {
  const location = useLocation();
  // Use a ref to track if this click has already been processed
  const trackingProcessed = useRef<boolean>(false);

  useEffect(() => {
    const trackAffiliateClick = async () => {
      try {
        // Parse the URL search params
        const searchParams = new URLSearchParams(location.search);
        const refParam = searchParams.get('ref');
        
        // If no referrer parameter is present or already tracked, do nothing
        if (!refParam || trackingProcessed.current) return;
        
        // Mark as processed to prevent duplicate tracking
        trackingProcessed.current = true;
        
        console.log('Found affiliate reference parameter:', refParam);
        
        // First try to track using the new code-based endpoint
        try {
          console.log('Tracking affiliate click with code:', refParam);
          
          await axios.post('/api/affiliate-clicks/track', {
            code: refParam,
            referrer: document.referrer || 'direct'
          });
          
          console.log('Affiliate click tracked successfully with code');
        } catch (error: any) {
          // If we get a 404 (link not found), it might be a user ID rather than a code
          // Try the legacy tracking endpoint
          if (error.response && error.response.status === 404) {
            console.log('Link not found with code, trying user ID format');
            
            // Extract the startup ID from the path
            // URL format: /startup/:startupId
            const pathParts = location.pathname.split('/');
            const startupIndex = pathParts.indexOf('startup');
            
            // If this is not a startup page, do nothing
            if (startupIndex === -1 || startupIndex >= pathParts.length - 1) {
              console.error('Not a startup page, cannot track affiliate click');
              return;
            }
            
            const startupId = pathParts[startupIndex + 1];
            
            await axios.post('/api/affiliate/track', {
              startupId,
              referrerId: refParam
            });
            
            console.log('Affiliate click tracked successfully with user ID');
          } else {
            // Rethrow other errors
            throw error;
          }
        }
        
        // Remove the ref parameter from URL without refreshing page
        // This prevents duplicate tracking on page refresh
        searchParams.delete('ref');
        const newUrl = `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        window.history.replaceState({}, '', newUrl);
        
      } catch (error) {
        console.error('Error tracking affiliate click:', error);
      }
    };
    
    trackAffiliateClick();
    
    // Cleanup function
    return () => {
      // Keep tracking state between effect runs in development
      // (React StrictMode runs effects twice in development)
    };
  }, [location]);

  // This component doesn't render anything
  return null;
};

export default AffiliateTracker; 