import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { dateFmt } from '@/lib/utils';
import StatusPill from '@/components/StatusPill';

export const revalidate = 0;

export default async function MovementsPage() {
  const supabase = createClient();

  const { data: movements } = await supabase
    .from('stock_movements')
    .select('*, products(name, sku)')
    .order('id', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[#0F1B2D] dark:text-[#E6EDF7]">Immutable Stock Movements Ledger</h1>
        <p className="text-xs text-[#64748B]">Audited chronological trail of every physical unit addition, dispatch, and adjustment</p>
      </div>

      <div className="bg-white dark:bg-[#121B2D] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F9FB] dark:bg-[#0E1626] border-b border-[#E8ECF1] dark:border-[#1F2A3F] text-[#64748B]">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Product SKU</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Quantity Delta</th>
              <th className="px-4 py-3">Balance After</th>
              <th className="px-4 py-3">Audit Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8ECF1] dark:divide-[#1F2A3F]">
            {(movements || []).map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{dateFmt(m.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="font-bold text-[#0F1B2D] dark:text-[#E6EDF7]">{m.products?.name}</div>
                  <div className="font-mono text-[10px] text-[#94A3B8]">{m.products?.sku}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={m.type === 'in' ? 'active' : m.type === 'out' ? 'cancelled' : 'pending'} />
                </td>
                <td className="px-4 py-3 capitalize font-semibold">{m.reason}</td>
                <td className={`px-4 py-3 font-mono font-bold ${m.quantity >= 0 ? 'text-[#2F7D4E]' : 'text-red-600'}`}>
                  {m.quantity > 0 ? '+' : ''}{m.quantity}
                </td>
                <td className="px-4 py-3 font-mono font-bold tabular-nums">{m.balance_after}</td>
                <td className="px-4 py-3 text-[#64748B]">{m.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
