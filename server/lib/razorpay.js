const Razorpay = require('razorpay');
const crypto = require('crypto');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('[razorpay] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set yet — payments will fail until they are.');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Creates a Razorpay order. Amount must be in paise (INR * 100).
 */
async function createOrder({ amountInRupees, receipt, notes }) {
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: 'INR',
    receipt,
    notes,
  });
}

/**
 * Verifies the signature Razorpay Checkout returns to the browser after payment.
 * This MUST pass before you treat a booking as paid.
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

/**
 * Verifies an incoming webhook's signature (uses the separate Webhook Secret
 * you set when creating the webhook in the Razorpay dashboard).
 */
function verifyWebhookSignature({ rawBody, signature }) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

module.exports = { razorpay, createOrder, verifyPaymentSignature, verifyWebhookSignature };
