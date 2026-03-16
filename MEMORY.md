# HVAC BIM PLATFORM - MEMORY.md

> **[CRITICAL DIRECTIVE]**
> This file is the Agent's persistent memory. Read this file BEFORE executing any task. Update it AFTER completing any task. Do not delete historical entries.

## CURRENT STATE: INITIATION
* **Active Step:** KROK 2 (Architecture Underlays PDF/DXF) - PENDING
* **Pending Task:** Start work on Step 2 (Konva Canvas).

## PROGRESS LOG
* [x] **KROK 0: Multi-Project Management & Time Machine** - Done (Includes Silent Sync & Snapshots)
* [x] **KROK 1: Air Balance Data Foundation & UI** - Done
* [x] **KROK 1.7: Zaawansowana analizy systemowa i scenariusze** - Done
* [x] **KROK 1.11: Floor Manager Module** - Done
* [x] **KROK 1.12: Multi-Room Selection & Bulk Editing** - Done
* [ ] **KROK 2: Architecture Underlays (PDF/DXF)** - Pending
* [ ] **KROK 3: UI & Konva.js Canvas Engine** - Pending
* [ ] **KROK 4: Aerodynamics & Fluid Dynamics (DAG)** - Pending
* [ ] **KROK 5: Auto-Sizer & Component Selection** - Pending
* [ ] **KROK 6: Acoustics Engine** - Pending
* [ ] **KROK 7: BOM & Export (Excel/TXT)** - Pending
* [ ] **KROK 8: DXF Export & Layer Manager** - Pending

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
- **Agregacja:** Nowy panel `AnalysisDashboard` wyliczający sumaryczne wydatki $\sum N, \sum W$ dla wybranych grup.
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

### Iteracja 2.1: AG Grid Immutability (One-Way Data Flow)
- **Zasada**: Aby `zundo` działało poprawnie, AG Grid nie może mutować `params.data`.
- **Rozwiązanie**: Użyto `valueSetter` zwracającego `false` w `defaultColDef` oraz dla specyficznych kolumn (np. `activityType`).
- **Przepływ**: Zmiana w gridzie -> `valueSetter` -> akcja Zustand -> nowa referencja `rowData` -> odświeżenie komórki przez `getRowId`.