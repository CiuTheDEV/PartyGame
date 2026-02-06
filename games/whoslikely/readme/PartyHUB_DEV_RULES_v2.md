# ✅ PartyHUB — DEV RULES v2

> Wersja: **2.0**  
> Cel: **zero chaosu, zero „wmawiania”, zero niechcianych refactorów** + praca szybka, krokowa i spójna wizualnie.

---

## 0) SYNC FIRST — JEDNO ŹRÓDŁO PRAWDY (OBOWIĄZKOWE)
Zanim ruszamy zmianę, **ustalamy na 100% wersję pliku/paczki**.

**Zasada:**
- Jeśli zmiana dotyczy miejsca w kodzie → wklejasz **40–200 linii** wokół tego miejsca.
- AI edytuje **tylko ten fragment** (bez zgadywania reszty pliku).
- Jeśli pracujemy na paczce/zip → zawsze podaj **nazwę paczki** (np. `partyhub_kalambury_step8_stage4.zip`).

✅ Koniec z „mówiłeś że zmieniłeś, a u mnie tego nie ma”.

---

## 0.1) START NOWEGO CHATA — PRZEGLĄD HISTORII (OBOWIĄZKOWE)
Gdy zaczynamy **nowy chat w projekcie PartyHUB**, to zanim przejdę do kodu:
- **zapoznaję się ze wszystkimi poprzednimi konwersacjami w projekcie** (żeby nie gubić kontekstu),
- sprawdzam **ostatnią paczkę ZIP / ostatni stan** (to, na czym pracujemy),
- robię krótki **Context Recap** (5–10 punktów): co jest zrobione, co jest otwarte, jakie są zakazy/priorytety,
- dopiero potem proponuję patch lub wykonuję krok.

Jeśli brakuje mi kluczowej informacji (np. nazwy aktualnego ZIP) → **pytam krótko** zamiast zgadywać.

---

## 1) BRAND IDENTITY (PRIORYTET #1)
Każda gra/podstrona MUSI trzymać spójność PartyHUB.

**Spójność obejmuje:**
- **Typography:** fonty, rozmiary, grubości, `clamp()`
- **Komponenty UI:** kafelki trybów, przyciski (Start / Powrót / Menu / Kontynuuj / Ustawienia)
- **Overlays:** alerty / popupy / modale — ten sam styl + animacje
- **Motyw kolorystyczny per gra** (np. czerw/nieb, żół/ziel, itd.)
- **Detale:** obramówki inputów, scrollbar, gradienty, shadow, radius — w kolorach gry

✅ Nie wymyślamy nowego UI — bazujemy na istniejących grach i komponentach PartyHUB.

---

## 2) DESIGN TOKENS (OBOWIĄZKOWE)
Nie wstawiamy „losowych” kolorów/borderów w komponentach.

- `--bg`, `--panel`, `--text`
- `--brand1`, `--brand2`, `--accent`
- `--radius`, `--shadow`, `--gap`
- `--anim-fast`, `--anim-normal`

✅ Wszystko przez tokeny.

---

## 3) CHANGELOG ZAMIAST CANVAS (OBOWIĄZKOWE)
- Nie utrzymujemy „aktualnej wersji” w Canvas po każdym updacie.
- Źródłem prawdy jest **aktualna paczka ZIP** + pliki w repo.
- W każdym folderze gry ma istnieć katalog: `readme/` (np. `games/<gra>/readme/`), a w nim:
  - `PartyHUB_DEV_RULES_v2.md` — kopia aktualnych zasad (do szybkiego wglądu przy grze),
  - `changelog.txt` — dziennik zmian; **po każdym patchu** dopisz wpis:
    - data (YYYY-MM-DD),
    - nazwa paczki ZIP, na której pracujemy,
    - krótki opis zmian (1–3 zdania lub 2–5 bulletów).

❌ Zakaz: „stan projektu” tylko w rozmowie. Stan ma być zapisany w `changelog.txt`.

---

## 4) ZASADA: NIE DORABIAMY „ARCYDZIEŁ”
Jeśli prosisz o małą zmianę → robię małą zmianę.

✅ Domyślnie:
- nie przebudowuję UI,
- nie dodaję nowych ficzerów,
- nie zmieniam struktury,
- nie dokładam bibliotek,

…chyba że **wprost** o to prosisz.

---

## 5) PYTAJ, GDY NIEPEWNE (ALE KRÓTKO)
Jeśli nie jestem pewien, o co chodzi → **pytam zanim ruszę kod**.

**Format:** 2 interpretacje + jedno pytanie.

---

## 6) WORKFLOW: „UŻYTKOWNIK DZIELI NA KROKI”
Jeśli prowadzisz zadanie krokami (np. „Krok 2”, „Krok 3”) to:
- robię **tylko aktualny krok**,
- nie wybiegam w przód,
- po zakończeniu daję mini-raport i czekam na następny krok.

---

## 7) PATCH MODE (ZAMIANA BLOKÓW, NIE PRZEPISYWANIE)
Gdy plik jest duży → działamy patchami.

**Format PATCH:**
1) **CO ZNALEŹĆ** (unikalna linia/nagłówek)
2) **STARY BLOK**
3) **NOWY BLOK**

✅ Patch ma być gotowy „kopiuj-wklej / zamień X na Y”.

---

## 8) KOTWICE [PH] BEGIN/END (OBOWIĄZKOWE DLA WIĘKSZYCH SEKCJI)
**CSS**
```css
/* [PH] TOP_BAR_BEGIN */
...
/* [PH] TOP_BAR_END */
```

**JS**
```js
// [PH] FLOW_BEGIN
...
// [PH] FLOW_END
```

✅ Dzięki temu nie „dotykamy” przypadkiem innych części pliku.

---

## 9) 1 ZMIANA = 1 CEL
W jednym kroku robimy tylko jeden typ zmiany:
- **BUGFIX** (JS)
- **UI/CSS**
- **REFACTOR**

---

## 10) SMOKE TEST + KONSOLA (ZANIM IDZIEMY DALEJ)
Po każdej zmianie obowiązkowo:
- konsola: **0 errorów**
- menu działa (wejście/wyjście)
- overlay da się zamknąć (X / Esc)
- shell trzyma geometrię (top/bottom/HUD)
- flow gry nie utknął

Jeśli test nie przechodzi → **stop** i naprawa.

---

## 11) ZAKAZ „DZIAŁA / ZROBIONE” BEZ POKRYCIA
Nigdy nie piszę „działa”, jeśli nie mam 100% pewności.

Zamiast tego zawsze:
- „Podmieniłem blok X w sekcji Y”
- „Zmieniłem klasy A/B, dodałem guard w funkcji C”
- jeśli coś mogło się nie wgrać → wprost: „to jest patch do wklejenia”

❌ Zero wmawiania.

---

## 12) NIE PSUJEMY ISTNIEJĄCEGO CSS / UI
- Nie dotykamy globali (np. `body`, `*`) bez wyraźnej potrzeby.
- Nie zmieniamy tokenów/typografii, jeśli zadanie tego nie wymaga.
- Zmiany CSS robimy **lokalnie** (najwęższy selektor).

✅ Najpierw stabilność, potem ulepszanie.

---

## 13) KOD MA BYĆ KRÓTKI, ALE BEZ ŚMIECI
Twoja preferencja: **maksymalnie krótko**.

✅ W praktyce:
- minimalnie linii, ale bez duplikatów
- helpery zamiast powtarzania
- usuwamy nieużywane klasy/funkcje
- komentarze tylko jako nagłówki sekcji i nietypowe hacki

---

## 14) DEBUG / DEV HUD — STAŁE ZASADY
- `cfg.debug = true/false` kontroluje logi.
- tryb `body.design-debug` pokazuje etykiety `data-dbg`.
- jeśli coś było ustalone jako dev-tool → **nie usuwamy tego przypadkiem**.
- **DEV jest oddzielony** (np. `core/dev.*`, `games/*/devhud.js`) i **ładuje się tylko na żądanie**:
  - `?dev=1` lub `?dbg=1`, albo
  - `localStorage` (np. `partyhub_dev = "1"` lub per-gra).

---

## 15) ASSETY: IKONY / FAVICONY / ŚCIEŻKI
- Ścieżki w HTML zawsze relatywne i z `/` (Windows też): `../../assets/...`
- Favicons (16×16) wymagają prostoty.

✅ Preferowany standard:
- favicon jako **SVG** + opcjonalny fallback PNG.

---

## 16) ZGŁASZASZ BŁĄD → ZASADA „STOP & FIX”
Jeśli pojawia się błąd w konsoli:
- najpierw naprawiamy błąd,
- dopiero potem kolejne rzeczy.

Żeby było szybciej:
- wklej komunikat z konsoli + linijkę/stack + 40–200 linii kodu wokół.

---

## 17) MINI-RAPORT PO KAŻDYM KROKU (OBOWIĄZKOWE)
Po wykonaniu kroku dostajesz zawsze:
- **co dokładnie zmieniłem** (2–5 bulletów)
- **gdzie** (sekcja/anchor)
- **patch do wklejenia** (jeśli potrzeba)

---

# 18) STRUKTURA REPOZYTORIUM (DOCELOWA I OBOWIĄZKOWA)
> Na początku możemy pracować w 1 pliku/paczce, ale docelowo repo musi być uporządkowane.

## 18.1 Docelowa struktura
```
partyhub/
  index.html                 # hub / wybór gier
  assets/
    fonts/
    sfx/
    img/
    favicons/
  core/
    ui.css                    # wspólne komponenty UI (przyciski, karty, modale)
    ui.js                     # wspólna logika UI (popupy, alerty, przejścia)
    tokens.css                # design tokens (brand1/brand2/radius/anim)
    helpers.js                # helpery (escHtml, clamp, itp.)
  games/
    <gra>/
      index.html
      game.css                # tylko różnice gry + motyw
      game.js                 # logika gry
      assets/                 # lokalne assety gry (opcjonalnie)
      devhud.js               # opcjonalnie, ładowany tylko w DEV
      readme/                 # dokumentacja per-gra
        PartyHUB_DEV_RULES_v2.md
        changelog.txt
  dev/
    README.md                 # jak odpalać / testować
  docs/
    rules/
      PartyHUB_DEV_RULES_v2.md
```

## 18.2 Zasady podziału
- **core/** = 100% wspólne rzeczy dla wszystkich gier.
- **games/<gra>/** = tylko to, co unikalne (motyw, layout, logika, słowniki).
- **assets/** = globalne assety; jeśli asset jest tylko dla jednej gry → `games/<gra>/assets/`.
- **DEV moduły** mają być wyraźnie oddzielone i ładowane warunkowo.

## 18.3 Zasada „BRAND” w strukturze
- Motyw gry trzymamy w `games/<gra>/game.css` (zmienne/kolory/akcenty), ale komponenty UI są w `core/`.

---

## 19) UI/UX — STAŁY SHELL, GEOMETRIA I „SAFE VIEW” (OBOWIĄZKOWE)
- **Shell stały:** każda gra utrzymuje wspólny układ: `TOP BAR + GAME_HUD + BOTTOM BAR`.
- **Wysokość barów:** domyślnie trzymamy stałą wysokość (np. 60px); jeśli gra potrzebuje innej — ustalamy raz i trzymamy konsekwentnie.
- **HUD wykorzystany maksymalnie:** główna karta/ekran fazy (`stage-card`) ma wypełniać HUD.
- **0 overflow:** nic nie może wychodzić poza kluczowe kontenery.
- **Stała geometria:** jeśli ustalimy wymiary kluczowych elementów (avatar/pill, timer, wordbox, CTA) — trzymamy konsekwentnie.
- **Safe view (TV / public view):** dane wrażliwe/ukryte (hasła, role, karty prywatne) **nie mogą** być stale publicznie widoczne — pokazujemy tylko w dedykowanym widoku/oknie i znikają.
- **Re-use komponentów:** jeśli w projekcie istnieje wzorcowy komponent — używamy go zamiast tworzyć nowy wariant.

---

## 20) KONTRAKT FLOW — ETAPY, AKCJE, PRZEJŚCIA (OBOWIĄZKOWE)
- Każda gra ma zdefiniowany **jednoznaczny flow etapów** (state machine): `STAGES + setStage() + render()`.
- **Test po kolei:** po zmianach zawsze testujemy pełny scenariusz gry w kolejności (od startu do końca).
- **Gating:** przejścia do kolejnych etapów dzieją się dopiero po spełnieniu warunku (potwierdzenie/werdykt/zapis wyniku).
- **Nazewnictwo akcji:** trzymamy format `stageX:action` lub `flow:action` (spójnie w całym projekcie).
- **Tylko event delegation:** akcje przez `data-action`.

---

## 21) ETYKIETA AKTUALNEJ FAZY W TOP BAR (OBOWIĄZKOWE)
- Top bar zawsze komunikuje **co aktualnie się dzieje** (nazwa fazy/etapu).
- Jeśli etap ma podfazy — można dopisać małym tekstem pod-etykietę.
- Nazwy faz są **per gra**, ale zasada jest wspólna: użytkownik ma zawsze wiedzieć „gdzie jest” w flow.

---

## 22) CHECKLISTA „NO REGRESSION” (OBOWIĄZKOWE)
- **0 errorów w konsoli**
- overlay/popupy działają identycznie (`X` / `Esc`, click-out jeśli ustalone)
- shell trzyma geometrię (top/bottom, HUD, brak overflow)
- flow etapów nie jest zablokowany (pełna ścieżka start→koniec działa)
- **DEV OFF:** brak ładowania/dev-requestów do modułów developerskich
- **DEV ON:** narzędzia debug działają (inspector, keybindy, etykiety)
