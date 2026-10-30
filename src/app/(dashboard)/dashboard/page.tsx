import React from 'react';
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/StatCard';
import StatusPill from '@/components/StatusPill';
import { ShoppingBag, TrendingUp, AlertTriangle, Boxes } from 'lucide-react';
import { money } from '@/lib/utils';
import Link from 'next/link';

export const revalidate = 0; // Dynamic server page

export default async function DashboardPage() {
  const supabase = createClient();

  // 1. Fetch products count and low stock
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).is('deleted_at', null);
  const { data: lowStockItems } = await supabase.from('products').select('*').lte('quantity', 10).is('deleted_at', null).limit(5);

  // 2. Fetch sales stats
  const { data: sales } = await supabase.from('sales').select('*').order('id', { ascending: false }).limit(5);
  const { data: allSales } = await supabase.from('sales').select('total, paid_amount');

  const totalSales = (allSales || []).length;
  const grossRevenue = (allSales || []).reduce((acc, s) => acc + Number(s.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2F7D4E] to-[#52B073] rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20">Operational Terminal</span>
          <h2 className="text-2xl font-extrabold mt-2">Welcome to StockPilot Cloud</h2>
          <p className="text-xs text-white/80">Real-time synchronized inventory &amp; receivables ledger.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/sales/create" className="px-4 py-2 bg-white text-[#2F7D4E] text-xs font-bold rounded-xl shadow-sm hover:bg-slate-100">
            Open POS Sale
          </Link>
          <Link href="/stock/adjust" className="px-4 py-2 bg-white/20 text-white text-xs font-semibold rounded-xl hover:bg-white/30">
            Adjust Stock
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sales" value={totalSales} icon={ShoppingBag} trend="+12% volume" />
        <StatCard label="Gross Revenue" value={money(grossRevenue)} icon={TrendingUp} trend="Reconciled" />
        <StatCard label="Cataloged SKUs" value={productCount || 0} icon={Boxes} trend="Active SKUs" />
        <StatCard label="Low Stock Items" value={(lowStockItems || []).length} icon={AlertTriangle} trend="Action required" trendUp={false} />
      </div>

      {/* Grid: Recent Sales & Low Stock Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className="bg-white dark:bg-[#121B2D] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E6EDF7]">Recent Sales Activity</h3>
            <Link href="/invoices" className="text-xs font-semibold text-[#3E9A60]">View All</Link>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8ECF1] dark:border-[#1F2A3F] text-[#94A3B8]">
                <th className="pb-2">Invoice</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF1] dark:divide-[#1F2A3F]">
              {(sales || []).map((sale) => (
                <tr key={sale.id}>
                  <td className="py-2.5 font-mono font-bold text-[#3E9A60]">
                    <Link href={`/invoices/${sale.id}`}>{sale.invoice_number}</Link>
                  </td>
                  <td className="py-2.5 text-[#64748B]">{sale.issue_date}</td>
                  <td className="py-2.5 font-bold tabular-nums">{money(sale.total)}</td>
                  <td className="py-2.5 text-right">
                    <StatusPill status={sale.status} />
                  </td>
                </tr>
              ))}
              {(!sales || sales.length === 0) && (
                <tr><td colSpan={4} className="py-6 text-center text-[#94A3B8]">No sales logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white dark:bg-[#121B2D] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#0F1B2D] dark:text-[#E6EDF7]">Low Stock Requisition Alert</h3>
            <Link href="/products" className="text-xs font-semibold text-[#3E9A60]">All Inventory</Link>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E8ECF1] dark:border-[#1F2A3F] text-[#94A3B8]">
                <th className="pb-2">Product</th>
                <th className="pb-2">Stock</th>
                <th className="pb-2">Min Reorder</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF1] dark:divide-[#1F2A3F]">
              {(lowStockItems || []).map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5">
                    <div className="font-bold text-[#0F1B2D] dark:text-[#E6EDF7]">{item.name}</div>
                    <div className="font-mono text-[10px] text-[#94A3B8]">{item.sku}</div>
                  </td>
                  <td className="py-2.5 font-bold text-red-600 tabular-nums">{item.quantity} units</td>
                  <td className="py-2.5 text-[#64748B]">{item.reorder_level} units</td>
                  <td className="py-2.5 text-right">
                    <Link href={`/purchases/create?product_id=${item.id}`} className="px-2.5 py-1 bg-[#EEF8F2] text-[#3E9A60] font-bold rounded-lg text-[11px]">
                      Reorder
                    </Link>
                  </td>
                </tr>
              ))}
              {(!lowStockItems || lowStockItems.length === 0) && (
                <tr><td colSpan={4} className="py-6 text-center text-[#94A3B8]">All inventory items are well-stocked.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
