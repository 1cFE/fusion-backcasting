import { useState } from 'react';
import { useDashboardStore } from '../store';
import { SliderInput } from './SliderInput';
import { CONCEPT_TO_FAMILY } from '../types/costing';
import { formatPct, formatMW, formatMeters, formatYears } from '../utils/format';

interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  description?: string;
}

const POWER_BALANCE: ParamDef[] = [
  { key: 'eta_p', label: 'Pumping Efficiency', min: 0.3, max: 0.95, step: 0.05, format: formatPct },
  { key: 'mn', label: 'Neutron Multiplier', min: 1.0, max: 1.5, step: 0.05, format: (v) => v.toFixed(2) },
  { key: 'f_sub', label: 'Subsystem Fraction', min: 0.01, max: 0.10, step: 0.005, format: formatPct },
  { key: 'eta_de', label: 'DEC Efficiency', min: 0.0, max: 0.95, step: 0.05, format: formatPct },
  { key: 'f_dec', label: 'DEC Fraction', min: 0.0, max: 1.0, step: 0.05, format: formatPct },
];

const PARASITIC_COMMON: ParamDef[] = [
  { key: 'p_pump', label: 'Pumping Power', min: 0.5, max: 10, step: 0.5, format: formatMW },
  { key: 'p_trit', label: 'Tritium Processing', min: 0, max: 30, step: 1, format: formatMW },
  { key: 'p_house', label: 'Housekeeping', min: 1, max: 15, step: 1, format: formatMW },
  { key: 'p_cryo', label: 'Cryogenics', min: 0.1, max: 5, step: 0.1, format: formatMW },
];

const PARASITIC_MFE: ParamDef[] = [
  { key: 'p_coils', label: 'Coil Power', min: 0.5, max: 20, step: 0.5, format: formatMW },
  { key: 'p_cool', label: 'Cooling Power', min: 5, max: 50, step: 1, format: formatMW },
];

const PARASITIC_IFE: ParamDef[] = [
  { key: 'p_implosion', label: 'Implosion Driver', min: 1, max: 50, step: 1, format: formatMW },
  { key: 'p_ignition', label: 'Ignition Laser', min: 0.01, max: 5, step: 0.01, format: formatMW },
  { key: 'eta_pin1', label: 'Driver 1 Efficiency', min: 0.05, max: 0.50, step: 0.01, format: formatPct },
  { key: 'eta_pin2', label: 'Driver 2 Efficiency', min: 0.05, max: 0.50, step: 0.01, format: formatPct },
  { key: 'p_target', label: 'Target Factory', min: 0.1, max: 10, step: 0.1, format: formatMW },
];

const PARASITIC_MIF: ParamDef[] = [
  { key: 'p_driver', label: 'Driver Power', min: 1, max: 100, step: 1, format: formatMW },
  { key: 'p_target', label: 'Target Factory', min: 0.1, max: 10, step: 0.1, format: formatMW },
  { key: 'p_coils', label: 'Coil Power', min: 0, max: 10, step: 0.5, format: formatMW },
];

const GEOMETRY: ParamDef[] = [
  { key: 'R0', label: 'Major Radius', min: 1, max: 10, step: 0.1, format: formatMeters },
  { key: 'plasma_t', label: 'Plasma Size', min: 0.5, max: 5, step: 0.1, format: formatMeters },
  { key: 'elon', label: 'Elongation', min: 1.0, max: 3.5, step: 0.1, format: (v) => `${v.toFixed(1)}` },
  { key: 'ht_shield_t', label: 'HT Shield', min: 0.05, max: 0.50, step: 0.05, format: formatMeters },
  { key: 'structure_t', label: 'Structure', min: 0.05, max: 0.40, step: 0.05, format: formatMeters },
  { key: 'vessel_t', label: 'Vessel', min: 0.05, max: 0.40, step: 0.05, format: formatMeters },
];

const FINANCIAL: ParamDef[] = [
  { key: 'lifetime_yr', label: 'Plant Lifetime', min: 20, max: 60, step: 5, format: formatYears },
  { key: 'inflation_rate', label: 'Inflation Rate', min: 0.0, max: 0.05, step: 0.005, format: formatPct },
];

export function EngineeringPanel() {
  const { params, defaults, concept, setParam } = useDashboardStore();
  const family = CONCEPT_TO_FAMILY[concept];

  const parasiticFamily =
    family === 'ife' ? PARASITIC_IFE
    : family === 'mif' ? PARASITIC_MIF
    : PARASITIC_MFE;

  const sections = [
    { title: 'Power Balance', params: POWER_BALANCE },
    { title: 'Parasitic Power', params: [...PARASITIC_COMMON, ...parasiticFamily] },
    { title: 'Geometry', params: GEOMETRY },
    { title: 'Financial', params: FINANCIAL },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Engineering Parameters
      </h3>
      <div className="space-y-1">
        {sections.map((section) => (
          <CollapsibleSection
            key={section.title}
            title={section.title}
            paramDefs={section.params}
            params={params}
            defaults={defaults}
            onParamChange={setParam}
          />
        ))}
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  paramDefs,
  params,
  defaults,
  onParamChange,
}: {
  title: string;
  paramDefs: ParamDef[];
  params: Record<string, unknown>;
  defaults: Record<string, unknown>;
  onParamChange: (key: string, value: unknown) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const available = paramDefs.filter(
    (p) => defaults[p.key] !== undefined
  );
  if (available.length === 0) return null;

  return (
    <div className="border-b border-gray-100 dark:border-gray-700 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <span>{title}</span>
        <span
          className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
        >
          {'\u25B6'}
        </span>
      </button>
      {isOpen && (
        <div className="pb-3 space-y-3">
          {available.map((p) => (
            <SliderInput
              key={p.key}
              label={p.label}
              value={(params[p.key] as number) ?? (defaults[p.key] as number) ?? 0}
              defaultValue={(defaults[p.key] as number) ?? 0}
              min={p.min}
              max={p.max}
              step={p.step}
              format={p.format}
              description={p.description}
              onChange={(v) => onParamChange(p.key, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
