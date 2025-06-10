import React, { useEffect, useRef } from 'react';
import { useTracking } from '../../context/TrackingContext';
import { useLocation } from 'react-router-dom';
import { Button, Box, Typography } from '@mui/material';
import { FaPlay, FaStop, FaCamera } from 'react-icons/fa';

const ScreenshotTrackerButton = ({ startupId, minimal = true }) => {
  const { isTracking, elapsedTime, formatTime, startTracking, stopTracking, takeManualScreenshot } = useTracking();
  const location = useLocation();
  const previousStartupIdRef = useRef(null);

  // Extract startupId from URL if not provided as prop
  const getStartupIdFromUrl = () => {
    if (startupId) return startupId;
    
    // Extract from URL if in startup route
    const match = location.pathname.match(/\/startup\/([^/]+)/);
    return match ? match[1] : null;
  };

  const currentStartupId = getStartupIdFromUrl();

  // Update tracking with new startup ID when it changes
  useEffect(() => {
    // Only update if the startup ID actually changed
    if (currentStartupId && isTracking && previousStartupIdRef.current !== currentStartupId) {
      console.log('Startup ID changed while tracking, updating to:', currentStartupId);
      startTracking(currentStartupId);
      previousStartupIdRef.current = currentStartupId;
    }
  }, [currentStartupId, isTracking]);
  
  // Keep track of startup ID changes even when not tracking
  useEffect(() => {
    if (currentStartupId) {
      previousStartupIdRef.current = currentStartupId;
    }
  }, [currentStartupId]);

  const handleStartClick = async () => {
    if (!currentStartupId) {
      console.error('No startup ID available');
      return;
    }
    
    await startTracking(currentStartupId);
  };

  if (minimal) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {isTracking ? (
          <>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {formatTime(elapsedTime)}
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={stopTracking}
              startIcon={<FaStop />}
            >
              Stop
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={takeManualScreenshot}
              startIcon={<FaCamera />}
            >
              Capture
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={handleStartClick}
            startIcon={<FaPlay />}
          >
            Start Working
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Work Tracker
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1">
          Time: {formatTime(elapsedTime)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2 }}>
        {isTracking ? (
          <>
            <Button
              variant="contained"
              color="error"
              onClick={stopTracking}
              startIcon={<FaStop />}
            >
              Stop Working
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={takeManualScreenshot}
              startIcon={<FaCamera />}
            >
              Take Screenshot
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleStartClick}
            startIcon={<FaPlay />}
          >
            Start Working
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ScreenshotTrackerButton;
