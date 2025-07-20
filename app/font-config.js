// font-config.js
// Configure font loading behavior for the application

// Import FontFaceObserver to handle font loading
import FontFaceObserver from 'fontfaceobserver';

// Increase the default timeout for font loading (default is 3000ms)
// This helps prevent timeout errors on slower connections
const FONT_TIMEOUT = 30000; // 30 seconds - much longer timeout

// Flag to completely bypass font loading on web if needed
const BYPASS_FONT_LOADING = true;

/**
 * Load application fonts with extended timeout
 * This function can be called during app initialization
 */
export const loadAppFonts = async () => {
  // Check if we should bypass font loading on web
  if (BYPASS_FONT_LOADING && typeof window !== 'undefined') {
    console.log('Bypassing font loading on web platform');
    return true;
  }
  
  // System font is already available, but we'll set up the observer
  // to demonstrate how to use it for custom fonts
  const systemFont = new FontFaceObserver('System');
  
  try {
    // Wait for font to load with extended timeout
    await systemFont.load(null, FONT_TIMEOUT);
    console.log('System font loaded successfully');
    return true;
  } catch (error) {
    // If font loading fails, log the error but continue app execution
    console.warn('Font loading error:', error);
    return false;
  }
};

/**
 * Configure font loading behavior
 * This function can be called to modify global font loading behavior
 */
export const configureFontLoading = () => {
  // For web platform only
  if (typeof document !== 'undefined') {
    if (BYPASS_FONT_LOADING) {
      // Complete bypass of fontfaceobserver by creating a mock implementation
      // This prevents the timeout error by immediately resolving all font loading promises
      window.FontFaceObserver = function(family, descriptors) {
        return {
          load: function() {
            console.log(`Mock font loading for: ${family}`);
            return Promise.resolve();
          }
        };
      };
      console.log('Font loading completely bypassed for web');
    } else {
      // Add a global timeout configuration for all font observers
      // This is a workaround for the fontfaceobserver timeout issue
      window.FontFaceObserver = function(family, descriptors) {
        const observer = new FontFaceObserver(family, descriptors);
        const originalLoad = observer.load;
        
        // Override the load method to use our extended timeout
        observer.load = function(text, timeout) {
          return originalLoad.call(this, text, timeout || FONT_TIMEOUT);
        };
        
        return observer;
      };
      console.log('Font loading configuration applied with extended timeout');
    }
  }
};

export default {
  loadAppFonts,
  configureFontLoading,
  FONT_TIMEOUT,
  BYPASS_FONT_LOADING
};
