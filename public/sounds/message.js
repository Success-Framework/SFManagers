//Create a simple message notification sound effect
// This file creates a notification sound using the Web Audio API
// Can be used directly or converted to MP3 for use in the app

/**
 * Function to play a notification sound
 * @param {AudioContext} audioContext - Optional audio context to use
 * @returns {Promise} - Promise that resolves when the sound is finished playing
 */
function playMessageSound(audioContext) {
  // Create an audio context if one wasn't provided
  const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  
  // Create an oscillator for the "ding" sound
  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
  oscillator.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // A6
  
  // Create a gain node to control volume
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  // Connect nodes: oscillator -> gain -> destination
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // Start and stop the oscillator
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.3);
  
  // Return a promise that resolves when the sound is finished
  return new Promise(resolve => {
    setTimeout(resolve, 300);
  });
}

// Export for CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { playMessageSound };
}

// For browser environments when loaded directly
if (typeof window !== 'undefined') {
  window.playMessageSound = playMessageSound;
}
