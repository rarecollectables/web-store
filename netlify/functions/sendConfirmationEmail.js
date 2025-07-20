const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// HTTP handler for Netlify Functions
exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { to, order } = JSON.parse(event.body);
    
    // Validate required fields
    if (!to || !order) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to and order' }),
      };
    }
    
    // Send the email
    await sendConfirmationEmail({ to, order });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Confirmation email sent successfully' }),
    };
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send confirmation email' }),
    };
  }
};

async function sendConfirmationEmail({ to, order, relatedProducts = [] }) {
  console.log('[EMAIL DEBUG] Starting sendConfirmationEmail function with:', { to, order: JSON.stringify(order) });
  
  if (!to) throw new Error('Recipient email required');
  if (!process.env.SENDGRID_API_KEY) {
    console.error('[EMAIL DEBUG] Missing SENDGRID_API_KEY environment variable');
    throw new Error('SendGrid API key is missing');
  }
  
  const msg = {
    to,
    bcc: ['carecentre@rarecollectables.co.uk', 'rarecollectablesshop@gmail.com', ...(process.env.ORDER_BCC_EMAIL ? [process.env.ORDER_BCC_EMAIL] : [])],
    from: {
      email: process.env.SENDGRID_FROM_EMAIL || 'no-reply@rarecollectables.com',
      name: 'Rare Collectables'
    },
    replyTo: 'rarecollectablessales@gmail.com',
    subject: 'Order Confirmation - Rare Collectables',
    text: `Thank you for your purchase!

Order Details:
Order Number: ${order.order_number || 'N/A'}
Amount: £${(order.amount/100).toFixed(2)}
Quantity: ${order.quantity || 1}
Date: ${(order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : new Date().toLocaleString('en-GB'))}
${order.shipping_address ? `Shipping Address: ${order.shipping_address.line1}, ${order.shipping_address.city}, ${order.shipping_address.postcode || ''}` : ''}

We will keep you updated with your order status. If you have any questions, our concierge team is here to help.

Best regards,
Rare Collectables Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border-radius: 10px; border: 1px solid #eee; box-shadow: 0 2px 10px #eee; overflow: hidden;">
        <div style="background: #BFA054; color: #fff; padding: 18px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">Rare Collectables</h1>
        </div>
        <div style="padding: 24px 24px 12px 24px; background: #fff;">
          <h2 style="color: #38a169; margin-top: 0;">Thank you for your purchase!</h2>
          <p style="font-size: 17px; color: #333;">Your order has been received and is now being processed. We will keep you updated with your order status. If you have any questions, our <a href="mailto:rarecollectablessales@gmail.com" style="color: #BFA054; text-decoration: underline;">concierge team</a> is here to help.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 18px 0;" />
          <h3 style="color: #BFA054;">Order Summary</h3>
          <div style="text-align: center; margin-bottom: 16px;">
            <img src="${order.product_image || 'https://rarecollectables.co.uk/default-product-image.jpg'}" alt="Product Image" style="max-width: 180px; max-height: 180px; object-fit: contain; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 2px 8px #eee; margin-bottom: 8px;" />
          </div>
          <table style="width: 100%; font-size: 16px; margin-bottom: 12px;">
            <tr>
              <td style="font-weight: bold;">Order Number:</td>
              <td>${order.order_number || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Amount:</td>
              <td>£${(order.amount/100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Quantity:</td>
              <td>${order.quantity || 1}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Date:</td>
              <td>${order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : new Date().toLocaleString('en-GB')}</td>
            </tr>
            ${order.shipping_address ? `
            <tr>
              <td style="font-weight: bold;">Shipping Address:</td>
              <td>${order.shipping_address.line1}, ${order.shipping_address.city}${order.shipping_address.postcode ? ', ' + order.shipping_address.postcode : ''}</td>
            </tr>` : ''}
          </table>

          <!-- Related Products Section -->
          ${relatedProducts.length > 0 ? `
          <div style="margin-top: 32px;">
            <h3 style="color: #BFA054; text-align: center; font-size: 21px; margin-bottom: 18px; letter-spacing: 0.5px;">You May Also Like</h3>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 18px;">
              ${relatedProducts.map(product => `
                <div style="background: #faf7f2; border-radius: 12px; border: 1px solid #eee; width: 180px; box-shadow: 0 2px 8px #eee; text-align: center; padding: 18px 12px 16px 12px; transition: box-shadow 0.2s;">
                  <a href="${product.url}" style="text-decoration: none; color: inherit;">
                    <img src="${product.image}" alt="${product.name}" style="width: 120px; height: 120px; object-fit: contain; border-radius: 8px; border: 1px solid #e5e5e5; margin-bottom: 10px; background: #fff;" />
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px; color: #222;">${product.name}</div>
                    <div style="font-size: 15px; color: #BFA054; margin-bottom: 12px;">£${parseFloat(product.price).toFixed(2)}</div>
                    <div>
                      <span style="display: inline-block; background: #BFA054; color: #fff; font-weight: 600; padding: 8px 18px; border-radius: 6px; font-size: 15px; text-decoration: none; box-shadow: 0 1px 4px #e5e5e5;">Shop Now</span>
                    </div>
                  </a>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div style="margin-top: 18px; font-size: 15px; color: #444;">
            If you have any questions or need assistance, simply reply to this email or contact our concierge team.
          </div>
          <div style="margin-top: 30px; color: #888; font-size: 13px; text-align: center;">
            &copy; ${new Date().getFullYear()} Rare Collectables. All rights reserved.
          </div>
        </div>
      </div>
    `
  };
  try {
    console.log('[EMAIL DEBUG] Attempting to send email with payload:', {
      to: msg.to,
      from: msg.from.email,
      subject: msg.subject,
      bcc: msg.bcc
    });
    
    const result = await sgMail.send(msg);
    console.log('[EMAIL DEBUG] Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('[EMAIL DEBUG] SendGrid error:', error.toString());
    if (error.response) {
      console.error('[EMAIL DEBUG] SendGrid error details:', {
        body: error.response.body,
        statusCode: error.response.statusCode
      });
    }
    throw error;
  }
}

module.exports = sendConfirmationEmail;
