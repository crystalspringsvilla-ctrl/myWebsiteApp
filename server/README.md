# Crystal Springs Villa — booking backend

This is the small server that makes the website's calendar real and lets guests pay online: it checks your Google Calendar + past bookings for availability, computes prices (server-side, so nothing can be tampered with from the browser), creates Razorpay orders, and verifies payments.

## 1. Set up Supabase (the database)

1. Go to [supabase.com](https://supabase.com) → New project (free tier is enough to start).
2. Once it's created: **SQL Editor** → New query → paste the contents of `schema.sql` → **Run**.
3. **Project Settings → API** → copy:
   - `Project URL` → this is `SUPABASE_URL`
   - `service_role` key (NOT the `anon` key — the service_role key bypasses row-level security so the backend can read/write bookings) → this is `SUPABASE_SERVICE_KEY`

## 2. Make your Google Calendar public (read-only, free/busy)

Your calendar (`crystalspringsvilla@gmail.com`) needs to allow anyone to see when it's busy, so the backend can read it without you setting up Google login/OAuth:

1. Open Google Calendar on desktop → hover your calendar in the left sidebar → **⋮ → Settings and sharing**.
2. Under **Access permissions** → check **"Make available to public"**. Choosing "See only free/busy" is enough — no one can see your event titles or details, just that a date is blocked.
3. To block dates going forward, just create an event on this calendar (an **all-day** event works best) for the dates the villa isn't available — that's it, no separate admin panel needed.

You can sanity-check this worked by opening this URL directly in a browser — it should download/show a calendar file, not an error:
`https://calendar.google.com/calendar/ical/crystalspringsvilla%40gmail.com/public/basic.ics`

## 3. Set up Razorpay

1. You already have a Razorpay account — go to **Dashboard → Settings → API Keys**.
2. **Important**: if you ever pasted your key_secret somewhere insecure (chat, email, etc.), regenerate it here first.
3. **Dashboard → Settings → Webhooks → Add New Webhook**:
   - URL: `https://YOUR-RENDER-URL.onrender.com/api/webhooks/razorpay` (you'll get the real URL after step 4)
   - Active events: check `payment.captured` and `payment.failed`
   - Save, then copy the **Webhook Secret** it shows you — this is different from your API key secret.

## 4. Deploy the backend on Render

1. Push this `server/` folder to a GitHub repo (Render deploys from a repo — a zip upload isn't supported).
2. On [render.com](https://render.com) → **New → Web Service** → connect that repo.
3. Settings:
   - Root directory: `server` (if the repo contains more than just this folder)
   - Build command: `npm install`
   - Start command: `npm start`
   - Instance type: Free is fine to start
4. **Environment** tab → add each variable from `.env.example` with your real values:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
   - `GOOGLE_CALENDAR_ID` (defaults to crystalspringsvilla@gmail.com if you skip it)
   - `ALLOWED_ORIGINS` — your real site domain once you know it (comma-separated if more than one); `*` is fine while testing
5. Deploy. Render gives you a URL like `https://crystal-springs-villa-api.onrender.com`.
6. Go back to Razorpay's webhook settings and paste the real URL in (step 3).

**Note on the free tier:** Render's free web services "sleep" after 15 minutes of no traffic, and take ~30–60 seconds to wake up on the next request. For a low-traffic villa site this is usually fine (a guest's first calendar load might take a few extra seconds), but if it bothers you, Render's cheapest paid tier ($7/mo) keeps it always-on.

## 5. Connect the frontend

In `script.js`, set:
```js
apiBase: "https://crystal-springs-villa-api.onrender.com"
```
(use your actual Render URL). Until this is set, the website keeps working fine on the WhatsApp-only flow — the calendar just won't show real blocked dates and the "Pay & confirm" button stays disabled.

## How it all fits together

- **Calendar**: `GET /api/availability` merges (a) paid/pending bookings from Supabase and (b) your Google Calendar's busy dates, and the frontend greys those out.
- **Pricing**: always computed server-side (`lib/pricing.js`) from the same rate table as the website — a guest can't alter the amount from the browser.
- **Payment**: `POST /api/booking/create-order` creates a pending booking + a Razorpay order; Razorpay Checkout opens in the browser; on success, `POST /api/booking/verify` checks the cryptographic signature before marking the booking "paid". The webhook is a backup in case the guest closes the browser right after paying.
- **Manual blocking**: just use your Google Calendar like normal — any event blocks those dates on the site within a few hours (Google's public feed isn't instant, typically updates within a few hours).

## Testing before going fully live

Razorpay has a **Test Mode** with its own test API keys (Dashboard → toggle Test/Live in the top bar) and test card numbers, so you can run through a full booking without moving real money. Worth doing once before switching the Render env vars to your live keys.
