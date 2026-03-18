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
