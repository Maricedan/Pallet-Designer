/* Pallet Designer savings calculator - the model and the form plumbing (third round, one page).
   Plain script, no build step: exposes window.PDCalc. Works from disk and from an http preview.
   The model is described for the owner in model.md; keep the two in step.
   Earlier rounds keep their own copies: v1/calc.js, v2/calc.js. */
(function (global) {
  'use strict';

  var DAY_HOURS = 8;        // one working day
  var MONTH_HOURS = 160;    // one month of one person's work
  var STORAGE_KEY = 'pd-kalkulator-v3';
  var RATE_IDS = ['rateSales', 'rateDesign', 'ratePlc', 'rateRobot', 'rateSite'];
  var OFFICE = ['design', 'plc', 'robot'];
  var NBSP = ' ';

  // Minutes per pallet layout with Pallet Designer (owner, 2026-10-02). Ours to state, not the
  // visitor's to type.
  var PD_MIN = { design: 10, plc: 10, robot: 5, offer: 10 };
  // On site the station is verified once: one hour per machine, not per layout.
  var PD_SITE_MIN = 60;
  // Hours per machine for the program that handles recipes and layouts (PLC-robot data
  // exchange, recipe screens) when the ready blocks and screens are used.
  var PD_SYSTEM_HOURS = 8;

  // kind: count | min | hours | rate | pln | decimal      range: [min, max, step] of the slider
  // aid: a field of the trip helper, not part of the yearly result
  function F(def, kind, max, unit, label, hint, range, extra) {
    var f = { def: def, kind: kind, max: max, unit: unit, label: label, hint: hint || '', range: range || null };
    for (var k in extra || {}) f[k] = extra[k];
    return f;
  }

  // Labels and hints are interface text: short, impersonal phrases.
  var FIELDS = {
    projects: F(3, 'count', 500, 'w roku', 'Maszyny do paletyzacji lub depaletyzacji', 'pracujące już maszyny: punkt 4', [1, 20, 1]),
    layouts: F(7, 'count', 500, 'układów', 'Układy palet na jedną maszynę, średnio', 'z wariantami dla różnych odbiorców', [1, 40, 1]),

    // virtual: one field that writes all five rates
    rateAll: F(100, 'rate', 5000, 'PLN/h', 'Koszt godziny pracy inżyniera', 'koszt własny albo stawka fakturowana', [50, 400, 10]),
    rateSales: F(100, 'rate', 5000, 'PLN/h', 'Sprzedaż'),
    rateDesign: F(100, 'rate', 5000, 'PLN/h', 'Konstruktor'),
    ratePlc: F(100, 'rate', 5000, 'PLN/h', 'Automatyk PLC/HMI'),
    rateRobot: F(100, 'rate', 5000, 'PLN/h', 'Robotyk'),
    rateSite: F(100, 'rate', 5000, 'PLN/h', 'Uruchomienie'),

    // hours per machine: PLC and robot programmers together
    systemHours: F(40, 'hours', 5000, 'h', 'Czas dziś, jedna maszyna', 'programiści PLC i robota łącznie', [0, 200, 5]),

    // minutes one pallet layout takes today, stage by stage; sliders move by 5 minutes
    designNow: F(30, 'min', 6000, 'min', 'Czas dziś, jeden układ', 'rysunek, chwytak, liczba odłożeń', [0, 180, 5]),
    plcNow: F(60, 'min', 6000, 'min', 'Czas dziś, jeden układ', 'tablice, zakresy, obraz na panel, próbne wczytanie', [0, 180, 5]),
    robotNow: F(60, 'min', 6000, 'min', 'Czas dziś, jeden układ', 'pobrania, pozycje chwytaka, kolejność', [0, 180, 5]),
    siteNow: F(90, 'min', 6000, 'min', 'Czas dziś, jeden układ', 'zła pozycja, obrót, zakres', [0, 300, 5]),

    reworks: F(2, 'count', 500, 'na maszynę', 'Zmiany na jedną maszynę', '', [0, 10, 1]),
    requests: F(6, 'count', 5000, 'w roku', 'Prośby o zmianę albo nowy układ', 'nowe kartony, marki własne, nowi odbiorcy', [0, 40, 1]),
    trips: F(5, 'count', 5000, 'w roku', 'Wyjazdy możliwe do uniknięcia', 'poprawka błędu albo nowy układ', [0, 30, 1]),
    tripCost: F(3000, 'pln', 1000000, 'PLN', 'Koszt jednego wyjazdu', 'dojazd, ludzie, nocleg', [500, 10000, 100]),

    offers: F(8, 'count', 5000, 'w roku', 'Oferty z paletyzacją lub depaletyzacją', '', [0, 60, 1]),
    offerNow: F(165, 'min', 6000, 'min', 'Czas dziś, układ do jednej oferty', '', [0, 180, 5]),

    cfgMachines: F(1, 'count', 500, 'w roku', 'Maszyny sprzedane z konfiguratorem', '', [0, 10, 1]),
    cfgPrice: F(45000, 'pln', 10000000, 'PLN', 'Pozycja w wycenie jednej maszyny', 'zwykle 25-100 tys. PLN', [25000, 100000, 5000]),

    // trip helper: works out one trip and writes it into tripCost on request
    aidKm: F(400, 'count', 20000, 'km', 'Dojazd w obie strony', '', null, { aid: true }),
    aidKmRate: F(1.15, 'decimal', 100, 'PLN/km', 'Koszt kilometra', 'stawka z rozporządzenia, stan na 2023 r.', null, { aid: true }),
    aidDriveHours: F(5, 'hours', 200, 'h', 'Czas w drodze w obie strony', '', null, { aid: true }),
    aidDriveRate: F(100, 'rate', 5000, 'PLN/h', 'Godzina w drodze', 'może być niższa niż na obiekcie', null, { aid: true }),
    aidSiteHours: F(8, 'hours', 1000, 'h', 'Praca u klienta', 'stawką uruchomienia', null, { aid: true }),
    aidPeople: F(1, 'count', 50, 'os.', 'Osoby', '', null, { aid: true }),
    aidNights: F(1, 'count', 60, 'noc.', 'Noclegi', '', null, { aid: true }),
    aidNightCost: F(300, 'pln', 10000, 'PLN', 'Nocleg, jedna noc', 'za granicą też w złotych', null, { aid: true }),
    aidDayPln: F(45, 'pln', 10000, 'PLN', 'Dieta w Polsce, doba', 'stan na 2023 r.', null, { aid: true }),
    aidDayEur: F(49, 'decimal', 1000, 'EUR', 'Dieta za granicą, doba', 'Niemcy, stan na 2023 r.', null, { aid: true }),
    aidEur: F(4.25, 'decimal', 100, 'PLN', 'Kurs euro', 'aktualny', null, { aid: true }),
    aidAbroad: F(0, 'count', 1, '', 'Wyjazd za granicę', '', null, { aid: true })
  };

  var EVENTS = {
    system: 'Program obsługi receptur',
    layout: 'Nowe układy w projektach',
    rework: 'Zmiany w trakcie projektu',
    request: 'Zmiany po uruchomieniu',
    trip: 'Wyjazdy do klienta',
    offer: 'Układy do ofert'
  };

  /* ---------- numbers: Polish in, Polish out ---------- */

  function group(s, sep) {
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var parts = s.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return (neg ? '−' : '') + parts.join(',');
  }

  // whole zlotys, space as the thousands separator
  function pln(n) {
    return group(String(Math.round(n)), NBSP);
  }

  function num(n, decimals) {
    return group(n.toFixed(decimals).replace('.', ','), NBSP);
  }

  // one decimal at most, none when the value is whole
  function hours(n) {
    var r = Math.round(n * 10) / 10;
    return num(r, r % 1 === 0 ? 0 : 1);
  }

  // 150 -> "2 h 30 min"
  function duration(min) {
    var m = Math.round(min);
    var h = Math.floor(m / 60);
    m -= h * 60;
    if (!h) return m + NBSP + 'min';
    return group(String(h), NBSP) + NBSP + 'h' + (m ? ' ' + m + NBSP + 'min' : '');
  }

  // Polish plural: 1 maszyna, 2 maszyny, 5 maszyn, 1,5 maszyny
  function plural(n, one, few, many) {
    if (n % 1 !== 0) return few;
    if (n === 1) return one;
    var d = n % 10, t = n % 100;
    return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
  }

  function fmtInput(n, kind) {
    var s = String(Math.round(n * 100) / 100).replace('.', ',');
    return kind === 'pln' ? group(s, ' ') : s;
  }

  // Float noise must not push a value across a rounding boundary.
  function money(x) {
    return Math.round(parseFloat(x.toFixed(6)));
  }

  /* Reads what a person typed. An empty field counts as the start value (shown as the
     placeholder); text and negative numbers count as 0 and are marked; a value over the
     field's limit is cut to the limit and marked. */
  function parse(text, id) {
    var f = FIELDS[id];
    var s = String(text == null ? '' : text).replace(/[\s  ]/g, '');
    if (s === '') return { value: f.def, status: 'empty' };
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) {
      // both marks present: the last one is the decimal mark
      var thousands = s.lastIndexOf(',') > s.lastIndexOf('.') ? '.' : ',';
      s = s.split(thousands).join('');
    } else if (f.kind === 'pln' && /^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');   // "12.000" typed as twelve thousand
    }
    s = s.replace(',', '.');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { value: 0, status: 'invalid' };
    var n = parseFloat(s);
    if (!isFinite(n)) return { value: 0, status: 'invalid' };
    if (n > f.max) return { value: f.max, status: 'capped' };
    return { value: n, status: 'ok' };
  }

  /* ---------- the model ---------- */

  function compute(v) {
    var counts = {
      layout: v.projects * v.layouts,
      rework: v.projects * v.reworks,
      request: v.requests,
      offer: v.offers
    };
    var rate = { sales: v.rateSales, design: v.rateDesign, plc: v.ratePlc, robot: v.rateRobot, site: v.rateSite };
    var now = { design: v.designNow, plc: v.plcNow, robot: v.robotNow };

    var lines = [];
    var line = {};
    function add(event, part, hoursSaved, plnSaved) {
      // every line is rounded to whole zlotys and totals are sums of lines,
      // so the cards and the rows of the result add up to the same total
      var l = { id: event + '.' + part, event: event, hoursSaved: hoursSaved, plnSaved: money(plnSaved) };
      lines.push(l);
      line[l.id] = l;
    }
    // A saving never goes below zero: less time today than with the program counts as no gain.
    function stage(event, dept) {
      var h = counts[event] * Math.max(0, now[dept] - PD_MIN[dept]) / 60;
      add(event, dept, h, h * rate[dept]);
    }

    // once per machine: the joint work of the PLC and the robot programmers
    var systemHours = v.projects * Math.max(0, v.systemHours - PD_SYSTEM_HOURS);
    add('system', 'all', systemHours, systemHours * (rate.plc + rate.robot) / 2);
    OFFICE.forEach(function (d) { stage('layout', d); });
    // on site: today every layout is tried, with the program the station is verified once
    var siteHours = v.projects * Math.max(0, v.layouts * v.siteNow - PD_SITE_MIN) / 60;
    add('layout', 'site', siteHours, siteHours * rate.site);
    // a layout changed during the project, or asked for after commissioning, repeats the office
    // work of a new one; the on-site trial is not repeated
    OFFICE.forEach(function (d) { stage('rework', d); });
    OFFICE.forEach(function (d) { stage('request', d); });
    // trips the visitor counts as avoidable: a fix of a layout error, or a new layout
    add('trip', 'all', 0, v.trips * v.tripCost);
    var offerHours = counts.offer * Math.max(0, v.offerNow - PD_MIN.offer) / 60;
    add('offer', 'sales', offerHours, offerHours * rate.sales);

    var events = {}, savings = 0, hoursSaved = 0, k;
    for (k in EVENTS) events[k] = { plnSaved: 0, hoursSaved: 0 };
    lines.forEach(function (l) {
      events[l.event].plnSaved += l.plnSaved;
      events[l.event].hoursSaved += l.hoursSaved;
      savings += l.plnSaved;
      hoursSaved += l.hoursSaved;
    });
    var revenue = money(v.cfgMachines * v.cfgPrice);

    return {
      lines: lines, line: line, events: events,
      savings: savings, hours: hoursSaved, revenue: revenue, total: savings + revenue,
      layoutsYear: counts.layout
    };
  }

  // One trip worked out from the helper's fields.
  function tripFromAid(v) {
    var day = v.aidAbroad ? v.aidDayEur * v.aidEur : v.aidDayPln;
    return money(v.aidKm * v.aidKmRate +
      v.aidPeople * (v.aidDriveHours * v.aidDriveRate + v.aidSiteHours * v.rateSite) +
      v.aidPeople * v.aidNights * v.aidNightCost +
      v.aidPeople * (v.aidNights + 1) * day);
  }

  // Strings for the [data-out] slots of the page.
  function texts(r) {
    var m = {
      savings: pln(r.savings), revenue: pln(r.revenue), total: pln(r.total),
      hoursLine: hours(r.hours) + NBSP + 'h pracy w roku',
      daysLine: 'ok. ' + num(r.hours / DAY_HOURS, 0) + ' dni roboczych, ' + num(r.hours / MONTH_HOURS, 1) + ' miesiąca jednej osoby',
      layoutsYear: 'razem ' + hours(r.layoutsYear) + ' ' + plural(r.layoutsYear, 'układ', 'układy', 'układów') + ' w roku',
      cfgLine: hours(values.cfgMachines) + ' ' + plural(values.cfgMachines, 'maszyna', 'maszyny', 'maszyn') + ' × ' + pln(values.cfgPrice) + NBSP + 'PLN',
      tripAid: pln(tripFromAid(values))
    }, k;
    for (k in r.events) {
      m['e.' + k + '.pln'] = pln(r.events[k].plnSaved);
      m['e.' + k + '.h'] = hours(r.events[k].hoursSaved) + NBSP + 'h w roku';
    }
    r.lines.forEach(function (l) {
      m['l.' + l.id + '.pln'] = pln(l.plnSaved);
      m['l.' + l.id + '.h'] = hours(l.hoursSaved) + NBSP + 'h w roku';
    });
    return m;
  }

  /* ---------- state, kept in this browser ---------- */

  var values = {};
  var listeners = [];
  var inputs = [];
  var ranges = [];

  function defaults() {
    var o = {};
    for (var id in FIELDS) if (id !== 'rateAll') o[id] = FIELDS[id].def;
    return o;
  }

  function load() {
    values = defaults();
    try {
      var saved = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || '{}');
      for (var id in values) {
        var n = saved[id];
        if (typeof n === 'number' && isFinite(n) && n >= 0) values[id] = Math.min(n, FIELDS[id].max);
      }
    } catch (e) { /* storage unavailable or damaged: the start values apply */ }
  }

  function save() {
    try { global.localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch (e) { /* not kept */ }
  }

  function notify() {
    var r = compute(values);
    var t = texts(r);
    Array.prototype.forEach.call(document.querySelectorAll('[data-eq]'), function (el) {
      // the hours next to a minutes field; under an hour the field says it all
      var min = values[el.getAttribute('data-eq')];
      var s = min >= 60 ? '= ' + duration(min) : '';
      if (el.textContent !== s) el.textContent = s;
    });
    listeners.forEach(function (fn) { fn(r, t); });
  }

  function set(id, n, src) {
    if (id === 'rateAll') RATE_IDS.forEach(function (rid) { values[rid] = n; });
    else values[id] = n;
    save();
    refreshInputs(src, false);
    notify();
  }

  function shown(id) {
    if (id !== 'rateAll') return values[id];
    var first = values[RATE_IDS[0]];
    return RATE_IDS.every(function (rid) { return values[rid] === first; }) ? first : null;
  }

  // Writes the state back into the fields and sliders other than the one being used.
  function refreshInputs(src, force) {
    inputs.forEach(function (inp) {
      var id = inp.getAttribute('data-field');
      var f = FIELDS[id];
      var want = shown(id);
      inp.classList.toggle('mine', want !== f.def);
      if (inp === src) return;
      if (!force) {
        if (inp === document.activeElement) return;
        if (want !== null && parse(inp.value, id).value === want) return;
      }
      inp.value = want === null ? '' : fmtInput(want, f.kind);
      inp.placeholder = want === null ? 'różne' : fmtInput(f.def, f.kind);
      inp.classList.remove('bad');
      inp.removeAttribute('title');
    });
    ranges.forEach(function (rng) {
      if (rng === src) return;
      var want = shown(rng.getAttribute('data-range'));
      if (want !== null) rng.value = String(want);   // the browser keeps it inside min..max
    });
  }

  function onInput(e) {
    var inp = e.target;
    var id = inp.getAttribute('data-field');
    var p = parse(inp.value, id);
    var bad = p.status === 'invalid' || p.status === 'capped';
    inp.classList.toggle('bad', bad);
    if (p.status === 'capped') inp.title = 'Maks.: ' + fmtInput(FIELDS[id].max, FIELDS[id].kind);
    else if (bad) inp.title = 'Błędna wartość: liczone jako 0';
    else inp.removeAttribute('title');
    set(id, p.value, inp);
  }

  function onRange(e) {
    set(e.target.getAttribute('data-range'), parseFloat(e.target.value), e.target);
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  // <div data-slot="projects" [data-label] [data-hint] [data-plain]> becomes a field:
  // label, slider, number. data-plain leaves the slider out (small fields in a row).
  function fieldMarkup(id, o) {
    var f = FIELDS[id];
    var label = o.label != null ? o.label : f.label;
    var hint = o.hint != null ? o.hint : f.hint;
    var plain = o.plain != null || !f.range;
    var slider = plain ? '' :
      '<input type="range" data-range="' + id + '" min="' + f.range[0] + '" max="' + f.range[1] + '" step="' + f.range[2] +
      '" aria-label="' + esc(label) + ', suwak">';
    var eq = f.kind === 'min' ? '<em data-eq="' + id + '"></em>' : '';
    return '<div class="fld' + (plain ? ' plain' : '') + '">' +
      '<label class="fld-l" for="f-' + id + '">' + esc(label) + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</label>' +
      slider +
      '<span class="fld-i"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" id="f-' + id +
      '" data-field="' + id + '"><i>' + esc(f.unit) + '</i>' + eq + '</span></div>';
  }

  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  function mount() {
    all('[data-slot]').forEach(function (el) {
      el.outerHTML = fieldMarkup(el.getAttribute('data-slot'), {
        label: el.getAttribute('data-label'), hint: el.getAttribute('data-hint'), plain: el.getAttribute('data-plain')
      });
    });
    // the times counted with the program, shown on the cards
    var pdMin = { office: PD_MIN.design + PD_MIN.plc + PD_MIN.robot, site: PD_SITE_MIN, system: PD_SYSTEM_HOURS * 60 };
    all('[data-pd]').forEach(function (el) {
      var k = el.getAttribute('data-pd');
      el.textContent = duration(k in PD_MIN ? PD_MIN[k] : pdMin[k]);
    });
    inputs = all('input[data-field]');
    ranges = all('input[data-range]');
    inputs.forEach(function (inp) { inp.addEventListener('input', onInput); });
    ranges.forEach(function (rng) { rng.addEventListener('input', onRange); });
    refreshInputs(null, true);
    all('[data-action="reset"]').forEach(function (btn) { btn.addEventListener('click', reset); });
  }

  function reset() {
    values = defaults();
    save();
    refreshInputs(null, true);
    notify();
  }

  // Sets the text of every [data-out="key"] element that has a value in the map.
  function fill(map) {
    all('[data-out]').forEach(function (el) {
      var key = el.getAttribute('data-out');
      if (key in map && el.textContent !== map[key]) el.textContent = map[key];
    });
  }

  function start(render) {
    load();
    mount();
    listeners.push(render);
    notify();
  }

  global.PDCalc = {
    FIELDS: FIELDS, EVENTS: EVENTS, PD_MIN: PD_MIN, PD_SITE_MIN: PD_SITE_MIN, PD_SYSTEM_HOURS: PD_SYSTEM_HOURS,
    defaults: defaults, compute: compute, parse: parse, tripFromAid: tripFromAid,
    pln: pln, num: num, hours: hours, duration: duration,
    start: start, fill: fill, reset: reset, set: set,
    get: function (id) { return values[id]; },
    values: function () { return values; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
