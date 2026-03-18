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

  const mainAccounts = Object.entries(CAS_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      value: (costs[key] as number) ?? 0,
    }))
    .filter((a) => a.value > 0);

  const cas22Detail = Object.entries(CAS22_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      value: (costs[key] as number) ?? 0,
    }))
    .filter((a) => a.value > 0);

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
