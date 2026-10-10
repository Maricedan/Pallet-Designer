/* Pallet Designer benefits calculator: the model and the form plumbing.
   Plain script, no build step: exposes window.PDCalc. Works from disk and over http; node loads
   it too, for the tests of the model.
   One script for three pages: the language comes from <html lang> (pl, en, de); in node it is
   Polish unless globalThis.PDCALC_LANG says otherwise, and PDCalc.setLocale switches it.
   Times and counts are the same in every language; only the money and the texts change.
   Two tabs that never mix: the integrator's and the production plant's. Every figure is
   count per year x (time today - time with the program) x hourly rate, never below zero.
   With Pallet Designer a layout is one joint run of about 3 minutes; changes and errors each
   carry their own trips, while the cost and the time of one trip are given once.
   The model is described in model.md beside the working copy; keep the two in step.
   Texts follow the site: a block of text never ends with a full stop. */
(function (global) {
  'use strict';

  var DAY_HOURS = 8;        // one working day
  var MONTH_HOURS = 160;    // one month of one person's work
  var AUDS = ['integrator', 'plant'];
  var OFFICE = ['design', 'plc', 'robot'];
  var NBSP = ' ';

  // With Pallet Designer one layout is one joint run: the layer, the placements and the data for
  // the PLC/HMI and the robot together (the real time, the one the film shows). Ours to state,
  // not the visitor's to type.
  var PD_LAYOUT_MIN = 3;
  // A layout for an offer also needs its PDF and a word with the customer.
  var PD_OFFER_MIN = 10;
  // On site the station is verified once: one hour per machine, not per layout.
  var PD_SITE_MIN = 60;
  // Hours per machine for the program that handles recipes and layouts (PLC-robot data
  // exchange, recipe screens) when the ready blocks and screens are used.
  var PD_SYSTEM_HOURS = 8;

  /* ---------- fields: what every language shares ---------- */

  // kind: count | min | hours | rate | pln      range: [min, max, step] of the slider
  // aud: the tab the field belongs to. Money fields (rate, pln) take def, max and range from
  // the language (MONEY below).
  function B(kind, def, max, range, aud) {
    return { kind: kind, def: def, max: max, range: range, aud: aud || 'integrator' };
  }
  var BASE = {
    /* integrator */
    projects: B('count', 3, 500, [1, 20, 1]),
    layouts: B('count', 7, 500, [1, 40, 1]),
    rate: B('rate'),

    // hours per machine: PLC and robot programmers together
    systemHours: B('hours', 30, 5000, [0, 200, 5]),

    // minutes one pallet layout takes today, stage by stage; sliders move by 5 minutes
    designNow: B('min', 30, 6000, [0, 180, 5]),
    plcNow: B('min', 30, 6000, [0, 180, 5]),
    robotNow: B('min', 50, 6000, [0, 180, 5]),
    siteNow: B('min', 90, 6000, [0, 300, 5]),

    // changes and errors, each with the trips it takes today; what one trip costs and how long
    // it takes is given once, for both
    changes: B('count', 7, 5000, [0, 50, 1]),
    changeTrips: B('count', 3, 5000, [0, 30, 1]),
    errors: B('count', 9, 5000, [0, 50, 1]),
    errorHours: B('hours', 3, 1000, [0, 24, 0.5]),
    errorTrips: B('count', 5, 5000, [0, 30, 1]),
    tripCost: B('pln'),
    tripHours: B('hours', 8, 1000, [0, 40, 1]),

    offers: B('count', 12, 5000, [0, 60, 1]),
    offerNow: B('min', 60, 6000, [0, 240, 5]),

    cfgMachines: B('count', 1, 500, [0, 10, 1]),
    cfgPrice: B('pln'),

    /* production plant: its own tab, never added to the integrator's figures */
    pOrders: B('count', 12, 5000, [0, 60, 1], 'plant'),
    pInternal: B('count', 0, 5000, [0, 60, 1], 'plant'),
    pRate: B('rate', 0, 0, null, 'plant'),
    pFee: B('pln', 0, 0, null, 'plant'),
    // the integrator does the data, but the plant still has to work the layout out and hand it over
    pHandover: B('min', 30, 6000, [0, 240, 5], 'plant'),
    pVisits: B('count', 2, 5000, [0, 20, 1], 'plant'),
    pVisitFee: B('pln', 0, 0, null, 'plant'),
    pInternalNow: B('min', 120, 6000, [0, 480, 5], 'plant')
  };

  /* ---------- languages ---------- */

  // Money per language: [start value, limit of a typed value, slider [min, max, step]].
  // Polish in PLN; English and German in EUR (sources in model.md, "Wersje EN i DE").
  var EUR_MONEY = {
    tripCost: [400, 250000, [0, 2000, 50]],
    cfgPrice: [12000, 2500000, [5000, 25000, 500]],
    pFee: [2500, 250000, [0, 6000, 100]],
    pVisitFee: [1500, 250000, [0, 5000, 100]]
  };
  function eur(rate, pRate) {
    var m = { rate: [rate, 1000, [20, 150, 5]], pRate: [pRate, 1000, [20, 150, 5]] }, k;
    for (k in EUR_MONEY) m[k] = EUR_MONEY[k];
    return m;
  }

  // Labels and hints are interface text: short, impersonal phrases.
  // fields: id -> [label, hint, unit]; the unit is left out where the kind gives it
  // (min, h, the currency) and a count takes the language's "a year".
  var LOCALES = {
    pl: {
      storageKey: 'pd-kalkulator-v8',
      currency: 'PLN',
      thousands: NBSP, decimal: ',', inputThousands: ' ',
      money: {
        rate: [120, 5000, [50, 400, 10]],
        tripCost: [1400, 1000000, [0, 5000, 100]],
        cfgPrice: [45000, 10000000, [25000, 100000, 5000]],
        pRate: [100, 5000, [50, 400, 10]],
        pFee: [5000, 1000000, [0, 10000, 250]],
        pVisitFee: [3000, 1000000, [0, 10000, 250]]
      },
      perYear: 'w roku',
      fields: {
        projects: ['Maszyny do paletyzacji lub depaletyzacji', 'pracujące już maszyny: punkt 4'],
        layouts: ['Układy palet na jedną maszynę, średnio', 'z wariantami dla różnych odbiorców', 'układów'],
        rate: ['Koszt godziny pracy zespołu', 'koszt własny firmy'],
        systemHours: ['Czas dziś, jedna maszyna', 'programiści PLC i robota łącznie'],
        designNow: ['Czas dziś, jeden układ', 'rysunek, chwytak, liczba odłożeń'],
        plcNow: ['Czas dziś, jeden układ', 'tablice, zakresy, obraz na panel, próbne wczytanie'],
        robotNow: ['Czas dziś, jeden układ', 'pobrania, pozycje chwytaka, kolejność'],
        siteNow: ['Czas dziś, jeden układ', 'zła pozycja, obrót, zakres'],
        changes: ['Zmiany układów', 'w trakcie projektów i po uruchomieniu'],
        changeTrips: ['Wyjazdy przy zmianach', ''],
        errors: ['Błędy w danych układów', ''],
        errorHours: ['Czas poprawy jednego błędu', 'od zrozumienia błędu do testu'],
        errorTrips: ['Wyjazdy przy błędach', ''],
        tripCost: ['Koszt jednego wyjazdu', 'dojazd i nocleg'],
        tripHours: ['Czas jednego wyjazdu', 'jedna osoba, z dojazdem'],
        offers: ['Oferty z paletyzacją lub depaletyzacją', ''],
        offerNow: ['Czas dziś, układ do jednej oferty', ''],
        cfgMachines: ['Maszyny sprzedane z konfigura\u00ADtorem', ''],
        cfgPrice: ['Pozycja w wycenie jednej maszyny', ''],
        pOrders: ['Układy zlecane integratorowi', 'nowe układy i zmiany'],
        pInternal: ['Układy przygoto­wywane własnym zespołem', 'nowe układy i zmiany'],
        pRate: ['Koszt godziny pracy własnej', ''],
        pFee: ['Opłata za jedno zlecenie', 'netto, z przyjazdem integratora'],
        pHandover: ['Czas dziś, jedno zlecenie', 'praca własna zakładu'],
        pVisits: ['Wizyty serwisu', ''],
        pVisitFee: ['Opłata za jedną wizytę', 'poza opłatą za zlecenie'],
        pInternalNow: ['Czas dziś, jeden układ', 'układ, dane dla maszyny, sprawdzenie']
      },
      // rows of the result, in the order they are shown
      events: {
        integrator: {
          system: 'Program obsługi receptur',
          layout: 'Nowe układy w projektach',
          change: 'Zmiany układów',
          error: 'Błędy w danych układów',
          offer: 'Układy do ofert'
        },
        plant: {
          orders: 'Opłaty za zlecenia',
          visits: 'Wizyty serwisu',
          handover: 'Przekazanie układów',
          internal: 'Układy własnego zespołu'
        }
      },
      // the two figures that add up to the total: [caption, line under the figure, word in the legend]
      panel: {
        integrator: { a: ['Oszczędność', 'czas zespołu i wyjazdy', 'oszczędność'], b: ['Przychód', 'konfigurator w ofercie', 'przychód'] },
        plant: { a: ['Opłaty', 'zlecenia i wizyty', 'opłaty'], b: ['Praca własna', 'wartość czasu', 'praca własna'] }
      },
      hoursYear: 'h w roku',
      workYear: 'h pracy w roku',
      cfgRow: 'Konfigurator: ',
      layoutsLine: function (n) {
        return 'razem ' + hours(n) + ' ' + plural(n, 'układ', 'układy', 'układów') + ' w roku';
      },
      daysLine: function (days, months) {
        return 'ok. ' + num(days, 0) + ' ' + (days === 1 ? 'dnia roboczego' : 'dni roboczych') +
          (months >= 0.1 ? ', ' + num(months, 1) + ' miesiąca jednej osoby' : '');
      },
      capped: 'Maks.: ',
      invalid: 'Błędna wartość: liczone jako 0',
      slider: ', suwak'
    },

    en: {
      storageKey: 'pd-calculator-en',
      currency: 'EUR',
      thousands: ',', decimal: '.', inputThousands: ',',
      money: eur(50, 45),
      perYear: 'a year',
      fields: {
        projects: ['Palletizing or depalletizing machines', 'machines already running: section 4'],
        layouts: ['Pallet layouts per machine, average', 'incl. variants for different customers', 'layouts'],
        rate: ['Internal hourly cost of the team', 'fully loaded cost, not a billing rate'],
        systemHours: ['Time today, one machine', 'PLC and robot programmers together'],
        designNow: ['Time today, one layout', 'drawing, gripper, number of placements'],
        plcNow: ['Time today, one layout', 'arrays, ranges, HMI image, test import'],
        robotNow: ['Time today, one layout', 'picks, gripper positions, placing order'],
        siteNow: ['Time today, one layout', 'wrong position, rotation, range'],
        changes: ['Layout changes', 'during projects and after go-live'],
        changeTrips: ['Trips for changes', ''],
        errors: ['Errors in layout data', ''],
        errorHours: ['Time to fix one error', 'from finding the cause to the test'],
        errorTrips: ['Trips for errors', ''],
        tripCost: ['Cost of one trip', 'travel and hotel'],
        tripHours: ['Duration of one trip', 'one person, incl. travel'],
        offers: ['Quotes involving (de)palletizing', ''],
        offerNow: ['Time today, layout for one quote', ''],
        cfgMachines: ['Machines sold with the configurator', ''],
        cfgPrice: ['Line item in one machine quote', ''],
        pOrders: ['Layouts ordered from the integrator', 'new layouts and changes'],
        pInternal: ['Layouts prepared in-house', 'new layouts and changes'],
        pRate: ['Internal hourly cost of plant staff', ''],
        pFee: ['Fee per job', 'excl. VAT, incl. the integrator’s site visit'],
        pHandover: ['Time today, one job', 'plant staff time'],
        pVisits: ['Service visits', ''],
        pVisitFee: ['Fee per service visit', 'on top of the job fee'],
        pInternalNow: ['Time today, one layout', 'layout, machine data, check']
      },
      events: {
        integrator: {
          system: 'Recipe handling program',
          layout: 'New layouts in projects',
          change: 'Layout changes',
          error: 'Layout data errors',
          offer: 'Layouts for quotes'
        },
        plant: {
          orders: 'Integrator job fees',
          visits: 'Service visits',
          handover: 'Briefing the integrator',
          internal: 'In-house layouts'
        }
      },
      panel: {
        integrator: { a: ['Savings', 'team time and trips', 'savings'], b: ['Revenue', 'configurator in the quote', 'revenue'] },
        plant: { a: ['Fees avoided', 'jobs and visits', 'fees avoided'], b: ['Staff time saved', 'value of the time', 'staff time'] }
      },
      hoursYear: 'h a year',
      workYear: 'h of work a year',
      cfgRow: 'Configurator: ',
      layoutsLine: function (n) {
        return hours(n) + ' ' + (n === 1 ? 'layout' : 'layouts') + ' a year in total';
      },
      daysLine: function (days, months) {
        return 'approx. ' + num(days, 0) + ' working ' + (days === 1 ? 'day' : 'days') +
          (months >= 0.1 ? ', ' + num(months, 1) + ' person-months' : '');
      },
      capped: 'Max: ',
      invalid: 'Invalid value: counted as 0',
      slider: ', slider'
    },

    // \u00AD (soft hyphen, here and in two Polish labels) lets a long word break in the narrow
    // label column at 1041-1070 px instead of running under the slider
    de: {
      storageKey: 'pd-rechner-de',
      currency: 'EUR',
      thousands: NBSP, decimal: ',', inputThousands: ' ',
      money: eur(60, 50),
      perYear: 'pro Jahr',
      fields: {
        projects: ['Palettier- oder Depalettier\u00ADanlagen', 'bestehende Anlagen: Abschnitt 4'],
        layouts: ['Palettier\u00ADmuster je Anlage, im Schnitt', 'mit Varianten für verschiedene Abnehmer', 'Layouts'],
        rate: ['Interner Stundensatz des Teams', 'Kostensatz, nicht Verrechnungssatz'],
        systemHours: ['Zeit heute, eine Anlage', 'SPS- und Roboter\u00ADprogrammierer zusammen'],
        designNow: ['Zeit heute, ein Layout', 'Zeichnung, Greifer, Anzahl der Ablagen'],
        plcNow: ['Zeit heute, ein Layout', 'Arrays, Bereiche, Panelbild, Testimport'],
        robotNow: ['Zeit heute, ein Layout', 'Aufnahmen, Greiferpositionen, Reihenfolge'],
        siteNow: ['Zeit heute, ein Layout', 'falsche Position, Drehung, Bereich'],
        changes: ['Layout\u00ADänderungen', 'in Projekten und nach der Inbetrieb\u00ADnahme'],
        changeTrips: ['Reisen bei Änderungen', ''],
        errors: ['Fehler in Layoutdaten', ''],
        errorHours: ['Dauer einer Fehler\u00ADbehebung', 'von der Fehlersuche bis zum Test'],
        errorTrips: ['Reisen bei Fehlern', ''],
        tripCost: ['Kosten einer Dienstreise', 'Fahrt und Übernachtung'],
        tripHours: ['Dauer einer Dienstreise', 'eine Person, inkl. Fahrt'],
        offers: ['Angebote für Palettier- oder Depalettier\u00ADanlagen', ''],
        offerNow: ['Zeit heute, Layout für ein Angebot', ''],
        cfgMachines: ['Mit Konfigurator verkaufte Anlagen', ''],
        cfgPrice: ['Position im Angebot einer Anlage', ''],
        pOrders: ['Beim Integrator beauftragte Layouts', 'neue Layouts und Änderungen'],
        pInternal: ['Vom eigenen Team erstellte Layouts', 'neue Layouts und Änderungen'],
        pRate: ['Interner Stundensatz des eigenen Personals', ''],
        pFee: ['Kosten je Auftrag', 'netto, inkl. Einsatz vor Ort'],
        pHandover: ['Zeit heute, ein Auftrag', 'Eigenleistung des Betriebs'],
        pVisits: ['Service\u00ADeinsätze', ''],
        pVisitFee: ['Kosten je Serviceeinsatz', 'zusätzlich zum Auftrag'],
        pInternalNow: ['Zeit heute, ein Layout', 'Layout, Maschinendaten, Prüfung']
      },
      events: {
        integrator: {
          system: 'Rezeptverwaltung',
          layout: 'Neue Layouts in Projekten',
          change: 'Layoutänderungen',
          error: 'Fehler in Layoutdaten',
          offer: 'Layouts für Angebote'
        },
        plant: {
          orders: 'Integratoraufträge',
          visits: 'Serviceeinsätze',
          handover: 'Abstimmung je Auftrag',
          internal: 'Layouts des eigenen Teams'
        }
      },
      panel: {
        integrator: { a: ['Einsparung', 'Teamzeit und Reisen', 'Einsparung'], b: ['Zusatzumsatz', 'Konfigurator im Angebot', 'Zusatzumsatz'] },
        plant: { a: ['Integratorkosten', 'Aufträge und Einsätze', 'Integratorkosten'], b: ['Eigenleistung', 'Wert der Arbeitszeit', 'Eigenleistung'] }
      },
      hoursYear: 'h/Jahr',
      workYear: 'Arbeitsstunden pro Jahr',
      cfgRow: 'Konfigurator: ',
      layoutsLine: function (n) {
        return 'insgesamt ' + hours(n) + ' ' + (n === 1 ? 'Layout' : 'Layouts') + ' pro Jahr';
      },
      daysLine: function (days, months) {
        return 'ca. ' + num(days, 0) + ' ' + (days === 1 ? 'Arbeitstag' : 'Arbeitstage') +
          (months >= 0.1 ? ', ' + num(months, 1) + ' Personenmonate' : '');
      },
      capped: 'Max.: ',
      invalid: 'Ungültiger Wert – mit 0 gerechnet',
      slider: ', Schieberegler'
    }
  };

  var LANG, L, FIELDS, EVENTS, PANEL;

  // The fields of one language: the shared values, its money and its texts.
  function buildFields(loc) {
    var out = {}, id, b, t, m;
    for (id in BASE) {
      b = BASE[id];
      t = loc.fields[id];
      m = loc.money[id];
      out[id] = {
        def: m ? m[0] : b.def,
        kind: b.kind,
        max: m ? m[1] : b.max,
        unit: t[2] || { min: 'min', hours: 'h', rate: loc.currency + '/h', pln: loc.currency }[b.kind] || loc.perYear,
        label: t[0],
        hint: t[1] || '',
        range: m ? m[2] : b.range,
        aud: b.aud
      };
    }
    return out;
  }

  /* ---------- numbers: in and out in the page's language ---------- */

  // s: a plain JS number string ("12500", "2.5"); out with the language's marks
  function group(s, sep) {
    var neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return (neg ? '−' : '') + parts.join(L.decimal);
  }

  // whole units of the currency, with the thousands separator
  function pln(n) {
    return group(String(Math.round(n)), L.thousands);
  }

  function num(n, decimals) {
    return group(n.toFixed(decimals), L.thousands);
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
    return group(String(h), L.thousands) + NBSP + 'h' + (m ? ' ' + m + NBSP + 'min' : '');
  }

  // Polish plural: 1 maszyna, 2 maszyny, 5 maszyn, 1,5 maszyny
  function plural(n, one, few, many) {
    if (n % 1 !== 0) return few;
    if (n === 1) return one;
    var d = n % 10, t = n % 100;
    return d >= 2 && d <= 4 && (t < 12 || t > 14) ? few : many;
  }

  function fmtInput(n, kind) {
    var s = String(Math.round(n * 100) / 100);
    return kind === 'pln' ? group(s, L.inputThousands) : s.replace('.', L.decimal);
  }

  // Float noise must not push a value across a rounding boundary.
  function money(x) {
    return Math.round(parseFloat(x.toFixed(6)));
  }

  /* Reads what a person typed. An empty field counts as the start value (shown as the
     placeholder); text and negative numbers count as 0 and are marked; a value over the
     field's limit is cut to the limit and marked.
     Polish and German: comma = decimal mark; "12.000" in a money field is twelve thousand.
     English: dot = decimal mark; "1,500" (comma in groups of three) is one thousand five
     hundred; any other single comma is taken as a decimal mark. */
  function parse(text, id) {
    var f = FIELDS[id];
    var s = String(text == null ? '' : text).replace(/[\s  ]/g, '');
    if (s === '') return { value: f.def, status: 'empty' };
    var grouping = L.decimal === ',' ? '.' : ',';
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) {
      // both marks present: the last one is the decimal mark
      var thousands = s.lastIndexOf(',') > s.lastIndexOf('.') ? '.' : ',';
      s = s.split(thousands).join('');
    } else if ((L.decimal === '.' || f.kind === 'pln') &&
        new RegExp('^\\d{1,3}(\\' + grouping + '\\d{3})+$').test(s)) {
      s = s.split(grouping).join('');   // "12.000" (pl, de) or "12,000" (en): twelve thousand
    }
    s = s.replace(',', '.');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(s)) return { value: 0, status: 'invalid' };
    var n = parseFloat(s);
    if (!isFinite(n)) return { value: 0, status: 'invalid' };
    if (n > f.max) return { value: f.max, status: 'capped' };
    return { value: n, status: 'ok' };
  }

  /* ---------- the model ---------- */

  // Collects the lines of one tab. Every line is rounded to whole units of the currency and
  // totals are sums of lines, so the cards and the rows of the result add up to the same total.
  function sheet(rate, names) {
    var lines = [], line = {};
    return {
      // hoursSaved: people's time, valued at the hourly rate; cash: money paid out today
      add: function (event, part, hoursSaved, cash) {
        var l = { id: event + '.' + part, event: event, hoursSaved: hoursSaved, plnSaved: money(hoursSaved * rate + cash) };
        lines.push(l);
        line[l.id] = l;
      },
      close: function () {
        var events = {}, savings = 0, hoursSaved = 0, k;
        for (k in names) events[k] = { plnSaved: 0, hoursSaved: 0 };
        lines.forEach(function (l) {
          events[l.event].plnSaved += l.plnSaved;
          events[l.event].hoursSaved += l.hoursSaved;
          savings += l.plnSaved;
          hoursSaved += l.hoursSaved;
        });
        return { lines: lines, line: line, events: events, savings: savings, hours: hoursSaved };
      }
    };
  }

  // A saving never goes below zero: less time today than with the program counts as no gain.
  function over(now, withProgram) {
    return Math.max(0, now - withProgram);
  }

  function integrator(v) {
    var layouts = v.projects * v.layouts;
    var office = v.designNow + v.plcNow + v.robotNow;   // minutes today, one layout in the office
    var saved = over(office, PD_LAYOUT_MIN);            // minutes saved on one layout
    var s = sheet(v.rate, EVENTS.integrator);

    // once per machine: the joint work of the PLC and the robot programmers
    s.add('system', 'all', v.projects * over(v.systemHours, PD_SYSTEM_HOURS), 0);
    // the three office stages become one run, so the saving of a layout is one figure; a card
    // shows the share of its stage in it
    OFFICE.forEach(function (d) {
      var share = office > 0 ? v[d + 'Now'] / office : 0;
      s.add('layout', d, layouts * saved * share / 60, 0);
    });
    // on site: today every layout is tried, with the program the station is verified once
    s.add('layout', 'site', v.projects * over(v.layouts * v.siteNow, PD_SITE_MIN) / 60, 0);
    // a change is one more layout in the office; a trip is a person's hours and money paid out
    s.add('change', 'all', v.changes * saved / 60 + v.changeTrips * v.tripHours, v.changeTrips * v.tripCost);
    // with the program an error in the layout data does not arise
    s.add('error', 'all', v.errors * v.errorHours + v.errorTrips * v.tripHours, v.errorTrips * v.tripCost);
    s.add('offer', 'all', v.offers * over(v.offerNow, PD_OFFER_MIN) / 60, 0);

    var r = s.close();
    r.a = r.savings;
    r.b = money(v.cfgMachines * v.cfgPrice);   // revenue: the configurator as an item of the offer
    r.total = r.a + r.b;
    r.layoutsYear = layouts;
    r.trip = money(v.tripCost + v.tripHours * v.rate);
    return r;
  }

  function plant(v) {
    var s = sheet(v.pRate, EVENTS.plant);
    // with the program the plant prepares the layout itself: the fee and the visit go away
    s.add('orders', 'all', 0, v.pOrders * v.pFee);
    s.add('visits', 'all', 0, v.pVisits * v.pVisitFee);
    // and a few minutes with the program take the place of handing the layout over
    s.add('handover', 'all', v.pOrders * over(v.pHandover, PD_LAYOUT_MIN) / 60, 0);
    s.add('internal', 'all', v.pInternal * over(v.pInternalNow, PD_LAYOUT_MIN) / 60, 0);

    var r = s.close();
    r.a = r.events.orders.plnSaved + r.events.visits.plnSaved;        // fees
    r.b = r.events.handover.plnSaved + r.events.internal.plnSaved;    // own work
    r.total = r.a + r.b;
    r.layoutsYear = v.pOrders + v.pInternal;
    return r;
  }

  // Both tabs are always worked out; the page shows the one in view.
  function compute(v) {
    return { integrator: integrator(v), plant: plant(v) };
  }

  // Strings for the [data-out] slots of the page. Cards: "i." the integrator's, "p." the plant's.
  function texts(r) {
    var m = {}, v = values;
    AUDS.forEach(function (a) {
      var p = a.charAt(0) + '.', x = r[a], k;
      for (k in x.events) {
        m[p + 'e.' + k + '.pln'] = pln(x.events[k].plnSaved);
        m[p + 'e.' + k + '.h'] = hours(x.events[k].hoursSaved) + NBSP + L.hoursYear;
      }
      x.lines.forEach(function (l) {
        m[p + 'l.' + l.id + '.pln'] = pln(l.plnSaved);
        m[p + 'l.' + l.id + '.h'] = hours(l.hoursSaved) + NBSP + L.hoursYear;
      });
      m[p + 'layoutsYear'] = L.layoutsLine(x.layoutsYear);
    });
    m['i.revenue'] = pln(r.integrator.b);
    m['i.trip'] = pln(r.integrator.trip);
    m['i.cfgRow'] = L.cfgRow + hours(v.cfgMachines) + ' × ' + pln(v.cfgPrice) + NBSP + L.currency;

    // the panel shows the tab in view
    var cur = r[aud], panel = PANEL[aud];
    var days = Math.round(cur.hours / DAY_HOURS), months = Math.round(cur.hours / MONTH_HOURS * 10) / 10;
    ['a', 'b'].forEach(function (k) {
      m[k + '.big'] = pln(cur[k]);
      m[k + '.cap'] = panel[k][0];
      m[k + '.sub'] = panel[k][1];
      m[k + '.leg'] = panel[k][2];
    });
    m.total = pln(cur.total);
    m.mbar = pln(cur.total) + NBSP + L.currency;
    m.hoursLine = hours(cur.hours) + NBSP + L.workYear;
    m.daysLine = L.daysLine(days, months);
    return m;
  }

  /* ---------- state, kept in this browser ---------- */

  var values;
  var aud = AUDS[0];
  var listeners = [];
  var inputs = [];
  var ranges = [];

  function defaults() {
    var o = {};
    for (var id in FIELDS) o[id] = FIELDS[id].def;
    return o;
  }

  function load() {
    values = defaults();
    aud = AUDS[0];
    try {
      var saved = JSON.parse(global.localStorage.getItem(L.storageKey) || '{}');
      var kept = saved.values || {};
      for (var id in values) {
        var n = kept[id];
        if (typeof n === 'number' && isFinite(n) && n >= 0) values[id] = Math.min(n, FIELDS[id].max);
      }
      if (AUDS.indexOf(saved.aud) >= 0) aud = saved.aud;
    } catch (e) { /* storage unavailable or damaged: the start values apply */ }
  }

  function save() {
    try { global.localStorage.setItem(L.storageKey, JSON.stringify({ values: values, aud: aud })); } catch (e) { /* not kept */ }
  }

  function result() {
    var r = compute(values);
    r.aud = aud;
    return r;
  }

  function notify() {
    var r = result();
    var t = texts(r);
    all('[data-eq]').forEach(function (el) {
      // the hours next to a minutes field; under an hour the field says it all
      var min = values[el.getAttribute('data-eq')];
      var s = min >= 60 ? '= ' + duration(min) : '';
      if (el.textContent !== s) el.textContent = s;
    });
    listeners.forEach(function (fn) { fn(r, t); });
  }

  function set(id, n, src) {
    values[id] = n;
    save();
    refreshInputs(src, false);
    notify();
  }

  function setAud(a) {
    if (AUDS.indexOf(a) < 0 || a === aud) return;
    aud = a;
    save();
    notify();
  }

  // Writes the state back into the fields and sliders other than the one being used.
  function refreshInputs(src, force) {
    inputs.forEach(function (inp) {
      var id = inp.getAttribute('data-field');
      var f = FIELDS[id];
      var want = values[id];
      inp.classList.toggle('mine', want !== f.def);
      if (inp === src) return;
      if (!force) {
        // a field with the focus is left as typed, unless its own slider has just moved
        var own = !!src && src.getAttribute('data-range') === id;
        if (inp === document.activeElement && !own) return;
        if (parse(inp.value, id).value === want) return;
      }
      inp.value = fmtInput(want, f.kind);
      inp.placeholder = fmtInput(f.def, f.kind);
      inp.classList.remove('bad');
      inp.removeAttribute('title');
    });
    ranges.forEach(function (rng) {
      if (rng === src) return;
      rng.value = String(values[rng.getAttribute('data-range')]);   // the browser keeps it inside min..max
    });
  }

  function onInput(e) {
    var inp = e.target;
    var id = inp.getAttribute('data-field');
    var p = parse(inp.value, id);
    var bad = p.status === 'invalid' || p.status === 'capped';
    inp.classList.toggle('bad', bad);
    if (p.status === 'capped') inp.title = L.capped + fmtInput(FIELDS[id].max, FIELDS[id].kind);
    else if (bad) inp.title = L.invalid;
    else inp.removeAttribute('title');
    set(id, p.value, inp);
  }

  function onRange(e) {
    set(e.target.getAttribute('data-range'), parseFloat(e.target.value), e.target);
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  // <div data-slot="projects"> becomes a field: label, slider, number.
  function fieldMarkup(id) {
    var f = FIELDS[id];
    var eq = f.kind === 'min' ? '<em data-eq="' + id + '"></em>' : '';
    return '<div class="fld">' +
      '<label class="fld-l" for="f-' + id + '">' + esc(f.label) + (f.hint ? '<small>' + esc(f.hint) + '</small>' : '') + '</label>' +
      '<input type="range" data-range="' + id + '" min="' + f.range[0] + '" max="' + f.range[1] + '" step="' + f.range[2] +
      '" aria-label="' + esc(f.label + L.slider) + '">' +
      '<span class="fld-i"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" id="f-' + id +
      '" data-field="' + id + '"><i>' + esc(f.unit) + '</i>' + eq + '</span></div>';
  }

  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel));
  }

  function mount() {
    all('[data-slot]').forEach(function (el) {
      el.outerHTML = fieldMarkup(el.getAttribute('data-slot'));
    });
    // the times counted with the program, shown on the cards
    var pd = { layout: PD_LAYOUT_MIN, offer: PD_OFFER_MIN, site: PD_SITE_MIN, system: PD_SYSTEM_HOURS * 60 };
    all('[data-pd]').forEach(function (el) {
      el.textContent = duration(pd[el.getAttribute('data-pd')]);
    });
    inputs = all('input[data-field]');
    ranges = all('input[data-range]');
    inputs.forEach(function (inp) { inp.addEventListener('input', onInput); });
    ranges.forEach(function (rng) { rng.addEventListener('input', onRange); });
    refreshInputs(null, true);
    all('[data-action="reset"]').forEach(function (btn) { btn.addEventListener('click', reset); });
    all('[data-aud-set]').forEach(function (btn) {
      btn.addEventListener('click', function () { setAud(btn.getAttribute('data-aud-set')); });
    });
  }

  // Start values for the tab in view; the other tab keeps its numbers.
  function reset() {
    for (var id in FIELDS) if (FIELDS[id].aud === aud) values[id] = FIELDS[id].def;
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

  // tab: the tab a link asks for (the page reads it from the address), over the remembered one
  function start(render, tab) {
    load();
    if (AUDS.indexOf(tab) >= 0) aud = tab;
    mount();
    listeners.push(render);
    notify();
  }

  var api = {
    AUDS: AUDS, LANGS: Object.keys(LOCALES),
    PD_LAYOUT_MIN: PD_LAYOUT_MIN, PD_OFFER_MIN: PD_OFFER_MIN, PD_SITE_MIN: PD_SITE_MIN, PD_SYSTEM_HOURS: PD_SYSTEM_HOURS,
    defaults: defaults, compute: compute, parse: parse, texts: texts, result: result,
    pln: pln, num: num, hours: hours, duration: duration, fmtInput: fmtInput,
    start: start, fill: fill, reset: reset, set: set, setAud: setAud,
    setLocale: setLocale,
    get: function (id) { return values[id]; },
    aud: function () { return aud; },
    values: function () { return values; }
  };

  // Switches the language: fields, rows, panel and the start values (pl when unknown).
  function setLocale(lang) {
    LANG = LOCALES.hasOwnProperty(lang) ? lang : 'pl';
    L = LOCALES[LANG];
    FIELDS = buildFields(L);
    EVENTS = L.events;
    PANEL = L.panel;
    values = defaults();
    api.lang = LANG;
    api.FIELDS = FIELDS;
    api.EVENTS = EVENTS;
    api.PANEL = PANEL;
    api.CURRENCY = L.currency;
    api.STORAGE_KEY = L.storageKey;
    return api;
  }

  var doc = global.document;
  setLocale(doc && doc.documentElement ? String(doc.documentElement.lang || '').slice(0, 2).toLowerCase() : global.PDCALC_LANG || 'pl');

  global.PDCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
