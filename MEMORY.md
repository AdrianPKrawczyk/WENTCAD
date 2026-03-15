# HVAC BIM PLATFORM - MEMORY.md

> **[CRITICAL DIRECTIVE]**
> This file is the Agent's persistent memory. Read this file BEFORE executing any task. Update it AFTER completing any task. Do not delete historical entries.

## CURRENT STATE: INITIATION
* **Active Step:** KROK 1 (Air Balance Data Foundation) - COMPLETED
* **Pending Task:** Waiting for user confirmation to begin Step 2.
* **Architecture Rules Validated:** State First, Strict TypeScript, TDD for Physics, No Math Hallucinations (use `HVAC_FORMULAS.md`).

## PROGRESS LOG
* [x] **KROK 0: App Shell & Data Persistence** - Done
* [x] **KROK 1: Air Balance & Thermodynamics** - Done
* [ ] **KROK 2: Architecture Underlays (PDF/DXF)** - Pending
* [ ] **KROK 3: UI & Konva.js Canvas Engine** - Pending
* [ ] **KROK 4: Aerodynamics & Fluid Dynamics (DAG)** - Pending
* [ ] **KROK 5: Auto-Sizer & Component Selection** - Pending
* [ ] **KROK 6: Acoustics Engine** - Pending
* [ ] **KROK 7: BOM & Export (Excel/TXT)** - Pending
* [ ] **KROK 8: DXF Export & Layer Manager** - Pending

## ARCHITECTURE DECISIONS (Single Source of Truth)
*(Agent must log key technical decisions, Zustand store names, and crucial file paths here during development)*

* **Frontend Stack:** React 18+, TypeScript, TailwindCSS, Konva.js
* **Physics Engine:** Refer strictly to `HVAC_FORMULAS.md`.
* **Database Schema (Iteration 0):** Decided to use `JSONB` to store the DAG structure (states from Zustand stores like `useDuctStore` or `useZoneStore`). Tables: `projects`, `zones`, `duct_network`. Enable RLS.
* **UI Layout (Iteration 0):** React + Tailwind CSS with a 3-pane layout (Sidebar = Project Tree/Properties, Header = Toolbar, Main = Konva Canvas). Supply ducts use `#0000ff`, Exhaust uses `#ff0000`.
* **Data Foundation (Iteration 1):** `types.ts` is the single source of truth for Air Balance properties. `PhysicsEngine.ts` handles math logic verified by `vitest`.
* **State Management (Iteration 1):** Created `useZoneStore.ts` and `useDuctStore.ts` utilizing Zustand. `calculateZoneAirBalance` triggered natively from `ZoneStore`.