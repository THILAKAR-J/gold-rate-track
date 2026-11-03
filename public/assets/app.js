/* Daily Gold Rate India: progressive enhancement. Every rate is already in the HTML; this file only adds interaction. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var readJson = function (id) { var el = document.getElementById(id); try { return el ? JSON.parse(el.textContent) : {}; } catch (e) { return {}; } };
  var DATA = readJson('page-data');
  var CITY = readJson('city-data'); // { date, cities: { slug: { name, ta, path, taPath, unit, grams, r22 } } }
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: works for this visit only */ } }
  };
  var TA = document.documentElement.lang.indexOf('ta') === 0;

  function pickGroup(buttons, attr, onPick) {
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        onPick(b.getAttribute(attr), b);
      });
    });
  }

  /* ---------- Header menu (phones) ---------- */
  var menu = $('[data-menu]'), nav = $('#site-nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.focus(); }
    });
  }

  /* ---------- City table filter (region chips + search) ---------- */
  $$('[data-finder]').forEach(function (box) {
    var region = 'All', q = '';
    var rows = $$('tbody tr', box), count = $('[data-count]', box), empty = $('[data-empty]', box), input = $('[data-q]', box);
    function apply() {
      var n = 0, needle = q.trim().toLowerCase();
      rows.forEach(function (r) {
        var show = (region === 'All' || r.getAttribute('data-region') === region) && (!needle || r.getAttribute('data-city').indexOf(needle) >= 0);
        r.hidden = !show; if (show) n++;
      });
      if (count) count.textContent = 'Showing ' + n + ' of ' + rows.length + ' cities.';
      if (empty) empty.hidden = n > 0;
    }
    pickGroup($$('[data-region-btn]', box), 'data-region-btn', function (v) { region = v; apply(); });
    if (input) input.addEventListener('input', function () { q = input.value; apply(); });
  });

  /* ---------- Your city: saved on this device, shown first next time ---------- */
  var KEY = 'grt-city', SEEN = 'grt-seen';
  function saveCity(slug) {
    if (!CITY.cities || !CITY.cities[slug]) return;
    store.set(KEY, { slug: slug });
    showMyCity(true);
  }
  function showMyCity(justSaved) {
    var bar = $('[data-mycity]'), saved = store.get(KEY);
    if (!bar || !saved || !CITY.cities || !CITY.cities[saved.slug]) return;
    var c = CITY.cities[saved.slug], value = c.r22 * c.grams;
    var seen = store.get(SEEN) || {}, last = seen[saved.slug];
    $('[data-mc-name]', bar).textContent = (TA ? 'உங்கள் நகரம்: ' : 'Your city: ') + (TA && c.ta ? c.ta : c.name);
    $('[data-mc-rate]', bar).innerHTML = (TA ? '22 காரட் ' : '22K ') + c.unit + ' <b class="num">' + inr(value) + '</b>';
    var since = $('[data-mc-since]', bar), msg = '';
    if (justSaved) msg = TA ? 'சேமிக்கப்பட்டது. அடுத்த முறை இது முதலில் தெரியும்.' : 'Saved. It shows first on your next visit.';
    else if (last && last.date !== CITY.date && last.value !== value) {
      var d = value - last.value;
      msg = TA
        ? 'கடந்த முறை பார்த்ததை விட ' + inr(Math.abs(d)) + (d > 0 ? ' உயர்வு' : ' சரிவு')
        : (d > 0 ? '▲ ' : '▼ ') + inr(Math.abs(d)) + ' since your last visit on ' + new Date(last.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    since.textContent = msg;
    var link = $('[data-mc-link]', bar), here = location.pathname.replace(/index\.html$/, '');
    var target = TA && c.taPath ? c.taPath : c.path;
    link.href = target;
    link.hidden = here === target || here === c.path || here === c.taPath;
    bar.hidden = false;
    seen[saved.slug] = { date: CITY.date, value: value };
    store.set(SEEN, seen);
  }
  $$('[data-save-city]').forEach(function (b) {
    b.addEventListener('click', function () { saveCity(b.getAttribute('data-save-city')); b.textContent = TA ? 'சேமிக்கப்பட்டது ✓' : 'Saved as your city ✓'; });
  });
  var pick = $('[data-pick-city]');
  if (pick) {
    var cur = store.get(KEY); if (cur) pick.value = cur.slug;
    pick.addEventListener('change', function () { if (pick.value) saveCity(pick.value); });
  }
  showMyCity(false);

  /* ---------- Add to home screen ---------- */
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    $$('[data-install]').forEach(function (b) { b.hidden = false; });
  });
  $$('[data-install-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!deferred) return;
      deferred.prompt();
      deferred.userChoice.then(function () { deferred = null; $$('[data-install]').forEach(function (b) { b.hidden = true; }); });
    });
  });

  /* ---------- Gold price calculator ---------- */
  if (document.body.getAttribute('data-page') === 'calc') {
    var calc = $('[data-calc]'), form = $('form', calc);
    var s = { purity: '22K', unit: 'g' };
    var C = 2 * Math.PI * 44;
    var num = function (v) { var n = Number(v); return isFinite(n) && n >= 0 ? n : 0; };
    var val = function (n) { return form.elements[n].value; };
    var out = function (k, t) { var el = $('[data-o="' + k + '"]', calc); if (el) el.textContent = t; };
    var unitName = { g: 'grams', pavan: 'pavan', tola: 'tola' };
    var run = function () {
      var ex = form.elements.exchange.checked;
      var grams = num(val('weight')) * DATA.ug[s.unit];
      var rate = DATA.rates[s.purity];
      var gold = grams * rate;
      var making = gold * num(val('making')) / 100;
      var wastage = gold * num(val('wastage')) / 100;
      var other = num(val('other'));
      var gst = (gold + making + wastage + other) * 0.03;
      var credit = ex ? num(val('oldG')) * DATA.rates['22K'] * (1 - num(val('oldCut')) / 100) : 0;
      var gross = gold + making + wastage + other + gst;
      var total = Math.max(0, gross - credit);
      var share = function (v) { return gross > 0 ? v / gross : 0; };
      var pc = function (v) { return (share(v) * 100).toFixed(1) + '%'; };
      out('sub', s.purity + ' · ' + (s.unit === 'g' ? grams.toFixed(2) + ' g' : num(val('weight')) + ' ' + unitName[s.unit] + ' = ' + grams.toFixed(2) + ' g'));
      out('gold', inr(gold)); out('making', inr(making)); out('wastage', inr(wastage)); out('other', inr(other)); out('gst', inr(gst));
      out('credit', '−' + inr(credit)); out('total', inr(total));
      out('effective', grams > 0 ? 'That is ' + inr(gross / grams) + ' per gram before any exchange, ' + ((gross / gold - 1) * 100).toFixed(1) + '% above the gold rate.' : 'Enter a weight to see your estimate.');
      $('[data-credit-line]', calc).hidden = !ex;
      $('[data-ex-fields]', calc).hidden = !ex;
      var a1 = share(gold) * C, a2 = share(making + wastage + other) * C, a3 = share(gst) * C;
      var arc = function (i, len, off) { var c = $('[data-arc="' + i + '"]', calc); c.setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + C.toFixed(2)); c.setAttribute('stroke-dashoffset', (-off).toFixed(2)); };
      arc(1, a1, 0); arc(2, a2, a1); arc(3, a3, a1 + a2);
      out('pGold', pc(gold)); out('pMaking', pc(making + wastage + other)); out('pGst', pc(gst));
      $('[data-donut]', calc).setAttribute('aria-label', 'Gold ' + pc(gold) + ', making and other ' + pc(making + wastage + other) + ', GST ' + pc(gst) + ' of your bill');
      $('[data-rate-hint]', calc).textContent = 'Today’s ' + s.purity + ' rate is ' + inr(rate) + ' per gram' + (DATA.sample ? ' (sample rate).' : '.');
      var text = 'Gold estimate: ' + s.purity + ', ' + grams.toFixed(2) + ' g. Gold ' + inr(gold) + ' + making ' + inr(making + wastage) + ' + other ' + inr(other) + ' + GST ' + inr(gst) + (ex ? ' − old gold ' + inr(credit) : '') + ' = about ' + inr(total) + '. ' + location.href.split('#')[0];
      var sh = $('[data-share]', calc); if (sh) sh.href = 'https://wa.me/?text=' + encodeURIComponent(text);
    };
    pickGroup($$('[data-purity]', form), 'data-purity', function (v) { s.purity = v; run(); });
    pickGroup($$('[data-unit]', form), 'data-unit', function (v) { s.unit = v; run(); });
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    var pr = $('[data-print]', calc); if (pr) pr.addEventListener('click', function () { window.print(); });
    run();
  }
})();
