export function formatDollars(v: number): string {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(0)}M`;
}

export function formatLcoe(v: number): string {
  return `$${v.toFixed(2)}/MWh`;
}

export function formatPerKw(v: number): string {
  return `$${v.toFixed(0)}/kW`;
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function formatMW(v: number): string {
  return `${v.toFixed(0)} MW`;
}

export function formatMeters(v: number): string {
  return `${v.toFixed(2)} m`;
}

export function formatYears(v: number): string {
  return `${v.toFixed(0)} yr`;
}

export function formatElasticity(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${(v * 100).toFixed(1)}%`;
}
