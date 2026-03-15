# HVAC BIM PLATFORM - MEMORY.md

> **[CRITICAL DIRECTIVE]**
> This file is the Agent's persistent memory. Read this file BEFORE executing any task. Update it AFTER completing any task. Do not delete historical entries.

## CURRENT STATE: INITIATION
* **Active Step:** KROK 2 (Architecture Underlays PDF/DXF) - PENDING
* **Pending Task:** Start work on Step 2 (Konva Canvas).

## PROGRESS LOG
* [x] **KROK 0: App Shell & Data Persistence** - Done
* [x] **KROK 1: Air Balance Data Foundation & UI** - Done
* [x] **KROK 1.5: Advanced Data Model (Transfers, Systems, CSV)** - Done
* [x] **KROK 1.6: UX and Bug Fixes** - Done
* [x] **KROK 1.7: Inspector Panel (Zone Details) Full Completion** - Done
* [x] **KROK 1.8: HVAC Terminology (PL) & targetACH Override mechanism** - Done
* [x] **KROK 1.9: System Manager & Transfers UI, AG-grid unbinding** - Done
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
* **Database Schema (Iteration 0):** `JSONB` to store the DAG structure. Tables: `projects`, `zones`, `duct_network`. Enable RLS.
* **UI Layout (Iteration 0):** React + Tailwind CSS with a 3-pane layout. Supply `#0000ff`, Exhaust `#ff0000`.
* **Data Foundation (Iteration 1.5):** `types.ts` is the single source of truth. Includes `systemSupplyId`, `systemExhaustId`, and `transferIn/Out` mapping.
* **State Management (Iteration 1.5):** `useZoneStore.ts` explicitly synchronizes inter-room transfers (if A sends to B, B receives from A). 
* **Inspector Panel (Iteration 1.7):** `ZonePropertiesPanel.tsx` is completely synchronized with `useZoneStore` providing full CRUD on Geometry, Thermodynamics, Acoustics, and Air Balance calculation mode + targets.
* **Air Balance Logic (Iteration 1.8):** Enforced Polish terminology from `docs/08-hvac-terminology-pl.md`. The list of Room Types and their normative ACH applies automatically via `docs/06-krotnosci_wymian.md`. `PhysicsEngine` toggle logic uses `isTargetACHManual` to dictate ACH origin.
* **Transfers and Systems UI (Iteration 1.9):** Added declarative Transfer Out appending in Inspector, and a fully dynamic System Manager (`useZoneStore.systems`) dictating select options across the AG-Grid. AG-Grid Cell Renderer for delete button uses React Components directly to prevent event eating.