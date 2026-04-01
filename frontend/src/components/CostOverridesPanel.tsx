import { useState } from 'react';
import { useDashboardStore } from '../store';

const OVERRIDABLE_ACCOUNTS = [
  { key: 'CAS10', label: 'Pre-construction' },
  { key: 'CAS21', label: 'Buildings' },
  { key: 'CAS22', label: 'Reactor Equipment' },
  { key: 'CAS23', label: 'Turbine Plant' },
  { key: 'CAS24', label: 'Electrical' },
  { key: 'CAS25', label: 'Misc Equipment' },
  { key: 'CAS26', label: 'Heat Rejection' },
  { key: 'CAS27', label: 'Special Materials' },
  { key: 'C220101', label: '  First Wall/Blanket' },
  { key: 'C220102', label: '  Shield' },
  { key: 'C220103', label: '  Coils' },
  { key: 'C220104', label: '  Heating' },
  { key: 'C220108', label: '  Divertor/Target' },
  { key: 'C220110', label: '  Remote Handling' },
  { key: 'C220500', label: '  Fuel Handling' },
];

export function CostOverridesPanel() {
  const { result, params, setParam } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!result) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-semibold text-gray-800 dark:text-gray-100"
      >
        <span>Cost Account Overrides (M$)</span>
        <span
          className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          {'\u25B6'}
        </span>
      </button>
      {isOpen && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-gray-400 mb-2">
            Override any CAS account with a fixed M$ value. Leave blank
            to use calculated value.
          </p>
          {OVERRIDABLE_ACCOUNTS.map((acc) => {
            const calculated = (result.costs[acc.key] as number) ?? 0;
            const overrideValue = params[acc.key] as number | undefined;
            const isOverridden = overrideValue !== undefined;

            return (
              <div
                key={acc.key}
                className="flex items-center gap-2 text-sm"
              >
                <span className="flex-1 text-gray-600 dark:text-gray-300 truncate">
                  {acc.label}
                </span>
                <span className="text-xs text-gray-400 w-16 text-right font-mono">
                  ${calculated.toFixed(0)}M
                </span>
                <input
                  type="number"
                  placeholder="—"
                  value={isOverridden ? overrideValue : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setParam(acc.key, undefined);
                    } else {
                      setParam(acc.key, Number(val));
                    }
                  }}
                  className={`w-20 text-right text-sm font-mono rounded border px-1 py-0.5 ${
                    isOverridden
                      ? 'border-fusion-500 bg-fusion-50 dark:bg-fusion-900/20 text-fusion-600'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400'
                  }`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
