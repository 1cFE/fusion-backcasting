import type { CostingResult } from '../types/costing';

const API_BASE = '/api/costing';

export async function fetchConcepts(): Promise<{
  concepts: string[];
  fuels: string[];
  concept_labels: Record<string, string>;
  fuel_labels: Record<string, string>;
}> {
  const res = await fetch(`${API_BASE}/concepts`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchPowerCyclePresets(): Promise<
  Record<string, Record<string, number>>
> {
  const res = await fetch(`${API_BASE}/power-cycles`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.presets;
}

export async function fetchDefaults(
  concept: string,
  fuel: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/defaults`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept, fuel }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.defaults;
}

export async function calculateLCOE(
  params: Record<string, unknown>
): Promise<CostingResult> {
  const res = await fetch(`${API_BASE}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
