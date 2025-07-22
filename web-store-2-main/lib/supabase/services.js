import { supabase, isInitialized } from './client';

export const productsService = {
  /**
   * Fetch related products by category, excluding the current product id
   * @param {string} category - The category to match
   * @param {string} excludeId - The product id to exclude
   * @param {number} limit - Max number of products to return
   */
  async getRelatedProducts(category, excludeId, limit = 10) {
    try {
      // First, fetch products in the same category (excluding current)
      let { data: related, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .neq('id', excludeId)
        .limit(limit);
      if (error) throw error;
      related = related || [];
      // If not enough, fetch more from other categories (excluding current and already included)
      if (related.length < limit) {
        const excludeIds = [excludeId, ...related.map(p => p.id)];
        const { data: others, error: error2 } = await supabase
          .from('products')
          .select('*')
          .not('id', 'in', `(${excludeIds.map(id => `'${id}'`).join(',')})`)
          .limit(limit - related.length);
        if (error2) throw error2;
        related = [...related, ...(others || [])];
      }
      return related;
    } catch (error) {
      console.error('Error fetching related products:', error);
      throw error;
    }
  },
  async getAllProducts() {
    try {


      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      // Validate data
      if (!data || !Array.isArray(data)) {
        console.error('Invalid data received from Supabase:', data);
        throw new Error('Invalid products data received');
      }

      // Process the data to ensure image URLs are properly formatted
      const processedData = data.map(product => {
        // Image URL processing
        
        // Ensure image URL is properly formatted
        let imageUrl = product.image_url;
        
        // If we have an image URL
        if (imageUrl) {
          // If it's a relative path (starts with / or doesn't have http)
          if (!imageUrl.startsWith('http')) {
            // Ensure it starts with / if it's not already
            imageUrl = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
            // Add the full Supabase storage URL
            imageUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products${imageUrl}`;
            // Add proper headers for CORS
            const date = new Date().toISOString().split('T')[0];
            const timestamp = new Date().toISOString().replace(/[:.]/g, '');
            const credential = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.replace(/=/g, '');
            
            imageUrl = `${imageUrl}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${credential}%2F${date}%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=${timestamp}&X-Amz-SignedHeaders=host`;
          }
          
          // Add a timestamp to prevent caching issues
          imageUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
          
          // Debug processed URL

          
          return {
            ...product,
            image_url: imageUrl
          };
        }
        
        return {
          ...product,
          image_url: imageUrl
        };
      });

      console.log('Successfully fetched products:', processedData.length);
      return processedData;
    } catch (error) {
      console.error('Unexpected error in getAllProducts:', error);
      throw error;
    }
  },

  async getProductById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        throw new Error(`Failed to fetch product: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in getProductById:', error);
      throw error;
    }
  },

  async createProduct(product) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw new Error(`Failed to create product: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in createProduct:', error);
      throw error;
    }
  },
};

export const cartService = {
  async getCart(userId) {
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cart:', error);
        throw new Error(`Failed to fetch cart: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in getCart:', error);
      throw error;
    }
  },

  async addToCart(userId, productId, quantity) {
    try {
      const { data, error } = await supabase
        .from('cart')
        .insert({ user_id: userId, product_id: productId, quantity: quantity })
        .select()
        .single();

      if (error) {
        console.error('Error adding to cart:', error);
        throw new Error(`Failed to add to cart: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in addToCart:', error);
      throw error;
    }
  },
};

export const wishlistService = {
  async addToWishlist(userId, productId) {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .insert({ user_id: userId, product_id: productId })
        .select()
        .single();

      if (error) {
        console.error('Error adding to wishlist:', error);
        throw new Error(`Failed to add to wishlist: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in addToWishlist:', error);
      throw error;
    }
  },

  async getWishlist(userId) {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*, products(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist:', error);
        throw new Error(`Failed to fetch wishlist: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in getWishlist:', error);
      throw error;
    }
  }
};

// Service for logging contact form submissions
export const contactFormService = {
  /**
   * Inserts a contact form submission record
   * @param {Object} params
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.message
   * @param {object} [params.metadata]
   * @returns {Promise<{ data: any, error: any }>}
   */
  async logSubmission({ name, email, message, metadata = {} }) {
    try {
      const response = await fetch('/.netlify/functions/logContactForm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          metadata,
          submitted_at: new Date().toISOString(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('[NETLIFY FN ERROR]', result.error || result);
        return { data: null, error: result.error || result };
      }
      return { data: result.data, error: null };
    } catch (err) {
      console.error('[NETLIFY FN EXCEPTION]', err);
      return { data: null, error: err };
    }
  }
};

// Service for logging checkout attempts
export const checkoutAttemptService = {
  /**
   * Inserts or updates a checkout_attempts record for the current session.
   * @param {Object} params
   * @param {string} params.guest_session_id
   * @param {string} params.email
   * @param {object} params.contact
   * @param {object} params.address
   * @param {object[]} params.cart
   * @param {string} [params.status]
   * @param {object} [params.metadata]
   * @returns {Promise<{ data: any, error: any }>}
   */
  async upsertAttempt({ guest_session_id, email, contact, address, cart, status = 'started', metadata = {} }) {
    if (!guest_session_id) throw new Error('guest_session_id is required');
    try {
      const response = await fetch('/.netlify/functions/logCheckoutAttempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_session_id,
          email,
          contact,
          address,
          cart,
          status,
          metadata,
          updated_at: new Date().toISOString(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('[NETLIFY FN ERROR]', result.error || result);
        return { data: null, error: result.error || result };
      }
      console.log('[NETLIFY FN DATA]', result.data);
      return { data: result.data, error: null };
    } catch (err) {
      console.error('[NETLIFY FN EXCEPTION]', err);
      return { data: null, error: err };
    }
  }
};
