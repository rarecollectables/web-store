const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY ? '[SET]' : '[MISSING]');
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    let coupon;
    try {
      const body = JSON.parse(event.body);
      coupon = body.coupon;
    } catch (_parseErr) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body. Must be JSON with a coupon property.' }),
      };
    }
    if (!coupon) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Coupon code is required.' }),
      };
    }

    // Find the promotion code in Stripe
    const promoCodes = await stripe.promotionCodes.list({
      code: coupon,
      active: true,
      limit: 1
    });
    console.log('Stripe promoCodes API result:', JSON.stringify(promoCodes));

    if (!promoCodes.data.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid or expired coupon code.' }) };
    }

    // Attach the promotion code to the PaymentIntent
    // Note: Stripe API does not allow direct attachment of a promotion code to a PaymentIntent.
    // Instead, you must create a Customer and Invoice, or use the promotion code when creating a Checkout Session.
    // For direct card payments, you can only apply a coupon via a Subscription or Invoice.
    // So, as a workaround, you may need to apply the discount logic manually on the frontend.

    // Return the promotion code details to the frontend so it can apply the discount
    const promo = promoCodes.data[0];
    let discount = null;
    if (promo.coupon.percent_off) {
      discount = { type: 'percent', value: promo.coupon.percent_off };
    } else if (promo.coupon.amount_off) {
      discount = { type: 'amount', value: promo.coupon.amount_off / 100, currency: promo.coupon.currency };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ valid: true, discount, promo }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
