# HVAC BIM PLATFORM - MEMORY.md

> **[CRITICAL DIRECTIVE]**
> This file is the Agent's persistent memory. Read this file BEFORE executing any task. Update it AFTER completing any task. Do not delete historical entries.

## CURRENT STATE: FAZA 2.9.1 ZAKOŃCZONA
* **Active Step:** FAZA 2.10 (Eksport PDF) - PENDING
* **Pending Task:** Implementacja eksportu zestawienia do PDF.

## PROGRESS LOG
* [x] **KROK 0: Multi-Project Management & Time Machine** - Done (Includes Silent Sync & Snapshots)
* [x] **KROK 1: Air Balance Data Foundation & UI** - Done
* [x] **KROK 1.7: Zaawansowana analizy systemowa i scenariusze** - Done
* [x] **KROK 1.11: Floor Manager Module** - Done
* [x] **KROK 1.12: Multi-Room Selection & Bulk Editing** - Done
* [x] **KROK 2.0: System Undo/Redo** - Done
* [x] **KROK 2.3 UI: System Manager Enhancements** - Done
* [x] **KROK 2.4 UI: Multi-step System Wizard** - Done
* [x] **FAZA 2.1: Silnik Graficzny 2D (react-konva, Pan, Zoom)** - Done
* [x] **FAZA 2.2: Menadżer Podkładów Rastrowych (PNG/JPG)** - Done
* [x] **FAZA 2.3: Kalibrator Skali i Narzędzie Pomiaru** - Done
* [x] **FAZA 2.4: Rysowanie Stref (Zone Polygons) & Synchronizacja** - Done
* [x] **FAZA 2.4.1: Optymalizacja rysowania (Snapping, Visuals, Manual Close)** - Done
* [x] **FAZA 2.5: Pływający Przełącznik Kondygnacji (Workspace2D Overlay)** - Done
* [x] **FAZA 2.6: Architektura UI Etapowa (7 Etapów Projektu)** - Done
* [x] **FAZA 2.7: Kontekstowe Paski Narzędzi (Secondary Toolbar)** - Done
* [x] **FAZA 2.8: Tryb Widoku Reversed Vertical Split** - Done
* [x] **FAZA 2.4.2: Manual Area Override (v2) & Precyzja** - Done
* [x] **FAZA 2.9: Workspace 2.0 (RECT, ERASER, Stable Floors)** - Done
* [x] **FAZA 2.9.1: CAD Persistence Fix & Advanced Tools (Snap, Redefine)** - Done
* [ ] **FAZA 2.10: Eksport danych do raportu PDF** - Pending

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
- **Undo/Redo Stability**: Wszystkie systemy generowane w kreatorze są dodawane do store'a za pomocą jednej akcji `addSystems`, co gwarantuje, że cała operacja zajmuje dokładnie JEDEN krok w historii (`zundo`).

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
  - Wyniki są renderowane za pomocą komponentów `Label`, `Tag` i `Text` z `react-konva`.

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
- **Logika Skalowania**: `scaleFactor` zapisywany w `useCanvasStore` dla każdej kondygnacji. Obliczenia powierzchni: `areaPixels * (scaleFactor^2)`.
- **Rysowanie stref**: Wykorzystanie `react-konva` do interaktywnego tworzenia wielokątów. 
- **Snapping**: Przyciąganie do pierwszego punktu (snap-to-close) z wizualną informacją zwrotną (powiększenie punktu, zmiana koloru na zielony).
- **Manualny fallback**: Przycisk "Zakończ obrys" w toolbarze dla długich/złożonych figur.
- **Synchronizacja**: Pole `isAreaLinkedToGeometry` w `ZoneData` blokuje edycję AG-Grid, gdy strefa posiada obrys.

### Iteracja 2.5 & 2.6: Nawigacja i Architektura UI
- **Floor Switcher**: Pływający panel nad Stage pozwala na szybkie przełączanie kontekstu bez opuszczania widoku rysunku.
- **Stage Navigation**: Wprowadzenie `currentStage` (1-7) w `useUIStore`. Sidebar pionowy staje się głównym nawigatorem procesu projektowego.
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
  - Poligony są renderowane zawsze, gdy `zone.floorId === activeFloorId`. Wyeliminowano błąd "znikających stref" przy braku podkładu.
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