import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Box, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const SimpleScreenshotCapture = forwardRef(({ startupId, autoCapture = false }, ref) => {
  const { user } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [workStartTime, setWorkStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const SCREENSHOT_INTERVAL = 30 * 1000; // 30 seconds in milliseconds
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    captureScreenshot,
    startWorking,
    stopWorking,
    isWorking: () => isWorking
  }));

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start work tracking session
  const startWorking = () => {
    if (isWorking) return;
    
    console.log('Starting work session...');
    setIsWorking(true);
    setWorkStartTime(Date.now());
    setElapsedTime(0);
    
    // Start timer to update elapsed time
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - workStartTime) / 1000));
    }, 1000);
    
    // Start screenshot capture if enabled
    if (startupId && user) {
      setIsCapturing(true);
      
      // Take initial screenshot
      console.log('Taking initial screenshot...');
      setTimeout(() => {
        captureScreenshot();
      }, 2000);
      
      // Set up interval for periodic screenshots
      console.log('Setting up interval for periodic screenshots...');
      intervalRef.current = setInterval(() => {
        captureScreenshot();
      }, SCREENSHOT_INTERVAL);
    }
    
    // TODO: Send API request to log work start time
    setMessage('Work session started');
  };

  // Stop work tracking session
  const stopWorking = () => {
    if (!isWorking) return;
    
    console.log('Stopping work session...');
    setIsWorking(false);
    
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Calculate total work time
    const totalWorkTime = Math.floor((Date.now() - workStartTime) / 1000);
    console.log(`Total work time: ${formatTime(totalWorkTime)}`);
    
    // TODO: Send API request to log work end time
    setMessage(`Work session ended. Total time: ${formatTime(totalWorkTime)}`);
  };

  // Update timer when workStartTime changes
  useEffect(() => {
    if (workStartTime && isWorking) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - workStartTime) / 1000));
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [workStartTime, isWorking]);

  // Handle automatic screenshot capture
  useEffect(() => {
    console.log('SimpleScreenshotCapture component mounted');
    console.log('startupId:', startupId);
    console.log('user:', user);
    console.log('autoCapture:', autoCapture);
    
    if (startupId && user && autoCapture) {
      console.log('Starting automatic screenshot capture process...');
      // Start capturing screenshots
      setIsCapturing(true);
      
      // Take initial screenshot
      console.log('Taking initial screenshot...');
      setTimeout(() => {
        captureScreenshot();
      }, 2000); // Delay initial capture by 2 seconds to ensure component is fully mounted
      
      // Set up interval for periodic screenshots
      console.log('Setting up interval for periodic screenshots...');
      intervalRef.current = setInterval(() => {
        captureScreenshot();
      }, SCREENSHOT_INTERVAL);
    } else if (!startupId || !user) {
      console.log('Missing required props: startupId or user is undefined');
    } else {
      console.log('Automatic capture is disabled. Will capture only when triggered manually.');
    }
    
    return () => {
      // Clean up interval on unmount
      console.log('SimpleScreenshotCapture component unmounting...');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log('Screenshot interval cleared');
      }
    };
  }, [startupId, user, autoCapture]);

  const captureScreenshot = async () => {
    try {
      console.log('Starting screenshot capture...');
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      console.log('Display media access granted');
      const track = stream.getVideoTracks()[0];
      
      const imageCapture = new ImageCapture(track);
      console.log('ImageCapture created');
      const bitmap = await imageCapture.grabFrame();
      console.log('Frame grabbed, dimensions:', bitmap.width, 'x', bitmap.height);
      
      // Convert to blob
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
      console.log('Image drawn to canvas');
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Canvas converted to data URL, length:', dataUrl.length);
      
      // Create a download link
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${startupId}-${user?.name || user?.email}-${timestamp}.jpg`.replace(/[\\s/]/g, '_');
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Screenshot saved as', fileName);
      setMessage(`Screenshot saved as ${fileName}`);
      
      // Stop all tracks
      stream.getTracks().forEach(track => track.stop());
      console.log('Media tracks stopped');
      
    } catch (err) {
      console.error('Error capturing screenshot:', err);
      // Don't show error if user denied permission
      if (err.name !== 'NotAllowedError') {
        setError('Failed to capture screenshot');
      }
    }
  };

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
          variant="outlined"
          size="small"
          startIcon={<PhotoCameraIcon />}
          onClick={captureScreenshot}
          sx={{ mt: 1, color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Take Screenshot
        </Button>
      )}
      
      {error && <Box sx={{ color: '#ff6b6b', mt: 1, fontSize: '12px' }}>{error}</Box>}
      {message && <Box sx={{ color: '#4ade80', mt: 1, fontSize: '12px' }}>{message}</Box>}
    </Box>
  );
});

export default SimpleScreenshotCapture;
