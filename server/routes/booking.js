const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { computeQuote } = require('../lib/pricing');
const { isRangeAvailable } = require('../lib/availability');
const { createOrder, verifyPaymentSignature } = require('../lib/razorpay');

function validateDates(checkin, checkout) {
  const today = new Date().toISOString().slice(0, 10);
  if (!checkin || !checkout) throw new Error('Check-in and check-out dates are required.');
  if (checkin < today) throw new Error('Check-in date is in the past.');
  if (checkout <= checkin) throw new Error('Check-out must be after check-in.');
}

// POST /api/booking/quote — live price preview, also confirms the dates are free
router.post('/quote', async (req, res) => {
  try {
    const { checkin, checkout, guests, wantFood, bbqKg } = req.body;
    validateDates(checkin, checkout);

    const quote = computeQuote({ checkin, checkout, guests, wantFood, bbqKg });
    const available = await isRangeAvailable(checkin, checkout);

    res.json({ ...quote, available });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/booking/create-order — creates a pending booking row + a Razorpay order
router.post('/create-order', async (req, res) => {
  try {
    const { checkin, checkout, guests, wantFood, bbqKg, name, phone, email, notes } = req.body;
    validateDates(checkin, checkout);
    if (!name || !phone) throw new Error('Name and phone are required.');

    const available = await isRangeAvailable(checkin, checkout);
    if (!available) {
      return res.status(409).json({ error: 'Sorry, those dates just became unavailable. Please pick different dates.' });
    }

    const quote = computeQuote({ checkin, checkout, guests, wantFood, bbqKg });

    const { data: booking, error: insertErr } = await supabase
      .from('bookings')
      .insert({
        guest_name: name,
        phone,
        email: email || null,
        checkin,
        checkout,
        guests: quote.guests,
        want_food: !!wantFood,
        bbq_kg: quote.bbqKg,
        notes: notes || null,
        nights: quote.nights,
        base_amount: quote.baseAmount,
        extra_guest_amount: quote.extraGuestAmount,
        food_amount: quote.foodAmount,
        bbq_amount: quote.bbqAmount,
        total_amount: quote.totalAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    const order = await createOrder({
      amountInRupees: quote.totalAmount,
      receipt: `booking_${booking.id}`,
      notes: { booking_id: booking.id, guest_name: name, checkin, checkout },
    });

    await supabase.from('bookings').update({ razorpay_order_id: order.id }).eq('id', booking.id);

    res.json({
      bookingId: booking.id,
      orderId: order.id,
      amount: order.amount, // paise
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // public key, safe to send to the browser
      quote,
    });
  } catch (err) {
    console.error('[POST /api/booking/create-order]', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/booking/verify — called by the browser after Razorpay Checkout succeeds
router.post('/verify', async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing payment verification fields.');
    }

    const valid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) return res.status(400).json({ error: 'Payment signature could not be verified.' });

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status: 'paid', razorpay_payment_id })
      .eq('id', bookingId)
      .eq('razorpay_order_id', razorpay_order_id)
      .select()
      .single();

    if (error || !booking) throw new Error('Booking not found for this payment.');

    res.json({ success: true, booking });
  } catch (err) {
    console.error('[POST /api/booking/verify]', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
