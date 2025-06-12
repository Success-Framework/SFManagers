import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { uploadScreenshot } from '../../api/screenshot';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const ScreenshotTracker = forwardRef(({ startupId, minimal = true }, ref) => {
  const { user } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Refs for timers and stream
  const timerRef = useRef(null);
  const screenshotTimerRef = useRef(null);
  const streamRef = useRef(null);
  const isWorkingRef = useRef(false); // Ref to track working state for timer callbacks
  const lastTimestampRef = useRef(null); // Ref to store the last timestamp for accurate timing
  const elapsedTimeRef = useRef(0); // Ref to store the elapsed time that persists across tab switches
  
  // Screenshot interval in milliseconds (5 minutes)
  const SCREENSHOT_INTERVAL = 5 * 60 * 1000;
  
  // Handle visibility change events to keep tracking even when tab is not active
  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden, pausing visual updates but continuing tracking');
        // Tab is hidden, pause visual updates but keep tracking time
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        console.log('Tab visible again, resuming visual updates');
        // Tab is visible again, resume visual updates
        if (isWorkingRef.current && !timerRef.current) {
          // Restart the timer for UI updates
          startElapsedTimeCounter();
        }
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up on unmount
    return () => {
      // Remove visibility change listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Reset working ref
      isWorkingRef.current = false;
      
      // Clear all timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (screenshotTimerRef.current) {
        clearInterval(screenshotTimerRef.current);
        screenshotTimerRef.current = null;
      }
      
      // Stop and clean up the media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    startWorking,
    stopWorking,
    isWorking: () => isWorking
  }));

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to convert data URI to Blob
  const dataURItoBlob = (dataURI) => {
    try {
      const byteString = atob(dataURI.split(',')[1]);
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      return blob;
    } catch (error) {
      console.error('Error converting dataURI to blob:', error);
      throw error;
    }
  };
  
  // Start a work session and set up timers for automatic screenshots
  const startWorking = async () => {
    // Check if already working
    if (isWorkingRef.current) {
      return;
    }
    
    try {
      // Request screen capture permission
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          cursor: "always",
          displaySurface: "monitor"
        } 
      });
      
      // Store the stream for later use
      streamRef.current = stream;
      
      // Add event listener for when user stops sharing screen
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopWorking();
      });
      
      // Set working state
      setIsWorking(true);
      isWorkingRef.current = true;
      
      // Record start time
      const startTime = new Date();
      setWorkStartTime(startTime);
      lastTimestampRef.current = startTime.getTime();
      
      // Reset elapsed time
      setElapsedTime(0);
      elapsedTimeRef.current = 0;
      
      // Start the elapsed time counter
      startElapsedTimeCounter();
      
      // Set up a more robust screenshot timer that uses absolute timestamps
      // instead of intervals to be more resilient to tab switching
      if (screenshotTimerRef.current) {
        clearInterval(screenshotTimerRef.current);
      }
      
      // Take initial screenshot
      captureScreenshot();
      
      // Set up interval for screenshots with a check for missed intervals
      let lastScreenshotTime = Date.now();
      screenshotTimerRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastScreenshot = now - lastScreenshotTime;
        
        // If it's been at least 5 minutes since the last screenshot
        if (timeSinceLastScreenshot >= SCREENSHOT_INTERVAL) {
          captureScreenshot();
          lastScreenshotTime = now;
        }
      }, 5000); // Check every 5 seconds instead of waiting for exact 30 second intervals
      
      // Screenshot timer is now set up above with the more robust implementation
      
      toast.success('Work tracking started', {
        position: "top-center",
        autoClose: 2000,
      });
      
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Screen access denied. Work tracking requires screen access.', {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        toast.error(`Failed to start work tracking: ${err.message}`, {
          position: "top-center",
          autoClose: 3000,
        });
      }
      
      return false;
    }
  };
  
  // Helper function to start the elapsed time counter
  const startElapsedTimeCounter = () => {
    // Use performance.now() for more accurate timing
    const now = Date.now();
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      const currentTime = Date.now();
      const delta = currentTime - lastTimestampRef.current;
      lastTimestampRef.current = currentTime;
      
      // Update the elapsed time ref
      elapsedTimeRef.current += delta / 1000;
      
      // Update the state for UI
      setElapsedTime(Math.floor(elapsedTimeRef.current));
    }, 1000);
  };
  
  // Stop the work session and clean up resources
  const stopWorking = () => {
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (screenshotTimerRef.current) {
      clearInterval(screenshotTimerRef.current);
      screenshotTimerRef.current = null;
    }
    
    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset state
    setIsWorking(false);
    isWorkingRef.current = false;
    setWorkStartTime(null);
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    lastTimestampRef.current = null;
    setMessage('');
    
    toast.info('Work tracking stopped', {
      position: "top-center",
      autoClose: 2000,
    });
  };

  // Take a screenshot
  const captureScreenshot = async () => {
    if (!isWorkingRef.current) {
      return;
    }
    
    try {
      setIsCapturing(true);
      setMessage('Capturing screenshot...');
      
      // Use the existing stream from streamRef
      const stream = streamRef.current;
      
      if (!stream || !stream.active) {
        throw new Error('Screen capture stream not available');
      }
      
      // Create video element to capture the stream
      const video = document.createElement('video');
      video.srcObject = stream;
      
      // Create a promise to handle the video loading
      const videoPromise = new Promise((resolve, reject) => {
        // Wait for video metadata to load
        video.onloadedmetadata = () => {
          video.play()
            .then(() => {
              // Create canvas with video dimensions
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              
              // Draw video frame to canvas
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              // Get data URL from canvas
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
              
              // Stop video
              video.pause();
              video.srcObject = null;
              
              resolve(dataUrl);
            })
            .catch(err => reject(err));
        };
        
        // Handle video errors
        video.onerror = (err) => {
          reject(new Error(`Video error: ${err}`));
        };
        
        // Set a timeout in case the video never loads
        setTimeout(() => {
          reject(new Error('Video metadata load timeout'));
        }, 5000);
      });
      
      // Wait for the video to be ready
      const dataUrl = await videoPromise;
      
      // Convert data URL to blob
      const blob = dataURItoBlob(dataUrl);
      
      // Create a File object from the blob
      const file = new File([blob], `screenshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Get user info from auth context
      // Log user object to help debug
      console.log('User object from auth context:', user);
      
      // Try to extract user name from various possible properties
      let userName = 'unknown';
      if (user) {
        if (typeof user === 'object') {
          // Try common user property names
          userName = user.name || user.fullName || user.userName || user.email || user.id || 'unknown';
        } else if (typeof user === 'string') {
          userName = user;
        }
      }
      
      console.log('Using userName for screenshot:', userName);
      
      // Upload using the API helper function
      await uploadScreenshot(file, startupId, userName);
      
      setMessage('Screenshot captured');
      toast.success('Screenshot captured', {
        position: "top-center",
        autoClose: 2000,
      });
      
    } catch (err) {
      console.error('Screenshot capture error:', err);
      
      if (err.name === 'NotAllowedError') {
        toast.error('Screen capture permission denied', {
          position: "top-center",
          autoClose: 3000,
        });
      } else {
        toast.error(`Screenshot failed: ${err.message}`, {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Render minimal version for dashboard header
  if (minimal) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isWorking && (
          <Box sx={{ color: '#fff', fontWeight: 'bold', mr: 1 }}>
            {formatTime(elapsedTime)}
          </Box>
        )}
        
        {!isWorking ? (
          <Tooltip title="Start Working">
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={startWorking}
              size="small"
            >
              Start Working
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="Stop Working">
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={stopWorking}
              size="small"
            >
              Stop Working
            </Button>
          </Tooltip>
        )}
        
        {isWorking && (
          <Tooltip title="Take Screenshot">
            <Button
              variant="contained"
              color="primary"
              startIcon={<CameraAltIcon />}
              onClick={captureScreenshot}
              size="small"
              disabled={isCapturing}
            >
              Take Screenshot
            </Button>
          </Tooltip>
        )}
        
        {message && (
          <Box sx={{ color: '#4ade80', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {message}
          </Box>
        )}
      </Box>
    );
  }
  
  // Render full floating panel version
  return (
    <Box
      sx={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 9999,
        padding: '15px',
        backgroundColor: 'rgba(22, 20, 47, 0.9)',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minWidth: '200px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {isWorking && (
        <Box sx={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
          {formatTime(elapsedTime)}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        {!isWorking ? (
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={startWorking}
            sx={{ flex: 1 }}
          >
            Start Working
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={stopWorking}
            sx={{ flex: 1 }}
          >
            Stop Working
          </Button>
        )}
      </Box>
      
      {isWorking && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<CameraAltIcon />}
          onClick={captureScreenshot}
          disabled={isCapturing}
        >
          Take Screenshot
        </Button>
      )}
      
      {message && <Box sx={{ color: '#4ade80', mt: 1, fontSize: '12px' }}>{message}</Box>}
    </Box>
  );
});

export default ScreenshotTracker;
