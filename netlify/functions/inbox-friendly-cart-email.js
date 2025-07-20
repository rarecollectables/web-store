// netlify/functions/inbox-friendly-cart-email.js
// A more inbox-friendly version of the abandoned cart email
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

exports.handler = async function(event) {
  // Get the to_email from query or environment for manual test
  const to_email = (event.queryStringParameters && event.queryStringParameters.to_email) || process.env.ORDER_BCC_EMAIL;
  if (!to_email) {
    return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Missing to_email' }) };
  }
  
  // Check if a specific product ID was provided
  const product_id = event.queryStringParameters && event.queryStringParameters.product_id;

  let cartProducts = [];
  let attempt = null;
  
  if (product_id) {
    // If a specific product ID was provided, fetch that product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, image_url, price')
      .eq('id', product_id)
      .single();
      
    if (productError || !product) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: `Product with ID ${product_id} not found.` }) };
    }
    
    // Create a synthetic cart with just this product
    cartProducts = [product];
    attempt = {
      guest_session_id: 'manual-trigger',
      cart: [{ id: product.id, quantity: 1 }]
    };
  } else {
    // Find one checkout_attempts row with a non-empty cart (for testing)
    const { data: attempts, error } = await supabase
      .from('checkout_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (Array.isArray(attempts)) {
      attempt = attempts.find(a => Array.isArray(a.cart) && a.cart.length > 0);
    }

    if (!attempt) {
      return { statusCode: 404, body: JSON.stringify({ success: false, error: 'No abandoned checkout attempts found (with non-empty cart).' }) };
    }
    
    // Fetch cart products details from Supabase for accurate image/name/link
    const cartIds = (attempt.cart || []).map(item => item.id);
    if (cartIds.length) {
      const { data: cartDetails } = await supabase
        .from('products')
        .select('id, name, image_url, price')
        .in('id', cartIds);
      cartProducts = cartDetails || [];
    }
  }

  // Construct cart page link
  const checkoutUrl = `https://rarecollectables.co.uk/checkout?session=${attempt.guest_session_id}`;
  const cartUrl = `https://rarecollectables.co.uk/cart?session=${attempt.guest_session_id}`;

  // Create a simple, inbox-friendly HTML email with minimal formatting and links
  const html = `
  <div style="font-family:Arial,sans-serif; color:#333;">
    <p>Hi there,</p>
    
    <p>I noticed you left some items in your cart on our site. I wanted to check if you had any questions I could help with?</p>
    
    <p>I saw you were interested in ${cartProducts.length > 0 ? cartProducts[0].name : 'our products'}. Is there anything specific you'd like to know about it?</p>
    
    <p>If you'd like to continue where you left off, your items are still saved.</p>
    
    <p>Thanks,<br>
    Sarah<br>
    Rare Collectables</p>
  </div>
  `;

  // Create plain text version - more conversational and personal
  const text = `Hi there,

I noticed you left some items in your cart on our site. I wanted to check if you had any questions I could help with?

I saw you were interested in ${cartProducts.length > 0 ? cartProducts[0].name : 'our products'}. Is there anything specific you'd like to know about it?

If you'd like to continue where you left off, your items are still saved.

Thanks,
Sarah
Rare Collectables`;

  await sgMail.send({
    to: to_email,
    from: {
      email: 'carecentre@rarecollectables.co.uk',  // Use the verified email address
      name: 'Sarah Wilson'  // Keep the personal full name
    },
    subject: 'Quick question about your cart',  // More conversational subject line
    text,
    html,
    // Add custom headers to improve deliverability
    headers: {
      'Priority': 'High',
      'Importance': 'High'
    },
    // Add category for better tracking in SendGrid
    category: ['cart-recovery', 'personal-outreach']
  });

  return { statusCode: 200, body: JSON.stringify({ success: true, message: `Sent inbox-friendly cart email to ${to_email}` }) };
};
