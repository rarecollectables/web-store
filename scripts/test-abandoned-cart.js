// Simple test script for abandoned cart email functionality
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const sgMail = require('@sendgrid/mail');

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Logo URL for emails
const LOGO_URL = 'https://fhybeyomiivepmlrampr.supabase.co/storage/v1/object/public/utils//rare-collectables-horizontal-logo.png';

// Use actual checkout attempt data from the database
const checkoutAttemptId = '686fac9a-aa1f-4a3f-bc80-e81bfd9610c4';

// Test email for receiving the abandoned cart email
const testEmail = 'jenny.sands@outlook.com';

// Variables to store data from the database
let testCart = [];
let testSessionId = '';

/**
 * Generates HTML for abandoned cart email
 */
async function generateAbandonedCartEmailHtml(cart, guestSessionId) {
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
}

/**
 * Fetch checkout attempt data from the database
 */
async function fetchCheckoutAttemptData() {
  console.log(`Fetching checkout attempt data for ID: ${checkoutAttemptId}...`);
  
  try {
    const { data, error } = await supabase
      .from('checkout_attempts')
      .select('*')
      .eq('id', checkoutAttemptId)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error(`No checkout attempt found with ID: ${checkoutAttemptId}`);
    
    console.log('✅ Checkout attempt data retrieved successfully');
    
    // Extract the cart and session ID
    testCart = data.cart || [];
    testSessionId = data.guest_session_id;
    
    console.log(`Found ${testCart.length} items in cart`);
    console.log(`Using guest session ID: ${testSessionId}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching checkout attempt data:', error);
    process.exit(1);
  }
}

/**
 * Send an abandoned cart email directly
 */
async function sendAbandonedCartEmail() {
  console.log('Testing abandoned cart email functionality...');
  console.log(`Using test email: ${testEmail}`);
  
  try {
    // First fetch the checkout attempt data
    await fetchCheckoutAttemptData();
    
    // Generate the email HTML
    console.log('Generating email HTML...');
    const html = await generateAbandonedCartEmailHtml(testCart, testSessionId);
    
    console.log('Sending email...');
    // Send the email
    await sgMail.send({
      to: testEmail,
      cc: 'rarecollectablessales@gmail.com',
      from: 'carecentre@rarecollectables.co.uk',
      subject: 'You left something in your cart! 🛒',
      html
    });
    
    console.log('✅ Abandoned cart email sent successfully!');
    console.log(`   To: ${testEmail}`);
    console.log(`   CC: rarecollectablessales@gmail.com`);
  } catch (error) {
    console.error('❌ Error sending abandoned cart email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
  }
}

// Run the test
sendAbandonedCartEmail();
