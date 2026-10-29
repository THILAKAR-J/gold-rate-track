// Formatting helpers shared by the build (Node) and mirrored in assets/app.js.

/** Indian-grouped rupees: 105080 -> "₹1,05,080". */
export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

/** Signed rupees with a true minus sign: 54 -> "+₹54", -4 -> "−₹4". */
export const sinr = (n) => (n < 0 ? '−' : '+') + inr(Math.abs(n));

/** Signed plain number for small table changes: "+38", "−196", "0". */
export const sgn = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TZ = 'Asia/Kolkata';
const d = (iso) => new Date(iso.length === 10 ? iso + 'T12:00:00+05:30' : iso);

/** "27 October 2026" */
export const longDate = (iso) => d(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
/** "27 Oct 2026" */
export const medDate = (iso) => d(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
/** "27 Oct" */
export const shortDate = (iso) => d(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ });
/** "6 November" */
export const dayMonth = (iso) => d(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: TZ });
/** "Friday" */
export const weekday = (iso) => d(iso).toLocaleDateString('en-GB', { weekday: 'long', timeZone: TZ });
/** "12:10 PM" */
export const clock = (iso) =>
  d(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });

/** Whole days from a to b (both YYYY-MM-DD). */
export const daysBetween = (a, b) => Math.round((d(b) - d(a)) / 86400000);

export const pct = (v, digits = 2) => v.toFixed(digits) + '%';
