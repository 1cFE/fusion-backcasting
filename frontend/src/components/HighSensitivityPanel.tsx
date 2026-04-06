import { useDashboardStore } from '../store';
import { SliderInput } from './SliderInput';
import { CONCEPT_TO_FAMILY } from '../types/costing';
import type { PowerCycle } from '../types/costing';
import { formatPct, formatMeters, formatMW, formatYears } from '../utils/format';

const CYCLE_LABELS: Record<string, string> = {
  rankine: 'Rankine',
  brayton_sco2: 'Brayton sCO\u2082',
  combined: 'Combined',
  custom: 'Custom',
};

export function HighSensitivityPanel() {
  const { params, defaults, concept, result, powerCycle, setParam, setPowerCycle } =
    useDashboardStore();
  const family = CONCEPT_TO_FAMILY[concept];
  const pulsedConversion = params.pulsed_conversion as string;
  const sensitivity = result?.sensitivity?.engineering ?? {};
  const isCustomEta = powerCycle === 'custom';
  const isDEC = pulsedConversion === 'inductive_dec';

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
      label: isDEC ? 'Thermal Efficiency (parallel BOP)' : 'Thermal Efficiency',
      min: 0.0, max: 0.65, step: 0.01,
      format: formatPct,
      description: isDEC
        ? 'Set to 0 for pure DEC; raise for parallel thermal cycle on neutron heat'
        : isCustomEta
          ? 'Manual override — not tied to a cycle preset'
          : `Set by ${CYCLE_LABELS[powerCycle] ?? powerCycle} cycle`,
      disabled: !isDEC && !isCustomEta,
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
    ...(family === 'steady_state'
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
    ...(family === 'pulsed' && pulsedConversion === 'inductive_dec'
      ? [
          {
            key: 'q_sci',
            label: 'Scientific Q',
            min: 1.0, max: 20, step: 0.5,
            format: (v: number) => v.toFixed(1),
            description: 'Fusion gain (P_fus / P_driver) — model derives cap bank size',
          },
          {
            key: 'f_rep',
            label: 'Rep Rate',
            min: 0.1, max: 20, step: 0.1,
            format: (v: number) => `${v.toFixed(1)} Hz`,
            description: 'Pulse repetition rate',
          },
          {
            key: 'eta_pin',
            label: 'Driver Efficiency',
            min: 0.05, max: 0.98, step: 0.01,
            format: formatPct,
            description: 'Driver wall-plug efficiency',
          },
        ]
      : family === 'pulsed'
      ? [
          {
            key: 'e_driver_mj',
            label: 'Driver Energy',
            min: 0.5, max: 200, step: 0.5,
            format: (v: number) => `${v.toFixed(1)} MJ`,
            description: 'Energy per pulse delivered to plasma',
          },
          {
            key: 'f_rep',
            label: 'Rep Rate',
            min: 0.1, max: 20, step: 0.1,
            format: (v: number) => `${v.toFixed(1)} Hz`,
            description: 'Pulse repetition rate',
          },
          {
            key: 'eta_pin',
            label: 'Driver Efficiency',
            min: 0.05, max: 0.98, step: 0.01,
            format: formatPct,
            description: 'Driver wall-plug efficiency',
          },
        ]
      : []),
    ...(family === 'pulsed' && pulsedConversion === 'inductive_dec'
      ? [
          {
            key: 'eta_dec',
            label: 'DEC Efficiency',
            min: 0.50, max: 0.98, step: 0.01,
            format: formatPct,
            description: 'Inductive energy recovery efficiency',
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

      {/* Power Cycle Selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
          Power Cycle
        </label>
        <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
          {(Object.entries(CYCLE_LABELS) as [PowerCycle, string][]).map(
            ([cycle, label]) => (
              <button
                key={cycle}
                onClick={() => setPowerCycle(cycle)}
                className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                  powerCycle === cycle
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

      <div className="space-y-4">
        {sliders.map((s) => {
          const val = (params[s.key] as number) ?? (defaults[s.key] as number) ?? 0;
          const def = (defaults[s.key] as number) ?? 0;
          const elast = sensitivity[s.key];
          const isDisabled = 'disabled' in s && s.disabled;
          return (
            <div key={s.key} className={isDisabled ? 'opacity-50' : ''}>
              <SliderInput
                label={s.label}
                value={val}
                defaultValue={def}
                min={s.min}
                max={s.max}
                step={s.step}
                format={s.format}
                description={
                  elast !== undefined
                    ? `${s.description} | elasticity: ${elast > 0 ? '+' : ''}${elast.toFixed(2)}`
                    : s.description
                }
                onChange={(v) => {
                  if (!isDisabled) setParam(s.key, v);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
