const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Load and compile the inbox-friendly delivery email template
const templateSource = fs.readFileSync(path.join(__dirname, 'inbox-friendly-order-delivered.hbs'), 'utf8');
const inboxFriendlyTemplate = handlebars.compile(templateSource);

/**
 * Send an inbox-friendly order delivered email
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {Object} params.order - Order object with all details
 */
async function sendInboxFriendlyOrderDeliveredEmail({ to, order }) {
  if (!to) throw new Error('Recipient email required');
  if (!order) throw new Error('Order details required');

  // Prepare the HTML using the delivery template
  const orderData = {
    customerName: order.customerName || order.name || order.shipping_address?.name || 'Customer',
    orderNumber: order.id || order.orderNumber || order.payment_intent_id || 'N/A',
    year: new Date().getFullYear()
  };

  const html = inboxFriendlyTemplate(orderData);

  const text = `Hi ${orderData.customerName},\n\nGreat news! Your order #${orderData.orderNumber} has been delivered.\n\nI just wanted to check that everything arrived safely and that you're happy with your items.\n\nIf you have any questions or need any help with your purchase, please reply to this email directly - I'm here to help.\n\nThanks again for your order!\n\nBest regards,\nSarah\nRare Collectables`;

  const msg = {
    to,
    bcc: process.env.ORDER_BCC_EMAIL ? [process.env.ORDER_BCC_EMAIL] : undefined,
    from: {
      email: 'carecentre@rarecollectables.co.uk',
      name: 'Sarah Wilson'
    },
    subject: 'Has your order arrived safely?',
    text,
    html
  };
  return sgMail.send(msg);
}

module.exports = sendInboxFriendlyOrderDeliveredEmail;
