const express = require('express');
const router = express.Router();
const { getBlockedRanges } = require('../lib/availability');

// GET /api/availability -> { blocked: [{start, end, reason, source}] }
router.get('/', async (req, res) => {
  try {
    const blocked = await getBlockedRanges();
    res.json({ blocked });
  } catch (err) {
    console.error('[GET /api/availability]', err);
    res.status(500).json({ error: 'Could not load availability right now.' });
  }
});

module.exports = router;
