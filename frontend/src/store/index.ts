import { create } from 'zustand';
import type { CostingResult, ConfinementConcept, FuelType, PowerCycle } from '../types/costing';
import { fetchDefaults, fetchPowerCyclePresets, calculateLCOE } from '../api/costing';

interface DashboardStore {
  // Input state
  params: Record<string, unknown>;
  defaults: Record<string, unknown>;
  concept: ConfinementConcept;
  fuel: FuelType;
  powerCycle: PowerCycle;
  powerCyclePresets: Record<string, Record<string, number>>;

  // Output state
  result: CostingResult | null;
  loading: boolean;
  error: string | null;

  // Actions
  setConcept: (concept: ConfinementConcept) => void;
  setFuel: (fuel: FuelType) => void;
  setPowerCycle: (cycle: PowerCycle) => void;
  setParam: (key: string, value: unknown) => void;
  setParams: (updates: Record<string, unknown>) => void;
  zeroCoreAccounts: () => void;
  restoreCoreAccounts: () => void;
  resetToDefaults: () => void;
  loadDefaults: () => Promise<void>;
  recalculate: () => Promise<void>;
}

let recalcTimer: ReturnType<typeof setTimeout> | null = null;

const CORE_ACCOUNTS = [
  'C220101', 'C220102', 'C220103', 'C220104', 'C220105', 'C220106',
  'C220107', 'C220108', 'C220109', 'C220110', 'C220111', 'C220112',
];

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  params: {},
  defaults: {},
  concept: 'tokamak',
  fuel: 'dt',
  powerCycle: 'rankine',
  powerCyclePresets: {},
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

  setPowerCycle: (cycle) => {
    const { powerCyclePresets, params } = get();
    if (cycle === 'custom') {
      // Keep current eta_th, just remove power_cycle from params
      const updated = { ...params };
      delete updated['power_cycle'];
      set({ powerCycle: cycle, params: updated });
      if (recalcTimer) clearTimeout(recalcTimer);
      recalcTimer = setTimeout(() => get().recalculate(), 300);
      return;
    }
    const preset = powerCyclePresets[cycle];
    if (preset) {
      // Apply preset eta_th and BOP costing constants
      const updates: Record<string, unknown> = { power_cycle: cycle };
      if (preset.eta_th !== undefined) updates.eta_th = preset.eta_th;
      if (preset.turbine_per_mw !== undefined) updates.cc_turbine_per_mw = preset.turbine_per_mw;
      if (preset.heat_rej_per_mw !== undefined) updates.cc_heat_rej_per_mw = preset.heat_rej_per_mw;
      set({ powerCycle: cycle, params: { ...params, ...updates } });
    } else {
      set({ powerCycle: cycle, params: { ...params, power_cycle: cycle } });
    }
    if (recalcTimer) clearTimeout(recalcTimer);
    recalcTimer = setTimeout(() => get().recalculate(), 300);
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

  zeroCoreAccounts: () => {
    const params = { ...get().params };
    for (const acc of CORE_ACCOUNTS) {
      params[acc] = 0;
    }
    set({ params });
    if (recalcTimer) clearTimeout(recalcTimer);
    recalcTimer = setTimeout(() => get().recalculate(), 300);
  },

  restoreCoreAccounts: () => {
    const params = { ...get().params };
    for (const acc of CORE_ACCOUNTS) {
      delete params[acc];
    }
    set({ params });
    if (recalcTimer) clearTimeout(recalcTimer);
    recalcTimer = setTimeout(() => get().recalculate(), 300);
  },

  resetToDefaults: () => {
    const defaults = get().defaults;
    set({ params: { ...defaults }, powerCycle: 'rankine' });
    get().recalculate();
  },

  loadDefaults: async () => {
    const { concept, fuel } = get();
    set({ loading: true, error: null });
    try {
      const [defaults, presets] = await Promise.all([
        fetchDefaults(concept, fuel),
        Object.keys(get().powerCyclePresets).length === 0
          ? fetchPowerCyclePresets()
          : Promise.resolve(get().powerCyclePresets),
      ]);
      set({ defaults, params: { ...defaults }, powerCyclePresets: presets, loading: false });
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
