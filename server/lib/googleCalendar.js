// ============================================================
// Reads busy date ranges from your public Google Calendar.
// This is the "manual calendar" — to block dates, just create an
// event on this calendar (all-day events work best) from Google
// Calendar's normal app on your phone or laptop. No admin panel needed.
//
// Requires the calendar's sharing settings to be set to public:
//   Google Calendar (desktop) -> Settings -> [your calendar] ->
//   "Access permissions" -> check "Make available to public".
//   ("See only free/busy" is enough — you don't need to share event details.)
// ============================================================

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'crystalspringsvilla@gmail.com';
const ICS_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

// Very small ICS parser — just enough to pull VEVENT DTSTART/DTEND (date or datetime).
function parseICS(text) {
  const events = [];
  const lines = text.split(/\r\n|\n|\r/);
  // unfold folded lines (lines starting with a space continue the previous line)
  const unfolded = [];
  for (const line of lines) {
    if (line.startsWith(' ') && unfolded.length) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  let current = null;
  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
    } else if (line === 'END:VEVENT') {
      if (current && current.start && current.end) events.push(current);
      current = null;
    } else if (current) {
      const [rawKey, ...rest] = line.split(':');
      const value = rest.join(':');
      const key = rawKey.split(';')[0];
      if (key === 'DTSTART') current.start = parseICSDate(value);
      if (key === 'DTEND') current.end = parseICSDate(value);
      if (key === 'SUMMARY') current.summary = value;
    }
  }
  return events;
}

function parseICSDate(value) {
  // All-day: YYYYMMDD. Timed: YYYYMMDDTHHMMSSZ
  const v = value.trim();
  if (/^\d{8}$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  }
  if (/^\d{8}T\d{6}Z?$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  }
  return null;
}

/**
 * Fetches the calendar and returns [{start:'YYYY-MM-DD', end:'YYYY-MM-DD', summary}]
 * end is exclusive, matching Google's all-day event convention (and our own blocked-date convention).
 * Returns [] (not a throw) on any failure, so a calendar hiccup never takes the whole
 * booking flow down — worst case, a manually-blocked date might briefly stay bookable.
 */
async function getBusyRanges() {
  try {
    const res = await fetch(ICS_URL, { headers: { 'User-Agent': 'CrystalSpringsVilla-Availability/1.0' } });
    if (!res.ok) {
      console.error(`[googleCalendar] fetch failed: ${res.status} ${res.statusText}. Is the calendar set to public?`);
      return [];
    }
    const text = await res.text();
    const events = parseICS(text);
    return events
      .filter(e => e.start && e.end)
      .map(e => {
        let { start, end } = e;
        // A timed event that starts and ends on the same day (e.g. a 1-hour
        // slot) would otherwise produce a zero-length range that blocks
        // nothing. Treat any event touching a day as blocking that whole day.
        if (start === end) {
          const d = new Date(start + 'T00:00:00Z');
          d.setUTCDate(d.getUTCDate() + 1);
          end = d.toISOString().slice(0, 10);
        }
        return { start, end, summary: e.summary || 'Blocked', source: 'google' };
      });
  } catch (err) {
    console.error('[googleCalendar] error fetching/parsing calendar:', err.message);
    return [];
  }
}

module.exports = { getBusyRanges, ICS_URL };

/**
 * Optionally creates an all-day blocking event on the configured calendar.
 * Expects environment variable `GOOGLE_SERVICE_ACCOUNT_JSON` to contain the
 * service account JSON (stringified) with access to the calendar, and
 * `GOOGLE_CALENDAR_ID` to target the calendar.
 * Returns { ok: true, event } on success, or { ok: false, error } on failure.
 */
async function createBlockingEvent({ startDate, endDate, summary }) {
  const svcJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!svcJson || !calendarId) {
    return { ok: false, error: 'Google Calendar service account or calendar ID not configured.' };
  }

  try {
    const { google } = require('googleapis');
    const key = typeof svcJson === 'string' ? JSON.parse(svcJson) : svcJson;
    const jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/calendar']
    );
    await jwtClient.authorize();
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    const event = {
      summary: summary || 'Booked — Crystal Springs Villa',
      start: { date: startDate },
      end: { date: endDate },
      transparency: 'opaque',
      description: 'Blocked by booking from the website (paid).',
    };

    const res = await calendar.events.insert({ calendarId, requestBody: event });
    return { ok: true, event: res.data };
  } catch (err) {
    console.error('[googleCalendar] could not create event:', err.message || err);
    return { ok: false, error: err.message || String(err) };
  }
}

module.exports = { getBusyRanges, ICS_URL, createBlockingEvent };
