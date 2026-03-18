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
            <div key={s.key}>
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
                onChange={(v) => setParam(s.key, v)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
