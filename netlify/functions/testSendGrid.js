const sendConfirmationEmail = require('./sendConfirmationEmail');

exports.handler = async (event) => {
  // Hardcoded test order and recipient
  const testEmail = 'kolamegagreen@gmail.com';
  const testOrder = {
    payment_intent_id: 'test_123',
    amount: 12345,
    currency: 'gbp',
    status: 'succeeded',
    contact_email: testEmail,
    shipping_address: {
      line1: '123 Test Street',
      city: 'London',
      country: 'GB',
    },
    created_at: new Date().toISOString(),
  };

  try {
    console.log('[SENDGRID TEST] Attempting to send test confirmation email', { to: testEmail, order: testOrder });
    const emailResult = await sendConfirmationEmail({ to: testEmail, order: testOrder });
    console.log('[SENDGRID TEST] Email send result:', emailResult);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result: emailResult })
    };
  } catch (err) {
    console.error('[SENDGRID TEST] Failed to send test email:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
