export type ConfinementConcept =
  | 'tokamak' | 'stellarator' | 'mirror'
  | 'laser_ife' | 'zpinch' | 'heavy_ion'
  | 'mag_target' | 'plasma_jet';

export type FuelType = 'dt' | 'dd' | 'dhe3' | 'pb11';

export type PowerCycle = 'rankine' | 'brayton_sco2' | 'combined' | 'custom';

export type ConfinementFamily = 'steady_state' | 'pulsed';

export type PulsedConversion = 'thermal' | 'inductive_dec';

export const CONCEPT_TO_FAMILY: Record<ConfinementConcept, ConfinementFamily> = {
  tokamak: 'steady_state', stellarator: 'steady_state', mirror: 'steady_state',
  laser_ife: 'pulsed', zpinch: 'pulsed', heavy_ion: 'pulsed',
  mag_target: 'pulsed', plasma_jet: 'pulsed',
};

export interface PowerTable {
  p_fus: number;
  p_th: number;
  p_et: number;
  p_net: number;
  q_sci: number;
  q_eng: number;
  rec_frac: number;
  e_driver_mj?: number;
  e_stored_mj?: number;
  f_rep?: number;
  f_ch?: number;
  p_dee?: number;
}

export interface CostBreakdown {
  [key: string]: number;
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

export interface ParamMeta {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
  format?: (v: number) => string;
  families?: ConfinementFamily[];
  group?: string;
}
