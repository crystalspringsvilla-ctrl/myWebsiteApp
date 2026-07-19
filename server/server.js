require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const availabilityRoutes = require('./routes/availability');
const bookingRoutes = require('./routes/booking');
const webhookRoutes = require('./routes/webhook');

const app = express();

// Allow your site's origin(s). Set ALLOWED_ORIGINS as a comma-separated list
// in Render's env vars once you know your site's real domain, e.g.
// "https://crystalspringsvilla.com,https://www.crystalspringsvilla.com"
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: allowedOrigins.includes('*') ? true : allowedOrigins,
}));

// The Razorpay webhook needs the raw body to verify its signature, so it must be
// mounted BEFORE express.json() with its own raw parser, on its own path.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

app.use(express.json());

const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/availability', availabilityRoutes);
app.use('/api/booking', bookingRoutes);

app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Something went wrong.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Crystal Springs Villa backend listening on :${PORT}`));
