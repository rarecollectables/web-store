// Test script to send an order update email using sendOrderUpdateEmail.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const sendOrderUpdateEmail = require('./sendOrderUpdateEmail');
const { createClient } = require('@supabase/supabase-js');
const config = require('../../config/supabaseConfig');

(async () => {
  // Example product IDs for the order update
  const productIds = ['20075497-1112-400f-8238-565f62cbd724'];
  const supabase = createClient(config.url, config.anonKey);

  // Fetch ordered products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, image_url')
    .in('id', productIds);
  if (error) throw error;

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
  let relatedProducts = [];
  if (!relatedError && allProducts && allProducts.length > 0) {
    // Shuffle and take up to 4 related products
    relatedProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, 4).map(product => ({
      name: product.name,
      image: product.image_url,
      url: `https://rarecollectables.co.uk/product/${product.id}` + (product.id.toString().includes('?') ? '&' : '?') + 'utm_source=email&utm_medium=order-update&utm_campaign=related-product',
      price: product.price
        ? parseFloat((product.price + '').replace(/[^\d.]/g, '')).toFixed(2)
        : null
    }));
  }

  // Example shipping address
  const shipping_address = {
    name: 'Robert Harrison',
    line1: '9a Carr close',
    city: 'Poulton-Le-Fylde', 
    postcode: 'FY6 8HY'
  };

  try {
    await sendOrderUpdateEmail({
      to: 'harrison.robert49@outlook.com', // <-- Change for testing
      order: {
        customerName: 'Robert Harrison',
        id: 'ORDER431',
        items,
        total: total.toFixed(2),
        shipping_address
      },
      trackingCode: 'C00HHA0576245896',
      trackingUrl: 'https://www.evri.com/track/parcel/C00HHA0576245896/details',
      relatedProducts
    });
    console.log('Order update confirmation email sent!');
  } catch (err) {
    console.error('Failed to send order update confirmation email:', err);
  }
})();
