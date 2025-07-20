const Stripe = require('stripe');

exports.handler = async (event) => {
  // Handle CORS preflight requests
  // Only allow trusted origins (production and local dev)
  const allowedOrigins = [
    'https://rarecollectables1.netlify.app',
    'http://localhost:8081',
    'http://127.0.0.1:8081'
  ];
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
  };

  // Respond to preflight OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Validate request origin
    const allowedOrigins = ['http://localhost:8081', 'https://rarecollectables.co.uk', 'http://127.0.0.1:8081'];
    const origin = event.headers.origin || event.headers.Origin;
    if (!allowedOrigins.includes(origin)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Invalid origin',
          requestId: event.requestId
        })
      };
    }



    // Validate Stripe API key
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key is not set');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Stripe secret key is not configured',
          details: 'Please set STRIPE_SECRET_KEY in Netlify environment variables'
        })
      };
    }

    // Validate Stripe key format
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      console.error('Invalid Stripe key format:', process.env.STRIPE_SECRET_KEY);
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Invalid Stripe secret key format',
          details: 'Stripe key must start with sk_test_ or sk_live_'
        })
      };
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15', // Using a more stable API version
    });

    // Parse request body
    const { cart, contact, address, coupon, discountAmount } = JSON.parse(event.body);

    // Log incoming request data
    console.log('Received checkout request:', {
      cartCount: cart.length,
      hasContact: !!contact,
      hasAddress: !!address,
      hasCoupon: !!coupon,
      discountAmount: discountAmount || 0,
      shippingCountries: address ? ['GB', 'US', 'CA', 'IE', 'AU', 'FR', 'DE', 'NG'] : []
    });

    // Validate input data
    if (!Array.isArray(cart) || cart.length === 0) {
      console.error('Invalid cart:', cart);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Cart is empty or invalid' })
      };
    }

    // Calculate subtotal amount in cents
    const subtotal = cart.reduce((sum, item) => {
      return sum + (item.price * 100 * item.quantity);
    }, 0);
    
    // Dynamic coupon handling - validate with Stripe and calculate discount
    let calculatedDiscountAmountCents = 0;
    if (coupon) {
      try {
        // Find the promotion code in Stripe
        const promoCodes = await stripe.promotionCodes.list({
          code: coupon,
          active: true,
          limit: 1
        });
        
        if (promoCodes.data.length > 0) {
          const promo = promoCodes.data[0];
          
          // Calculate discount based on coupon type
          if (promo.coupon.percent_off) {
            // Percentage discount
            calculatedDiscountAmountCents = Math.round(subtotal * (promo.coupon.percent_off / 100));
            console.log(`Applied ${promo.coupon.percent_off}% discount for coupon: ${coupon}`);
          } else if (promo.coupon.amount_off) {
            // Fixed amount discount
            calculatedDiscountAmountCents = promo.coupon.amount_off;
            console.log(`Applied fixed discount of ${promo.coupon.amount_off / 100} ${promo.coupon.currency} for coupon: ${coupon}`);
          }
        } else {
          console.log(`Coupon not found in Stripe: ${coupon}`);
          // Fall back to provided discount amount if coupon not found
          calculatedDiscountAmountCents = discountAmount ? Math.round(discountAmount * 100) : 0;
        }
      } catch (err) {
        console.error('Error validating coupon with Stripe:', err);
        // Fall back to provided discount amount if there's an error
        calculatedDiscountAmountCents = discountAmount ? Math.round(discountAmount * 100) : 0;
      }
    } else {
      // No coupon provided, use the provided discount amount if any
      calculatedDiscountAmountCents = discountAmount ? Math.round(discountAmount * 100) : 0;
    }
    
    console.log('Discount amount in cents:', calculatedDiscountAmountCents);
    
    // Calculate final total (ensure it's never negative)
    const total = Math.max(0, subtotal - calculatedDiscountAmountCents);
    console.log('Payment calculation:', { 
      subtotalCents: subtotal, 
      discountCents: calculatedDiscountAmountCents, 
      totalCents: total,
      couponApplied: coupon || 'none'
    });

    // Validate cart
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      console.error('Invalid cart array:', cart);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Invalid cart array',
          details: 'Cart must be a non-empty array of items'
        })
      };
    }

    // Validate each item in cart
    for (const item of cart) {
      if (!item.price || !item.quantity) {
        console.error('Invalid cart item:', item);
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ 
            error: 'Invalid cart item',
            details: 'Each item must have price and quantity'
          })
        };
      }
    }

    // Map cart items to Stripe line items
    const line_items = cart.map((item, index) => {
      // Log the raw item for debugging
      console.log(`Processing cart item ${index + 1}:`, item);

      // Get the product name from either name or title
      const productName = item.name || item.title || `Product ${index + 1}`;
      
      // Validate required fields
      if (!productName || !item.price || !item.quantity) {
        console.error('Invalid cart item:', {
          index,
          item,
          missing: {
            name: !productName,
            price: !item.price,
            quantity: !item.quantity
          }
        });
        throw new Error(`Invalid cart item ${index + 1}: Missing required fields`);
      }

      // Convert price to number if it's a string
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
      if (isNaN(price)) {
        console.error('Invalid price format:', {
          index,
          item,
          price: item.price
        });
        throw new Error(`Invalid price format for item ${index + 1}`);
      }

      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: productName,
            description: item.description || '',
            images: item.image_path ? [item.image_path] : undefined,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: item.quantity || 1,
      };
    });

    // Log the processed line items
    console.log('Processed line items:', line_items);

    // Create Payment Intent with proper validation
    const customer = await stripe.customers.create({
      email: contact.email,
      metadata: {
        shipping_address: address ? JSON.stringify({
          line1: address.line1,
          city: address.city,
          postal_code: address.zip,
          country: address.country || 'GB'
        }) : null
      }
    });

    // We've already validated the coupon code earlier, no need to do it again
    // Just log that we're proceeding with the payment intent creation
    console.log(`Proceeding with payment intent creation with coupon: ${coupon || 'none'}`);
    console.log(`Applied discount amount: ${calculatedDiscountAmountCents / 100} GBP`);
    
    // Create payment intent with simplified metadata and multiple payment methods
    const paymentIntentParams = {
      amount: total,
      currency: 'gbp',
      customer: customer.id,
      payment_method_types: ['card', 'paypal', 'klarna'],
      metadata: {
        contact_email: contact.email,
        shipping_address: address ? JSON.stringify({
          line1: address.line1,
          city: address.city,
          postal_code: address.zip,
          country: address.country || 'GB'
        }) : null,
        original_amount: subtotal.toString(),
        discount_amount: calculatedDiscountAmountCents.toString(),
        coupon: coupon || 'none',
        cart_items: JSON.stringify(cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })))
      }
    };
    
    // We don't use promotion_code directly as it's not supported in this API version
    // Instead, we've already applied the discount to the total amount
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Add additional metadata about the cart for tracking purposes
    const cartMetadata = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // Add cart metadata to the payment intent after creation
    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        ...paymentIntent.metadata,
        cart_items: JSON.stringify(cartMetadata)
      }
    });

    // Return success response with client secret and payment details
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentDetails: {
          subtotal,
          discount: calculatedDiscountAmountCents,
          total: paymentIntent.amount,
          couponApplied: coupon || null
        }
      }),
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    const statusCode = error.statusCode || 500;
    const response = {
      error: error.message || 'An unexpected error occurred',
      code: error.code,
      type: error.type,
      details: error.details
    };

    return {
      statusCode,
      headers,
      body: JSON.stringify(response)
    };
  }
};
