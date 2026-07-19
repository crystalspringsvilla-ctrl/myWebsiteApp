const nodemailer = require('nodemailer');
const twilio = require('twilio');

function formatMoney(value) {
  if (value == null) return '₹0';
  const amount = Number(value);
  return '₹' + amount.toLocaleString('en-IN');
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function normalizePhoneNumber(phone) {
  if (!phone) return null;
  const digits = phone.toString().replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length > 10 && digits[0] !== '0') return `+${digits}`;
  if (digits.length > 10 && digits[0] === '0') return `+${digits.slice(1)}`;
  return null;
}

function buildReceiptBody(booking) {
  const couponCode = booking.coupon_code || 'None';
  const amount = booking.total_amount ?? booking.amount ?? 0;
  const textBody = [
    'Crystal Springs Villa booking receipt',
    '',
    `Guest name: ${booking.guest_name || '—'}`,
    `Phone: ${booking.phone || '—'}`,
    `Email: ${booking.email || '—'}`,
    `Check-in: ${formatDate(booking.checkin)}`,
    `Check-out: ${formatDate(booking.checkout)}`,
    `Guests: ${booking.guests ?? '—'}`,
    `Food package: ${booking.want_food ? 'Yes' : 'No'}`,
    `BBQ: ${booking.bbq_kg ?? 0} kg`,
    `Coupon: ${couponCode}`,
    `Total paid: ${formatMoney(amount)}`,
    `Razorpay order: ${booking.razorpay_order_id || '—'}`,
    `Razorpay payment: ${booking.razorpay_payment_id || '—'}`,
    '',
    'Thank you for booking Crystal Springs Villa.',
  ].join('\n');

  return {
    html: `
      <div style="font-family:Arial,sans-serif;color:#222;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#2f4a3b;">Crystal Springs Villa</h2>
        <p style="margin:.2rem 0 1rem;">Thank you for your booking. Here are the details:</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px;">
          <tr><td style="padding:.5rem 0;font-weight:600;">Guest name</td><td style="padding:.5rem 0;">${booking.guest_name || '—'}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Phone</td><td style="padding:.5rem 0;">${booking.phone || '—'}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Email</td><td style="padding:.5rem 0;">${booking.email || '—'}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Check-in</td><td style="padding:.5rem 0;">${formatDate(booking.checkin)}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Check-out</td><td style="padding:.5rem 0;">${formatDate(booking.checkout)}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Guests</td><td style="padding:.5rem 0;">${booking.guests ?? '—'}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Food package</td><td style="padding:.5rem 0;">${booking.want_food ? 'Yes' : 'No'}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">BBQ</td><td style="padding:.5rem 0;">${booking.bbq_kg ?? 0} kg</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Coupon</td><td style="padding:.5rem 0;">${couponCode}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Booking status</td><td style="padding:.5rem 0;">${booking.status || 'Paid'}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Total paid</td><td style="padding:.5rem 0;">${formatMoney(amount)}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Razorpay order</td><td style="padding:.5rem 0;">${booking.razorpay_order_id || '—'}</td></tr>
          <tr><td style="padding:.5rem 0;font-weight:600;">Razorpay payment</td><td style="padding:.5rem 0;">${booking.razorpay_payment_id || '—'}</td></tr>
        </table>
        <p style="margin-top:1.5rem;font-size:14px;color:#555;">If you need help, reply to this email or message us on WhatsApp at +91 85919 97793.</p>
      </div>
    `,
    text: textBody,
  };
}

async function sendEmailReceipt(booking) {
  if (!booking.email) return { ok: false, error: 'No customer email provided.' };
  const host = process.env.EMAIL_SMTP_HOST;
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;
  const from = process.env.EMAIL_FROM;
  const port = Number(process.env.EMAIL_SMTP_PORT || 587);
  const secure = process.env.EMAIL_SMTP_SECURE === 'true';
  if (!host || !from || !user || !pass) {
    return { ok: false, error: 'Email settings not configured.' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const content = buildReceiptBody(booking);
  await transporter.sendMail({
    from,
    to: booking.email,
    subject: 'Crystal Springs Villa booking receipt',
    text: content.text,
    html: content.html,
  });
  return { ok: true };
}

async function sendWhatsAppReceipt(booking) {
  if (!booking.phone) return { ok: false, error: 'No customer phone provided.' };
  const accountSid = process.env.WHATSAPP_TWILIO_ACCOUNT_SID;
  const authToken = process.env.WHATSAPP_TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.WHATSAPP_TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: 'WhatsApp/Twilio settings not configured.' };
  }

  const normalized = normalizePhoneNumber(booking.phone);
  if (!normalized) return { ok: false, error: 'Invalid customer phone number.' };

  const client = twilio(accountSid, authToken);
  const message = `Crystal Springs Villa booking confirmation:\n` +
    `Guest: ${booking.guest_name || 'Guest'}\n` +
    `Check-in: ${formatDate(booking.checkin)}\n` +
    `Check-out: ${formatDate(booking.checkout)}\n` +
    `Total: ${formatMoney(booking.total_amount ?? booking.amount ?? 0)}\n` +
    `Order ID: ${booking.razorpay_order_id || '—'}\n` +
    `Payment ID: ${booking.razorpay_payment_id || '—'}\n` +
    `Thank you for booking Crystal Springs Villa.`;

  await client.messages.create({
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${normalized}`,
    body: message,
  });
  return { ok: true };
}

async function sendBookingReceiptNotifications(booking) {
  const results = {};
  try {
    results.email = await sendEmailReceipt(booking);
  } catch (err) {
    results.email = { ok: false, error: err.message || String(err) };
  }
  try {
    results.whatsapp = await sendWhatsAppReceipt(booking);
  } catch (err) {
    results.whatsapp = { ok: false, error: err.message || String(err) };
  }
  return results;
}

module.exports = { sendBookingReceiptNotifications, formatMoney, buildReceiptBody };
