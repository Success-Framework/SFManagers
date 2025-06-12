import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { uploadScreenshot } from '../api/screenshot';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const TrackingContext = createContext();

export const TrackingProvider = ({ children }) => {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [startupId, setStartupId] = useState(null);
  const startupIdRef = useRef(null); // Ref to avoid race conditions with startup ID
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState('');
  
  // Refs for timers and stream
  const timerRef = useRef(null);
  const screenshotTimerRef = useRef(null);
  const streamRef = useRef(null);
  const isTrackingRef = useRef(false);
  const lastTimestampRef = useRef(null);
  const elapsedTimeRef = useRef(0);
  
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
        if (isTrackingRef.current && !timerRef.current) {
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
      
      // Stop tracking if it's active
      if (isTrackingRef.current) {
        stopTracking();
      }
    };
  }, []);

  // Helper function to start the elapsed time counter
  const startElapsedTimeCounter = () => {
    // Use Date.now() for timing
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

  // Take a screenshot
  const captureScreenshot = async () => {
    if (!isTrackingRef.current) {
      return;
    }
    
    // Get the current startup ID from ref to avoid race conditions with React state
    const currentStartupId = startupIdRef.current;
    if (!currentStartupId) {
      console.error('No startup ID available for screenshot');
      return;
    }
    
    console.log('Using startup ID for screenshot capture:', currentStartupId);
    
    try {
      setMessage('Capturing screenshot...');
      
      // Use the existing stream from streamRef
      const stream = streamRef.current;
      
      if (!stream || !stream.active) {
        throw new Error('Screen capture stream not available');
      }
      
      // Get the video track
      const videoTrack = stream.getVideoTracks()[0];
      
      // Create a video element to capture the frame
      const video = document.createElement('video');
      video.srcObject = new MediaStream([videoTrack]);
      
      // Wait for the video to load metadata
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
        video.play();
      });
      
      // Create a canvas to draw the video frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current frame to the canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
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
      } else {
        // Fallback to localStorage if user object is null
        const storedUserName = localStorage.getItem('userName');
        const storedEmail = localStorage.getItem('userEmail');
        userName = storedUserName || storedEmail || 'unknown';
        console.log('Using fallback user info from localStorage:', userName);
      }
      
      console.log('Using userName for screenshot:', userName);
      console.log('Using startupId for screenshot:', currentStartupId);
      
      // Upload using the API helper function
      await uploadScreenshot(file, currentStartupId, userName);
      
      setMessage('Screenshot captured');
      toast.success('Screenshot captured', {
        position: "top-center",
        autoClose: 2000,
      });
      
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      setMessage(`Error: ${error.message}`);
      toast.error(`Screenshot error: ${error.message}`, {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  // Start tracking
  const startTracking = async (id) => {
    // Check if already tracking
    if (isTrackingRef.current) {
      // If already tracking but startup ID changed, update it
      if (startupId !== id || startupIdRef.current !== id) {
        console.log(`Updating startup ID from ${startupId} to ${id}`);
        setStartupId(id);
        startupIdRef.current = id;
      }
      return;
    }
    
    try {
      // Store the startup ID in both state and ref
      setStartupId(id);
      startupIdRef.current = id;
      
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
        stopTracking();
      });
      
      // Set tracking state
      setIsTracking(true);
      isTrackingRef.current = true;
      
      // Record start time
      const startTime = new Date();
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

  // Stop tracking
  const stopTracking = () => {
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
    setIsTracking(false);
    isTrackingRef.current = false;
    setElapsedTime(0);
    elapsedTimeRef.current = 0;
    lastTimestampRef.current = null;
    setMessage('');
    
    toast.info('Work tracking stopped', {
      position: "top-center",
      autoClose: 2000,
    });
  };

  // Take a manual screenshot
  const takeManualScreenshot = () => {
    if (isTrackingRef.current) {
      captureScreenshot();
    } else {
      toast.warning('Start working first to take screenshots', {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  return (
    <TrackingContext.Provider 
      value={{ 
        isTracking, 
        elapsedTime, 
        message, 
        formatTime,
        startTracking, 
        stopTracking, 
        takeManualScreenshot 
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};
