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
    title: 'CAS22 \u2014 Reactor Equipment Unit Costs',
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
    title: 'CAS22 \u2014 Heating Costs',
    params: [
      { key: 'cc_heating_nbi_per_mw', label: 'NBI', min: 2, max: 15, step: 0.5, unit: 'M$/MW' },
      { key: 'cc_heating_icrf_per_mw', label: 'ICRF', min: 1, max: 10, step: 0.5, unit: 'M$/MW' },
      { key: 'cc_heating_ecrh_per_mw', label: 'ECRH', min: 1, max: 12, step: 0.5, unit: 'M$/MW' },
      { key: 'cc_heating_lhcd_per_mw', label: 'LHCD', min: 1, max: 10, step: 0.5, unit: 'M$/MW' },
    ],
  },
  {
    title: 'CAS22 \u2014 Remote Handling & Fuel',
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
    title: 'CAS23-29 \u2014 BOP & Other Direct',
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
    title: 'CAS30-50 \u2014 Indirect & Supplementary',
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
    title: 'CAS70 \u2014 O&M & Replacement',
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
    title: 'CAS80 \u2014 Fuel Costs',
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
        Unit costs, base costs, and calibration parameters for each CAS account.
      </p>
      <div className="space-y-0.5">
        {CC_GROUPS.map((group) => (
          <div
            key={group.title}
            className="border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <button
              onClick={() =>
                setOpenGroup(openGroup === group.title ? null : group.title)
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
