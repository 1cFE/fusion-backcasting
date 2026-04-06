import { useDashboardStore } from '../store';

export function PowerTable() {
  const { result, params } = useDashboardStore();
  if (!result) return null;

  const pt = result.power_table;
  const pulsedConversion = params.pulsed_conversion as string;
  const rows = [
    { label: 'Fusion Power', value: pt.p_fus, unit: 'MW' },
    { label: 'Thermal Power', value: pt.p_th, unit: 'MW' },
    ...(pt.p_dee && pulsedConversion === 'inductive_dec'
      ? [{ label: 'DEC Electric', value: pt.p_dee, unit: 'MW' }]
      : []),
    { label: 'Gross Electric', value: pt.p_et, unit: 'MW' },
    { label: 'Net Electric', value: pt.p_net, unit: 'MW' },
    { label: 'Scientific Q', value: pt.q_sci, unit: '' },
    { label: 'Engineering Q', value: pt.q_eng, unit: '' },
    { label: 'Recirc. Fraction', value: pt.rec_frac * 100, unit: '%' },
    ...(pt.e_stored_mj ? [{ label: 'Stored Energy', value: pt.e_stored_mj, unit: 'MJ' }] : []),
    ...(pt.f_rep ? [{ label: 'Rep Rate', value: pt.f_rep, unit: 'Hz' }] : []),
    ...(pt.f_ch ? [{ label: 'Charging Fraction', value: pt.f_ch * 100, unit: '%' }] : []),
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
        Power Balance
      </h3>
      <div className="space-y-1">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex justify-between text-sm py-0.5"
          >
            <span className="text-gray-600 dark:text-gray-300">
              {r.label}
            </span>
            <span className="font-mono text-gray-900 dark:text-gray-100">
              {r.value.toFixed(r.unit === '%' || r.unit === '' ? 2 : 0)}{' '}
              {r.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
