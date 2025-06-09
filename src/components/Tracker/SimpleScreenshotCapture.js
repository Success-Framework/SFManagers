import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Box, Button, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import { toast } from 'react-toastify';

const SimpleScreenshotCapture = forwardRef(({ startupId, minimal = true }, ref) => {
  const auth = useAuth();
  const { user, isAuthenticated, loading } = auth;
  const [isWorking, setIsWorking] = useState(false);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [message, setMessage] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const timerRef = useRef(null);
  
  // Debug user authentication on component mount
  useEffect(() => {
    console.log('SimpleScreenshotCapture mounted with:', { 
      startupId, 
      user: user ? `User authenticated: ${user.name || user.email}` : 'No user data available',
      isAuthenticated,
      loading,
      authContextAvailable: !!auth
    });
    
    // Check token directly as a fallback
    const token = localStorage.getItem('token');
    console.log('Token available:', !!token);
  }, [startupId, user, isAuthenticated, loading, auth]);
  
  // Screenshot interval in milliseconds (10 seconds)
  const SCREENSHOT_INTERVAL = 10 * 1000;
  
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
    console.log('Converting dataURI to blob...');
    try {
      const byteString = atob(dataURI.split(',')[1]);
      const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      console.log('Blob created successfully, size:', blob.size);
      return blob;
    } catch (error) {
      console.error('Error converting dataURI to blob:', error);
      throw error;
    }
  };

  // Take a screenshot
  const captureScreenshot = async () => {
    console.log('captureScreenshot function called');
    console.log('Current state:', { isWorking, startupId, user });
    
    // Check for token directly as a fallback for authentication
    const token = localStorage.getItem('token');
    const userName = user?.name || user?.email || 'unknown';
    
    // Check if startupId is available
    if (!startupId) {
      console.error('Missing startupId for screenshot capture');
      toast.error('Cannot take screenshot - missing startup ID');
      return;
    }
    
    // Check if user is logged in (using token as fallback)
    if (!user && !token) {
      console.error('User not authenticated for screenshot capture');
      toast.error('Cannot take screenshot - user not authenticated');
      return;
    }
    
    // Check if work session is active
    if (!isWorking) {
      console.error('Work session not active for screenshot capture');
      toast.error('Cannot take screenshot - work session not active');
      return;
    }
    
    try {
      console.log('Starting screenshot capture process...');
      setIsCapturing(true);
      setMessage('Capturing screenshot...');
      
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices) {
        console.error('navigator.mediaDevices is not available in this browser');
        toast.error('Your browser does not support screen capture');
        throw new Error('Screen capture not supported in this browser');
      }
      
      // Check if getDisplayMedia is available
      if (!navigator.mediaDevices.getDisplayMedia) {
        console.error('getDisplayMedia is not available in this browser');
        toast.error('Your browser does not support modern screen capture API');
        throw new Error('Screen capture API not supported in this browser');
      }
      
      console.log('Browser supports screen capture, requesting permission...');
      
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' }
      });
      
      console.log('Screen capture permission granted, got stream:', stream);
      
      // Create video element
      console.log('Creating video element...');
      const video = document.createElement('video');
      video.srcObject = stream;
      
      console.log('Waiting for video metadata to load...');
      // Wait for video to load
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          video.play();
          resolve();
        };
        
        video.onerror = (err) => {
          console.error('Video element error:', err);
          reject(new Error('Failed to load video element'));
        };
        
        // Add timeout in case onloadedmetadata never fires
        setTimeout(() => {
          console.log('Video metadata load timeout - forcing resolution');
          resolve();
        }, 3000);
      });
      
      // Create canvas and capture frame
      console.log('Creating canvas for screenshot...');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280; // Fallback width
      canvas.height = video.videoHeight || 720; // Fallback height
      console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
      
      const ctx = canvas.getContext('2d');
      console.log('Drawing video frame to canvas...');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Stop all tracks
      console.log('Stopping media tracks...');
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      
      // Convert to data URL and blob
      console.log('Converting canvas to JPEG data URL...');
      const dataUrl = canvas.toDataURL('image/jpeg');
      console.log('Data URL created, length:', dataUrl.length);
      
      console.log('Converting data URL to blob...');
      const blob = dataURItoBlob(dataUrl);
      console.log('Blob created, size:', blob.size, 'bytes');
      
      // Create form data for upload
      console.log('Creating FormData for upload...');
      const formData = new FormData();
      formData.append('screenshot', blob, `screenshot_${Date.now()}.jpg`);
      formData.append('startupId', startupId);
      formData.append('userName', userName);
      
      // Log API endpoint
      console.log('API endpoint for upload:', API_ENDPOINTS.UPLOAD_SCREENSHOT);
      
      // Upload to server
      console.log('Uploading screenshot to server...');
      try {
        const response = await axios.post(API_ENDPOINTS.UPLOAD_SCREENSHOT, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Upload response:', response.data);
        
        setMessage('Screenshot captured');
        toast.success('Screenshot captured and uploaded', {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        console.error('Upload error response:', uploadError.response?.data);
        toast.error(`Upload failed: ${uploadError.message}`, {
          position: "top-center",
          autoClose: 3000,
        });
        throw uploadError;
      }
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      
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

  // Start work tracking session
  const startWorking = () => {
    if (isWorking) return;
    
    // Check for token directly as a fallback for authentication
    const token = localStorage.getItem('token');
    
    // Check if user is authenticated before starting work session
    if (!user && !token) {
      console.error('Cannot start work session - user not authenticated');
      toast.error('Cannot start work session - please log in first');
      return;
    }
    
    // Check if startupId is available
    if (!startupId) {
      console.error('Cannot start work session - missing startup ID');
      toast.error('Cannot start work session - missing startup ID');
      return;
    }
    
    console.log('Starting work session...', { user: user?.name || user?.email, startupId });
    const now = Date.now();
    setIsWorking(true);
    setWorkStartTime(now);
    setElapsedTime(0);
    
    // Start timer for elapsed time
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - now) / 1000));
    }, 1000);
    
    setMessage('Work session started');
    toast.success('Work session started. Click "Take Screenshot" to capture your screen.', {
      position: "top-center",
      autoClose: 3000,
    });
  };

  // Stop work tracking session
  const stopWorking = () => {
    if (!isWorking) return;
    
    console.log('Stopping work session...');
    setIsWorking(false);
    
    // Clear intervals
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setMessage('Work session stopped');
    toast.info('Work session stopped', {
      position: "top-center",
      autoClose: 3000,
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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

export default SimpleScreenshotCapture;
