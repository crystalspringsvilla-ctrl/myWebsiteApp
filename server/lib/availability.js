const supabase = require('./supabase');
const { getBusyRanges } = require('./googleCalendar');
const { nightsBetween } = require('./pricing');
const { HOLD_MINUTES } = require('./config');

/**
 * Returns all currently-blocked date ranges, merged from:
 *  - paid bookings (always blocked)
 *  - pending bookings created within the last HOLD_MINUTES (temporary hold during checkout)
 *  - your Google Calendar (manual blocks)
 * Each range is {start, end, reason, source} with end EXCLUSIVE (a checkout date is bookable
 * as someone else's checkin date).
 */
async function getBlockedRanges() {
  const holdCutoff = new Date(Date.now() - HOLD_MINUTES * 60000).toISOString();

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('checkin, checkout, status, created_at')
    .in('status', ['paid', 'pending']);

  if (error) {
    console.error('[availability] supabase error:', error.message);
  }

  const bookingRanges = (bookings || [])
    .filter(b => b.status === 'paid' || (b.status === 'pending' && b.created_at >= holdCutoff))
    .map(b => ({ start: b.checkin, end: b.checkout, reason: 'Booked', source: 'booking' }));

  const calendarRanges = await getBusyRanges();

  return [...bookingRanges, ...calendarRanges];
}

/**
 * True if [checkin, checkout) overlaps any blocked range.
 */
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

async function isRangeAvailable(checkin, checkout) {
  if (nightsBetween(checkin, checkout) <= 0) return false;
  const blocked = await getBlockedRanges();
  return !blocked.some(r => rangesOverlap(checkin, checkout, r.start, r.end));
}

module.exports = { getBlockedRanges, isRangeAvailable, rangesOverlap, HOLD_MINUTES };
