require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const sendConfirmationEmail = require('./sendConfirmationEmail');
const { createClient } = require('@supabase/supabase-js');
const config = require('../../config/supabaseConfig');

(async () => {
  try {
    const supabase = createClient(config.url, config.anonKey);

    // Fetch product details for '2-earrings'
    const productId = '2-earrings';
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, price, image_url')
      .eq('id', productId)
      .single();
    if (error) throw error;

    // Prepare order data
    const order = {
      amount: parseFloat((product.price || '').replace(/[^\d.]/g, '')) * 100 || 0, // Convert to pence/cents
      quantity: 1,
      created_at: new Date().toISOString(),
      shipping_address: {
        line1: '2 Bent Lea',
        city: 'Huddersfield',
        postcode: 'HD2 1QW'
      },
      product_image: product.image_url
    };

    // Example recipient email
    const to = 'aisha.chowdry@hotmail.co.uk';

    // Send the confirmation email
    await sendConfirmationEmail({ to, order });
    console.log('Confirmation email sent successfully!');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    process.exit(1);
  }
})();
