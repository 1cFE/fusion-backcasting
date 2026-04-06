interface SliderInputProps {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  description?: string;
  onChange: (value: number) => void;
  showInput?: boolean;
}

export function SliderInput({
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  format,
  description,
  onChange,
  showInput = false,
}: SliderInputProps) {
  const defaultPct = ((defaultValue - min) / (max - min)) * 100;
  const isAtDefault = Math.abs(value - defaultValue) < step * 0.5;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {showInput ? (
            <input
              type="number"
              value={value}
              min={min}
              max={max}
              step={step}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-20 text-right text-sm font-semibold text-fusion-600 dark:text-fusion-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-fusion-500 outline-none"
            />
          ) : (
            <span className="text-sm font-semibold text-fusion-600 dark:text-fusion-400">
              {format(value)}
            </span>
          )}
          {!isAtDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="text-xs text-gray-400 hover:text-fusion-500 transition-colors"
              title={`Reset to default: ${format(defaultValue)}`}
            >
              reset
            </button>
          )}
        </div>
      </div>
      <div className="relative overflow-hidden">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
        />
        <div
          className="absolute top-0 h-4 flex flex-col items-center pointer-events-none"
          style={{
            left: `calc(${defaultPct}% + ${7 - defaultPct * 0.14}px)`,
          }}
        >
          <div
            className={`w-0.5 h-4 ${
              isAtDefault
                ? 'bg-fusion-500'
                : 'bg-gray-400 dark:bg-gray-500'
            }`}
          />
        </div>
      </div>
      {description && (
        <div className="text-xs text-gray-400 mt-1">{description}</div>
      )}
    </div>
  );
}
