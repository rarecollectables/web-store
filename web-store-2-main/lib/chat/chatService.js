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
const trackChatAttempt = async (session, query, response, success, errorMessage = null) => {
  try {
    // Get the number of attempts for this session
    const { count } = await supabase
      .from('chat_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session);

    const attemptNumber = count || 0;

    // Record the attempt
    await supabase.from('chat_attempts').insert({
      id: uuidv4(),
      session_id: session,
      attempt_number: attemptNumber + 1,
      message: query,
      response: response,
      success: success,
      error_message: errorMessage,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Update session last active time
    const now = new Date().toISOString();
    await supabase
      .from('guest_sessions')
      .update({ 
        last_active_at: now,
        updated_at: now
      })
      .eq('session_id', session);

    // Track analytics
    await trackEvent('chat_attempt', null, {
      session_id: session,
      attempt_number: attemptNumber + 1,
      success: success,
      error: errorMessage || null
    });
  } catch (error) {
    console.error('Error tracking chat attempt:', error);
  }
};

// Analytics tracking
const trackEvent = async (eventType, userId, data) => {
  try {
    const eventData = {
      session_id: data?.session_id,
      event_type: eventType,
      data: JSON.stringify(data)
    };

    // Only include user_id if it exists
    if (userId) {
      eventData.user_id = userId;
    }

    await supabase.from('chat_analytics').insert({
      id: uuidv4(),
      ...eventData,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Cleanup expired sessions and archive messages
const cleanupSessions = async () => {
  try {
    // Get current time
    const now = new Date();
    
    // Calculate date 24 hours ago and format as ISO string for Supabase
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get sessions that haven't been active in the last 24 hours
    const { data: expiredSessions } = await supabase
      .from('guest_sessions')
      .select('session_id')
      .lt('last_active_at', oneDayAgo);

    if (expiredSessions?.length > 0) {
      // Archive messages from expired sessions
      for (const session of expiredSessions) {
        try {
          const { data: messages } = await supabase
            .from('chat_history')
            .select('*')
            .eq('session_id', session.session_id);

          if (messages?.length > 0) {
            await Promise.all(messages.map(msg =>
              supabase.from('chat_archive').insert({
                id: uuidv4(),
                session_id: session.session_id,
                user_id: msg.user_id,
                message: msg.message,
                response: msg.response,
                created_at: msg.created_at
              })
            ));
          }

          // Delete expired session and its messages
          await supabase
            .from('guest_sessions')
            .delete()
            .eq('session_id', session.session_id);

          await supabase
            .from('chat_history')
            .delete()
            .eq('session_id', session.session_id);

          await supabase
            .from('chat_attempts')
            .delete()
            .eq('session_id', session.session_id);
        } catch (error) {
          console.error('Error cleaning up session:', error);
        }
      }
    }

    // Track cleanup operation
    await trackEvent('session_cleanup', null, {
      count: expiredSessions?.length || 0
    });
  } catch (error) {
    console.error('Error in cleanupSessions:', error);
  }
};

// Cleanup old archived messages (runs daily)
const cleanupArchivedMessages = async () => {
  try {
    // Delete archived messages older than 30 days
    await supabase
      .from('chat_archive')
      .delete()
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    // Track cleanup operation
    await trackEvent('archive_cleanup', null, {
      action: 'delete_old_messages'
    });
  } catch (error) {
    console.error('Error in cleanupArchivedMessages:', error);
  }
};

// --- Product Count Intent Logic ---
import { PRODUCTS } from '../../app/(data)/products';

/**
 * Detect if the user message is asking about the count of products in a category (e.g., "How many necklaces...")
 * Returns the category name if found, otherwise null.
 */
function detectProductCountIntent(message) {
  const lower = message.toLowerCase();
  // Add more categories as needed
  const categories = ['necklaces', 'bracelets', 'rings', 'earrings'];
  for (const cat of categories) {
    if (lower.includes(`how many ${cat}`) || lower.includes(`${cat} in store`)) {
      return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  }
  return null;
}

/**
 * Count the number of products in a given category
 */
function countProductsByCategory(category) {
  return PRODUCTS.filter(p => p.category === category).length;
}

// Natural Language Understanding (NLU) and Intent Recognition
const INTENT_PATTERNS = {
  PRODUCT_INQUIRY: /\b(what|which|show|list|find|search|i want|i need|looking for|buy|get|purchase)\b.*|\b(necklace|necklaces|ring|rings|bracelet|bracelets|earring|earrings|pendant|pendants|chain|chains|silver|gold|moissanite|diamond|gemstone|emerald|ruby|sapphire)\b/i,
  PRICE_QUERY: /\b(how much|price|cost|expensive|cheap)\b.*\b(product|item)\b/i,
  AVAILABILITY_CHECK: /\b(available|in stock|have|can get)\b.*\b(product|item)\b/i,
  RECOMMENDATION: /\b(recommend|suggest|best|good|popular)\b.*\b(product|item)\b/i,
  STORE_INFO: /\b(store|shop|location|hours|contact|help)\b/i,
  PRODUCT_COUNT: /\b(how many|count|total|number of)\b.*\b(product|item|things)\b/i,
  CATEGORY_COUNT: /\b(how many|count|total|number of)\b.*\b(category|categories|types)\b/i
};

const ENTITY_TYPES = {
  PRODUCT_NAME: 'PRODUCT_NAME',
  CATEGORY: 'CATEGORY',
  PRICE_RANGE: 'PRICE_RANGE',
  FEATURE: 'FEATURE'
};

// Enhanced NLU functions
const extractEntities = (query) => {
  const entities = {
    [ENTITY_TYPES.PRODUCT_NAME]: [],
    [ENTITY_TYPES.CATEGORY]: [],
    [ENTITY_TYPES.PRICE_RANGE]: [],
    [ENTITY_TYPES.FEATURE]: []
  };

  // Fallback: if no entities detected, treat the whole query as a possible product/category
  const q = query.trim().toLowerCase();

  // Extract product names
  const productTerms = query.match(/\b[A-Z][a-z]+\b/g) || [];
  entities[ENTITY_TYPES.PRODUCT_NAME] = productTerms;

  // Fallback: if all entities are empty and query is not empty, treat as category or product
  if (
    entities[ENTITY_TYPES.PRODUCT_NAME].length === 0 &&
    entities[ENTITY_TYPES.CATEGORY].length === 0 &&
    entities[ENTITY_TYPES.FEATURE].length === 0 &&
    q.length > 0
  ) {
    entities[ENTITY_TYPES.CATEGORY] = [q];
    entities[ENTITY_TYPES.PRODUCT_NAME] = [q];
  }

  // Extract categories (expanded for jewelry)
  const categories = ['necklace', 'necklaces', 'ring', 'rings', 'bracelet', 'bracelets', 'earring', 'earrings', 'pendant', 'pendants', 'chain', 'chains'];
  entities[ENTITY_TYPES.CATEGORY] = categories.filter(cat => 
    query.toLowerCase().includes(cat)
  );

  // Extract materials/features
  const materials = ['silver', 'gold', 'moissanite', 'diamond', 'gemstone', 'emerald', 'ruby', 'sapphire', 'platinum', 'rose gold'];
  entities[ENTITY_TYPES.FEATURE] = materials.filter(mat => 
    query.toLowerCase().includes(mat)
  );

  // Extract price ranges
  const priceRanges = query.match(/\b(\d+(?:\.\d+)?)\s*(?:to|and|or)\s*(\d+(?:\.\d+)?)?\b/g);
  if (priceRanges) {
    entities[ENTITY_TYPES.PRICE_RANGE] = priceRanges;
  }

  // Extract features
  const features = ['new', 'used', 'discounted', 'limited edition'];
  entities[ENTITY_TYPES.FEATURE] = features.filter(feat => 
    query.toLowerCase().includes(feat)
  );

  return entities;
};

const recognizeIntent = (query) => {
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(query)) {
      return intent;
    }
  }
  return 'UNKNOWN';
};

// Context Management
const CONTEXT_WINDOW_SIZE = 5;

const buildContext = (messages) => {
  const recentMessages = messages.slice(-CONTEXT_WINDOW_SIZE);
  const context = {
    previousQueries: recentMessages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.text),
    previousResponses: recentMessages
      .filter(msg => msg.sender === 'assistant')
      .map(msg => msg.text),
    lastQuery: recentMessages[recentMessages.length - 1]?.text || ''
  };
  return context;
};

// Enhanced product information retrieval
const getRelevantProductInfo = async (query) => {
  try {
    const intent = recognizeIntent(query);
    const entities = extractEntities(query);
    
    // Get products matching the query terms
    // Select all columns for richer product info
    let products;
    if (
      entities[ENTITY_TYPES.PRODUCT_NAME].length === 0 &&
      entities[ENTITY_TYPES.CATEGORY].length === 0 &&
      entities[ENTITY_TYPES.FEATURE].length === 0
    ) {
      // Fallback: try to match by query as category or name
      const q = query.trim().toLowerCase();
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5);
      products = data;
    } else {
      const { data } = await supabase
        .from('products')
        .select('*')
        .or(`
          name.ilike.%${entities[ENTITY_TYPES.PRODUCT_NAME].join('%')}%,
          category.ilike.%${entities[ENTITY_TYPES.CATEGORY].join('%')}%,
          features.ilike.%${entities[ENTITY_TYPES.FEATURE].join('%')}%
        `)
        .limit(5);
      products = data;
    }

    // If no products found in Supabase, search local PRODUCTS array
    let inventoryStatus = [];
    if (!products || products.length === 0) {
      // Tokenize query for robust matching
      const jewelryKeywords = [
        'necklace', 'necklaces', 'ring', 'rings', 'bracelet', 'bracelets', 'earring', 'earrings',
        'pendant', 'pendants', 'chain', 'chains',
        'moissanite', 'silver', 'gold', 'diamond', 'gemstone', 'emerald', 'ruby', 'sapphire', 'platinum', 'rose gold'
      ];
      const tokens = query.trim().toLowerCase().split(/\s+/);
      const singularize = s => s.replace(/s$/i, '');
      const filteredTokens = tokens.filter(token => jewelryKeywords.some(jk => jk === singularize(token)));
      inventoryStatus = PRODUCTS.filter(p => {
        const cat = p.category ? p.category.toLowerCase() : '';
        const title = p.title ? p.title.toLowerCase() : '';
        return filteredTokens.some(token => {
          const t = singularize(token);
          return cat.includes(t) || title.includes(t);
        });
      }).map(product => ({
        ...product,
        inStock: true,
        quantity: 1,
        price: Number(product.price?.replace(/[^\d.]/g, '')) || 0,
        specialOffer: null,
        intent: intent,
        entities: entities
      }));
    } else {
      inventoryStatus = await Promise.all(
        products?.map(async (product) => {
          const { data: stock } = await supabase
            .from('inventory')
            .select('quantity, price')
            .eq('product_id', product.id)
            .single();

          const { data: specialOffers } = await supabase
            .from('special_offers')
            .select('*')
            .eq('product_id', product.id)
            .eq('is_active', true)
            .single();

          return {
            ...product,
            inStock: stock?.quantity > 0,
            quantity: stock?.quantity || 0,
            price: stock?.price || 0,
            specialOffer: specialOffers,
            intent: intent,
            entities: entities
          };
        }) || []
      );
    }

    return inventoryStatus;
  } catch (error) {
    console.error('Error getting product info:', error);
    return [];
  }
};

const getLocalResponse = async (query, userId, sessionId) => {
  try {
    // Get the last 5 messages from this session
    const { data: history } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Format history for context
    const context = history?.map(msg => `
      User: ${msg.message}
      Assistant: ${msg.response}
    `).join('\n') || '';

    // Get user preferences and shopping history
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get relevant product information based on query
    const productInfo = await getRelevantProductInfo(query);

    // Get response from local model with enhanced context
    const response = await fetch('http://localhost:8081/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        userId,
        preferences,
        productInfo
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error getting local response:', error);
    return 'I apologize, but I encountered an error processing your request.';
  }
};

// Generate a guest session ID if user is not authenticated
const getGuestSession = async () => {
  try {
    // First try to get existing session
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('session_id')
      .order('last_active_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError && sessionError.code !== 'PGRST116') {
      console.error('Error getting session:', sessionError);
      return null;
    }

    if (session?.session_id) {
      // Update last active time for existing session
      const { error: updateError } = await supabase
        .from('guest_sessions')
        .update({ 
          last_active_at: new Date(),
          updated_at: new Date()
        })
        .eq('session_id', session.session_id);

      if (updateError) {
        console.error('Supabase error updating existing guest session:', updateError);
        return null;
      }

      return session.session_id;
    }

    // Create new session if none exists
    const newSessionId = `guest_${uuidv4()}`;
    const { error: insertError, data: insertData } = await supabase
      .from('guest_sessions')
      .insert({
        id: uuidv4(),
        session_id: newSessionId,
        last_active_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      });

    if (insertError) {
      console.error('Supabase error inserting new guest session:', insertError);
      return null;
    }

    if (!insertData) {
      console.warn('No data returned from Supabase insert for new guest session.');
      return null;
    }

    return newSessionId;
  } catch (error) {
    console.error('Error in session management:', error);
    return null;
  }
};
const handleGuestQuery = async (query) => {
  try {
    const session = await getGuestSession();
    if (!session) {
      throw new Error('Failed to get guest session');
    }

    // Rate limiting check
    const now = Date.now();
    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_CONFIG.interval) {
      const attempts = await supabase
        .from('chat_attempts')
        .select('attempt_number')
        .eq('session_id', session)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (attempts?.attempt_number >= RATE_LIMIT_CONFIG.maxRequests) {
        throw new Error('Rate limit exceeded');
      }
    }

    lastRequestTime = now;

    // Get response
    const response = await getLocalResponse(query);

    if (!response) {
      throw new Error('No response received');
    }

    // Store message and track attempt
    await storeMessage(query, null, response, session);
    await trackChatAttempt(session, query, response, true);

    return response;
  } catch (error) {
    console.error('Error handling guest query:', error);
    // Ensure session is defined before tracking
    const session = await getGuestSession();
    await trackChatAttempt(session || '', query, null, false, error.message);
    throw error;
  }
};

// Send message through chat service
const sendMessage = async (query, userId) => {
  try {
    if (!userId) {
      return await handleGuestQuery(query);
    }

    // Rate limiting check
    const now = Date.now();
    if (lastRequestTime && now - lastRequestTime < RATE_LIMIT_CONFIG.interval) {
      const attempts = await supabase
        .from('chat_attempts')
        .select('attempt_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (attempts?.attempt_number >= RATE_LIMIT_CONFIG.maxRequests) {
        throw new Error('Rate limit exceeded');
      }
    }

    lastRequestTime = now;
    
    // Get response
    const response = await getLocalResponse(query, userId);

    // Store message and track attempt
    await storeMessage(query, userId, response);
    await trackChatAttempt(null, query, response, true);

    return response;
  } catch (error) {
    console.error('Error sending message:', error);
    await trackChatAttempt(null, query, null, false, error.message);
    throw error;
  }
};

// Store chat history in Supabase
const storeMessage = async (message, userId, response, session) => {
  try {
    if (!session) {
      throw new Error('Failed to get session');
    }

    // Store in chat_history with is_processed flag
    await supabase.from('chat_history').insert({
      id: uuidv4(),
      session_id: session,
      message: message,
      response: response,
      user_id: userId,
      is_processed: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Store in chat_archive for long-term storage
    await supabase.from('chat_archive').insert({
      id: uuidv4(),
      session_id: session,
      user_id: userId,
      message: message,
      response: response,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
};

// Get chat history
const getChatHistory = async (userId) => {
  try {
    const session = await getGuestSession(userId);
    if (!session) {
      return [];
    }

    const { data } = await supabase
      .from('chat_history')
      .select('*')
      .eq('session_id', session)
      .order('created_at', { ascending: true });

    return data || [];
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
};

// Enhanced response generation with context and product info
async function generateResponse(message, context, productInfo) {
  try {
    // Small talk handling
    const smallTalk = [
      { pattern: /\b(hi|hello|hey|good morning|good afternoon|good evening)\b/i, response: "Hello, I'm Anna! How can I brighten your day or help you find something special?" },
      { pattern: /\b(how are you|how's it going|how do you do)\b/i, response: "I'm doing great, thank you for asking! As Anna, your Rare Collectables assistant, I'm always happy to help you!" },
      { pattern: /\b(thank you|thanks|cheers)\b/i, response: "You're very welcome! Anna is always here if you have more questions or need a recommendation." },
      { pattern: /\b(who are you|what are you)\b/i, response: "I'm Anna, your friendly Rare Collectables assistant. I'm here to help you find the perfect treasure or answer any questions you have!" },
      { pattern: /\b(joke|make me laugh|tell me something funny)\b/i, response: "Here's a little something from Anna: Why did the necklace go to school? To get a little more 'class'!" },
      { pattern: /\b(weather)\b/i, response: "I'm not sure about the weather, but I can help you find the perfect gift!" },
      { pattern: /\b(bye|goodbye|see you|later|farewell)\b/i, response: "Goodbye from Anna! Have a wonderful day, and remember, I'm always here if you need anything else." },
    ];
    for (const s of smallTalk) {
      if (s.pattern.test(message)) {
        return s.response;
      }
    }
    // Product count intent logic
    const category = detectProductCountIntent(message);
    if (category) {
      const count = countProductsByCategory(category);
      return `We currently have ${count} ${category.toLowerCase()} in store.`;
    }
    // Fallback: generic product count (e.g. 'how many items/products are in store')
    const lower = message.toLowerCase();
    if (
      (lower.includes('how many') || lower.includes('number of') || lower.includes('count')) &&
      (lower.includes('items') || lower.includes('products') || lower.includes('things'))
    ) {
      // Use PRODUCTS array for local count
      try {
        const totalCount = PRODUCTS.length;
        return `We currently have ${totalCount} items in store.`;
      } catch (err) {
        // If PRODUCTS is not available, fallback to DB
        try {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
          return `We currently have ${count || 'many'} items in store.`;
        } catch (dbErr) {
          // Final fallback
          return "We have a wide selection of items in store.";
        }
      }
    }

    let response = '';
    const intent = recognizeIntent(message);

    if (intent === 'CATEGORY_COUNT') {
      try {
        const { data: categories } = await supabase
          .from('products')
          .select('category')
          .distinct();

        response = `We offer products across ${categories.length} different categories, including ${categories.slice(0, 3).map(c => c.category).join(', ')}${categories.length > 3 ? ' and more' : ''}.`;
      } catch (error) {
        console.error('Error getting category count:', error);
        response = "We offer a diverse range of categories for our rare collectables.";
      }
    } else if (intent === 'PRODUCT_INQUIRY') {
      if (productInfo?.length > 0) {
        if (productInfo.length === 1) {
          const product = productInfo[0];
          response = `I found this product for you: ${product.title}. `;
          if (product.description) response += `Description: ${product.description} `;
          if (product.materials) response += `Materials: ${product.materials} `;
          if (product.carat) response += `Carat: ${product.carat} `;
          response += `It's ${product.inStock ? 'currently in stock' : 'currently out of stock'}. `;
          if (product.price) {
            response += `The price is $${product.price.toFixed(2)}.`;
          }
        } else {
          response = `Here are some recommendations from Anna!`;
          // No product text list, let the UI render the product cards only
        }
      } else {
        response = "I couldn't find any products matching your query. Could you please provide more details?";
      }
    } else if (intent === 'PRICE_QUERY') {
      if (productInfo?.length > 0) {
        const product = productInfo[0];
        response = `The price of ${product.title} is $${product.price.toFixed(2)}.`;
        if (product.specialOffer) {
          response += ` There's also a special offer: ${product.specialOffer.description}`;
        }
      } else {
        response = "I couldn't find the price information. Could you please specify which product you're interested in?";
      }
    } else if (intent === 'AVAILABILITY_CHECK') {
      if (productInfo?.length > 0) {
        const product = productInfo[0];
        response = `${product.title} is ${product.inStock ? 'currently in stock' : 'currently out of stock'}. `;
        if (product.inStock) {
          response += `We have ${product.quantity} units available.`;
        }
      } else {
        response = "I couldn't find the availability information. Could you please specify which product you're looking for?";
      }
    } else if (intent === 'RECOMMENDATION') {
      if (productInfo?.length > 0) {
        response = "Here are some products you might be interested in:\n";
        productInfo.forEach(product => {
          response += `- ${product.title}: $${product.price.toFixed(2)} (${product.inStock ? 'In Stock' : 'Out of Stock'})\n`;
        });
      } else {
        response = "I couldn't find any recommendations. Could you please provide more details about what you're looking for?";
      }
    } else if (intent === 'STORE_INFO') {
      response = "Our store is open Monday to Friday, 9 AM to 6 PM. You can reach us at support@store.com or call us at (555) 123-4567.";
    } else {
      // Try to understand the query better
      if (message.toLowerCase().includes('how many')) {
        response = "Let me check our product count for you...";
        // Re-run with PRODUCT_COUNT intent
        return generateResponse(message, context, productInfo);
      }
      response = "I'm not sure I understand. Could you please rephrase your question?";
    }

    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return "I apologize, I'm having trouble processing your request right now. Please rephrase your question or contact carecentre@rarecollectables.co.uk";
  }
}

export const chatService = {
  sendMessage,
  storeMessage,
  getChatHistory,
  getGuestSession,
  generateResponse,
  getRelevantProductInfo,
  async getConversationContext(sessionId) {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.reverse();
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return [];
    }
  }
};

// Start cleanup intervals
setInterval(cleanupSessions, CHAT_CONFIG.SESSION.CLEANUP_INTERVAL);
setInterval(cleanupArchivedMessages, CHAT_CONFIG.ARCHIVE.CLEANUP_INTERVAL);
