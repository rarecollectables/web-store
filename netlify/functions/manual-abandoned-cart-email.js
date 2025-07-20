// netlify/functions/manual-abandoned-cart-email.js
// Run manually to send a test abandoned cart email to a chosen address
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const LOGO_URL = 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//rare-collectables-horizontal-logo.png'; // Make sure this is the correct public URL

exports.handler = async function(event) {
  // Get the to_email from query or environment for manual test
  const to_email = (event.queryStringParameters && event.queryStringParameters.to_email) || process.env.ORDER_BCC_EMAIL;
  if (!to_email) {
    return { statusCode: 400, body: 'Missing to_email' };
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
      return { statusCode: 404, body: `Product with ID ${product_id} not found.` };
    }
    
    // Create a synthetic cart with just this product
    cartProducts = [product];
    attempt = {
      guest_session_id: 'manual-trigger',
      cart: [{ id: product.id, quantity: 1 }]
    };
  } else {
    // Find one checkout_attempts row with a non-empty cart (for testing)
    // Find the most recent checkout_attempts row with a non-empty cart
    const { data: attempts, error } = await supabase
      .from('checkout_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (Array.isArray(attempts)) {
      attempt = attempts.find(a => Array.isArray(a.cart) && a.cart.length > 0);
    }

    if (!attempt) {
      return { statusCode: 404, body: 'No abandoned checkout attempts found (with non-empty cart).' };
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
  // Render cart items as featured
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
  const productIds = cartProducts.map(product => product.id);
  const { data: related } = await supabase
    .from('products')
    .select('id, name, image_url, price')
    .not('id', 'in', `(${productIds.join(',')})`)
    .not('image_url', 'is', null)
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

  // Construct cart page link
  const checkoutUrl = `https://rarecollectables.co.uk/cart?session=${attempt.guest_session_id}`;

  const html = `
  <div style="background:#f4f6fb;padding:0;margin:0;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;background:#fff;margin:44px auto 0 auto;border-radius:20px;box-shadow:0 8px 36px #e5e5e5;overflow:hidden;">
      <div style="background:#fff;padding:44px 44px 28px 44px;text-align:center;border-bottom:1px solid #eee6dc;">
        <img src="${LOGO_URL}" alt="Rare Collectables" style="width:210px;max-width:90%;margin-bottom:24px;" />
        <h2 style="color:#bfa054;font-size:29px;margin:0 0 6px 0;letter-spacing:0.5px;font-family:'Georgia',serif;">Did you forget something?</h2>
        <p style="color:#222;font-size:19px;margin:0 0 20px 0;">You left these item(s) in your cart:</p>
        <table width="100%" style="border:none;border-collapse:collapse;margin:0 auto 24px auto;"><tr>${cartHtml}</tr></table>
        <a href="https://rarecollectables.co.uk/checkout?session=${attempt.guest_session_id}" style="display:inline-block;background:#bfa054;color:#fff;text-decoration:none;font-size:18px;padding:15px 38px;border-radius:9px;font-weight:700;box-shadow:0 2px 8px #e7e7e7;margin-bottom:18px;transition:background 0.2s;">Resume your order</a>
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

  await sgMail.send({
    to: to_email,
    cc: 'rarecollectablesshop@gmail.com',
    from: 'carecentre@rarecollectables.co.uk',
    subject: 'You left something in your cart! 🛒',
    html
  });

  return { statusCode: 200, body: `Sent abandoned cart email to ${to_email} with CC to rarecollectablesshop@gmail.com` };
};
