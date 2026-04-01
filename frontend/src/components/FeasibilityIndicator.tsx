import { useDashboardStore } from '../store';

const BENCHMARKS = [
  { label: 'CCNG', lcoe: 45, color: '#60a5fa' },
  { label: 'Coal', lcoe: 65, color: '#9ca3af' },
  { label: 'Nuclear', lcoe: 90, color: '#a78bfa' },
];

const SCALE_MAX = 150;

export function FeasibilityIndicator() {
  const { result } = useDashboardStore();
  if (!result) return null;

  const lcoe = result.lcoe;
  const rec = result.power_table.rec_frac;
  const fusionPct = Math.min(100, (lcoe / SCALE_MAX) * 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
        Baseload Comparison
      </h3>
      <p className="text-xs text-gray-400 mb-4">$/MWh</p>

      {/* Track */}
      <div className="relative h-8 mb-6">
        {/* Background bar */}
        <div className="absolute top-3 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded" />

        {/* Fusion marker (triangle) */}
        <div
          className="absolute top-0 transition-all duration-300"
          style={{ left: `${fusionPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-fusion-500 whitespace-nowrap">
              ${lcoe.toFixed(0)}
            </span>
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: '6px solid var(--color-fusion-500, #8b5cf6)',
              }}
            />
          </div>
        </div>

        {/* Benchmark tick marks */}
        {BENCHMARKS.map((b) => {
          const pct = (b.lcoe / SCALE_MAX) * 100;
          return (
            <div
              key={b.label}
              className="absolute transition-all"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)', top: '10px' }}
            >
              <div
                className="w-0.5 h-4 mx-auto"
                style={{ backgroundColor: b.color }}
              />
              <span className="block text-center text-xs text-gray-500 dark:text-gray-400 mt-0.5 whitespace-nowrap">
                {b.label}
                <span className="text-gray-400 dark:text-gray-500"> ${b.lcoe}</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Spacer for labels */}
      <div className="h-4" />

      {rec > 0.5 && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400">
          High recirculating fraction: {(rec * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}
