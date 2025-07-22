import { createClient } from '@supabase/supabase-js';
import config from './config';

// Initialize Supabase client with proper configuration
const supabase = createClient(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// Generate a unique session ID for guest users
const generateSessionId = () => {
  return `guest_${Math.random().toString(36).substring(2)}`;
};

// Initialize guest session
const initializeGuestSession = async () => {
  try {
    // Generate a session ID
    const sessionId = generateSessionId();
    
    // Store the session in Supabase
    const { error: sessionError } = await supabase
      .from('guest_sessions')
      .insert({
        session_id: sessionId,
        last_active_at: new Date().toISOString()
      });

    if (sessionError) {
      console.error('Error creating guest session:', sessionError);
      throw sessionError;
    }

    return sessionId;
  } catch (error) {
    console.error('Failed to initialize guest session:', error);
    throw error;
  }
};

// Get or create guest session
const getGuestSession = async () => {
  try {
    // First try to get existing session
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('session_id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError) {
      console.error('Error getting guest session:', sessionError);
      // If error is not found, create a new session
      if (sessionError.code === 'PGRST109') {
        return initializeGuestSession();
      }
      throw sessionError;
    }

    return session.session_id;
  } catch (error) {
    console.error('Error in getGuestSession:', error);
    // Fallback to creating a new session
    return initializeGuestSession();
  }
};

// Test the connection
const testConnection = async () => {
  try {
    // Test database connection
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database connection test failed:', error);
      throw new Error('Database connection failed');
    }

    console.log('Supabase client initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return false;
  }
};

// Initialize client when module loads
const initializeClient = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to Supabase');
    }

    // Initialize guest session
    const sessionId = await getGuestSession();
    
    console.log('Guest session initialized:', sessionId);
    return { isConnected: true, sessionId };
  } catch (error) {
    console.error('Failed to initialize client:', error);
    return { isConnected: false, sessionId: null };
  }
};

// Initialize client when module loads
const initializationResult = initializeClient();

// Export the client and initialization status
export { supabase, initializationResult, getGuestSession, initializeGuestSession };

