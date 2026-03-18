import { useDashboardStore } from '../store';
import { formatDollars, formatPerKw } from '../utils/format';

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
