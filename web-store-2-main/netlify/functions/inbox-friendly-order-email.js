// netlify/functions/inbox-friendly-order-email.js
// A more inbox-friendly version of the order emails
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.handler = async function(event) {
  // Get the to_email from query or environment for manual test
  const to_email = (event.queryStringParameters && event.queryStringParameters.to_email) || process.env.ORDER_BCC_EMAIL;
  if (!to_email) {
    return { statusCode: 400, body: 'Missing to_email' };
  }
  
  // Get the email type (update, arriving-today, or delivered)
  const emailType = (event.queryStringParameters && event.queryStringParameters.type) || 'update';
  
  // Get order details from query parameters or use mock data
  const orderNumber = (event.queryStringParameters && event.queryStringParameters.order_number) || 'ORDER-' + Math.floor(Math.random() * 10000);
  const customerName = (event.queryStringParameters && event.queryStringParameters.customer_name) || 'Customer';
  const trackingCode = (event.queryStringParameters && event.queryStringParameters.tracking_code) || 'TRACK-' + Math.floor(Math.random() * 10000);
  
  // Prepare email content based on type
  let subject, htmlContent, textContent;
  
  if (emailType === 'arriving-today') {
    // Order arriving today email
    subject = 'Your order is arriving today';
    
    htmlContent = `
    <div style="font-family:Arial,sans-serif; color:#333;">
      <p>Hi ${customerName},</p>
      
      <p>Just a quick note to let you know that your order #${orderNumber} is scheduled to arrive today!</p>
      
      <p>I wanted to make sure you're aware so you can keep an eye out for the delivery.</p>
      
      <p>If you have any questions or need any help, please reply to this email directly.</p>
      
      <p>Have a great day!</p>
      
      <p>Best regards,<br>
      Sarah<br>
      Rare Collectables</p>
    </div>
    `;
    
    textContent = `Hi ${customerName},

Just a quick note to let you know that your order #${orderNumber} is scheduled to arrive today!

I wanted to make sure you're aware so you can keep an eye out for the delivery.

If you have any questions or need any help, please reply to this email directly.

Have a great day!

Best regards,
Sarah
Rare Collectables`;
  } else if (emailType === 'delivered') {
    // Order delivered email
    subject = 'Has your order arrived safely?';
    
    htmlContent = `
    <div style="font-family:Arial,sans-serif; color:#333;">
      <p>Hi ${customerName},</p>
      
      <p>Great news! Your order #${orderNumber} has been delivered.</p>
      
      <p>I just wanted to check that everything arrived safely and that you're happy with your items.</p>
      
      <p>If you have any questions or need any help with your purchase, please reply to this email directly - I'm here to help.</p>
      
      <p>Thanks again for your order!</p>
      
      <p>Best regards,<br>
      Sarah<br>
      Rare Collectables</p>
    </div>
    `;
    
    textContent = `Hi ${customerName},

Great news! Your order #${orderNumber} has been delivered.

I just wanted to check that everything arrived safely and that you're happy with your items.

If you have any questions or need any help with your purchase, please reply to this email directly - I'm here to help.

Thanks again for your order!

Best regards,
Sarah
Rare Collectables`;
  } else {
    // Order update/shipping email
    subject = 'Quick update about your order';
    
    htmlContent = `
    <div style="font-family:Arial,sans-serif; color:#333;">
      <p>Hi ${customerName},</p>
      
      <p>I wanted to let you know that your order #${orderNumber} is on its way to you now.</p>
      
      <p>You can track your package with this tracking number: <strong>${trackingCode}</strong></p>
      
      <p>If you have any questions about your order or need any help, please don't hesitate to reply to this email directly.</p>
      
      <p>Thanks for shopping with us!</p>
      
      <p>Best regards,<br>
      Sarah<br>
      Rare Collectables</p>
    </div>
    `;
    
    textContent = `Hi ${customerName},

I wanted to let you know that your order #${orderNumber} is on its way to you now.

You can track your package with this tracking number: ${trackingCode}

If you have any questions about your order or need any help, please don't hesitate to reply to this email directly.

Thanks for shopping with us!

Best regards,
Sarah
Rare Collectables`;
  }

  // Send the email using the same configuration that worked for cart emails
  await sgMail.send({
    to: to_email,
    from: {
      email: 'carecentre@rarecollectables.co.uk',
      name: 'Sarah Wilson'
    },
    subject: subject,
    text: textContent,
    html: htmlContent
  });

  return { 
    statusCode: 200, 
    body: JSON.stringify({
      success: true,
      message: `Sent inbox-friendly ${emailType} email to ${to_email}`
    })
  };
};
