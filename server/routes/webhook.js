const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { verifyWebhookSignature } = require('../lib/razorpay');

// POST /api/webhooks/razorpay
// NOTE: this route needs the RAW request body to verify the signature, which is
// why server.js mounts a raw-body parser just for this one path (see server.js).
router.post('/razorpay', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body; // Buffer, thanks to express.raw() in server.js

    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn('[webhook] RAZORPAY_WEBHOOK_SECRET not set — ignoring webhook. Set this up in the Razorpay dashboard when ready.');
      return res.status(200).send('ok'); // 200 so Razorpay doesn't keep retrying while this is unconfigured
    }

    const valid = verifyWebhookSignature({ rawBody, signature });
    if (!valid) return res.status(400).send('invalid signature');

    const event = JSON.parse(rawBody.toString('utf8'));

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      await supabase
        .from('bookings')
        .update({ status: 'paid', razorpay_payment_id: payment.id })
        .eq('razorpay_order_id', payment.order_id)
        .neq('status', 'paid'); // don't clobber if already marked paid via /verify
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      await supabase
        .from('bookings')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', payment.order_id)
        .eq('status', 'pending');
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('[POST /api/webhooks/razorpay]', err);
    res.status(500).send('error');
  }
});

module.exports = router;
