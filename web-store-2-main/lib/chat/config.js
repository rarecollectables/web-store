export const CHAT_CONFIG = {
  // Response timeouts
  TIMEOUTS: {
    LOCAL: 1000,      // 1 second for local responses
    AI: 10000,       // 10 seconds for AI responses
    DB: 5000         // 5 seconds for database operations
  },

  // Message limits
  MESSAGE_LENGTH: {
    MAX: 1000,       // Maximum message length
    WARNING: 500     // Warning threshold for long messages
  },

  // Session management
  SESSION: {
    EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    CLEANUP_INTERVAL: 60 * 60 * 1000 // 1 hour
  },

  // Message archiving
  ARCHIVE: {
    ENABLED: true,
    RETENTION_DAYS: 365, // 1 year
    CLEANUP_INTERVAL: 24 * 60 * 60 * 1000 // 24 hours
  },

  // AI Configuration
  AI: {
    TEMPERATURE: 0.7,
    MAX_TOKENS: 150,
    MODEL: "gpt-3.5-turbo",
    SYSTEM_PROMPT: "You are a helpful customer service assistant for a luxury collectibles store. Provide concise and friendly responses."
  },

  // Features
  FEATURES: {
    VISUAL_SEARCH: true,
    ORDER_TRACKING: true,
    PRODUCT_RECOMMENDATIONS: true,
    CART_INTEGRATION: true,
    WISHLIST_INTEGRATION: true
  },

  // Error messages
  MESSAGES: {
    TIMEOUT: "Sorry, I'm taking too long to respond. Please try again.",
    TOO_LONG: "Your message is quite long. Please try to keep it under 500 characters.",
    UNAUTHORIZED: "This feature requires authentication. Please sign in to continue.",
    SYSTEM_ERROR: "I'm having trouble with that request. Could you please try again?"
  }
};
