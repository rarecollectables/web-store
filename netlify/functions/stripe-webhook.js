const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const sendConfirmationEmail = require('./sendConfirmationEmail');
const errorHandler = require('./utils/errorHandler');

// Set up Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY // use service role key for full database access
);

exports.handler = async (event) => {
  console.log('[WEBHOOK DEBUG] stripe-webhook triggered', { headers: event.headers, body: event.body });
  // For error context
  const context = { requestId: event.headers['x-request-id'] || undefined };

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    errorHandler.logError(err, { ...context, stage: 'signature_verification' });
    return errorHandler.createErrorResponse(err, context);
  }

  // Only handle payment_intent.succeeded for now
  if (stripeEvent.type === 'payment_intent.succeeded') {
    const paymentIntent = stripeEvent.data.object;
    const metadata = paymentIntent.metadata || {};
    console.log('[WEBHOOK DEBUG] payment_intent metadata:', metadata);
    // Generate a customer-friendly order number if not provided
    const orderDate = new Date();
    const orderNumber = metadata.order_number || 
      `ORD-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderDate.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Format the order data to match the schema used by orderService.js
    let orderData = {
      id: require('uuid').v4(), // Generate UUID for database record
      order_number: orderNumber,
      payment_intent_id: paymentIntent.id,
      customer_email: metadata.contact_email || null,
      customer_name: metadata.customer_name || null,
      customer_phone: metadata.customer_phone || null,
      shipping_address: metadata.shipping_address || null,
      items: metadata.items || null,
      total_amount: paymentIntent.amount,
      discount_amount: metadata.discount_amount ? parseInt(metadata.discount_amount) : 0,
      // Store coupon info in metadata instead of coupon_code field
      metadata: JSON.stringify({
        coupon: metadata.coupon || null,
        discount_details: metadata.discount_amount ? { amount: parseInt(metadata.discount_amount) } : null
      }),
      payment_method: paymentIntent.payment_method_types?.[0] || 'card',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      currency: paymentIntent.currency
    };
    console.log('[WEBHOOK DEBUG] orderData:', orderData);

    try {
      // Insert order into Supabase 'orders' table
      const { data, error } = await supabase
        .from('orders')
        .insert([orderData]);
      if (error) {
        errorHandler.logError(error, { ...context, stage: 'supabase_insert', orderData });
        return errorHandler.createErrorResponse(error, context);
      }
      console.log('Order saved to Supabase:', data);

      // Send confirmation email if customer_email is present
      if (orderData.customer_email) {
        try {
          // Format order data for email template
          const emailOrderData = {
            amount: orderData.total_amount,
            quantity: 1, // Default if not specified
            created_at: orderData.created_at,
            shipping_address: orderData.shipping_address ? 
              (typeof orderData.shipping_address === 'string' ? 
                JSON.parse(orderData.shipping_address) : orderData.shipping_address) : null,
            order_number: orderData.order_number
          };
          
          console.log('[EMAIL DEBUG] Attempting to send confirmation email', {
            to: orderData.customer_email,
            order: emailOrderData
          });
          
          const emailResult = await sendConfirmationEmail({ 
            to: orderData.customer_email, 
            order: emailOrderData 
          });
          
          console.log('[EMAIL DEBUG] Confirmation email send result:', emailResult);
          console.log('Confirmation email sent to', orderData.customer_email);
        } catch (emailErr) {
          console.error('[EMAIL DEBUG] Failed to send confirmation email:', {
            error: emailErr,
            to: orderData.customer_email,
            order: orderData
          });
          errorHandler.logError(emailErr, { ...context, stage: 'send_email', to: orderData.customer_email });
          // Do not fail the webhook for email errors
        }
      }
      // TODO: Add fulfillment trigger here if needed
      // Always return 200 after successful processing so Stripe does not retry
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
      };
    } catch (err) {
      errorHandler.logError(err, { ...context, stage: 'supabase_insert_catch' });
      return errorHandler.createErrorResponse(err, context);
    }
  }
  // Return 200 for all other event types (or you can filter as needed)
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};
