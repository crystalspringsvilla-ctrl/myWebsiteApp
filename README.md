# Crystal Springs Villa — website & brochure

Files: `index.html`, `styles.css`, `script.js` (the website — no build step, just open or host), `brochure.pdf` (a 5-page printable/shareable brochure), `brochure.html` (its source, in case you want to edit and regenerate it), and `/images` (your photos).

## Photos

Your photos are in `/images`, renamed by what they show: `exterior-wide.jpg`, `exterior-day.jpg`, `pool-day.jpg`, `pool-evening.jpg`, `pool-waterfall.jpg`, `bedroom-1.jpg`, `bedroom-2.jpg`, `bathroom.jpg`, `living-dining.jpg`, `outdoor-dining.jpg`, `garden.jpg`. They're already in use across the hero, story section, room cards, gallery (with a click-to-enlarge lightbox), and the brochure.

If you want to swap any of these for a different shot or add more:
- Drop new images into `/images`.
- For the **website gallery**, edit the `PHOTOS` array near the top of `script.js`.
- For the **hero/story photos**, edit the `src="images/..."` paths directly in `index.html`.
- For the **brochure**, edit the `src="images/..."` paths in `brochure.html`, then regenerate the PDF (see below).

## Before you launch, still worth checking

1. **Phone / WhatsApp number** — currently set to +91 88796 47109 in both `script.js` (`whatsappNumber`) and the booking section / footer of `index.html`. Update in both places if it changes.
2. **Address** — footer of `index.html` and the brochure's contact block use a placeholder address (Varai Road, near Lakhan Phata, Karjat) — confirm or correct this.
3. **Reviews** — the three testimonials on the site are still placeholders. Swap in real guest quotes once you have permission to publish them.
4. **Map** — add a Google Maps "Embed a map" `<iframe>` to the footer if you'd like one.

## Regenerating the brochure PDF

The brochure is plain HTML/CSS (`brochure.html`) converted to PDF with `wkhtmltopdf`. After editing `brochure.html`:
```
wkhtmltopdf --enable-local-file-access brochure.html brochure.pdf
```
(Any HTML-to-PDF tool works if you don't have wkhtmltopdf — Chrome's "Print to PDF" on this file will also give a close result.)

## How booking, calendar & payment work now

- **Availability calendar**: the booking section shows a real calendar. Blocked dates come from your Google Calendar (`crystalspringsvilla@gmail.com`) plus any confirmed/in-progress bookings — see `server/README.md` for the one-time setup.
- **Online payment**: guests can pick dates, see a live price (computed server-side, so it can't be tampered with), and pay directly via Razorpay Checkout. Full setup is in `server/README.md` — you'll need to deploy the `server/` folder (to Render, using Supabase as the database) and then set `apiBase` in `script.js` to your deployed backend's URL.
- **Until the backend is deployed**: `apiBase` in `script.js` is left blank on purpose, so the site keeps working exactly as before — the calendar just shows everything as open, the "Pay & confirm" button stays disabled, and guests can still request a booking via the WhatsApp button, which always works with zero backend.
- **Floating WhatsApp button** opens a chat with a pre-filled greeting, and the **FAQ chat widget** (bottom-right) answers common questions by keyword-matching a list in `script.js` (`const FAQ = [...]`), handing off to WhatsApp for anything else. Both work with zero backend.

## If you want to go further later

- **A smarter AI chatbot**: swap the keyword-matching `matchAnswer()` function in `script.js` for calls to a real AI backend (for example, the Anthropic API) so it can answer anything about the villa, not just the FAQ list.
- **WhatsApp Business API**: for automated replies (not just click-to-chat), you'd register for the WhatsApp Business Platform, which is a separate setup from this website.
- **An admin dashboard**: right now "manual blocking" just means creating events on your Google Calendar, and you'll see bookings by checking the `bookings` table in Supabase directly. A proper admin page (list bookings, mark refunds, etc.) is a natural next step if you outgrow that.

I'm happy to help build any of the above when you're ready — just tell me which one.


