import { useEffect } from 'react';
import { useDashboardStore } from './store';
import { useDarkMode } from './hooks/useDarkMode';
import { PrimaryControls } from './components/PrimaryControls';
import { LCOEDisplay } from './components/LCOEDisplay';
import { HighSensitivityPanel } from './components/HighSensitivityPanel';
import { EngineeringPanel } from './components/EngineeringPanel';
import { CostingConstantsPanel } from './components/CostingConstantsPanel';
import { CostOverridesPanel } from './components/CostOverridesPanel';
import { PowerTable } from './components/PowerTable';
import { CostBreakdown } from './components/CostBreakdown';
import { SensitivityChart } from './components/SensitivityChart';
import { FeasibilityIndicator } from './components/FeasibilityIndicator';

function App() {
  const { isDark, toggle } = useDarkMode();
  const { loadDefaults, loading, error } = useDashboardStore();

  useEffect(() => {
    loadDefaults();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Fusion{' '}
                <span className="text-fusion-500">LCOE Dashboard</span>
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Powered by{' '}
                <a
                  href="https://github.com/1cFE/1costingfe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-fusion-500 hover:text-fusion-600 underline"
                >
                  1costingfe
                </a>
                {' '}&mdash; explore all parameters that drive fusion electricity cost
              </p>
            </div>
            <div className="flex items-center gap-3">
              {loading && (
                <span className="text-xs text-fusion-500 animate-pulse">
                  Calculating...
                </span>
              )}
              {error && (
                <span className="text-xs text-red-500 max-w-xs truncate">
                  {error}
                </span>
              )}
              <button
                onClick={() => useDashboardStore.getState().resetToDefaults()}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Reset
              </button>
              <button
                onClick={toggle}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={
                  isDark
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                }
              >
                {isDark ? (
                  <svg
                    className="w-5 h-5 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Controls */}
      <div className="max-w-[1600px] mx-auto px-4 py-3">
        <PrimaryControls />
      </div>

      {/* Main Content - 3 columns */}
      <main className="max-w-[1600px] mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Results */}
          <div className="space-y-6">
            <LCOEDisplay />
            <PowerTable />
            <FeasibilityIndicator />
          </div>

          {/* Middle Column - Parameter Controls */}
          <div className="space-y-6">
            <HighSensitivityPanel />
            <EngineeringPanel />
          </div>

          {/* Right Column - Breakdown & Advanced */}
          <div className="space-y-6">
            <CostBreakdown />
            <SensitivityChart />
            <CostingConstantsPanel />
            <CostOverridesPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
