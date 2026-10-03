/* Pallet Designer benefits calculator - the model and the form plumbing (seventh round).
   Plain script, no build step: exposes window.PDCalc. Works from disk and from an http preview;
   node loads it too (test.js checks the model).
   The sixth round (../v6) with the owner's decisions of 2026-10-03 on its simplifications: the
   parts of the calculation are rows of one list that unfold on a click, one cost and one time
   of a trip serve both changes and errors, the two questions that changed no figure are gone,
   a plant that orders its layouts outside still spends time handing the layout over and sees
   the fees first, and the cost of building an own configurator is no figure any more (7.1).
   The model is described for the owner in model.md (this folder); keep the two in step.
   Earlier rounds keep their own copies: ../v6, ../v5, ../v4, ../calc.js (third), ../v2, ../v1.
   Texts follow the site: a block of text never ends with a full stop. */
(function (global) {
  'use strict';

  var MODEL_VERSION = '7.1';
  // the one set of starting values (FIELDS below); model.md says where each comes from
  var DEFAULTS_VERSION = '2026-10-03';
  var APP_ID = 'pallet-designer-kalkulator';
  var STORAGE_KEY = 'pd-kalkulator-v7';
  var DAY_HOURS = 8;        // one person-day
  var NBSP = ' ';
  var NONE = '–';           // shown where a figure has no data behind it
  var NO_DATA = 'brak danych';
  var OFF = 'poza kalkulacją';
  var CUR = 'zł';
  var TOTAL = 'i_current_min';
  var PARTS = ['i_plan_min', 'i_robot_min', 'i_plc_min', 'i_check_min'];
  var PART_NAMES = ['Odłożenia', 'Robot', 'PLC/HMI', 'Sprawdzenie'];

  // kind: count | min | hours | rate | cash | days
  // def: the value the field starts with
  // max: the largest value the field takes; dec: decimals kept (0 = whole numbers only)
  // range: [min, max, step] of the slider - a convenience, the field itself takes more
  // extra.grp: the part of the page that switches the field on
  // extra.help: the longer description behind the "i" button
  function F(def, kind, max, dec, unit, label, hint, range, extra) {
    var f = { def: def, kind: kind, max: max, dec: dec, unit: unit, label: label, hint: hint || '', range: range || null };
    for (var k in extra || {}) f[k] = extra[k];
    return f;
  }

  // Labels, hints and help are interface text: short, impersonal phrases. A hint only where
  // the label alone would be read wrongly.
  var FIELDS = {
    /* integrator: one more layout, and the scale of a year */
    i_current_min: F(180, 'min', 9600, 1, 'min', 'Łączny obecny czas na nowy układ', '', [0, 480, 15], { unitOpt: 'i_unit',
      help: 'Odłożenia, dane robota i PLC/HMI, wprowadzenie danych, sprawdzenie i poprawki. Godzina wspólnej pracy dwóch osób to 2 godziny' }),
    i_plan_min: F(30, 'min', 9600, 1, 'min', 'Podział warstwy na odłożenia i kolejność', '', [0, 120, 5]),
    i_robot_min: F(90, 'min', 9600, 1, 'min', 'Pozycje, obroty, dane lub funkcje robota', '', [0, 480, 15]),
    i_plc_min: F(40, 'min', 9600, 1, 'min', 'Receptura, dane PLC/HMI i ich wprowadzenie', '', [0, 240, 5]),
    i_check_min: F(20, 'min', 9600, 1, 'min', 'Sprawdzenie spójności i poprawki danych', '', [0, 120, 5]),
    i_pd_min: F(3, 'min', 9600, 1, 'min', 'Czas z Pallet Designerem', 'jeden wspólny przebieg', [0, 30, 1]),
    i_machines: F(3, 'count', 1000, 0, 'w roku', 'Nowe maszyny', '', [0, 20, 1]),
    i_layouts: F(7, 'count', 1000, 1, 'układów', 'Układy na maszynę, średnio', '', [0, 30, 1], {
      help: 'Odrębne przygotowania danych. Receptura użyta ponownie bez zmian nie jest kolejnym układem' }),
    i_rate: F(120, 'rate', 10000, 2, CUR + '/h', 'Koszt godziny pracy zespołu', 'koszt własny firmy', [0, 300, 10], { grp: 'i_money' }),

    /* integrator: the ready configurator as an item of the offer - revenue, kept apart */
    i_cfg_sales: F(1, 'count', 1000, 0, 'w roku', 'Sprzedaże pakietu', '', [0, 20, 1]),
    i_cfg_price: F(45000, 'cash', 10000000, 2, CUR, 'Cena pakietu netto', '', [0, 100000, 1000]),

    /* integrator: changes and errors, each with the number of trips it takes today; what one
       trip costs and how long it takes is given once, for both */
    i_changes_count: F(12, 'count', 10000, 0, 'w roku', 'Zmiany do obsłużenia', 'każda to kolejny układ', [0, 50, 1]),
    i_changes_trips: F(6, 'count', 1000, 0, 'w roku', 'Wyjazdy przy zmianach', 'koszt i czas: wiersz „Jeden wyjazd”', [0, 30, 1]),
    i_errors_count: F(10, 'count', 10000, 0, 'w roku', 'Błędy w danych układów', '', [0, 50, 1]),
    i_errors_hours: F(3, 'hours', 1000, 1, 'h', 'Czas poprawy jednego błędu', 'od zrozumienia błędu do testu', [0, 24, 0.5], {
      help: 'Przygotowanie stanowiska i produktów, odnalezienie błędu, poprawka, wgranie danych i test. Test to także oczyszczenie i załadowanie transporterów, a potem rozebranie palety' }),
    i_errors_trips: F(5, 'count', 1000, 0, 'w roku', 'Wyjazdy przy błędach', 'koszt i czas: wiersz „Jeden wyjazd”', [0, 30, 1]),
    i_trip_cash: F(1500, 'cash', 100000, 2, CUR, 'Koszt jednego wyjazdu', 'dojazd i nocleg', [0, 5000, 100], {
      help: 'Dojazd i nocleg. Czas osoby w drodze i u klienta: w polu niżej' }),
    i_trip_hours: F(8, 'hours', 1000, 1, 'h', 'Czas jednego wyjazdu', 'jedna osoba, z dojazdem', [0, 40, 1]),

    /* integrator: the other areas of work */
    i_system_current_hours: F(16, 'hours', 2000, 1, 'h', 'Obecnie, jedna maszyna', '', [0, 80, 1]),
    i_system_pd_hours: F(4, 'hours', 2000, 1, 'h', 'Z Pallet Designerem, jedna maszyna', '', [0, 80, 1]),
    i_construct_current_min: F(120, 'min', 9600, 1, 'min', 'Obecnie, jedna maszyna', '', [0, 480, 15]),
    i_construct_pd_min: F(30, 'min', 9600, 1, 'min', 'Z Pallet Designerem, jedna maszyna', '', [0, 480, 15]),
    i_offer_count: F(8, 'count', 10000, 0, 'w roku', 'Opracowania ofertowe', '', [0, 50, 1]),
    i_offer_current_min: F(60, 'min', 9600, 1, 'min', 'Obecnie, jedno opracowanie', '', [0, 240, 5]),
    i_offer_pd_min: F(10, 'min', 9600, 1, 'min', 'Z Pallet Designerem, jedno opracowanie', '', [0, 240, 5]),
    i_trials_count: F(18, 'count', 1000000, 1, 'w roku', 'Powtarzane próby', 'np. maszyny × (układy − 1)', [0, 100, 1]),
    i_trials_current_min: F(60, 'min', 9600, 1, 'min', 'Obecnie, jedna próba', '', [0, 240, 5], {
      help: 'Praca ludzi przy próbie: przygotowanie produktów, oczyszczenie i załadowanie transporterów, próba, rozebranie palety' }),
    i_trials_pd_min: F(0, 'min', 9600, 1, 'min', 'Z Pallet Designerem, jedna próba', '', [0, 240, 5]),

    /* production plant: its own path, never added to the integrator's figures */
    p_rate: F(100, 'rate', 10000, 2, CUR + '/h', 'Koszt godziny pracy własnej', '', [0, 300, 10], { grp: 'p_money' }),
    p_pd_min: F(3, 'min', 9600, 1, 'min', 'Czas z Pallet Designerem', 'jeden wspólny przebieg', [0, 30, 1]),
    p_internal_count: F(12, 'count', 10000, 0, 'w roku', 'Układy i zmiany przygotowywane wewnętrznie', '', [0, 100, 1], { grp: 'p_internal' }),
    p_internal_current_min: F(120, 'min', 9600, 1, 'min', 'Obecny czas pracy na jeden układ', '', [0, 480, 15], { grp: 'p_internal' }),
    p_external_count: F(12, 'count', 10000, 0, 'w roku', 'Zlecenia u integratora', '', [0, 100, 1], { grp: 'p_external' }),
    p_external_fee: F(5000, 'cash', 100000, 2, CUR, 'Opłata za jedno zlecenie', 'netto, z przyjazdem integratora', [0, 10000, 250], { grp: 'p_external' }),
    // the integrator does the data, but the plant still has to work the layout out and hand it over
    p_external_internal_current_min: F(30, 'min', 9600, 1, 'min', 'Przekazanie układu integratorowi', 'praca własna, na jedno zlecenie', [0, 240, 5], { grp: 'p_external',
      help: 'Szkic lub opis układu, wymiary produktu i palety, mail lub rozmowa, odpowiedzi na pytania, sprawdzenie gotowych danych' }),
    p_wait_now_days: F(10, 'days', 365, 1, 'dni rob.', 'Oczekiwanie na nowy układ, obecnie', '', [0, 20, 1]),
    p_wait_after_days: F(1, 'days', 365, 1, 'dni rob.', 'Oczekiwanie po wdrożeniu', '', [0, 20, 1]),
    p_visits_count: F(2, 'count', 1000, 0, 'w roku', 'Wizyty serwisu', '', [0, 20, 1]),
    p_visits_fee: F(3000, 'cash', 100000, 2, CUR, 'Opłata za jedną wizytę', 'poza opłatą za zlecenie', [0, 10000, 250])
  };

  // [value, label, hint under the buttons]
  var OPTIONS = {
    aud: [
      ['integrator', 'Dla integratora', 'Integrator / producent maszyn'],
      ['plant', 'Dla zakładu produkcyjnego', 'Zakład produkcyjny']
    ],
    p_method: [
      ['internal', 'Własny zespół', 'Praca własnego zespołu: czas obecny obok czasu z Pallet Designerem'],
      ['external', 'Zewnętrzny integrator', 'Opłaty za usługę integratora i własna praca przy przekazaniu układu'],
      ['mixed', 'Część własna, część zewnętrzna', 'Dwie osobne grupy układów']
    ],
    i_unit: [['min', 'min'], ['h', 'h']]
  };
  var NO_CHOICE = {
    p_method: 'Wybór otwiera odpowiedni rachunek'
  };
  // the plant's yearly number of layouts: one group, or two halves when mixed
  var PLANT_EVENTS = { internal: 12, external: 12, mixed: 6 };

  // lines of the yearly result: label, the place on the page that holds their assumptions
  // and the switch that puts them into the calculation
  var LINES = {
    layouts: { label: 'Nowe układy', at: 'skala' },
    changes: { label: 'Zmiany', at: 'mod-changes', flag: 'i_changes_enabled' },
    errors: { label: 'Błędy', at: 'mod-errors', flag: 'i_errors_enabled' },
    system: { label: 'Standard receptur kolejnej maszyny', at: 'mod-system', flag: 'i_system_enabled' },
    construct: { label: 'Analiza wariantów chwytaka', at: 'mod-construct', flag: 'i_construct_enabled' },
    offer: { label: 'Opracowania ofertowe', at: 'mod-offer', flag: 'i_offer_enabled' },
    trials: { label: 'Powtarzane próby układów', at: 'mod-trials', flag: 'i_trials_enabled' },
    internal: { label: 'Praca własnego zespołu', at: 'mod-internal' },
    external: { label: 'Zlecenia zewnętrzne: praca własna', at: 'mod-external' },
    fees: { label: 'Opłaty za zlecenia', at: 'mod-external' },
    visits: { label: 'Wizyty serwisu', at: 'mod-visits', flag: 'p_visits_enabled' }
  };
  var TRIP_AT = 'row-trip';   // the row with the cost and the time of one trip
  var FLAGS = ['i_rev_enabled', 'i_changes_enabled', 'i_errors_enabled', 'i_system_enabled',
    'i_construct_enabled', 'i_offer_enabled', 'i_trials_enabled', 'p_visits_enabled'];

  /* ---------- numbers: Polish in, Polish out ---------- */

  // Float noise must not push a value across a rounding boundary.
  function clean(x) {
    return parseFloat(x.toFixed(6));
  }

  function round(n, dec) {
    var k = Math.pow(10, dec);
    return Math.round(clean(n * k)) / k;
  }

  function add(a, b) {
    return a + b;
  }

  function group(s) {
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var parts = s.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
    return (neg ? '−' : '') + parts.join(',');
  }

  // fixed decimals, comma, spaces in thousands; a value that rounds to zero carries no minus
  function num(n, dec) {
    var s = clean(n).toFixed(dec);
    if (parseFloat(s) === 0) s = (0).toFixed(dec);
    return group(s.replace('.', ','));
  }

  // as short as the value allows: 180, 2,5, 1 500,5
  function plain(n) {
    return group(String(round(n, 2)).replace('.', ','));
  }

  // the detail of the calculation: hours to 0,01 and whole zlotys
  function hoursD(h) {
    return num(h, 2) + NBSP + 'h';
  }

  function cashD(n) {
    return num(n, 0) + NBSP + CUR;
  }

  // 177 -> "2 godz. 57 min", 45 -> "45 min", -2 -> "−2 min"
  function duration(min) {
    var m = round(Math.abs(min), 1);
    var h = Math.floor(m / 60);
    var rest = round(m - h * 60, 1);
    var s = h ? plain(h) + NBSP + 'godz.' + (rest ? ' ' + plain(rest) + NBSP + 'min' : '') : plain(rest) + NBSP + 'min';
    return (min < 0 && m ? '−' : '') + s;
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

  /* The main figures are rounded and carry "około": hours to a whole hour (minutes under one
     hour), person-days to 0,1, money to 100 zł (to 1 zł under 100 zł). A small value never
     shows as zero. Returns the three parts of the figure: prefix, number, unit. */
  function approxTime(h) {
    var a = Math.abs(clean(h)), sign = h < 0 ? '−' : '';
    if (a === 0) return { pre: '', n: '0', unit: 'h' };
    if (a < 1) {
      var m = Math.round(clean(a * 60));
      return m < 1 ? { pre: '', n: sign + 'poniżej 1', unit: 'min' } : { pre: 'około', n: sign + m, unit: 'min' };
    }
    return { pre: 'około', n: sign + group(String(Math.round(a))), unit: 'h' };
  }

  function approxCash(n) {
    var a = Math.abs(clean(n)), sign = n < 0 ? '−' : '';
    if (a === 0) return { pre: '', n: '0', unit: CUR };
    if (a < 0.5) return { pre: '', n: sign + 'poniżej 1', unit: CUR };
    var r = a < 100 ? Math.round(a) : Math.round(clean(a / 100)) * 100;
    return { pre: 'około', n: sign + group(String(r)), unit: CUR };
  }

  function approxDays(h) {
    var d = clean(h / DAY_HOURS), a = Math.abs(d);
    if (a === 0) return '0 osobodni';
    if (a < 0.05) return (d < 0 ? '−' : '') + 'poniżej 0,1 osobodnia';
    var r = Math.round(clean(a * 10)) / 10;
    return 'około ' + (d < 0 ? '−' : '') + plain(r) + ' ' + personDays(r);
  }

  function joined(a) {
    return (a.pre ? a.pre + ' ' : '') + a.n + NBSP + a.unit;
  }

  // minutes per unit shown in a field whose unit the visitor switches (min / h)
  function unitFactor(id) {
    var f = FIELDS[id];
    return f.unitOpt && opts[f.unitOpt] === 'h' ? 60 : 1;
  }

  function fmtInput(n, kind) {
    var s = String(round(n, 2)).replace('.', ',');
    return kind === 'cash' ? group(s) : s;
  }

  /* Reads what a person typed. An empty field is "no data": it never falls back to the starting
     value. Text, a negative number, a fraction where a whole number is due and a value over the
     field's limit are no data either, each with its own message next to the field; nothing is
     cut and nothing becomes zero. */
  function parse(text, id) {
    var f = FIELDS[id];
    var s = String(text == null ? '' : text).replace(/[\s  ]/g, '');
    if (s === '') return { value: null, status: 'empty' };
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) {
      // both marks present: the last one is the decimal mark
      var thousands = s.lastIndexOf(',') > s.lastIndexOf('.') ? '.' : ',';
      s = s.split(thousands).join('');
    } else if (f.kind === 'cash' && /^\d{1,3}(\.\d{3})+$/.test(s)) {
      s = s.replace(/\./g, '');   // "12.000" typed as twelve thousand
    }
    s = s.replace(',', '.');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { value: null, status: 'invalid' };
    var n = parseFloat(s) * unitFactor(id);
    if (!isFinite(n)) return { value: null, status: 'invalid' };
    if (f.dec === 0 && clean(n) % 1 !== 0) return { value: null, status: 'fraction' };
    n = round(n, f.dec);
    if (n > f.max) return { value: null, status: 'over' };
    return { value: n, status: 'ok' };
  }

  function parseMessage(status, id) {
    var f = FIELDS[id];
    if (status === 'invalid') return 'Błędna wartość';
    if (status === 'fraction') return 'Liczba całkowita, bez ułamka';
    if (status === 'over') return 'Maks. ' + plain(f.max / unitFactor(id)) + NBSP + shownUnit(id);
    return '';
  }

  /* ---------- the model: no page, no state - values and switches in, the result out ---------- */

  function diff(a, b) {
    return a == null || b == null ? null : a - b;
  }

  function plus(a, b) {
    return a == null || b == null ? null : a + b;
  }

  function hrs(min) {
    return min == null ? null : min / 60;
  }

  /* events × what one event gives. No events: zero, whatever else is missing. A missing count
     or a missing figure per event: no data (null), never zero. Nothing is cut at zero either:
     less time today than with the program gives a negative result. */
  function events(counts, per) {
    var n = 1, i;
    for (i = 0; i < counts.length; i++) if (counts[i] === 0) return 0;
    for (i = 0; i < counts.length; i++) {
      if (counts[i] == null) return null;
      n *= counts[i];
    }
    return per == null ? null : n * per;
  }

  // one line of a result. status: off | ok | missing
  function line(on, n) {
    return { on: !!on, n: on ? n : null, status: !on ? 'off' : n == null ? 'missing' : 'ok' };
  }

  // The sum of the lines that have data; complete only when every line switched on has data.
  function sum(lines) {
    var n = null, missing = [], on = false, id;
    for (id in lines) {
      if (!lines[id].on) continue;
      on = true;
      if (lines[id].n == null) missing.push(id); else n = (n || 0) + lines[id].n;
    }
    return { on: on, n: n, complete: on && !missing.length, missing: missing };
  }

  // Hours, their value and avoided spending are three results, each complete or not on its own.
  function finish(r, time, money, rate, timeOnly) {
    var id;
    for (id in time) time[id].value = time[id].n != null && rate != null ? time[id].n * rate : null;
    r.time = time;
    r.money = money;
    r.hours = sum(time);
    r.value = {
      n: r.hours.n != null && rate != null ? r.hours.n * rate : null,
      complete: r.hours.complete && rate != null,
      off: timeOnly ? 'timeOnly' : rate == null ? 'noRate' : ''
    };
    r.cash = sum(money);
    return r;
  }

  function computeIntegrator(v, o) {
    var rate = o.i_time_only ? null : v.i_rate;
    var saved = diff(v.i_current_min, v.i_pd_min);     // one layout, minutes
    /* A change is one more layout to prepare. An error in the data of a layout does not arise
       with the program, so the whole repair goes. Either may take a trip to the customer today:
       the person's hours of a trip are time, its cost is money, and the two are kept apart.
       A trip costs and takes the same whatever its reason. */
    var parts = {
      changesPrep: events([v.i_changes_count], hrs(saved)),
      changesTravel: events([v.i_changes_trips], v.i_trip_hours),
      errorsFix: events([v.i_errors_count], v.i_errors_hours),
      errorsTravel: events([v.i_errors_trips], v.i_trip_hours)
    };
    var time = {
      layouts: line(true, events([v.i_machines, v.i_layouts], hrs(saved))),
      changes: line(o.i_changes_enabled, plus(parts.changesPrep, parts.changesTravel)),
      errors: line(o.i_errors_enabled, plus(parts.errorsFix, parts.errorsTravel)),
      system: line(o.i_system_enabled, events([v.i_machines], diff(v.i_system_current_hours, v.i_system_pd_hours))),
      construct: line(o.i_construct_enabled, events([v.i_machines], hrs(diff(v.i_construct_current_min, v.i_construct_pd_min)))),
      offer: line(o.i_offer_enabled, events([v.i_offer_count], hrs(diff(v.i_offer_current_min, v.i_offer_pd_min)))),
      trials: line(o.i_trials_enabled, events([v.i_trials_count], hrs(diff(v.i_trials_current_min, v.i_trials_pd_min))))
    };
    var money = {
      changes: line(o.i_changes_enabled, events([v.i_changes_trips], v.i_trip_cash)),
      errors: line(o.i_errors_enabled, events([v.i_errors_trips], v.i_trip_cash))
    };

    var r = finish({ aud: 'integrator', savedMin: saved, prep: events([v.i_machines, v.i_layouts], 1), parts: parts }, time, money, rate, !!o.i_time_only);
    /* yearly revenue from selling the configurator: apart from the yearly result. What an own
       configurator would cost to build is not a figure here: any amount reads as the price of
       doing it oneself (owner, 2026-10-03) */
    var revOn = !!o.i_rev_enabled;
    r.revenue = { on: revOn, n: revOn ? events([v.i_cfg_sales], v.i_cfg_price) : null };
    return r;
  }

  function computePlant(v, o) {
    var m = o.p_method;
    var rate = o.p_time_only ? null : v.p_rate;
    var internal = m === 'internal' || m === 'mixed', external = m === 'external' || m === 'mixed';
    var time = {
      internal: line(internal, events([v.p_internal_count], hrs(diff(v.p_internal_current_min, v.p_pd_min)))),
      // the integrator's hours are the price of the service, not the plant's time. The plant's
      // own time on an order is the handing over of the layout (a sketch, dimensions, a mail);
      // with the program its own person does the layout instead. Set to less than the program
      // takes, this line goes below zero
      external: line(external, events([v.p_external_count], hrs(diff(v.p_external_internal_current_min, v.p_pd_min))))
    };
    var money = {
      fees: line(external, events([v.p_external_count], v.p_external_fee)),
      visits: line(o.p_visits_enabled, events([v.p_visits_count], v.p_visits_fee))
    };
    return finish({ aud: 'plant', method: m || null }, time, money, rate, !!o.p_time_only);
  }

  /* aud: 'integrator' | 'plant'; v: field values in the units of FIELDS (null = no data);
     o: the switches. The two audiences are separate calculations and are never added up. */
  function compute(aud, v, o) {
    return aud === 'plant' ? computePlant(v, o) : computeIntegrator(v, o);
  }

  /* ---------- state: kept in this browser, one set of fields per audience ---------- */

  var values = {};      // field id -> number, or null when the field is empty
  var touched = {};     // field id -> true once the visitor gave the value
  var opts = {};
  var ratio = [];       // the last proportions of the four activities that were not all zero
  var errors = {};      // field id -> message about what was typed
  var open = {};        // which bodies are unfolded; not part of a scenario
  var undoShot = null;  // the state before the last reset or import
  var loadedFrom = null; // model version of the scenario in use, when it is not this one
  var listeners = [];
  var inputs = [], ranges = [], hints = [];
  var mounted = false;

  function defaults() {
    var o = {};
    for (var id in FIELDS) o[id] = FIELDS[id].def;
    return o;
  }

  // every part of the calculation is switched on from the start
  function defaultOpts() {
    var o = { aud: 'integrator', i_unit: 'min', i_time_only: false,
      p_method: 'external', p_time_only: false, demo_attach: true };
    FLAGS.forEach(function (key) { o[key] = true; });
    return o;
  }

  var NULLABLE = { p_method: true };

  function optionOk(key, val) {
    return OPTIONS[key].some(function (o) { return o[0] === val; });
  }

  function prefix() {
    return opts.aud === 'plant' ? 'p_' : 'i_';
  }

  function get(id) {
    return values[id];
  }

  function overLimit() {
    return values[TOTAL] != null && values[TOTAL] > FIELDS[TOTAL].max;
  }

  function groupOn(grp) {
    switch (grp) {
      case 'i_money': return !opts.i_time_only;
      case 'p_money': return !opts.p_time_only;
      case 'p_internal': return opts.p_method === 'internal' || opts.p_method === 'mixed';
      case 'p_external': return opts.p_method === 'external' || opts.p_method === 'mixed';
      default: return true;
    }
  }

  /* The total and its four activities are two views of one figure and agree at every moment:
     typing the total spreads it over the activities in the proportions remembered last (the
     starting 30:90:40:20 when there are none); typing an activity makes the total their sum.
     Unfolding or folding the activities therefore never changes the result. */
  function spread(total) {
    if (!total) return PARTS.map(function () { return 0; });
    var wsum = ratio.reduce(add, 0), last = 0;
    var out = ratio.map(function (w, i) {
      if (w > 0) last = i;
      return round(total * w / wsum, 1);
    });
    // what rounding to 0,1 min left goes to the last activity (the largest when that would
    // push it below zero), so the four always add up to the total
    var rest = round(total - out.reduce(add, 0), 1);
    if (out[last] + rest < 0) last = out.indexOf(Math.max.apply(null, out));
    out[last] = round(out[last] + rest, 1);
    return out;
  }

  function fromTotal() {
    var total = values[TOTAL];
    var parts = total == null ? null : spread(total);
    PARTS.forEach(function (id, i) {
      values[id] = parts ? parts[i] : null;
      delete errors[id];
    });
  }

  function fromParts() {
    var parts = PARTS.map(get);
    if (parts.some(function (x) { return x == null; })) {
      values[TOTAL] = null;
      return;
    }
    var total = round(parts.reduce(add, 0), 1);
    values[TOTAL] = total;      // may exceed the field's limit: then it is shown, marked and not counted
    delete errors[TOTAL];
    if (total > 0) ratio = parts.slice();
  }

  // "Cofnij" takes back a reset or an import only until the next value is given
  function set(id, n, src) {
    values[id] = n;
    touched[id] = true;
    undoShot = null;
    if (id === TOTAL) fromTotal(); else if (PARTS.indexOf(id) >= 0) fromParts();
    changed(src, false);
  }

  function setOpt(key, val) {
    if (key === 'p_method' && val) {
      // the starting scale follows the choice until the visitor gives a number of their own
      ['p_internal_count', 'p_external_count'].forEach(function (id) {
        if (!touched[id]) values[id] = PLANT_EVENTS[val];
      });
    }
    // a switch changes the calculation only: it never unfolds its row, so nothing moves
    opts[key] = val;
    changed(null, true);
  }

  function setOpen(key, on) {
    open[key] = !!on;
    if (mounted) syncControls();
  }

  // back to the starting values for the audience on screen; the other path stays as it is
  function reset() {
    undoShot = snapshot();
    var p = prefix(), d = defaults(), o = defaultOpts(), id;
    for (id in FIELDS) {
      if (id.indexOf(p) !== 0) continue;
      values[id] = d[id];
      delete touched[id];
      delete errors[id];
    }
    for (id in o) if (id.indexOf(p) === 0) opts[id] = o[id];
    if (p === 'i_') ratio = PARTS.map(function (x) { return d[x]; });
    loadedFrom = null;
    changed(null, true);
  }

  function undo() {
    if (!undoShot) return;
    var shot = undoShot;
    undoShot = null;
    restore(shot);
    changed(null, true);
  }

  function changed(src, force) {
    save();
    if (mounted) refreshInputs(src, force);
    notify();
  }

  /* ---------- scenario: one format for this browser's memory and for the file ---------- */

  var BASE_UNIT = { min: 'min', hours: 'h', count: 'liczba', rate: 'zł/h', cash: 'zł', days: 'dni robocze' };

  function snapshot() {
    var fields = {}, o = {}, id;
    for (id in FIELDS) fields[id] = { value: values[id], unit: BASE_UNIT[FIELDS[id].kind], own: !!touched[id] };
    for (id in opts) o[id] = opts[id];
    return { app: APP_ID, model: loadedFrom || MODEL_VERSION, defaults: DEFAULTS_VERSION, saved: new Date().toISOString(),
      audience: opts.aud, options: o, ratio: ratio.slice(), fields: fields };
  }

  /* Takes a scenario over, whole or not at all: types and ranges are checked first. Values come
     from the scenario as they were saved - a scenario is never quietly recounted with newer
     starting values. Returns '' or the reason of refusal. */
  function restore(data) {
    if (!data || data.app !== APP_ID || typeof data.fields !== 'object' || !data.fields) return 'Plik nie jest scenariuszem kalkulatora';
    var v = defaults(), t = {}, o = defaultOpts(), src = data.options || {}, id, f, x, n, def;
    for (id in FIELDS) {
      x = data.fields[id];
      if (!x) continue;
      f = FIELDS[id];
      n = x.value;
      if (n !== null) {
        if (typeof n !== 'number' || !isFinite(n) || n < 0 || (n > f.max && id !== TOTAL) || (f.dec === 0 && n % 1 !== 0)) {
          return 'Błędna wartość w polu: ' + f.label;
        }
      }
      v[id] = n;
      if (x.own === true) t[id] = true;
    }
    for (id in o) {
      if (!(id in src)) continue;
      def = o[id];
      if (OPTIONS[id]) {
        if (src[id] === null && NULLABLE[id]) o[id] = null;
        else if (optionOk(id, src[id])) o[id] = src[id];
        else return 'Błędna opcja: ' + id;
      } else if (typeof src[id] === typeof def) o[id] = src[id];
      else return 'Błędna opcja: ' + id;
    }
    if (optionOk('aud', data.audience)) o.aud = data.audience;
    var rt = PARTS.map(function (pid) { return FIELDS[pid].def; });
    if (Array.isArray(data.ratio) && data.ratio.length === PARTS.length &&
        data.ratio.every(function (w) { return typeof w === 'number' && isFinite(w) && w >= 0; }) &&
        data.ratio.reduce(add, 0) > 0) rt = data.ratio.slice();

    values = v;
    touched = t;
    opts = o;
    ratio = rt;
    errors = {};
    loadedFrom = typeof data.model === 'string' && data.model !== MODEL_VERSION ? data.model : null;
    // the total follows its activities, whatever the file said
    if (PARTS.every(function (pid) { return values[pid] != null; })) values[TOTAL] = round(PARTS.map(get).reduce(add, 0), 1);
    else if (values[TOTAL] != null && values[TOTAL] <= FIELDS[TOTAL].max) fromTotal();
    else values[TOTAL] = null;
    return '';
  }

  function load() {
    values = defaults();
    touched = {};
    opts = defaultOpts();
    ratio = PARTS.map(get);
    errors = {};
    undoShot = null;
    loadedFrom = null;
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (raw) restore(JSON.parse(raw));
    } catch (e) { /* storage unavailable or damaged: the starting values apply */ }
    // every row starts folded: its name and its figure are in sight, its fields a click away
    open = {};
  }

  function save() {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
    } catch (e) { /* not kept */ }
  }

  function exportText() {
    return JSON.stringify(snapshot(), null, 2);
  }

  // text of a scenario file -> '' or the reason of refusal; the present state stays on refusal
  function importText(text) {
    var data, before = snapshot(), err;
    try { data = JSON.parse(text); } catch (e) { return 'Plik nie jest scenariuszem kalkulatora'; }
    err = restore(data);
    if (err) return err;
    undoShot = before;
    changed(null, true);
    return '';
  }

  /* ---------- the result of the present state ---------- */

  function engineValues() {
    var v = {}, id;
    for (id in values) v[id] = values[id];
    if (overLimit()) v[TOTAL] = null;
    return v;
  }

  function result() {
    return compute(opts.aud, engineValues(), opts);
  }

  /* ---------- texts ---------- */

  function shownUnit(id) {
    var f = FIELDS[id];
    return f.unitOpt ? (unitFactor(id) === 60 ? 'h' : 'min') : f.unit;
  }

  // a field's value with its unit, as the summaries carry it
  function valueText(id) {
    var f = FIELDS[id], n = values[id];
    if (n == null) return NO_DATA;
    if (f.kind === 'count') return plain(n);
    if (f.kind === 'min') return plain(n) + NBSP + 'min';
    if (f.kind === 'hours') return plain(n) + NBSP + 'h';
    return plain(n) + NBSP + f.unit;
  }

  function short(id) {
    return values[id] == null ? NONE : valueText(id);
  }

  function savedText(min) {
    if (min == null) return NO_DATA;
    if (clean(min) === 0) return 'Bez zmiany nakładu pracy';
    return duration(Math.abs(min)) + (min > 0 ? ' mniej' : ' więcej') + ' pracy zespołu na przygotowanie układu';
  }

  function chosen(key, none) {
    var hit = OPTIONS[key].filter(function (x) { return x[0] === opts[key]; })[0];
    return hit ? hit[1] : none;
  }

  function hintOf(key) {
    var hit = OPTIONS[key].filter(function (x) { return x[0] === opts[key]; })[0];
    return hit ? hit[2] : NO_CHOICE[key];
  }

  // how one figure came about, with the visitor's numbers
  function formula(id) {
    function d(a, b) { return '(' + short(a) + ' − ' + short(b) + ')'; }
    var layout = overLimit() ? '(' + NONE + ' − ' + short('i_pd_min') + ')' : d(TOTAL, 'i_pd_min');
    switch (id) {
      case 'layouts': return short('i_machines') + ' × ' + short('i_layouts') + ' × ' + layout;
      case 'changesPrep': return short('i_changes_count') + ' × ' + layout;
      case 'changesTravel': return short('i_changes_trips') + ' × ' + short('i_trip_hours');
      case 'changesCash': return short('i_changes_trips') + ' × ' + short('i_trip_cash');
      case 'errorsFix': return short('i_errors_count') + ' × ' + short('i_errors_hours');
      case 'errorsTravel': return short('i_errors_trips') + ' × ' + short('i_trip_hours');
      case 'errorsCash': return short('i_errors_trips') + ' × ' + short('i_trip_cash');
      case 'system': return short('i_machines') + ' × ' + d('i_system_current_hours', 'i_system_pd_hours');
      case 'construct': return short('i_machines') + ' × ' + d('i_construct_current_min', 'i_construct_pd_min');
      case 'offer': return short('i_offer_count') + ' × ' + d('i_offer_current_min', 'i_offer_pd_min');
      case 'trials': return short('i_trials_count') + ' × ' + d('i_trials_current_min', 'i_trials_pd_min');
      case 'internal': return short('p_internal_count') + ' × ' + d('p_internal_current_min', 'p_pd_min');
      case 'external': return short('p_external_count') + ' × ' + d('p_external_internal_current_min', 'p_pd_min');
      case 'fees': return short('p_external_count') + ' × ' + short('p_external_fee');
      default: return short('p_visits_count') + ' × ' + short('p_visits_fee');
    }
  }

  function rateOf(r) {
    return r.value.off ? null : values[r.aud === 'plant' ? 'p_rate' : 'i_rate'];
  }

  // hours as the detail of the calculation: formula = hours, value
  function hoursDetail(on, key, h, r) {
    if (!on) return OFF;
    if (h == null) return formula(key) + ' = ' + NO_DATA;
    var rate = rateOf(r);
    return formula(key) + ' = ' + hoursD(h) + (rate == null ? '' : ', ' + cashD(h * rate));
  }

  function cashDetail(on, key, n) {
    if (!on) return OFF;
    return formula(key) + ' = ' + (n == null ? NO_DATA : cashD(n));
  }

  // what is switched on and has no data behind it, by name
  function missingList(r) {
    var out = [], id;
    for (id in r.time) if (r.time[id].on && r.time[id].n == null) out.push(LINES[id].label);
    for (id in r.money) if (r.money[id].on && r.money[id].n == null) out.push(r.aud === 'plant' ? LINES[id].label : 'Wydatki wyjazdów');
    if (r.value.off === 'noRate') out.push('Koszt godziny');
    if (r.revenue && r.revenue.on && r.revenue.n == null) out.push('Cena pakietu konfiguratora');
    return out.filter(function (x, i) { return out.indexOf(x) === i; });
  }

  /* A plant that orders layouts outside, all of them or a part: the fees that go are the
     stronger figure and lead the result, the plant's own time stands next to them. It follows
     the way of working alone, so no switch of a row ever changes which figure leads. */
  function feesLead(r) {
    return r.aud === 'plant' && (r.method === 'external' || r.method === 'mixed');
  }

  // the figure a result's label depends on: recovered, added, or no change
  function timeCap(n, own) {
    if (n == null || n > 0) return own ? 'Odzyskany czas własny w roku' : 'Odzyskany czas zespołu w roku';
    // short enough for one line of the table of assumptions: a longer label would add a line there
    return clean(n) === 0 ? 'Bez zmiany nakładu pracy' : 'Dodatkowy czas według założeń';
  }

  function chipTime(m, key, l) {
    m[key + '.a'] = !l.on ? OFF : l.n == null ? NO_DATA : hoursD(l.n);
    m[key + '.b'] = !l.on || l.n == null ? '' : l.value == null ? 'w roku' : cashD(l.value) + ' w roku';
  }

  // a card of changes or errors: hours on the chip, the spending of its trips under them,
  // and one line that says what the hours are made of
  function chipTrips(m, key, l, cash, first, a, b) {
    m['m.' + key + '.a'] = !l.on ? OFF : l.n == null ? NO_DATA : hoursD(l.n);
    m['m.' + key + '.b'] = !l.on || cash.n == null ? '' : 'wydatki: ' + cashD(cash.n);
    m[key + 'Line'] = !l.on ? '' : first + ': ' + (a == null ? NONE : hoursD(a)) + ' · wyjazdy: ' +
      (b == null ? NONE : hoursD(b)) + ' i ' + (cash.n == null ? NONE : cashD(cash.n));
  }

  // Strings for the [data-out] slots of the page.
  function texts(r) {
    var m = {}, v = values;
    function put(key, a) { m[key + '.pre'] = a.pre; m[key + '.big'] = a.n; m[key + '.unit'] = a.unit; }
    function none(key, unit) { put(key, { pre: '', n: NONE, unit: unit }); }

    if (r.aud === 'integrator') {
      m.now = v[TOTAL] == null || overLimit() ? NO_DATA : duration(v[TOTAL]) + ' łącznie';
      m.pd = v.i_pd_min == null ? NONE : duration(v.i_pd_min);
      m.savedLine = savedText(r.savedMin);
      m.partsSum = overLimit() ? 'Suma czynności ponad ' + plain(FIELDS[TOTAL].max) + NBSP + 'min: poza kalkulacją' :
        'suma czynności: ' + (v[TOTAL] == null ? NONE : plain(v[TOTAL]) + NBSP + 'min');
      PARTS.forEach(function (pid, i) { m['leg.' + i] = PART_NAMES[i] + ' ' + (v[pid] == null ? NONE : plain(v[pid]) + NBSP + 'min'); });

      m.prepLine = 'Przygotowania danych w roku: ' + short('i_machines') + ' × ' + short('i_layouts') + ' = ' + (r.prep == null ? NONE : plain(r.prep));
      var perMachine = events([v.i_layouts], r.savedMin);
      m['s.one'] = r.savedMin == null ? NONE : duration(r.savedMin);
      m['s.machine'] = perMachine == null ? NONE : duration(perMachine);
      m['s.machineSub'] = v.i_layouts == null ? 'brak liczby układów' :
        plain(v.i_layouts) + ' ' + plural(v.i_layouts, 'układ', 'układy', 'układów') + ' jednej maszyny';
      m['s.year'] = r.time.layouts.n == null ? NONE : hoursD(r.time.layouts.n);
      m['s.yearSub'] = r.time.layouts.value == null ? 'same nowe układy, w roku' : cashD(r.time.layouts.value) + ' w roku';

      ['system', 'construct', 'offer', 'trials'].forEach(function (x) { chipTime(m, 'm.' + x, r.time[x]); });
      chipTrips(m, 'changes', r.time.changes, r.money.changes, 'układy', r.parts.changesPrep, r.parts.changesTravel);
      chipTrips(m, 'errors', r.time.errors, r.money.errors, 'poprawki', r.parts.errorsFix, r.parts.errorsTravel);
      // one trip, whatever its reason; out of the calculation when neither changes nor errors are in
      var trips = r.time.changes.on || r.time.errors.on;
      m['m.trip.a'] = !trips ? OFF : v.i_trip_cash == null ? NO_DATA : cashD(v.i_trip_cash);
      m['m.trip.b'] = !trips ? '' : v.i_trip_hours == null ? 'brak czasu wyjazdu' : plain(v.i_trip_hours) + NBSP + 'h na wyjazd';

      m.revChip = !r.revenue.on ? OFF : r.revenue.n == null ? NO_DATA : cashD(r.revenue.n);
      m.revChipSub = !r.revenue.on || r.revenue.n == null ? '' : 'przychód w roku';

      if (r.revenue.on && r.revenue.n != null) put('rev', approxCash(r.revenue.n)); else none('rev', CUR);
      m['rev.sub'] = !r.revenue.on ? OFF : r.revenue.n == null ? 'brak ceny pakietu' : 'sprzedaż konfiguratora';
    } else {
      m.methodHint = hintOf('p_method');
      chipTime(m, 'm.internal', r.time.internal);
      var fees = r.money.fees, ext = r.time.external;
      m['m.external.a'] = !fees.on ? OFF : fees.n == null ? 'opłata: ' + NO_DATA : cashD(fees.n);
      m['m.external.b'] = !ext.on || ext.n == null ? '' : ext.n < 0 ? 'więcej pracy: ' + hoursD(-ext.n) : 'mniej pracy: ' + hoursD(ext.n);
      var vis = r.money.visits;
      m['m.visits.a'] = !vis.on ? OFF : vis.n == null ? NO_DATA : cashD(vis.n);
      m['m.visits.b'] = !vis.on || vis.n == null ? '' : 'opłaty w roku';
      // days of waiting: information, never a part of the result
      m['m.wait.a'] = (v.p_wait_now_days == null ? NONE : plain(v.p_wait_now_days)) + ' → ' +
        (v.p_wait_after_days == null ? NONE : plain(v.p_wait_after_days)) + NBSP + 'dni rob.';
      m['m.wait.b'] = OFF;
    }

    /* the result panel: one main figure and two tiles; when the plant orders layouts outside
       (all or a part) and the fee is known, the avoided fees come first and the plant's own
       time stands next to them */
    var h = r.hours.n, days = h == null ? '' : approxDays(h) + ' po ' + DAY_HOURS + NBSP + 'h';
    var rateId = r.aud === 'plant' ? 'p_rate' : 'i_rate';
    var valueSub = r.value.off === 'timeOnly' ? 'tryb: tylko czas' : r.value.off === 'noRate' ? 'brak kosztu godziny' :
      r.value.n == null ? NO_DATA : 'przy ' + plain(v[rateId]) + NBSP + CUR + '/h';
    var cashFirst = feesLead(r) && r.cash.n != null;
    var cashCap = r.aud === 'plant' ? 'Uniknięte opłaty za usługi' : 'Uniknięte wydatki';
    var cashSub = !r.cash.on ? (r.aud === 'plant' ? 'brak zleceń' : 'wyjazdy wyłączone') :
      r.cash.n == null ? NO_DATA : r.cash.complete ? (r.aud === 'plant' ? 'faktury za usługi' : 'wyjazdy do klientów') : 'dane niepełne';

    if (r.aud === 'plant' && !r.method) {
      m['p.cap'] = 'Sposób przygotowania danych: do wyboru';
      none('p', 'h');
      m['p.sub'] = 'punkt 1: kto dziś przygotowuje dane';
    } else if (cashFirst) {
      m['p.cap'] = 'Opłaty za usługi możliwe do uniknięcia w roku';
      put('p', approxCash(r.cash.n));
      m['p.sub'] = cashSub;
    } else {
      m['p.cap'] = timeCap(h, r.aud === 'plant');
      if (h == null) none('p', 'h'); else put('p', approxTime(h));
      m['p.sub'] = h == null ? 'brak danych do wyniku' : days;
    }

    if (cashFirst) {
      // with the program the plant does the work itself: shown as the work it is, next to the
      // fees that go, not as a minus
      var own = h != null && h < 0;
      m['a.cap'] = own ? 'Praca własna w roku' : 'Odzyskany czas własny';
      if (h == null) none('a', 'h'); else put('a', approxTime(own ? -h : h));
      m['a.sub'] = h == null ? NO_DATA : own ? 'z Pallet Designerem' : 'osobno od opłat';
      m['b.cap'] = own ? 'Koszt tej pracy' : 'Wartość tego czasu';
      if (r.value.n == null) none('b', CUR); else put('b', approxCash(own ? -r.value.n : r.value.n));
      m['b.sub'] = valueSub;
    } else {
      m['a.cap'] = 'Wartość tego czasu';
      if (r.value.n == null) none('a', CUR); else put('a', approxCash(r.value.n));
      m['a.sub'] = valueSub;
      m['b.cap'] = cashCap;
      if (r.cash.n == null) none('b', CUR); else put('b', approxCash(r.cash.n));
      m['b.sub'] = cashSub;
    }

    var miss = missingList(r);
    m['p.note'] = miss.length ? 'Wynik z uzupełnionych danych · pominięte: ' + miss.join(', ') : '';

    // the bar that stays in sight on a narrow screen: the main figure and, after it, the value of the time
    m.mbar = cashFirst ? joined(approxCash(r.cash.n)) + ' opłat rocznie' : h == null ? NO_DATA : joined(approxTime(h)) + ' rocznie';
    m.mbar2 = cashFirst || r.value.n == null ? '' : approxCash(r.value.n).n + NBSP + CUR;
    m.live = m['p.cap'] + ': ' + (cashFirst ? joined(approxCash(r.cash.n)) : h == null ? NO_DATA : joined(approxTime(h))) +
      (miss.length ? '. Wynik z uzupełnionych danych.' : '.');
    return m;
  }

  // the lines of the result panel: where the figure comes from, with the way to its assumptions
  function rows(r) {
    function time(id) {
      var l = r.time[id];
      return { id: id, label: LINES[id].label, at: LINES[id].at, value: !l.on ? OFF : l.n == null ? NO_DATA : hoursD(l.n) };
    }
    function cash(id) {
      var l = r.money[id];
      return { id: id + '-cash', label: LINES[id].label, at: LINES[id].at, value: !l.on ? OFF : l.n == null ? NO_DATA : cashD(l.n) };
    }
    if (r.aud === 'plant') return [time('internal'), time('external'), cash('fees'), cash('visits')];
    return Object.keys(r.time).map(time).concat([{ id: 'trips-cash', label: 'Wydatki wyjazdów', at: TRIP_AT,
      value: !r.cash.on ? OFF : r.cash.n == null ? NO_DATA : cashD(r.cash.n) }]);
  }

  var REV_LABEL = 'Potencjalny przychód z konfiguratorów w roku';

  // the main results in words, for the report and for the mail
  function headline(r) {
    var out = [], h = r.hours.n, plant = r.aud === 'plant';
    function item(label, value) { out.push({ label: label, value: value }); }
    function cash() {
      if (r.cash.on) item(plant ? 'Opłaty za usługi możliwe do uniknięcia' : 'Uniknięte wydatki', r.cash.n == null ? NO_DATA : cashD(r.cash.n));
    }
    if (plant && !r.method) return [{ label: 'Wynik', value: 'sposób przygotowania danych: nie wskazano' }];
    // outside service: the fees that go come first, the plant's own work after them
    var feesFirst = feesLead(r), own = feesFirst && h != null && h < 0;
    if (feesFirst) cash();
    if (own) {
      item('Praca własna z Pallet Designerem w roku', joined(approxTime(-h)) + ' (' + hoursD(-h) + ')');
      if (r.value.n != null) item('Koszt tej pracy', cashD(-r.value.n));
    } else {
      item(timeCap(h, plant), h == null ? NO_DATA : joined(approxTime(h)) + ' (' + hoursD(h) + '; ' + approxDays(h) + ' po ' + DAY_HOURS + NBSP + 'h)');
      item('Wartość tego czasu', r.value.off === 'timeOnly' ? 'tryb: tylko czas' : r.value.n == null ? NO_DATA : joined(approxCash(r.value.n)) + ' (' + cashD(r.value.n) + ')');
    }
    if (!feesFirst) cash();
    if (r.revenue && r.revenue.on) item(REV_LABEL, r.revenue.n == null ? NO_DATA : cashD(r.revenue.n));
    return out;
  }

  /* Everything the result stands on, for the page's table, the report and the mail:
     sections of rows { label, value }. The number of rows never changes. */
  function summary(r) {
    var o = opts;
    function row(label, value) { return { label: label, value: value }; }
    function field(id, label) { return row(label || FIELDS[id].label, valueText(id)); }
    function timeRow(id) { return row(LINES[id].label, hoursDetail(r.time[id].on, id, r.time[id].n, r)); }
    function cashRow(id) { return row(LINES[id].label, cashDetail(r.money[id].on, id, r.money[id].n)); }
    var h = r.hours.n, miss = missingList(r);
    var totals = [
      row(timeCap(h, r.aud === 'plant'), h == null ? NO_DATA : hoursD(h) + ' (' + num(h / DAY_HOURS, 2) + ' osobodnia po ' + DAY_HOURS + NBSP + 'h)'),
      row('Wartość tego czasu', r.value.off === 'timeOnly' ? 'tryb: tylko czas' : r.value.n == null ? NO_DATA : cashD(r.value.n)),
      row(r.aud === 'plant' ? 'Opłaty za usługi możliwe do uniknięcia' : 'Uniknięte wydatki', !r.cash.on ? OFF : r.cash.n == null ? NO_DATA : cashD(r.cash.n))
    ];
    var complete = row('Dane brakujące w kalkulacji', miss.length ? miss.join(', ') : 'brak');

    if (r.aud === 'plant') {
      return [
        { title: 'Przygotowanie układów w zakładzie', rows: [
          row('Kto dziś przygotowuje dane nowych układów', chosen('p_method', 'nie wskazano')),
          o.p_time_only ? row(FIELDS.p_rate.label, 'tryb: tylko czas') : field('p_rate'),
          field('p_pd_min')
        ] },
        { title: 'Wynik roczny', rows: totals.concat([timeRow('internal'), timeRow('external'), cashRow('fees'), cashRow('visits'), complete]) },
        { title: 'Oczekiwanie na nowy układ: informacja, poza kalkulacją', rows: [field('p_wait_now_days'), field('p_wait_after_days')] }
      ];
    }
    var parts = PARTS.map(function (id) { return values[id] == null ? NONE : plain(values[id]); }).join(' + ') + NBSP + 'min';
    var ch = r.time.changes.on, er = r.time.errors.on;
    return [
      { title: 'Jeden układ', rows: [
        row(FIELDS[TOTAL].label + ', wszystkie osoby', overLimit() ? 'ponad ' + plain(FIELDS[TOTAL].max) + NBSP + 'min: poza kalkulacją' : valueText(TOTAL)),
        row('Czynności: odłożenia, robot, PLC/HMI, sprawdzenie', parts),
        field('i_pd_min'),
        row('Różnica na układ', r.savedMin == null ? NO_DATA : duration(Math.abs(r.savedMin)) + (r.savedMin < 0 ? ' więcej' : ' mniej'))
      ] },
      { title: 'Skala roczna', rows: [
        field('i_machines', 'Nowe maszyny w roku'),
        field('i_layouts'),
        row('Przygotowania danych w roku', short('i_machines') + ' × ' + short('i_layouts') + ' = ' + (r.prep == null ? NONE : plain(r.prep))),
        o.i_time_only ? row(FIELDS.i_rate.label, 'tryb: tylko czas') : field('i_rate')
      ] },
      { title: 'Wynik roczny', rows: totals.concat([
        timeRow('layouts'),
        row('Zmiany: kolejne układy', hoursDetail(ch, 'changesPrep', r.parts.changesPrep, r)),
        row('Zmiany: czas wyjazdów', hoursDetail(ch, 'changesTravel', r.parts.changesTravel, r)),
        row('Zmiany: wydatki wyjazdów', cashDetail(ch, 'changesCash', r.money.changes.n)),
        row('Błędy: poprawki', hoursDetail(er, 'errorsFix', r.parts.errorsFix, r)),
        row('Błędy: czas wyjazdów', hoursDetail(er, 'errorsTravel', r.parts.errorsTravel, r)),
        row('Błędy: wydatki wyjazdów', cashDetail(er, 'errorsCash', r.money.errors.n)),
        timeRow('system'), timeRow('construct'), timeRow('offer'), timeRow('trials'), complete
      ]) },
      { title: 'Konfigurator dla klienta końcowego: osobno, bez sumowania', rows: [
        row(REV_LABEL, !r.revenue.on ? OFF : short('i_cfg_sales') + ' × ' + short('i_cfg_price') + ' = ' + (r.revenue.n == null ? NO_DATA : cashD(r.revenue.n)))
      ] }
    ];
  }

  var DISCLAIMER = 'Typowy rok po wdrożeniu, przed kosztami zakupu i wdrożenia';

  function today() {
    var d = new Date();
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return { pl: two(d.getDate()) + '.' + two(d.getMonth() + 1) + '.' + d.getFullYear(),
      iso: d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()) };
  }

  // who, which period, when and which model: the head of every report
  function reportHead() {
    return [
      { label: 'Profil', value: hintOf('aud') },
      { label: 'Okres', value: 'typowy rok po wdrożeniu' },
      { label: 'Data', value: today().pl },
      { label: 'Model', value: MODEL_VERSION + (loadedFrom ? ', scenariusz zapisany w wersji ' + loadedFrom : '') }
    ];
  }

  // the assumptions as plain text, short enough for a mail
  function mailText(r) {
    var out = ['Założenia z kalkulatora (' + hintOf('aud').toLowerCase() + ', typowy rok po wdrożeniu):'];
    if (r.aud === 'integrator') {
      out.push('- czas obecny na nowy układ: ' + (overLimit() ? NO_DATA : valueText(TOTAL)) + '; z Pallet Designerem: ' + valueText('i_pd_min'));
      out.push('- nowe maszyny w roku: ' + valueText('i_machines') + '; układy na maszynę: ' + valueText('i_layouts'));
    } else {
      out.push('- dane nowych układów przygotowuje: ' + chosen('p_method', 'nie wskazano').toLowerCase());
    }
    headline(r).forEach(function (x) { out.push('- ' + x.label.charAt(0).toLowerCase() + x.label.slice(1) + ': ' + x.value); });
    return out.join('\n').replace(/ /g, ' ');
  }

  /* ---------- the form ---------- */

  function notify() {
    if (!listeners.length) return;
    var r = result();
    var t = texts(r);
    if (mounted) syncControls();
    listeners.forEach(function (fn) { fn(r, t); });
  }

  function shown(id) {
    var n = values[id];
    return n == null ? null : round(n / unitFactor(id), 2);
  }

  // the line under a field's label: what is wrong with the entry, else a note, else the hint
  function hintText(id) {
    var f = FIELDS[id];
    if (errors[id]) return { text: errors[id], cls: 'err' };
    if (id === TOTAL && overLimit()) return { text: 'Suma czynności ponad ' + plain(f.max) + NBSP + 'min', cls: 'err' };
    if (f.range && values[id] != null && values[id] > f.range[1]) return { text: 'Wartość poza zakresem suwaka', cls: 'far' };
    return { text: f.hint, cls: '' };
  }

  // Writes the state back into the fields and sliders other than the one being used.
  function refreshInputs(src, force) {
    inputs.forEach(function (inp) {
      var id = inp.getAttribute('data-field');
      var f = FIELDS[id];
      var want = values[id];
      var bad = !!errors[id] || (id === TOTAL && overLimit());
      inp.disabled = !groupOn(f.grp);
      inp.classList.toggle('bad', bad);
      inp.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (inp === src) return;
      if (!force) {
        if (inp === document.activeElement || errors[id]) return;
        if (parse(inp.value, id).value === want) return;
      }
      inp.value = want == null ? '' : fmtInput(shown(id), f.kind);
    });
    ranges.forEach(function (rng) {
      var id = rng.getAttribute('data-range');
      rng.disabled = !groupOn(FIELDS[id].grp);
      if (rng === src) return;
      rng.value = String(values[id] == null ? rng.min : values[id]);   // the browser keeps it inside min..max
    });
    hints.forEach(function (el) {
      var h = hintText(el.getAttribute('data-hint'));
      if (el.textContent !== h.text) el.textContent = h.text;
      el.className = 'fld-h' + (h.cls ? ' ' + h.cls : '');
    });
  }

  // pressed states of the buttons, and the parts of the page that are switched off or folded
  function syncControls() {
    all('[data-opt]').forEach(function (btn) {
      var key = btn.getAttribute('data-opt');
      var on = btn.hasAttribute('data-val') ? opts[key] === btn.getAttribute('data-val') : !!opts[key];
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    all('[data-aud]').forEach(function (el) { el.hidden = el.getAttribute('data-aud') !== opts.aud; });
    all('[data-group]').forEach(function (el) { el.classList.toggle('off', !groupOn(el.getAttribute('data-group'))); });
    all('[data-mod]').forEach(function (el) { el.classList.toggle('on', !!opts[el.getAttribute('data-mod')]); });
    all('[data-open]').forEach(function (btn) {
      btn.setAttribute('aria-expanded', open[btn.getAttribute('data-open')] ? 'true' : 'false');
    });
    all('[data-body]').forEach(function (el) { el.hidden = !open[el.getAttribute('data-body')]; });
    all('[data-row]').forEach(function (el) { el.classList.toggle('open', !!open[el.getAttribute('data-row')]); });
    all('[data-unit-of]').forEach(function (el) {
      var s = shownUnit(el.getAttribute('data-unit-of'));
      if (el.textContent !== s) el.textContent = s;
    });
    all('[data-action="undo"]').forEach(function (btn) { btn.disabled = !undoShot; });
  }

  function onInput(e) {
    var inp = e.target;
    var id = inp.getAttribute('data-field');
    var p = parse(inp.value, id);
    var msg = parseMessage(p.status, id);
    if (msg) errors[id] = msg; else delete errors[id];
    set(id, p.value, inp);
  }

  // on leaving a field its text takes the form the page uses: 1 500,5
  function onLeave(e) {
    var inp = e.target, id = inp.getAttribute('data-field');
    if (errors[id] || values[id] == null) return;
    inp.value = fmtInput(shown(id), FIELDS[id].kind);
  }

  function onRange(e) {
    var id = e.target.getAttribute('data-range');
    delete errors[id];
    set(id, parseFloat(e.target.value), e.target);
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  // <div data-slot="i_machines" [data-label] [data-plain]> becomes a field: label with the
  // "i" button and one line for a hint or an error, slider, number and unit.
  function fieldMarkup(id, o) {
    var f = FIELDS[id];
    var label = o.label != null ? o.label : f.label;
    var noSlider = o.plain != null || !f.range;
    var slider = noSlider ? '' :
      '<input type="range" data-range="' + id + '" min="' + f.range[0] + '" max="' + f.range[1] + '" step="' + f.range[2] +
      '" aria-label="' + esc(label) + ', suwak">';
    var help = f.help ? '<button type="button" class="help" data-help="' + id + '" aria-label="Opis pola: ' + esc(label) + '" aria-expanded="false">i</button>' : '';
    return '<div class="fld' + (noSlider ? ' plain' : '') + '">' +
      '<div class="fld-l"><div class="fld-t"><label for="f-' + id + '">' + esc(label) + '</label>' + help + '</div>' +
      '<small class="fld-h" id="h-' + id + '" data-hint="' + id + '"></small></div>' +
      slider +
      '<span class="fld-i"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="' + NONE +
      '" id="f-' + id + '" data-field="' + id + '" aria-describedby="h-' + id + '"><i' + (f.unitOpt ? ' data-unit-of="' + id + '"' : '') + '>' + esc(f.unit) + '</i></span></div>';
  }

  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  function mount() {
    all('[data-slot]').forEach(function (el) {
      el.outerHTML = fieldMarkup(el.getAttribute('data-slot'), {
        label: el.getAttribute('data-label'), plain: el.getAttribute('data-plain')
      });
    });
    // <div data-seg="i_cfg"> becomes the row of buttons of that option
    all('[data-seg]').forEach(function (el) {
      var key = el.getAttribute('data-seg');
      el.innerHTML = OPTIONS[key].map(function (o) {
        return '<button type="button" data-opt="' + key + '" data-val="' + o[0] + '" aria-pressed="false">' + esc(o[1]) + '</button>';
      }).join('');
    });
    inputs = all('input[data-field]');
    ranges = all('input[data-range]');
    hints = all('[data-hint]');
    inputs.forEach(function (inp) {
      inp.addEventListener('input', onInput);
      inp.addEventListener('change', onLeave);
    });
    ranges.forEach(function (rng) { rng.addEventListener('input', onRange); });
    all('[data-opt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-opt');
        if (!btn.hasAttribute('data-val')) return setOpt(key, !opts[key]);
        var val = btn.getAttribute('data-val');
        // a choice that may stay unanswered is taken back by a second click
        setOpt(key, NULLABLE[key] && opts[key] === val ? null : val);
      });
    });
    all('[data-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-open');
        setOpen(key, !open[key]);
      });
    });
    all('[data-action="reset"]').forEach(function (btn) { btn.addEventListener('click', reset); });
    all('[data-action="undo"]').forEach(function (btn) { btn.addEventListener('click', undo); });
    mounted = true;
    refreshInputs(null, true);
  }

  // Sets the text of every [data-out="key"] element that has a value in the map; marks the
  // element when there is no data behind it, or when the figure is below zero.
  function fill(map) {
    all('[data-out]').forEach(function (el) {
      var key = el.getAttribute('data-out');
      if (!(key in map)) return;
      var s = String(map[key]);
      if (el.textContent !== s) el.textContent = s;
      el.toggleAttribute('data-empty', s === NONE);
      el.toggleAttribute('data-nodata', s === NO_DATA);
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
    MODEL_VERSION: MODEL_VERSION, DEFAULTS_VERSION: DEFAULTS_VERSION,
    FIELDS: FIELDS, OPTIONS: OPTIONS, LINES: LINES, FLAGS: FLAGS, PARTS: PARTS, DISCLAIMER: DISCLAIMER,
    defaults: defaults, defaultOpts: defaultOpts, compute: compute, parse: parse,
    approxTime: approxTime, approxCash: approxCash, approxDays: approxDays, joined: joined,
    hoursD: hoursD, cashD: cashD, duration: duration, plain: plain,
    load: load, start: start, fill: fill, result: result, texts: texts,
    rows: rows, headline: headline, summary: summary, reportHead: reportHead, mailText: mailText, today: today,
    set: set, setOpt: setOpt, setOpen: setOpen, reset: reset, undo: undo,
    exportText: exportText, importText: importText,
    get: get, overLimit: overLimit,
    values: function () { return values; },
    opts: function () { return opts; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
