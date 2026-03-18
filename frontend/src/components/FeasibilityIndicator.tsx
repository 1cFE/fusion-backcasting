import { useDashboardStore } from '../store';

export function FeasibilityIndicator() {
  const { result } = useDashboardStore();
  if (!result) return null;

  const lcoe = result.lcoe;
  const rec = result.power_table.rec_frac;

  let status: 'green' | 'yellow' | 'red';
  let message: string;

  if (lcoe <= 10) {
    status = 'green';
    message = `Competitive: $${lcoe.toFixed(2)}/MWh is below $10/MWh target`;
  } else if (lcoe <= 30) {
    status = 'yellow';
    message = `Moderate: $${lcoe.toFixed(2)}/MWh \u2014 between $10-30/MWh`;
  } else {
    status = 'red';
    message = `Expensive: $${lcoe.toFixed(2)}/MWh exceeds $30/MWh`;
  }

  if (rec > 0.5) {
    message += ` | High recirculating fraction: ${(rec * 100).toFixed(0)}%`;
  }

  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-4 h-4 rounded-full ${colors[status]} pulse-${status}`}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {message}
        </span>
      </div>
    </div>
  );
}
