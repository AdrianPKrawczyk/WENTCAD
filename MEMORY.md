# HVAC BIM PLATFORM - MEMORY.md

> **[CRITICAL DIRECTIVE]**
> This file is the Agent's persistent memory. Read this file BEFORE executing any task. Update it AFTER completing any task. Do not delete historical entries.

## CURRENT STATE: WATT REWIZJA 6 (Zgodność Cieplna PN-EN ISO 6946)
* **Active Step:** WATT REWIZJA 6 - Pełne uszczelnienie silnika cieplnego
* **Status:** Done - weryfikacja 5 scenariuszy wykazala 100% zgodności
* **Pending Task:** FAZA 3.5 (Bilansowanie i ścieżka krytyczna)

## PROGRESS LOG
* [x] **KROK 0: Multi-Project Management & Time Machine** - Done (Includes Silent Sync & Snapshots)
* [x] **KROK 1: Air Balance Data Foundation & UI** - Done
* [x] **KROK 1.7: Zaawansowana analizy systemowa i scenariusze** - Done
* [x] **KROK 1.11: Floor Manager Module** - Done
* [x] **KROK 1.12: Multi-Room Selection & Bulk Editing** - Done
* [x] **KROK 2.0: System Undo/Redo** - Done
* [x] **KROK 2.3 UI: System Manager Enhancements** - Done
* [x] **KROK 2.4 UI: Multi-step System Wizard** - Done
* [x] **FAZA 3.4: Algorytm Propagacji Przepływów DFS** - Done
* [x] **WATT KROK 1: Definicja Typów i Rozbudowa Stanu (IFC Data Structures)** - Done
* [x] **WATT KROK 2: Rozbudowa Parsera DXF i Ekstrakcja Metadanych (Inteligentna Stolarka)** - Done
* [x] **WATT KROK 3: Silnik Topologiczny 2D & Snapping Okien** - Done
* [x] **WATT KROK 4: Analiza Pionowa (Dachy/Nawisy)** - Done
* [x] **WATT KROK 5: Wizualizacja WATT na Workspace2D** - Done
* [x] **WATT KROK 6: Biblioteka Materiałów i Typów Przegród (Thermal Catalog)** - Done
* [x] **WATT DODATKOWY KROK: Moduł Budynek 3D (Three.js)** - Done
* [x] **WATT REWIZJA 1: Poprawki po testach (Skala, Wysokości, Dziedzińce, Północ)** - Done
* [x] **WATT REWIZJA 2: Stabilizacja Architektury (Circular Deps, Skalowanie, UX)** - Done
* [x] **WATT REWIZJA 3: Algorytmy Gross Area, Synchronizacja Skali i Poprawki Importu** - Done
* [x] **WATT DODATKOWY KROK: Moduł Budynek 2D (Interaktywny Widok Architektoniczny)** - Done
* [x] **WATT DODATKOWY KROK: Moduł Budynek 3D (Zintegrowana Wizualizacja i North Arrow)** - Done
* [x] **FAZA 2.9.3: Dwukierunkowa synchronizacja & Podświetlanie** - Done
* [x] **FAZA 2.9.4: Wzory deseniu (Hatch) & Panel Filtracji** - Done
* [x] **FAZA 2.5: Obsługa plików CAD (DXF)** - Done
* [x] **FAZA 2.5.1: Szuflada Obrysów & Link Tool Fix** - Done
* [x] **FAZA 2.10: Eksport do PNG & DXF** - Done
* [x] **FAZA 3.1 & 3.2: Topologia i Trasowanie Jednokreskowe (Narzędzie DRAW_DUCT)** - Done
    - [x] Utworzenie `useDuctStore` z obsługą `zundo` dla logiki tras (graf DAG).
    - [x] Dodanie wsparcia dla Snappingu (przyciągania do węzłów) oraz Ortho (łamane 90 stopni pod `Shift`).
    - [x] **Iteracja 3.2: Naprawa Logiki, UI & Izolacji**:
        - [x] Dedykowany toolbar dla Etapu 3 (Instalacje) z wyborem systemu.
        - [x] Naprawa "Chaining Bug" (stale closures w React).
        - [x] **Layout Fix**: Przywrócenie pełnego widoku Split-View (Tabela + Canvas) dla Etapu 3 i usunięcie placeholderów.
        - [x] **Izolacja Interakcji**: Blokada kliknięć w strefy i metki (`listening={false}`) podczas rysowania instalacji.
        - [x] **Fix Disappearing Rooms**: Rozwiązanie konfliktu Shift+Click (Orto vs Usuwanie strefy).
        - [x] Wizualny podgląd linii draftu w kolorze aktywnego systemu.
- [x] **WATT REWIZJA 4: Zaawansowana Termodynamika i Integracja CSV/IFC**:
    - [x] Rozbudowa modelu o parametry Lato/Zima i zyski ciepła/wilgoci.
    - [x] Naprawa widoczności podkładów PDF (wymuszenie widoczności po imporcie).
    - [x] Naprawa skalowania okien CAD (Vetted Multiplier oparty na dopasowaniu).
    - [x] Eksport danych termodynamicznych do IFC (Pset_SpaceThermalDesign).
    - [x] Kreator aktualizacji danych termicznych via CSV.
    - [x] Fix: Vertical Topology Mismatch (Roof vs Interior Ceiling).
    - [x] Feature: Dodanie kolumny "Grubość ścian" (d [m]) do zestawienia OZC.
    - [x] Fix: Z-index conflict and UI overlap for WATT/Import modals.
- [x] **WATT REWIZJA 5: Katalog Materiałów i Optymalizacja UX**:
    - [x] Implementacja widoku tabelarycznego w `WATTManagerModal` z edycją inline wszystkich parametrów (λ, ρ, Cp, kategoria).
    - [x] System podzakładek (tabs) dla kategorii materiałów (WSZYSTKO, Mury, Izolacje itd.).
    - [x] Usprawnienie przełącznika widoku (Siatka/Tabela) z czytelnymi etykietami tekstowymi.
    - [x] Grupowanie materiałów wg kategorii w widoku "Wszystko" i płaska lista w widokach szczegółowych.
    - [x] Automatyczne mapowanie nazw technicznych na język polski w interfejsie zakładek.
    - [x] Fix: Dynamiczne wyliczanie współczynnika U w zestawieniu przegród na podstawie rzeczywistych warstw materiałów.
    - [x] UX: Elastyczne przypisywanie typów konstrukcji do ścian (grupy "Dedykowane" i "Pozostałe" w select).
    - [x] Fix: Naprawa wyrównania kolumn dla okien w tabeli termicznej (usunięcie nadmiarowej komórki <td>).
- [x] **WATT REWIZJA 6: Pełna Zgodność Cieplna (PN-EN ISO 6946)**:
    - [x] Implementacja kontekstowego dobierania oporów $R_{si}$ i $R_{se}$ na podstawie fizycznej roli przegrody (Ściana, Dach, Podłoga).
    - [x] Obsługa kontaktu z gruntem ($R_{se}=0$) poprzez atrybut `isGroundContact` i dedykowaną obsługę w `thermalUtils.ts`.
    - [x] Standaryzacja oporów: 0,13 (Ściana), 0,10 (Strumień w górę), 0,17 (Strumień w dół).
    - [x] Fix: Nadpisywanie właściwości `isExternal` z biblioteki rzeczywistym kontekstem topologicznym w tabeli Zestawienia Przegród.
    - [x] UX: Dodanie pola wyboru "Kontakt z gruntem" w kreatorze konstrukcji wielowarstwowych.
    - [x] Weryfikacja: Potwierdzenie wyników dla betonu 24cm (U=3.21 dla ścian/gruntu, U=2.49 dla wewn., U=2.08 dla stropów).
- [x] **WATT REWIZJA 7: Edycja Definicji Przegród**:
    - [x] Dodanie funkcji edycji istniejących przegród warstwowych (ikona ołówka w katalogu).
    - [x] Rozbudowa `WallTypeModal.tsx` o tryb edycji i dynamiczne ładowanie warstw z `layerSet`.
- [x] **WATT REWIZJA 8: Kategoryzacja i Stolarka**:
    - [x] Podział "Typów Przegród" na podzakładki (Ściany Zewn/Wewn, Stropy, Podłogi, Okna, Drzwi).
    - [x] Implementacja `OpeningStyleModal.tsx` do zarządzania biblioteką okien i drzwi w katalogu.
    - [x] Dodanie widoków Siatka/Tabela dla wszystkich kategorii przegród i stolarki.
- [x] **WATT REWIZJA 9: Globalny System Przypisywania Przegród**:
    - [x] Plik `src/data/wt2021.json` z wartościami Umax wg WT2021 dla wszystkich typów przegród (ściany, dachy, podłogi, okna, drzwi).
    - [x] Rozszerzenie `IfcWallType` o: `isDefault`, `defaultAssignMode` ('ALL'|'BY_THICKNESS'), `defaultTolerancePlus`, `defaultToleranceMinus`.
    - [x] Nowy typ `QuickProfile` z edytowalnymi per-kluczowymi wartościami Umax.
    - [x] Store: pola `wtMode`, `quickMode`, `wtStandard`, `activeQuickProfileId`, `quickProfiles`, `globalRoofWallTypeId`, `globalFloorGroundWallTypeId`, `showAssignmentDiagnostic`.
    - [x] Akcja `runAutoAssign()`: automatyczne przypisanie przegród wg flagi domyślnej, metoda ALL lub BY_THICKNESS (z tolerancją). Grubość stropów wewn. = `floor.heightTotal - floor.heightNet`.
    - [x] Nowa zakładka "Przypisanie Przegród" w `WATTManagerModal`: tryb WT2021 (zielony badge WT), tryb QUICK (niebieski badge Q, profil zapisywalny), auto-assign z podglądem statystyk, globalne dropdowny strop/dach i podłoga na gruncie, diagnostyka wizualna.
    - [x] Tryb WT i QUICK obejmują: ściany zewn/wewn, dachy, stropy, podłogi na gruncie, okna, drzwi — zarówno w tabeli ścian (`relatedWallTypeId`) jak i w stolarce (`openings`) i poziomych granicach (`horizontalBoundaries`).
    - [x] Okna bez przypisanej konstrukcji: w trybie WT/QUICK wyświetlają wartość regulacyjną (WINDOW/DOOR klucz z Umax).
    - [x] Sekcja "Przegroda Domyślna" w `WallTypeModal` z checkbox, radio ALL/BY_THICKNESS, tolerancje ±cm.
    - [x] Kolumna "Domyślna" w tabeli Typów Przegród — gwiazdka ★ i tryb (Każda/Gr.) dla przegrody domyślnej.
    - [x] Diagnostyka wizualna 2D/3D: niebieski=przypisana ręcznie, czerwony=brak przypisania, zielony=tryb WT.
- [x] **WATT REWIZJA 9.1: Poprawki Trybu QUICK i Diagnostyki**:
    - [x] Fix: Tryb QUICK obejmuje teraz wszystkie typy przegród (ściany pionowe, poziome, stolarka).
    - [x] Fix: Tryb QUICK korzysta z aktywnego profilu (activeQuickProfileId) dla wszystkich obliczeń U-value w interfejsie.
    - [x] UX: Zmiana koloru diagnostyki wizualnej dla trybu QUICK na żółty (#facc15).
    - [x] UI: Aktualizacja legendy diagnostyki w WATTManagerModal (dodanie Trybu QUICK - żółty).
    - [x] UI: Żółte badge (Q) w tabeli właściwości strefy dla trybu QUICK.
- [x] **WATT REWIZJA 9.2: Interaktywny Znacznik Północy (2D)**:
    - [x] Feat: Draggable i rotatable strzałka północy w widoku "Budynek 2D".
    - [x] Store: Dodanie `northArrowPos` do `useZoneStore` i `ProjectStateData` (Zustand/Persistency).
    - [x] UI: Przycisk "Północ" (Lucide Compass) w pasku narzędzi Building2DViewer do przełączania widoczności.
    - [x] Logic: Synchronizacja rotacji strzałki w 2D z globalnym `northAzimuth` wykorzystywanym m.in. w 3D.
    - [x] Fix: Dynamiczne przeliczanie kierunków (N, S, E, W) w tabeli właściwości strefy na podstawie `azimuth - northAzimuth`.
    - [x] Fix: Ujednolicenie układu współrzędnych topologii (0° = GÓRA) ze znacznikiem 2D (Red Pointer = GÓRA).
    - [x] Logic: Robustne obliczanie azymutu ściany jako **normalnej zewnętrznej** z detekcją uzwojenia (Winding) poligonu (Area > 0 = CCW).

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
* **WATT Module (Architecture & Thermal Topology) - Iteration 1**:
    * **IFC Standard**: Data structures for materials (`IfcMaterial`), layer sets (`IfcMaterialLayerSet`), and walls (`IfcWallType`) follow IFC logic to ensure future BIM compatibility.
    * **Zone Boundaries**: `ZoneData` extended with `boundaries` (vertical) and `horizontalBoundaries` (slabs/roofs).
    * **Persistence**: `useZoneStore` and `useProjectStore` updated to persist IFC dictionaries and `buildingFootprint` in Supabase and Zundo history.
* **WATT Module (Architecture & Thermal Topology) - Iteration 2**:
    * **DXF Extraction Engine**: Created `dxfWattExtractor.ts` with dedicated logic to extract WATT structures independently from UI rendering.
    * **Regex Parsing**: Implemented dynamic extraction of window dimensions (Height $H$, Sill $H_o$) directly from CAD layer names (e.g. `OKNA_H1500_Ho900`) using RegExp.
    * **Smart Geometry**: Algorithm accurately detects 4-vertex rectangles as windows, computing correct real-world Width $B$ (by comparing hypotenuses) and mapping Centroids to the global coordinate space.

* **WATT Module (Architecture & Thermal Topology) - Iteration 3**:
    * **Hybrid Adjacency Engine**: Implemented in `topology.ts`. Detects interior walls by analyzing segment parallelism and proximity ($d \le 0.6m$) between zone polygons.
    * **Boundary Detection**: Automated classification of `EXTERIOR` walls by projecting unresolved edges against the `buildingFootprint`.
    * **UI Integration**: `ZonePropertiesPanel` refactored into a Tabbed UI (General, Systems, WATT). Topology tab provides real-time visualization of wall attributes (Length, Azimuth, Thickness).
    * **TDD Validation**: Comprehensive test suite ensuring mathematical accuracy of adjacency and snapping logic.

* **WATT Module (Architecture & Thermal Topology) - Iteration 4**:
    * **Vertical Analysis Engine**: Implemented `verticalAnalysis.ts` using a high-performance **Grid Sampling** method (Boolean Difference approximation).
    * **Boundary Detection**: Automated discovery of `ROOF`, `FLOOR_GROUND`, and `FLOOR_EXTERIOR` (overhangs) by cross-referencing zone polygons across different floor elevations.
    * **Multi-Floor Logic**: `updateZoneTopology` enhanced to fetch and transform geometry from adjacent floors (Above/Below) for 3D analytical consistency.
    * **UI Data visualization**: Added "Horizontal Boundaries" table to the WATT tab, showing computed areas for all thermal slabs.

* **WATT Module (Architecture & Thermal Topology) - Iteration 5 (Final)**:
    * **Analytical Visualization**: Added a dedicated Konva layer in `Workspace2D` to render thermal topology results.
    * **Wall Highlighting**: Exterior walls are visually distinguished with orange strokes, providing immediate feedback on building boundary correctness.
    * **Smart Windows**: Window instances are projected onto walls as dynamic rectangles, respecting CAD-derived widths and positions.
    * **3D Context Indicators**: Implemented centroid-based badges for `ROOF` and `OVERHANG` status, enabling quick identification of multi-level exposure.
    * **UI/UX Consistency**: Integrated all WATT actions into the tabbed properties panel, ensuring a seamless flow between mechanical design and architectural analysis.

* **WATT Module (Architecture & Thermal Topology) - Iteration 6**:
    * **Thermal Catalog**: Implemented `WATTManagerModal` for managing `IfcMaterial` library and `IfcWallType` definitions.
    * **Layered Structures**: `WallTypeModal` allows building multi-layer wall structures with dynamic U-value calculation based on material $\lambda$ and layer thickness.
    * **Physics Integration**: Added `thermalUtils.ts` for standardized thermal resistance ($R$) and transmittance ($U$) calculations ($R_{total} = R_{si} + \sum(d_i / \lambda_i) + R_{se}$).
    * **Boundary Linking**: `ZonePropertiesPanel` updated to allow assigning specific wall types to detected topological boundaries, bridging the gap between geometry and thermal analysis.

* **WATT DODATKOWY KROK (Budynek 2D)**:
    * **Widok Architektoniczny**: Wdrożono nowy moduł `Building2DViewer` (ID etapu: 9), który służy jako dedykowany obszar roboczy dla modelu HVAC/BIM bez wizualnego szumu podkładów.
    * **Sterowanie Podkładem**: Dodano globalny stan `isUnderlayVisible` do `useUIStore`, co pozwala na niezależne przełączanie widoczności tła (PDF/DXF) w różnych widokach. W widoku "Budynek 2D" podkład jest domyślnie wyłączony.
    * **Interaktywność i Selekcja**: Wdrożono mechanizm wyboru poszczególnych krawędzi ścian (`ZoneBoundary`) bezpośrednio na rzucie 2D. Kliknięcie krawędzi automatycznie ustawia `selectedBoundaryId`, podświetla ją na fioletowo, centruje tabelę przegród i przełącza panel właściwości na zakładkę WATT.
    * **Wizualizacja Obrysu**: Dodano rysowanie głównego obrysu budynku (`outer`) oraz dziedzińców (`courtyards`) jako szarych linii przerywanych, ułatwiając weryfikację poprawności importu z CAD.
    * **Reużywalność**: Moduł wykorzystuje silnik `Workspace2D`, zapewniając pełną spójność wizualną stref, metek i wyników analizy WATT między etapami projektu.

* **WATT DODATKOWY KROK (Budynek 3D)**:
    * **Technologia**: Wdrożono biblioteki `three`, `@react-three/fiber` oraz `@react-three/drei` w celu stworzenia deklaratywnego widoku 3D na platformie React.
    * **Komponent `Building3DViewer`**: Zintegrowano nowy router UI (ID etapu: 8) wyświetlający pełnoekranowy Canvas.
    * **Algorytm Generacji**: Na podstawie punktów $p_1$ i $p_2$ z `ZoneBoundary` obliczany jest wektor różnicy (dx, dz), środek ciężkości krawędzi oraz azymut dla potrzeb obrócenia BoxGeometry w 3D.
    * **Zapobieganie Z-Fighting**: Modele okien posiadają grubość zwiększoną o 5 cm względem ściany oraz ustawione parametry przezroczystości (transmission, opacity) w materiale fizycznym, co zapobiega migotaniu na stykach poligonów.

* **WATT REWIZJA 1 (Poprawki po testach użytkownika)**:
    * **Skala i Geometria**: Naprawiono błąd skali (566m -> 5.6m) poprzez automatyczne aplikowanie `syncMultiplier` do wszystkich obliczeń topologicznych w `topology.ts`.
    * **Analiza Pionowa (Floor Heights)**: Rozszerzono model `Floor` o trzy rzędne: `heightTotal` (konstrukcyjna), `heightNet` (do stropu), `heightSuspended` (dla HVAC). `Building3DViewer` używa teraz `heightTotal` dla ścian zewnętrznych i `heightNet` dla wewnętrznych.
    * **Globalna Baza Materiałów**: Wdrożono `src/data/materials.json` jako źródło prawdy dla biblioteki materiałów (12 standardowych pozycji). `useZoneStore` inicjalizuje się tymi danymi.
    * **Szablony Przegród**: Implementacja `wallTypeTemplates` pozwala na zapisywanie konstrukcji wielowarstwowych do biblioteki globalnej, ułatwiając wielokrotne użycie w projektach.
    * **Wykrywanie Ścian Zewnętrznych**: Zoptymalizowano `checkBoundary` – zwiększono tolerancję snappingu do $1.2\text{ m}$ oraz wdrożono wsparcie dla warstw dziedzińców (`CourtyardLayers`).
    * **Logika L_osi**: Wprowadzono przybliżenie długości osiowej ścian zewnętrznych poprzez automatyczne rozszerzanie krawędzi o ich grubość w algorytmie topologii.
    * **Globalna Analiza**: Dodano przycisk ⚡ (`Zap`) w `TopBar` wyzwalający akcję `analyzeAllZones`, eliminując potrzebę ręcznego analizowania każdej strefy z osobna.
    * **Orientacja**: Dodano parametr `northAzimuth` do projektu, pozwalający na obracanie modelu względem kierunków świata dla celów OZC.

* **WATT REWIZJA 2 (Stabilizacja, Skalowanie i UX)**:
    * **Circular Dependency Fix**: Refactored `topology.ts` and `verticalAnalysis.ts` to accept `scaleFactor` as a parameter instead of importing `useCanvasStore`. This resolved `ReferenceError` crashes and improved the purity of geometric utilities.
    * **CAD Scaling Correction**: Fixed a critical bug in `AirBalanceTable.tsx` where building footprints and windows were stored in pixels. They are now correctly scaled to **meters** during import, ensuring parity with the topology engine and real-world dimensions.
    * **3D Viewer Enhancements**: 
        *   Implemented **North Arrow** (Iglica Północy) reflecting the project's `northAzimuth`.
        *   Added **Zone Slab Rendering**: The viewer now renders horizontal floor slabs for all zones based on their 2D polygons, even if topology analysis hasn't been run yet.
        *   Integrated floor-specific heights ($H_{brutto}$ for exterior, $H_{netto}$ for interior) into the 3D mesh generation.
    * **UX Optimization**:
        *   **Smart Auto-Detection**: Sync modal now uses Regex to auto-suggest layers for Rooms, Footprints, and Windows.
        *   **Reliable Selection**: Layer lists in the sync modal now use buttons with explicit `onClick` handlers, resolving double-click and interaction issues common with native labels.
    * **Data Robustness**: Added migration logic in `loadState` to ensure default thermal heights exist for all projects, preventing crashes in the 3D rendering pipeline.

* **WATT REWIZJA 3 (Poprawki Obliczeniowe i UX Importu)**:
    * **Topology Scaling Synchronization**: Resolved critical bug where imported walls had lengths like 566m instead of 5.66m. The `AirBalanceTable` now automatically writes the `syncMultiplier` back to the floor's `scaleFactor` after CAD extraction, ensuring the topology engine calculates lengths in meters.
    * **Gross Area Algorithm (Roofs & Floors)**: Overhauled `verticalAnalysis.ts` to compute gross areas (instead of net interior areas). Points outside the zone but within the `buildingFootprint` are now correctly credited to the nearest zone, yielding accurate external boundary dimensions (e.g. 21.09m² instead of 14.8m²).
    * **Robust State Initialization**: Fixed `ReferenceError` crashes occurring on empty/new projects by enforcing `{ outer: [], courtyards: [] }` as the default structure for `buildingFootprint` during `loadState` and component evaluation.

* **WATT INTERAKCJA I SYNCHRONIZACJA (Budynek 2D/3D)**:
    * **Interaktywne Przegrody**: Wdrożono `hitStrokeWidth` (25px) dla krawędzi ścian w 2D, znacząco ułatwiając ich zaznaczanie myszą. Kliknięcie krawędzi automatycznie synchronizuje `selectedBoundaryId`, centruje tabelę i przełącza panel na zakładkę Topologia.
    * **Dwukierunkowe Podświetlanie**: Wybór przegrody w tabeli WATT natychmiastowo aktywuje fioletowe wyróżnienie (emissive glow) na odpowiednim segmencie w widoku 2D oraz na bryle 3D (3D-to-UI binding).
    * **Wizualizacja Obrysu CAD**: Dodano renderowanie obrysu budynku (`footprint.outer`) i dziedzińców jako linii przerywanych, co pozwala na wizualną weryfikację "domknięcia" modelu analitycznego względem rzutu architektonicznego.
    * **Poprawka Skali 3D**: Wszystkie importowane obrysy i okna są teraz skalowane do metrów podczas procesu synchronizacji, co zapewnia pełną spójność wymiarową bryły budynku.

* **WATT REWIZJA 4 (Przegrody Poziome i Zaawansowana Interakcja)**:
    * **Interaktywne Symbole 2D**: Wdrożono inteligentne etykiety (R, G, O, C) w widoku "Budynek 2D". Symbole te zastąpiły pełne wypełnienia płaszczyzn, zapewniając czytelność rzutu przy zachowaniu pełnej klikalności przegród poziomych.
    * **Rendering 3D Stropów i Dachów**: Przegrody poziome są teraz fizycznie renderowane w widoku 3D na właściwych rzędnych ($elevation$ dla podłóg, $elevation + heightTotal$ dla dachów).
    * **Konstrukcje Poziome**: Umożliwiono przypisywanie typów `WallType` (materiałów) do przegród poziomych w panelu właściwości, domykając relacyjny model energetyczny strefy.
    * **Synchronizacja Selekcji**: Implementacja `selectedHorizontalBoundaryId` w `useZoneStore` zapewnia spójne podświetlanie (fioletowa poświata w 3D / aktywny stan w 2D) wybranego stropu we wszystkich oknach aplikacji.
    * **FIX (JSX Nesting)**: Naprawiono krytyczny błąd składni w `Building3DViewer.tsx` (brakujące zamknięcie tagu `<group>`), który uniemożliwiał uruchomienie strony.

* **WATT REWIZJA 4 (Termodynamika i Poprawki Importu)**:
    * **Zaawansowana Termodynamika**: Rozszerzono model stref o parametry `winter/summer` (Temp, RH) oraz zyski ciepła jawnego (`heatGain`) i wilgoci (`moistureGain`). `PhysicsEngine.ts` wspiera teraz trzy tryby bilansowania.
    * **Fix: Widoczność Podkładu PDF**: Rozwiązano problem, w którym podkłady PDF stawały się niewidoczne po nawigacji. `Workspace2D.tsx` teraz bezwarunkowo wymusza `setIsUnderlayVisible(true)` po każdym pomyślnym załadowaniu pliku.
    * **Fix: Skalowanie Okien CAD (Vetted Multiplier)**: Rozwiązano błąd 10-krotnego przeskalowania okien (np. 12cm zamiast 120cm). System dynamicznie wylicza `derivedMultiplier` z kalibracji 3-punktowej i wykonuje "Snap" do standardowych jednostek (mm, cm, m), zapewniając spójność wymiarową rzutu i dancyh analitycznych.
    * **BIM / IFC**: Eksport IFC zawiera teraz pełny `Pset_SpaceThermalDesign`, mapując parametry bilansowe stref na standardowe właściwości IFC.
    * **CSV Update Module**: Wdrożono `ThermodynamicUpdateModal`, pozwalający na porównawczą aktualizację danych termicznych stref z plików zewnętrznych.
    * **Vertical Topology**: Wprowadzono dwukierunkową analizę pionową (recursive re-analysis), eliminując błędy typu "ROOF" na parterze po dodaniu piętra.
    * **OZC Table**: Dodano kolumnę `d [m]` wyświetlającą obliczoną grubość ścian na podstawie geometrii CAD.

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

## STABILIZACJA I DEBUGOWANIE KROKU 3.4 (Flow Propagation)

### 1. Robustness: Liczenie Terminali i Przepływy
*   **Problem**: Błąd "+1" w liczniku terminali w panelu właściwości oraz nadpisywanie przepływów w sieciach z wieloma korzeniami.
*   **Rozwiązanie**: 
    *   Poprawiono `DuctPropertiesPanel.tsx` (usunięcie offsetu).
    *   Zaktualizowano `networkEngine.ts`: Przepływy są teraz **akumulowane** (`+=`), co pozwala na poprawną obsługę systemów z wieloma AHU lub pionami.
*   **Prewencja**: Zawsze zakładać, że sieć może być lasem (wiele drzew/korzeni) i stosować logikę addytywną.

### 2. Spatial Intelligence: Auto-przypisywanie Stref
*   **Problem**: Konieczność manualnego wybierania strefy dla każdego anemostatu.
*   **Rozwiązanie**: Wdrożono algorytm `isPointInPolygon` (ray-casting) w `geometryUtils.ts`.
*   **Automatyzacja**: 
    *   `useDuctStore.ts`: Akcje `addNode` i `updateNode` automatycznie sprawdzają kolizję punktu z poligonami stref.
    *   Przy wstawianiu lub przesunięciu terminala, `zoneId` aktualizuje się samoczynnie.
*   **Prewencja**: Relacje przestrzenne (punkt wewnątrz strefy) powinny być liczone programowo, nie deklaratywnie przez użytkownika.

### 3. Wydajność: Bulk Updates
*   **Problem**: Pętla w `syncTerminalsFromZones` wywołująca `updateNode` dla każdego terminala, co powodowało setki zbędnych rekursji DFS.
*   **Rozwiązanie**: Dodano akcję `bulkUpdateNodes()` w `useDuctStore.ts`. Pozwala na aktualizację wielu węzłów w jednej transakcji Zustand i jedno przeliczenie sieci na końcu.
*   **Prewencja**: **Nigdy** nie wywoływać akcji aktualizujących store wewnątrz pętli `.forEach`. Zawsze zbierać zmiany do obiektu i wysyłać raz (Bulk Pattern).

### 4. Stabilność Canvas (Eliminacja "Białego Ekranu")
*   **Problem**: `TypeError: getParent of undefined` przy rysowaniu przewodów oraz pusty canvas po F5/odświeżeniu.
*   **Przyczyny**: 
    1.  Wywołania `stageRef.current.getStage().container()` przed pełną inicjalizacją Konva.
    2.  Renderowanie `Workspace2D` przy braku wczytanych metadanych kondygnacji.
*   **Rozwiązanie**: 
    1.  Optional chaining i null-checks we wszystkich handlerach zdarzeń Konva.
    2.  **Rendering Guard** w `Workspace2D.tsx`: Jeśli `activeFloorMetadata` lub `activeCanvasFloor` są nieobecne, komponent zwraca `Loader` zamiast próbować renderować `Stage`.
*   **Prewencja**: Traktować dostęp do API `Stage` jako operację niepewną (unsafe). Stosować "Initial Loading State" dla kluczowych komponentów CAD.

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

### FAZA 2.10.3b (2026-03-18): Poprawka interakcji Metek z Kadrem
- **Objaw**: Po zdefiniowaniu Kadru (obszaru eksportu), użytkownik tracił możliwość chwytania i przesuwania metek (etykiet). Po usunięciu Kadru metki znów działały.
- **Przyczyna**: Konflikt przechwytywania zdarzeń. `Rect` Kadru (z przezroczystym fill) miał domyślnie `listening={true}`, więc przechwytywał wszystkie zdarzenia myszy w swoim bounding box, blokując dostęp do metek znajdujących się pod spodem.
- **Rozwiązanie**: Dodano `listening={false}` do głównego `Rect` Kadru w `uiOverlayLayerRef`. Dzięki temu przezroczyste wypełnienie Kadru przepuszcza zdarzenia myszy do elementów pod spodem (metek, stref). Przycisk usuwania Kadru (ikona "×") pozostaje interaktywny, ponieważ jest osobnym elementem `Group`.
- **Technologia**: Konva.js - atrybut `listening` kontroluje, czy dany kształt reaguje na zdarzenia myszy.

### FAZA 2.10.3c (2026-03-18): Poprawka obsługi polskich znaków
- **Problem**: Metki i interfejs nie wyświetlały poprawnie polskich znaków (ą, ć, ę, ł, ń, ó, ś, ź, ż).
- **Rozwiązania**:
    1. Zmieniono `lang="en"` na `lang="pl"` w `index.html`
    2. Zmieniono font w Konva Text z `"Arial, sans-serif"` na `"Segoe UI, Arial, sans-serif"` - Segoe UI jest fontem systemowym Windows z pełną obsługą polskich znaków
- **Lokalizacja**: `index.html:2`, `Workspace2D.tsx:1406,1417`

### FAZA 2.10.3d (2026-03-18): Ulepszenia eksportu DXF (Bazowa wersja)
- **Stan**: Przywrócono podstawową wersję eksportu DXF po błędach w funkcjach TrueColor/Arial
- **Dodane warstwy**: `WENTCAD_METKI_RAMKI`, `WENTCAD_METKI_TEKST`
- **Ramki metek**: Rysowane jako 4 linie (prostsza implementacja niż LWPolyline)
- **Polskie znaki**: Funkcja `escapePolishChars()` działa
- **DO ZROBIENIA**: Kolory TrueColor i czcionka Arial wymagają dalszych testów z dokumentacją `@tarikjabiri/dxf`
- **Lokalizacja**: `src/lib/dxfExport.ts`

(End of file - total 400 lines)

(End of file - total 350 lines)

### FAZA 2.10.3e (2026-03-18): Naprawa struktury DXF dla AutoCAD
- **Problem**: Wygenerowany DXF nie otwierał się w AutoCAD. Brakowało sekcji HEADER oraz wywołanie `setVariable()` generowało niepoprawną strukturę.
- **Struktura DXF**: Dodano prawidłową sekcję HEADER z zmiennymi systemowymi ($ACADVER, $INSUNITS, $EXTMIN, $EXTMAX, $LIMMIN, $LIMMAX)
- **Usunięto**: Wywołanie `dxf.setVariable('$TEXTSTYLE', {...})` które generowało złą strukturę
- **Wersja AutoCAD**: AC1027 (AutoCAD 2013)
- **Lokalizacja**: `src/lib/dxfExport.ts:221-272`

### FAZA 2.10.3f (2026-03-18): Naprawa pozycji sekcji HEADER w DXF
- **Problem**: Biblioteka `@tarikjabiri/dxf` generuje własną sekcję HEADER i wstawiałem ją w złym miejscu (po ENTITIES).
- **Rozwiązanie**: Wyszukuję początek sekcji HEADER w stringify output i zamieniam ją na prawidłową wersję.
- **Lokalizacja**: `src/lib/dxfExport.ts`

### FAZA 2.11 (2026-03-18): Naprawa eksportu DXF - Metki
- **Problem**: Obwiednia metek była źle liczona (zbyt duża), czcionka Arial nie była używana
- **Rozwiązania**:
  - `measureTextWidth()` - usunięto mnożenie przez fontSize, poprawiono współczynniki szerokości znaków
  - `fontSize = 1.0` - zwiększono wysokość tekstu dla lepszej widoczności
  - `paddingX = 0.1`, `paddingY = 0.05` - zmniejszono marginesy
  - Biblioteka `@tarikjabiri/dxf` zawsze używa stylu "STANDARD" (nie można zmienić przez API)
- **Lokalizacja**: `src/lib/dxfExport.ts:68-87, 201-205`

### FAZA 2.11.1 (2026-03-18): Konfigurowalna wysokość czcionki DXF
- **Funkcjonalność**: Użytkownik może teraz ustalić wysokość czcionki metek podczas eksportu DXF
- **Zakres**: 0.05 m - 0.5 m (domyślnie 0.1 m = 10 cm)
- **Interfejs**: Suwak + pole numeryczne w oknie eksportu (ExportModal.tsx)
- **Persystencja**: Wartość jest zapisywana w localStorage (via Zustand persist) i przywracana po odświeżeniu przeglądarki
- **Implementacja**:
  - `DxfExportSettings` interface w `src/types.ts`
  - `dxfExportSettings.fontHeight` w `useZoneStore.ts` z partialize
  - `setDxfFontHeight()` action z walidacją zakresu
  - `measureTextWidth()` teraz przyjmuje fontHeight jako parametr
  - Wszystkie wymiary metki (padding, lineHeight) skalują się względem fontHeight

### FAZA 2.11.2 (2026-03-18): Regulacja odstępów metek DXF
- **Funkcjonalność**: Użytkownik może regulować odstępy i marginesy metek podczas eksportu DXF
- **Parametry**:
  | Parametr | Zakres | Domyślna | Opis |
  |----------|--------|----------|------|
  | lineSpacing | 0.25 - 2.0 | 1.25 | Mnożnik wysokości czcionki na odstęp między wierszami |
  | paddingX | 0.2 - 2.0 | 1.0 | Mnożnik wysokości czcionki na margines poziomy ramki |
  | paddingY | 0.1 - 1.0 | 0.36 | Mnożnik wysokości czcionki na margines pionowy ramki |
- **Implementacja**:
  - Rozszerzono `DxfExportSettings` w `src/types.ts`
  - Dodano `setDxfLineSpacing()`, `setDxfPaddingX()`, `setDxfPaddingY()` w `useZoneStore.ts`
  - Zaktualizowano `exportToDXF()` w `src/lib/dxfExport.ts` - parametry jako mnożniki fontHeight
  - Nowy UI w `ExportModal.tsx` - 4 suwaki z polami numerycznymi

### FAZA 2.11.3 (2026-03-18): Naprawa błędu eksportu DXF (białe tło/zawieszenie)
- **Problem 1**: Po kliknięciu przycisku "Eksport" na pasku narzędzi pojawiało się białe tło zamiast modala
- **Przyczyna 1**: Stary zapisany stan (localStorage z FAZA 2.11.1) nie zawierał pól `lineSpacing`, `paddingX`, `paddingY` → `undefined` → błąd React
- **Rozwiązanie 1**: 
  - Zwiększono wersję persist do 3
  - Dodano migrację v2→v3 która uzupełnia brakujące pola `dxfExportSettings`
  - Dodano fallbacki w `ExportModal.tsx`: `dxfExportSettings?.lineSpacing ?? 1.25`
- **Problem 2**: Przycisk "Eksportuj do DXF" w modalu powodował białe tło / brak eksportu
- **Przyczyna 2**: Nieprawidłowy MIME type `application/dxf` powodował próbę otwarcia pliku zamiast pobrania
- **Rozwiązanie 2**:
  - Zmieniono MIME type na `application/octet-stream`
  - Dodano walidację parametrów i wyniku `dxf.stringify()`
  - Modal zamykany PRZED pobraniem, download opóźniony o 100ms
- **Pliki**: `src/stores/useZoneStore.ts`, `src/components/ExportModal.tsx`, `src/lib/dxfExport.ts`, `src/components/Workspace2D.tsx`

### FAZA 2.11.4 (2026-03-18): Połączone pola FLOW + SYSTEM w metkach
- **Cel**: Nawiew i Wywiew wyświetlane jako `System: Wartość m³/h`
- **Nowe typy pól**: `FLOW_SUPPLY_WITH_SYSTEM`, `FLOW_EXHAUST_WITH_SYSTEM`
- **Format wartości**:
  | Pole | Format | Przykład |
  |------|--------|----------|
  | Nawiew | `{System}: {Flow}{suffix}` | `N1: 300 m³/h` |
  | Wywiew | `{System}: {Flow}{suffix}` | `W1: 280 m³/h` |
- **Poprawka 2.11.4b**: Używano `system.name` zamiast `system.id` - powodowało wyświetlanie "Wywiew 1: 60 m³/h" zamiast "W1: 60 m³/h"
- **Domyślne ustawienia**:
  - `FLOW_SUPPLY_WITH_SYSTEM`: enabled=true, suffix=' m³/h', order=3, column=2
  - `FLOW_EXHAUST_WITH_SYSTEM`: enabled=true, suffix=' m³/h', order=4, column=2
  - Usunięto stare `FLOW_SUPPLY` i `FLOW_EXHAUST` z domyślnych (nadal dostępne w kreatorze)
- **Implementacja**:
  - `src/types.ts`: dodano nowe typy `TagFieldType`
  - `src/stores/useZoneStore.ts`: zaktualizowano `DEFAULT_TAG_FIELDS`
  - `src/components/Workspace2D.tsx`: rozszerzono `generateTagText()`, używa `system.id`
  - `src/components/SmartTagModal.tsx`: rozszerzono preview i etykiety
- **Poprawka 2.11.4c (2026-03-19): Naprawy layoutu i geometrii DXF**
  - **Poprawka Layoutu (2-kolumny)**: Eksport DXF wspiera teraz side-by-side layout (kolumna 1 i 2), co zapewnia zgodność z widokiem Canvas 2D.
  - **Precyzja Geometrii (measureTextWidth)**: Zaktualizowano współczynniki szerokości znaków w `dxfExport.ts` (np. `:` -> 0.30, `0-9` -> 0.65), usuwając problem ucinania tekstu w AutoCAD.
  - **Testy i Dokumentacja**: Wykonano pełną weryfikację logiki `FLOW + SYSTEM`. Stworzono plik `TEST_SUMMARY.md`.
  - **Pliki**: `src/lib/dxfExport.ts`, `TEST_SUMMARY.md`

- **Poprawka 2.11.4d (2026-03-19): Naprawa wycieku danych (Data Leak) między projektami**
  - **Problem**: Nowe projekty wczytywały podkłady i rysunki z poprzednio otwartego projektu z powodu współdzielonego ID kondygnacji `floor-parter` w lokalnym IndexDB (`useCanvasStore`).
  - **Rozwiązanie**: Zrezygnowano ze stałego ID `floor-parter`. Funkcja `createProject` i inicjalny stan `useZoneStore` generują teraz unikalne identyfikatory `floor-uuid`.
  - **Zasięg**: Wszystkie nowe projekty od teraz są w pełni odizolowane na poziomie rzutu 2D. Naprawiono również niepoprawne fallbacki do `floor-parter` w `AirBalanceTable.tsx` i `RoomWizardModal.tsx`.
  - **Pliki**: `src/stores/useProjectStore.ts`, `src/stores/useZoneStore.ts`, `src/components/AirBalanceTable.tsx`, `src/components/RoomWizardModal.tsx`, `NEW_PROJECT_DATA_LEAK_FIX.md`

- **Poprawka 2.11.4f (2026-03-19): Naprawa UX narzędzia Kadrowanie (Eksport PNG/DXF) oraz Globalne Filtry Tabeli**
  - **Problem 1**: Po narysowaniu pierwszego kadru przycisk "Eksportuj do PNG/DXF" był nadal zablokowany w modalu, ponieważ React nie odświeżał początkowej wartości `selectedRegionId`.
  - **Rozwiązanie 1**: Dodano `useEffect` w `ExportModal.tsx`, wymuszający wybór pierwszego dostępnego kadru w przypadku, gdy stan zaznaczenia jest pusty. Zastąpiono też okno `window.prompt` automatycznym nazewnictwem "Kadr 1", "Kadr 2", ulepszając płynność eksportu.
  - **Problem 2**: Przycisk 'X' usuwający kadr z kanwy 2D ignorował kliknięcia z uwagi na blokujące zdarzenia `drag` w bibliotece Konva przy zdarzeniu `onClick` dla zbyt małych elementów (szerokość `12px`).
  - **Rozwiązanie 2**: Powiększono obiekt nasłuchujący przycisku do rozmiarów `32px` oraz zmodyfikowano event na standardowe `onClick` / `onTap` gwarantując łatwiejsze "trafienie" w przycisk i brak przerywania po mikroruchach myszki.
  - **Filtry Kolumn (Nowa Funkcjonalność)**: Wdrożono globalny mechanizm zapisywania układów kolumn (`useSettingsStore.ts` poprzez IDB). Dodano boczny panel AG-Grid `SavedFiltersToolPanel.tsx` obok klasycznych kolumn. Naprawiono bug z notorycznie samo-zamykającym się paskiem poprzez objęcie konfiguracji `sideBar` oraz `components` w hooki `useMemo` (aby zapobiec zmianom referencji na przerysowanie).
  - **Właściwości Strefy (UI/RWD)**: Przebudowano boczny panel szczegółów strefy (`ZonePropertiesPanel.tsx`). Dodano funkcję swobodnego skalowania szerokości (resizing) metodą przeciągania lewej krawędzi okna oraz możliwość całkowitego zwinięcia panelu (collapsing) pod dedykowany przycisk powrotu. Kiedy panel przekracza 450px szerokości, jego wewnętrzne parametry przepinają się na widok siatki (`grid-cols-2`), oszczędzając wysokość i miejsce na małych monitorach po wejściu w tryb "szeroki".

- **Nowy Moduł 2.11.x (2026-03-19): Eksport Danych Tabelarycznych do PDF/XLSX**
  - Zainstalowano pakiety do generowania raportów: `jspdf`, `jspdf-autotable`, `xlsx`.
  - Stworzono obszar `ExportDashboard.tsx` dla Kroku 7 z Menu `TopBar`.
  - Konfigurator wspiera eksport całego bilansu oraz szczegółowych kart dla samych pokojów. Posiada możliwość ucięcia zakresu tylko dla Obecnej Kondygnacji lub całego projektu.
  - Generowane dokumenty korzystają z zadeklarowanego szablonu wyświetlania kolumn z modułu "Szablony" po to, aby PDF był czysty i kompaktowy w zależności od wymogów (Arkusz A3).
  - Dodano możliwość ustalania formatowania PDF (typ czcionki i jej wymiar). Umożliwiono zapis profilu eksportu do pamięci trwałej `useSettingsStore` w celu ponownego i szybkiego generowania zaawansowanych raportów dla kolejnych projektów.
  - Skrypt generowania PDF/XLS znajduje się w nowym pliku usług: `src/lib/exportUtils.ts`. Wykorzystuje płaskie mapowanie tabel na format kompatybilny z `AutoTable` oraz arkuszami binarnymi Excela. Puste parametry są czyszczone do domyślnych by łagodzić błędy TypeScript w obydwu formatach.  
  - **Pliki**: `src/components/ExportDashboard.tsx`, `src/lib/exportUtils.ts`, `src/stores/useSettingsStore.ts`, `src/App.tsx`

- **Poprawka 2.11.5 (2026-03-20): Udoskonalenie Eksportu PDF (Fonty i Zestawienia)**
  - **Obsługa Polskich Znaków**: Wprowadzono dynamiczne wstrzykiwanie czcionki `Roboto` do `jsPDF`. Skrypt asynchronicznie pobiera pliki `.ttf` z CDN, konwertuje na Base64 i rejestruje w VFS, eliminując błędy kodowania w raportach.
  - **Tabele Podsumowań**: Dodano funkcję "Zestawienia" (Globalne, Kondygnacji, Systemów) do `exportUtils.ts` (opcja w `ExportDashboard.tsx`). Agregują one dane o powierzchniach i sumach przepływów niezbędne do doboru central/wentylatorów.
  - **Rozbudowane Karty Pomieszczeń**: Zastąpiono proste wiersze tekstu sformalizowanymi wielosekcyjnymi tabelami `AutoTable` (grid layout), kategoryzując dane na Geometrię i Systemy.
  - **Pliki**: `src/lib/exportUtils.ts`, `src/components/ExportDashboard.tsx`, `src/stores/useSettingsStore.ts`.

- **Poprawka 2.11.6 (2026-03-20): Optymalizacja UX Nagłówków AG-Grid**
  - **Zmiana Układu (Flex Column)**: Przebudowano strukturę nagłówków w `AirBalanceTable.tsx`. Przeniesiono ikony filtrów i menu poniżej nazwy kolumny, co drastycznie poprawiło czytelność długich nazw przy wąskich kolumnach.
  - **Formatowanie Tekstu**: Włączono `wrapHeaderText` oraz `white-space: normal`, pozwalające na łamanie nazw kolumn do wielu linii.
  - **Wysokość Nagłówka**: Ustalono stałą wysokość `headerHeight: 80px`.
  - **Pliki**: `src/components/AirBalanceTable.tsx`, `src/index.css`.

- **Nowy Moduł 2.11.8 (2026-03-20): System Eksportu i Importu Projektów (.wentcad)**
  - **Serializacja Danych**: Stworzono format `.wentcad` (JSON) przechowujący kompletny zrzut `useZoneStore` (pokoje, systemy, tagi) oraz powiązane stany `useCanvasStore` (rysunki, podkłady DXF).
  - **Eksport**: Dodano przyciski zapisu w `TopBar.tsx` (dla aktywnego projektu) oraz `ProjectDashboard.tsx` (dla projektów z listy). Obsługiwany przez `projectTransfer.ts`.
  - **Import Wizard**: Wdrożono `ProjectImportModal.tsx`, który pozwala na:
    - **Odtworzenie jako Nowy Projekt**: Pełna kopia projektu w nowej bazie.
    - **Scalanie (Merge)**: Wybiórczy import poszczególnych kondygnacji z pliku do obecnie otwartego projektu.
  - **Bezpieczeństwo ID**: Implementacja `importProjectService.ts` zawiera algorytm `remapAllIds`, który przy każdym imporcie generuje nowe UUID dla wszystkich kondygnacji, stref i poligonów. Zapobiega to konfliktom danych i "wyciekom" rysunków między różnymi projektami w IndexDB.
  - **Pliki**: `src/lib/projectTransfer.ts`, `src/lib/importProjectService.ts`, `src/components/ProjectImportModal.tsx`, `src/components/TopBar.tsx`, `src/components/ProjectDashboard.tsx`.

### Iteracja 2.12: Moduł eksportu Spatial BIM (IFC2x3)
- **Implementacja**: Utworzono plik `src/lib/ifcExport.ts` zawierający mechanizm budowania plików IFC (oparty na standardzie STEP, ISO-10303-21). Zaimplementowano generator unikalnych GUID (konwersja UUIDv4 do kompresji 22-znakowej Base64 dla IFC).
- **Hierarchia przestrzenna**: Tworzony plik mapuje obiekty w następującej strukturze: `IfcProject` -> `IfcSite` -> `IfcBuilding` -> `IfcBuildingStorey` -> `IfcSpace`.
- **Geometria (Bryły 3D)**: Dla każdej strefy (przypisanej do kondygnacji) generowana jest bryła `IfcExtrudedAreaSolid` poprzez wyciągnięcie jej poligonu narysowanego na Canvas 2D, z uwzględnieniem przypisanej wysokości (domyślnie `3.0 m`). Parametry współrzędnych i rzędnych (`elevation`) pobierane są ze store'a.
- **Właściwości Termodynamiczne (Pset)**: Do każdej strefy (`IfcSpace`) podpinany jest zestaw właściwości o nazwie `Pset_SpaceThermalDesign`, eksportując kluczowe parametry: `TotalHeatGain`, `TotalHeatLoss`, `SpaceTemperatureWinterMin`, `SpaceTemperatureSummerMax` oraz `SpaceHumiditySummer` bazując na danych wprowadzonych w tabeli bilansowej.
- **Interfejs Użytkownika**: Zintegrowano obsługę z głównym panelem eksportu (`ExportDashboard.tsx`). Dodano dedykowany przycisk `IFC (3D)`, który blokuje zbędne opcje konfiguracyjne specyficzne dla dokumentów (jak tabele i czcionki) i wykonuje szybki render do przeglądarkowego okna pobierania.
- **Pliki**: `src/lib/ifcExport.ts`, `src/components/ExportDashboard.tsx`, `src/stores/useSettingsStore.ts`.

### Iteracja 3.1: Fundamenty Topologii HVAC (Graph-based Routing)
- **Architektura Grafu (DAG)**: Wprowadzono `useDuctStore.ts` jako centralny magazyn dla sieci przewodów. Sieć oparta jest na węzłach (`DuctNode`) i krawędziach (`DuctSegment`), co pozwala na późniejsze obliczenia spadków ciśnień i przepływów.
- **Persystencja i Historia**: Store został objęty mechanizmem `zundo` (Undo/Redo) oraz `persist` (zapis w IndexDB), zapewniając bezpieczeństwo pracy inżyniera.
- **Typy Danych**: Rozszerzono `src/types.ts` o parametry geometryczne (x, y, floorId) dla węzłów, umożliwiając ich precyzyjne pozycjonowanie na rzucie.

### Iteracja 3.2: Zaawansowane Trasowanie i Snapping
- **Narzędzie DRAW_DUCT**: Implementacja interaktywnego rysowania tras w `Workspace2D.tsx`.
- **Mechanizm Snappingu**: System automatycznie przyciąga kursor do istniejących węzłów w promieniu 15px (skalowanych), gwarantując logiczną spójność grafu (brak "wiszących" końcówek).
- **Tryb Orto (Shift)**: Przytrzymanie klawisza `Shift` wymusza rysowanie linii wyłącznie w pionie lub poziomie, ułatwiając tworzenie technicznych schematów CAD.
- **Wizualizacja**: Dodano dynamiczną linię pomocniczą (Draft line) renderowaną stylem przerywanym w kolorze aktywnego systemu.

### Iteracja 3.2.1: Naprawa Kontekstu UI i Izolacja CAD
- **Naprawa Chaining Bug**: Rozwiązano problem "cofającego się" punktu startowego poprzez poprawną obsługę domknięć (closures) w hookach React. Pozwala to na nieprzerwane rysowanie długich ciągów (A->B->C->D).
- **Dedykowany Toolbar**: Etap 3 (Instalacje) otrzymał własny, pomarańczowy pasek narzędzi, odseparowany od narzędzi architektonicznych.
- **Izolacja Interakcji (Safety)**: Wprowadzono blokadę `listening={false}` dla poligonów stref i metek podczas aktywnego narzędzia trasowania. Eliminuje to błąd przypadkowego usuwania lub przesuwania architektury przy rysowaniu instalacji (rozwiązanie konfliktu Shift+Click).
- **Przywrócenie Layoutu**: Skorygowano `App.tsx`, przywracając pełną funkcjonalność Split-View (Tabela + Canvas) dla etapu instalacji, usuwając zbędne placeholdery.
- **Rozbudowa Edycji i UI (HVAC Inspector)**:
    - **Narzędzie SELECT**: Wprowadzono tryb wyboru pozwalający na zaznaczanie węzłów i krawędzi.
    - **Interaktywne Przesuwanie**: Węzły sieci są od teraz przeciągalne (`draggable`). Przesunięcie węzła automatycznie aktualizuje geometrię i długość wszystkich podłączonych do niego przewodów w czasie rzeczywistym.
    - **DuctPropertiesPanel**: Wdrożono lewy panel właściwości (Inspektor HVAC), wyświetlający szczegółowe dane techniczne (ID, typ, współrzędne, system, długość) zaznaczonego elementu.
    - **Wizualizacja**: Podniesiono czytelność sieci poprzez wymuszenie pełnego krycia (`opacity: 1`) oraz zwiększenie grubości linii rur (`strokeWidth: 5px`).
- **Pliki**: `src/stores/useDuctStore.ts`, `src/components/Workspace2D.tsx`, `src/App.tsx`, `src/components/DuctPropertiesPanel.tsx`.

### Iteracja 3.2.2: Stabilizacja i Naprawa 'White Screen' (Silent Crash) - 2026-03-20
- **Przyczyna 1: Błąd Importu Typów (Vite 8/Rollup 4)**: Zidentyfikowano krytyczny błąd podczas inicjalizacji modułów JS. Importowanie typów TypeScriptowych (np. `NodeType`) jako zwykłych wartości (`import { NodeType }`) zamiast `import type` powodowało błąd `[MISSING_EXPORT]` w nowej wersji silnika budowania. Skutkowało to „pustym DOM-em”, ponieważ skrypt `main.tsx` rzucał błąd przed wykonaniem pierwszej instrukcji.
    - **Naprawa**: Wymuszono używanie `import type` dla wszystkich importów, które służą wyłącznie do typowania.
- **Przyczyna 2: Pętla Nieskończona Synchronizacji**: Efekt `useEffect` w `App.tsx` odpowiedzialny za `debouncedSync` posiadał w tablicy zależności obiekt `activeProject`. Ponieważ funkcja synchronizacji aktualizowała ten obiekt w `ProjectStore`, powodowało to cykliczne ponawianie żądań sieciowych i obciążenie procesora.
    - **Naprawa**: Zmieniono tablicę zależności na `activeProject?.id`, co stabilizuje proces zapisu.
- **Przyczyna 3: Bezpieczeństwo Renderowania (TypeError)**: Komponent `ProjectDashboard.tsx` rzucał błąd podczas próby wywołania metody `.includes()` na obiekcie błędu (Supabase Error), który nie zawsze jest stringiem.
    - **Naprawa**: Wprowadzono bezpieczne rzutowanie `String(error)` oraz sprawdzanie `typeof error === 'string'` przed operacjami na tekście.
- **Weryfikacja**: Aplikacja przeszła testy manualne i automatyczne przy użyciu `browser_subagent`. Potwierdzono poprawne ładowanie dashboardu, tworzenie projektów oraz stabilność etapu instalacji.
- **Pliki**: `src/main.tsx`, `src/App.tsx`, `src/components/ProjectDashboard.tsx`, `src/components/DuctPropertiesPanel.tsx`.

### Iteracja 3.2.3: Naprawa Kolorowania Systemowego i Wizualizacji - 2026-03-20
- **Wymuszenie Kolorów Systemowych**: Rozwiązano problem "jasnoniebieskich stref" oraz szarych linii instalacji. Usunięto zależność renderowania od globalnego przełącznika `isSystemColoringEnabled` w module CAD. 
- **Logika Renderowania**: 
    - Strefy architektoniczne (`Polygons`) oraz sieć rur (`Ducts`) od teraz zawsze pobierają kolory bezpośrednio z algorytmu `resolveZoneStyle` i definicji systemów.
    - Gwarantuje to czytelność instalacji (np. czerwony wyciąg, zielony nawiew) niezależnie od ustawień widoku tabeli.
- **Naprawa Linii Draftu**: Dynamiczna linia podglądu podczas rysowania (`DRAW_DUCT`) również została zsynchronizowana z kolorem wybranego systemu.
- **Cleanup**: Usunięto nieużywane zmienne i poprawiono tablice zależności w hookach `useEffect` (m.in. w `App.tsx`, `AirBalanceTable.tsx`), co wyeliminowało ostrzeżenia lintera i potencjalne błędy wydajnościowe.
- **Pliki**: `src/components/Workspace2D.tsx`, `src/App.tsx`, `src/components/AirBalanceTable.tsx`, `src/components/VersionHistoryPanel.tsx`.

### Iteracja 3.2.4: Logika Topologii i Propagacja Systemów - 2026-03-20
- **Propagacja Systemów**: Wprowadzono algorytm BFS (Breadth-First Search) w `useDuctStore.ts`, który automatycznie synchronizuje `systemId` w całej połączonej sieci. Zmiana systemu w jednym węźle lub odcinku natychmiast aktualizuje całą instalację, eliminując błędy niespójności systemowej.
- **Unifikacja przy Połączeniu**: Dodanie krawędzi łączącej dwie osobne sieci wymusza ujednolicenie ich systemów, zgodnie z wymogiem "jeden połączony system = jeden typ instalacji".
- **Wstawianie Węzłów (Edge Splitting)**: Implementacja narzędzia pozwalającego na kliknięcie w dowolny punkt istniejącego przewodu w trybie `DRAW_DUCT`. System automatycznie dzieli odcinek na dwa, wstawia nowy węzeł typu `BRANCH` i pozwala na natychmiastowe kontynuowanie rysowania odgałęzienia.
- **Ulepszony Inspektor**: `DuctPropertiesPanel.tsx` wyświetla teraz wybór systemu również dla węzłów, a wizualizacja węzłów poprawnie odzwierciedla kolor sieci dzięki bezwarunkowemu dziedziczeniu kolorów systemowych.
- **Pliki**: `src/stores/useDuctStore.ts`, `src/components/Workspace2D.tsx`, `src/components/DuctPropertiesPanel.tsx`.

### Iteracja 3.2.5: Stabilizacja Undo/Redo i Integracja Topologii - 2026-03-20
- **Inteligentne Undo/Redo (Stage-aware)**: Naprawiono błąd, w którym `Ctrl+Z` zawsze cofał tylko strefy (Krok 2). Zaimplementowano dynamiczne przełączanie magazynu historii:
    - W Krokach 1, 2, 7 -> Historia `useZoneStore` (architektura).
    - W Kroku 3 -> Historia `useDuctStore` (instalacje).
    - Zaktualizowano `App.tsx` (skróty klawiszowe) oraz `TopBar.tsx` (przyciski UI).
- **Zabezpieczenie przed Crashem (Defensive Rendering)**: Rozwiązano problem "Białego Ekranu" po cofnięciu do pustego stanu. Wprowadzono bezpieczne mapowanie `nodes || {}` oraz `edges || {}` w komponentach i procesie serializacji stanu (partialize).
- **Zaawansowane Łączenie z Krawędzią (Snap-to-Edge)**:
    - Wdrożono funkcję rzutu punktu na odcinek (`getClosestPointOnSegment`).
    - **Rysowanie**: Możliwość rozpoczęcia i zakończenia przewodu w dowolnym miejscu istniejącej rury (automatyczne wstawienie węzła `BRANCH`).
    - **Przeciąganie (Drag & Drop)**: Przeciągnięcie węzła i upuszczenie go na inny odcinek powoduje jego bezpieczne rozcięcie i scalenie sieci topologicznej.
- **Cleanup**: Usunięto nieużywane zmienne i zsynchronizowano brakujące importy dla zachowania czystości budowania.
- **Pliki**: `src/App.tsx`, `src/components/TopBar.tsx`, `src/stores/useDuctStore.ts`, `src/components/Workspace2D.tsx`, `src/lib/geometryUtils.ts`.

### Iteracja 3.2.6: Naprawa Błędu Regresyjnego 'ReferenceError' - 2026-03-20
- **Przyczyna: Niezdefiniowana Zmienna**: Zidentyfikowano krytyczny błąd w `Workspace2D.tsx` (linia 1454), gdzie odwołanie do `shouldUseSystemStyle` rzucało wyjątek `ReferenceError`, uniemożliwiając renderowanie całej aplikacji (biały ekran po wejściu w projekt).
- **Naprawa**: Zgodnie z decyzją o „Wymuszeniu Kolorów Systemowych” z Iteracji 3.2.3, usunięto zbędny i niezdefiniowany warunek. Renderowanie wzorów (patterns) stref od teraz odbywa się bezwarunkowo, gdy tylko strefa posiada przypisany system.
- **Weryfikacja**: Potwierdzono poprawne ładowanie rzutu 2D oraz Dashboardu bez błędów w konsoli.
- **Pliki**: `src/components/Workspace2D.tsx`.

### Iteracja 3.2.7: Akcje Atomowe i Eliminacja 'Ghost Nodes' - 2026-03-20
- **Problem 'Pustych Węzłów' (Ghost Nodes)**: Podczas przeciągania węzła na inny kanał (`Drag & Drop`), sekwencyjne aktualizacje stanu powodowały, że stary węzeł pozostawał widoczny pod kursorem („duch”), zanim React/Konva zdążyli go odmontować.
- **Akcja Atomowa `mergeNodeToEdge`**: 
    - Skonsolidowano rozbicie krawędzi (`splitEdge`), przepięcie podłączonych rur (`re-routing`) oraz usunięcie starego węzła w jedną operację `set()` w magazynie `useDuctStore.ts`.
    - Gwarantuje to spójność topologiczną i wizualną grafu w jednym cyklu renderowania.
- **Uproszczenie Logiki CAD**: Przeniesiono odpowiedzialność za manipulację grafem z komponentu `Workspace2D.tsx` do warstwy Store, co zwiększa stabilność i łatwość testowania silnika trasowania.
- **Cleanup Linter'a**: Usunięto nieużywane parametry w funkcjach pomocniczych magazynu (`getConnectedNetwork`).
- **Pliki**: `src/stores/useDuctStore.ts`, `src/components/Workspace2D.tsx`.

### Iteracja 3.2.8: Inteligentne Mergowanie Węzłów (Node-to-Node Snap) - 2026-03-20
- **Problem**: Przeciąganie końca jednego kanału na koniec innego skutkowało utworzeniem odgałęzienia (`BRANCH`) zamiast prostego połączenia (kolana/łącznika). Działo się tak, bo system priorytetyzował snapping do krawędzi (split edge) nad snappingiem do punktów końcowych.
- **Akcja Atomowa `mergeNodes`**:
    - Wprowadzono w `useDuctStore.ts` akcję, która bezpiecznie przepina wszystkie krawędzie z węzła źródłowego do docelowego i usuwa ten pierwszy.
    - Automatycznie usuwa pętle (krawędzie o zerowej długości), jeśli takowe powstałyby podczas łączenia.
- **Hierarchia Snappingu**: Zmodyfikowano `Workspace2D.tsx`, aby w pierwszej kolejności sprawdzał bliskość innych węzłów. Dopiero gdy w promieniu 15px nie ma żadnego węzła, system szuka krawędzi do rozcięcia.
- **Weryfikacja**: Potwierdzono poprawne tworzenie kolan i usuwanie nadmiarowych węzłów przy łączeniu końcówek instalacji.
- **Pliki**: `src/stores/useDuctStore.ts`, `src/components/Workspace2D.tsx`.

### Iteracja 3.2.9: Tryb Orto dla Przeciągania Węzłów (Shift Drag) - 2026-03-20
- **Funkcjonalność**: Wprowadzono ograniczenie ruchu węzłów do osi X lub Y podczas trzymania klawisza `Shift`. Pozwala to na precyzyjne wyrównywanie elementów instalacji względem siebie.
- **Implementacja**:
    - Dodano `dragStartNodePos` ref w `Workspace2D.tsx`, przechowujący pozycję startową węzła (`onDragStart`).
    - Zmodyfikowano `onDragMove`, aby obliczać dominującą oś ruchu i blokować drugą współrzędną w czasie rzeczywistym.
- **Weryfikacja**: Implementacja zgodna ze standardem Konva/React. (Uwaga: Automatyczna weryfikacja ograniczona przez narzędzia przeglądarkowe — zalecany test manualny).
- **Pliki**: `src/components/Workspace2D.tsx`.

### Iteracja 3.3: Usprawnienia UI i Identyfikacja Systemów - 2026-03-20
- **Wyświetlanie ID Systemu**: Zaktualizowano listę wyboru systemów w narzędziu rysowania oraz w panelu właściwości (`DuctPropertiesPanel.tsx`). Od teraz systemy są prezentowane w formacie `[ID]: [Nazwa]`, co ułatwia inżynierowi szybką identyfikację techniczną.
- **Cleanup Kodu**: Usunięto nieużywane importy i zmienne w `DuctPropertiesPanel.tsx` (m.in. `canvasFloor`, `useCanvasStore`), poprawiając czytelność i wydajność komponentu.
- **Pliki**: `src/components/Workspace2D.tsx`, `src/components/DuctPropertiesPanel.tsx`.

### Iteracja 3.3.1: Przesuwanie Całych Odcinków Kanałów (Segment Drag) - 2026-03-20
- **Funkcjonalność**: Umożliwiono przesuwanie całych segmentów instalacji (linii między węzłami) za pomocą myszy. Przeciągnięcie odcinka przesuwa oba jego węzły o ten sam wektor, zachowując geometrię i połączenia z pozostałymi elementami sieci.
- **Implementacja**:
    - Dodano `dragStartEdgeNodes` ref w `Workspace2D.tsx`.
    - Zmodyfikowano `Group` renderujący krawędź, czyniąc go `draggable`.
    - W `onDragMove` obliczany jest delta ruchu, aktualizowane są pozycje węzłów w storze, a następnie przeliczane długości wszystkich sąsiednich odcinków.
    - Pozycja grupy jest resetowana do `(0,0)` po każdym kroku ruchu, aby uniknąć podwójnego przesunięcia (tzw. "double-transform bug").
- **Weryfikacja**: Potwierdzono w przeglądarce — segmenty przesuwają się płynnie wraz z węzłami.
- **Pliki**: `src/components/Workspace2D.tsx`.

### FAZA 3.3: Wprowadzenie Klas Urządzeń i Elementów Pośrednich - 2026-03-20
- **Rozbudowa Modelu Danych (`types.ts`)**:
    - Dodano `ComponentCategory`: EQUIPMENT, TERMINAL, INLINE, JUNCTION, SHAFT, VIRTUAL_ROOT
    - Dodano `ComponentType`: AHU, FAN, HEAT_RECOVERY, ANEMOSTAT, GRILLE, DIFFUSER, LOUVRE, DAMPER, FIRE_DAMPER, SILENCER, HEATER, COOLER, TEE, CROSS, WYE, SHAFT_UP, SHAFT_DOWN, VIRTUAL_ROOT
    - Rozszerzono `DuctNode` o: componentCategory, componentType, flowFraction, rotation, isLocked, ratedFlow, ratedPressure, heatRecoveryType, efficiency, width, height
    - Zachowano backward compatibility z istniejącymi danymi (migracja v1→v2)

- **Rozbudowa Store (`useDuctStore.ts`)**:
    - Nowe akcje: `insertInlineComponent`, `calculateEdgeAngle`, `getTerminalsInZone`, `getNodesOnFloor`
    - Funkcja `createDuctNode` do bezpiecznego tworzenia węzłów z wszystkimi wymaganymi polami
    - Migracja starych węzłów przy ładowaniu (version 2)
    - Helper `getConnectedNetwork` (BFS) do propagacji systemId

- **Rozbudowa Canvas Store (`useCanvasStore.ts`)**:
    - Dodano `DuctComponentTool` type i `activeDuctTool`, `activeDuctCategory` state
    - Funkcja `getCategoryForTool` mapująca narzędzia na kategorie

- **Toolbar HVAC (`Workspace2D.tsx`)**:
    - Rozszerzono toolbar Etapu 3 o dropdown "Elementy" z kategoriami:
        - Urządzenia: AHU, Wentylator
        - Terminale: Anemostat, Kratka, Dysza
        - Armatura: Przepustnica, Klapa PPOŻ, Tłumik
        - Piony: Pion ↑, Pion ↓, Wirtualny korzeń
    - Przyciski z ikonami lucide-react

- **Wizualizacja Canvas (`Workspace2D.tsx`)**:
    - Rozszerzono renderer węzłów o różne kształty:
        - EQUIPMENT (AHU/FAN): RoundedRect z etykietą
        - TERMINAL: Circle z X (anemostat)
        - INLINE: Rect poprzeczny z rotacją
        - SHAFT: Square z strzałką ↑/↓
        - VIRTUAL_ROOT: Triangle otwarty
        - JUNCTION: Circle (domyślny)

- **Panel Właściwości (`DuctPropertiesPanel.tsx`)**:
    - Dynamiczne sekcje według ComponentCategory:
        - EQUIPMENT: ratedFlow, ratedPressure
        - TERMINAL: zoneId, flowFraction, auto-calculation z bilansu
        - INLINE: width, height
        - SHAFT: kierunek (↑/↓)
        - VIRTUAL_ROOT: info o sumowaniu
    - Placeholder akustyczny (Lw = 0)
    - Kolorowe badge kategorii

- **Logika Wstawiania (`Workspace2D.tsx`)**:
    - Obsługa onClick na Stage dla aktywnych narzędzi HVAC
    - Tworzenie węzła z odpowiednim componentCategory/componentType
    - Auto-przypisanie systemu z kontekstu

- **Pliki**: `src/types.ts`, `src/stores/useDuctStore.ts`, `src/stores/useCanvasStore.ts`, `src/components/Workspace2D.tsx`, `src/components/DuctPropertiesPanel.tsx`

### FAZA 3.3.3: Edycja Kondygnacji (Floor Settings Modal) - 2026-03-20
- **FloorSettingsModal** (`src/components/FloorSettingsModal.tsx`):
    - Modal do edycji właściwości kondygnacji
    - Pola: nazwa, rządna (m n.p.m.), opis punktu 0,0
    - Przyciski przesuwania w hierarchii (↑/↓)
    - Statystyki: liczba pomieszczeń i elementów instalacji
    - Przycisk usuwania z ostrzeżeniem i listą elementów do usunięcia
- **FloorManagerBar** (`src/components/FloorManagerBar.tsx`):
    - Dodano ikony edycji (⚙️) przy każdej zakładce kondygnacji
    - Hover na zakładce pokazuje ikony edycji/usuwania
    - Trigger modal FloorSettingsModal po kliknięciu ikony
- **Pliki**: `src/components/FloorSettingsModal.tsx`, `src/components/FloorManagerBar.tsx`

### FAZA 3.3.4: Auto-tworzenie węzłów SHAFT na wielu kondygnacjach - 2026-03-21
- **Nowe akcje w useDuctStore.ts**:
    - `createShaftNodeOnFloor(sourceNode, targetFloorId, shaftId)` - tworzy węzeł SHAFT na jednej kondygnacji
    - `createVerticalEdge(sourceNodeId, targetNodeId, systemId, ahuId)` - tworzy krawędź pionową między węzłami
    - `syncShaftProperties(sourceNodeId, updates)` - synchronizuje właściwości (shaftId, shaftRange, systemId) między węzłami
    - `resetPositionSync(sourceNodeId)` - resetuje flagi `isPositionManuallySet` i synchronizuje pozycje
    - `removeOrphanedShaftNodes(shaftId, nodeIds)` - usuwa osierocone węzły i krawędzie pionowe
    - `reassignShaftNodes(nodeIds, targetShaftId)` - przenosi węzły do innego/nowego pionu
- **syncShaftToAllFloorsInRange (DuctPropertiesPanel.tsx)**:
    - Funkcja pomocnicza z dostępem do useZoneStore
    - Pobiera wszystkie kondygnacje posortowane po elevation
    - Tworzy węzły SHAFT na każdej kondygnacji w zakresie [from, to]
    - Tworzy krawędzie pionowe między sąsiednimi węzłami
- **OrphanedShaftModal** (`src/components/OrphanedShaftModal.tsx`):
    - Modal z opcjami zarządzania osieroconymi węzłami SHAFT
     - Opcje: USUŃ, POZOSTAW, UTWÓRZ NOWY PION, PRZENIEŚ DO...

### FAZA 3.4: Algorytm Propagacji Przepływów DFS - 2026-03-21
- **Cel**: Algorytm DFS sumujący wydatki powietrza [m³/h] od terminali aż do korzeni (AHU, FAN, VIRTUAL_ROOT)

- **Model Danych (`types.ts`)**:
    - Dodano `flowRate?: number` do `DuctSegment` (wyliczony wydatek przepływający przez rurę)
    - Węzły mają pole `flow` (skumulowany wydatek)

- **Silnik NetworkEngine (`src/lib/networkEngine.ts`)**:
    - Funkcja `calculateNetworkFlows(nodes, edges)` zwraca zaktualizowane węzły i krawędzie
    - Budowa mapy sąsiedztwa (AdjacencyMap)
    - Identyfikacja korzeni: EQUIPMENT, VIRTUAL_ROOT
    - Rekurencja DFS: TERMINAL zwraca `node.flow`, pozostałe sumują `branchFlow` z dzieci
    - Helper: `getNetworkRoots()`, `getTerminals()`

- **Integracja z useDuctStore**:
    - Akcja `recalculateFlows()` wywołuje NetworkEngine
    - Automatyczne wyzwalanie po: `addNode`, `removeNode`, `addEdge`, `removeEdge`, `updateNode`, `updateEdge`, `splitEdge`, `mergeNodeToEdge`, `mergeNodes`, `insertInlineComponent`
    - `updateNode` i `updateEdge` wywołują recalculateFlows przy każdej zmianie

- **Synchronizacja ze strefami (`useZoneStore.ts`)**:
    - Funkcja `syncTerminalsFromZones()` - dynamiczny import useDuctStore
    - Przy zmianie strefy (calculatedVolume, calculatedExhaust) terminale są automatycznie aktualizowane
    - Wywoływana po: `addZone`, `updateZone`, `removeZone`, `bulkUpdateZones`, `bulkDeleteZones`, `recalculateAirBalance`

- **Wizualizacja Canvas (`Workspace2D.tsx`)**:
    - Etykiety przepływu na środku każdej krawędzi z `flowRate > 0`
    - Tło etykiety: białe z ramką w kolorze systemu
    - Format: `XXX m³/h`
    - Rotacja zgodna z kątem kanału

- **Panel Właściwości (`DuctPropertiesPanel.tsx`)**:
    - Sekcja "Przepływ (DFS)" dla węzłów EQUIPMENT i VIRTUAL_ROOT
    - Sekcja "Przepływ (DFS)" dla krawędzi (edge.flowRate)
    - Wyświetla skumulowany/sumaryczny wydatek

- **Pliki**: `src/types.ts`, `src/lib/networkEngine.ts`, `src/stores/useDuctStore.ts`, `src/stores/useZoneStore.ts`, `src/components/Workspace2D.tsx`, `src/components/DuctPropertiesPanel.tsx`

### FAZA 3.4.1: Przegląd i Optymalizacja Algorytmu DFS (Flow Propagation) - 2026-03-21
- **Cel**: Wykonanie audytu implementacji Kroku 3.4 pod kątem stabilności, wydajności i odporności na błędne rysunki użytkownika.
- **Wykryte Słabości (Weaknesses)**:
    1. **Stale Node Flows (Błąd odłączonych gałęzi)**: Algorytm pozostawiał stare wartości `flow` na węzłach (np. `JUNCTION`, `INLINE`), które zostały fizycznie odcięte od źródła (`EQUIPMENT`). System zerował przepływ tylko w rurach, zapominając o samych węzłach.
    2. **Zagrożenie Cyklami (Pętle)**: Ochrona przed cyklami opierała się na krawędziach i wycofywała flagę po przejściu ścieżki (`visitedEdges.delete`). W przypadku narysowania pętli kanałów przez użytkownika, mogło to doprowadzić do wykładniczej liczby przejść lub wyczerpania stosu (Stack Overflow).
- **Naprawa i Optymalizacja**:
    - W `src/lib/networkEngine.ts` wdrożono **Defensive Initialization**: przed puszczeniem rekurencji każdy węzeł niebędący terminalem (`!== 'TERMINAL'`) jest twardo resetowany do `flow: 0`.
    - Zastąpiono tablicę odwiedzonych krawędzi stałą tablicą odwiedzonych węzłów (`visitedNodes`), która chroni dany obchód DFS przed wejściem w nieskończoną pętlę w przypadku nielogicznych, cyklicznych połączeń na rzucie CAD.
- **Weryfikacja**: Usunięcie rury odcinające pokój od centrali natychmiastowo wygasza wartości `m³/h` na wszystkich krawędziach i węzłach pośrednich. System jest kuloodporny na pętle grafowe.
- **Pliki**: `src/lib/networkEngine.ts`

### FAZA 3.4.2: Naprawa Renderowania Konva (Crash "Text components are not supported") - 2026-03-21
- **Problem**: Zidentyfikowano krytyczny błąd powodujący zniknięcie płótna ("White Screen") po narysowaniu drugiego odcinka rury lub przeliczeniu przepływu.
- **Przyczyna**: Błędna logika warunkowa w JSX: `{edge.flowRate && edge.flowRate > 0 && (...)}`. Jeśli `flowRate` wynosiło `0`, React-Konva otrzymywał surową cyfrę `0` zamiast wartości logicznej, co powodowało próbę wyrenderowania natywnego tekstu DOM wewnątrz Canvasa (operacja niedozwolona).
- **Naprawa**: Wprowadzono bezpieczny wzorzec renderowania z jawnym zwracaniem `null` dla wartości zerowych: `{(condition) ? (<Group>...</Group>) : null}`.
- **Zasięg**: Poprawiono etykiety przepływu (`flowRate`) we wszystkich rzędach rur w `Workspace2D.tsx`.
- **Pliki**: `src/components/Workspace2D.tsx`.
    - Wyświetla listę osieroconych kondygnacji
    - Opcja "Rozszerz zakres docelowego pionu"
- **DuctPropertiesPanel.tsx**:
    - Dodano przycisk "Zarządzaj osieroconymi" w sekcji SHAFT (widoczny gdy są osierocone węzły)
    - Dodano przycisk "Włącz synchronizację pozycji" (widoczny gdy `isPositionManuallySet = true`)
    - Zmiana shaftId lub zakresu wywołuje `syncShaftProperties` i `syncShaftToAllFloorsInRange`
- **Workspace2D.tsx**:
    - Dodano ustawianie `isPositionManuallySet = true` przy przeciąganiu węzłów SHAFT
    - Poprawiona kolejność warstw: contentLayer (podkład) → uiLayer (siatka, punkt 0,0) → uiOverlayLayer
- **Synchronizacja pozycji SHAFT**:
    - Pole `isPositionManuallySet` w `DuctNode` - chroni pozycję przed automatyczną synchronizacją
    - Gdy użytkownik przeciągnie węzeł SHAFT, flaga ustawia się na `true`
    - Przycisk "Włącz synchronizację pozycji" resetuje flagę i synchronizuje pozycje
- **Pliki**: `src/types.ts`, `src/stores/useDuctStore.ts`, `src/components/OrphanedShaftModal.tsx`, `src/components/DuctPropertiesPanel.tsx`, `src/components/Workspace2D.tsx`

### FAZA 3.3.2: Naprawki Bugów i Ulepszenia UI - 2026-03-20
- **Stały Rozmiar Elementów (Element Sizing)**:
    - Zmieniono `nodeSize = 6 / scale` na stałą `nodeSize = 8` (piksele canvas, nie skaluje się z zoomem)
    - Stały `strokeWidth = 1.5-2.5` zamiast skalonowego
    - Jawny stały wymiar EQUIPMENT (50x30px), SHAFT (20x20px), INLINE (20x12px)
- **Stały Próg Snapowania**:
    - Zmieniono `snapThreshold = 15 / scale` na stałą `SNAP_THRESHOLD_PX = 15` pikseli
    - Naprawiono błąd: zmienna `snapThreshold` była niezdefiniowana w zasięgu `dragEnd` (linie ~2044)
- **Wstawianie Elementów INLINE na Krawędziach**:
    - Dodano stałą `INLINE_TOOLS` w `Workspace2D.tsx`
    - Zmodyfikowano `onClick` handler dla krawędzi, aby obsługiwał wstawianie elementów INLINE
    - Po kliknięciu na krawędź z aktywnym narzędziem INLINE (DAMPER, FIRE_DAMPER, SILENCER, HEATER, COOLER, FILTER_BOX), system wywołuje `insertInlineComponent()` i automatycznie wyłącza narzędzie
- **Dodano SHAFT_THROUGH do Toolbar'a**:
    - Dodano przycisk "Pion ↕" (Przelotowy) obok SHAFT_UP i SHAFT_DOWN
    - Zaktualizowano `COMPONENT_LABELS` w `DuctPropertiesPanel.tsx`
- **Edycja Wymiarów w Inspektorze**:
    - EQUIPMENT: Dodano pola `widthCm`, `heightCm`, `lengthCm` (w cm)
    - TERMINAL: Dodano pola `terminalWidthCm`, `terminalHeightCm`, `terminalDiameterCm` (w cm)
    - INLINE: Już miał `width` i `height` w mm
- **Właściwości Pionu (SHAFT) w Inspektorze**:
    - `shaftId`: Pole tekstowe z przyciskiem "Auto" generującym P1, P2, P3...
    - `shaftRange`: Select'y "Od Kondygnacji" / "Do Kondygnacji" dla określenia zakresu
    - `shaftShiftX`, `shaftShiftY`: Przesunięcie na innych kondygnacjach (px)
- **Pliki**: `src/components/Workspace2D.tsx`, `src/components/DuctPropertiesPanel.tsx`

### Faza 3.3: Testy i Poprawki Urządzeń HVAC oraz Pionów
- **Data**: 2026-03-21
- **Znalezione błędy**:
    - **React Hook Order Error**: Błąd w `DuctPropertiesPanel.tsx` powodujący biały ekran przy wyborze urządzenia. Przyczyną był wczesny powrót (`return null`) przed wszystkimi hookami. Naprawiono przez przesunięcie deklaracji hooków na górę.
    - **Błąd Centrowania Elementów**: Elementy (AHU, FAN) były wstawiane lewym górnym rogiem w punkcie kliknięcia. Naprawiono przez dodanie `x` i `y` do `Group` w `Workspace2D.tsx`.
- **Zweryfikowane Funkcjonalności**:
    - **Urządzenia i Terminale**: AHU, FAN, ANEMOSTAT działają poprawnie, edycja parametrów (wydajność, ciśnienie, wymiary) jest trwała.
    - **Piony (Shafts)**: Automatyczna propagacja na piętra i modal "Orphaned Shaft" działają bez zarzutu.
    - **Kondygnacje**: Zarządzanie piętrami (dodawanie, rzędne) działa poprawnie.
- **Pliki**: `src/components/DuctPropertiesPanel.tsx`, `src/components/Workspace2D.tsx`

### Iteracja 3.3.5: Stabilizacja Builda i Poprawki Lintera - 2026-03-21
- **Naprawa Błędów Kompilacji (`tsc -b`)**:
    - **AirBalanceTable.tsx**: Przywrócono brakującą akcję `setIsSystemColoringEnabled`, której brak uniemożliwiał zbudowanie projektu (błąd TS2552).
    - **Workspace2D.tsx**: Usunięto nieużywane komponenty `Label` i `Tag` z `react-konva`.
    - **importProjectService.ts**: Usunięto nieużywane typy `Project` i `SystemDef`.
- **Poprawki Lintera (`eslint`)**:
    - **useDuctStore.ts**: Naprawiono błąd `prefer-const` dla zmiennej `componentCategory`.
- **Weryfikacja**: Pomyślnie wykonano pełny build produkcyjny (`npm run build`). System jest gotowy do dalszego rozwoju algorytmów przepływowych.
- **Pliki**: `src/components/AirBalanceTable.tsx`, `src/components/Workspace2D.tsx`, `src/lib/importProjectService.ts`, `src/stores/useDuctStore.ts`.

### Iteration 3.3.8: Pływający Przełącznik Kondygnacji (Draggable Floor Switcher) - 2026-03-21
- **Problem**: Stała pozycja przełącznika kondygnacji w lewym górnym rogu zasłaniała inne elementy (np. Inspektor, Tabele) i nie pozwalała na dostosowanie widoku. Dodatkowo w widokach dzielonych (Split View) występował błąd dryfu współrzędnych przy przeciąganiu.
- **Rozwiązanie**: 
    - **Draggable UI**: Wdrożono mechanizm ręcznego przesuwania przełącznika w `Workspace2D.tsx`. Dodano ikonę „uchwytu” (`GripVertical`), pozwalającą na dowolne rozmieszczenie panelu na kanwie.
    - **Visibility Toggle**: Dodano ikonę Mapy (🗺️) w TopBarze, umożliwiającą całkowcie ukrycie/pokazanie przełącznika.
    - **Persystencja Widoku**: Stan widoczności i ostatnia pozycja są zapisywane w `useUIStore.ts`, co gwarantuje ciągłość pracy po przełączaniu etapów budowy.
    - **Fix (Coordinate Drift)**: Naprawiono błąd przemieszczania się okna w widokach dzielonych poprzez przeliczenie współrzędnych przeciągania relatywnie do kontenera obszaru roboczego (`containerRef.current.getBoundingClientRect()`), co zapewnia stabilność pozycji przy zmianie trybów widoku (Split vs Full).
- **Pliki**: `src/stores/useUIStore.ts`, `src/components/TopBar.tsx`, `src/components/Workspace2D.tsx`.

### Iteracja 3.3.6: Naprawa Logiki Tworzenia i Synchronizacji Pionów (SHAFT) - 2026-03-21
- **Problem 1 (Tworzenie krawędzi pionowych)**: Węzły SHAFT tworzone na sąsiednich kondygnacjach nie miały wyrysowanych niewidzialnych krawędzi pionowych z powodu użycia starego stanu `nodes` w `syncShaftToAllFloorsInRange` jako zamknięcia ujęcia.
- **Naprawa 1**: Funkcja została przepisana, aby zawsze pobierać najnowszy stan `nodes` z `useDuctStore.getState()`. Umożliwia to zlokalizowanie nowo wykreowanych węzłów.
- **Problem 2 (Brakująca synchronizacja ID)**: Wybranie kondygnacji docelowych, a potem wpisanie ID nie powodowało wygenerowania pionu. Tworzenie zachodziło tylko przy zmianach w polach zakresu (Floor).
- **Naprawa 2**: Zmodyfikowano `onChange` oraz kliknięcie przycisku "Auto" (generowania ID), dodając bezpośrednie wywoływanie `syncShaftToAllFloorsInRange`.
- **Problem 3 (Relatywny offset Pionów)**: Zmiana parametrów "Przes. X [px]" i "Y" edytowała właściwości, ale nie przesuwała automatycznie podłączonych (nie-zmanualizowanych) pionów na innych kondygnacjach w czasie rzeczywistym.
- **Naprawa 3**: Przebudowano `syncShaftProperties` w `useDuctStore.ts`. Teraz detekcja zmian offesetu dynamicznie aplikuje kalkulację `source.x + currentShiftX` na docelowe węzły, zapewniając podgląd na żywo podczas edycji z poziomu Inspektora.
- **Problem 4 (Resetowanie Przesunięcia)**: Przycisk "Włącz synchronizację pozycji" działał błędnie, modyfikując węzły tylko i wyłącznie wtedy kiedy ICH pozycja nie była manualna, a celem przycisku z założenia jest NADPISANIE staniu zmanualizowanego na domyślny scentrowany układ.
- **Naprawa 4**: Uodporniono funkcję `resetPositionSync` poleceniem bezwarunkowego przeniesienia wszystkich członkowskich węzłów na wspólną pozycję osi XY wektora głównego z wyzerowaniem flagi uciętej `isPositionManuallySet`.
- **Pliki**: `src/components/DuctPropertiesPanel.tsx`, `src/stores/useDuctStore.ts`.

### Iteracja 3.3.7: Implementacja Portów Przyłączeniowych i Mocy dla AHU/FAN - 2026-03-21
- **Problem 1 (Brak Portów Przyłączeniowych)**: Krawędzie nawiewne rysowane od i do elementów EQUIPMENT (AHU, FAN) celowały wyłącznie w środek węzła, ignorując jego fizyczne wymiary. Zlewało się to psując wizualny aspekt projektu.
- **Naprawa 1**: Zaaplikowano funkcję `getEdgeConnectionPoint` do logiki rysowania przewodów (zarówno krawędzi stałych, jak i "ciągniętej" podczas edycji). Punkty są teraz rzutowane na najbliższy środek boku prostokątnego wymiaru centrali/wentylatora (TOP, BOTTOM, LEFT, RIGHT).
- **Problem 2 (Brak parametru Mocy Elektrycznej)**: Mimo definicji w specyfikacji `03.5-AHU_FAN-Urzadzenia_HVAC_Spec.md`, we właściwościach wizualnych i w modelach typów `types.ts` brakowało zmiennej definiującej moc (urządzenia elektrycznego).
- **Naprawa 2**: Zaktualizowano interfejs `DuctNode` o `powerConsumption?: number`. Ujawniono pole input "Pobór mocy [W]" z obsługą dla obu komponentów AHU i FAN w `DuctPropertiesPanel.tsx` pod kategorią "Parametry Urządzenia". Pomyślnie skompilowano.
- **Pliki**: `src/components/Workspace2D.tsx`, `src/components/DuctPropertiesPanel.tsx`, `src/types.ts`, `docs/03.5-AHU_FAN-Urzadzenia_HVAC_Spec.md`.

### Iteracyja 3.6.0: Naprawa Błędów Konsoli i Stabilizacja WATT - 2026-03-22
- **Problem 1 (ReferenceError)**: Aplikacja wywalała błąd `ReferenceError: selectedHorizontalBoundaryId is not defined` przy próbie renderowania wskaźników przegród poziomych (Dach/Podłoga) na kanwie 2D.
- **Naprawa 1**: Do komponentu `Workspace2D.tsx` dodano brakujące ujęcia ze store'a: `selectedHorizontalBoundaryId` i `setSelectedHorizontalBoundaryId`.
- **Problem 2 (Deprecacje AG Grid)**: Konsola była zaśmiecana ostrzeżeniami o przestarzałych właściwościach w `AirBalanceTable.tsx` (v32.2+).
- **Naprawa 2**: Zaktualizowano konfigurację `AgGridReact`. Usunięto przestarzałe klucze (`checkboxSelection`, `headerCheckboxSelection`) z `ColDef` i przeniesiono logikę zaznaczania do nowego obiektu `rowSelection` (z `enableClickSelection: false`).
- **Problem 3 (Linter i Spójność Typów)**: W `useZoneStore.ts` występowały błędy lintera (duplikaty metod jak `setPendingWindows`) oraz błąd typu `Floor` (brakujące pola wysokości wymagane przez interfejs).
- **Naprawa 3**: 
    - Usunięto duplikaty metod w store.
    - Zaktualizowano `createDefaultFloors`, aby uwzględniał pola `heightTotal`, `heightNet`, `heightSuspended`.
    - Zaktualizowano `ProjectStateData` o brakujące pole `wallTypeTemplates`.
- **Weryfikacja**: Brak błędów `ReferenceError` na kanwie. Konsola czysta od deprecacji AG Grid (pozostały tylko licencje).
- **Problem 4 (3D Misalignment)**: Przegrody poziome (dach/podłoga) były przesunięte/odbite względem ścian w widoku 3D.
- **Naprawa 4**: W `Building3DViewer.tsx` zanegowano współrzędną Y przy budowaniu kształtu slabów, co skorygowało mapowanie układu współrzędnych Canvas -> THREE.js.
- **Weryfikacja**: Potwierdzono poprawne osadzenie dachu na ścianach w widoku 3D.
- **Pliki**: `src/components/Workspace2D.tsx`, `src/components/AirBalanceTable.tsx`, `src/stores/useZoneStore.ts`, `src/types.ts`, `src/components/Building3DViewer.tsx`.

### Iteracja 3.6.1: Przywrócenie Parametrów Wentylacji i Kubatury - 2026-03-22
- **Przywrócenie Pól w Inspektorze**: Do panelu `ZonePropertiesPanel.tsx` (zakładka "Ogólne") dodano brakujące parametry niezbędne dla modułu Bilans:
    - **Metoda Obliczeń**: Tryb (Auto/Manual), Liczba osób, Normatyw [m³/h/os], Własna krotność [h-1].
    - **Termodynamika**: Temperatura i wilgotność w pomieszczeniu oraz nawiewu, Zyski ciepła [W].
    - **Akustyka**: Możliwość manualnego nadpisania limitu dB(A) z presetu.
- **Implementacja Kubatury (Volume)**:
    - Rozszerzono `ZoneData` o pola: `volume`, `manualVolume`, `geometryVolume`, `isVolumeManual`.
    - **Logika**: `volume` jest wyliczane w `resolveZonesState` jako `Area * Height` lub brane z `manualVolume` (zależnie od flagi `isVolumeManual`).
    - **UI**: Dodano sekcję "Kubatura" w Inspektorze z przełącznikiem trybu manualnego.
    - **Tabela**: W `AirBalanceTable.tsx` dodano kolumny "Manual Kub." oraz "Kubatura [m³]" dla masowej edycji i podglądu.
- **Synchronizacja**: Zaktualizowano `RoomWizardModal.tsx`, `Workspace2D.tsx` (import DXF) oraz `AirBalanceTable.tsx` (dodawanie wierszy), aby nowe pola były inicjalizowane domyślnie.
- **Pliki**: `src/types.ts`, `src/stores/useZoneStore.ts`, `src/components/ZonePropertiesPanel.tsx`, `src/components/AirBalanceTable.tsx`, `src/components/RoomWizardModal.tsx`, `src/components/Workspace2D.tsx`, `src/lib/PhysicsEngine.ts`.

### Iteracja 3.7.1 (Marzec 2026) - Poprawki Błędów i Skalowanie CAD
- **Cel**: Wyeliminowanie krytycznych błędów (crash, scaling) oraz poprawa UX narzędzia pomiarowego.
- **Zmiany**:
    - **CAD Scale Fix (Correction)**: Rozwiązano problem zniekształceń przy niejednolitym skalowaniu (skew). Zastosowano metodę **Ground-Truth Area** – pole powierzchni pobierane jest bezpośrednio z geometrii DXF, co gwarantuje 100% dokładności (np. zawsze 15m2) niezależnie od zniekształceń tła. Wyłączono automatyczną nadpisywanie skali rzutu, aby zachować spójność z istniejącą kalibracją użytkownika.
    - **Fix Shift**: Poprawiono pozycjonowanie topologii WATT poprzez synchronizację ze stałym `scaleFactor` projektu.
    - **Fix Crash**: Dodano null-checki w `LinkOutlineModal.tsx` dla `polygons`, zapobiegając zawieszeniu aplikacji przy łączeniu pomieszczeń.
    - **Measuring Tool**: Dodano dynamiczną etykietę odległości "live-preview" oraz powiadomienie toast z wynikiem końcowym w `Workspace2D.tsx`.
    - **CSV Import Expansion**: Rozbudowano modal mapowania CSV (`CsvMappingModal.tsx`) o opcjonalne pola termodynamiczne (Temp Lato/Zima, wilgotność, zyski/straty manualne).
    - **Smart Data Import**: Implementacja w `AirBalanceTable.tsx` automatycznie ustawia flagi `isManual` dla zaimportowanych zysków i strat, integrując dane z modułem WATT już na etapie wczytywania pliku.
    - **CSV Update Wizard**: Implementacja `ThermodynamicUpdateModal.tsx` – zaawansowanego kreatora do porównywania danych CSV z istniejącymi strefami. Obsługuje podświetlanie różnic, selektywną aktualizację oraz wybór zakresu (Kondygnacja / Budynek).
    - **Performance Optimization**: Dodano `bulkUpdateZonesDiff` do `useZoneStore.ts`, umożliwiając wydajną, seryjną aktualizację wielu stref z unikalnymi zestawami danych w jednej transakcji.
    - **IFC Export Enhancement**: Rozszerzono eksport do standardu IFC (`ifcExport.ts`) o pełny zestaw danych termodynamicznych. Zaktualizowano `Pset_SpaceThermalDesign` (standardowe właściwości temperatury i mocy) oraz dodano autorski zestaw `Pset_WATT_DesignParameters` (parametry nawiewu i zyski wilgoci).
- **Pliki**: `src/components/SyncAlignmentModal.tsx`, `src/components/AirBalanceTable.tsx`, `src/components/LinkOutlineModal.tsx`, `src/components/Workspace2D.tsx`, `src/stores/useZoneStore.ts`.

### Iteracja 3.7.0 (Marzec 2026) - Integracja Termodynamiki WATT
- **Cel**: Rozbudowa modułu WATT o zaawansowane parametry termodynamiczne i bilansowe.
- **Zmiany**:
    - Rozszerzono `ZoneData` i `CalculationMode` o parametry sezonowe (Lato/Zima) oraz zyski i straty mocy/wilgoci.
    - Zaimplementowano w `PhysicsEngine.ts` obliczenia strumienia powietrza na podstawie bilansu cieplnego (straty/zyski) i wilgotnościowego.
    - Przebudowano UI w `ZonePropertiesPanel.tsx`, wprowadzając dynamicznie### FAZA 2.14: Algorytm Dzielenia Ścian (Topologia) - [Topology.ts](file:///d:/GitHub/WENTCAD/src/lib/geometryUtils/topology.ts)
Wprowadzono robustowy algorytm oparty na przedziałach (intervals), który dzieli ściany na fragmenty `INTERIOR` i `UNRESOLVED` (zewnętrzne) zamiast polegać na jednym punkcie środkowym. Rozwiązuje to problem ścian przechodzących przez dziedzińce lub wiele stref.

### FAZA 2.15: Logika Drzwi w WATT (Rendering i UI)
- **3D Viewer**: Drzwi (`type: DOOR`) są teraz renderowane jako nieprzezroczyste bryły (brązowe), odróżniając się od błękitnych okien.
- **Topologia UI**: W tabeli przegród (`ZonePropertiesPanel`) wprowadzono czytelne etykiety `DRZW` / `OKNO` oraz kodowanie kolorystyczne (szmaragdowy dla drzwi, błękitny dla okien).
- **Style**: System poprawnie rozróżnia typy otworów przy przypisywaniu parametrów cieplnych (U-value).
s" z obsługą wielu jednostek (W, kW, g/s, kg/h) i trybów manualnych.
    - Zapewniono domyślne inicjalizowanie parametrów klimatycznych dla nowych pomieszczeń w `AirBalanceTable.tsx`.
- **Status**: Zakończone. Funkcjonalność gotowa do testów projektowych.

* **WATT REWIZJA 5 (Z-index Fix & OZC Enhancement) - 2026-03-24**:
    * **Global Modal Context**: Relokowano `WATTManagerModal` oraz `ProjectImportModal` do głównego komponentu `App.tsx`. Rozwiązało to problem nakładania się UI (np. Toolbar, Dashboard) na modale poprzez wyrwanie ich z ograniczonego stacking contextu paska górnego.
    * **State Management**: Zcentralizowano widoczność modali w `useUIStore.ts`, umożliwiając ich reaktywne sterowanie z dowolnego miejsca w aplikacji.
    * **Z-index Standardization**: Wymuszono `z-[1000]` dla `WATTManagerModal`, zapewniając jego priorytet nad wszystkimi elementami interfejsu.
    * **OZC Table Refactoring**: 
        * Dodano kolumnę "Grubość ścian" (`d [m]`) wyliczaną na podstawie geometrii.
        * Przywrócono brakujące nagłówki `W/L [m]`.
        * Ujednolicono strukturę tabeli do 10 kolumn dla wszystkich typów przegród (Exterior, Interior, Roof, Ground), zapobiegając przesunięciom danych.
    * **Topology & Scaling**:
        * **Vertical Sync**: Wprowadzono rekurencyjną aktualizację topologii pionowej (góra/dół) przy analizie stref, eliminując błędy nadmiarowych dachów/podłóg.
        * **CAD Scaling**: Usunięto 10-krotny błąd skalowania wymiarów stolarki (`windowWidth`) oraz poprawiono pozycjonowanie topologii względem kalibracji projektu.
        * **PDF Visibility**: Wymuszono flagę `isUnderlayVisible: true` po imporcie podkładu, poprawiając UX procesu synchronizacji.

### FAZA 2.13: Smart Sync Calibration Fixes & UX - 2026-03-25
- **Problem**: DXF outlines were not visible in the left panel of the "Smart Sync: Kalibracja" modal if their coordinates were far from (0,0) and initial scale was fixed.
- **Rozwiązanie**: 
    - **Auto-centering & Scaling**: Added `zoomToDxfExtents` function that calculates the bounding box of all DXF entities (including blocks) and automatically centers/scales the view on mount or data change.
    - **Improved Block Rendering**: Fixed `INSERT` entity scaling by correctly handling both `scale.x/y` and `xScale/yScale` properties from `dxf-parser`.
    - **UX**: Added a "DOPASUJ WIDOK" button to the DXF view toolbar for manual view reset.
- **Pliki**: `src/components/SyncAlignmentModal.tsx`.

### FAZA 2.14: Wall Splitting Algorithm (Topology) - 2026-03-25
- **Problem**: Walls partially touching another room and partially facing a patio or exterior were being incorrectly treated as 100% internal (based on midpoint).
- **Rozwiązanie**: 
    - Przebudowano `checkAdjacency` w `topology.ts` na model rzutowania odcinków (**Fragment Splitting**).
    - Ściany są teraz dzielone na fragmenty `INTERIOR` (ściśle stykające się) i `UNRESOLVED` (gapy).
    - Dzięki temu analiza obrysu budynku poprawnie klasyfikuje przerwy (np. przy patiach) jako `EXTERIOR`.
- **Pliki**: `src/lib/geometryUtils/topology.ts`.

### FAZA 2.15: Logika Drzwi w WATT (Import, Rendering i UI) - 2026-03-25
- **Import DXF**: Rozszerzono `dxfWattExtractor.ts` o detekcję drzwi na podstawie nazw warstw zawierających "DRZWI" lub "DOOR" (case-insensitive). Drzwi otrzymują domyślną wysokość progu `sillHeight: 0.0m`.
- **Typowanie**: Dodano pole `type` do `OpeningInstance`, co pozwala na zachowanie informacji o typie otworu z DXF nawet przed przypisaniem stylu.
- **3D Viewer**: Drzwi (`type: DOOR`) są renderowane jako nieprzezroczyste bryły (brązowe), odróżniając się od błękitnych okien. Dodano legendę.
- **Topologia UI**: W tabeli przegród (`ZonePropertiesPanel`) wprowadzono etykiety `DRZW` / `OKNO` oraz inteligentne tworzenie nowych stylów (automatyczna nazwa i U-value: 0.9 dla okien, 1.3 dla drzwi).
- **Pliki**: `src/lib/dxfWattExtractor.ts`, `src/lib/wattTypes.ts`, `src/components/Building3DViewer.tsx`, `src/components/ZonePropertiesPanel.tsx`.
