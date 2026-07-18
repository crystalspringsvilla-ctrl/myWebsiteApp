// ============================================================
// CONFIG — replace these with your real details
// ============================================================
const CONFIG = {
  whatsappNumber: "918591997793", // country code + number, no + or spaces
  villaName: "Crystal Springs Villa",
  // Fill this in once your backend is deployed on Render, e.g.
  // "https://crystal-springs-villa-api.onrender.com" — leave blank to keep
  // the site running on the WhatsApp-only flow until then.
  apiBase: ""
};

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Mobile nav ----------
const navToggle = document.getElementById('navToggle');
const navMobile = document.getElementById('navMobile');
navToggle.addEventListener('click', () => {
  const open = navMobile.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navMobile.classList.remove('open');
  navToggle.setAttribute('aria-expanded', false);
}));

// ---------- Scroll cue ----------
document.getElementById('scrollCue').addEventListener('click', () => {
  document.getElementById('story').scrollIntoView({behavior:'smooth'});
});

// ---------- Contour-line hero background (signature element) ----------
(function drawContours(){
  const field = document.getElementById('contourField');
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 1200 800");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.width = "100%";
  svg.style.height = "100%";

  const lines = 9;
  for (let i = 0; i < lines; i++) {
    const baseY = 60 + i * 78;
    const amp = 22 + (i % 3) * 10;
    const freq = 0.006 + (i % 4) * 0.0015;
    let d = `M -20 ${baseY}`;
    for (let x = -20; x <= 1220; x += 20) {
      const y = baseY + Math.sin(x * freq + i) * amp;
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", i % 3 === 0 ? "#8FCFC0" : "#F4F1E8");
    path.setAttribute("stroke-width", "1");
    path.setAttribute("opacity", (0.08 + (i % 3) * 0.03).toFixed(2));
    svg.appendChild(path);
  }
  // the spring: a single glowing point marking the villa
  const dot = document.createElementNS(svgNS, "circle");
  dot.setAttribute("cx", "600"); dot.setAttribute("cy", "400"); dot.setAttribute("r", "4");
  dot.setAttribute("fill", "#8FCFC0");
  svg.appendChild(dot);
  [18, 34, 52].forEach((r, idx) => {
    const ring = document.createElementNS(svgNS, "circle");
    ring.setAttribute("cx", "600"); ring.setAttribute("cy", "400"); ring.setAttribute("r", r);
    ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "#8FCFC0");
    ring.setAttribute("stroke-width", "1"); ring.setAttribute("opacity", (0.35 - idx*0.1).toFixed(2));
    svg.appendChild(ring);
  });
  field.appendChild(svg);
})();

// ---------- Gallery: real photos + lightbox ----------
const PHOTOS = [
  { src: 'images/exterior-wide.jpg', alt: 'Villa exterior with private pool', big: true },
  { src: 'images/pool-evening.jpg', alt: 'Pool lit up in the evening' },
  { src: 'images/pool-day.jpg', alt: 'Poolside loungers during the day' },
  { src: 'images/bedroom-1.jpg', alt: 'Bedroom interior' },
  { src: 'images/outdoor-dining.jpg', alt: 'Open-air dining and gazebo area' },
  { src: 'images/bedroom-2.jpg', alt: 'Second bedroom interior' },
  { src: 'images/living-dining.jpg', alt: 'Indoor living and dining space' },
  { src: 'images/garden.jpg', alt: 'Villa garden and lawn' },
  { src: 'images/bathroom.jpg', alt: 'En suite bathroom' },
  { src: 'images/exterior-day.jpg', alt: 'Villa exterior in daylight' },
  { src: 'images/pool-waterfall.jpg', alt: 'Pool waterfall feature' },
  { src: 'images/extra-01.jpg', alt: 'Crystal Springs Villa' },
  { src: 'images/extra-02.jpg', alt: 'Crystal Springs Villa' },
];

(function buildGallery(){
  const grid = document.getElementById('galleryGrid');
  PHOTOS.forEach((photo, i) => {
    const tile = document.createElement('button');
    tile.className = 'tile' + (photo.big ? ' big' : '');
    tile.setAttribute('aria-label', `Open photo: ${photo.alt}`);
    tile.innerHTML = `<img src="${photo.src}" alt="${photo.alt}" loading="lazy">`;
    tile.addEventListener('click', () => openLightbox(i));
    grid.appendChild(tile);
  });
})();

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
let lightboxIndex = 0;

function openLightbox(i){
  lightboxIndex = i;
  showLightboxPhoto();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
}
function showLightboxPhoto(){
  const p = PHOTOS[lightboxIndex];
  lightboxImg.src = p.src;
  lightboxImg.alt = p.alt;
}
function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
}
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click', () => {
  lightboxIndex = (lightboxIndex - 1 + PHOTOS.length) % PHOTOS.length;
  showLightboxPhoto();
});
document.getElementById('lightboxNext').addEventListener('click', () => {
  lightboxIndex = (lightboxIndex + 1) % PHOTOS.length;
  showLightboxPhoto();
});
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
  if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
});

// ---------- WhatsApp helpers ----------
function waLink(message){
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
const defaultGreeting = `Hi ${CONFIG.villaName}! I'd like to check availability.`;
document.getElementById('heroWhatsapp').href = waLink(defaultGreeting);
document.getElementById('fabWhatsapp').href = waLink(defaultGreeting);

// ============================================================
// AVAILABILITY CALENDAR + LIVE QUOTE + RAZORPAY CHECKOUT
// ============================================================
const RATES_PREVIEW = { 0: 10500, 1: 7500, 2: 7500, 3: 7500, 4: 7500, 5: 21500, 6: 21500 };
const BASE_GUESTS = 6, EXTRA_GUEST_NIGHT = 1180, FOOD_PER_DAY = 1200, BBQ_PER_KG = 1200;

const bookState = {
  blocked: [],          // [{start:'YYYY-MM-DD', end:'YYYY-MM-DD'}]
  viewMonth: new Date(new Date().toISOString().slice(0,7) + '-01T00:00:00'),
  checkin: null,
  checkout: null,
};

function ymd(d){ return d.toISOString().slice(0,10); }
function isBlocked(dateStr){
  return bookState.blocked.some(r => dateStr >= r.start && dateStr < r.end);
}
function anyBlockedBetween(a, b){
  // true if any day in [a, b) is blocked
  let cur = new Date(a + 'T00:00:00Z');
  const end = new Date(b + 'T00:00:00Z');
  while (cur < end) {
    if (isBlocked(ymd(cur))) return true;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return false;
}

async function loadAvailability(){
  if (!CONFIG.apiBase) return; // no backend yet — calendar just shows everything as open
  try {
    const res = await fetch(`${CONFIG.apiBase}/api/availability`);
    const data = await res.json();
    bookState.blocked = data.blocked || [];
  } catch (err) {
    console.warn('Could not load availability', err);
  }
  renderCalendar();
}

function renderCalendar(){
  const grid = document.getElementById('calGrid');
  const label = document.getElementById('calLabel');
  const month = bookState.viewMonth;
  label.textContent = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = ymd(new Date());

  grid.innerHTML = '';
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    grid.appendChild(empty);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    const dateStr = ymd(d);
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.textContent = day;

    const past = dateStr < today;
    const blocked = isBlocked(dateStr);
    const isCheckin = dateStr === bookState.checkin;
    const isCheckout = dateStr === bookState.checkout;
    const inRange = bookState.checkin && bookState.checkout && dateStr > bookState.checkin && dateStr < bookState.checkout;

    if (past || blocked) cell.classList.add(past ? 'past' : 'blocked');
    else cell.classList.add('free');
    if (isCheckin || isCheckout) cell.classList.add('selected');
    if (inRange) cell.classList.add('in-range');

    if (!past && !blocked) {
      cell.addEventListener('click', () => onDayClick(dateStr));
    }
    grid.appendChild(cell);
  }
}

function onDayClick(dateStr){
  const hint = document.getElementById('calHint');
  if (!bookState.checkin || (bookState.checkin && bookState.checkout)) {
    // start a fresh selection
    bookState.checkin = dateStr;
    bookState.checkout = null;
    hint.textContent = 'Now tap your check-out date.';
  } else {
    if (dateStr <= bookState.checkin) {
      bookState.checkin = dateStr;
      bookState.checkout = null;
      hint.textContent = 'Now tap your check-out date.';
    } else if (anyBlockedBetween(bookState.checkin, dateStr)) {
      hint.textContent = 'That range crosses a booked date — pick a shorter stay.';
      bookState.checkin = dateStr;
      bookState.checkout = null;
    } else {
      bookState.checkout = dateStr;
      hint.textContent = 'Tap "Pay & confirm" or send your request on WhatsApp.';
    }
  }
  document.getElementById('checkinInput').value = bookState.checkin || '';
  document.getElementById('checkoutInput').value = bookState.checkout || '';
  renderCalendar();
  updateQuote();
}

document.getElementById('calPrev').addEventListener('click', () => {
  bookState.viewMonth = new Date(bookState.viewMonth.getFullYear(), bookState.viewMonth.getMonth() - 1, 1);
  renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  bookState.viewMonth = new Date(bookState.viewMonth.getFullYear(), bookState.viewMonth.getMonth() + 1, 1);
  renderCalendar();
});

renderCalendar();
loadAvailability();

// ---------- Live quote ----------
function clientQuote({ checkin, checkout, guests, wantFood, bbqKg }){
  const nights = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
  if (nights <= 0) return null;
  let base = 0;
  let cur = new Date(checkin + 'T00:00:00Z');
  for (let i = 0; i < nights; i++) {
    base += RATES_PREVIEW[cur.getUTCDay()];
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  const extraGuests = Math.max(0, guests - BASE_GUESTS);
  const extraAmount = extraGuests * EXTRA_GUEST_NIGHT * nights;
  const foodAmount = wantFood ? guests * FOOD_PER_DAY * nights : 0;
  const bbqAmount = (bbqKg || 0) * BBQ_PER_KG;
  return { nights, base, extraGuests, extraAmount, foodAmount, bbqAmount, total: base + extraAmount + foodAmount + bbqAmount };
}

function money(n){ return '₹' + Number(n).toLocaleString('en-IN'); }

let quoteAbortCtrl = null;
async function updateQuote(){
  const box = document.getElementById('quoteBox');
  const payBtn = document.getElementById('payBtn');
  const checkin = bookState.checkin, checkout = bookState.checkout;
  const guests = Number(document.getElementById('guestsInput').value) || BASE_GUESTS;
  const wantFood = document.getElementById('wantFoodInput').checked;
  const bbqKg = Number(document.getElementById('bbqKgInput').value) || 0;

  if (!checkin || !checkout) {
    box.innerHTML = '<p class="quote-placeholder">Select your dates above to see a price.</p>';
    payBtn.disabled = true;
    return;
  }

  // Try the authoritative server quote (also re-checks availability); fall back to a client estimate.
  let quote = null, available = true, usedServer = false;
  if (CONFIG.apiBase) {
    try {
      if (quoteAbortCtrl) quoteAbortCtrl.abort();
      quoteAbortCtrl = new AbortController();
      const res = await fetch(`${CONFIG.apiBase}/api/booking/quote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin, checkout, guests, wantFood, bbqKg }),
        signal: quoteAbortCtrl.signal,
      });
      const data = await res.json();
      if (res.ok) {
        quote = { nights: data.nights, base: data.baseAmount, extraGuests: data.extraGuests, extraAmount: data.extraGuestAmount, foodAmount: data.foodAmount, bbqAmount: data.bbqAmount, total: data.totalAmount };
        available = data.available;
        usedServer = true;
      }
    } catch (err) { /* fall through to client estimate */ }
  }
  if (!quote) quote = clientQuote({ checkin, checkout, guests, wantFood, bbqKg });
  if (!quote) return;

  box.innerHTML = `
    <div class="quote-row"><span>${quote.nights} night${quote.nights > 1 ? 's' : ''}</span><span>${money(quote.base)}</span></div>
    ${quote.extraGuests > 0 ? `<div class="quote-row"><span>Extra guests (${quote.extraGuests})</span><span>${money(quote.extraAmount)}</span></div>` : ''}
    ${quote.foodAmount > 0 ? `<div class="quote-row"><span>Food package</span><span>${money(quote.foodAmount)}</span></div>` : ''}
    ${quote.bbqAmount > 0 ? `<div class="quote-row"><span>BBQ</span><span>${money(quote.bbqAmount)}</span></div>` : ''}
    <div class="quote-row total"><span>Total</span><span>${money(quote.total)}</span></div>
    ${!usedServer ? '<p class="quote-placeholder" style="margin-top:8px;">Estimate only — connect the backend for live availability &amp; online payment.</p>' : ''}
    ${usedServer && !available ? '<p class="quote-error">Those dates just became unavailable — please pick another range.</p>' : ''}
  `;
  payBtn.disabled = !(usedServer && available);
}
['guestsInput','wantFoodInput','bbqKgInput'].forEach(id => {
  document.getElementById(id).addEventListener('input', updateQuote);
  document.getElementById(id).addEventListener('change', updateQuote);
});

// ---------- Pay & confirm booking (Razorpay Checkout) ----------
document.getElementById('payBtn').addEventListener('click', async () => {
  const form = document.getElementById('bookForm');
  const f = new FormData(form);
  const payload = {
    checkin: bookState.checkin,
    checkout: bookState.checkout,
    guests: Number(f.get('guests')) || BASE_GUESTS,
    wantFood: document.getElementById('wantFoodInput').checked,
    bbqKg: Number(f.get('bbqKg')) || 0,
    name: f.get('name'),
    phone: f.get('phone'),
    email: f.get('email'),
    notes: f.get('message'),
  };
  if (!payload.name || !payload.phone) { alert('Please fill in your name and phone number first.'); return; }
  if (!CONFIG.apiBase) { alert('Online payment isn\'t connected yet — please use the WhatsApp option below.'); return; }

  const payBtn = document.getElementById('payBtn');
  payBtn.disabled = true;
  payBtn.querySelector('span').textContent = 'Preparing checkout…';

  try {
    const res = await fetch(`${CONFIG.apiBase}/api/booking/create-order`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const order = await res.json();
    if (!res.ok) throw new Error(order.error || 'Could not start checkout.');

    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: CONFIG.villaName,
      description: `${bookState.checkin} to ${bookState.checkout}`,
      prefill: { name: payload.name, contact: payload.phone, email: payload.email || '' },
      theme: { color: '#2F4A3B' },
      handler: async function (response) {
        try {
          const verifyRes = await fetch(`${CONFIG.apiBase}/api/booking/verify`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: order.bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            document.getElementById('quoteBox').innerHTML = '<p class="quote-row total"><span>Booked! 🎉</span></p><p class="quote-placeholder">A confirmation has been recorded — we\'ll also reach out on WhatsApp shortly.</p>';
            loadAvailability();
          } else {
            alert('Payment succeeded but we could not confirm the booking automatically — please message us on WhatsApp with your payment ID: ' + response.razorpay_payment_id);
          }
        } catch (err) {
          alert('Payment succeeded but confirmation failed — please message us on WhatsApp with your payment ID: ' + response.razorpay_payment_id);
        }
      },
      modal: {
        ondismiss: function () {
          payBtn.disabled = false;
          payBtn.querySelector('span').textContent = 'Pay & confirm booking';
        }
      }
    });
    rzp.on('payment.failed', function () {
      alert('Payment failed — please try again, or use the WhatsApp option below.');
      payBtn.disabled = false;
      payBtn.querySelector('span').textContent = 'Pay & confirm booking';
    });
    rzp.open();
    payBtn.querySelector('span').textContent = 'Pay & confirm booking';
  } catch (err) {
    alert(err.message);
    payBtn.disabled = false;
    payBtn.querySelector('span').textContent = 'Pay & confirm booking';
  }
});

// ---------- Booking form -> WhatsApp (always available, no backend required) ----------
document.getElementById('bookForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = f.get('name');
  const checkin = bookState.checkin || f.get('checkin');
  const checkout = bookState.checkout || f.get('checkout');
  const guests = f.get('guests');
  const phone = f.get('phone');
  const wantFood = document.getElementById('wantFoodInput').checked;
  const bbqKg = f.get('bbqKg');
  const message = f.get('message');

  if (checkin && checkout && checkout <= checkin) {
    alert('Check-out date should be after check-in date.');
    return;
  }

  const text = [
    `Hi ${CONFIG.villaName}! I'd like to request a booking.`,
    `Name: ${name}`,
    `Check-in: ${checkin || '—'}`,
    `Check-out: ${checkout || '—'}`,
    `Guests: ${guests}`,
    wantFood ? 'Food package: yes' : null,
    bbqKg && Number(bbqKg) > 0 ? `BBQ: ${bbqKg} kg` : null,
    `My contact: ${phone}`,
    message ? `Notes: ${message}` : null
  ].filter(Boolean).join('\n');

  window.open(waLink(text), '_blank', 'noopener');
});

// ============================================================
// FAQ CHAT WIDGET — simple client-side keyword matching.
// No backend required. Falls back to WhatsApp handoff.
// To upgrade to a real AI assistant, wire this up to a backend
// that calls the Claude API (see Anthropic's docs) instead of
// the matchAnswer() function below.
// ============================================================
const FAQ = [
  { keys: ['price','cost','rate','rent','charge'], a: "Base rate (up to 6 guests): ₹7,500/night Mon–Thu, ₹21,500/night Fri & Sat, ₹10,500/night Sunday. Extra adults are ₹1,180/night beyond 6. Food and BBQ are billed separately." },
  { keys: ['pool','swim','waterfall'], a: "There's a private 23×18 ft pool (4.5 ft deep) with a mini waterfall, plus a smaller 9×6 ft kids' pool." },
  { keys: ['pet','dog','cat'], a: "Yes, the villa is pet friendly, with services in place to make your pet's stay easy too." },
  { keys: ['food','meal','breakfast','lunch','dinner','veg'], a: "Food packages start at ₹1,200 per person for four meals a day (breakfast, lunch, hi-tea, dinner), veg and non-veg." },
  { keys: ['room','bedroom','sleep','capacity','guest'], a: "There are 3 air-conditioned bedrooms (all en suite) sleeping up to 8 guests, including a bunk bed in the ground-floor room." },
  { keys: ['check','time','checkin','checkout'], a: "Check-in is from 1:00 PM and check-out is by 11:00 AM." },
  { keys: ['location','address','directions','distance','karjat'], a: "We're on Varai Road near Lakhan Phata, Karjat — about 53 km from Mumbai's airport and 4 km from Karjat station." },
  { keys: ['book','availability','reserve','dates'], a: "Head to the booking form above, or tell me your dates here and I'll connect you to WhatsApp to confirm." },
  { keys: ['jacuzzi','hot tub'], a: "Yes — there's a couple-friendly jacuzzi as part of the villa's original design." },
  { keys: ['game','carrom','table tennis','air hockey'], a: "The game zone has table tennis, carrom, and air hockey, with air coolers to stay comfortable." },
];

function matchAnswer(msg){
  const lower = msg.toLowerCase();
  if (lower.includes('human') || lower.includes('agent') || lower.includes('talk to someone')) {
    return { handoff: true, text: "Sure — connecting you to WhatsApp so a real person can help." };
  }
  for (const item of FAQ) {
    if (item.keys.some(k => lower.includes(k))) return { handoff: false, text: item.a };
  }
  return { handoff: false, text: "I'm not sure about that one — type \"human\" and I'll connect you to WhatsApp, where we can answer anything." };
}

const chatToggle = document.getElementById('chatToggle');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const chatBody = document.getElementById('chatBody');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');

function openChat(){ chatPanel.classList.add('open'); chatPanel.setAttribute('aria-hidden','false'); chatInput.focus(); }
function closeChat(){ chatPanel.classList.remove('open'); chatPanel.setAttribute('aria-hidden','true'); }
chatToggle.addEventListener('click', () => chatPanel.classList.contains('open') ? closeChat() : openChat());
chatClose.addEventListener('click', closeChat);

function addMsg(text, who){
  const div = document.createElement('div');
  div.className = `chat-msg ${who}`;
  div.textContent = text;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = chatInput.value.trim();
  if (!val) return;
  addMsg(val, 'user');
  chatInput.value = '';
  setTimeout(() => {
    const res = matchAnswer(val);
    addMsg(res.text, 'bot');
    if (res.handoff) {
      setTimeout(() => window.open(waLink(`Hi ${CONFIG.villaName}! ${val}`), '_blank', 'noopener'), 600);
    }
  }, 350);
});
