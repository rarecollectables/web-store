// netlify/functions/check-abandoned-carts.js
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY // use service role key for full access
);

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Logo URL for emails
const LOGO_URL = 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//rare-collectables-horizontal-logo.png';

/**
 * Generates HTML for abandoned cart email
 */
const generateAbandonedCartEmailHtml = async (cart, guestSessionId) => {
  // Fetch cart products details from Supabase for accurate image/name/link
  const cartIds = (cart || []).map(item => item.id);
  let cartProducts = [];
  
  if (cartIds.length) {
    const { data: cartDetails } = await supabase
      .from('products')
      .select('id, name, image_url, price')
      .in('id', cartIds);
    cartProducts = cartDetails || [];
  }
  
  // Render cart items
  const cartHtml = cartProducts.map(prod => `
    <td style="padding:0 14px 22px 0;text-align:center;vertical-align:top;min-width:150px;">
      <a href="https://rarecollectables.co.uk/product/${prod.id}" style="display:inline-block;width:100%;text-decoration:none;color:#222;">
        <div style="background:#fff;border:1px solid #ece7df;border-radius:14px;box-shadow:0 3px 14px #ececec;padding:18px 12px 14px 12px;transition:box-shadow 0.2s;">
          <img src="${prod.image_url || 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils/no-image.png'}" alt="${prod.name || 'Product'}" style="width:120px;height:120px;object-fit:cover;border-radius:9px;border:1.5px solid #f1e9d8;box-shadow:0 1.5px 7px #eee;display:block;margin:0 auto 12px;" />
          <div style="font-size:16px;font-weight:600;line-height:1.3;max-width:120px;margin:0 auto 4px;">${prod.name || 'Product'}</div>
          ${prod.price ? `<div style=\"font-size:15px;color:#bfa054;font-weight:700;margin-top:2px;\">${/^[£$€]/.test(prod.price) ? prod.price : '£' + prod.price}</div>` : ''}
        </div>
      </a>
    </td>
  `).join('');

  // Fetch 3 related products (not in cart, must have image_url)
  const { data: related } = await supabase
    .from('products')
    .select('id, name, image_url, price')
    .not('id', 'in', `(${cartIds.join(',')})`) // Exclude cart items
    .not('image_url', 'is', null) // Must have image
    .order('RANDOM()', { ascending: true })
    .limit(3);

  let relatedHtml = '';
  if (related && related.length > 0) {
    relatedHtml = related.map(prod => `
      <td style="padding:0 14px 22px 0;text-align:center;vertical-align:top;min-width:150px;">
        <a href="https://rarecollectables.co.uk/product/${prod.id}" style="display:inline-block;width:100%;text-decoration:none;color:#222;">
          <div style="background:#fff;border:1px solid #ece7df;border-radius:14px;box-shadow:0 3px 14px #ececec;padding:18px 12px 14px 12px;transition:box-shadow 0.2s;">
            <img src="${prod.image_url || 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils/no-image.png'}" alt="${prod.name || 'Product'}" style="width:120px;height:120px;object-fit:cover;border-radius:9px;border:1.5px solid #f1e9d8;box-shadow:0 1.5px 7px #eee;display:block;margin:0 auto 12px;" />
            <div style="font-size:15px;font-weight:500;line-height:1.3;max-width:120px;margin:0 auto 4px;">${prod.name}</div>
            ${prod.price ? `<div style=\"font-size:14px;color:#bfa054;font-weight:700;margin-top:2px;\">${/^[£$€]/.test(prod.price) ? prod.price : '£' + prod.price}</div>` : ''}
          </div>
        </a>
      </td>
    `).join('');
    relatedHtml = `<table width=\"100%\" style=\"border:none;border-collapse:collapse;margin:0 auto 10px auto;\"><tr>${relatedHtml}</tr></table>`;
  } else {
    relatedHtml = `<div style=\"color:#999;text-align:center;font-size:15px;padding:18px 0;\">No related products to show at this time.</div>`;
  }

  // Construct cart page link with session ID
  const checkoutUrl = `https://rarecollectables.co.uk/checkout?session=${guestSessionId}`;

  return `
  <div style="background:#f4f6fb;padding:0;margin:0;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;background:#fff;margin:44px auto 0 auto;border-radius:20px;box-shadow:0 8px 36px #e5e5e5;overflow:hidden;">
      <div style="background:#fff;padding:44px 44px 28px 44px;text-align:center;border-bottom:1px solid #eee6dc;">
        <img src="${LOGO_URL}" alt="Rare Collectables" style="width:210px;max-width:90%;margin-bottom:24px;" />
        <h2 style="color:#bfa054;font-size:29px;margin:0 0 6px 0;letter-spacing:0.5px;font-family:'Georgia',serif;">Did you forget something?</h2>
        <p style="color:#222;font-size:19px;margin:0 0 20px 0;">You left these item(s) in your cart:</p>
        <table width="100%" style="border:none;border-collapse:collapse;margin:0 auto 24px auto;"><tr>${cartHtml}</tr></table>
        <a href="${checkoutUrl}" style="display:inline-block;background:#bfa054;color:#fff;text-decoration:none;font-size:18px;padding:15px 38px;border-radius:9px;font-weight:700;box-shadow:0 2px 8px #e7e7e7;margin-bottom:18px;transition:background 0.2s;">Resume your order</a>
        <p style="font-size:15px;color:#666;margin:18px 0 0 0;">If you have any questions, just reply to this email!</p>
      </div>
      <div style="padding:36px 44px 22px 44px;background:#f7f5f1;">
        <h3 style="font-size:20px;color:#bfa054;margin:0 0 20px 0;text-align:center;font-family:'Georgia',serif;">You may also like</h3>
        ${relatedHtml}
      </div>
      <div style="background:#fff;text-align:center;padding:22px 0 16px 0;font-size:13px;color:#bfa054;letter-spacing:1px;">&copy; ${new Date().getFullYear()} Rare Collectables</div>
    </div>
  </div>
  `;
};

/**
 * Sends an abandoned cart email
 */
const sendAbandonedCartEmail = async (email, cart, guestSessionId) => {
  try {
    // Generate the email HTML
    const html = await generateAbandonedCartEmailHtml(cart, guestSessionId);
    
    // Send the email
    await sgMail.send({
      to: email,
      from: 'carecentre@rarecollectables.co.uk',
      subject: 'You left something in your cart! 🛒',
      html
    });
    
    // Mark the checkout attempt as emailed
    await supabase
      .from('checkout_attempts')
      .update({ 
        abandoned_cart_email_sent: true,
        abandoned_cart_email_sent_at: new Date().toISOString()
      })
      .eq('guest_session_id', guestSessionId);
    
    console.log(`Abandoned cart email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending abandoned cart email:', error);
    return false;
  }
};

exports.handler = async (event) => {
  try {
    // Calculate the timestamp for 5 minutes ago
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    const fiveMinutesAgoISO = fiveMinutesAgo.toISOString();
    
    // Find checkout attempts with valid emails captured more than 5 minutes ago
    // that haven't been completed and haven't been emailed yet
    const { data: abandonedCarts, error } = await supabase
      .from('checkout_attempts')
      .select('*')
      .eq('email_valid', true)
      .lt('email_captured_at', fiveMinutesAgoISO) // Email captured more than 5 minutes ago
      .is('abandoned_cart_email_sent', null) // Email not sent yet
      .limit(10); // Process in batches
    
    if (error) {
      console.error('Error fetching abandoned carts:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
    
    if (!abandonedCarts || abandonedCarts.length === 0) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ message: 'No abandoned carts to process' })
      };
    }
    
    console.log(`Found ${abandonedCarts.length} abandoned carts to process`);
    
    // Process each abandoned cart
    const results = [];
    for (const cart of abandonedCarts) {
      // Check if the user has completed an order since abandoning the cart
      const { data: completedOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('email', cart.email)
        .gt('created_at', cart.email_captured_at) // Order created after email was captured
        .limit(1);
      
      // If no completed orders found, send the abandoned cart email
      if (!completedOrders || completedOrders.length === 0) {
        const sent = await sendAbandonedCartEmail(cart.email, cart.cart, cart.guest_session_id);
        results.push({ 
          guest_session_id: cart.guest_session_id, 
          email: cart.email, 
          sent 
        });
      } else {
        // Mark as processed but not sent (user completed order)
        await supabase
          .from('checkout_attempts')
          .update({ 
            abandoned_cart_email_sent: false,
            order_completed: true
          })
          .eq('guest_session_id', cart.guest_session_id);
        
        results.push({ 
          guest_session_id: cart.guest_session_id, 
          email: cart.email, 
          sent: false, 
          reason: 'Order completed' 
        });
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        processed: results.length,
        results 
      })
    };
  } catch (err) {
    console.error('Error processing abandoned carts:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
