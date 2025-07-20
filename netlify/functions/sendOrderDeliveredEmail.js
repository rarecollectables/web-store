const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Load and compile the delivery email template once
const templateSource = fs.readFileSync(path.join(__dirname, 'order-delivered-email.hbs'), 'utf8');
const orderDeliveredTemplate = handlebars.compile(templateSource);

/**
 * Send an order delivered email
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {Object} params.order - Order object with all details
 * @param {Array} params.relatedProducts - Array of related product objects { name, image, url }
 */
async function sendOrderDeliveredEmail({ to, order, relatedProducts }) {
  if (!to) throw new Error('Recipient email required');
  if (!order) throw new Error('Order details required');

  // Prepare the HTML using the delivery template
  const year = new Date().getFullYear();
  const shippingAddress = `${order.shipping_address?.name || ''}<br>${order.shipping_address?.line1 || ''}<br>${order.shipping_address?.city || ''} ${order.shipping_address?.postcode || ''}`;
  const html = orderDeliveredTemplate({
    customerName: order.customerName || order.name || order.shipping_address?.name || 'Customer',
    orderNumber: order.id || order.orderNumber || order.payment_intent_id || 'N/A',
    items: (order.items || order.products || []).map(item => ({
      name: item.name || item.title,
      quantity: item.quantity,
      price: (typeof item.price === 'number' ? item.price : parseFloat((item.price || '').replace(/[^\d.]/g, ''))).toFixed(2),
      image: item.image
    })),
    total: order.total,
    shippingAddress,
    relatedProducts,
    year
  });

  const text = `Hi ${order.customerName || order.name},\n\nYour order #${order.id || order.orderNumber} has been delivered!\n\nThank you for shopping with Rare Collectables!`;

  const msg = {
    to,
    bcc: process.env.ORDER_BCC_EMAIL ? [process.env.ORDER_BCC_EMAIL] : undefined,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@rarecollectables.com',
      name: 'Rare Collectables'
    },
    subject: 'Your Order Has Been Delivered! - Rare Collectables',
    text,
    html
  };
  return sgMail.send(msg);
}

module.exports = sendOrderDeliveredEmail;
