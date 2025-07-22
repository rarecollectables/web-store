const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY // use service role key for full access
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);

    // Insert the payload into the contact_form_submissions table
    const { data, error } = await supabase
      .from('contact_form_submissions')
      .insert([payload]);

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Send notification email using SendGrid
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      const fromEmail = process.env.SENDGRID_FROM_EMAIL;
      const { name, email, message } = payload;
      console.log('SENDGRID_FROM_EMAIL:', fromEmail);
      console.log('SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY);
      if (!email) {
        console.error('User email from contact form is missing. Email will not be sent.');
      } else {
        await sgMail.send({
          to: email,
          from: fromEmail || email, // Prefer fromEmail if set
          bcc: process.env.ORDER_BCC_EMAIL || undefined,
          subject: `Thank you for contacting Rare Collectables` ,
          text: `Dear ${name || 'Customer'},\n\nThank you for reaching out to Rare Collectables. We have received your message and will get back to you as soon as possible.\n\nYour message:\n${message}\n\nBest regards,\nRare Collectables Team`,
          html: `<!DOCTYPE html>
          <html>
            <body style="background:#faf6e8;margin:0;padding:0;font-family:sans-serif;">
              <table width="100%" bgcolor="#faf6e8" cellpadding="0" cellspacing="0" style="padding:32px 0;">
                <tr>
                  <td align="center">
                    <table width="100%" style="max-width:480px;background:#fff;border-radius:14px;box-shadow:0 2px 12px #bfa14a22;padding:32px 24px;">
                      <tr>
                        <td align="center" style="padding-bottom:16px">
                          <img src="https://rarecollectables.co.uk/logo-gold.png" alt="Rare Collectables" style="width:88px;height:auto;margin-bottom:8px;"/>
                          <h2 style="color:#bfa14a;margin:0 0 4px 0;font-size:26px;font-weight:700;">Thank you for contacting Rare Collectables</h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="color:#333;font-size:17px;padding-bottom:18px;">
                          <p style="margin:0 0 10px 0;">Dear <strong>${name || 'Customer'}</strong>,</p>
                          <p style="margin:0 0 10px 0;">We have received your message and will get back to you as soon as possible.</p>
                          <div style="background:#faf6e8;border-left:4px solid #bfa14a;padding:14px 18px 12px 18px;border-radius:7px;margin-bottom:16px;">
                            <div style="font-size:15px;color:#bfa14a;font-weight:600;margin-bottom:6px;">Your message:</div>
                            <div style="font-size:16px;color:#444;white-space:pre-line;">${message}</div>
                          </div>
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
      }
    } catch (mailErr) {
      // Log but do not fail the function if email fails
      console.error('SendGrid email error:', mailErr);
      if (mailErr && mailErr.response && mailErr.response.body && mailErr.response.body.errors) {
        console.error('SendGrid error details:', JSON.stringify(mailErr.response.body.errors, null, 2));
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ data }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
