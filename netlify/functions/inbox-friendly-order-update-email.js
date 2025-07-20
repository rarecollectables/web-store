const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Load and compile the inbox-friendly email template
const templateSource = fs.readFileSync(path.join(__dirname, 'inbox-friendly-order-update.hbs'), 'utf8');
const inboxFriendlyTemplate = handlebars.compile(templateSource);

/**
 * Send an inbox-friendly order update email
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {Object} params.order - Order object with all details
 * @param {string} params.trackingCode - Tracking code for the order
 * @param {string} params.trackingUrl - Tracking URL for the order
 */
async function sendInboxFriendlyOrderUpdateEmail({ to, order, trackingCode, trackingUrl }) {
  if (!to) throw new Error('Recipient email required');
  if (!order) throw new Error('Order details required');

  const orderData = {
    customerName: order.customerName || order.name || order.shipping_address?.name || 'Customer',
    orderNumber: order.id || order.orderNumber || order.payment_intent_id || 'N/A',
    trackingCode: trackingCode || order.trackingCode || '',
    trackingUrl: trackingUrl || order.trackingUrl || '',
    year: new Date().getFullYear()
  };

  const html = inboxFriendlyTemplate(orderData);

  // Generate a plain-text version
  const text = `Hi ${orderData.customerName},\n\nI wanted to let you know that your order #${orderData.orderNumber} is on its way to you now.\n\nYou can track your package with this tracking number: ${orderData.trackingCode}\n\nIf you have any questions about your order or need any help, please don't hesitate to reply to this email directly.\n\nThanks for shopping with us!\n\nBest regards,\nSarah\nRare Collectables`;

  const msg = {
    to,
    bcc: process.env.ORDER_BCC_EMAIL ? [process.env.ORDER_BCC_EMAIL] : undefined,
    from: {
      email: 'carecentre@rarecollectables.co.uk',
      name: 'Sarah Wilson'
    },
    subject: 'Quick update about your order',
    text,
    html
  };
  return sgMail.send(msg);
}

module.exports = sendInboxFriendlyOrderUpdateEmail;
