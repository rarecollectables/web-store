export const extractSearchParams = (query) => {
  const params = {
    query: '',
    category: null,
    priceRange: null
  };

  // Extract price range
  const priceMatch = query.match(/\b(\d+(?:\.\d+)?)-?(\d+(?:\.\d+)?)?\s*£?/);
  if (priceMatch) {
    params.priceRange = {
      min: parseFloat(priceMatch[1]),
      max: priceMatch[2] ? parseFloat(priceMatch[2]) : null
    };
  }

  // Extract category
  const categories = ['jewelry', 'art', 'antiques', 'collectibles'];
  for (const category of categories) {
    if (query.toLowerCase().includes(category)) {
      params.category = category;
      break;
    }
  }

  // Remove extracted parameters from query
  params.query = query
    .replace(/\b\d+(?:\.\d+)?-?\d*(?:\.\d+)?\s*£?/g, '')
    .replace(new RegExp(categories.join('|'), 'gi'), '')
    .trim();

  return params;
};

export const extractOrderId = (query) => {
  const match = query.match(/\b\d{6}\b/);
  return match ? match[0] : null;
};

export const analyzePurchasePatterns = async (orders) => {
  if (!orders || orders.length === 0) return [];

  // Get most frequently purchased categories
  const categoryCounts = {};
  orders.forEach(order => {
    order.order_items.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
  });

  // Sort categories by frequency
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  // Get recommended products based on purchase history
  const { data: recommendations } = await supabase
    .from('products')
    .select('*')
    .in('category_id', sortedCategories.slice(0, 2))
    .not('id', 'in', `(
      SELECT product_id FROM order_items 
      WHERE order_id IN (${orders.map(o => o.id).join(',')})
    )`)
    .limit(5);

  return recommendations;
};

export const scoreQuery = (query) => {
  // Simple keywords that indicate local queries
  const LOCAL_KEYWORDS = [
    'how many products',
    'what categories',
    'shipping',
    'returns',
    'view cart',
    'view wishlist',
    'my cart',
    'my wishlist',
    'find products',
    'recommend',
    'track order',
    'cancel order'
  ];

  // Check if query matches any local keywords
  const normalizedQuery = query.toLowerCase().trim();
  const isLocal = LOCAL_KEYWORDS.some(keyword => 
    normalizedQuery.includes(keyword)
  );

  return {
    isLocal,
    confidence: isLocal ? 0.9 : 0.3 // Higher confidence for local queries
  };
};

export const getLocalResponse = async (query, userId) => {
  // Try to match query with local knowledge
  for (const [category, handlers] of Object.entries(LOCAL_KNOWLEDGE)) {
    for (const [trigger, handler] of Object.entries(handlers)) {
      if (query.toLowerCase().includes(trigger.toLowerCase())) {
        return await handler(query, userId);
      }
    }
  }
  return null;
};
