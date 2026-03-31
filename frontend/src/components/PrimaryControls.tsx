import { useDashboardStore } from '../store';
import type { ConfinementConcept, FuelType } from '../types/costing';

const CONCEPT_LABELS: Record<ConfinementConcept, string> = {
  tokamak: 'Tokamak',
  stellarator: 'Stellarator',
  mirror: 'Mirror',
  laser_ife: 'Laser IFE',
  zpinch: 'Z-Pinch',
  heavy_ion: 'Heavy Ion',
  mag_target: 'Mag. Target',
  plasma_jet: 'Plasma Jet',
};

const CONCEPT_GROUPS = {
  MFE: ['tokamak', 'stellarator', 'mirror'] as ConfinementConcept[],
  IFE: ['laser_ife', 'zpinch', 'heavy_ion'] as ConfinementConcept[],
  MIF: ['mag_target', 'plasma_jet'] as ConfinementConcept[],
};

const FUEL_LABELS: Record<FuelType, string> = {
  dt: 'D-T',
  dd: 'D-D',
  dhe3: 'D-He3',
  pb11: 'p-B11',
};

const CORE_ACCOUNTS = [
  'C220101', 'C220102', 'C220103', 'C220104', 'C220105', 'C220106',
  'C220107', 'C220108', 'C220109', 'C220110', 'C220111', 'C220112',
];

export function PrimaryControls() {
  const { concept, fuel, params, setConcept, setFuel, setParam, zeroCoreAccounts, restoreCoreAccounts } =
    useDashboardStore();

  const netMw = (params.net_electric_mw as number) ?? 1000;
  const noak = (params.noak as boolean) ?? true;
  const nMod = (params.n_mod as number) ?? 1;
  const coreIsZeroed = CORE_ACCOUNTS.every((k) => params[k] === 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Concept selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Concept
          </label>
          <select
            value={concept}
            onChange={(e) =>
              setConcept(e.target.value as ConfinementConcept)
            }
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-3 py-1.5 text-gray-900 dark:text-gray-100"
          >
            {Object.entries(CONCEPT_GROUPS).map(([family, concepts]) => (
              <optgroup key={family} label={family}>
                {concepts.map((c) => (
                  <option key={c} value={c}>
                    {CONCEPT_LABELS[c]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Fuel selector */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Fuel
          </label>
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
            {(Object.entries(FUEL_LABELS) as [FuelType, string][]).map(
              ([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFuel(f)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    fuel === f
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

        {/* Net Electric Power */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Net Power
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={netMw}
              min={100}
              max={2000}
              step={50}
              onChange={(e) =>
                setParam('net_electric_mw', Number(e.target.value))
              }
              className="w-20 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-1.5 text-right text-gray-900 dark:text-gray-100"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              MW
            </span>
          </div>
        </div>

        {/* N Modules */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Modules
          </label>
          <input
            type="number"
            value={nMod}
            min={1}
            max={10}
            step={1}
            onChange={(e) => setParam('n_mod', Number(e.target.value))}
            className="w-14 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm px-2 py-1.5 text-center text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* FOAK/NOAK */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Maturity
          </label>
          <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setParam('noak', false)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                !noak
                  ? 'bg-fusion-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              FOAK
            </button>
            <button
              onClick={() => setParam('noak', true)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                noak
                  ? 'bg-fusion-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              NOAK
            </button>
          </div>
        </div>

        {/* Zero / Restore Core */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Core (CAS22)
          </label>
          {coreIsZeroed ? (
            <button
              onClick={restoreCoreAccounts}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-green-400 dark:border-green-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              Restore Core
            </button>
          ) : (
            <button
              onClick={zeroCoreAccounts}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Zero Core
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
