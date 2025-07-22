import { loadAsync } from 'expo-dotenv';
import { App } from 'expo-router';

// Load environment variables before the app starts
loadAsync().then(() => {
  // Now that environment variables are loaded, we can safely initialize the app
  App();
}).catch(error => {
  console.error('Failed to load environment variables:', error);
  // Still initialize the app even if env vars failed to load
  App();
});

export default App;

