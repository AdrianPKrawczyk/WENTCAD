# HVAC BIM PLATFORM - MEMORY.md

> **[CRITICAL DIRECTIVE]**
> This file is the Agent's persistent memory. Read this file BEFORE executing any task. Update it AFTER completing any task. Do not delete historical entries.

## CURRENT STATE: INITIATION
* **Active Step:** KROK 2 (Architecture Underlays PDF/DXF) - PENDING
* **Pending Task:** Start work on Step 2 (Konva Canvas).

## PROGRESS LOG
* [x] **KROK 0: Multi-Project Management & Time Machine** - Done (Includes Silent Sync & Snapshots)
* [x] **KROK 1: Air Balance Data Foundation & UI** - Done
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
* **Project Management & Versioning (KROK 0):** Implemented `useProjectStore.ts` for multi-project CRUD and snapshot management. 
    * **Silent Sync**: Automatic debounced (3s) save of `{ zones, floors, systems }` envelope to Supabase. 
    * **Time Machine**: Snapshots stored in `project_versions` table. 
    * **Auth Requirement**: Uses Anonymous Sign-ins in Supabase (must be enabled in Dashboard: Auth -> Providers -> Email -> Allow anonymous sign-ins). 
    * **UI**: `ProjectDashboard.tsx` (Dark Mode start screen) and `VersionHistoryPanel.tsx` (Right slider).