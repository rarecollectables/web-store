import { loadAsync } from 'expo-dotenv';
import { App } from 'expo-router';
import { configureFontLoading, loadAppFonts } from './app/font-config';

// Configure font loading with extended timeout to prevent fontfaceobserver timeout errors
if (typeof window !== 'undefined') {
  configureFontLoading();
}

// Load environment variables before the app starts
loadAsync().then(() => {
  // Load fonts with extended timeout
  return loadAppFonts().catch(err => {
    // Continue even if font loading fails
    console.warn('Font loading failed, continuing with app initialization:', err);
    return Promise.resolve();
  });
}).then(() => {
  // Now that environment variables and fonts are loaded (or attempted), initialize the app
  App();
}).catch(error => {
  console.error('Failed to load environment variables:', error);
  // Still initialize the app even if env vars failed to load
  App();
});

export default App;
