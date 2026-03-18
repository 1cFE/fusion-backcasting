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
      .filter(([, v]) => Math.abs(v) > 0.01)
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
