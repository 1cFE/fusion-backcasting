# 1costingfe LCOE Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fusion-backcasting lookup-table UI with a real-time dashboard powered by 1costingfe's physics-based LCOE model, exposing all ~150 parameters organized by sensitivity and importance.

**Architecture:** The existing fusion-backcasting React+Vite+Tailwind+Zustand frontend is rewritten to call a FastAPI backend that wraps `costingfe.adapter.run_costing()`. All LCOE calculation happens server-side (Python/JAX). The frontend sends debounced parameter updates and renders results including LCOE breakdown, power table, cost accounts, and sensitivity tornado chart.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3 (with existing `fusion` color palette), Zustand 4, Recharts 2 (frontend); FastAPI, 1costingfe (Python/JAX) (backend).

---

## Parameter Organization

Parameters are organized into tiers by sensitivity (elasticity from JAX autodiff) and importance:

### Tier 1 — Primary Controls (always visible header bar)
| Parameter | 1costingfe field | Type |
|---|---|---|
| Confinement Concept | `concept` | Dropdown: 8 concepts |
| Fuel | `fuel` | Buttons: DT, DD, DHe3, PB11 |
| Net Electric Power | `net_electric_mw` | Slider: 100-2000 MW |
| FOAK/NOAK | `noak` | Toggle |
| Number of Modules | `n_mod` | Stepper: 1-10 |

### Tier 2 — High Sensitivity (always visible, left panel)
| Parameter | Field | Elasticity | Range | Default |
|---|---|---|---|---|
| Availability | `availability` | ~0.6 | 0.50-0.98 | 0.85 |
| Thermal Efficiency | `eta_th` | ~0.5 | 0.20-0.65 | 0.46 |
| Interest Rate | `interest_rate` | ~0.4 | 0.02-0.15 | 0.07 |
| Blanket Thickness | `blanket_t` | ~0.2 | 0.30-1.50 m | 0.80 |
| Heating Power (MFE) | `p_input` | ~0.15 | 10-200 MW | 50 |
| Heating Efficiency (MFE) | `eta_pin` | ~0.15 | 0.10-0.90 | 0.50 |
| Construction Time | `construction_time_yr` | ~0.08 | 3-12 yr | 6 |

### Tier 3 — Moderate Sensitivity (collapsible panel)
**Power Balance:**
- `eta_p` (0.3-0.95, def 0.5), `mn` (1.0-1.5, def 1.1), `f_sub` (0.01-0.10, def 0.03)
- `eta_de` (0.0-0.95, def 0.85), `f_dec` (0.0-1.0, def 0.0)

**Parasitic Power (MW):**
- `p_pump` (0.5-10), `p_trit` (0-30), `p_house` (1-15), `p_cryo` (0.1-5)
- `p_coils` (0.5-20, MFE), `p_cool` (5-50, MFE)

**IFE-specific:** `p_implosion`, `p_ignition`, `eta_pin1`, `eta_pin2`, `p_target`
**MIF-specific:** `p_driver`, `p_target`, `p_coils`

**Geometry:**
- `R0` (1-10 m), `plasma_t` (0.5-5 m), `elon` (1.0-3.5)
- `ht_shield_t` (0.05-0.50 m), `structure_t` (0.05-0.40 m), `vessel_t` (0.05-0.40 m)

**Financial:**
- `lifetime_yr` (20-60), `inflation_rate` (0.0-0.05)

### Tier 4 — Costing Constants (expandable accordion, grouped by CAS)
Curated subset of CostingConstants fields from `costing_constants.yaml`, organized by CAS account (the most impactful ones; remaining constants use defaults and are still overridable via the `cc_` prefix mechanism):
- CAS10: land, licensing, permits
- CAS22: unit costs (blanket, shield, structure, vessel, heating, power supplies, divertor, target factory, remote handling, installation, fuel handling)
- CAS21: building costs (19 types)
- CAS23-26: BOP costs per MW
- CAS27-29: special materials, digital twin, contingency
- CAS30-50: indirect, owner, supplementary
- CAS70: O&M costs, core lifetime
- CAS80: fuel costs, utilization

### Tier 5 — Cost Account Overrides (expandable accordion)
Direct M$ overrides for any CAS account (CAS10-CAS90, C220101-C220700).

---

## File Structure

```
fusion-backcasting/
├── backend/
│   ├── main.py                          (Modify: new API routes)
│   ├── routes/
│   │   └── costing.py                   (Create: /api/costing/* endpoints)
│   └── services/
│       └── costing_service.py           (Create: wraps run_costing + defaults)
├── frontend/
│   └── src/
│       ├── App.tsx                      (Modify: new layout)
│       ├── store/
│       │   └── index.ts                 (Rewrite: 1costingfe parameter state)
│       ├── hooks/
│       │   └── useDarkMode.ts           (Keep as-is)
│       ├── types/
│       │   └── costing.ts               (Create: TypeScript types)
│       ├── api/
│       │   └── costing.ts               (Create: API client)
│       ├── components/
│       │   ├── SliderInput.tsx           (Create: reusable slider from FinancialPanel)
│       │   ├── PrimaryControls.tsx       (Create: concept/fuel/power/noak)
│       │   ├── LCOEDisplay.tsx           (Rewrite: real LCOE from backend)
│       │   ├── HighSensitivityPanel.tsx  (Create: tier 2 params)
│       │   ├── EngineeringPanel.tsx      (Create: tier 3 params, collapsible)
│       │   ├── CostingConstantsPanel.tsx (Create: tier 4, accordion by CAS)
│       │   ├── CostOverridesPanel.tsx    (Create: tier 5, CAS overrides)
│       │   ├── PowerTable.tsx            (Create: power flow display)
│       │   ├── CostBreakdown.tsx         (Create: CAS account breakdown chart)
│       │   ├── SensitivityChart.tsx      (Create: tornado chart from sensitivity data)
│       │   └── FeasibilityIndicator.tsx  (Modify: use backend LCOE)
│       └── utils/
│           └── format.ts                (Create: number formatting helpers)
```

**Files to delete** (replaced by new components):
- `frontend/src/components/FuelTypeSelector.tsx`
- `frontend/src/components/ConfinementTypeSelector.tsx`
- `frontend/src/components/FinancialPanel.tsx`
- `frontend/src/components/SubsystemPanel.tsx`
- `frontend/src/components/SubsystemCard.tsx`
- `frontend/src/components/SolveForButtons.tsx`
- `frontend/src/components/CapitalBreakdownChart.tsx`
- `frontend/src/utils/calculations.ts`
- `backend/routes/lcoe.py`
- `backend/routes/solver.py`
- `backend/services/lcoe_calculator.py`
- `backend/services/constraint_solver.py`
- `backend/services/feasibility.py`
- `backend/models/fuel_type.py`
- `backend/models/subsystem.py`
- `backend/data/default_subsystems.json`

---

## Task 1: Backend — Costing Service

**Files:**
- Create: `backend/services/costing_service.py`

- [ ] **Step 1: Create costing service module**

This module wraps `costingfe.adapter.run_costing()` and provides:
- `get_defaults(concept, fuel)` — returns all default parameter values for a concept/fuel combo
- `calculate(params)` — runs full LCOE calculation and returns results + sensitivity

```python
"""Service layer wrapping 1costingfe for the dashboard API."""

from costingfe import CostModel, ConfinementConcept, Fuel
from costingfe.adapter import FusionTeaInput, run_costing
from costingfe.defaults import (
    CostingConstants,
    cc_float_fields,
    load_costing_constants,
    load_engineering_defaults,
)
from costingfe.types import CONCEPT_TO_FAMILY


def get_concept_family(concept: str) -> str:
    """Get the family prefix for a concept's YAML file."""
    cc = ConfinementConcept(concept)
    family = CONCEPT_TO_FAMILY[cc]
    return f"{family.value}_{concept}"


def get_defaults(concept: str, fuel: str) -> dict:
    """Return all default parameters for a concept/fuel combination.

    Returns a flat dict with:
    - customer params (availability, lifetime_yr, etc.)
    - engineering params (from concept YAML template)
    - costing constants (all CostingConstants float fields)
    """
    eng = load_engineering_defaults(get_concept_family(concept))
    cc = load_costing_constants()

    defaults = {
        # Customer params
        "concept": concept,
        "fuel": fuel,
        "net_electric_mw": 1000.0,
        "availability": 0.85,
        "lifetime_yr": 40.0,
        "n_mod": 1,
        "construction_time_yr": eng.get("construction_time_yr", 6.0),
        "interest_rate": 0.07,
        "inflation_rate": 0.02,
        "noak": True,
    }

    # Engineering defaults from YAML
    for k, v in eng.items():
        if k not in defaults:
            defaults[k] = v

    # Costing constants
    for name in cc_float_fields():
        defaults[f"cc_{name}"] = getattr(cc, name)

    return defaults


def calculate(params: dict) -> dict:
    """Run full LCOE calculation.

    Args:
        params: Flat dict of all parameters. Costing constant overrides
               are prefixed with "cc_" (e.g., "cc_blanket_unit_cost_dt").

    Returns:
        Dict with: lcoe, overnight_cost, total_capital, costs (CAS breakdown),
        power_table, sensitivity, cas22_detail.
    """
    concept = params.get("concept", "tokamak")
    fuel = params.get("fuel", "dt")

    # Separate costing constant overrides from engineering overrides
    costing_overrides = {}
    engineering_overrides = {}
    cost_overrides = {}

    skip_keys = {
        "concept", "fuel", "net_electric_mw", "availability",
        "lifetime_yr", "n_mod", "construction_time_yr",
        "interest_rate", "inflation_rate", "noak",
    }
    cc_fields = set(cc_float_fields())

    for k, v in params.items():
        if k in skip_keys:
            continue
        if k.startswith("cc_"):
            cc_name = k[3:]  # strip "cc_" prefix
            if cc_name in cc_fields:
                costing_overrides[cc_name] = v
        elif k.startswith("CAS") or k.startswith("C22"):
            cost_overrides[k] = v
        else:
            engineering_overrides[k] = v

    inp = FusionTeaInput(
        concept=concept,
        fuel=fuel,
        net_electric_mw=params.get("net_electric_mw", 1000.0),
        availability=params.get("availability", 0.85),
        lifetime_yr=params.get("lifetime_yr", 40.0),
        n_mod=params.get("n_mod", 1),
        construction_time_yr=params.get("construction_time_yr", 6.0),
        interest_rate=params.get("interest_rate", 0.07),
        inflation_rate=params.get("inflation_rate", 0.02),
        noak=params.get("noak", True),
        overrides=engineering_overrides,
        cost_overrides=cost_overrides,
        costing_overrides=costing_overrides,
    )

    result = run_costing(inp)

    return {
        "lcoe": result.lcoe,
        "overnight_cost": result.overnight_cost,
        "total_capital": result.total_capital,
        "costs": result.costs,
        "power_table": result.power_table,
        "sensitivity": result.sensitivity,
        "overridden": result.overridden,
    }
```

- [ ] **Step 2: Verify costingfe is importable**

Run: `cd /mnt/c/Users/talru/1cfe/1costingfe && pip install -e . 2>&1 | tail -5`
Expected: Successfully installed costingfe

- [ ] **Step 3: Test the service manually**

```bash
cd /mnt/c/Users/talru/1cfe/fusion-backcasting
python -c "
from backend.services.costing_service import get_defaults, calculate
d = get_defaults('tokamak', 'dt')
print(f'Got {len(d)} defaults')
r = calculate(d)
print(f'LCOE: {r[\"lcoe\"]:.2f} $/MWh')
print(f'Overnight: {r[\"overnight_cost\"]:.0f} $/kW')
"
```
Expected: LCOE and overnight cost values printed

- [ ] **Step 4: Commit**

```bash
git add backend/services/costing_service.py
git commit -m "feat: add costing service wrapping 1costingfe"
```

---

## Task 2: Backend — API Routes

**Files:**
- Create: `backend/routes/costing.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Create costing API routes**

```python
"""API routes for 1costingfe LCOE dashboard."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.costing_service import calculate, get_defaults
from costingfe.types import ConfinementConcept, Fuel

router = APIRouter(prefix="/api/costing", tags=["costing"])


class CalculateRequest(BaseModel):
    """All parameters for LCOE calculation. Flat dict."""
    params: dict


class DefaultsRequest(BaseModel):
    concept: str = "tokamak"
    fuel: str = "dt"


@router.get("/concepts")
def list_concepts():
    """Return available concepts and fuels."""
    return {
        "concepts": [c.value for c in ConfinementConcept],
        "fuels": [f.value for f in Fuel],
        "concept_labels": {
            "tokamak": "Tokamak",
            "stellarator": "Stellarator",
            "mirror": "Mirror",
            "laser_ife": "Laser IFE",
            "zpinch": "Z-Pinch",
            "heavy_ion": "Heavy Ion",
            "mag_target": "Mag. Target",
            "plasma_jet": "Plasma Jet",
        },
        "fuel_labels": {
            "dt": "D-T",
            "dd": "D-D",
            "dhe3": "D-He3",
            "pb11": "p-B11",
        },
    }


@router.post("/defaults")
def get_param_defaults(req: DefaultsRequest):
    """Get all default parameters for a concept/fuel combination."""
    try:
        defaults = get_defaults(req.concept, req.fuel)
        return {"defaults": defaults}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate")
def calculate_lcoe(req: CalculateRequest):
    """Calculate LCOE from parameters."""
    try:
        result = calculate(req.params)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **Step 2: Update main.py to include new router**

Replace the existing route imports in `backend/main.py` with the new costing router. Keep CORS config.

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.costing import router as costing_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warmup: run one calculation to trigger JAX compilation (5-30s)
    # so the first user request is fast
    from backend.services.costing_service import calculate, get_defaults
    print("Warming up JAX (first calculation triggers XLA compilation)...")
    defaults = get_defaults("tokamak", "dt")
    calculate(defaults)
    print("Warmup complete.")
    yield


app = FastAPI(title="Fusion LCOE Dashboard", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(costing_router)
```

- [ ] **Step 3: Test API with curl**

```bash
cd /mnt/c/Users/talru/1cfe/fusion-backcasting
uvicorn backend.main:app --port 8000 &
sleep 3
curl -s http://localhost:8000/api/costing/concepts | python -m json.tool | head -20
curl -s -X POST http://localhost:8000/api/costing/defaults \
  -H 'Content-Type: application/json' \
  -d '{"concept":"tokamak","fuel":"dt"}' | python -m json.tool | head -20
kill %1
```

- [ ] **Step 4: Commit**

```bash
git add backend/routes/costing.py backend/main.py
git commit -m "feat: add costing API endpoints for LCOE dashboard"
```

---

## Task 3: Frontend — Types, API Client, Utilities

**Files:**
- Create: `frontend/src/types/costing.ts`
- Create: `frontend/src/api/costing.ts`
- Create: `frontend/src/utils/format.ts`

- [ ] **Step 1: Create TypeScript types**

```typescript
// frontend/src/types/costing.ts

export type ConfinementConcept =
  | 'tokamak' | 'stellarator' | 'mirror'
  | 'laser_ife' | 'zpinch' | 'heavy_ion'
  | 'mag_target' | 'plasma_jet';

export type FuelType = 'dt' | 'dd' | 'dhe3' | 'pb11';

export type ConfinementFamily = 'mfe' | 'ife' | 'mif';

export const CONCEPT_TO_FAMILY: Record<ConfinementConcept, ConfinementFamily> = {
  tokamak: 'mfe', stellarator: 'mfe', mirror: 'mfe',
  laser_ife: 'ife', zpinch: 'ife', heavy_ion: 'ife',
  mag_target: 'mif', plasma_jet: 'mif',
};

export interface PowerTable {
  p_fus: number;
  p_th: number;
  p_et: number;
  p_net: number;
  q_sci: number;
  q_eng: number;
  rec_frac: number;
}

export interface CostBreakdown {
  [key: string]: number;  // CAS code -> M$
}

export interface SensitivityResult {
  engineering: Record<string, number>;
  financial: Record<string, number>;
  costing: Record<string, number>;
}

export interface CostingResult {
  lcoe: number;
  overnight_cost: number;
  total_capital: number;
  costs: CostBreakdown;
  power_table: PowerTable;
  sensitivity: SensitivityResult;
  overridden: string[];
}

/** Metadata for a parameter slider */
export interface ParamMeta {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
  format?: (v: number) => string;
  /** Which families this param applies to (undefined = all) */
  families?: ConfinementFamily[];
  /** Group for accordion display */
  group?: string;
}
```

- [ ] **Step 2: Create API client**

```typescript
// frontend/src/api/costing.ts

import type { CostingResult } from '../types/costing';

const API_BASE = '/api/costing';

export async function fetchConcepts(): Promise<{
  concepts: string[];
  fuels: string[];
  concept_labels: Record<string, string>;
  fuel_labels: Record<string, string>;
}> {
  const res = await fetch(`${API_BASE}/concepts`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDefaults(
  concept: string,
  fuel: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/defaults`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept, fuel }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.defaults;
}

export async function calculateLCOE(
  params: Record<string, unknown>
): Promise<CostingResult> {
  const res = await fetch(`${API_BASE}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

- [ ] **Step 3: Create formatting utilities**

```typescript
// frontend/src/utils/format.ts

export function formatDollars(v: number): string {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(0)}M`;
}

export function formatLcoe(v: number): string {
  return `$${v.toFixed(2)}/MWh`;
}

export function formatPerKw(v: number): string {
  return `$${v.toFixed(0)}/kW`;
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function formatMW(v: number): string {
  return `${v.toFixed(0)} MW`;
}

export function formatMeters(v: number): string {
  return `${v.toFixed(2)} m`;
}

export function formatYears(v: number): string {
  return `${v.toFixed(0)} yr`;
}

export function formatElasticity(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${(v * 100).toFixed(1)}%`;
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/costing.ts frontend/src/api/costing.ts \
  frontend/src/utils/format.ts
git commit -m "feat: add frontend types, API client, and formatters"
```

---

## Task 4: Frontend — Zustand Store (rewrite)

**Files:**
- Rewrite: `frontend/src/store/index.ts`

- [ ] **Step 1: Rewrite the Zustand store**

The new store manages:
- All 1costingfe parameters (loaded from backend defaults)
- Backend calculation results (LCOE, costs, power table, sensitivity)
- Loading/error state
- Concept and fuel selection (triggers default reload)
- Debounced recalculation on any parameter change

```typescript
// frontend/src/store/index.ts

import { create } from 'zustand';
import type { CostingResult, ConfinementConcept, FuelType } from '../types/costing';
import { fetchDefaults, calculateLCOE } from '../api/costing';

interface DashboardStore {
  // Input state
  params: Record<string, unknown>;
  defaults: Record<string, unknown>;
  concept: ConfinementConcept;
  fuel: FuelType;

  // Output state
  result: CostingResult | null;
  loading: boolean;
  error: string | null;

  // Actions
  setConcept: (concept: ConfinementConcept) => void;
  setFuel: (fuel: FuelType) => void;
  setParam: (key: string, value: unknown) => void;
  setParams: (updates: Record<string, unknown>) => void;
  resetToDefaults: () => void;
  loadDefaults: () => Promise<void>;
  recalculate: () => Promise<void>;
}

let recalcTimer: ReturnType<typeof setTimeout> | null = null;

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  params: {},
  defaults: {},
  concept: 'tokamak',
  fuel: 'dt',
  result: null,
  loading: false,
  error: null,

  setConcept: (concept) => {
    set({ concept });
    get().loadDefaults();
  },

  setFuel: (fuel) => {
    set({ fuel });
    get().loadDefaults();
  },

  setParam: (key, value) => {
    const params = { ...get().params };
    if (value === undefined) {
      delete params[key];
    } else {
      params[key] = value;
    }
    set({ params });
    // Debounced recalculation
    if (recalcTimer) clearTimeout(recalcTimer);
    recalcTimer = setTimeout(() => get().recalculate(), 300);
  },

  setParams: (updates) => {
    const params = { ...get().params, ...updates };
    set({ params });
    if (recalcTimer) clearTimeout(recalcTimer);
    recalcTimer = setTimeout(() => get().recalculate(), 300);
  },

  resetToDefaults: () => {
    const defaults = get().defaults;
    set({ params: { ...defaults } });
    get().recalculate();
  },

  loadDefaults: async () => {
    const { concept, fuel } = get();
    set({ loading: true, error: null });
    try {
      const defaults = await fetchDefaults(concept, fuel);
      set({ defaults, params: { ...defaults }, loading: false });
      get().recalculate();
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  recalculate: async () => {
    const { params } = get();
    if (Object.keys(params).length === 0) return;
    set({ loading: true, error: null });
    try {
      const result = await calculateLCOE(params);
      set({ result, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },
}));
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/store/index.ts
git commit -m "feat: rewrite store for 1costingfe-backed dashboard"
```

---

## Task 5: Frontend — Reusable SliderInput Component

**Files:**
- Create: `frontend/src/components/SliderInput.tsx`

- [ ] **Step 1: Extract and enhance the SliderInput**

Based on the existing FinancialPanel's internal SliderInput, create a standalone reusable component with default-value markers and direct input support.

```typescript
// frontend/src/components/SliderInput.tsx

interface SliderInputProps {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  description?: string;
  onChange: (value: number) => void;
  /** Show a text input alongside the slider for precise entry */
  showInput?: boolean;
}

export function SliderInput({
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  format,
  description,
  onChange,
  showInput = false,
}: SliderInputProps) {
  const defaultPct = ((defaultValue - min) / (max - min)) * 100;
  const isAtDefault = Math.abs(value - defaultValue) < step * 0.5;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {showInput ? (
            <input
              type="number"
              value={value}
              min={min}
              max={max}
              step={step}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-20 text-right text-sm font-semibold text-fusion-600 dark:text-fusion-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-fusion-500 outline-none"
            />
          ) : (
            <span className="text-sm font-semibold text-fusion-600 dark:text-fusion-400">
              {format(value)}
            </span>
          )}
          {!isAtDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="text-xs text-gray-400 hover:text-fusion-500 transition-colors"
              title={`Reset to default: ${format(defaultValue)}`}
            >
              reset
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
        />
        {/* Default value marker */}
        <div
          className="absolute top-0 h-4 flex flex-col items-center pointer-events-none"
          style={{
            left: `calc(${defaultPct}% + ${7 - defaultPct * 0.14}px)`,
          }}
        >
          <div
            className={`w-0.5 h-4 ${
              isAtDefault
                ? 'bg-fusion-500'
                : 'bg-gray-400 dark:bg-gray-500'
            }`}
          />
        </div>
      </div>
      {description && (
        <div className="text-xs text-gray-400 mt-1">{description}</div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/SliderInput.tsx
git commit -m "feat: add reusable SliderInput component"
```

---

## Task 6: Frontend — PrimaryControls Component

**Files:**
- Create: `frontend/src/components/PrimaryControls.tsx`

- [ ] **Step 1: Create PrimaryControls**

This is the always-visible top bar with concept, fuel, power, NOAK, and n_mod.

```typescript
// frontend/src/components/PrimaryControls.tsx

import { useDashboardStore } from '../store';
import type { ConfinementConcept, FuelType } from '../types/costing';

const CONCEPT_LABELS: Record<ConfinementConcept, string> = {
  tokamak: 'Tokamak',
  stellarator: 'Stellarator',
  mirror: 'Mirror',
  laser_ife: 'Laser IFE',
  zpinch: 'Z-Pinch',
  heavy_ion: 'Heavy Ion',
  mag_target: 'Mag. Target',
  plasma_jet: 'Plasma Jet',
};

const CONCEPT_GROUPS = {
  MFE: ['tokamak', 'stellarator', 'mirror'] as ConfinementConcept[],
  IFE: ['laser_ife', 'zpinch', 'heavy_ion'] as ConfinementConcept[],
  MIF: ['mag_target', 'plasma_jet'] as ConfinementConcept[],
};

const FUEL_LABELS: Record<FuelType, string> = {
  dt: 'D-T',
  dd: 'D-D',
  dhe3: 'D-He3',
  pb11: 'p-B11',
};

export function PrimaryControls() {
  const { concept, fuel, params, setConcept, setFuel, setParam } =
    useDashboardStore();

  const netMw = (params.net_electric_mw as number) ?? 1000;
  const noak = (params.noak as boolean) ?? true;
  const nMod = (params.n_mod as number) ?? 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Concept selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Concept
          </label>
          <select
            value={concept}
            onChange={(e) =>
              setConcept(e.target.value as ConfinementConcept)
            }
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 text-gray-900 dark:text-gray-100"
          >
            {Object.entries(CONCEPT_GROUPS).map(([family, concepts]) => (
              <optgroup key={family} label={family}>
                {concepts.map((c) => (
                  <option key={c} value={c}>
                    {CONCEPT_LABELS[c]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Fuel selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Fuel
          </label>
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
            {(Object.entries(FUEL_LABELS) as [FuelType, string][]).map(
              ([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFuel(f)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    fuel === f
                      ? 'bg-fusion-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Net Electric Power */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Net Power
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={netMw}
              min={100}
              max={2000}
              step={50}
              onChange={(e) =>
                setParam('net_electric_mw', Number(e.target.value))
              }
              className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-1.5 text-right text-gray-900 dark:text-gray-100"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              MW
            </span>
          </div>
        </div>

        {/* N Modules */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Modules
          </label>
          <input
            type="number"
            value={nMod}
            min={1}
            max={10}
            step={1}
            onChange={(e) => setParam('n_mod', Number(e.target.value))}
            className="w-14 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-1.5 text-center text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* FOAK/NOAK */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Maturity
          </label>
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setParam('noak', false)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                !noak
                  ? 'bg-fusion-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              FOAK
            </button>
            <button
              onClick={() => setParam('noak', true)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                noak
                  ? 'bg-fusion-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              NOAK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/PrimaryControls.tsx
git commit -m "feat: add PrimaryControls component"
```

---

## Task 7: Frontend — LCOEDisplay (rewrite)

**Files:**
- Rewrite: `frontend/src/components/LCOEDisplay.tsx`

- [ ] **Step 1: Rewrite LCOEDisplay**

Shows the big LCOE number, cost breakdown bars (CAS90 capital, CAS70 O&M, CAS80 fuel), overnight cost, and total capital.

```typescript
// frontend/src/components/LCOEDisplay.tsx

import { useDashboardStore } from '../store';
import { formatLcoe, formatDollars, formatPerKw } from '../utils/format';

export function LCOEDisplay() {
  const { result, loading } = useDashboardStore();

  if (!result) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  const { lcoe, overnight_cost, total_capital, costs } = result;
  const cas90 = costs.CAS90 ?? 0;
  const cas70 = costs.CAS70 ?? 0;
  const cas80 = costs.CAS80 ?? 0;
  const annualTotal = cas90 + cas70 + cas80;

  const capitalPct = annualTotal > 0 ? (cas90 / annualTotal) * 100 : 0;
  const omPct = annualTotal > 0 ? (cas70 / annualTotal) * 100 : 0;
  const fuelPct = annualTotal > 0 ? (cas80 / annualTotal) * 100 : 0;

  // Color based on LCOE
  const lcoeColor =
    lcoe <= 10
      ? 'text-green-500'
      : lcoe <= 30
        ? 'text-yellow-500'
        : lcoe <= 60
          ? 'text-orange-500'
          : 'text-red-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
      {/* Big LCOE number */}
      <div className="text-center mb-4">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Levelized Cost of Electricity
        </div>
        <div
          className={`text-5xl font-bold ${lcoeColor} ${loading ? 'opacity-50' : ''} transition-all`}
        >
          ${lcoe.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          $/MWh
        </div>
      </div>

      {/* LCOE Breakdown bars */}
      <div className="space-y-2">
        <BreakdownBar
          label="Capital (CAS90)"
          value={cas90}
          pct={capitalPct}
          color="bg-blue-500"
        />
        <BreakdownBar
          label="O&M (CAS70)"
          value={cas70}
          pct={omPct}
          color="bg-purple-500"
        />
        <BreakdownBar
          label="Fuel (CAS80)"
          value={cas80}
          pct={fuelPct}
          color="bg-orange-500"
        />
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500 dark:text-gray-400">
            Overnight Cost
          </div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {formatPerKw(overnight_cost)}
          </div>
        </div>
        <div>
          <div className="text-gray-500 dark:text-gray-400">
            Total Capital
          </div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {formatDollars(total_capital)}
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-gray-600 dark:text-gray-300">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">
          ${value.toFixed(1)}M/yr ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/LCOEDisplay.tsx
git commit -m "feat: rewrite LCOEDisplay for 1costingfe backend"
```

---

## Task 8: Frontend — HighSensitivityPanel

**Files:**
- Create: `frontend/src/components/HighSensitivityPanel.tsx`

- [ ] **Step 1: Create HighSensitivityPanel**

The always-visible panel with the 7 most impactful parameters. Shows sliders with default markers and sensitivity indicators.

```typescript
// frontend/src/components/HighSensitivityPanel.tsx

import { useDashboardStore } from '../store';
import { SliderInput } from './SliderInput';
import { CONCEPT_TO_FAMILY } from '../types/costing';
import { formatPct, formatMeters, formatMW, formatYears } from '../utils/format';

export function HighSensitivityPanel() {
  const { params, defaults, concept, result, setParam } =
    useDashboardStore();
  const family = CONCEPT_TO_FAMILY[concept];
  const sensitivity = result?.sensitivity?.engineering ?? {};

  const sliders = [
    {
      key: 'availability',
      label: 'Availability',
      min: 0.5, max: 0.98, step: 0.01,
      format: formatPct,
      description: 'Capacity factor',
    },
    {
      key: 'eta_th',
      label: 'Thermal Efficiency',
      min: 0.20, max: 0.65, step: 0.01,
      format: formatPct,
      description: 'Thermal-to-electric conversion',
    },
    {
      key: 'interest_rate',
      label: 'Interest Rate',
      min: 0.02, max: 0.15, step: 0.005,
      format: formatPct,
      description: 'Nominal cost of capital',
    },
    {
      key: 'blanket_t',
      label: 'Blanket Thickness',
      min: 0.30, max: 1.50, step: 0.05,
      format: formatMeters,
      description: 'First wall + blanket radial build',
    },
    ...(family === 'mfe'
      ? [
          {
            key: 'p_input',
            label: 'Heating Power',
            min: 10, max: 200, step: 5,
            format: formatMW,
            description: 'Auxiliary heating input',
          },
          {
            key: 'eta_pin',
            label: 'Heating Efficiency',
            min: 0.10, max: 0.90, step: 0.05,
            format: formatPct,
            description: 'Heating system wall-plug efficiency',
          },
        ]
      : []),
    {
      key: 'construction_time_yr',
      label: 'Construction Time',
      min: 3, max: 12, step: 0.5,
      format: formatYears,
      description: 'Affects IDC and indirect costs',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        Key Parameters
        <span className="text-xs font-normal text-gray-400">
          (highest LCOE sensitivity)
        </span>
      </h3>
      <div className="space-y-4">
        {sliders.map((s) => {
          const val = (params[s.key] as number) ?? (defaults[s.key] as number) ?? 0;
          const def = (defaults[s.key] as number) ?? 0;
          const elast = sensitivity[s.key];
          return (
            <div key={s.key} className="relative">
              <SliderInput
                label={s.label}
                value={val}
                defaultValue={def}
                min={s.min}
                max={s.max}
                step={s.step}
                format={s.format}
                description={s.description}
                onChange={(v) => setParam(s.key, v)}
              />
              {elast !== undefined && (
                <span
                  className={`absolute top-0 right-0 text-xs font-mono ${
                    Math.abs(elast) > 0.3
                      ? 'text-red-400'
                      : Math.abs(elast) > 0.1
                        ? 'text-yellow-400'
                        : 'text-gray-400'
                  }`}
                  title={`Elasticity: ${elast > 0 ? '+' : ''}${(elast * 100).toFixed(1)}% LCOE per +100% param`}
                >
                  e={elast.toFixed(2)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/HighSensitivityPanel.tsx
git commit -m "feat: add HighSensitivityPanel with sensitivity indicators"
```

---

## Task 9: Frontend — EngineeringPanel (Tier 3 Parameters)

**Files:**
- Create: `frontend/src/components/EngineeringPanel.tsx`

- [ ] **Step 1: Create EngineeringPanel**

Collapsible sections for moderate-sensitivity parameters: power balance, parasitic power, geometry, financial. Shows/hides parameters based on confinement family.

```typescript
// frontend/src/components/EngineeringPanel.tsx

import { useState } from 'react';
import { useDashboardStore } from '../store';
import { SliderInput } from './SliderInput';
import { CONCEPT_TO_FAMILY } from '../types/costing';
import { formatPct, formatMW, formatMeters, formatYears } from '../utils/format';

interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  description?: string;
}

const POWER_BALANCE: ParamDef[] = [
  { key: 'eta_p', label: 'Pumping Efficiency', min: 0.3, max: 0.95, step: 0.05, format: formatPct },
  { key: 'mn', label: 'Neutron Multiplier', min: 1.0, max: 1.5, step: 0.05, format: (v) => v.toFixed(2) },
  { key: 'f_sub', label: 'Subsystem Fraction', min: 0.01, max: 0.10, step: 0.005, format: formatPct },
  { key: 'eta_de', label: 'DEC Efficiency', min: 0.0, max: 0.95, step: 0.05, format: formatPct },
  { key: 'f_dec', label: 'DEC Fraction', min: 0.0, max: 1.0, step: 0.05, format: formatPct },
];

const PARASITIC_COMMON: ParamDef[] = [
  { key: 'p_pump', label: 'Pumping Power', min: 0.5, max: 10, step: 0.5, format: formatMW },
  { key: 'p_trit', label: 'Tritium Processing', min: 0, max: 30, step: 1, format: formatMW },
  { key: 'p_house', label: 'Housekeeping', min: 1, max: 15, step: 1, format: formatMW },
  { key: 'p_cryo', label: 'Cryogenics', min: 0.1, max: 5, step: 0.1, format: formatMW },
];

const PARASITIC_MFE: ParamDef[] = [
  { key: 'p_coils', label: 'Coil Power', min: 0.5, max: 20, step: 0.5, format: formatMW },
  { key: 'p_cool', label: 'Cooling Power', min: 5, max: 50, step: 1, format: formatMW },
];

const PARASITIC_IFE: ParamDef[] = [
  { key: 'p_implosion', label: 'Implosion Driver', min: 1, max: 50, step: 1, format: formatMW },
  { key: 'p_ignition', label: 'Ignition Laser', min: 0.01, max: 5, step: 0.01, format: formatMW },
  { key: 'eta_pin1', label: 'Driver 1 Efficiency', min: 0.05, max: 0.50, step: 0.01, format: formatPct },
  { key: 'eta_pin2', label: 'Driver 2 Efficiency', min: 0.05, max: 0.50, step: 0.01, format: formatPct },
  { key: 'p_target', label: 'Target Factory', min: 0.1, max: 10, step: 0.1, format: formatMW },
];

const PARASITIC_MIF: ParamDef[] = [
  { key: 'p_driver', label: 'Driver Power', min: 1, max: 100, step: 1, format: formatMW },
  { key: 'p_target', label: 'Target Factory', min: 0.1, max: 10, step: 0.1, format: formatMW },
  { key: 'p_coils', label: 'Coil Power', min: 0, max: 10, step: 0.5, format: formatMW },
];

const GEOMETRY: ParamDef[] = [
  { key: 'R0', label: 'Major Radius', min: 1, max: 10, step: 0.1, format: formatMeters },
  { key: 'plasma_t', label: 'Plasma Size', min: 0.5, max: 5, step: 0.1, format: formatMeters },
  { key: 'elon', label: 'Elongation', min: 1.0, max: 3.5, step: 0.1, format: (v) => `${v.toFixed(1)}` },
  { key: 'ht_shield_t', label: 'HT Shield', min: 0.05, max: 0.50, step: 0.05, format: formatMeters },
  { key: 'structure_t', label: 'Structure', min: 0.05, max: 0.40, step: 0.05, format: formatMeters },
  { key: 'vessel_t', label: 'Vessel', min: 0.05, max: 0.40, step: 0.05, format: formatMeters },
];

const FINANCIAL: ParamDef[] = [
  { key: 'lifetime_yr', label: 'Plant Lifetime', min: 20, max: 60, step: 5, format: formatYears },
  { key: 'inflation_rate', label: 'Inflation Rate', min: 0.0, max: 0.05, step: 0.005, format: formatPct },
];

export function EngineeringPanel() {
  const { params, defaults, concept, setParam } = useDashboardStore();
  const family = CONCEPT_TO_FAMILY[concept];

  const parasiticFamily =
    family === 'ife' ? PARASITIC_IFE
    : family === 'mif' ? PARASITIC_MIF
    : PARASITIC_MFE;

  const sections = [
    { title: 'Power Balance', params: POWER_BALANCE },
    { title: 'Parasitic Power', params: [...PARASITIC_COMMON, ...parasiticFamily] },
    { title: 'Geometry', params: GEOMETRY },
    { title: 'Financial', params: FINANCIAL },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Engineering Parameters
      </h3>
      <div className="space-y-1">
        {sections.map((section) => (
          <CollapsibleSection
            key={section.title}
            title={section.title}
            paramDefs={section.params}
            params={params}
            defaults={defaults}
            onParamChange={setParam}
          />
        ))}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  paramDefs,
  params,
  defaults,
  onParamChange,
}: {
  title: string;
  paramDefs: ParamDef[];
  params: Record<string, unknown>;
  defaults: Record<string, unknown>;
  onParamChange: (key: string, value: unknown) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter to only show params that have defaults (relevant to current concept)
  const available = paramDefs.filter(
    (p) => defaults[p.key] !== undefined
  );
  if (available.length === 0) return null;

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <span>{title}</span>
        <span
          className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          {'\u25B6'}
        </span>
      </button>
      {isOpen && (
        <div className="pb-3 space-y-3">
          {available.map((p) => (
            <SliderInput
              key={p.key}
              label={p.label}
              value={(params[p.key] as number) ?? (defaults[p.key] as number) ?? 0}
              defaultValue={(defaults[p.key] as number) ?? 0}
              min={p.min}
              max={p.max}
              step={p.step}
              format={p.format}
              description={p.description}
              onChange={(v) => onParamChange(p.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/EngineeringPanel.tsx
git commit -m "feat: add EngineeringPanel with collapsible sections"
```

---

## Task 10: Frontend — CostingConstantsPanel (Tier 4)

**Files:**
- Create: `frontend/src/components/CostingConstantsPanel.tsx`

- [ ] **Step 1: Create CostingConstantsPanel**

Accordion-style panel showing all ~80 CostingConstants, grouped by CAS account. Uses `cc_` prefix for parameter keys.

```typescript
// frontend/src/components/CostingConstantsPanel.tsx

import { useState } from 'react';
import { useDashboardStore } from '../store';
import { SliderInput } from './SliderInput';

interface CCParam {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const CC_GROUPS: { title: string; params: CCParam[] }[] = [
  {
    title: 'CAS22 — Reactor Equipment Unit Costs',
    params: [
      { key: 'cc_blanket_unit_cost_dt', label: 'Blanket (DT)', min: 0.05, max: 2.0, step: 0.05, unit: 'M$/m\u00B3' },
      { key: 'cc_blanket_unit_cost_dd', label: 'Blanket (DD)', min: 0.05, max: 1.0, step: 0.05, unit: 'M$/m\u00B3' },
      { key: 'cc_blanket_unit_cost_dhe3', label: 'Blanket (DHe3)', min: 0.01, max: 0.5, step: 0.01, unit: 'M$/m\u00B3' },
      { key: 'cc_blanket_unit_cost_pb11', label: 'Blanket (pB11)', min: 0.01, max: 0.3, step: 0.01, unit: 'M$/m\u00B3' },
      { key: 'cc_shield_unit_cost', label: 'Shield', min: 0.1, max: 2.0, step: 0.05, unit: 'M$/m\u00B3' },
      { key: 'cc_structure_unit_cost', label: 'Structure', min: 0.05, max: 0.5, step: 0.01, unit: 'M$/m\u00B3' },
      { key: 'cc_vessel_unit_cost', label: 'Vessel', min: 0.1, max: 2.0, step: 0.05, unit: 'M$/m\u00B3' },
      { key: 'cc_power_supplies_base', label: 'Power Supplies', min: 20, max: 200, step: 5, unit: 'M$ @1GW' },
      { key: 'cc_divertor_base', label: 'Divertor', min: 10, max: 150, step: 5, unit: 'M$ @1GWth' },
      { key: 'cc_target_factory_base', label: 'Target Factory', min: 50, max: 500, step: 10, unit: 'M$ @1GW' },
      { key: 'cc_installation_frac', label: 'Installation Frac', min: 0.05, max: 0.25, step: 0.01, unit: 'fraction' },
    ],
  },
  {
    title: 'CAS22 — Heating Costs',
    params: [
      { key: 'cc_heating_nbi_per_mw', label: 'NBI', min: 2, max: 15, step: 0.5, unit: 'M$/MW' },
      { key: 'cc_heating_icrf_per_mw', label: 'ICRF', min: 1, max: 10, step: 0.5, unit: 'M$/MW' },
      { key: 'cc_heating_ecrh_per_mw', label: 'ECRH', min: 1, max: 12, step: 0.5, unit: 'M$/MW' },
      { key: 'cc_heating_lhcd_per_mw', label: 'LHCD', min: 1, max: 10, step: 0.5, unit: 'M$/MW' },
    ],
  },
  {
    title: 'CAS22 — Remote Handling & Fuel',
    params: [
      { key: 'cc_remote_handling_dt_base', label: 'RH (DT)', min: 20, max: 300, step: 10, unit: 'M$ @1GW' },
      { key: 'cc_remote_handling_dd_base', label: 'RH (DD)', min: 20, max: 200, step: 10, unit: 'M$ @1GW' },
      { key: 'cc_remote_handling_dhe3_base', label: 'RH (DHe3)', min: 5, max: 100, step: 5, unit: 'M$ @1GW' },
      { key: 'cc_remote_handling_pb11_base', label: 'RH (pB11)', min: 5, max: 80, step: 5, unit: 'M$ @1GW' },
      { key: 'cc_fuel_handling_dt_base', label: 'Fuel (DT)', min: 20, max: 250, step: 10, unit: 'M$ @1GW' },
      { key: 'cc_fuel_handling_dd_base', label: 'Fuel (DD)', min: 10, max: 150, step: 5, unit: 'M$ @1GW' },
      { key: 'cc_fuel_handling_dhe3_base', label: 'Fuel (DHe3)', min: 5, max: 100, step: 5, unit: 'M$ @1GW' },
      { key: 'cc_fuel_handling_pb11_base', label: 'Fuel (pB11)', min: 2, max: 50, step: 2, unit: 'M$ @1GW' },
    ],
  },
  {
    title: 'CAS23-29 — BOP & Other Direct',
    params: [
      { key: 'cc_turbine_per_mw', label: 'Turbine', min: 0.05, max: 0.5, step: 0.01, unit: 'M$/MW' },
      { key: 'cc_electric_per_mw', label: 'Electrical', min: 0.02, max: 0.2, step: 0.005, unit: 'M$/MW' },
      { key: 'cc_misc_per_mw', label: 'Misc BOP', min: 0.01, max: 0.15, step: 0.005, unit: 'M$/MW' },
      { key: 'cc_heat_rej_per_mw', label: 'Heat Rejection', min: 0.01, max: 0.1, step: 0.005, unit: 'M$/MW' },
      { key: 'cc_special_materials_dt', label: 'Spec. Mat. (DT)', min: 0, max: 200, step: 5, unit: 'M$' },
      { key: 'cc_digital_twin', label: 'Digital Twin', min: 0, max: 20, step: 1, unit: 'M$' },
      { key: 'cc_contingency_rate_foak', label: 'Contingency (FOAK)', min: 0.0, max: 0.25, step: 0.01, unit: 'fraction' },
    ],
  },
  {
    title: 'CAS30-50 — Indirect & Supplementary',
    params: [
      { key: 'cc_indirect_fraction', label: 'Indirect Fraction', min: 0.10, max: 0.35, step: 0.01, unit: 'fraction' },
      { key: 'cc_owner_cost_dt', label: 'Owner Cost (DT)', min: 10, max: 80, step: 2, unit: 'M$ @1GW' },
      { key: 'cc_shipping_frac', label: 'Shipping', min: 0.005, max: 0.05, step: 0.005, unit: 'fraction' },
      { key: 'cc_tax_frac', label: 'Taxes', min: 0.005, max: 0.03, step: 0.005, unit: 'fraction' },
      { key: 'cc_construction_insurance_frac', label: 'Insurance', min: 0.005, max: 0.03, step: 0.005, unit: 'fraction' },
      { key: 'cc_decom_provision_dt', label: 'Decom (DT)', min: 20, max: 250, step: 10, unit: 'M$ @1GW' },
    ],
  },
  {
    title: 'CAS70 — O&M & Replacement',
    params: [
      { key: 'cc_om_cost_dt', label: 'Annual O&M (DT)', min: 10, max: 100, step: 2, unit: 'M$/yr @1GW' },
      { key: 'cc_om_cost_dd', label: 'Annual O&M (DD)', min: 10, max: 80, step: 2, unit: 'M$/yr @1GW' },
      { key: 'cc_om_cost_dhe3', label: 'Annual O&M (DHe3)', min: 5, max: 60, step: 2, unit: 'M$/yr @1GW' },
      { key: 'cc_om_cost_pb11', label: 'Annual O&M (pB11)', min: 5, max: 50, step: 2, unit: 'M$/yr @1GW' },
      { key: 'cc_core_lifetime_dt', label: 'Core Life (DT)', min: 2, max: 20, step: 1, unit: 'FPY' },
      { key: 'cc_core_lifetime_dd', label: 'Core Life (DD)', min: 5, max: 30, step: 1, unit: 'FPY' },
      { key: 'cc_core_lifetime_dhe3', label: 'Core Life (DHe3)', min: 10, max: 50, step: 5, unit: 'FPY' },
      { key: 'cc_core_lifetime_pb11', label: 'Core Life (pB11)', min: 20, max: 100, step: 5, unit: 'FPY' },
    ],
  },
  {
    title: 'CAS80 — Fuel Costs',
    params: [
      { key: 'cc_u_deuterium', label: 'Deuterium', min: 500, max: 5000, step: 100, unit: '$/kg' },
      { key: 'cc_u_li6', label: 'Li-6', min: 200, max: 3000, step: 100, unit: '$/kg' },
      { key: 'cc_u_he3', label: 'He-3', min: 100000, max: 5000000, step: 100000, unit: '$/kg' },
      { key: 'cc_u_protium', label: 'Protium', min: 1, max: 50, step: 1, unit: '$/kg' },
      { key: 'cc_u_b11', label: 'B-11 (FOAK)', min: 1000, max: 50000, step: 1000, unit: '$/kg' },
      { key: 'cc_u_b11_noak', label: 'B-11 (NOAK)', min: 10, max: 500, step: 5, unit: '$/kg' },
      { key: 'cc_burn_fraction', label: 'Burn Fraction', min: 0.01, max: 0.20, step: 0.01, unit: 'fraction' },
      { key: 'cc_fuel_recovery', label: 'Fuel Recovery', min: 0.80, max: 0.99, step: 0.01, unit: 'fraction' },
    ],
  },
];

export function CostingConstantsPanel() {
  const { params, defaults, setParam } = useDashboardStore();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Costing Constants
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Unit costs, base costs, and calibration parameters for each CAS
        account.
      </p>
      <div className="space-y-0.5">
        {CC_GROUPS.map((group) => (
          <div
            key={group.title}
            className="border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <button
              onClick={() =>
                setOpenGroup(
                  openGroup === group.title ? null : group.title
                )
              }
              className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span>{group.title}</span>
              <span
                className={`transform transition-transform ${
                  openGroup === group.title ? 'rotate-90' : ''
                }`}
              >
                {'\u25B6'}
              </span>
            </button>
            {openGroup === group.title && (
              <div className="pb-3 space-y-3">
                {group.params.map((p) => {
                  const val =
                    (params[p.key] as number) ??
                    (defaults[p.key] as number) ??
                    0;
                  const def = (defaults[p.key] as number) ?? 0;
                  return (
                    <SliderInput
                      key={p.key}
                      label={p.label}
                      value={val}
                      defaultValue={def}
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      format={(v) => `${v} ${p.unit}`}
                      onChange={(v) => setParam(p.key, v)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/CostingConstantsPanel.tsx
git commit -m "feat: add CostingConstantsPanel with all CC parameters"
```

---

## Task 11: Frontend — PowerTable & CostBreakdown

**Files:**
- Create: `frontend/src/components/PowerTable.tsx`
- Create: `frontend/src/components/CostBreakdown.tsx`

- [ ] **Step 1: Create PowerTable component**

Displays the power flow results from 1costingfe.

```typescript
// frontend/src/components/PowerTable.tsx

import { useDashboardStore } from '../store';

export function PowerTable() {
  const { result } = useDashboardStore();
  if (!result) return null;

  const pt = result.power_table;
  const rows = [
    { label: 'Fusion Power', value: pt.p_fus, unit: 'MW' },
    { label: 'Thermal Power', value: pt.p_th, unit: 'MW' },
    { label: 'Gross Electric', value: pt.p_et, unit: 'MW' },
    { label: 'Net Electric', value: pt.p_net, unit: 'MW' },
    { label: 'Scientific Q', value: pt.q_sci, unit: '' },
    { label: 'Engineering Q', value: pt.q_eng, unit: '' },
    { label: 'Recirc. Fraction', value: pt.rec_frac * 100, unit: '%' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Power Balance
      </h3>
      <div className="space-y-1">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex justify-between text-sm py-0.5"
          >
            <span className="text-gray-600 dark:text-gray-300">
              {r.label}
            </span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {r.value.toFixed(r.unit === '%' || r.unit === '' ? 2 : 0)}{' '}
              {r.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CostBreakdown component**

```typescript
// frontend/src/components/CostBreakdown.tsx

import { useState } from 'react';
import { useDashboardStore } from '../store';
import { formatDollars } from '../utils/format';

const CAS_LABELS: Record<string, string> = {
  CAS10: 'Pre-construction',
  CAS21: 'Buildings',
  CAS22: 'Reactor Equipment',
  CAS23: 'Turbine Plant',
  CAS24: 'Electrical',
  CAS25: 'Misc Equipment',
  CAS26: 'Heat Rejection',
  CAS27: 'Special Materials',
  CAS28: 'Digital Twin',
  CAS29: 'Contingency',
  CAS30: 'Indirect Costs',
  CAS40: "Owner's Costs",
  CAS50: 'Supplementary',
  CAS60: 'Interest During Constr.',
};

const CAS22_LABELS: Record<string, string> = {
  C220101: 'First Wall/Blanket',
  C220102: 'Shield',
  C220103: 'Coils',
  C220104: 'Heating',
  C220105: 'Structure',
  C220106: 'Vacuum',
  C220107: 'Power Supplies',
  C220108: 'Divertor/Target',
  C220109: 'DEC',
  C220110: 'Remote Handling',
  C220111: 'Installation',
  C220112: 'Isotope Sep.',
  C220200: 'Coolant Systems',
  C220300: 'Aux Cooling',
  C220400: 'Rad Waste',
  C220500: 'Fuel Handling',
  C220600: 'Other Equipment',
  C220700: 'I&C',
};

export function CostBreakdown() {
  const { result } = useDashboardStore();
  const [showDetail, setShowDetail] = useState(false);

  if (!result) return null;

  const { costs, total_capital } = result;

  // Main CAS accounts (capital)
  const mainAccounts = Object.entries(CAS_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      value: (costs[key] as number) ?? 0,
    }))
    .filter((a) => a.value > 0);

  // CAS22 sub-accounts
  const cas22Detail = Object.entries(CAS22_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      value: (costs[key] as number) ?? 0,
    }))
    .filter((a) => a.value > 0);

  // Annualized costs
  const annualized = [
    { key: 'CAS90', label: 'Capital Recovery', value: costs.CAS90 ?? 0 },
    { key: 'CAS71', label: 'Annual O&M', value: costs.CAS71 ?? 0 },
    { key: 'CAS72', label: 'Scheduled Replacement', value: costs.CAS72 ?? 0 },
    { key: 'CAS80', label: 'Fuel', value: costs.CAS80 ?? 0 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Cost Breakdown
      </h3>

      {/* Capital accounts */}
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
        Capital ({formatDollars(total_capital)})
      </div>
      <div className="space-y-1 mb-4">
        {mainAccounts.map((a) => (
          <CostRow
            key={a.key}
            label={a.label}
            value={a.value}
            total={total_capital}
            highlight={a.key === 'CAS22'}
          />
        ))}
      </div>

      {/* CAS22 detail toggle */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="text-xs text-fusion-500 hover:text-fusion-600 mb-3"
      >
        {showDetail ? 'Hide' : 'Show'} CAS22 detail
      </button>
      {showDetail && (
        <div className="space-y-1 mb-4 pl-4 border-l-2 border-fusion-200 dark:border-fusion-800">
          {cas22Detail.map((a) => (
            <CostRow
              key={a.key}
              label={a.label}
              value={a.value}
              total={costs.CAS22 ?? 1}
            />
          ))}
        </div>
      )}

      {/* Annualized costs */}
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 pt-3 border-t border-gray-200 dark:border-gray-700">
        Annualized (M$/yr)
      </div>
      <div className="space-y-1">
        {annualized.map((a) => (
          <div
            key={a.key}
            className="flex justify-between text-sm py-0.5"
          >
            <span className="text-gray-600 dark:text-gray-300">
              {a.label}
            </span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              ${a.value.toFixed(1)}M
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CostRow({
  label,
  value,
  total,
  highlight,
}: {
  label: string;
  value: number;
  total: number;
  highlight?: boolean;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm py-0.5">
      <span
        className={`flex-1 ${highlight ? 'font-medium text-fusion-600 dark:text-fusion-400' : 'text-gray-600 dark:text-gray-300'}`}
      >
        {label}
      </span>
      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded h-1.5">
        <div
          className="bg-fusion-500 h-1.5 rounded transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <span className="font-mono text-xs text-gray-500 w-16 text-right">
        ${value.toFixed(0)}M
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PowerTable.tsx frontend/src/components/CostBreakdown.tsx
git commit -m "feat: add PowerTable and CostBreakdown components"
```

---

## Task 12: Frontend — SensitivityChart (Tornado Diagram)

**Files:**
- Create: `frontend/src/components/SensitivityChart.tsx`

- [ ] **Step 1: Create SensitivityChart**

Horizontal bar chart showing parameter elasticities, sorted by absolute value. Uses Recharts BarChart.

```typescript
// frontend/src/components/SensitivityChart.tsx

import { useDashboardStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PARAM_LABELS: Record<string, string> = {
  availability: 'Availability',
  eta_th: 'Thermal Eff.',
  interest_rate: 'Interest Rate',
  blanket_t: 'Blanket Thickness',
  p_input: 'Heating Power',
  eta_pin: 'Heating Eff.',
  construction_time_yr: 'Construction Time',
  eta_p: 'Pumping Eff.',
  mn: 'Neutron Multiplier',
  f_sub: 'Subsystem Frac.',
  p_pump: 'Pump Power',
  p_trit: 'Tritium Power',
  inflation_rate: 'Inflation',
  R0: 'Major Radius',
  plasma_t: 'Plasma Size',
  elon: 'Elongation',
  ht_shield_t: 'Shield Thickness',
  eta_de: 'DEC Efficiency',
  f_dec: 'DEC Fraction',
  p_coils: 'Coil Power',
  p_cool: 'Cooling Power',
  lifetime_yr: 'Plant Lifetime',
};

export function SensitivityChart() {
  const { result } = useDashboardStore();
  if (!result?.sensitivity) return null;

  const { engineering, financial, costing } = result.sensitivity;

  // Combine all, take top 15 by absolute elasticity
  const all = [
    ...Object.entries(engineering).map(([k, v]) => ({
      name: PARAM_LABELS[k] || k,
      elasticity: v,
      category: 'Engineering',
    })),
    ...Object.entries(financial).map(([k, v]) => ({
      name: PARAM_LABELS[k] || k,
      elasticity: v,
      category: 'Financial',
    })),
    ...Object.entries(costing)
      .filter(([_, v]) => Math.abs(v) > 0.01)
      .slice(0, 10)
      .map(([k, v]) => ({
        name: k.replace(/^cc_/, '').replace(/_/g, ' '),
        elasticity: v,
        category: 'Costing',
      })),
  ]
    .sort((a, b) => Math.abs(b.elasticity) - Math.abs(a.elasticity))
    .slice(0, 15);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Sensitivity (Elasticity)
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        % change in LCOE per % change in parameter
      </p>
      <ResponsiveContainer width="100%" height={all.length * 28 + 20}>
        <BarChart
          data={all}
          layout="vertical"
          margin={{ left: 100, right: 30, top: 5, bottom: 5 }}
        >
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11 }}
            width={95}
          />
          <Tooltip
            formatter={(v: number) =>
              `${v > 0 ? '+' : ''}${(v * 100).toFixed(1)}%`
            }
          />
          <Bar dataKey="elasticity" radius={[0, 4, 4, 0]}>
            {all.map((entry, idx) => (
              <Cell
                key={idx}
                fill={
                  entry.category === 'Financial'
                    ? '#8b5cf6'
                    : entry.category === 'Costing'
                      ? '#f59e0b'
                      : entry.elasticity > 0
                        ? '#ef4444'
                        : '#22c55e'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs text-gray-400 mt-2">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500" /> +LCOE
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500" /> -LCOE
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-500" /> Financial
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500" /> Costing
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/SensitivityChart.tsx
git commit -m "feat: add SensitivityChart tornado diagram"
```

---

## Task 13: Frontend — CostOverridesPanel

**Files:**
- Create: `frontend/src/components/CostOverridesPanel.tsx`

- [ ] **Step 1: Create CostOverridesPanel**

Allows direct CAS account cost overrides (M$). Shows the calculated value and lets users type an override.

```typescript
// frontend/src/components/CostOverridesPanel.tsx

import { useState } from 'react';
import { useDashboardStore } from '../store';

const OVERRIDABLE_ACCOUNTS = [
  { key: 'CAS10', label: 'Pre-construction' },
  { key: 'CAS21', label: 'Buildings' },
  { key: 'CAS22', label: 'Reactor Equipment' },
  { key: 'CAS23', label: 'Turbine Plant' },
  { key: 'CAS24', label: 'Electrical' },
  { key: 'CAS25', label: 'Misc Equipment' },
  { key: 'CAS26', label: 'Heat Rejection' },
  { key: 'CAS27', label: 'Special Materials' },
  { key: 'C220101', label: '  First Wall/Blanket' },
  { key: 'C220102', label: '  Shield' },
  { key: 'C220103', label: '  Coils' },
  { key: 'C220104', label: '  Heating' },
  { key: 'C220108', label: '  Divertor/Target' },
  { key: 'C220110', label: '  Remote Handling' },
  { key: 'C220500', label: '  Fuel Handling' },
];

export function CostOverridesPanel() {
  const { result, params, setParam } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!result) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-semibold text-gray-800 dark:text-gray-100"
      >
        <span>Cost Account Overrides (M$)</span>
        <span
          className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          {'\u25B6'}
        </span>
      </button>
      {isOpen && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-gray-400 mb-2">
            Override any CAS account with a fixed M$ value. Leave blank
            to use calculated value.
          </p>
          {OVERRIDABLE_ACCOUNTS.map((acc) => {
            const calculated = (result.costs[acc.key] as number) ?? 0;
            const overrideValue = params[acc.key] as number | undefined;
            const isOverridden = overrideValue !== undefined;

            return (
              <div
                key={acc.key}
                className="flex items-center gap-2 text-sm"
              >
                <span className="flex-1 text-gray-600 dark:text-gray-300 truncate">
                  {acc.label}
                </span>
                <span className="text-xs text-gray-400 w-16 text-right font-mono">
                  ${calculated.toFixed(0)}M
                </span>
                <input
                  type="number"
                  placeholder="—"
                  value={isOverridden ? overrideValue : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      // Remove override - set to undefined by removing from params
                      const newParams = { ...params };
                      delete newParams[acc.key];
                      // We need setParams for this
                      setParam(acc.key, undefined);
                    } else {
                      setParam(acc.key, Number(val));
                    }
                  }}
                  className={`w-20 text-right text-sm font-mono rounded border px-1 py-0.5 ${
                    isOverridden
                      ? 'border-fusion-500 bg-fusion-50 dark:bg-fusion-900/20 text-fusion-600'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400'
                  }`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/CostOverridesPanel.tsx
git commit -m "feat: add CostOverridesPanel for direct CAS overrides"
```

---

## Task 14: Frontend — App Layout & Wiring

**Files:**
- Rewrite: `frontend/src/App.tsx`
- Modify: `frontend/src/components/FeasibilityIndicator.tsx`

- [ ] **Step 1: Rewrite App.tsx**

New 3-column layout:
- Left: LCOE display + power table + feasibility
- Middle: primary controls + high sensitivity + engineering params
- Right: cost breakdown + sensitivity chart + costing constants + overrides

```typescript
// frontend/src/App.tsx

import { useEffect } from 'react';
import { useDashboardStore } from './store';
import { useDarkMode } from './hooks/useDarkMode';
import { PrimaryControls } from './components/PrimaryControls';
import { LCOEDisplay } from './components/LCOEDisplay';
import { HighSensitivityPanel } from './components/HighSensitivityPanel';
import { EngineeringPanel } from './components/EngineeringPanel';
import { CostingConstantsPanel } from './components/CostingConstantsPanel';
import { CostOverridesPanel } from './components/CostOverridesPanel';
import { PowerTable } from './components/PowerTable';
import { CostBreakdown } from './components/CostBreakdown';
import { SensitivityChart } from './components/SensitivityChart';
import { FeasibilityIndicator } from './components/FeasibilityIndicator';

function App() {
  const { isDark, toggle } = useDarkMode();
  const { loadDefaults, loading, error } = useDashboardStore();

  // Load defaults on mount
  useEffect(() => {
    loadDefaults();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Fusion{' '}
                <span className="text-fusion-500">LCOE Dashboard</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by 1costingfe — explore all parameters that drive
                fusion electricity cost
              </p>
            </div>
            <div className="flex items-center gap-3">
              {loading && (
                <span className="text-xs text-fusion-500 animate-pulse">
                  Calculating...
                </span>
              )}
              {error && (
                <span className="text-xs text-red-500 max-w-xs truncate">
                  {error}
                </span>
              )}
              <button
                onClick={() => useDashboardStore.getState().resetToDefaults()}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Reset
              </button>
              <button
                onClick={toggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={
                  isDark
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
              >
                {isDark ? (
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Controls */}
      <div className="max-w-[1600px] mx-auto px-4 py-3">
        <PrimaryControls />
      </div>

      {/* Main Content — 3 columns */}
      <main className="max-w-[1600px] mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Results */}
          <div className="space-y-6">
            <LCOEDisplay />
            <PowerTable />
            <FeasibilityIndicator />
          </div>

          {/* Middle Column — Parameter Controls */}
          <div className="space-y-6">
            <HighSensitivityPanel />
            <EngineeringPanel />
          </div>

          {/* Right Column — Breakdown & Advanced */}
          <div className="space-y-6">
            <CostBreakdown />
            <SensitivityChart />
            <CostingConstantsPanel />
            <CostOverridesPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Simplify FeasibilityIndicator to use backend LCOE**

Update `FeasibilityIndicator.tsx` to read from `useDashboardStore` instead of `useFusionStore`, and show green/yellow/red based on LCOE value ranges.

```typescript
// frontend/src/components/FeasibilityIndicator.tsx

import { useDashboardStore } from '../store';

export function FeasibilityIndicator() {
  const { result } = useDashboardStore();
  if (!result) return null;

  const lcoe = result.lcoe;
  const rec = result.power_table.rec_frac;

  // Status based on LCOE thresholds
  let status: 'green' | 'yellow' | 'red';
  let message: string;

  if (lcoe <= 10) {
    status = 'green';
    message = `Competitive: $${lcoe.toFixed(2)}/MWh is below $10/MWh target`;
  } else if (lcoe <= 30) {
    status = 'yellow';
    message = `Moderate: $${lcoe.toFixed(2)}/MWh — between $10-30/MWh`;
  } else {
    status = 'red';
    message = `Expensive: $${lcoe.toFixed(2)}/MWh exceeds $30/MWh`;
  }

  // Warn about recirculating fraction
  if (rec > 0.5) {
    message += ` | High recirculating fraction: ${(rec * 100).toFixed(0)}%`;
  }

  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-4 h-4 rounded-full ${colors[status]} pulse-${status}`}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {message}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/FeasibilityIndicator.tsx
git commit -m "feat: wire up App layout and update FeasibilityIndicator"
```

---

## Task 15: Cleanup — Remove Old Files

**Files:**
- Delete old files that are now replaced

- [ ] **Step 1: Remove old frontend files**

```bash
cd /mnt/c/Users/talru/1cfe/fusion-backcasting
rm frontend/src/components/FuelTypeSelector.tsx
rm frontend/src/components/ConfinementTypeSelector.tsx
rm frontend/src/components/FinancialPanel.tsx
rm frontend/src/components/SubsystemPanel.tsx
rm frontend/src/components/SubsystemCard.tsx
rm frontend/src/components/SolveForButtons.tsx
rm frontend/src/components/CapitalBreakdownChart.tsx
rm frontend/src/utils/calculations.ts
```

- [ ] **Step 2: Remove old backend files**

```bash
rm -f backend/routes/lcoe.py
rm -f backend/routes/solver.py
rm -f backend/services/lcoe_calculator.py
rm -f backend/services/constraint_solver.py
rm -f backend/services/feasibility.py
rm -f backend/services/costingfe_adapter.py
rm -f backend/models/fuel_type.py
rm -f backend/models/subsystem.py
rm -f backend/data/default_subsystems.json
```

Clean up `__init__.py` files that may import deleted modules:
```bash
# Clear old route/model __init__.py re-exports
echo "" > backend/routes/__init__.py
echo "" > backend/models/__init__.py
echo "" > backend/services/__init__.py
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove old lookup-table frontend and backend files"
```

---

## Task 16: Integration Testing

- [ ] **Step 1: Start backend**

```bash
cd /mnt/c/Users/talru/1cfe/fusion-backcasting
pip install -e ../1costingfe
uvicorn backend.main:app --port 8000 --reload
```

- [ ] **Step 2: Start frontend**

```bash
cd /mnt/c/Users/talru/1cfe/fusion-backcasting/frontend
npm install
npm run dev
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:5173 and verify:
1. LCOE value appears (should be ~45 $/MWh for default DT tokamak)
2. Concept dropdown works (8 options, grouped by MFE/IFE/MIF)
3. Fuel buttons switch (DT, DD, DHe3, pB11) and LCOE updates
4. High-sensitivity sliders update LCOE in real-time (~300ms debounce)
5. Engineering panel sections expand/collapse
6. Costing constants accordion works
7. Cost breakdown shows all CAS accounts
8. Sensitivity tornado chart renders with correct elasticities
9. Power table shows p_fus, p_th, p_et, p_net, Q values
10. Dark mode toggle works
11. Reset button restores defaults
12. Concept change reloads defaults (parameters change for IFE vs MFE)

- [ ] **Step 4: Fix any TypeScript errors**

```bash
cd /mnt/c/Users/talru/1cfe/fusion-backcasting/frontend
npx tsc --noEmit
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete 1costingfe LCOE dashboard replacing fusion-backcasting"
```

---

## Notes

### Parameter Sensitivity Ranking (from JAX autodiff on DT tokamak reference case)

The sensitivity ranking determines which parameters appear in Tier 2 (always visible) vs Tier 3 (collapsible):

| Rank | Parameter | Elasticity | Tier |
|------|-----------|-----------|------|
| 1 | availability | ~-0.6 | 2 |
| 2 | eta_th | ~-0.5 | 2 |
| 3 | interest_rate | ~+0.4 | 2 |
| 4 | blanket_unit_cost_dt | ~+0.2 | 4 (CC) |
| 5 | blanket_t | ~+0.2 | 2 |
| 6 | p_input | ~+0.15 | 2 |
| 7 | eta_pin | ~-0.15 | 2 |
| 8 | construction_time_yr | ~+0.08 | 2 |
| 9 | mn | ~-0.08 | 3 |
| 10 | eta_p | ~-0.07 | 3 |

### Key Design Decisions

1. **Server-side only calculation**: No client-side LCOE duplication. All math runs through 1costingfe on the backend. This ensures consistency and gives us sensitivity analysis via JAX autodiff.

2. **Debounced API calls (300ms)**: Prevents API flooding during slider drag. Good balance between responsiveness and server load.

3. **`cc_` prefix for costing constants**: Frontend uses `cc_blanket_unit_cost_dt` which the backend strips to `blanket_unit_cost_dt` for CostingConstants overrides. This avoids key collisions with engineering params.

4. **Same styling as fusion-backcasting**: Same Tailwind config, `fusion` color palette, dark mode, slider styling, card patterns, collapsible sections.

5. **All parameters present**: Every 1costingfe parameter exists on the dashboard. Tier 1-2 are always visible. Tier 3 is collapsible. Tier 4-5 are in expandable accordions.
