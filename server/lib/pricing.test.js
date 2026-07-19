const test = require('node:test');
const assert = require('node:assert/strict');
const { computeQuote } = require('./pricing');

test('applies fixed discount coupons to the final total', () => {
  const quote = computeQuote({
    checkin: '2026-07-20',
    checkout: '2026-07-21',
    guests: 6,
    wantFood: false,
    bbqKg: 0,
    coupon: { code: 'SAVE1000', discount_type: 'fixed', discount_value: 1000, is_active: true },
  });

  assert.equal(quote.originalTotalAmount, 7500);
  assert.equal(quote.discountAmount, 1000);
  assert.equal(quote.totalAmount, 6500);
  assert.equal(quote.couponCode, 'SAVE1000');
});

test('applies percentage discount coupons to the final total', () => {
  const quote = computeQuote({
    checkin: '2026-07-20',
    checkout: '2026-07-21',
    guests: 6,
    wantFood: false,
    bbqKg: 0,
    coupon: { code: 'TENPERCENT', discount_type: 'percent', discount_value: 10, is_active: true },
  });

  assert.equal(quote.originalTotalAmount, 7500);
  assert.equal(quote.discountAmount, 750);
  assert.equal(quote.totalAmount, 6750);
  assert.equal(quote.couponCode, 'TENPERCENT');
});
