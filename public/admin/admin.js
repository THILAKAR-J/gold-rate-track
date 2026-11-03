/* Daily Gold Rate India admin. Edits data/content.json through /admin/api; the site rebuilds itself after each publish. */
(function () {
  'use strict';
  var app = document.getElementById('app'), toastEl = document.getElementById('toast');
  var S = { me: null, meta: null, pages: [], content: null, sha: null, saved: '', view: 'dashboard', path: '/', tab: 'seo', filter: 'All', q: '', activity: null, busy: false };

  /* ---------- helpers ---------- */
  var h = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var inr = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var len = function (s) { return Array.from(String(s || '')).length; };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: drafts last for this visit only */ } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };
  function toast(msg, bad) {
    toastEl.textContent = msg; toastEl.className = bad ? 'bad' : ''; toastEl.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, bad ? 7000 : 4000);
  }
  function api(path, opts) {
    opts = opts || {};
    return fetch('api/' + path, { method: opts.method || 'GET', headers: opts.body ? { 'Content-Type': 'application/json' } : {}, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: 'same-origin' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { d._status = r.status; return d; }); });
  }
  var ICON = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    pages: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/>',
    rates: '<path d="M4 17h16l-3-8H7z"/>',
    site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'
  };
  var ico = function (k) { return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>'; };
  var LOGO = '<svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="17" fill="#6E1A2A"/><circle cx="18" cy="18" r="12" fill="none" stroke="#F2C35B" stroke-width="2"/><path d="M11 21h14l-2.5-6h-9z" fill="#F2C35B"/></svg>';

  /* ---------- tokens: {date}, {22k}… ---------- */
  var ORDER = ['date_long', 'date', 'day', '22k_8g', '24k_8g', '22k_10g', '24k_10g', '22k_unit', '24k_unit', '22k', '24k', '18k', 'silver_kg', 'silver_g', 'change', 'unit', 'city'];
  function templatize(text, tok) {
    var s = String(text || '');
    ORDER.forEach(function (k) {
      var v = tok[k]; if (!v || v.length < 3) return;
      var re = new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\d|,\\d)', 'g');
      s = s.replace(re, '{' + k + '}');
    });
    return s;
  }
  function fill(t, tok) { return String(t || '').replace(/\{([a-z0-9_]+)\}/g, function (m, k) { return k in tok ? tok[k] : m; }); }
  function unknownTokens(t, tok) { return (String(t || '').match(/\{([a-z0-9_]+)\}/g) || []).filter(function (m) { return !(m.slice(1, -1) in tok); }); }

  /* ---------- page model ---------- */
  var pageBy = function (path) { return S.pages.find(function (p) { return p.path === path; }); };
  var ov = function (path) { return (S.content.pages && S.content.pages[path]) || {}; };
  function defaultsT(p) {
    return { title: templatize(p.defaults.title, p.tokens), description: templatize(p.defaults.description, p.tokens), h1: templatize(p.defaults.h1, p.tokens), faq: p.defaults.faq.map(function (f) { return { q: templatize(f.q, p.tokens), a: templatize(f.a, p.tokens) }; }), extra: '', noindex: false };
  }
  function current(p) {
    var d = defaultsT(p), o = ov(p.path);
    return { title: o.title != null ? o.title : d.title, description: o.description != null ? o.description : d.description, h1: o.h1 != null ? o.h1 : d.h1, faq: o.faq || d.faq, extra: o.extra || '', noindex: !!o.noindex };
  }
  function setField(path, key, value) {
    var p = pageBy(path), d = defaultsT(p);
    S.content.pages = S.content.pages || {};
    var o = S.content.pages[path] || {};
    var same = key === 'faq' ? JSON.stringify(value) === JSON.stringify(d.faq) : key === 'noindex' ? !value : key === 'extra' ? !String(value).trim() : value === d[key];
    if (same) delete o[key]; else o[key] = value;
    if (Object.keys(o).length) S.content.pages[path] = o; else delete S.content.pages[path];
    saveDraft();
  }
  function kindOf(path) {
    if (path.indexOf('/gold-rate/') === 0) return 'Cities';
    if (path.indexOf('/gold-rate-history/') === 0) return 'History';
    if (path === '/' || /carat|silver|ibja|gram|pavan|tola/.test(path)) return 'Rates';
    return 'Other';
  }
  function labelOf(p) { var x = fill(current(p).h1, p.tokens).replace(/<[^>]+>/g, ''); return p.path === '/' ? 'Gold rate today (home)' : x || p.path; }

  /* ---------- checks (the build runs the same rules again before publishing) ---------- */
  function filled(p) { var c = current(p); return { title: fill(c.title, p.tokens), description: fill(c.description, p.tokens), h1: fill(c.h1, p.tokens), c: c }; }
  function checksFor(p) {
    var f = filled(p), c = f.c, out = [];
    var tl = len(f.title), dl = len(f.description);
    out.push(tl < 20 || tl > 78 ? ['err', 'Title is ' + tl + ' characters; keep it between 20 and 65'] : tl > 65 ? ['warn', 'Title is ' + tl + ' characters; Google may cut it after about 65'] : ['ok', 'Title ' + tl + ' characters']);
    out.push(dl < 70 || dl > 175 ? ['err', 'Description is ' + dl + ' characters; keep it between 70 and 160'] : dl > 160 ? ['warn', 'Description is ' + dl + ' characters; Google may cut it after about 160'] : ['ok', 'Description ' + dl + ' characters']);
    var bad = unknownTokens(c.title + c.description + c.h1 + c.extra + JSON.stringify(c.faq), p.tokens);
    if (bad.length) out.push(['err', 'Unknown token ' + bad[0] + '. Use the token buttons.']);
    if (p.path !== '/privacy-policy/' && p.path !== '/disclaimer/' && p.path.indexOf('/gold-rate-history/') !== 0) {
      out.push(/\{date|\{day/.test(c.title) ? ['ok', "Title has today's date"] : ['warn', "Title has no {date}: it will not change each day"]);
      out.push(/\{(22k|24k|18k|silver)/.test(c.title) || p.kind === 'Other' ? ['ok', 'Title shows a price'] : ['warn', "Title has no price token: results with a price get more clicks"]);
    }
    var dupT = S.pages.some(function (q) { return q !== p && filled(q).title === f.title; });
    var dupD = S.pages.some(function (q) { return q !== p && filled(q).description === f.description; });
    out.push(dupT || dupD ? ['err', (dupT ? 'Title' : 'Description') + ' is the same as another page'] : ['ok', 'Title and description used by no other page']);
    out.push(f.h1.trim() ? ['ok', 'One H1: ' + f.h1.slice(0, 40)] : ['err', 'The H1 heading is empty']);
    if (c.faq.length) out.push(c.faq.every(function (x) { return x.q.trim() && x.a.trim(); }) ? ['ok', 'FAQ schema matches the ' + c.faq.length + ' questions on the page'] : ['err', 'Every FAQ question needs an answer']);
    out.push(c.noindex ? ['warn', 'Hidden from Google and the sitemap'] : ['ok', 'Canonical and sitemap set automatically']);
    return out;
  }
  function siteChecks() {
    var e = 0, w = 0, list = [];
    S.pages.forEach(function (p) { checksFor(p).forEach(function (c) { if (c[0] === 'err') { e++; list.push([p, c]); } if (c[0] === 'warn') w++; }); });
    return { errors: e, warnings: w, list: list };
  }

  /* ---------- drafts and publishing ---------- */
  var draftKey = function () { return 'dgr-admin-draft-' + (S.me ? S.me.branch : ''); };
  function pending() { return JSON.stringify(S.content) !== S.saved; }
  function saveDraft() { if (pending()) store.set(draftKey(), { sha: S.sha, content: S.content }); else store.del(draftKey()); }
  function changeCount() {
    var a = JSON.parse(S.saved), b = S.content, n = 0;
    var keys = {}; Object.keys(a.pages || {}).concat(Object.keys(b.pages || {})).forEach(function (k) { keys[k] = 1; });
    Object.keys(keys).forEach(function (k) { if (JSON.stringify((a.pages || {})[k]) !== JSON.stringify((b.pages || {})[k])) n++; });
    if (JSON.stringify(a.cityBoards || {}) !== JSON.stringify(b.cityBoards || {})) n++;
    return n;
  }
  function publish() {
    var sc = siteChecks();
    if (sc.errors) { toast('Fix ' + sc.errors + ' SEO error' + (sc.errors > 1 ? 's' : '') + ' first: ' + labelOf(sc.list[0][0]) + ', ' + sc.list[0][1][1], true); return; }
    S.busy = true; render();
    api('content', { method: 'PUT', body: { content: S.content, sha: S.sha, message: 'Admin: ' + changeCount() + ' change' + (changeCount() > 1 ? 's' : '') } }).then(function (d) {
      S.busy = false;
      if (d._status !== 200) { toast(d.error || 'Could not publish.', true); render(); return; }
      S.sha = d.sha; S.saved = JSON.stringify(S.content); store.del(draftKey());
      toast('Published. The site updates in about 2 minutes.');
      S.activity = null; render();
    });
  }

  /* ---------- loading ---------- */
  function boot() {
    api('me').then(function (d) {
      if (d._status === 401) return login();
      if (d._status !== 200) { app.innerHTML = '<div class="login"><form><h1>Admin not ready</h1><p class="err-msg">' + h(d.error || 'The admin API did not answer.') + '</p></form></div>'; return; }
      S.me = d; load();
    });
  }
  function load() {
    Promise.all([fetch('pages.json', { cache: 'no-store' }).then(function (r) { return r.json(); }), api('content')]).then(function (res) {
      S.meta = res[0]; S.pages = res[0].pages.map(function (p) { p.kind = kindOf(p.path); return p; });
      var c = res[1];
      if (c._status !== 200) { toast(c.error || 'Could not load content', true); return; }
      S.content = c.content; S.content.pages = S.content.pages || {}; S.content.cityBoards = S.content.cityBoards || {};
      S.sha = c.sha; S.saved = JSON.stringify(S.content);
      var dr = store.get(draftKey());
      if (dr && dr.sha === S.sha && JSON.stringify(dr.content) !== S.saved) { S.content = dr.content; toast('Your unpublished changes were kept.'); }
      route(); window.addEventListener('hashchange', route);
    });
  }
  function login(msg) {
    app.innerHTML = '<div class="login"><form id="lf"><a class="brand" href="../" style="padding:0;color:inherit">' + LOGO + '<span><b style="color:#1C1A17">Daily Gold Rate</b><span>Admin</span></span></a><h1>Log in</h1>' +
      (msg ? '<p class="err-msg">' + h(msg) + '</p>' : '') +
      '<div class="fld"><label for="pw" style="font-weight:700;font-size:14px">Password</label><input class="in" id="pw" type="password" autocomplete="current-password" required></div>' +
      '<button class="btn pri" type="submit">Log in</button></form></div>';
    var f = document.getElementById('lf'); document.getElementById('pw').focus();
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      api('login', { method: 'POST', body: { password: document.getElementById('pw').value } }).then(function (d) { if (d._status === 200) boot(); else login(d.error || 'Could not log in.'); });
    });
  }
  function route() {
    var hs = decodeURIComponent(location.hash.slice(1));
    if (hs.indexOf('page=') === 0) { S.view = 'pages'; S.path = hs.slice(5) || '/'; }
    else S.view = ['dashboard', 'pages', 'rates'].indexOf(hs) >= 0 ? hs : 'dashboard';
    render();
  }

  /* ---------- views ---------- */
  function shell(inner) {
    var nav = [['dashboard', 'Dashboard', 'dash'], ['pages', 'Pages and SEO', 'pages'], ['rates', 'Rates and cities', 'rates']].map(function (n) {
      return '<a class="nav" href="#' + n[0] + '"' + (S.view === n[0] ? ' aria-current="page"' : '') + '>' + ico(n[2]) + n[1] + '</a>';
    }).join('');
    return '<div class="shell"><aside class="side" aria-label="Admin menu"><a class="brand" href="#dashboard">' + LOGO + '<span><b>Daily Gold Rate</b><span>Admin</span></span></a>' + nav +
      '<a class="nav" href="../" target="_blank" rel="noopener">' + ico('site') + 'View site</a>' +
      '<div class="side-foot"><span>Saving to <b style="color:#fff">' + h(S.me.branch) + '</b></span><button type="button" data-act="logout">Log out</button></div></aside>' +
      '<main class="main">' + inner + '</main></div>';
  }
  function pubBtn() {
    var n = changeCount();
    return n ? '<button type="button" class="btn pri" data-act="publish"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? 'Publishing…' : 'Publish ' + n + ' change' + (n > 1 ? 's' : '')) + '</button>' +
      '<button type="button" class="btn" data-act="discard">Discard</button>' : '<span class="pill loc">All changes published</span>';
  }
  function nextFetch() {
    var now = new Date(Date.now() + 5.5 * 3600e3), best = null;
    for (var d = 0; d < 4; d++) {
      var day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d));
      var wd = day.getUTCDay(), slots = [[0, 1]].concat(wd >= 1 && wd <= 5 ? [[12, 45], [18, 15], [19, 15]] : []);
      for (var i = 0; i < slots.length; i++) {
        var t = new Date(day.getTime() + (slots[i][0] * 60 + slots[i][1]) * 60e3);
        if (t > now) { best = t; break; }
      }
      if (best) break;
    }
    return best ? best.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + (best.getUTCDate() !== now.getUTCDate() ? ' (' + best.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }) + ')' : '') : '–';
  }
  var sessionWord = function (r) { return r.carriedFrom ? 'Last IBJA rate (' + r.carriedFrom + ')' : r.session === 'AM' ? 'IBJA morning rate' : 'IBJA closing rate'; };
  var when = function (iso) { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }); };

  function dashboard() {
    var R = S.meta.rates, sc = siteChecks(), national = S.meta.cities.filter(function (c) { return !c.local; }).length;
    var issues = [];
    sc.list.slice(0, 4).forEach(function (x) { issues.push(['err', labelOf(x[0]), x[1][1], '#page=' + x[0].path, 'Fix']); });
    if (national) issues.push(['warn', national + ' city page' + (national > 1 ? 's show' : ' shows') + ' the national rate', "Add today's local board rate so they match what shops quote.", '#rates', 'Add rates']);
    issues.push(['warn', 'About and Contact pages are off', 'AdSense asks for both. Turn them on before applying.', '', '']);
    if (!sc.errors) issues.push(['ok', 'Titles, descriptions, canonicals, schema and sitemap pass', 'Checked again on every publish: ' + S.pages.length + ' pages.', '', '']);
    var acts = S.activity ? S.activity.map(function (a) { return '<div class="log"><p class="t">' + h(a.message) + '</p><p class="d">' + h(/rates-bot/.test(a.by) ? 'Automatic' : a.by) + ' · ' + h(when(a.at)) + '</p></div>'; }).join('') : '<p class="note">Loading…</p>';
    if (!S.activity) api('activity').then(function (d) { S.activity = d.items || []; if (S.view === 'dashboard') render(); });
    return '<div class="top"><div><h1>Dashboard</h1><p>' + h(new Date(R.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + ' · ' + (S.meta.indexable ? 'live site' : 'preview, hidden from Google') + '</p></div><div class="actions"><a class="btn" href="../" target="_blank" rel="noopener">View site</a>' + pubBtn() + '</div></div>' +
      '<div class="grid4">' +
      '<div class="stat"><p class="k">Today\'s rate, 24K</p><p class="v num" style="color:#6E1A2A">' + inr(R.national['24K'].g) + '</p><p class="s" style="color:#1E7A46">' + h(sessionWord(R)) + ' · ' + h(when(R.updatedAt)) + '</p></div>' +
      '<div class="stat"><p class="k">Pages live</p><p class="v num">' + S.pages.length + '</p><p class="s" style="color:#5E584E;font-weight:500">' + S.pages.filter(function (p) { return !current(p).noindex; }).length + ' in the sitemap</p></div>' +
      '<div class="stat"><p class="k">SEO errors</p><p class="v num" style="color:' + (sc.errors ? '#B42318' : '#1E7A46') + '">' + sc.errors + '</p><p class="s" style="color:#8A5A00">' + sc.warnings + ' tip' + (sc.warnings === 1 ? '' : 's') + '</p></div>' +
      '<div class="stat"><p class="k">Next rate fetch</p><p class="v num">' + h(nextFetch()) + '</p><p class="s" style="color:#5E584E;font-weight:500">12:01 AM daily; 12:45 PM, 6:15 PM, 7:15 PM Mon to Fri</p></div></div>' +
      '<div class="row"><section class="card" style="flex:3 1 520px" aria-labelledby="ti"><h2 id="ti">To improve</h2><p class="lead">Errors stop a publish. Tips help rankings.</p>' +
      issues.map(function (i) { return '<div class="issue"><span class="dot ' + i[0] + '">' + (i[0] === 'ok' ? '✓' : '!') + '</span><div style="flex:1"><p class="t">' + h(i[1]) + '</p><p class="d">' + h(i[2]) + '</p></div>' + (i[3] ? '<a class="lnk" href="' + i[3] + '">' + i[4] + '</a>' : '') + '</div>'; }).join('') +
      '</section><section class="card" style="flex:2 1 340px" aria-labelledby="ra"><h2 id="ra">Recent activity</h2>' + acts + '</section></div>';
  }

  function pagesView() {
    var p = pageBy(S.path) || S.pages[0], c = current(p), f = filled(p), tok = p.tokens;
    var counts = { All: S.pages.length }; S.pages.forEach(function (x) { counts[x.kind] = (counts[x.kind] || 0) + 1; });
    var saved = JSON.parse(S.saved).pages || {};
    var list = S.pages.filter(function (x) { return (S.filter === 'All' || x.kind === S.filter) && (!S.q || (labelOf(x) + ' ' + x.path).toLowerCase().indexOf(S.q.toLowerCase()) >= 0); })
      .map(function (x) { var dirty = JSON.stringify(saved[x.path]) !== JSON.stringify(S.content.pages[x.path]); return '<a class="pitem" href="#page=' + encodeURIComponent(x.path) + '"' + (x.path === p.path ? ' aria-current="page"' : '') + '><b>' + h(labelOf(x)) + '</b><span>' + h(x.path) + (dirty ? ' · draft' : '') + '</span></a>'; }).join('');
    var meter = function (n, lo, hi, max) { var cls = n < lo || n > max ? 'err' : n > hi ? 'warn' : ''; return '<div class="meter ' + cls + '"><i style="width:' + Math.min(100, Math.round(n / hi * 100)) + '%"></i></div>'; };
    var cnt = function (n, lo, hi, max) { return '<span class="count num ' + (n < lo || n > max ? 'err' : n > hi ? 'warn' : 'ok') + '">' + n + ' / ' + hi + ' characters</span>'; };
    var toks = '<div class="toks">' + Object.keys(S.meta.tokens).map(function (k) { return '<button type="button" class="tok mono" data-tok="{' + k + '}" title="' + h(S.meta.tokens[k] + ': ' + (tok[k] || '')) + '">{' + k + '}</button>'; }).join('') + '</div>';
    var seo = '<section class="card" style="display:flex;flex-direction:column;gap:20px" aria-labelledby="sr"><h2 id="sr">Search result</h2>' +
      '<div class="fld"><div class="fld-h"><label for="f-title">Meta title</label>' + cnt(len(f.title), 20, 65, 78) + '</div><input class="in mono" id="f-title" data-f="title" value="' + h(c.title) + '">' + meter(len(f.title), 20, 65, 78) + '<p class="reads">Today it reads: <b>' + h(f.title) + '</b></p></div>' +
      '<div class="fld"><div class="fld-h"><label for="f-description">Meta description</label>' + cnt(len(f.description), 70, 160, 175) + '</div><textarea class="ta mono" id="f-description" data-f="description" rows="3">' + h(c.description) + '</textarea>' + meter(len(f.description), 70, 160, 175) + '</div>' +
      '<div class="fld"><p class="note" style="font-weight:700">Insert today\'s value (fills in every day by itself). Click a token to add it where the cursor is.</p>' + toks + '</div>' +
      '<div class="g2"><div class="fld"><label for="f-slug" style="font-size:14px;font-weight:700">Page address</label><input class="in" id="f-slug" value="' + h(p.path) + '" readonly><p class="note">Locked, so old links and rankings keep working.</p></div>' +
      '<div class="fld"><label for="f-canon" style="font-size:14px;font-weight:700">Canonical</label><input class="in" id="f-canon" value="' + h(S.meta.siteUrl + p.path) + '" readonly><p class="note">Set automatically from the address.</p></div></div>' +
      '<label class="chk"><input type="checkbox" data-f="index"' + (c.noindex ? '' : ' checked') + '>Show in Google (index and sitemap)</label>' +
      '<div><button type="button" class="lnk" data-act="reset" data-keys="title,description,noindex">Reset title and description to the default</button></div></section>';
    var text = '<section class="card" style="display:flex;flex-direction:column;gap:16px" aria-labelledby="pt"><h2 id="pt">Page text</h2>' +
      '<div class="fld"><label for="f-h1" style="font-size:14px;font-weight:700">Heading (H1)</label><input class="in" id="f-h1" data-f="h1" value="' + h(c.h1) + '"><p class="reads">Reads: <b>' + h(f.h1) + '</b></p></div>' +
      '<div class="fld"><label for="f-extra" style="font-size:14px;font-weight:700">Extra text, shown above the questions</label><div class="toolbar" role="toolbar" aria-label="Text format"><button type="button" data-wrap="strong" aria-label="Bold">B</button><button type="button" data-wrap="em" aria-label="Italic"><i>I</i></button><button type="button" data-wrap="h2">H2</button><button type="button" data-wrap="p">Para</button><button type="button" data-wrap="li">List item</button><button type="button" data-wrap="a">Link</button></div><textarea class="ta mono" id="f-extra" data-f="extra" rows="8" placeholder="&lt;h2&gt;Buying gold in Chennai&lt;/h2&gt;&#10;&lt;p&gt;Most shops quote per sovereign…&lt;/p&gt;">' + h(c.extra) + '</textarea><p class="note">Allowed: headings, paragraphs, lists, bold, italic and links. Tokens work here too.</p></div>' +
      '<div><button type="button" class="lnk" data-act="reset" data-keys="h1,extra">Reset heading and text to the default</button></div></section>';
    var faq = '<section class="card" style="display:flex;flex-direction:column;gap:12px" aria-labelledby="fq"><h2 id="fq">Questions (FAQ)</h2><p class="lead">Shown on the page and sent to Google as FAQ schema. Tokens work here too.</p>' +
      c.faq.map(function (x, i) { return '<div class="faq-item"><div class="fld"><label for="q' + i + '" style="font-size:13px;font-weight:700">Question ' + (i + 1) + '</label><input class="in" id="q' + i + '" data-faq="' + i + '" data-k="q" value="' + h(x.q) + '"></div><div class="fld"><label for="a' + i + '" style="font-size:13px;font-weight:700">Answer</label><textarea class="ta" id="a' + i + '" rows="3" data-faq="' + i + '" data-k="a">' + h(x.a) + '</textarea></div><div class="bar"><button type="button" class="btn sm" data-fmove="' + i + '" data-dir="-1"' + (i ? '' : ' disabled') + '>Move up</button><button type="button" class="btn sm" data-fmove="' + i + '" data-dir="1"' + (i < c.faq.length - 1 ? '' : ' disabled') + '>Move down</button><button type="button" class="btn sm" data-fdel="' + i + '">Remove</button></div></div>'; }).join('') +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn" data-act="faq-add"' + (c.faq.length >= 20 ? ' disabled' : '') + '>Add a question</button><button type="button" class="lnk" data-act="reset" data-keys="faq">Reset questions to the default</button></div></section>';
    var checks = checksFor(p);
    var nOk = checks.filter(function (x) { return x[0] === 'ok'; }).length, nBad = checks.length - nOk;
    var side = '<section class="card" aria-labelledby="gp"><h2 id="gp" style="font-size:15px">Google preview</h2><div class="gp" style="margin-top:14px"><div class="site"><span style="width:26px;height:26px;border-radius:13px;background:#6E1A2A;display:flex;align-items:center;justify-content:center"><svg width="16" height="16" viewBox="0 0 36 36" aria-hidden="true"><path d="M11 21h14l-2.5-6h-9z" fill="#F2C35B"/></svg></span><span style="line-height:1.2"><b>Daily Gold Rate India</b><span>' + h(S.meta.siteUrl.replace(/^https?:\/\//, '') + (p.path === '/' ? '' : ' › ' + p.path.replace(/^\/|\/$/g, '').split('/').join(' › '))) + '</span></span></div><p class="gt">' + h(f.title) + '</p><p class="gd">' + h(f.description) + '</p></div></section>' +
      '<section class="card" aria-labelledby="ck"><h2 id="ck" style="font-size:15px">SEO checks <span style="font-weight:600;color:' + (checks.some(function (x) { return x[0] === 'err'; }) ? '#B42318' : '#1E7A46') + '">· ' + nOk + ' pass' + (nBad ? ', ' + nBad + ' to look at' : '') + '</span></h2><ul class="checks">' +
      checks.map(function (x) { return '<li><span class="i-' + x[0] + '">' + (x[0] === 'ok' ? '✓' : '!') + '</span><span>' + h(x[1]) + '</span></li>'; }).join('') + '</ul></section>' +
      '<p class="note">Publishing runs every check again on all pages. If one fails, nothing goes live.</p>';
    return '<div class="editor"><nav class="plist" aria-label="Pages"><label for="pq">Find a page</label><input class="in" id="pq" type="search" placeholder="Chennai, 22 carat, history…" value="' + h(S.q) + '">' +
      '<div class="chips">' + ['All', 'Rates', 'Cities', 'History', 'Other'].map(function (k) { return '<button type="button" class="chip' + (S.filter === k ? ' on' : '') + '" aria-pressed="' + (S.filter === k) + '" data-filter="' + k + '">' + k + ' ' + (counts[k] || 0) + '</button>'; }).join('') + '</div>' + list + '</nav>' +
      '<div class="pedit"><div class="top"><div><h1 style="font-size:24px">' + h(labelOf(p)) + '</h1><p><a href="' + h(S.meta.siteUrl + p.path) + '" target="_blank" rel="noopener">' + h(S.meta.siteUrl.replace(/^https?:\/\//, '') + p.path) + '</a></p></div><div class="actions">' + pubBtn() + '</div></div>' +
      '<div class="tabs" role="tablist" aria-label="Editor sections">' + [['seo', 'SEO'], ['text', 'Page text'], ['faq', 'FAQ (' + c.faq.length + ')']].map(function (t) { return '<button type="button" role="tab" class="tab' + (S.tab === t[0] ? ' on' : '') + '" aria-selected="' + (S.tab === t[0]) + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      (S.tab === 'seo' ? seo : S.tab === 'text' ? text : faq) + '</div>' +
      '<aside class="pside" aria-label="Preview and checks">' + side + '</aside></div>';
  }

  function ratesView() {
    var R = S.meta.rates, N = R.national, date = R.date, boards = S.content.cityBoards;
    var savedB = JSON.parse(S.saved).cityBoards || {};
    var logs = (S.activity || []).filter(function (a) { return /IBJA rates|Rates for/.test(a.message); }).slice(0, 5);
    if (!S.activity) api('activity').then(function (d) { S.activity = d.items || []; if (S.view === 'rates') render(); });
    var rows = S.meta.cities.map(function (c) {
      var b = boards[c.slug] || {}, e = (b.entries || {})[date] || {}, has = e['24K'] && e['22K'] && e['18K'];
      var dirty = JSON.stringify(savedB[c.slug]) !== JSON.stringify(boards[c.slug]);
      var src = b.source != null ? b.source : /^\[/.test(c.source) ? '' : c.source;
      var v = function (k) { return e[k] ? e[k] : ''; };
      var bad = has && !(e['24K'] > e['22K'] && e['22K'] > e['18K']);
      return '<tr><td><b>' + h(c.name) + '</b><br><span class="note">' + h(c.unit) + '</span></td>' +
        '<td><label class="sr" for="s-' + c.slug + '">' + h(c.name) + ' source</label><input class="in" id="s-' + c.slug + '" data-bsrc="' + c.slug + '" value="' + h(src) + '" placeholder="e.g. MJDTA board"></td>' +
        ['24K', '22K', '18K'].map(function (k) { return '<td><label class="sr" for="b-' + c.slug + k + '">' + h(c.name) + ' ' + k + ' per gram</label><input class="in n num" id="b-' + c.slug + k + '" inputmode="numeric" data-board="' + c.slug + '" data-k="' + k + '" value="' + v(k) + '" placeholder="' + (k === '22K' ? N['22K'].g : k === '24K' ? N['24K'].g : N['18K'].g) + '"></td>'; }).join('') +
        '<td class="num">' + (has ? (e['22K'] - N['22K'].g >= 0 ? '+' : '−') + '₹' + Math.abs(e['22K'] - N['22K'].g) : '–') + '</td>' +
        '<td>' + (bad ? '<span class="pill" style="background:#FBE7E4;color:#B42318">Check: 24K > 22K > 18K</span>' : has ? '<span class="pill loc">Local rate' + (dirty ? ', not published' : '') + '</span>' : '<span class="pill nat">National rate</span>') + '</td></tr>';
    }).join('');
    return '<div class="top"><div><h1>Rates and cities</h1><p>IBJA rates arrive by themselves. Add a city\'s own board rate here when you have it.</p></div><div class="actions"><button type="button" class="btn" data-act="fetch">Fetch IBJA now</button>' + pubBtn() + '</div></div>' +
      '<div class="row"><section class="card" style="flex:3 1 520px" aria-labelledby="ib"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center"><h2 id="ib">Today\'s IBJA rate · ' + h(new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })) + '</h2><span class="pill loc">' + h(sessionWord(R)) + '</span></div>' +
      '<div class="rates4"><div class="rate"><p class="k">24K · 999</p><p class="v num">' + inr(N['24K'].g) + '</p></div><div class="rate"><p class="k">22K · 916</p><p class="v num" style="color:#6E1A2A">' + inr(N['22K'].g) + '</p></div><div class="rate"><p class="k">18K · 750</p><p class="v num">' + inr(N['18K'].g) + '</p></div><div class="rate"><p class="k">Silver · 1 kg</p><p class="v num">' + inr(R.silverPerKg) + '</p></div></div>' +
      '<p class="note" style="margin-top:16px">Source: ibjarates.com · updated ' + h(when(R.updatedAt)) + ' · next fetch ' + h(nextFetch()) + '</p></section>' +
      '<section class="card" style="flex:2 1 320px" aria-labelledby="fl"><h2 id="fl">Fetch log</h2>' + (logs.length ? logs.map(function (a) { return '<div class="log"><p class="t">' + h(a.message) + '</p><p class="d">' + h(when(a.at)) + '</p></div>'; }).join('') : '<p class="note">' + (S.activity ? 'No fetches on this branch yet.' : 'Loading…') + '</p>') + '</section></div>' +
      '<section class="card" aria-labelledby="cb"><h2 id="cb">City board rates for ' + h(new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })) + '</h2><p class="lead">Per gram. Type all three to show a city\'s own rate beside IBJA; leave empty and the page shows the national rate, labelled. Then press Publish.</p>' +
      '<div class="tblw"><table class="t"><thead><tr><th scope="col">City</th><th scope="col">Source</th><th scope="col">24K</th><th scope="col">22K</th><th scope="col">18K</th><th scope="col">22K vs IBJA</th><th scope="col">On the site</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }

  function render() {
    var keep = document.activeElement && document.activeElement.id, sel = keep && document.activeElement.selectionStart;
    app.innerHTML = shell(S.view === 'pages' ? pagesView() : S.view === 'rates' ? ratesView() : dashboard());
    if (keep) { var el = document.getElementById(keep); if (el) { el.focus(); try { if (sel != null) el.setSelectionRange(sel, sel); } catch (e) { /* not a text field */ } } }
  }

  /* ---------- events ---------- */
  var lastField = null;
  app.addEventListener('focusin', function (e) { if (e.target.matches('[data-f="title"],[data-f="description"],[data-f="h1"],[data-f="extra"],[data-faq]')) lastField = e.target.id; });
  app.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'pq') { S.q = t.value; render(); return; }
    if (t.dataset.f && t.dataset.f !== 'index') { setField(S.path, t.dataset.f, t.value); render(); return; }
    if (t.dataset.faq != null) { var c = current(pageBy(S.path)), list = clone(c.faq); list[+t.dataset.faq][t.dataset.k] = t.value; setField(S.path, 'faq', list); render(); return; }
    if (t.dataset.board) {
      var b = S.content.cityBoards[t.dataset.board] = S.content.cityBoards[t.dataset.board] || { entries: {} };
      b.entries = b.entries || {};
      var d = S.meta.rates.date, e2 = b.entries[d] = b.entries[d] || {}, n = Number(String(t.value).replace(/[₹,\s]/g, ''));
      if (n > 0) e2[t.dataset.k] = n; else delete e2[t.dataset.k];
      if (!Object.keys(e2).length) delete b.entries[d];
      if (!Object.keys(b.entries).length && !b.source) delete S.content.cityBoards[t.dataset.board];
      saveDraft(); render(); return;
    }
    if (t.dataset.bsrc) {
      var bb = S.content.cityBoards[t.dataset.bsrc] = S.content.cityBoards[t.dataset.bsrc] || { entries: {} };
      if (t.value.trim()) bb.source = t.value; else delete bb.source;
      if (!bb.source && !Object.keys(bb.entries || {}).length) delete S.content.cityBoards[t.dataset.bsrc];
      saveDraft(); render();
    }
  });
  app.addEventListener('change', function (e) { if (e.target.dataset.f === 'index') { setField(S.path, 'noindex', !e.target.checked); render(); } });
  app.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    var act = t.dataset.act, p = pageBy(S.path);
    if (t.dataset.filter) { S.filter = t.dataset.filter; render(); }
    else if (t.dataset.tab) { S.tab = t.dataset.tab; render(); }
    else if (t.dataset.tok) {
      var el = document.getElementById(lastField || 'f-title'); if (!el) return;
      var s = el.selectionStart != null ? el.selectionStart : el.value.length, v = el.value.slice(0, s) + t.dataset.tok + el.value.slice(el.selectionEnd != null ? el.selectionEnd : s);
      el.value = v; el.dispatchEvent(new Event('input', { bubbles: true }));
      var again = document.getElementById(el.id); if (again) { again.focus(); again.setSelectionRange(s + t.dataset.tok.length, s + t.dataset.tok.length); }
    } else if (t.dataset.wrap) {
      var x = document.getElementById('f-extra'), a = x.selectionStart, b2 = x.selectionEnd, mid = x.value.slice(a, b2) || 'text', tag = t.dataset.wrap;
      var wrapped = tag === 'a' ? '<a href="https://">' + mid + '</a>' : tag === 'li' ? '<ul><li>' + mid + '</li></ul>' : '<' + tag + '>' + mid + '</' + tag + '>';
      x.value = x.value.slice(0, a) + wrapped + x.value.slice(b2); x.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (t.dataset.fdel != null) { var l = clone(current(p).faq); l.splice(+t.dataset.fdel, 1); setField(S.path, 'faq', l); render(); }
    else if (t.dataset.fmove != null) { var l2 = clone(current(p).faq), i = +t.dataset.fmove, j = i + Number(t.dataset.dir), tmp = l2[i]; l2[i] = l2[j]; l2[j] = tmp; setField(S.path, 'faq', l2); render(); }
    else if (act === 'faq-add') { var l3 = clone(current(p).faq); l3.push({ q: '', a: '' }); setField(S.path, 'faq', l3); render(); var q = document.getElementById('q' + (l3.length - 1)); if (q) q.focus(); }
    else if (act === 'reset') { t.dataset.keys.split(',').forEach(function (k) { var o = S.content.pages[S.path]; if (o) delete o[k]; if (o && !Object.keys(o).length) delete S.content.pages[S.path]; }); saveDraft(); render(); }
    else if (act === 'publish') publish();
    else if (act === 'discard') { if (window.confirm('Discard all unpublished changes?')) { S.content = JSON.parse(S.saved); store.del(draftKey()); render(); } }
    else if (act === 'fetch') { t.disabled = true; api('fetch-rates', { method: 'POST' }).then(function (d) { toast(d._status === 200 ? 'Started. New IBJA rates in about 3 minutes.' : d.error || 'Could not start the fetch.', d._status !== 200); t.disabled = false; }); }
    else if (act === 'logout') api('logout', { method: 'POST' }).then(function () { login(); });
  });
  window.addEventListener('beforeunload', function (e) { if (S.content && pending()) { e.preventDefault(); e.returnValue = ''; } });

  boot();
})();
