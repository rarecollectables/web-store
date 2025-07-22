require('dotenv').config({ path: '../../.env' });

// preview-abandoned-cart-email.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const LOGO_URL = 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//rare-collectables-horizontal-logo.png';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const guestSessionId = process.argv[2] || '';
  if (!guestSessionId) {
    // No session provided: print available guest_session_ids
    const { data: attempts, error } = await supabase
      .from('checkout_attempts')
      .select('guest_session_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !attempts || attempts.length === 0) {
      console.error('No checkout sessions found.');
      process.exit(1);
    }
    console.log('Available guest_session_id values:');
    attempts.forEach(attempt => {
      console.log(`- ${attempt.guest_session_id} (created: ${attempt.created_at})`);
    });
    console.log('\nUsage: node preview-abandoned-cart-email.js <guest_session_id>');
    process.exit(0);
  }

  // Fetch up to 5 most recent checkout_attempts for this guest_session_id
  const { data: attempts, error: attemptError } = await supabase
    .from('checkout_attempts')
    .select('*')
    .eq('guest_session_id', guestSessionId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (attemptError || !attempts || attempts.length === 0) {
    console.error('No checkout attempt found for guest_session_id:', guestSessionId);
    process.exit(1);
  }

  // Find the first attempt with a non-empty cart
  let attempt = null;
  let cartIds = [];
  for (const att of attempts) {
    try {
      cartIds = Array.isArray(att.cart)
        ? att.cart.map(item => item.id)
        : (att.cart ? Object.keys(att.cart) : []);
    } catch (e) {
      cartIds = [];
    }
    if (cartIds.length) {
      attempt = att;
      break;
    }
  }

  if (!attempt) {
    console.error('No non-empty cart found for this session.');
    process.exit(1);
  }

  // Fetch cart products
  const { data: cartProducts, error: cartError } = await supabase
    .from('products')
    .select('id, name, image_url, price')
    .in('id', cartIds);

  if (cartError || !cartProducts || !cartProducts.length) {
    console.error('Could not fetch cart products.');
    process.exit(1);
  }

  // Fetch related products (not in cart, must have image_url)
  const { data: related } = await supabase
    .from('products')
    .select('id, name, image_url, price')
    .not('id', 'in', `(${cartIds.join(',')})`)
    .not('image_url', 'is', null)
    .order('RANDOM()', { ascending: true })
    .limit(3);

  // Render cart
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

  // Render related
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
    relatedHtml = `<table width="100%" style="border:none;border-collapse:collapse;margin:0 auto 10px auto;"><tr>${relatedHtml}</tr></table>`;
  } else {
    relatedHtml = `<div style="color:#999;text-align:center;font-size:15px;padding:18px 0;">No related products to show at this time.</div>`;
  }

  // Construct cart page link
  const checkoutUrl = `https://rarecollectables.co.uk/cart?session=${guestSessionId}`;

  const html = `
  <div style="background:#f4f6fb;padding:0;margin:0;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;background:#fff;margin:44px auto 0 auto;border-radius:20px;box-shadow:0 8px 36px #e5e5e5;overflow:hidden;">
      <div style="background:#fff;padding:44px 44px 28px 44px;text-align:center;border-bottom:1px solid #eee6dc;">
        <img src="${LOGO_URL}" alt="Rare Collectables" style="width:210px;max-width:90%;margin-bottom:24px;" />
        <h2 style="color:#bfa054;font-size:29px;margin:0 0 6px 0;letter-spacing:0.5px;">Did you forget something?</h2>
        <p style="color:#222;font-size:19px;margin:0 0 20px 0;">You left these item(s) in your cart:</p>
        <table width="100%" style="border:none;border-collapse:collapse;margin:0 auto 24px auto;"><tr>${cartHtml}</tr></table>
        <a href="${checkoutUrl}" style="display:inline-block;background:#bfa054;color:#fff;text-decoration:none;font-size:18px;padding:15px 38px;border-radius:9px;font-weight:700;box-shadow:0 2px 8px #e7e7e7;margin-bottom:18px;transition:background 0.2s;">Resume your order</a>
        <p style="font-size:15px;color:#666;margin:18px 0 0 0;">If you have any questions, just reply to this email!</p>
      </div>
      <div style=\"padding:36px 44px 22px 44px;background:#f7f5f1;\">
        <h3 style=\"font-size:20px;color:#bfa054;margin:0 0 20px 0;text-align:center;\">You may also like</h3>
        ${relatedHtml}
      </div>
      <div style=\"background:#fff;text-align:center;padding:22px 0 16px 0;font-size:13px;color:#bfa054;letter-spacing:1px;\">&copy; ${new Date().getFullYear()} Rare Collectables</div>
    </div>
  </div>
  `;

  fs.writeFileSync('abandoned-cart-preview.html', html, 'utf8');
  console.log('Preview written to abandoned-cart-preview.html. Open this file in your browser!');
}

main();
