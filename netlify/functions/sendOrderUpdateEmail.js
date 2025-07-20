const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// DEBUG: Log contents of function directory
try {
  console.log('Function directory contents:', fs.readdirSync(__dirname));
} catch (e) {
  console.log('Could not read function directory:', e.message);
}


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Load and compile the email template once
const templateSource = fs.readFileSync(path.join(__dirname, 'order-update-email.hbs'), 'utf8');
const orderUpdateTemplate = handlebars.compile(templateSource);

/**
 * Send an order update email with tracking and related products
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {Object} params.order - Order object with all details
 * @param {string} params.trackingCode - Tracking code for the order
 * @param {string} params.trackingUrl - Tracking URL for the order
 * @param {Array} params.relatedProducts - Array of related product objects { name, image, url }
 */
async function sendOrderUpdateEmail({ to, order, trackingCode, trackingUrl, relatedProducts }) {
  if (!to) throw new Error('Recipient email required');
  if (!order) throw new Error('Order details required');

  const orderData = {
    customerName: order.customerName || order.name || order.shipping_address?.name || 'Customer',
    orderNumber: order.id || order.orderNumber || order.payment_intent_id || 'N/A',
    items: (order.items || order.products || []).map(item => ({
      name: item.name || item.title,
      quantity: item.quantity,
      price: (typeof item.price === 'number' ? item.price : parseFloat(item.price || '0')).toFixed(2)
    })),
    total: (typeof order.total === 'number' ? order.total : parseFloat(order.total || order.amount || '0')).toFixed(2),
    trackingCode: trackingCode || order.trackingCode || '',
    trackingUrl: trackingUrl || order.trackingUrl || '',
    shippingAddress: order.shipping_address
      ? `${order.shipping_address.name || ''}<br>${order.shipping_address.line1 || ''}<br>${order.shipping_address.city || ''}${order.shipping_address.postcode ? ', ' + order.shipping_address.postcode : ''}`
      : '',
    relatedProducts: relatedProducts || [],
    year: new Date().getFullYear()
  };

  const html = orderUpdateTemplate(orderData);

  // Optionally: generate a plain-text version
  const text = `Hi ${orderData.customerName},\n\nYour order #${orderData.orderNumber} is on its way!\nTracking code: ${orderData.trackingCode}\nTrack your order: ${orderData.trackingUrl}\n\nThank you for shopping with Rare Collectables!`;

  const msg = {
    to,
    bcc: process.env.ORDER_BCC_EMAIL ? [process.env.ORDER_BCC_EMAIL] : undefined,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@rarecollectables.com',
      name: 'Rare Collectables'
    },
    replyTo: 'rarecollectablessales@gmail.com',
    subject: 'Your Order Update from Rare Collectables',
    text,
    html
  };
  return sgMail.send(msg);
}

module.exports = sendOrderUpdateEmail;
