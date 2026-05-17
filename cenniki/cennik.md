# Cennik Pallet Designer — propozycja treści (DRAFT v2)

> **Status:** wersja robocza, NIE wpięta jeszcze do `index.html`.
> Prototyp wizualny: zobacz `cennik-prototyp.html` (otwórz w przeglądarce — pokazuje jak to może wyglądać na stronie).
>
> **Jak edytować ten plik (konwencja z `tresc.md`):**
> - Zmieniaj tekst po dwukropku (`**Pole:** tekst`) lub w akapitach pod etykietami.
> - `*kursywa*` w nagłówkach H2, `**pogrubienie**` w treści.
> - Linie zaczynające się od `>` to moje notki / uzasadnienia — nie pojawią się na stronie.
> - Bloki `OPCJA 1 / 2 / 3` to alternatywne sformułowania — zostaw jedną, resztę usuń.
> - **Zasada interpunkcji:** ostatnie zdanie w sekcji NIE kończy się kropką.
> - Po zatwierdzeniu napisz: *„zatwierdzam cennik, przenieś do tresc.md"*.

---

## ☝️ Kluczowa zasada cennika (notatka, nie idzie na stronę)

> **Pokazujemy tylko 1 cenę wprost: PLC/HMI = 12 000 PLN jednorazowo.**
> Pozostałe licencje są w modelu „**wycena na zapytanie**" — żeby integratorzy zgłaszali się po ofertę. Każdy kafelek ma własne CTA prowadzące do formularza / maila / telefonu.
>
> **Dlaczego tak:**
> - Cena per-seat zależy od liczby stanowisk → trudno podać jedną liczbę bez utraty marży.
> - Cena per-maszyna zależy od wolumenu (pakiety) + typu licencji (roczna vs dożywotnia) → musisz mieć kontekst klienta, żeby dobrać sensownie.
> - PLC/HMI jest **stałą wartością** (szkolenie + implementacja + drobne dopasowanie kodu = pakiet) → możemy zakomunikować wprost, bo to buduje zaufanie i jest najprostszy element do zrozumienia.

---

# SEKCJA 1: MODEL LICENCJONOWANIA

> Trzy kafelki obok siebie, każdy z własnym CTA. Pod kaflami — jeden wspólny pasek z notą o modyfikacjach indywidualnych + przycisk „Porozmawiajmy o Twoim projekcie".

## Meta sekcji

**Etykieta sekcji (mały tekst nad tytułem):**

> 3 propozycje:
- OPCJA 1: Cennik
- OPCJA 2: Model licencjonowania
- OPCJA 3: Jak rozliczamy

**Wybrana etykieta:** Model licencjonowania

---

**Tytuł H2 (główny nagłówek sekcji):**

> 3 propozycje:
- OPCJA 1: Trzy elementy, *jedna prosta logika*
- OPCJA 2: Płacisz za to, *co realnie wnosi wartość*
- OPCJA 3: Pallet Designer rozliczamy *w trzech krokach*

**Wybrany tytuł H2:** Trzy elementy, *jedna prosta logika*

---

**Intro (akapit pod tytułem):**

> 2 propozycje:

- OPCJA 1: Licencja dla zespołu projektowego integratora, licencja dla aplikacji u klienta końcowego oraz jednorazowa integracja z systemem PLC/HMI. Każdy element można kupić osobno albo razem — dopasowujemy zakres do skali Twoich projektów

- OPCJA 2: Trzy niezależne elementy: narzędzie dla Twoich inżynierów, aplikacja u klienta końcowego oraz integracja z PLC/HMI. Pierwszy i drugi to licencje rozliczane na zapytanie (zależne od skali), trzeci to stała kwota za wdrożenie

**Wybrane intro:** OPCJA 1

---

## Kafelek 1: Licencja dla integratora

> Licencja na stanowisko, dla zespołu projektowego integratora. Przypisana do komputera, ale przenoszalna (floating w obrębie organizacji integratora). Cena = na zapytanie (zależna od liczby seatów).

**Ikona / symbol (do wyboru):** 🧑‍💻 (lub: monitor, narzędzia, klucz — do ustalenia z designerem)

**Tytuł kafelka:**

> 3 propozycje:
- OPCJA 1: Licencja dla integratora
- OPCJA 2: Stanowisko projektowe
- OPCJA 3: Seat dla Twojego zespołu

**Wybrany tytuł:** Licencja dla integratora

---

**Tagline pod tytułem (1 zdanie):**

> 2 propozycje:
- OPCJA 1: Dla zespołu, który projektuje i konfiguruje maszyny
- OPCJA 2: Narzędzie pracy dla konstruktora, automatyka i robotyka

**Wybrany tagline:** Dla zespołu, który projektuje i konfiguruje maszyny

---

**Lista „Co dostajesz" (3–5 punktów):**

- Pełna funkcjonalność aplikacji desktop
- Licencja przypisana do stanowiska (możliwość przenoszenia między komputerami w organizacji)
- Praca offline — bez wymogu stałego internetu
- Aktualizacje i support techniczny w cenie subskrypcji
- Sterowniki bazowe (Siemens TIA) + możliwość rozbudowy

**Modele rozliczeń:**

- **Subskrypcja roczna** — utrzymanie i aktualizacje wliczone w cenę
- **Licencja dożywotnia** — wycena indywidualna, w zależności od liczby stanowisk

**Cena (wyświetlana):**

> 2 propozycje formy:
- OPCJA 1: Wycena indywidualna
- OPCJA 2: Cena zależna od liczby stanowisk

**Wybrana forma:** Wycena indywidualna

**Mała etykieta pod ceną (mono, drobny tekst):** zależnie od liczby stanowisk i modelu rozliczeń

**Przycisk CTA na kafelku:** Zapytaj o cenę →
**Akcja CTA (link):** mailto:marcin@palletdesigner.com?subject=Pallet%20Designer%20%E2%80%94%20licencja%20dla%20integratora&body=Dzie%C5%84%20dobry%2C%20prosz%C4%99%20o%20wycen%C4%99%20licencji%20dla%20%5Bliczba%5D%20stanowisk.

---

## Kafelek 2: Licencja na aplikację dla klienta końcowego

> Licencja aktywująca aplikację u klienta końcowego (per-maszyna w sensie biznesowym, ale technicznie licencjonujemy aplikację, bo w maszynie nie da się skontrolować, na ilu fizycznych stanowiskach pracuje). Dwie ścieżki: roczna albo dożywotnia. Wszystko na zapytanie, bo cena zależy od pakietu.

**Ikona / symbol:** 🏭 (lub: fabryka, klient, maszyna)

**Tytuł kafelka:**

> 3 propozycje:
- OPCJA 1: Licencja aplikacji dla klienta końcowego
- OPCJA 2: Aplikacja u klienta — per-projekt
- OPCJA 3: Licencja na maszynę

**Wybrany tytuł:** Licencja aplikacji dla klienta końcowego

---

**Tagline pod tytułem:**

> 2 propozycje:
- OPCJA 1: Aplikacja konfiguracyjna, którą dostarczasz razem z maszyną
- OPCJA 2: Samoobsługowy konfigurator dla zakładu produkcyjnego klienta

**Wybrany tagline:** Aplikacja konfiguracyjna, którą dostarczasz razem z maszyną

---

**Lista „Co dostajesz":**

- Aplikacja Pallet Designer do zainstalowania w środowisku klienta końcowego
- Możliwość projektowania nowych układów po stronie operatora / technologa zakładu
- Wszystkie parametry stanowiska zaszyte przez integratora — klient nie modyfikuje granic technicznych
- Eksport danych do tej samej maszyny, na której pracuje (PLC/HMI/robot)
- Generowanie PDF z układem (np. dla działu zaopatrzenia klienta)

**Modele rozliczeń:**

- **Subskrypcja roczna** — utrzymanie i aktualizacje w cenie
- **Licencja dożywotnia** — wycena indywidualna w zależności od liczby stanowisk klienta

**Pakiety wolumenowe (ważne!):**

> 2 propozycje sformułowania:

- OPCJA 1: Integratorzy planujący kilka projektów w danym okresie mogą wykupić **pakiet licencji** w cenie znacząco niższej niż pojedyncze zakupy
- OPCJA 2: Wykupując pakiet (np. 5+ licencji z góry), dostajesz **rabat wolumenowy** — szczegóły uzgadniamy indywidualnie

**Wybrana wersja:** Integratorzy planujący kilka projektów w danym okresie mogą wykupić **pakiet licencji** w cenie znacząco niższej niż pojedyncze zakupy

**Cena (wyświetlana):** Wycena indywidualna

**Mała etykieta pod ceną:** roczna lub dożywotnia · pakiety wolumenowe dostępne

**Przycisk CTA:** Zapytaj o ofertę →
**Akcja CTA:** mailto:marcin@palletdesigner.com?subject=Pallet%20Designer%20%E2%80%94%20licencja%20dla%20klienta%20ko%C5%84cowego

---

## Kafelek 3: Integracja PLC/HMI

> JEDYNY element z ceną pokazaną wprost. To pakiet pracy: bloki funkcyjne + ekrany HMI + szkolenie + asysta przy implementacji + drobne dopasowanie kodu pod standard integratora.

**Ikona / symbol:** ⚙️ (lub: PLC, integracja, puzzle)

**Tytuł kafelka:**

> 3 propozycje:
- OPCJA 1: Integracja PLC/HMI
- OPCJA 2: Pakiet wdrożeniowy Siemens
- OPCJA 3: Wdrożenie + szkolenie

**Wybrany tytuł:** Integracja PLC/HMI

---

**Tagline pod tytułem:**

> 2 propozycje:
- OPCJA 1: Pakiet startowy — uruchamiamy Pallet Designera w Twojej maszynie
- OPCJA 2: Bloki, ekrany, szkolenie, dopasowanie kodu — w jednej cenie

**Wybrany tagline:** Pakiet startowy — uruchamiamy Pallet Designera w Twojej maszynie

---

**Lista „W cenie pakietu":**

- Bloki funkcyjne Pallet Designer dla **Siemens TIA Portal** (obecnie wspierany system)
- Komplet ekranów HMI z podglądem warstw i obsługą korekt
- Szkolenie zespołu integratora (online lub on-site, do uzgodnienia)
- Asysta techniczna przy pierwszym wdrożeniu na maszynie
- Drobne dopasowanie kodu pod standard integratora (np. nazewnictwo zmiennych, struktura projektu)

**Cena (wyświetlana wprost):**

**12 000 PLN** netto, jednorazowo

**Mała etykieta pod ceną:** Siemens TIA Portal · jednorazowa opłata · brak abonamentu

**Przycisk CTA:** Umów rozmowę o wdrożeniu →
**Akcja CTA:** mailto:marcin@palletdesigner.com?subject=Pallet%20Designer%20%E2%80%94%20integracja%20PLC%2FHMI

> **NOTKA dla mnie:** w przyszłości (KUKA, ABB, Rockwell) możemy:
> - dodać osobne kafelki dla każdego brandu (i wtedy każdy ma swoją cenę),
> - albo zostawić ten kafelek z napisem „Siemens TIA — w cenie. Inne systemy — wycena indywidualna".
> Sugeruję drugą drogę — prostszy layout, łatwiej skalować.

---

## Pasek pod kaflami (wspólny dla wszystkich 3 kafelków)

**Tekst paska:**

> 2 propozycje:

- OPCJA 1: **Modyfikacje na życzenie wyceniamy indywidualnie.** Każdy projekt ma swoją specyfikę — dopisanie nowego formatu eksportu, integracja z istniejącym systemem czy customowy moduł to osobna pozycja, którą wyceniamy po krótkiej rozmowie

- OPCJA 2: Każda nietypowa potrzeba — nowy format danych, dodatkowy driver, customowa zakładka — to **osobna wycena**. Bez ukrytych kosztów: zawsze widzisz, za co płacisz

**Wybrana wersja:** OPCJA 1

**Przycisk CTA na pasku:** Porozmawiajmy o Twoim projekcie →
**Akcja CTA:** kotwica do sekcji kontaktowej (#cta) lub mailto

---

# SEKCJA 2: ZWROT INWESTYCJI (ROI)

> Sekcja z dwoma „polami korzyści". Każde pole to lista pozycji z **konkretnym wyliczeniem na pierwszym planie** + **ⓘ z rozwinięciem** (tooltip / popover) dla zainteresowanych.
> Filozofia: na stronie widać LICZBY, nie eseje. Esej jest schowany pod ⓘ — kto chce, ten kliknie.

## Meta sekcji ROI

**Etykieta sekcji:**

> 3 propozycje:
- OPCJA 1: Zwrot inwestycji
- OPCJA 2: Co zyskujesz
- OPCJA 3: Policzmy

**Wybrana etykieta:** Zwrot inwestycji

---

**Tytuł H2:**

> 3 propozycje:
- OPCJA 1: Pallet Designer *zwraca się* już na pierwszym projekcie
- OPCJA 2: Dwa źródła oszczędności. *Konkretne liczby*
- OPCJA 3: Mniej godzin zespołu. *Nowa pozycja w ofercie*

**Wybrany tytuł H2:** Pallet Designer *zwraca się* już na pierwszym projekcie

---

**Intro (1 akapit):**

Wartość Pallet Designera dla integratora ma dwa źródła: **mniej godzin zespołu projektowego** na każdej maszynie oraz **nowa pozycja w ofercie dla klienta końcowego**, którą sprzedaje się bez dodatkowej pracy programistycznej

---

## POLE A: Mniej godzin zespołu projektowego

> Lewa kolumna. Headline z sumą + lista 4–5 pozycji z liczbami i ⓘ z rozwinięciem. Na końcu komunikat zamykający.

**Ikona / symbol pola:** ⏱

**Tytuł pola:**

> 2 propozycje:
- OPCJA 1: Twój zespół projektowy pracuje *szybciej*
- OPCJA 2: Mniej godzin na każdej maszynie

**Wybrany tytuł pola:** Twój zespół projektowy pracuje *szybciej*

---

**Headline numeryczny (duża liczba):**

> 2 propozycje:
- OPCJA 1: **22–58 h** oszczędności na typowym projekcie
- OPCJA 2: **3–7 dni roboczych** mniej na jednej maszynie

**Wybrany headline:** **22–58 h** oszczędności na typowym projekcie

**Pod headlinem (drobna etykieta):**

> 2 propozycje:
- OPCJA 1: ≈ 4 400 – 11 600 PLN przy stawce 200 PLN/h
- OPCJA 2: ≈ 5 600 – 14 500 PLN przy stawce 250 PLN/h

**Wybrane:** ≈ 4 400 – 11 600 PLN przy stawce 200 PLN/h

---

### Pozycja A.1: Konstrukcja i analiza wykonalności

**Liczba (przed ⓘ):** 4–8 h / projekt

**Treść tooltipa (rozwinięcie po kliknięciu ⓘ):**
Konstruktor szybciej dobiera chwytak i analizuje wykonalność układu. W aplikacji od razu widać, czy dana wielkość chwytaka pozwala na zaplanowane odłożenia, czy nie ma kolizji, ile elementów można pobierać jednocześnie. Decyzje, które wcześniej wymagały rysowania wariantów i przeliczania w arkuszu — robisz teraz w kilka minut, na żywym podglądzie

---

### Pozycja A.2: Programowanie PLC i HMI

**Liczba (przed ⓘ):** 6–14 h / projekt

**Treść tooltipa:**
Nie ma ręcznego dopisywania receptur do każdego nowego układu. Bloki funkcyjne Siemens TIA i ekrany HMI są w komplecie — wczytujesz dane wygenerowane przez aplikację i maszyna od razu wie, co ma robić. Operator dostaje wizualny podgląd warstwy bez dodatkowej pracy programisty

---

### Pozycja A.3: Programowanie / przygotowanie robota

**Liczba (przed ⓘ):** 4–10 h / projekt

**Treść tooltipa:**
Robotyk lub automatyk dostają gotowy podział na odłożenia i pozycje pobierania. Dane są w spójnym formacie — można je wczytać do symulacji, zweryfikować trajektorię, sprawdzić ryzyko kolizji bez ręcznego rysowania każdego punktu. Możesz też przejąć kontrolę nad cyklem w trybie ręcznym, jeśli projekt tego wymaga

---

### Pozycja A.4: Testowanie i uruchomienie

**Liczba (przed ⓘ):** 8–24 h / projekt

**Treść tooltipa:**
Najmocniejsza pozycja oszczędności. Po wdrożeniu Pallet Designera testujesz **fizycznie tylko pierwszy układ** — sprawdzasz punkty robota, chwytak, pozycje względem produktu. Od tego momentu każdy następny układ wygenerowany w aplikacji **po prostu działa** — bo wszystko powstaje w tym samym systemie, na tych samych parametrach stanowiska. Bez przygotowywania scenariuszy testowych, bez czekania na dostawę produktu z magazynu, bez układania warstw ręcznie po to, żeby przetestować kolejną

---

### Pozycja A.5: Modyfikacje i dorabianie układów

**Liczba (przed ⓘ):** dni → minuty

**Treść tooltipa:**
Klient prosi o korektę albo nowy wariant? Otwierasz układ w aplikacji, przesuwasz to, co trzeba, generujesz, wgrywasz — **dwie minuty roboty**. W interfejsie graficznym widać korektę na żywo, więc znika ryzyko „dałem korektę w złą stronę". Brak ręcznego przeliczania pozycji, brak otwierania-zamykania receptur, brak szukania po plikach

---

**Komunikat zamykający POLE A:**

> 3 propozycje:

- OPCJA 1: **Te godziny zostają w marży integratora.** Klient końcowy ich nie widzi — widzi tylko maszynę, która działa szybciej i bez kar za opóźnienia

- OPCJA 2: **Każdy następny układ działa pierwszym razem.** To nie jest „przyspieszenie" — to wycofanie się z całego cyklu testowania, który nie jest już potrzebny

- OPCJA 3: **Mniej godzin = więcej pojemności zespołu na kolejne projekty.** Ten sam zespół realizuje rocznie więcej maszyn, bez powiększania struktury

**Wybrany komunikat zamykający:** OPCJA 1

---

## POLE B: Nowa pozycja w ofercie + szybkie dorabianie układów

> Prawa kolumna. Headline + lista 4 pozycji z ⓘ. Komunikat zamykający.

**Ikona / symbol pola:** 💼 (lub: oferta, dokument, znak +)

**Tytuł pola:**

> 2 propozycje:
- OPCJA 1: Gotowy konfigurator *w Twojej ofercie*
- OPCJA 2: Nowa pozycja w wycenie, *zero pracy programistycznej*

**Wybrany tytuł pola:** Gotowy konfigurator *w Twojej ofercie*

---

**Headline numeryczny:**

> 2 propozycje:
- OPCJA 1: **Miesiące** R&D zaoszczędzone na własnym konfiguratorze
- OPCJA 2: **+1 pozycja** w ofercie, którą sprzedajesz bez dopisywania kodu

**Wybrany headline:** **Miesiące** R&D zaoszczędzone na własnym konfiguratorze

**Pod headlinem (drobna etykieta):**

> 2 propozycje:
- OPCJA 1: 2–6 miesięcy pracy programisty + testy + utrzymanie
- OPCJA 2: Gotowy moduł zamiast własnego R&D wartego 60–180 tys. PLN

**Wybrane:** 2–6 miesięcy pracy programisty + testy + utrzymanie

---

### Pozycja B.1: Konfigurator jako pozycja w ofercie

**Skrót (przed ⓘ):** Sprzedajesz konfigurator klientowi końcowemu

**Treść tooltipa:**
Klient końcowy chce elastyczności — możliwości dorabiania nowych układów bez angażowania integratora przy każdej zmianie smaku, opakowania czy wariantu. Pallet Designer daje to jako gotową funkcję. Możesz ją zaofertować jako **dodatkową, płatną pozycję w cenie maszyny** — koszt po Twojej stronie minimalny (licencja), wartość dla klienta wymierna (samoobsługa, niezależność od integratora)

---

### Pozycja B.2: Nowy układ po wdrożeniu — minuty zamiast godzin

**Skrót (przed ⓘ):** Modyfikacje to godziny, nie projekt

**Treść tooltipa:**
Nawet jeśli klient nie kupił konfiguratora — kiedy zadzwoni z prośbą o nowy układ palety, przygotowanie tego po Twojej stronie zajmuje minuty zamiast godzin. Ile policzysz klientowi za to zlecenie — to Twoja polityka. Marża rośnie, bo koszt po Twojej stronie spada do minimum

---

### Pozycja B.3: PDF z układem — automatyczna komunikacja z klientem

**Skrót (przed ⓘ):** Dokument dla klienta w 30 sekund

**Treść tooltipa:**
Kiedy chcesz zaprezentować klientowi zaproponowany układ — projektujesz go w aplikacji, klikasz „generuj PDF" i masz gotowy dokument: wizualizacje warstw, parametry techniczne, opis pełnej palety. Bez rysowania w CAD, bez zrzutów ekranu, bez sklejania w PowerPoincie. Standardowy format, który możesz wysłać mailem albo dołączyć do oferty

---

### Pozycja B.4: Standardyzacja procesu i komunikacji robot ↔ PLC

**Skrót (przed ⓘ):** Jeden system, mniej błędów, łatwiejsze utrzymanie

**Treść tooltipa:**
Wszystkie projekty paletyzacji w Twojej firmie pracują na tej samej logice: te same struktury danych, te same formaty eksportu, te same bloki PLC. Nowy inżynier wchodzi w projekt szybciej. Maszyna utrzymywana 5 lat po wdrożeniu nadal działa według czytelnego standardu. Mniej zaskoczeń, mniej „dlaczego ten projekt jest inny"

---

**Komunikat zamykający POLE B:**

> 3 propozycje:

- OPCJA 1: **To, co dla klienta końcowego jest „nową funkcją w ofercie", dla Ciebie jest gotowym modułem.** Sprzedajesz wartość, nie programujesz jej

- OPCJA 2: **Konfigurator dla klienta końcowego to nie koszt — to nowa marża.** Wlicza się go w wycenę maszyny, klient otrzymuje samodzielność, Ty otrzymujesz zysk z mocniejszej oferty

- OPCJA 3: **Twoja oferta robi się mocniejsza, bez powiększania zespołu programistów.** Konfigurator, dokumentacja, szybkie modyfikacje — wszystko w jednym narzędziu

**Wybrany komunikat zamykający:** OPCJA 2

---

## Podsumowanie ROI (pod oboma polami, opcjonalne)

> Jeden zdaniowy „closer" pod sekcją.

**Tekst zamykający sekcję ROI:**

> 2 propozycje:

- OPCJA 1: Pallet Designer zwraca się **w pierwszej maszynie** — z oszczędności godzin zespołu, a dodatkowo otwiera nową pozycję w ofercie dla klienta końcowego

- OPCJA 2: Te dwa źródła oszczędności działają **niezależnie i równolegle** — pierwszy odzyskujesz po stronie wewnętrznej, drugi po stronie sprzedaży

**Wybrana wersja:** OPCJA 1

**Przycisk CTA pod sekcją ROI:** Policzmy ROI dla Twojego scenariusza →
**Akcja CTA:** kotwica do sekcji kontaktowej lub mailto z subject „Pallet Designer — kalkulacja ROI"

---

# SEKCJA 3 (OPCJONALNA): FAQ cenowe (3–4 pytania, kompaktowe)

> NOTKA: można wbudować w istniejące FAQ z `tresc.md` zamiast robić osobno. Sugeruję wbudować — uniknie rozdrabniania.

### Pytanie cenowe 1

**P:** Dlaczego ceny licencji nie są podane wprost na stronie?

**O:**
Bo skala projektu istotnie zmienia sensowną wycenę. Integrator dostarczający 2 maszyny rocznie i integrator dostarczający 30 maszyn rocznie powinni mieć inną ofertę — pakiet, model rozliczeń, zakres dopasowania kodu. Krótka rozmowa pozwala dobrać wariant, który ma sens dla obu stron. Jedyna cena podana wprost — **12 000 PLN za integrację PLC/HMI** — jest stała, bo to konkretny zakres prac

### Pytanie cenowe 2

**P:** Czy mogę kupić licencję raz i używać bez subskrypcji?

**O:**
Tak. Oprócz subskrypcji rocznej oferujemy **licencję dożywotnią** — kupujesz raz, używasz bez limitu czasu. Cena licencji dożywotniej jest wyceniana indywidualnie, w zależności od liczby stanowisk. Przy subskrypcji rocznej maintenance i aktualizacje są w cenie; przy licencji dożywotniej to osobna decyzja

### Pytanie cenowe 3

**P:** Co się stanie, jeśli zakończę subskrypcję?

**O:**
Aplikacja działa dalej, klient końcowy korzysta z układów palet bez przerwy. Tracisz dostęp do nowych wersji i zdalnego supportu — nie tracisz wygenerowanych danych, dokumentacji, ani produkcji. Subskrypcję można wznowić w dowolnej chwili

### Pytanie cenowe 4

**P:** Czy są zniżki przy większym zamówieniu?

**O:**
Tak. Integratorzy planujący kilka projektów w danym okresie mogą wykupić **pakiet licencji** w cenie znacząco niższej niż pojedyncze zakupy. Konkretną propozycję pakietu przygotowuję po krótkiej rozmowie o planowanej skali

---

# SEKCJA 4 (OPCJONALNA): CTA cenowe / „Porozmawiajmy o ofercie"

> Można podpiąć do istniejącej sekcji „Final CTA" w `tresc.md` — wystarczy zmodyfikować tekst karty albo dodać czwartą kartę.

**Tytuł CTA:**

> 2 propozycje:
- OPCJA 1: Powiedz nam o swoich projektach. *Dopasujemy ofertę*
- OPCJA 2: 20 minut wystarczy, żeby dopracować *propozycję cenową*

**Wybrany tytuł CTA:** Powiedz nam o swoich projektach. *Dopasujemy ofertę*

**Intro pod tytułem:**

20-minutowa rozmowa wystarczy, żeby dobrać model licencjonowania, oszacować zwrot inwestycji i przedstawić konkretną wycenę. Bez zobowiązań

**Przyciski:**
- **Główny:** Umów rozmowę o cenie
- **Drugi:** Napisz e-mail

---

# 📦 ARCHIWUM — materiał referencyjny (poprzednia wersja propozycji)

> NOTKA: Trzy warianty cenowe z poprzedniej iteracji (konserwatywny / rekomendowany / premium) zostawiam tu jako materiał odniesienia — możesz z niego korzystać przy wycenach na zapytanie, ale na stronie nie pokazujemy konkretnych liczb (oprócz 12 000 PLN za PLC/HMI).
>
> **Wariant rekomendowany do wewnętrznego użytku (jako punkt startowy w wycenie):**
> - Developer Seat: **~12 900 PLN / rok** (≈3 000 EUR) — subskrypcja, 1 seat floating
> - Per-Machine (subskrypcja roczna): **~6 500 PLN / rok / maszynę** (≈1 500 EUR)
> - Per-Machine (dożywotnia): **~9 900 PLN / maszynę** (≈2 300 EUR)
> - Pakiet 5+: rabat ~20%
> - Pakiet 10+: rabat ~30%
> - Pakiet 20+: rabat ~45%
> - PLC/HMI: **12 000 PLN** jednorazowo ✅ (jedyna cena pokazana wprost)
> - Maintenance roczny przy dożywotniej: 20% ceny licencji, opt-in
> - Modyfikacje T&M: 800–1 200 PLN / dzień inżynierski
>
> Te liczby mieszczą się w sweet spot 1 500–3 000 EUR/maszynę z badania rynku PL/CEE i pozwalają na rabaty wolumenowe bez zbijania ceny do dna.
>
> **Argumenty porównawcze do użycia w sales decku:**
> - „Tańszy niż roczna subskrypcja RobotStudio + Palletizing PowerPac (~9 400 PLN/rok) — a generuje dane dla **dowolnego** robota i PLC"
> - „W cenie 1 dnia pracy 2 inżynierów uruchomieniowych"
> - „1/30 ceny Visual Components Premium OLP — rozwiązuje 90% problemów paletyzacji"
> - „Mniej niż 3% wartości maszyny, którą sprzedajesz klientowi końcowemu"
