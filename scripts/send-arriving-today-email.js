// Script to send an "arriving today" order update email
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const sgMail = require('@sendgrid/mail');
const { createClient } = require('@supabase/supabase-js');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Load the order update email template
const templatePath = path.join(__dirname, '../netlify/functions/order-update-email.hbs');
const templateSource = fs.readFileSync(templatePath, 'utf8');

// Get today's date formatted nicely
const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

// Replace the standard message with our "arriving today" message
const modifiedTemplateSource = templateSource.replace(
  "<p>We're excited to let you know your order is on its way!</p>",
  `<p style="font-size:18px;color:#2e7d32;font-weight:bold;margin:15px 0;">
    Good news! Your order is scheduled for delivery TODAY, ${today}.
  </p>
  <p>Keep an eye out for your delivery, and make sure someone is available to receive it.</p>`
);

// Also update the title
const finalTemplateSource = modifiedTemplateSource.replace(
  "<h1>Your order is on the way!</h1>",
  "<h1>Your order is arriving TODAY!</h1>"
);

const orderUpdateTemplate = handlebars.compile(finalTemplateSource);

// Parse command line arguments
const args = process.argv.slice(2);
const recipientEmail = args[0] || 'kolawoleafolabi13@gmail.com';
const orderNumber = args[1] || `ORDER-${new Date().toISOString().split('T')[0]}`;
const productIds = args.slice(2).length > 0 ? args.slice(2) : ['20075497-1112-400f-8238-565f62cbd724'];

console.log(`Using product IDs: ${productIds.join(', ')}`);

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

// Example shipping address - this would typically come from an order in the database
const shippingAddressInfo = {
  name: 'Tom Marriott',
  line1: '51 budding way',
  city: 'Dursley',
  postcode: 'GL11 5BE'
};

// Format shipping address for email template
const shippingAddress = `
  ${shippingAddressInfo.name}<br/>
  ${shippingAddressInfo.line1}<br/>
  ${shippingAddressInfo.city}<br/>
  ${shippingAddressInfo.postcode}
`;

// Tracking information
const trackingInfo = {
  trackingCode: 'C00HHA0578057750',
  trackingUrl: 'https://www.evri.com/track/parcel/C00HHA0578057750/details'
};

async function sendArrivingTodayEmail() {
  console.log('Sending "arriving today" email to:', recipientEmail);
  
  try {
    // Fetch ordered products
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .in('id', productIds);
    
    if (error) throw error;
    if (!products || products.length === 0) {
      throw new Error(`No products found with IDs: ${productIds.join(', ')}`);
    }
    
    // Format items for email template
    const items = products.map(product => ({
      name: product.name,
      quantity: 1,
      price: parseFloat((product.price || '').replace(/[^\d.]/g, '')) || 0,
      image: product.image_url
    }));
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Fetch related products (exclude ordered)
    const { data: allProducts, error: relatedError } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .not('id', 'in', '(' + productIds.map(id => `'${id}'`).join(',') + ')');
    
    // Format related products
    const relatedProducts = (!relatedError && allProducts && allProducts.length > 0)
      ? allProducts.sort(() => 0.5 - Math.random())
        .slice(0, 4)
        .map(product => ({
          name: product.name,
          image: product.image_url,
          url: `https://rarecollectables.co.uk/product/${product.id}` + 
               (product.id.toString().includes('?') ? '&' : '?') + 
               'utm_source=email&utm_medium=order-update&utm_campaign=related-product',
          price: product.price
            ? parseFloat((product.price + '').replace(/[^\d.]/g, '')).toFixed(2)
            : null
        }))
      : [];
    
    // Prepare template data
    const templateData = {
      customerName: shippingAddressInfo.name,
      orderNumber: orderNumber,
      items: items,
      total: total.toFixed(2),
      trackingCode: trackingInfo.trackingCode,
      trackingUrl: trackingInfo.trackingUrl,
      shippingAddress: shippingAddress,
      relatedProducts: relatedProducts,
      year: new Date().getFullYear()
      // We've already injected the special message directly into the template
    };
    
    // Generate HTML from template
    const html = orderUpdateTemplate(templateData);
    
    // Prepare text version
    const text = `Hi ${shippingAddressInfo.name},\n\nGood news! Your order #${orderNumber} is scheduled for delivery TODAY, ${today}.\n\nTracking Code: ${trackingInfo.trackingCode}\nTracking URL: ${trackingInfo.trackingUrl}\n\nThank you for shopping with Rare Collectables!`;
    
    // Send the email using SendGrid directly
    await sgMail.send({
      to: recipientEmail,
      bcc: process.env.ORDER_BCC_EMAIL ? [process.env.ORDER_BCC_EMAIL] : undefined,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@rarecollectables.com',
        name: 'Rare Collectables'
      },
      replyTo: 'rarecollectablessales@gmail.com',
      subject: 'Your Order is Arriving TODAY! 📦 - Rare Collectables',
      text,
      html
    });
    
    console.log(`Email sent with ${items.length} products:`);
    items.forEach(item => console.log(` - ${item.name}: £${item.price.toFixed(2)}`));
    
    console.log('✅ "Arriving today" email sent successfully!');
  } catch (error) {
    console.error('❌ Error sending email:', error);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
  }
}

// Run the function
sendArrivingTodayEmail();
