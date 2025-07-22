require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const sendOrderDeliveredEmail = require('./sendOrderDeliveredEmail');
const { createClient } = require('@supabase/supabase-js');
const config = require('../../config/supabaseConfig');

(async () => {
  // Example product IDs for the delivered order
  const productIds = ['20075497-1112-400f-8238-565f62cbd724'];
  const supabase = createClient(config.url, config.anonKey);

  // Fetch ordered products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price, image_url')
    .in('id', productIds);
  if (error) throw error;

  const items = products.map(product => ({
    name: product.name,
    quantity: 1,
    price: parseFloat((product.price || '').replace(/[^\d.]/g, '')) || 0,
    image: product.image_url
  }));

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Fetch all products except the ordered one
  const { data: allProducts, error: relatedError } = await supabase
    .from('products')
    .select('id, name, price, image_url, category')
    .not('id', 'in', '(' + productIds.map(id => `'${id}'`).join(',') + ')');

  let relatedProducts = [];
  let orderedProductCategory = null;

  // Fetch the ordered product to get its category
  const { data: orderedProductData, error: orderedProductError } = await supabase
    .from('products')
    .select('category')
    .eq('id', productIds[0])
    .single();

  if (!orderedProductError && orderedProductData && orderedProductData.category) {
    orderedProductCategory = orderedProductData.category;
  }

  if (!relatedError && allProducts && allProducts.length > 0) {
    let filtered = allProducts;
    if (orderedProductCategory) {
      filtered = allProducts.filter(product => product.category === orderedProductCategory);
    }
    if (filtered.length === 0) {
      filtered = allProducts;
    }
    relatedProducts = filtered.sort(() => 0.5 - Math.random()).slice(0, 4).map(product => ({
      name: product.name,
      image: product.image_url,
      url: `https://rarecollectables.co.uk/product/${product.id}`,
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
    await sendOrderDeliveredEmail({
      to: 'harrison.robert49@outlook.com', // <-- change to your email for testing
      order: {
        id: 'ORDER45',
        customerName: 'Robert Harrison',
        items,
        total: total.toFixed(2),
        shipping_address
      },
      relatedProducts
    });
    console.log('Order delivered confirmation email sent!');
  } catch (err) {
    console.error('Failed to send delivered email:', err);
  }
})();
