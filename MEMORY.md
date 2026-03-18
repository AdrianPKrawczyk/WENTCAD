# HVAC BIM PLATFORM - MEMORY.md

> **[CRITICAL DIRECTIVE]**
> This file is the Agent's persistent memory. Read this file BEFORE executing any task. Update it AFTER completing any task. Do not delete historical entries.

## CURRENT STATE: FAZA 2.10.3 ZAKOŃCZONA (wraz z 2.10.3a)
* **Active Step:** FAZA 2.10.3a (Naprawa eksportu PNG - limit viewportu) - ZAKOŃCZONA
* **Pending Task:** FAZA 2.11 (Zestawienia do PDF)

## PROGRESS LOG
* [x] **KROK 0: Multi-Project Management & Time Machine** - Done (Includes Silent Sync & Snapshots)
* [x] **KROK 1: Air Balance Data Foundation & UI** - Done
* [x] **KROK 1.7: Zaawansowana analizy systemowa i scenariusze** - Done
* [x] **KROK 1.11: Floor Manager Module** - Done
* [x] **KROK 1.12: Multi-Room Selection & Bulk Editing** - Done
* [x] **KROK 2.0: System Undo/Redo** - Done
* [x] **KROK 2.3 UI: System Manager Enhancements** - Done
* [x] **KROK 2.4 UI: Multi-step System Wizard** - Done
* [x] **FAZA 2.9.2: Relatywne Przesuwanie Stref & Opis 0,0** - Done
* [x] **FAZA 2.9.3: Dwukierunkowa synchronizacja & Podświetlanie** - Done
* [x] **FAZA 2.9.4: Wzory deseniu (Hatch) & Panel Filtracji** - Done
* [x] **FAZA 2.5: Obsługa plików CAD (DXF)** - Done
    *   Implementacja parsera `dxf-parser` oraz serwisu renderującego `dxfUtils.ts`.
    *   Obsługa transformacji układu CAD (Y-up) na Canvas (Y-down) oraz automatyczna kalibracja jednostek (mm, cm, m).
* [x] **FAZA 2.5.1: Szuflada Obrysów & Link Tool Fix** - Done
    *   Odseparowanie surowych obrysów CAD od obiektów `Zone`.
    *   Manualny Link Tool (usunięcie nieprzewidywalnej automatyzacji).
    *   Funkcja "Przyłącz istniejące pomieszczenie" z filtrowaniem po kondygnacji.
* [x] **FAZA 2.10: Eksport do PNG & DXF** - Done
    - [x] Narzędzie "Kadrowanie" (CROP) do definiowania obszarów eksportu.
    - [x] Generator DXF (`@tarikjabiri/dxf`) z obsługą warstw, skali i dopasowaniem do punktu 0,0.
    - [x] Selektor kadrów i opcja dołączania tła w modalnym oknie eksportu.

## ARCHITECTURE DECISIONS (Single Source of Truth)
*(Agent must log key technical decisions, Zustand store names, and crucial file paths here during development)*

* **Frontend Stack:** React 18+, TypeScript, TailwindCSS, Konva.js, ag-Grid
* **Physics Engine:** Refer strictly to `HVAC_FORMULAS.md`.
* **Database Schema (Iteration 0):** `JSONB` to store the DAG structure. Tables: `projects`, `project_versions`. Enable RLS.
* **UI Layout (Iteration 0):** React + Tailwind CSS with a 3-pane layout. Supply `#0000ff`, Exhaust `#ff0000`.
* **Data Foundation (Iteration 1.5):** `types.ts` is the single source of truth. Includes `systemSupplyId`, `systemExhaustId`, and `transferIn/Out` mapping.
* **State Management (Iteration 1.5):** `useZoneStore.ts` explicitly synchronizes inter-room transfers (if A sends to B, B receives from A). 
* **Inspector Panel (Iteration 1.7):** `ZonePropertiesPanel.tsx` is completely synchronized with `useZoneStore` providing full CRUD on Geometry, Thermodynamics, Acoustics, and Air Balance calculation mode + targets.
* **Air Balance Logic (Iteration 1.8):** Enforced Polish terminology from `docs/08-hvac-terminology-pl.md`. The list of Room Types and their normative ACH applies automatically via `docs/06-krotnosci_wymian.md`. `PhysicsEngine` toggle logic uses `isTargetACHManual` to dictate ACH origin.
* **Transfers and Systems UI (Iteration 1.9):** Added declarative Transfer Out appending in Inspector, and a fully dynamic System Manager (`useZoneStore.systems`) dictating select options across the AG-Grid. AG-Grid Cell Renderer for delete button uses React Components directly to prevent event eating.
* **Unified Room Preset System (Iteration 1.10):** `docs/06-krotnosci_wymian.md` extended with `maxDbA` column. `ROOM_PRESETS` in `hvacConstants.ts` is now the single source of truth for both ACH and noise limits. `ZoneData` extended: `isMaxDbAManual`, `manualMaxAllowedDbA`. RoomWizardModal auto-sets both. Inspector acoustic section: Manual override checkbox for dB(A), same pattern as ACH. Room type change with active manual overrides shows confirmation dialog before resetting.
* **Floor Manager Module (Iteration 1.11):** `useZoneStore` extended with `floors` CRUD and `activeFloorId`. Persistence version bumped to 2 with `migrate` function for backward compatibility. Filtered views integrated into `AirBalanceTable`.
* **Multi-Room Editing (Iteration 1.12)**:
    * **State Implementation**: `bulkUpdateZones` and `bulkDeleteZones` in `useZoneStore.ts`. Recalculates all affected zones via `resolveZonesState`.
    * **UI Component**: `BulkEditModal.tsx` provides thematic sections (General, Thermodynamics, Acoustics, etc.) with granular "Overwrite" checkboxes for each field.
    * **Table Integration**: `AirBalanceTable.tsx` updated with `rowSelection: 'multiple'`, checkbox column, and contextual bulk action buttons ("Edytuj zaznaczone", "Usuń zaznaczone").
### Krok 1.12: Zarządzanie wieloma pomieszczeniami (Bulk Edit)
- **Stan:** Dodano `bulkUpdateZones` i `bulkDeleteZones` do `useZoneStore`.
- **Interfejs:** Implementacja `BulkEditModal` z systemem "Change" checkboxes pozwala na selektywną aktualizację pól.
- **Logika:** Zmiana typu pomieszczenia w edycji masowej automatycznie przelicza `targetACH` i `maxAllowedDbA` zgodnie z `ROOM_PRESETS`.

### Krok 1.7 (Dashboard Analizy): Wprowadzono dolny panel KPI agregujący dane systemowe z obsługą scenariuszy (Analysis Presets).
### Krok 1.8: Wizualne kodowanie systemów (Hex/RGBA) z wzorami (CSS patterns). Implementacja logicznych priorytetów (P/W).
- **Poprawki 1.8b/c/e/f**: Wprowadzenie globalnej i lokalnej przezroczystości (konwersja na RGBA). Naprawa odświeżania wzorów przez `gridApi.redrawRows()`. 
- **[CRITICAL] Stabilizacja Kolumn (Fix 1.8f)**: Rozwiązano problem resetowania szerokości kolumn poprzez memoizację `columnDefs` i `defaultColDef`.
### Krok 1.7: Zaawansowana Analiza Systemowa
- **Scenariusze (Presets):** Możliwość zapisywania filtrów (systemy + kondygnacje) jako nazwane scenariusze w `ProjectStateData`.
- **Agregacja:** Nowy panel `AnalysisDashboard` wyliczający sumaryczne wydatki dla wybranych grup.
- **Reporting:** Funkcja kopiowania raportu tekstowego do schowka dla szybkich konsultacji.
- **KPI Cards:** Wizualne podsumowanie bilansu i transferów.
*   **Project Management & Versioning (KROK 0):** Implemented `useProjectStore.ts` for multi-project CRUD and snapshot management. 
    *   **Silent Sync**: Automatic debounced (3s) save of `{ zones, floors, systems }` envelope to Supabase. 
    *   **Time Machine**: Snapshots stored in `project_versions` table. 
    *   **Auth Requirement**: Uses Anonymous Sign-ins in Supabase (must be enabled in Dashboard: Auth -> Providers -> Email -> Allow anonymous sign-ins). 
    *   **UI**: `ProjectDashboard.tsx` (Dark Mode start screen) and `VersionHistoryPanel.tsx` (Right slider).
    *   **Session Continuity**: `useProjectStore` uses `persist` middleware to remember the `activeProject` after F5.

## CRITICAL UI PATTERNS & BUG FIXES
### AG Grid Column State Persistence (Resolved in 1.8f)
*   **Problem**: Column widths and order were resetting to defaults during row data updates or state changes.
*   **Root Cause**: Unstable references for `columnDefs` and `defaultColDef`. If these objects change reference on every render, AG Grid destroys and recreates the column state.
*   **Solution (The Right Way)**:
    1.  **Memoization**: Always wrap `columnDefs` and `defaultColDef` in `useMemo(() => [...], [dependencies])`. If they don't depend on sensitive state, keep dependencies empty.
    2.  **Avoid Triggered Sizing**: Never call `sizeColumnsToFit()` inside a `useEffect` that listens to `rowData`. This will overwrite user adjustments every time data changes.
    3.  **One-Time Initialization**: Apply external state (from Supabase/Store) ONLY in `onGridReady`.
    4.  **No Feedback Loops**: Do not use `useEffect` to "force" state back into the grid during a session; AG Grid handles its internal state beautifully if the column definitions are stable.
*   **Files Affected**: `AirBalanceTable.tsx`, `lib/utils.ts` (shared debounce).

### Iteracja 2.0: System Undo/Redo
- **Implementacja**: Integracja `zundo` w `useZoneStore` (limit 50 kroków).
- **Grupowanie**: W Inspektorze (`ZonePropertiesPanel.tsx`) zastosowano wzorzec `pause()` / `resume()` na focus/blur, aby uniknąć spamu historii podczas pisania.

### Iteracja 2.2: AG Grid Clone & Sync (Isolated Mutation)
- **Zasada**: Aby edycja komórek działała płynnie, a mechanizm `zundo` nie był nadpisywany mutacjami, AG Grid musi operować na sklonowanych danych.
- **Rozwiązanie**: Przekazuj do `rowData` sklonowane obiekty stanu (np. `zones.map(z => ({...z}))` w `useMemo`). Pozwól gridowi natywnie mutować ten klon, a następnie użyj `onCellValueChanged` do zsynchronizowania nowej wartości do store'a Zustand.
- **Wymagania**: Obowiązkowe użycie `getRowId` dla stabilności odświeżania.

### Iteracja 2.3: Ulepszenia Menadżera Systemów
- **UI**: Modal powiększony do `max-w-6xl`. Implementacja edycji inline (ID, Pełna Nazwa) poprzez pola input z funkcją `onBlur` synchronizującą stan `useZoneStore.updateSystem`.
- **UX**: Inteligentne domyślne nazwy (smart defaults) – wybór typu systemu automatycznie wypełnia pole nazwy odpowiednim prefiksem (np. "Wentylacja ogólna nawiewna: ").

### Iteracja 2.4: Kreator Systemów (System Wizard)
- **Logika**: 5-krokowy kreator (`SystemWizardModal.tsx`) automatyzujący generowanie par Nawiew/Wywiew dla central (AHU) wraz z wentylatorami.
- **Stylizacja Rodzin (Family Styling)**: Systemy powiązane (np. N1, W1, W1.1) otrzymują ten sam kolor bazowy. Wentylatory dodatkowo otrzymują deseń (pattern), co pozwala na wizualną hierarchizację.
- **Undo/Redo Stability**: Wszystkie systemy generowane w kreatorze są dodawane do store'a za pomocą jednej akcji `addSystems`, co gwarantuje, że cała operacja zajmuje dokładnie JEDEN krok in historii (`zundo`).

## ARCHITEKTURA SILNIKA 2D (FAZA 2.1 & 2.2)

### Biblioteka renderowania
- **react-konva** (`react-konva` + `konva`) — używana do całego renderowania 2D. Konva zarządza Stage → Layer → Shape. Biblioteka jest już zainstalowana w projekcie, nie wymaga dodatkowej instalacji.

### Oddzielenie stanu UI od historii zundo (KRYTYCZNE)
- **useCanvasStore.ts** (`src/stores/useCanvasStore.ts`) przechowuje stan kamery (`scale`, `position`) i podkładu (`underlayUrl`, `underlaySize`, `underlayName`).
- **Ten store NIE jest podpięty pod `zundo`**. Pan, zoom i podkład to stan widoku UI, nie dane projektu.
- Historia (`zundo`) dotyczy WYŁĄCZNIE `useZoneStore` (dane stref, pomieszczeń, systemów).
- **Kalibracja i Pomiary**:
  - `scaleFactor` (metry / piksel) jest podstawą wszystkich obliczeń geometrycznych.
  - Aktywne narzędzia (`isCalibrating`, `isMeasuring`) wzajemnie się wykluczają.
  - Narzędzie "Linijka" (`isMeasuring`) rysuje linię pomocniczą i etykietę z wynikiem wyliczonym jako `distPixels * scaleFactor`.
  - Wyniki are renderowane za pomocą komponentów `Label`, `Tag` i `Text` z `react-konva`.

### Podkłady PDF (pdfjs-dist)
- Użyto biblioteki **pdfjs-dist** do renderowania pierwszej strony dokumentu PDF na wirtualnym canvasie po stronie klienta.
- Wynikowy obraz (Data URL) jest przekazywany do `useCanvasStore` jako standardowy podkład rastrowy.
- **UWAGA**: Aby biblioteka `pdf.js` działała poprawnie w środowisku Vite, plik `pdf.worker.min.js` musi być skopiowany do folderu `/public` (skopiowano `pdf.worker.min.mjs` jako `.js`) i referencja `GlobalWorkerOptions.workerSrc` musi wskazywać na `/pdf.worker.min.js`.
- Konfiguracja powiadomień: Zintegrowano `sonner` dla profesjonalnych komunikatów o błędach w procesie wczytywania.

### Nawigacja CAD — Zoom to Pointer
- Obsługiwane przez `onWheel` na `<Stage>`. Wzór na nową pozycję (zoom skupiony na kursorze):
  ```typescript
  const mousePointTo = { x: (pointer.x - pos.x) / oldScale, y: (pointer.y - pos.y) / oldScale };
  const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
  ```

### Pan (Przesuwanie)
- **Środkowy przycisk myszy (MMB):** `e.evt.button === 1` → pan mode.
- **Spacja + LPM:** Globalny listener `keydown/keyup` na `Space`. Gdy `isSpaceDown.current === true`, LPM uruchamia pan.

### Layout Split-Screen
- Ekran podzielony pionowo: **Tabela (góra)** i **Workspace2D (dół)**.
- Drag handle (divider) reguluje proporcje — `splitPercent` state w `App.tsx` (domyślnie 55%/45%).
- Logika drag: ref `isDragging` + globalny `mousemove`/`mouseup` listener na `document`.

### Podkłady (Underlay)
- Faza 2.2 (PNG/JPG): `FileReader.readAsDataURL()` → `HTMLImageElement` → `<KonvaImage>` na Layer "background".
- Rozmiar podkładu zapisany w `useCanvasStore` → automatyczny fit-to-screen po załadowaniu.
- PDF (Supabase Storage) — do implementacji w Fazie 2.2 zaawansowanej.

### Iteracja 2.3 & 2.4: Kalibracja i Rysowanie (BIM foundations)
- **Logika Skalowania**: `scaleFactor` zapisywany in `useCanvasStore` dla każdej kondygnacji. Obliczenia powierzchni: `areaPixels * (scaleFactor^2)`.
- **Rysowanie stref**: Wykorzystanie `react-konva` do interaktywnego tworzenia wielokątów. 
- **Snapping**: Przyciąganie do pierwszego punktu (snap-to-close) z wizualną informacją zwrotną (powiększenie punktu, zmiana koloru na zielony).
- **Manualny fallback**: Przycisk "Zakończ obrys" w toolbarze dla długich/złożonych figur.
- **Synchronizacja**: Pole `isAreaLinkedToGeometry` w `ZoneData` blokuje edycję AG-Grid, gdy strefa posiada obrys.

### Iteracja 2.5 & 2.6: Nawigacja i Architektura UI
- **Floor Switcher**: Pływający panel nad Stage pozwala na szybkie przełączanie kontekstu bez opuszczania widoku rysunku.
- **Stage Navigation**: Wprowadzenie `currentStage` (1-7) in `useUIStore`. Sidebar pionowy staje się głównym nawigatorem procesu projektowego.
- **Secondary Toolbar**: Kontekstowy pasek obok Sidebaru, zawierający narzędzia specyficzne dla danego etapu (np. layouty Canvas/Tabela w Etapie 2).

### Iteracja 2.8: Elastyczność Layoutu
- **Reversed Split**: Nowy tryb `split-vertical-reversed` (Tabela po prawej, Canvas po lewej). Wymagał optymalizacji `handleMouseMove` dla obliczeń procentowych od prawej krawędzi.

### Iteracja 2.4.2: Manual Area Override (v2)
- **Logika 3-polowa**: Rozdzielono `manualArea` od `geometryArea`. Finalna `area` jest wyliczana automatycznie w store: `isAreaManual ? manualArea : (geometryArea ?? manualArea)`.
- **Precyzja**: Wymuszono zaokrąglanie wszystkich wartości powierzchni do 2 miejsc po przecinku w store i UI.
- **UI**: Wdrożono układ 3 pól w Inspektorze (Finalna, Manualna, CAD) oraz natywne checkboxy AG Grid.
- **Domyślność**: Nowe strefy domyślnie startują z aktywowaną flagą `isAreaManual: true`.

### Iteracja 2.9: Workspace 2.0 & Stabilność CAD
- **Narzędzia**: Implementacja `currentTool` (PEN, RECT, ERASER). 
  - `RECT`: Generuje 4 punkty na podstawie `start` i `end` click.
  - `ERASER`: Usuwa poligon z tablicy `polygons` danej kondygnacji.
- **Rysowanie (Visuals)**:
  - Wprowadzono `redefiningZoneId` – podczas rysowania stary obrys staje się czerwony (`#ef4444`) i półprzezroczysty, ułatwiając "odrysowanie" poprawnej geometrii.
  - `geometryUtils.ts`: Wydzielono `calculatePolygonArea` (shoelace formula) jako reużywalny moduł.
- **Stabilność**:
  - Poligony are renderowane zawsze, gdy `zone.floorId === activeFloorId`. Wyeliminowano błąd "znikających stref" przy braku podkładu.
  - `originDescription`: Dodano pole tekstowe w `FloorManagerBar.tsx` do opisu punktu zero (np. "Oś A-1").
- **Tabela**: Dodano kolumnę `hasGeometry` (📐 / ✖️) dla szybkiej weryfikacji statusu rysunkowego stref.

### Iteracja 2.9.1: Zaawansowane Narzędzia & Fixy CAD
- **Trwałość rzutu**: Wprowadzono akcję `clearUnderlay` w `useCanvasStore.ts`. Pozwala ona na usunięcie obrazka tła (podkładu) przy zachowaniu wszystkich narysowanych poligonów, skali i punktu 0,0.
- **Snapping (CAD)**: Implementacja przyciągania kursora do punktu (0,0) w `Workspace2D.tsx`. Kursor przeskakuje do początku układu współrzędnych, jeśli znajduje się w promieniu 15px (skalowanych).
- **Separacja Akcji (UX)**:
  - W `AirBalanceTable.tsx` rozdzielono przyciski usuwania: 🧹 (Clear Geometry) oraz 🗑️ (Delete Room).
  - W `useZoneStore.ts` dodano funkcję `clearZoneGeometry(id)`, która czyści pole `geometryArea` i bezpiecznie usuwa poligon z odpowiedniego `floorId` w canvas store.
- **Redefinicja**: Przycisk "Redefiniuj" w `ZonePropertiesPanel.tsx` pozwala na szybkie przerysowanie strefy od nowa. Poprzedni obrys jest renderowany na czerwono (`#ef4444`) dla ułatwienia odczytu.
- **Precyzja**: Wymuszono zaokrąglanie wyliczanej powierzchni (`area`) do 2 miejsc po przecinku (`Math.round(val * 100) / 100`) bezpośrednio w akcjach rysowania.

### 3. Smart Sync: Niezależne pozyskiwanie danych CAD
- **Rozdzielenie od Podkładu:** Funkcja synchronizacji nie jest już powiązana z tłem wizualnym. Można mieć wgrany PDF jako tło i jednocześnie "zasysać" geometrię z osobnego pliku DXF.
- **SyncSettingsModal:** Dodano filtr warstw, pozwalający inżynierowi skupić się tylko na istotnej geometrii (np. tylko obrysy ścian/stref).
- **Split-Screen Context:** Okno kalibracji poprawnie wyświetla obecny podkład projektu (PDF/IMG) jako tło dla prawego ekranu, co ułatwia precyzyjne wskazanie punktów kontrolnych.
- **Dedykowany przycisk:** Nowa ikona "✨ Synchronizuj z CAD" w tabeli bilansu powietrza.
- **Relatywne Przesuwanie**: Zmodyfikowano `handleMouseDown` w `Workspace2D.tsx`. Przy zmianie `referenceOrigin`, wszystkie narysowane poligi (`polygons`) aktywnej kondygnacji są automatycznie przesuwane o wektor różnicy (delta X/Y). Pozwala to na zachowanie pozycji stref względem charakterystycznych punktów budynku po zmianie przesuniętego podkładu.
- **Opis Punktu 0,0**: Dodano pole `originDescription` do interfejsu `Floor`. 
  - **Toolbar**: Wprowadzono input w pasku narzędzi Workspace2D do edycji opisu (np. "Przecięcie osi A-1").
  - **Canvas**: Opis jest wyświetlany bezpośrednio pod krzyżykiem punktu (0,0) na rysunku.
  
### Iteracja 2.9.3: Dwukierunkowa synchronizacja & Podświetlanie
- **Zustand (Ephemeral State)**: Dodano `checkedZoneIds` do `useZoneStore.ts`. Stan ten nie jest persystowany (`partialize`), co zapewnia czysty start po odświeżeniu strony.
- **Tabela (AG Grid)**:
  - **Auto-scroll**: Implementacja `ensureNodeVisible(node, 'middle')` w `useEffect` nasłuchującym na `selectedZoneId`. Tabela centruje się na strefie klikniętej na rzucie.
  - **Highlighting**: Aktywny wiersz (`selectedZoneId`) otrzymuje tło `#eef2ff` i indygo outline.
- **Canvas (Konva)**:
  - **Checked Multi-Select**: Strefy zaznaczone checkboxami w tabeli otrzymują na rzucie bursztynowy/pomarańczowy kolor (`#f59e0b80`) z efektem poświaty (`shadowBlur`).
  - **Active Selection**: Strefa wybrana (kliknięta) jest wyróżniona kolorem indygo (`#4f46e560`).
  - **Priorytety**: Logika stylizacji uwzględnia tryb redefinicji (czerwony) oraz nakłada wyróżnienia na bazowe kolory systemowe (jeśli włączone).

### Iteracja 2.9.4: Wzory deseniu (Hatch) & Panel Filtracji
- **Hatch Patterns (Desenie)**:
  - **Mechanizm**: Wprowadzono `createPatternImage` w `src/lib/patternUtils.ts`, który generuje wzory (ukośne, kratka, kropki) jako elementy Canvas.
  - **Renderowanie**: W `Workspace2D.tsx` zastosowano warstwowe podejście – poligon rysuje tło (`fill`), a następnie nakładana jest druga warstwa z wzorem (`fillPatternImage`) i przezroczystością.
  - **Skalowanie**: `fillPatternScale` jest dynamicznie przeliczane jako `1 / scale`, dzięki czemu gęstość wzoru na ekranie pozostaje stała niezależnie od poziomu przybliżenia.
  - **Mapowanie**: Dodano logikę mapującą polskie nazwy z UI (np. „Ukośne”) na techniczne identyfikatory wzorów.
- **REZOLUCJA (Poprawa Deseniu)**: Kompleksowo rozwiązano problem widoczności wzorów poprzez:
  - Dynamiczne cachowanie stylów w `Workspace2D.tsx`.
  - Wymuszenie **solidnego koloru** (alpha=1) dla linii wzoru.
  - Zwiększenie grubości linii do **2px** w `patternUtils.ts`.
  - Wprowadzenie zmiennej `globalPatternScale` (szeroki zakres 0.05x - 15.0x), pozwalającej użytkownikowi na precyzyjne dostosowanie gęstości deseniu do skali rzutu.

- **Filtracja Widoczności**:
  - **Zone Store**: Dodano stany `showZonesOnCanvas` (globalny przełącznik) oraz `hiddenSystemIdsOnCanvas` (lista ukrytych systemów).
  - **Filtr Panel**: Implementacja pływającego panelu „Widoczność Stref” w Workspace2D. Pozwala na selektywne ukrywanie stref przypisanych do konkretnych systemów oraz stref bez przypisanego systemu („Brak systemu”).
  - **Logika**: Strefa jest ukrywana, jeśli którykolwiek z jej systemów (nawiewny lub wywiewny) znajduje się na liście `hiddenSystemIdsOnCanvas`.
- **TopBar**: Dodano interaktywne ikony 👁️ (Widoczność) i 🎛️ (Filtry) integrujące się ze stanem stref.

- **Obsługa plików CAD (DXF) - Faza 2.5**:
  - **Parser**: Zastosowano `dxf-parser` do odczytu wektorów z plików DXF bezpośrednio w przeglądarce.
  - **Renderowanie (Super-Resolution & Grayscale)**: Wprowadzono strategię `MAX_CANVAS_SIZE` (4000px). Podkłady są teraz renderowane wyłącznie w odcieniach szarości (`#94a3b8`), co zapewnia spójny i przejrzysty wygląd rzutu architektonicznego.
  - **Uproszczenie Struktur**: Usunięto obsługę encji `DIMENSION` oraz logikę dekodowania kolorów ACI. Zrezygnowano również z importu atrybutów bloków (`ATTRIB`/`ATTDEF`). Dodano opcję globalnego ignorowania encji `INSERT` (Blocks), co pozwala na szybkie wyczyszczenie rysunku z wyposażenia i mebli.
  - **Pamięć Warstw**: Wybór warstw dla konkretnego pliku jest zapamiętywany w `localStorage`.
- **Smart Sync - Refaktoryzacja Architektury**:
  - **Niezależność**: Rozdzielono proces ustawiania tła (Underlay) od procesu pozyskiwania danych geometrycznych (Smart Sync).
  - **Nowy punkt wejścia**: Dodano przycisk "✨ Synchronizuj z CAD" w pasku narzędzi `AirBalanceTable.tsx`.
  - **SyncSettingsModal**: Nowy krok pośredni pozwalający inżynierowi wybrać konkretną warstwę DXF (np. "POMIESZCZENIA") oraz jednostki skali.
  - **Ulepszony SyncAlignmentModal**: Teraz wyświetla tylko wybraną warstwę geometryczną na lewym panelu, a na prawym panelu zachowuje pełny kontekst projektu (obecny podkład PDF/Image + narysowane strefy).
- **Smart Sync - Silnik Ekstrakcji i Link Tool (Krok 3)**:
  - **syncEngine.ts**: Implementacja `extractAndTransformPolygons` do automatycznego wybiórczego importu geometrii CAD po kalibracji.
  - **Automatyczne Dopasowanie**: System automatycznie aktualizuje istniejące strefy (overlap detection) lub tworzy nowe w ZoneStore na podstawie danych DXF.
  - **Transformacja Afiniczna (3 pkt)**: Ulepszono `SyncAlignmentModal` do obsługi 3 punktów, co zapewnia pełną korekcję skali, obrotu i odbicia lustrzanego (Mirror).
  - **Usunięcie Automatyzacji (Fix)**: Zrezygnowano z funkcji `Continuous Linking` (automatyczne przeskakiwanie) na rzecz pełnej kontroli manualnej.

### Iteracja 2.9.5: Szuflada Obrysów (DXF Drawer)
- **Architektura**: Wydzielono `dxfOutlines` w interfejsie `Floor`. Surowe kształty z CAD nie tworzą już pustych wierszy w tabeli bilansowej, dopóki nie zostaną jawnie powiązane ze strefą.
- **DxfOutlinesModal**: Implementacja listy obrysów z funkcją podglądu (Eye) i usuwania (Trash).
- **Zasada Separacji**: Poligony stref to dane HVAC, a `dxfOutlines` to techniczna warstwa pomocnicza do "odrysowywania" lub "linkowania".

### Iteracja 2.9.6: Smart Sync UX & Link Existing
- **Kontrola Użytkownika**: Po przypisaniu obrysu operacja kończy się wyczyszczeniem zaznaczenia (`setLinkingZoneId(null)`), oddając decyzję inżynierowi co do kolejnego kroku.
- **Link Existing Room**: Nowy modal `LinkOutlineModal.tsx` dostępny z panelu obrysu na rzucie.
    - **Filtrowanie**: Lista pomieszczeń jest filtrowana po `activeFloorId`.
    - **UX**: Skondensowany widok (lista `90vh`) dla szybkiej pracy na dużych projektach.
- **Bi-directional Sync & Selection Stability**: 
    - Kliknięcie wiersza w `AirBalanceTable` centruje widok na rzucie, a kliknięcie strefy na rzucie zaznacza odpowiedni wiersz w ag-Grid (z synchronizacją `ensureNodeVisible`).
    - **Fix**: Rozwiązano problem pętli zwrotnej (selection feedback loop) pomiędzy stanem Zustand a ag-Grid. 
    - **Behavior**: Checkboxy w tabeli służą do stabilnej pracy masowej (nie odznaczają się przy dodawaniu kolejnych), natomiast kliknięcie obiektu na rzucie focusuje tabelę na nowym elemencie, czyszcząc poprzednie zaznaczenia (standardowy UX projektowy).

### Iteracja 2.9.7 - 2.9.11: Smart Tag Builder (Metki)
- **Architektura**: Wprowadzono system metek sterowany globalną konfiguracją (`GlobalTagSettings` w `useZoneStore.ts`).
- **Dynamiczny Layout**: 
    - Porzucono sztywne pozycjonowanie i szerokości na rzecz automatycznego obliczania rozmiaru (`measureTextWidth`) za pomocą Canvas API.
    - Metki renderowane jako `Group` zawierająca `Rect` i dwa komponenty `Text`, co zapewnia idealne dopasowanie tła do zawartości obu kolumn.
- **Dwie Kolumny**: Pełna obsługa podziału pól na dwie kolumny z automatycznym pozycjonowaniem i odstępem (`gap`).
- **Skalowanie**: Opcja `isFixedSize` (stały rozmiar na ekranie) realizowana przez odwrotną skalę (`1 / scale`) na poziomie grupy.
- **Konfigurator (Modal)**: 
    - Wykorzystanie `react-hook-form` i `useFieldArray` do zarządzania kolejnością, widocznością i przypisaniem do kolumn.
    - **Live Preview**: Wierna reprezentacja metki (`inline-flex`) z ręcznym przyciskiem wymuszenia odświeżenia ("Odśwież").
- **Interakcja**: Natywna obsługa Drag & Drop z zapisem pozycji `tagPosition` bezpośrednio w danych strefy (`ZoneData`).
### Iteracja 2.10: Profesjonalny Eksport (PNG & DXF)
- **Kadr Eksportu (ExportRegion)**: Wprowadzono `exportRegions` do interfejsu `Floor`. Każdy kadr posiada `id`, `name` oraz wymiary `x, y, width, height` w pikselach sceny Konva.
- **Narzędzie Kadr (Crop Tool)**: Wprowadzono nową ikonę `Crop` z etykietą "Kadr" w toolbarze rysowania. Działa analogicznie do narzędzia `RECT`, ale zamiast stref, tworzy i zapisuje definicje kadrów do aktualnej kondygnacji.
- **Silnik DXF (`src/lib/dxfExport.ts`)**:
    - Wykorzystuje bibliotekę `@tarikjabiri/dxf` do generowania plików wektorowych.
    - **Transformacja Współrzędnych**: Konwersja `px -> metry` z uwzględnieniem `referenceOrigin` oraz inwersją osi Y (CAD standard).
    - **Warstwy**: Separacja logiczna: `WENTCAD_OBRYSY` (niebieski), `WENTCAD_WYPELNIENIA` (hatch solid), `WENTCAD_METKI_TEKST` (MText).
    - **Metki**: Eksport tekstu w formacie MText z zachowaniem wyśrodkowania (`attachmentPoint: 5`).
- **Generator PNG**: Wykorzystuje `stage.toDataURL()` z opcją `pixelRatio: 2` dla wysokiej jakości. Opcja `includeBackground` steruje widocznością podkładu PDF/IMG podczas generowania obrazu.

### Iteracja 2.10.1: Poprawki Kadrowania Eksportu
- **Dokumentacja**: Utworzono `docs/02.6-export-framing-spec.md` z pełną specyfikacją mechanizmu kadrowania.
- **Bug Fix PNG (`Workspace2D.tsx:handleExportPNG`)**:
    - Naprawiono podwójną konwersję współrzędnych. Wcześniej `region.x * scale + position.x` konwertowało scene coords z powrotem na screen coords, co powodowało nieprawidłowe kadrowanie.
    - Poprawka: Współrzędne kadru są już w scene coordinates (jak widać w `handleMouseDown`), więc `toDataURL` otrzymuje je bezpośrednio bez przeliczania.
- **Bug Fix DXF (`src/lib/dxfExport.ts`)**:
    - Dodano opcjonalny parametr `exportFrame` do funkcji `exportToDXF`.
    - **Filtrowanie AABB**: Funkcja `isPolygonInFrame()` sprawdza, czy jakikolwiek wierzchołek poligonu znajduje się wewnątrz kadru. Poligony poza kadrem są pomijane.
    - **Filtrowanie metek**: Funkcja `isPointInFrame()` sprawdza pozycję metki - metki poza kadrem nie są eksportowane.
    - **Transformacja originu**: Gdy `exportFrame` jest aktywny, współrzędne DXF są przesuwane tak, aby lewy górny róg kadru stał się punktem (0,0) w pliku CAD (`frameOffset.x`, `frameOffset.y`).
    - **Punkt (0,0)**: Marker punktu zero jest rysowany tylko gdy NIE ma aktywnego kadrowania (aby nie zaśmiecać eksportu częściowego).
- **Aktualizacja Workspace2D**: `handleExportDXF` teraz przekazuje `region` jako czwarty argument do `exportToDXF`.

### Iteracja 2.10.2: Poprawki Kadrowania i Eksportu (FAZA 2)
- **Struktura Warstw (`Workspace2D.tsx`)**:
    - Wydzielono warstwę UI (`<Layer ref={uiLayerRef} name="ui">`) zawierającą: siatkę (`drawGrid()`), ramki kadru, znaczniki punktu zero, linie kalibracji, pomiary.
    - Warstwa content (`<Layer ref={contentLayerRef} name="content">`) dla obiektów biznesowych (strefy, obrysy CAD, metki).
- **Naprawa Eksportu PNG (`handleExportPNG`)**:
    - **Problem**: Podwójna konwersja współrzędnych i brak ukrycia UI layer powodowały widoczną siatkę i ramki na eksporcie.
    - **Rozwiązanie**: 
        1. Ukrycie warstwy UI (`uiLayerRef.current.hide()`) przed eksportem
        2. Zapis obecnego scale i position sceny
        3. Reset widoku do scale=1, position=(0,0)
        4. Przeliczenie współrzędnych kadru na układ ekranu: `exportX = region.x * oldScale + oldPos.x`
        5. Eksport z `pixelRatio: 3` dla wysokiej jakości
        6. Przywrócenie obecnego widoku i pokazanie UI layer
- **Naprawa Eksportu DXF (`src/lib/dxfExport.ts`)**:
    - **Walidacja liczb**: Dodano funkcje `isValidNumber()` i `safeToFixed()` zapobiegające wartościom NaN/Infinity
    - **Bezpieczne punkty**: Wszystkie punkty są filtrowane przed dodaniem do DXF
    - **Obsługa błędów**: Hatch i MText są opakowane w try-catch, aby błąd jednego elementu nie korumpował całego pliku
    - **Nowa warstwa**: Dodano `WENTCAD_KADRY` do rysowania ramki eksportu w DXF
    - **Weryfikacja EOF**: Sprawdzanie czy plik kończy się poprawnie
- **Edycja Kadrów (`ExportModal.tsx`)**:
    - Dodano interfejs `ExportRegion` do typowania
    - Dodano przyciski "Edytuj kadr" (`Pencil`) i "Usuń kadr" (`Trash2`)
    - Nowe props: `onEditRegion` i `onDeleteRegion`
- **Handler Edycji (`Workspace2D.tsx`)**:
    - `handleEditRegion()`: Przełącza na narzędzie CROP i rozpoczyna edycję od zapisanego kadru
    - `handleDeleteRegion()`: Usuwa kadr z `exportRegions` po potwierdzeniu

### FAZA 2.10.2 (Kontynuacja): Poprawka addText w DXF
- **Problem**: Błąd TypeScript `Argument of type 'string' is not assignable to parameter of type 'vec3_t'` na wywołaniu `addText()`
- **Rozwiązanie**: Poprawiono sygnaturę wywołania zgodnie z API `@tarikjabiri/dxf`:
  ```typescript
  // POPRAWNA sygnatura:
  dxf.addText(point3d(x, y, 0), height, text, { layerName: "..." })
  ```
  - Pierwszy argument: pozycja (`vec3_t`)
  - Drugi argument: wysokość tekstu (`number`)
  - Trzeci argument: treść tekstu (`string`)
  - Czwarty argument: opcje (`TextOptions` z `layerName`)
- **Usunięto nieużywany import**: `point2d`

### FAZA 2.10.3: Naprawa eksportu DXF i PNG
- **Eksport DXF (`src/lib/dxfExport.ts`)**:
    - **Problem**: Plik DXF uszkodzony - znaki nowej linii (\n) w tekstach powodowały błąd "Invalid group code" w programach CAD. Polskie znaki (np. "ó") eksportowały się jako puste.
    - **Rozwiązanie wielolinijkowości**: Podzielono tekst metki na linie używając `split('\n')`, każda linia renderowana jako osobny obiekt TEXT z przesunięciem Y (`fontSize * 1.5`).
    - **Rozwiązanie polskich znaków**: Dodano funkcję `escapePolishChars()` zamieniającą polskie znaki na sekwencje Unicode (np. `ó` → `\U+00F3`, `ą` → `\U+0105`).
- **Eksport PNG (`src/components/Workspace2D.tsx`)**:
    - **FAZA 2.10.3a (2026-03-18)** - Naprawa limitu viewportu eksportu:
        - **Objaw**: Eksportowany PNG był ucinany z prawej strony i od dołu w dokładnie tym samym miejscu niezależnie od zoomu. Obraz wyglądał identycznie przy maksymalnym oddaleniu i przybliżeniu.
        - **Przyczyna**: `stage.toDataURL()` używał wymiarów Stage równej `containerWidth x containerHeight`. Po resecie `scale=1, position=0`, Stage nadal miał wymiary okna przeglądarki, a podkład/treść mogła być znacznie większa. Konva obcina grafikę do wymiarów Stage.
        - **Rozwiązanie**: 
            1. Obliczono pełny bounding box sceny (`minX, minY, maxX, maxY`) uwzględniający: podkład (`underlaySize`), wszystkie kadry eksportu, wszystkie poligony, obrysy DXF, punkt zero.
            2. Tymczasowo zmieniono wymiary Stage na pełny rozmiar sceny + margines 50px.
            3. Przesunięto Stage tak, aby `minX,minY` znalazło się w punkcie `(padding, padding)` nowego układu współrzędnych.
            4. Obliczono pozycję kadru w nowym układzie: `regionX = region.x - minX + padding`.
            5. Wywołano `stage.toDataURL()` z precyzyjnymi współrzędnymi kadru.
            6. Przywrócono oryginalne wymiary Stage i pozycję.
        - **Kluczowa lekcja**: Konieczne jest dynamiczne skalowanie Stage do rozmiaru renderowanej treści, ponieważ Stage zawsze obcina grafikę do swoich wymiarów - nie ma żadnego "nieskończonego canvasu".

(End of file - total 350 lines)
