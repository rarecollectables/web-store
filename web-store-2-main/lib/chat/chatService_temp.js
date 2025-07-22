import { supabase } from '../supabase/client.js';
import { v4 as uuidv4 } from 'uuid';
import { CHAT_CONFIG } from './config';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 5,
  interval: 60 * 1000 // 1 minute
};

// Rate limiter state
let lastRequestTime = null;

// Track chat attempt
const trackChatAttempt = async (sessionId, message, response, success, errorMessage = null) => {
  try {
    // Get the number of attempts for this session
    const { count } = await supabase
      .from('chat_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    const attemptNumber = count || 0;

    // Record the attempt
    await supabase.from('chat_attempts').insert({
      id: uuidv4(),
      session_id: sessionId,
      attempt_number: attemptNumber + 1,
      message: message,
      response: response,
      success: success,
      error_message: errorMessage,
      created_at: new Date()
    });

    // Update session last active time
    await supabase
      .from('guest_sessions')
      .update({ last_active_at: new Date() })
      .eq('session_id', sessionId);

    // Track analytics
    await trackEvent('chat_attempt', null, {
      attempt_number: attemptNumber + 1,
      success,
      message_length: message.length
    });
  } catch (error) {
    console.error('Error tracking chat attempt:', error);
    // Log error to analytics
    await trackEvent('error', null, {
      type: 'chat_attempt_tracking',
      error: error.message
    });
  }
};

// Analytics tracking
const trackEvent = async (eventType, userId, data = {}) => {
  try {
    await supabase.from('chat_analytics').insert({
      id: uuidv4(),
      event_type: eventType,
      user_id: userId,
      data: data,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Archive message to chat_archive table
const trackGuestMessage = async (message, sessionId, response) => {
  try {
    await supabase.from('chat_archive').insert({
      id: uuidv4(),
      session_id: sessionId,
      message: message,
      response: response,
      created_at: new Date()
    });
  } catch (error) {
    console.error('Error tracking guest message:', error);
  }
};

// Cleanup expired sessions and archive messages
const cleanupSessions = async () => {
  try {
    // Get current time
    const now = new Date();

    // Delete expired sessions
    await supabase
      .from('guest_sessions')
      .delete()
      .lt('last_active_at', now - CHAT_CONFIG.SESSION.EXPIRATION);

    // Archive messages from expired sessions
    const { data: expiredSessions } = await supabase
      .from('guest_sessions')
      .select('session_id')
      .lt('last_active_at', now - CHAT_CONFIG.ARCHIVE.AFTER);

    if (expiredSessions && expiredSessions.length > 0) {
      const sessionIds = expiredSessions.map(s => s.session_id);
      
      // Move messages to archive
      await supabase
        .from('chat_archive')
        .insert(
          supabase
            .from('chat_history')
            .select('*')
            .in('session_id', sessionIds)
        );
      
      // Delete from chat_history
      await supabase
        .from('chat_history')
        .delete()
        .in('session_id', sessionIds);
    }

    // Track cleanup
    await trackEvent('cleanup', null, {
      type: 'sessions',
      count: expiredSessions?.length || 0
    });
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    await trackEvent('error', null, {
      type: 'cleanup_sessions',
      error: error.message
    });
  }
};

// Cleanup old archived messages (runs daily)
const cleanupArchivedMessages = async () => {
  try {
    // Delete messages older than retention period
    const { data: deleted } = await supabase
      .from('chat_archive')
      .delete()
      .lt('created_at', new Date() - CHAT_CONFIG.ARCHIVE.RETENTION);

    // Track cleanup
    await trackEvent('cleanup', null, {
      type: 'archive',
      count: deleted?.length || 0
    });
  } catch (error) {
    console.error('Error cleaning up archived messages:', error);
    await trackEvent('error', null, {
      type: 'cleanup_archive',
      error: error.message
    });
  }
};

// Start cleanup intervals
setInterval(cleanupSessions, CHAT_CONFIG.SESSION.CLEANUP_INTERVAL);
setInterval(cleanupArchivedMessages, CHAT_CONFIG.ARCHIVE.CLEANUP_INTERVAL);

// Get local response
const getLocalResponse = async (query, userId) => {
  try {
    const queryLower = query.toLowerCase();
    
    // Basic product-related responses
    if (queryLower.includes('products') || 
        queryLower.includes('items') || 
        queryLower.includes('store')) {
      return 'We have a wide variety of luxury jewelry items available. Would you like to see our collection?';
    }

    // Basic cart responses
    if (queryLower.includes('cart') || 
        queryLower.includes('shopping cart') || 
        queryLower.includes('basket')) {
      return 'Your shopping cart is currently empty. Would you like to browse our collection?';
    }

    // Basic help responses
    if (queryLower.includes('help') || 
        queryLower.includes('support') || 
        queryLower.includes('assist')) {
      return `I can help you with:
- Product information and availability
- Shopping cart management
- Order status
- Store policies

What would you like to know?`;
    }

    return null;
  } catch (error) {
    console.error('Error getting local response:', error);
    return null;
  }
};

// Generate a guest session ID if user is not authenticated
const getGuestSession = async (userId) => {
  try {
    // Generate a new session ID
    const sessionId = `guest_${Date.now()}_${uuidv4()}`;

    // Store in guest_sessions table
    await supabase.from('guest_sessions').insert({
      id: uuidv4(),
      session_id: sessionId,
      created_at: new Date()
    });

    // Track analytics
    await trackEvent('guest_session', userId, {
      session_id: sessionId
    });

    return sessionId;
  } catch (error) {
    console.error('Error creating guest session:', error);
    await trackEvent('error', userId, {
      type: 'guest_session_creation',
      error: error.message
    });
    throw error;
  }
};

// Handle guest queries
const handleGuestQuery = async (query, userId) => {
  try {
    // Get a local response first
    const localResponse = await getLocalResponse(query, userId);
    if (localResponse) return localResponse;

    // If no local response, return a default message
    return 'I can help you with product information and your cart. What would you like to know?';
  } catch (error) {
    console.error('Error handling guest query:', error);
    return 'I apologize, but I encountered an error processing your request.';
  }
};

// Send message through chat service
const sendMessage = async (query, userId) => {
  try {
    // Rate limiting
    const now = Date.now();
    if (lastRequestTime && 
        now - lastRequestTime < RATE_LIMIT_CONFIG.interval / RATE_LIMIT_CONFIG.maxRequests) {
      throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
    }
    lastRequestTime = now;

    // Get or create session
    const sessionId = await getGuestSession(userId);

    // Track the chat attempt
    await trackChatAttempt(sessionId, query, null, false, 'Message processing started');

    // Get AI response
    const response = await handleGuestQuery(query, userId);

    // Store in chat_history
    await storeMessage(query, userId, response);

    // Track analytics
    await trackEvent('message_sent', userId, {
      session_id: sessionId,
      message_length: query.length,
      response_length: response ? response.length : 0,
      has_response: !!response
    });

    return response;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    
    // Track the failed attempt
    await trackChatAttempt(sessionId, query, null, false, error.message);
    
    // Track error
    await trackEvent('error', userId, {
      type: 'message_send',
      error: error.message
    });
    throw error;
  }
};

// Store chat history in Supabase
const storeMessage = async (message, userId, response) => {
  try {
    const { error } = await supabase
      .from('chat_history')
      .insert({
        session_id: userId, // Using userId as session_id for simplicity
        message: message,
        response: response,
        created_at: new Date()
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
};

// Get chat history
const getChatHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
};

export const chatService = {
  sendMessage,
  storeMessage,
  getChatHistory,
  getGuestSession
};
