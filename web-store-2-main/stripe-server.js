require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { cart, customer_email, shipping_address } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const line_items = cart.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: { name: item.title || item.name },
        unit_amount: Math.round((typeof item.price === 'number' ? item.price : parseFloat(item.price)) * 100),
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      customer_email: customer_email || undefined,
      shipping_address_collection: shipping_address ? { allowed_countries: ['GB', 'US', 'CA', 'IE', 'AU', 'FR', 'DE', 'NG'] } : undefined,
      success_url: `${process.env.API_URL || 'http://localhost:3000'}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.API_URL || 'http://localhost:3000'}/cart`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.STRIPE_SERVER_PORT || 4242;
app.listen(PORT, () => {
  console.log(`Stripe server running on port ${PORT}`);
});
