/* Kanak: progressive enhancement. Every rate is already in the HTML; this file only adds interaction. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var dataEl = $('#page-data');
  var DATA = dataEl ? JSON.parse(dataEl.textContent) : {};
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: choice lasts this visit */ } }
  };

  /** Make a group of toggle buttons single-select. onPick(value, button). */
  function pickGroup(buttons, attr, onPick) {
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        buttons.forEach(function (x) {
          var on = x === b;
          x.classList.toggle('on', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        onPick(b.getAttribute(attr), b);
      });
    });
  }

  /* ---------- Header menu ---------- */
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

  /* ---------- Cookie consent (nothing optional loads before a choice) ----------
     Analytics or ad scripts must wait for the 'kanak:consent' event and check detail.analytics / detail.ads. */
  var KEY = 'kanak-consent';
  var bar = $('[data-cookie]'), prefs = $('#cookie-prefs');
  function setPrefsOpen(open) {
    if (!prefs) return;
    prefs.hidden = !open;
    var c = $('[data-cookie-act="custom"]');
    if (c) c.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function saveConsent(a, ad) {
    store.set(KEY, { analytics: !!a, ads: !!ad, at: new Date().toISOString(), v: 1 });
    if (bar) bar.hidden = true;
    document.dispatchEvent(new CustomEvent('kanak:consent', { detail: { analytics: !!a, ads: !!ad } }));
  }
  if (bar) {
    var saved = store.get(KEY);
    if (!saved) bar.hidden = false;
    else document.dispatchEvent(new CustomEvent('kanak:consent', { detail: { analytics: !!saved.analytics, ads: !!saved.ads } }));
    $$('[data-cookie-act]', bar).forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-cookie-act');
        if (act === 'accept') saveConsent(true, true);
        else if (act === 'reject') saveConsent(false, false);
        else if (act === 'custom') setPrefsOpen(prefs.hidden);
        else if (act === 'save') saveConsent($('[data-pref="analytics"]', bar).checked, $('[data-pref="ads"]', bar).checked);
      });
    });
    $$('[data-cookie-open]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = store.get(KEY) || {};
        $('[data-pref="analytics"]', bar).checked = !!s.analytics;
        $('[data-pref="ads"]', bar).checked = !!s.ads;
        bar.hidden = false;
        setPrefsOpen(true);
        $('[data-cookie-act="reject"]', bar).focus();
      });
    });
  }

  /* ---------- Forms (alerts, grievance) ---------- */
  function formHandler(form, onDone) {
    var msg = $('[data-msg]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = $$('[required]', form).filter(function (el) {
        var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
        el.setAttribute('aria-invalid', ok ? 'false' : 'true');
        return !ok;
      });
      if (bad.length) {
        msg.className = 'form-msg err';
        msg.textContent = bad[0].type === 'checkbox' ? 'Please tick the consent box to continue.' : 'Please fill in the highlighted fields.';
        bad[0].focus();
        return;
      }
      var endpoint = (DATA && DATA.endpoint) || form.getAttribute('data-endpoint') || '';
      if (!endpoint) {
        onDone(false);
        return;
      }
      var body = {};
      new FormData(form).forEach(function (v, k) { body[k] = v; });
      body.form = form.getAttribute('data-form');
      msg.className = 'form-msg';
      msg.textContent = 'Sending…';
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); onDone(true); })
        .catch(function () { msg.className = 'form-msg err'; msg.textContent = 'Sorry, that did not send. Please try again in a minute.'; });
    });
  }
  var alertForm = $('[data-form="alert"]');
  if (alertForm) {
    formHandler(alertForm, function (sent) {
      var msg = $('[data-msg]', alertForm);
      msg.className = 'form-msg ok-msg';
      msg.textContent = sent
        ? 'Done. We will send a confirmation to your WhatsApp number.'
        : 'Preview only: alerts are not switched on yet, so nothing was sent or stored.';
    });
  }

  /* ---------- City finder (home and cities hub) ---------- */
  $$('[data-finder]').forEach(function (box) {
    var region = 'All', q = '';
    var cards = $$('.city', box), count = $('[data-count]', box), empty = $('[data-empty]', box), input = $('[data-q]', box);
    function apply() {
      var n = 0, needle = q.trim().toLowerCase();
      cards.forEach(function (c) {
        var show = (region === 'All' || c.getAttribute('data-region') === region) && (!needle || c.getAttribute('data-city').indexOf(needle) >= 0);
        c.hidden = !show;
        if (show) n++;
      });
      count.textContent = 'Showing ' + n + ' of ' + cards.length + ' cities.';
      empty.hidden = n > 0;
    }
    pickGroup($$('[data-region-btn]', box), 'data-region-btn', function (v) { region = v; apply(); });
    input.addEventListener('input', function () { q = input.value; apply(); });
  });

  var page = document.body.getAttribute('data-page');

  /* ---------- Home ---------- */
  if (page === 'home') {
    var st = { purity: '22K', unit: '1g' };
    var board = $('[data-board]');
    var renderBoard = function () {
      var r = DATA.rates[st.purity];
      var u = DATA.units.filter(function (x) { return x.id === st.unit; })[0];
      var chg = $('[data-b-chg]', board);
      $('[data-b-cap]', board).textContent = st.purity + ' gold · ' + DATA.notes[st.purity] + ' · ' + u.label;
      $('[data-b-val]', board).textContent = inr(r.g * u.g);
      chg.textContent = (r.chg >= 0 ? '▲ ' : '▼ ') + inr(Math.abs(r.chg) * u.g) + ' (' + (Math.abs(r.chg) / (r.g - r.chg) * 100).toFixed(2) + '%)';
      chg.className = 'chg num chg-' + (r.chg >= 0 ? 'up' : 'down');
      $('[data-b-since]', board).textContent = 'since yesterday · ' + inr(r.g) + ' per gram';
      $$('[data-col]').forEach(function (c) { c.classList.toggle('hl', c.getAttribute('data-col') === st.purity); });
      $$('[data-pur]').forEach(function (c) { c.classList.toggle('on', c.getAttribute('data-pur') === st.purity); });
    };
    pickGroup($$('[data-purity]', board), 'data-purity', function (v) { st.purity = v; renderBoard(); });
    pickGroup($$('[data-unit]', board), 'data-unit', function (v) { st.unit = v; renderBoard(); });

    var trend = $('[data-trend]');
    if (trend) {
      pickGroup($$('[data-series-btn]', trend), 'data-series-btn', function (v) {
        $$('[data-series]', trend).forEach(function (el) { el.hidden = el.getAttribute('data-series') !== v; });
      });
    }
  }

  /* ---------- City ---------- */
  if (page === 'city') {
    var cb = $('[data-city-board]');
    pickGroup($$('[data-unit]', cb), 'data-unit', function (v) {
      var u = DATA.units.filter(function (x) { return x.id === v; })[0];
      $$('[data-u-name]', cb).forEach(function (el) { el.textContent = u.name; });
      ['22K', '24K'].forEach(function (k) {
        var chg = DATA.r['chg' + k.slice(0, 2)];
        $('[data-tile="' + k + '"]', cb).textContent = inr(DATA.r[k] * u.g);
        $('[data-tile-chg="' + k + '"]', cb).textContent = (chg >= 0 ? '▲ ' : '▼ ') + inr(Math.abs(chg) * u.g) + ' since yesterday';
      });
    });

    var pl = $('[data-planner]');
    if (pl) {
      var bIn = $('[data-budget]', pl), mIn = $('[data-making]', pl);
      var plan = function () {
        var budget = Number(bIn.value), mk = Number(mIn.value);
        var perGram = DATA.r['22K'] * (1 + mk / 100) * 1.03;
        var grams = budget / perGram, count = grams / DATA.planUnit;
        $('[data-o-budget]', pl).textContent = inr(budget);
        $('[data-o-making]', pl).textContent = mk + '%';
        bIn.setAttribute('aria-valuetext', inr(budget));
        mIn.setAttribute('aria-valuetext', mk + '%');
        $('[data-o-count]', pl).textContent = (DATA.sov ? count : grams).toFixed(1);
        $('[data-o-detail]', pl).textContent = DATA.sov
          ? grams.toFixed(1) + ' g of 22K gold · ' + inr(perGram * 8) + ' per ' + DATA.unitName + ', all in'
          : inr(perGram) + ' per gram, all in · each coin is 1 g';
        var whole = Math.floor(count), part = count - whole, html = '';
        for (var i = 0; i < Math.min(whole, 40); i++) html += '<span class="coin"></span>';
        if (part > 0.05 && whole < 40) html += '<span class="coin" style="background: conic-gradient(#E8B64C ' + Math.round(part * 360) + 'deg, #2A333B 0deg); box-shadow: none"></span>';
        if (whole > 40) html += '<span class="coin-more num">+' + (whole - 40) + '</span>';
        $('[data-coins]', pl).innerHTML = html;
      };
      bIn.addEventListener('input', plan);
      mIn.addEventListener('input', plan);
    }
  }

  /* ---------- Calculator ---------- */
  if (page === 'calc') {
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
      $('[data-share]', calc).href = 'https://wa.me/?text=' + encodeURIComponent(text);
    };
    pickGroup($$('[data-purity]', form), 'data-purity', function (v) { s.purity = v; run(); });
    pickGroup($$('[data-unit]', form), 'data-unit', function (v) { s.unit = v; run(); });
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $('[data-print]', calc).addEventListener('click', function () { window.print(); });
    run();
  }

  /* ---------- Grievance ---------- */
  if (page === 'grievance') {
    var gf = $('[data-form="grievance"]'), ok = $('[data-ok]');
    pickGroup($$('[data-topic]', gf), 'data-topic', function (v, b) {
      gf.elements.topic.value = v;
      gf.elements.details.placeholder = b.getAttribute('data-hint');
    });
    formHandler(gf, function (sent) {
      $('[data-ok-title]', ok).textContent = sent ? 'Thank you. We have your message.' : 'Your message is ready, but this preview cannot send it yet.';
      $('[data-ok-text]', ok).textContent = sent
        ? 'We’ll confirm by email or WhatsApp within 24 hours.'
        : 'The form is not connected to a mailbox in this preview, so nothing was sent or stored. Please use the Grievance Officer’s email above.';
      gf.hidden = true;
      ok.hidden = false;
      ok.focus();
    });
    $('[data-again]', ok).addEventListener('click', function () {
      gf.reset();
      $('[data-topic]', gf).click();
      $('[data-msg]', gf).textContent = '';
      ok.hidden = true;
      gf.hidden = false;
      gf.elements.name.focus();
    });
  }
})();
