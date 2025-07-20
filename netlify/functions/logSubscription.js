const { createClient } = require('@supabase/supabase-js');

// Environment variables for Supabase URL and Key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { email } = data;
    const ip_address = event.headers['x-forwarded-for'] || event.headers['client-ip'] || null;
    const user_agent = event.headers['user-agent'] || null;

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid email address' })
      };
    }

    const { error } = await supabase.from('subscriptions').insert([
      {
        email,
        ip_address,
        user_agent
      }
    ]);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Send confirmation email using SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const bccEmail = process.env.ORDER_BCC_EMAIL || undefined;
    const logoUrl = 'https://rarecollectables.co.uk/assets/images/rare collectables horizontal logo.png'; // Adjust if needed

    try {
      await sgMail.send({
        to: email,
        from: fromEmail,
        bcc: bccEmail,
        subject: 'Thank you for subscribing to Rare Collectables',
        text: `Thank you for subscribing to Rare Collectables. You will now receive updates and news from us.`,
        html: `<!DOCTYPE html>
<html>
  <body style="background:#faf6e8;margin:0;padding:0;font-family:sans-serif;">
    <table width="100%" bgcolor="#faf6e8" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="100%" style="max-width:480px;background:#fff;border-radius:14px;box-shadow:0 2px 12px #bfa14a22;padding:32px 24px;">
            <tr>
              <td align="center" style="padding-bottom:16px">
                <img src="${logoUrl}" alt="Rare Collectables" style="width:180px;height:auto;margin-bottom:8px;"/>
                <h2 style="color:#bfa14a;margin:0 0 4px 0;font-size:24px;font-weight:700;">Thank you for subscribing!</h2>
              </td>
            </tr>
            <tr>
              <td style="color:#333;font-size:17px;padding-bottom:18px;">
                <p style="margin:0 0 10px 0;">Welcome to <strong>Rare Collectables</strong>!</p>
                <p style="margin:0 0 10px 0;">You will now receive the latest news, updates, and exclusive offers directly to your inbox.</p>
                <p style="margin:0 0 12px 0;">Best regards,<br/>Rare Collectables Team</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:13px;color:#bfa14a;padding-top:12px;">&copy; ${new Date().getFullYear()} Rare Collectables</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
      });
    } catch (mailErr) {
      // Log but don't fail the function
      console.error('SendGrid subscription email error:', mailErr?.response?.body || mailErr.message || mailErr);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
