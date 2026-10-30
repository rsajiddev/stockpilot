import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { money } from '@/lib/utils';
import StatusPill from '@/components/StatusPill';
import { Plus, Boxes } from 'lucide-react';

export const revalidate = 0;

export default async function ProductsPage() {
  const supabase = createClient();

  const { data: products } = await supabase
    .from('products')
    .select('*, categories(name)')
    .is('deleted_at', null)
    .order('id', { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F1B2D] dark:text-[#E6EDF7]">Cataloged Products</h1>
          <p className="text-xs text-[#64748B]">Real-time stock valuation and pricing configuration</p>
        </div>
        <Link
          href="/products/create"
          className="px-4 py-2 bg-[#3E9A60] hover:bg-[#2F7D4E] text-white text-xs font-bold rounded-xl flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Register Product
        </Link>
      </div>

      <div className="bg-white dark:bg-[#121B2D] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F9FB] dark:bg-[#0E1626] border-b border-[#E8ECF1] dark:border-[#1F2A3F] text-[#64748B]">
            <tr>
              <th className="px-4 py-3">Product Name</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Cost Price</th>
              <th className="px-4 py-3">Sale Price</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8ECF1] dark:divide-[#1F2A3F]">
            {(products || []).map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-bold text-[#0F1B2D] dark:text-[#E6EDF7]">
                  <Link href={`/products/${p.id}`} className="hover:text-[#3E9A60]">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono font-semibold text-[#3E9A60]">{p.sku}</td>
                <td className="px-4 py-3 text-[#64748B]">{p.categories?.name || 'Uncategorised'}</td>
                <td className="px-4 py-3 tabular-nums">{money(p.cost_price)}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">{money(p.sale_price)}</td>
                <td className="px-4 py-3 font-bold tabular-nums">
                  <span className={p.quantity <= p.reorder_level ? 'text-red-600 font-extrabold' : ''}>
                    {p.quantity} units
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <StatusPill status={p.quantity <= 0 ? 'out of stock' : p.quantity <= p.reorder_level ? 'low stock' : 'active'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
