// ============================================================
// Pricing — the ONLY place nightly rates live. The frontend shows
// a preview using the same numbers, but the amount actually charged
// is always recomputed here, server-side, so nothing can be tampered
// with from the browser.
// ============================================================

const RATES = {
  // 0 = Sunday ... 6 = Saturday (JS Date.getUTCDay())
  0: 10500, // Sunday
  1: 7500,  // Monday
  2: 7500,  // Tuesday
  3: 7500,  // Wednesday
  4: 7500,  // Thursday
  5: 21500, // Friday
  6: 21500, // Saturday
};

const BASE_GUESTS = 6;
const EXTRA_GUEST_PER_NIGHT = 1180;
const FOOD_PER_PERSON_PER_DAY = 1200;
const BBQ_PER_KG = 1200;

function toUTCDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${dateStr}`);
  return d;
}

function nightsBetween(checkin, checkout) {
  const a = toUTCDate(checkin);
  const b = toUTCDate(checkout);
  const diff = Math.round((b - a) / 86400000);
  return diff;
}

// Returns an array of {date, rate} for each night of the stay (checkin inclusive, checkout exclusive)
function nightlyBreakdown(checkin, checkout) {
  const nights = nightsBetween(checkin, checkout);
  if (nights <= 0) throw new Error('Check-out must be after check-in');
  const out = [];
  let cursor = toUTCDate(checkin);
  for (let i = 0; i < nights; i++) {
    const day = cursor.getUTCDay();
    out.push({ date: cursor.toISOString().slice(0, 10), rate: RATES[day] });
    cursor = new Date(cursor.getTime() + 86400000);
  }
  return out;
}

/**
 * Computes a full, authoritative quote.
 * @param {object} params
 * @param {string} params.checkin  'YYYY-MM-DD'
 * @param {string} params.checkout 'YYYY-MM-DD'
 * @param {number} params.guests   total guests (adults), default 6
 * @param {boolean} params.wantFood
 * @param {number} params.bbqKg
 */
function computeQuote({ checkin, checkout, guests = BASE_GUESTS, wantFood = false, bbqKg = 0 }) {
  const nights = nightsBetween(checkin, checkout);
  if (nights <= 0) throw new Error('Check-out must be after check-in');
  if (nights > 30) throw new Error('Stays longer than 30 nights should be booked directly — please contact us.');

  const guestCount = Math.max(1, Math.min(30, Number(guests) || BASE_GUESTS));
  const bbq = Math.max(0, Number(bbqKg) || 0);

  const nightly = nightlyBreakdown(checkin, checkout);
  const baseAmount = nightly.reduce((sum, n) => sum + n.rate, 0);

  const extraGuests = Math.max(0, guestCount - BASE_GUESTS);
  const extraGuestAmount = extraGuests * EXTRA_GUEST_PER_NIGHT * nights;

  const foodAmount = wantFood ? guestCount * FOOD_PER_PERSON_PER_DAY * nights : 0;
  const bbqAmount = bbq * BBQ_PER_KG;

  const totalAmount = baseAmount + extraGuestAmount + foodAmount + bbqAmount;

  return {
    nights,
    guests: guestCount,
    nightly,
    baseAmount,
    extraGuests,
    extraGuestAmount,
    wantFood,
    foodAmount,
    bbqKg: bbq,
    bbqAmount,
    totalAmount,
  };
}

module.exports = {
  RATES,
  BASE_GUESTS,
  EXTRA_GUEST_PER_NIGHT,
  FOOD_PER_PERSON_PER_DAY,
  BBQ_PER_KG,
  nightsBetween,
  nightlyBreakdown,
  computeQuote,
};
