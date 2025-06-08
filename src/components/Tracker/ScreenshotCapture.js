import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ScreenshotCapture = ({ startupId }) => {
  const { user } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const intervalRef = useRef(null);
  const SCREENSHOT_INTERVAL = 30 * 1000; // 30 seconds in milliseconds

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start capturing screenshots when component mounts
  useEffect(() => {
    if (startupId && user) {
      // Start capturing screenshots
      setIsCapturing(true);
      
      // Take initial screenshot
      captureAndUploadScreenshot();
      
      // Set up interval for periodic screenshots
      intervalRef.current = setInterval(() => {
        captureAndUploadScreenshot();
      }, SCREENSHOT_INTERVAL);
    }
    
    return () => {
      // Clean up interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startupId, user]);

  const captureAndUploadScreenshot = async () => {
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
      
      canvas.toBlob(async (blob) => {
        console.log('Blob created, size:', blob.size, 'bytes');
        
        // Create form data for the screenshot
        const formData = new FormData();
        formData.append('screenshot', blob, 'screenshot.jpg');
        formData.append('startupId', startupId);
        formData.append('userName', user?.name || user?.email);
        
        // Upload the screenshot using our simple endpoint
        try {
          console.log('Uploading screenshot to /api/screenshots/save...');
          const response = await axios.post('/api/screenshots/save', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('Screenshot upload response:', response.data);
          setMessage('Screenshot saved successfully');
        } catch (uploadError) {
          console.error('Error uploading screenshot:', uploadError);
          console.error('Error details:', uploadError.response ? uploadError.response.data : 'No response data');
          setError('Failed to save screenshot: ' + (uploadError.response ? JSON.stringify(uploadError.response.data) : uploadError.message));
        }
      }, 'image/jpeg', 0.8);
      
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

  // This component doesn't render anything visible
  return null;
};

export default ScreenshotCapture;
