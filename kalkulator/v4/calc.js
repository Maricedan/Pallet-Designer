/* Pallet Designer benefits calculator - the model and the form plumbing (fourth round).
   Plain script, no build step: exposes window.PDCalc. Works from disk and from an http preview.
   The model is described for the owner in model.md (this folder); keep the two in step.
   Earlier rounds keep their own copies: ../calc.js (third, the published one), ../v2/calc.js,
   ../v1/calc.js. */
(function (global) {
  'use strict';

  var DAY_HOURS = 8;        // one person-day
  var STORAGE_KEY = 'pd-kalkulator-v4';
  var NBSP = ' ';
  var NONE = '–';      // shown where a figure has no data behind it
  var NO_DATA = 'brak danych';
  var PARTS = ['nowPlan', 'nowRobot', 'nowPlc', 'nowCheck'];
  var DEV = ['devUi', 'devAlgo', 'devValid', 'devDocs'];
  var MODS = ['variants', 'recipes', 'offers', 'trips', 'trials'];

  // kind: count | min | hours | rate | pln      range: [min, max, step] of the slider
  // def: the example the field starts with; null = the field starts empty (no data)
  // grp: the part of the page that switches the field on (parts, total, cfg, or a module)
  // ours: a time on the Pallet Designer side - our assumption, marked "przyjęte", not an example
  function F(def, kind, max, unit, label, hint, range, extra) {
    var f = { def: def, kind: kind, max: max, unit: unit, label: label, hint: hint || '', range: range || null };
    for (var k in extra || {}) f[k] = extra[k];
    return f;
  }

  // Labels and hints are interface text: short, impersonal phrases.
  // Every time is kept in the unit of its field and turned into minutes inside compute().
  var FIELDS = {
    // one more layout for a commissioned machine: the team's joint time today
    nowTotal: F(240, 'min', 6000, 'min', 'Łączny czas pracy zespołu, jeden układ', '', [0, 960, 5], { grp: 'total', unitOpt: 'nowUnit' }),
    nowPlan: F(30, 'min', 6000, 'min', 'Planowanie odłożeń', 'podział warstwy, orientacje chwytaka, kolejność', [0, 300, 5], { grp: 'parts' }),
    nowRobot: F(60, 'min', 6000, 'min', 'Przygotowanie robota', 'współrzędne, obroty, funkcje lub obsługa generatora', [0, 300, 5], { grp: 'parts' }),
    nowPlc: F(60, 'min', 6000, 'min', 'Przygotowanie PLC/HMI', 'receptura, tablice danych, podgląd', [0, 300, 5], { grp: 'parts' }),
    nowCheck: F(90, 'min', 6000, 'min', 'Sprawdzenie i poprawki', 'weryfikacja danych, wyszukiwanie i poprawianie parametrów', [0, 300, 5], { grp: 'parts' }),
    // one joint run, not a sum of the robot's and the PLC programmer's times
    pdMin: F(3, 'min', 600, 'min', 'Czas z Pallet Designerem, łącznie', 'do zmiany, np. przy dłuższym przesyłaniu plików', [1, 30, 1], { ours: true }),

    machines: F(3, 'count', 500, 'w roku', 'Nowe maszyny', 'paletyzacja lub depaletyzacja', [0, 20, 1]),
    layouts: F(7, 'count', 500, 'układów', 'Układy na jedną maszynę, średnio', 'z wariantami dla różnych odbiorców', [1, 40, 1]),
    reworks: F(6, 'count', 5000, 'w roku', 'Dodatkowe przygotowania po zmianach w trakcie projektów', 'tylko nieuwzględnione wyżej', [0, 60, 1]),
    requests: F(6, 'count', 5000, 'w roku', 'Nowe układy i zmiany na pracujących maszynach', 'tylko nieuwzględnione wyżej', [0, 60, 1]),
    rate: F(100, 'rate', 5000, 'PLN/h', 'Koszt własny roboczogodziny', '', [50, 400, 10]),

    // the visitor's own configurator for the end customer: hours of development, typed by them
    // (no examples of ours: there is no source for how long such a tool takes to build)
    devUi: F(null, 'hours', 20000, 'h', 'Interfejs i obsługa układów', '', null, { grp: 'cfg' }),
    devAlgo: F(null, 'hours', 20000, 'h', 'Algorytmy i generowanie danych', '', null, { grp: 'cfg' }),
    devValid: F(null, 'hours', 20000, 'h', 'Walidacja i komunikaty', '', null, { grp: 'cfg' }),
    devDocs: F(null, 'hours', 20000, 'h', 'Dokumentacja i utrzymanie', '', null, { grp: 'cfg' }),
    devRemain: F(null, 'hours', 20000, 'h', 'Dopasowanie gotowego rozwiązania do maszyny', 'praca, która zostaje: odejmowana', null, { grp: 'cfg' }),
    cfgSales: F(1, 'count', 500, 'szt.', 'Planowane sprzedaże', '', [0, 10, 1], { grp: 'cfg' }),
    cfgPrice: F(45000, 'pln', 10000000, 'PLN', 'Planowana cena dla klienta', '', [0, 100000, 5000], { grp: 'cfg' }),

    varCount: F(6, 'count', 5000, 'w roku', 'Analizy wariantów', 'tylko nieuwzględnione w przygotowaniu układów', [0, 60, 1], { grp: 'variants' }),
    varNow: F(30, 'min', 6000, 'min', 'Czas jednej analizy, dziś', '', [0, 300, 5], { grp: 'variants' }),
    varPd: F(10, 'min', 600, 'min', 'Czas jednej analizy, z Pallet Designerem', '', [0, 60, 1], { grp: 'variants', ours: true }),

    recNow: F(40, 'hours', 5000, 'h', 'Czas dziś, jedna maszyna', 'adaptacja obecnego standardu', [0, 200, 5], { grp: 'recipes' }),
    recPd: F(8, 'hours', 5000, 'h', 'Z modułami Pallet Designera, jedna maszyna', '', [0, 80, 1], { grp: 'recipes', ours: true }),

    offCount: F(8, 'count', 5000, 'w roku', 'Oferty i dokumentacje z układami palet', '', [0, 60, 1], { grp: 'offers' }),
    offNow: F(165, 'min', 6000, 'min', 'Czas dziś, jedna', 'warianty palet, materiały dla klienta', [0, 480, 5], { grp: 'offers' }),
    offPd: F(10, 'min', 600, 'min', 'Z Pallet Designerem, jedna', '', [0, 60, 1], { grp: 'offers', ours: true }),

    // a trip is two things kept apart: money spent (travel, nights) and the people's hours
    tripCount: F(5, 'count', 5000, 'w roku', 'Wyjazdy możliwe do uniknięcia', 'poprawka danych albo nowy układ', [0, 30, 1], { grp: 'trips' }),
    tripExpense: F(850, 'pln', 1000000, 'PLN', 'Wydatki jednego wyjazdu', 'dojazd i noclegi, bez roboczogodzin', [0, 5000, 50], { grp: 'trips' }),
    tripHours: F(13, 'hours', 2000, 'h', 'Roboczogodziny jednego wyjazdu', 'droga i praca u klienta, wszystkie osoby', [0, 80, 1], { grp: 'trips' }),

    trialCount: F(6, 'count', 5000, 'w roku', 'Próby i poprawki możliwe do uniknięcia', 'tylko nieuwzględnione wcześniej', [0, 60, 1], { grp: 'trials' }),
    trialMin: F(90, 'min', 6000, 'min', 'Czas jednej, łącznie osób', '', [0, 480, 5], { grp: 'trials' })
  };

  // [value, label, hint under the buttons]. workMode changes the hint only, never the result.
  var OPTIONS = {
    workMode: [
      ['manual', 'Dane przygotowywane ręcznie', 'Do czasu: podział warstwy, współrzędne i obroty, receptura, podgląd, sprawdzenie.'],
      ['copy', 'Kopiowanie wcześniejszych projektów', 'Do czasu także: dopasowanie funkcji, poprawianie danych, weryfikacja.'],
      ['generator', 'Własne generatory', 'Do czasu także: przygotowanie wejścia, dostosowanie narzędzia, przypadki poza generatorem.']
    ],
    cfg: [
      ['yes', 'Tak, potrzebna funkcja', 'Dwie niezależne pozycje, bez wspólnej sumy.'],
      ['optional', 'Opcja w ofercie', 'Dwie niezależne pozycje, bez wspólnej sumy. Liczba sprzedaży: według planu.'],
      ['no', 'Nie w tym scenariuszu', 'Poza rachunkiem. Pozostałe wyniki bez zmian.']
    ]
  };
  var NO_CHOICE = {
    workMode: 'Wybór zmienia podpowiedź, nie wynik.',
    cfg: 'Bez odpowiedzi: poza rachunkiem.'
  };

  // yearly items of recovered time; "layouts" is the main one, the rest are modules
  var ITEMS = {
    layouts: 'Przygotowanie układów',
    variants: 'Chwytaki i warianty układu',
    recipes: 'Obsługa receptur i standard PLC–robot',
    offers: 'Ofertowanie i dokumentacja',
    trips: 'Wyjazdy',
    trials: 'Dodatkowe próby i poprawki'
  };
  var ITEM_FIELDS = {
    variants: ['varCount', 'varNow', 'varPd'],
    recipes: ['machines', 'recNow', 'recPd'],
    offers: ['offCount', 'offNow', 'offPd'],
    trips: ['tripCount', 'tripExpense', 'tripHours'],
    trials: ['trialCount', 'trialMin']
  };
  var CFG_FIELDS = DEV.concat(['devRemain', 'cfgSales', 'cfgPrice']);

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

  // 150 -> "2 h 30 min", -2 -> "−2 min"
  function duration(min) {
    var m = Math.round(Math.abs(min));
    var h = Math.floor(m / 60);
    m -= h * 60;
    var s = h ? group(String(h), NBSP) + NBSP + 'h' + (m ? ' ' + m + NBSP + 'min' : '') : m + NBSP + 'min';
    return (min < 0 && (h || m) ? '−' : '') + s;
  }

  // Polish plural: 1 maszyna, 2 maszyny, 5 maszyn, 1,5 maszyny
  function plural(n, one, few, many) {
    if (n % 1 !== 0) return few;
    if (n === 1) return one;
    var d = n % 10, t = n % 100;
    return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
  }

  function personDays(n) {
    if (n % 1 !== 0) return 'osobodnia';
    return n === 1 ? 'osobodzień' : 'osobodni';
  }

  function fmtInput(n, kind) {
    var s = String(Math.round(n * 100) / 100).replace('.', ',');
    return kind === 'pln' ? group(s, ' ') : s;
  }

  // Float noise must not push a value across a rounding boundary.
  function money(x) {
    return Math.round(parseFloat(x.toFixed(6)));
  }

  function round2(x) {
    return Math.round(x * 100) / 100;
  }

  // minutes per unit shown in a field whose unit the visitor switches (min / h)
  function unitFactor(id) {
    var f = FIELDS[id];
    return f.unitOpt && opts[f.unitOpt] === 'h' ? 60 : 1;
  }

  /* Reads what a person typed. An empty field is "no data": it does not fall back to the
     example. Text and negative numbers are no data too, and are marked; a value over the
     field's limit is cut to the limit and marked. */
  function parse(text, id) {
    var f = FIELDS[id];
    var s = String(text == null ? '' : text).replace(/[\s  ]/g, '');
    if (s === '') return { value: null, status: 'empty' };
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) {
      // both marks present: the last one is the decimal mark
      var thousands = s.lastIndexOf(',') > s.lastIndexOf('.') ? '.' : ',';
      s = s.split(thousands).join('');
    } else if (f.kind === 'pln' && /^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');   // "12.000" typed as twelve thousand
    }
    s = s.replace(',', '.');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { value: null, status: 'invalid' };
    var n = round2(parseFloat(s) * unitFactor(id));
    if (!isFinite(n)) return { value: null, status: 'invalid' };
    if (n > f.max) return { value: f.max, status: 'capped' };
    return { value: n, status: 'ok' };
  }

  /* ---------- the model ---------- */

  // A figure with no data behind it is null and stays null through the arithmetic.
  function known(x) { return x != null; }
  function mul(a, b) { return known(a) && known(b) ? a * b : null; }
  function sub(a, b) { return known(a) && known(b) ? a - b : null; }
  // the sum of the terms that have data; null when none has
  function addKnown(list) {
    var s = null;
    list.forEach(function (x) { if (known(x)) s = (s || 0) + x; });
    return s;
  }

  function cfgOn(o) {
    return o.cfg === 'yes' || o.cfg === 'optional';
  }

  /* v: field values (null = no data), o: options. One unit of time inside: minutes.
     Nothing is cut at zero: less time today than with the program gives a negative result
     and the page shows it. */
  function compute(v, o) {
    var saved = sub(v.nowTotal, v.pdMin);                 // one layout
    var newLayouts = mul(v.machines, v.layouts);
    var prep = addKnown([newLayouts, v.reworks, v.requests]);   // preparations in a year

    var items = {};
    function item(id, on, min) {
      items[id] = { on: on, min: on ? min : null };
    }
    item('layouts', true, mul(prep, saved));
    item('variants', !!o.mods.variants, mul(v.varCount, sub(v.varNow, v.varPd)));
    item('recipes', !!o.mods.recipes, mul(v.machines, mul(sub(v.recNow, v.recPd), 60)));
    item('offers', !!o.mods.offers, mul(v.offCount, sub(v.offNow, v.offPd)));
    // the hours of a trip are counted here and nowhere else; its expenses are a separate figure
    item('trips', !!o.mods.trips, mul(v.tripCount, mul(v.tripHours, 60)));
    item('trials', !!o.mods.trials, mul(v.trialCount, v.trialMin));

    // every item is rounded to whole zlotys and the total is the sum of the items,
    // so the module cards and the summary add up to the figure in the result panel
    var yearMin = null, value = null, k, it;
    for (k in items) {
      it = items[k];
      it.pln = known(it.min) && known(v.rate) ? money(it.min / 60 * v.rate) : null;
      if (known(it.min)) yearMin = (yearMin || 0) + it.min;
      if (known(it.pln)) value = (value || 0) + it.pln;
    }
    var tripSpend = mul(v.tripCount, v.tripExpense);
    var expenses = o.mods.trips && known(tripSpend) ? money(tripSpend) : null;

    // the end customer's configurator: one-off development avoided, and revenue - kept apart
    // from each other and from the yearly result
    var on = cfgOn(o);
    var devGross = on ? addKnown(DEV.map(function (id) { return v[id]; })) : null;
    var devMin = known(devGross) ? (devGross - (v.devRemain || 0)) * 60 : null;
    var sales = mul(v.cfgSales, v.cfgPrice);

    return {
      saved: saved, newLayouts: newLayouts, prep: prep, machineMin: mul(v.layouts, saved),
      items: items, yearMin: yearMin, value: value, expenses: expenses,
      cfgOn: on, devGrossMin: mul(devGross, 60), devMin: devMin,
      devPln: known(devMin) && known(v.rate) ? money(devMin / 60 * v.rate) : null,
      revenue: on && known(sales) ? money(sales) : null
    };
  }

  /* ---------- state, kept in this browser together with every assumption ---------- */

  var values = {};      // field id -> number, or null when the field is empty
  var confirmed = {};   // field id -> true once the visitor typed, moved or accepted the value
  var opts = defaultOpts();
  var listeners = [];
  var inputs = [];
  var ranges = [];
  var tags = [];

  function defaults() {
    var o = {};
    for (var id in FIELDS) o[id] = FIELDS[id].def;
    return o;
  }

  function defaultOpts() {
    return { workMode: null, nowUnit: 'h', split: false, cfg: null, mods: {} };
  }

  function optionOk(key, val) {
    return OPTIONS[key].some(function (o) { return o[0] === val; });
  }

  function load() {
    values = defaults();
    confirmed = {};
    opts = defaultOpts();
    try {
      var saved = JSON.parse(global.localStorage.getItem(STORAGE_KEY) || '{}');
      var v = saved.v || {}, c = saved.c || {}, o = saved.o || {}, id, n;
      for (id in values) {
        if (!(id in v)) continue;
        n = v[id];
        if (n === null) values[id] = null;
        else if (typeof n === 'number' && isFinite(n) && n >= 0) values[id] = Math.min(n, FIELDS[id].max);
        if (c[id] === true) confirmed[id] = true;
      }
      if (optionOk('workMode', o.workMode)) opts.workMode = o.workMode;
      if (optionOk('cfg', o.cfg)) opts.cfg = o.cfg;
      if (o.nowUnit === 'min' || o.nowUnit === 'h') opts.nowUnit = o.nowUnit;
      opts.split = o.split === true;
      MODS.forEach(function (m) { if (o.mods && o.mods[m] === true) opts.mods[m] = true; });
      if (opts.split) values.nowTotal = addKnown(PARTS.map(get));
    } catch (e) { /* storage unavailable or damaged: the examples apply */ }
  }

  function save() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: values, c: confirmed, o: opts }));
    } catch (e) { /* not kept */ }
  }

  function get(id) {
    return values[id];
  }

  // 'przykład': our example, not yet changed or accepted; 'przyjęte': our assumption on the
  // Pallet Designer side; '': the visitor's own value, or an empty field
  function tagOf(id) {
    if (values[id] == null || confirmed[id]) return '';
    return FIELDS[id].ours ? 'przyjęte' : 'przykład';
  }

  function isExample(id) {
    return tagOf(id) === 'przykład';
  }

  function groupOn(grp) {
    if (!grp) return true;
    if (grp === 'parts') return opts.split;
    if (grp === 'total') return !opts.split;
    if (grp === 'cfg') return cfgOn(opts);
    return !!opts.mods[grp];
  }

  // the fields behind one yearly item, as counted now
  function itemFields(id) {
    if (id !== 'layouts') return ITEM_FIELDS[id];
    return (opts.split ? PARTS : ['nowTotal']).concat(['pdMin', 'machines', 'layouts', 'reworks', 'requests']);
  }

  // examples of ours that the figures on the page still stand on
  function examplesInUse() {
    var ids = itemFields('layouts').concat(['rate']);
    MODS.forEach(function (m) { if (opts.mods[m]) ids = ids.concat(ITEM_FIELDS[m]); });
    if (cfgOn(opts)) ids = ids.concat(CFG_FIELDS);
    return ids.filter(function (id, i) { return ids.indexOf(id) === i && isExample(id); });
  }

  function mark(ids) {
    return ids.some(isExample) ? 'przykład' : '';
  }

  /* The total and its breakdown say the same thing at every moment: with the breakdown on,
     the total is the sum of the parts and cannot be typed; turning it on spreads the total
     over the parts in their present proportions. */
  function splitTotal() {
    var total = values.nowTotal;
    var sum = addKnown(PARTS.map(get));
    if (total == null || total === sum) {
      values.nowTotal = sum;
      return;
    }
    var w = PARTS.map(function (id) { return values[id] || 0; });
    var wsum = w.reduce(function (a, b) { return a + b; }, 0);
    if (!wsum) {
      w = PARTS.map(function (id) { return FIELDS[id].def; });
      wsum = w.reduce(function (a, b) { return a + b; }, 0);
    }
    var left = total;
    PARTS.forEach(function (id, i) {
      var part = i === PARTS.length - 1 ? left : Math.min(left, Math.round(total * w[i] / wsum));
      values[id] = round2(part);
      left = round2(left - part);
      if (confirmed.nowTotal) confirmed[id] = true; else delete confirmed[id];
    });
  }

  function set(id, n, src) {
    values[id] = n;
    confirmed[id] = true;
    if (opts.split && PARTS.indexOf(id) >= 0) values.nowTotal = addKnown(PARTS.map(get));
    changed(src, false);
  }

  // accepts an example as the visitor's own value
  function confirm(id) {
    if (values[id] == null || FIELDS[id].ours) return;
    confirmed[id] = true;
    changed(null, false);
  }

  function setOpt(key, val) {
    if (key === 'split') {
      val = !!val;
      if (val && !opts.split) splitTotal();
      if (!val && opts.split) {
        if (PARTS.some(isExample)) delete confirmed.nowTotal; else confirmed.nowTotal = true;
      }
    }
    opts[key] = val;
    changed(null, true);
  }

  function setMod(id, on) {
    opts.mods[id] = !!on;
    changed(null, true);
  }

  function changed(src, force) {
    save();
    refreshInputs(src, force);
    notify();
  }

  function reset() {
    values = defaults();
    confirmed = {};
    opts = defaultOpts();
    changed(null, true);
  }

  /* ---------- texts ---------- */

  function valueText(id) {
    var f = FIELDS[id], n = values[id];
    if (n == null) return NO_DATA;
    if (f.kind === 'min') return duration(n);
    if (f.kind === 'count') return fmtInput(n, f.kind);
    return fmtInput(n, f.kind) + NBSP + f.unit;
  }

  function hoursText(min) {
    return min == null ? NONE : hours(min / 60) + NBSP + 'h';
  }

  function prepFormula() {
    function c(id) { return values[id] == null ? NONE : fmtInput(values[id], 'count'); }
    return c('machines') + ' × ' + c('layouts') + ' + ' + c('reworks') + ' + ' + c('requests');
  }

  // how one yearly item came about, with the visitor's numbers
  function itemFormula(id, r) {
    var v = values;
    function c(fid) { return v[fid] == null ? NONE : fmtInput(v[fid], 'count'); }
    function t(fid) { return v[fid] == null ? NONE : (FIELDS[fid].kind === 'min' ? duration(v[fid]) : fmtInput(v[fid], 'hours') + NBSP + 'h'); }
    switch (id) {
      case 'layouts': return (r.prep == null ? NONE : fmtInput(r.prep, 'count')) + ' × ' + (r.saved == null ? NONE : duration(r.saved));
      case 'variants': return c('varCount') + ' × (' + t('varNow') + ' − ' + t('varPd') + ')';
      case 'recipes': return c('machines') + ' × (' + t('recNow') + ' − ' + t('recPd') + ')';
      case 'offers': return c('offCount') + ' × (' + t('offNow') + ' − ' + t('offPd') + ')';
      case 'trips': return c('tripCount') + ' × ' + t('tripHours');
      default: return c('trialCount') + ' × ' + t('trialMin');
    }
  }

  // Strings for the [data-out] slots of the page.
  function texts(r) {
    var v = values, o = opts, m = {}, k, it;
    function p(n) { return n == null ? NONE : pln(n); }
    function d(min) { return min == null ? NONE : duration(min); }

    OPTIONS.workMode.concat(OPTIONS.cfg).forEach(function (x) {
      if (o.workMode === x[0]) m.modeHint = x[2];
      if (o.cfg === x[0]) m.cfgHint = x[2];
    });
    if (!m.modeHint) m.modeHint = NO_CHOICE.workMode;
    if (!m.cfgHint) m.cfgHint = NO_CHOICE.cfg;

    m.pd = d(v.pdMin);
    m.barNow = v.nowTotal == null ? NO_DATA : duration(v.nowTotal) + ' pracy zespołu';
    m.barPd = d(v.pdMin);
    m.saved = d(r.saved);
    m.exNow = mark(o.split ? PARTS : ['nowTotal']) ? 'czas obecny: wartość przykładowa, nie norma branżowa' : '';
    m.partsSum = o.split ? 'suma czynności: ' + d(v.nowTotal) : 'czynności poza rachunkiem: liczy się czas łączny';
    m.prepLine = 'Przygotowania w roku: ' + prepFormula() + ' = ' + (r.prep == null ? NONE : fmtInput(r.prep, 'count'));

    m['s.one'] = d(r.saved);
    m['s.machine'] = d(r.machineMin);
    m['s.machineSub'] = v.layouts == null ? 'brak liczby układów' :
      fmtInput(v.layouts, 'count') + ' ' + plural(v.layouts, 'układ', 'układy', 'układów') + ' jednej maszyny';
    m['s.year'] = hoursText(r.items.layouts.min);
    m['s.yearSub'] = r.items.layouts.pln == null ? 'odzyskany czas w roku' : pln(r.items.layouts.pln) + NBSP + 'PLN w roku';

    var h = r.yearMin == null ? null : r.yearMin / 60;
    m.hours = h == null ? NONE : hours(h);
    var days = h == null ? null : Math.round(h / DAY_HOURS * 10) / 10;
    m.daysLine = days == null ? 'brak danych do wyniku' : hours(days) + ' ' + personDays(days) + ' po ' + DAY_HOURS + NBSP + 'h';
    m.value = p(r.value);
    m.valueSub = v.rate == null ? 'brak kosztu godziny' : 'przy ' + fmtInput(v.rate, 'rate') + NBSP + 'PLN/h';
    m.expenses = p(r.expenses);
    m.expensesSub = !o.mods.trips ? 'moduł wyjazdów wyłączony' : r.expenses == null ? NO_DATA : 'dojazdy i noclegi';
    m.revenue = p(r.revenue);
    m.revenueSub = !r.cfgOn ? 'poza rachunkiem' : r.revenue == null ? NO_DATA :
      fmtInput(v.cfgSales, 'count') + ' × ' + pln(v.cfgPrice) + NBSP + 'PLN';
    m.dev = r.devMin == null ? NONE : hours(r.devMin / 60);
    m.devSub = !r.cfgOn ? 'poza rachunkiem' : r.devMin == null ? 'brak godzin rozwoju' :
      r.devPln == null ? 'raz, nie co roku' : pln(r.devPln) + NBSP + 'PLN, raz';
    m.devLine = !r.cfgOn ? '' : r.devMin == null ? 'uniknięta praca: ' + NO_DATA :
      v.devRemain == null ? 'uniknięta praca: ' + hoursText(r.devMin) + ', bez odjęcia dopasowania' :
      'uniknięta praca: ' + hoursText(r.devGrossMin) + ' − ' + hoursText(v.devRemain * 60) + ' = ' + hoursText(r.devMin);
    // the chips on the two configurator cards
    m.devChip = !r.cfgOn ? 'poza rachunkiem' : r.devMin == null ? NO_DATA : hoursText(r.devMin);
    m.devChipSub = r.devPln == null ? '' : pln(r.devPln) + NBSP + 'PLN, raz';
    m.revChip = !r.cfgOn ? 'poza rachunkiem' : r.revenue == null ? NO_DATA : pln(r.revenue) + NBSP + 'PLN';
    m.revChipSub = r.revenue == null ? '' : 'potencjalny przychód';

    for (k in r.items) {
      it = r.items[k];
      m['m.' + k + '.pln'] = !it.on ? 'poza rachunkiem' : it.pln == null ? NO_DATA : pln(it.pln) + NBSP + 'PLN';
      m['m.' + k + '.h'] = !it.on ? '' : it.min == null ? '' : hoursText(it.min) + ' w roku';
    }
    m.tripLine = 'uniknięte wydatki: ' + (r.expenses == null ? NONE : pln(r.expenses) + NBSP + 'PLN') + ' w roku';

    var ex = examplesInUse().length;
    m.exLine = ex ? 'wartości przykładowe w rachunku: ' + ex : 'rachunek na własnych wartościach';
    m.mbar = 'Odzyskany czas: ' + (h == null ? NO_DATA : hours(h) + NBSP + 'h rocznie');
    return m;
  }

  /* Everything the result stands on, for the page's summary, the print and the text file:
     sections of rows { label, value, mark }. The number of rows never changes. */
  function summary(r) {
    var v = values, o = opts, t = texts(r);
    function row(label, value, mk) { return { label: label, value: value, mark: mk || '' }; }
    function field(label, id) { return row(label, valueText(id), tagOf(id)); }
    function chosen(key, none) {
      var hit = OPTIONS[key].filter(function (x) { return x[0] === o[key]; })[0];
      return hit ? hit[1] : none;
    }
    function itemRow(id) {
      var it = r.items[id];
      if (!it.on) return row(ITEMS[id], 'poza rachunkiem');
      var s = itemFormula(id, r) + ' = ' + hoursText(it.min);
      if (it.pln != null) s += ', ' + pln(it.pln) + NBSP + 'PLN';
      return row(ITEMS[id], s, mark(itemFields(id).concat(['rate'])));
    }

    // values stay short: on the page a row of the summary is one line and never changes height
    var nowIds = o.split ? PARTS : ['nowTotal'];
    var parts = !o.split ? 'bez rozbicia' : PARTS.map(function (id) {
      return v[id] == null ? NONE : fmtInput(v[id], 'min');
    }).join(' + ') + NBSP + 'min';
    var expText = !o.mods.trips ? 'moduł wyjazdów wyłączony' : r.expenses == null ? NO_DATA :
      fmtInput(v.tripCount, 'count') + ' × ' + pln(v.tripExpense) + NBSP + 'PLN = ' + pln(r.expenses) + NBSP + 'PLN';
    var devText = !r.cfgOn ? 'poza rachunkiem' : r.devMin == null ? NO_DATA :
      hoursText(r.devMin) + (r.devPln == null ? '' : ', ' + pln(r.devPln) + NBSP + 'PLN');
    var revText = !r.cfgOn ? 'poza rachunkiem' : r.revenue == null ? NO_DATA :
      t.revenueSub + ' = ' + pln(r.revenue) + NBSP + 'PLN';

    return [
      { title: 'Jeden układ', rows: [
        row('Obecny sposób pracy', chosen('workMode', 'nie wskazano')),
        row('Czas obecny, łącznie zespół', valueText('nowTotal'), mark(nowIds)),
        row('Czynności: planowanie, robot, PLC/HMI, sprawdzenie', parts),
        field('Czas z Pallet Designerem, łącznie', 'pdMin'),
        row('Różnica na układ', t.saved)
      ] },
      { title: 'Skala roczna', rows: [
        field('Nowe maszyny w roku', 'machines'),
        field('Układy na jedną maszynę, średnio', 'layouts'),
        field('Dodatkowe przygotowania po zmianach w projektach, w roku', 'reworks'),
        field('Nowe układy i zmiany na pracujących maszynach, w roku', 'requests'),
        row('Przygotowania w roku', prepFormula() + ' = ' + (r.prep == null ? NONE : fmtInput(r.prep, 'count'))),
        row('Koszt własny roboczogodziny', v.rate == null ? NO_DATA : fmtInput(v.rate, 'rate') + NBSP + 'PLN/h', tagOf('rate'))
      ] },
      { title: 'Wynik roczny', rows: [
        row('Odzyskany czas', r.yearMin == null ? NO_DATA : t.hours + NBSP + 'h (' + t.daysLine + ')'),
        row('Wartość odzyskanego czasu', r.value == null ? NO_DATA : t.value + NBSP + 'PLN'),
        row('Uniknięte wydatki: dojazdy i noclegi', expText, o.mods.trips ? mark(['tripCount', 'tripExpense']) : '')
      ].concat(Object.keys(ITEMS).map(itemRow)) },
      { title: 'Konfigurator dla klienta końcowego', rows: [
        row('Samodzielne dodawanie układów przez klienta', chosen('cfg', 'bez odpowiedzi')),
        row('Uniknięta praca rozwojowa: raz, nie co roku', devText),
        row('Potencjalny przychód, przed kosztami dostarczenia', revText, r.cfgOn ? mark(['cfgSales', 'cfgPrice']) : '')
      ] }
    ];
  }

  var DISCLAIMER = 'Potencjał korzyści przed kosztami zakupu i wdrożenia. Odzyskany czas to dostępność zespołu, nie zawsze niższe wydatki na wynagrodzenia.';

  function today() {
    var d = new Date();
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return { pl: two(d.getDate()) + '.' + two(d.getMonth() + 1) + '.' + d.getFullYear(),
      iso: d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) };
  }

  // the summary as plain text, for the downloaded file
  function summaryText(r) {
    var out = ['Pallet Designer - kalkulator korzyści', 'Podsumowanie z dnia ' + today().pl, ''];
    summary(r).forEach(function (s) {
      out.push(s.title.toUpperCase());
      s.rows.forEach(function (x) { out.push('  ' + x.label + ': ' + x.value + (x.mark ? ' [' + x.mark + ']' : '')); });
      out.push('');
    });
    out.push('[przykład] - wartość przykładowa, niepotwierdzona; [przyjęte] - założenie po stronie Pallet Designera.');
    out.push(DISCLAIMER);
    out.push('');
    out.push('Następny krok: sprawdzenie tych założeń na własnym układzie podczas demonstracji.');
    out.push('kontakt@palletdesigner.com · palletdesigner.com');
    return out.join('\r\n').replace(/ /g, ' ');
  }

  /* ---------- the form ---------- */

  function notify() {
    var r = compute(values, opts);
    var t = texts(r);
    syncControls();
    listeners.forEach(function (fn) { fn(r, t); });
  }

  function shown(id) {
    return values[id] == null ? null : round2(values[id] / unitFactor(id));
  }

  // Writes the state back into the fields and sliders other than the one being used.
  function refreshInputs(src, force) {
    inputs.forEach(function (inp) {
      var id = inp.getAttribute('data-field');
      var f = FIELDS[id];
      var want = values[id];
      inp.disabled = !groupOn(f.grp);
      inp.classList.toggle('mine', want != null && !!confirmed[id]);
      inp.classList.toggle('exv', isExample(id));
      if (inp === src) return;
      if (!force) {
        if (inp === document.activeElement) return;
        if (parse(inp.value, id).value === want) return;
      }
      inp.value = want == null ? '' : fmtInput(shown(id), f.kind);
      inp.classList.remove('bad');
      inp.removeAttribute('title');
    });
    ranges.forEach(function (rng) {
      var id = rng.getAttribute('data-range');
      rng.disabled = !groupOn(FIELDS[id].grp);
      if (rng === src) return;
      rng.value = String(values[id] == null ? rng.min : values[id]);   // the browser keeps it inside min..max
    });
    tags.forEach(function (tag) {
      var id = tag.getAttribute('data-ex');
      // a field that is switched off carries no mark
      var s = groupOn(FIELDS[id].grp) ? tagOf(id) : '';
      if (tag.textContent !== s) tag.textContent = s;
      tag.classList.toggle('ours', !!FIELDS[id].ours);
      tag.disabled = !!FIELDS[id].ours;
    });
  }

  // pressed states of the option buttons, and the parts of the page that are switched off
  function syncControls() {
    all('[data-opt]').forEach(function (btn) {
      var key = btn.getAttribute('data-opt');
      var on = btn.hasAttribute('data-val') ? opts[key] === btn.getAttribute('data-val') : !!opts[key];
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    all('[data-mod-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', opts.mods[btn.getAttribute('data-mod-toggle')] ? 'true' : 'false');
    });
    all('[data-mod]').forEach(function (el) { el.classList.toggle('on', !!opts.mods[el.getAttribute('data-mod')]); });
    all('[data-group]').forEach(function (el) { el.classList.toggle('off', !groupOn(el.getAttribute('data-group'))); });
    all('[data-unit-of]').forEach(function (el) {
      var s = unitFactor(el.getAttribute('data-unit-of')) === 60 ? 'h' : 'min';
      if (el.textContent !== s) el.textContent = s;
    });
  }

  function onInput(e) {
    var inp = e.target;
    var id = inp.getAttribute('data-field');
    var p = parse(inp.value, id);
    var bad = p.status === 'invalid' || p.status === 'capped';
    inp.classList.toggle('bad', bad);
    if (p.status === 'capped') inp.title = 'Maks.: ' + fmtInput(FIELDS[id].max / unitFactor(id), FIELDS[id].kind);
    else if (bad) inp.title = 'Błędna wartość: ' + NO_DATA;
    else inp.removeAttribute('title');
    set(id, p.value, inp);
  }

  function onRange(e) {
    set(e.target.getAttribute('data-range'), parseFloat(e.target.value), e.target);
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  // <div data-slot="machines" [data-label] [data-hint] [data-plain]> becomes a field:
  // label, slider, number, unit and the "przykład" mark. data-plain leaves the slider out.
  function fieldMarkup(id, o) {
    var f = FIELDS[id];
    var label = o.label != null ? o.label : f.label;
    var hint = o.hint != null ? o.hint : f.hint;
    var plain = o.plain != null || !f.range;
    var slider = plain ? '' :
      '<input type="range" data-range="' + id + '" min="' + f.range[0] + '" max="' + f.range[1] + '" step="' + f.range[2] +
      '" aria-label="' + esc(label) + ', suwak">';
    return '<div class="fld' + (plain ? ' plain' : '') + '">' +
      '<label class="fld-l" for="f-' + id + '">' + esc(label) + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</label>' +
      slider +
      '<span class="fld-i"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="' + NONE +
      '" id="f-' + id + '" data-field="' + id + '"><i>' + esc(f.unit) + '</i>' +
      '<button type="button" class="ex" data-ex="' + id + '" title="Wartość przykładowa. Kliknięcie: potwierdzenie"></button></span></div>';
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
    // <div data-seg="cfg"> becomes the row of buttons of that option
    all('[data-seg]').forEach(function (el) {
      var key = el.getAttribute('data-seg');
      el.innerHTML = OPTIONS[key].map(function (o) {
        return '<button type="button" data-opt="' + key + '" data-val="' + o[0] + '" aria-pressed="false">' + esc(o[1]) + '</button>';
      }).join('');
    });
    inputs = all('input[data-field]');
    ranges = all('input[data-range]');
    tags = all('[data-ex]');
    inputs.forEach(function (inp) { inp.addEventListener('input', onInput); });
    ranges.forEach(function (rng) { rng.addEventListener('input', onRange); });
    tags.forEach(function (tag) { tag.addEventListener('click', function () { confirm(tag.getAttribute('data-ex')); }); });
    all('[data-opt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-opt');
        if (!btn.hasAttribute('data-val')) return setOpt(key, !opts[key]);
        var val = btn.getAttribute('data-val');
        // a unit is always one of the two; a choice can be taken back by a second click
        setOpt(key, key in OPTIONS && opts[key] === val ? null : val);
      });
    });
    all('[data-mod-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-mod-toggle');
        setMod(id, !opts.mods[id]);
      });
    });
    all('[data-action="reset"]').forEach(function (btn) { btn.addEventListener('click', reset); });
    refreshInputs(null, true);
  }

  // Sets the text of every [data-out="key"] element that has a value in the map; marks the
  // element when there is no data behind it, or when the figure is below zero.
  function fill(map) {
    all('[data-out]').forEach(function (el) {
      var key = el.getAttribute('data-out');
      if (!(key in map)) return;
      var s = map[key];
      if (el.textContent !== s) el.textContent = s;
      el.toggleAttribute('data-empty', s === NONE);
      el.toggleAttribute('data-neg', s.charAt(0) === '−');
    });
  }

  function start(render) {
    load();
    mount();
    listeners.push(render);
    notify();
  }

  global.PDCalc = {
    FIELDS: FIELDS, OPTIONS: OPTIONS, ITEMS: ITEMS, MODS: MODS, PARTS: PARTS, DISCLAIMER: DISCLAIMER,
    defaults: defaults, defaultOpts: defaultOpts, compute: compute, parse: parse,
    summary: summary, summaryText: summaryText, today: today,
    pln: pln, num: num, hours: hours, duration: duration,
    start: start, fill: fill, reset: reset, set: set, setOpt: setOpt, setMod: setMod, confirm: confirm,
    examplesInUse: examplesInUse, tagOf: tagOf,
    get: get,
    values: function () { return values; },
    opts: function () { return opts; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
