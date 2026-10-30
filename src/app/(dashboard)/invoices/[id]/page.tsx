import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { money, dateFmt } from '@/lib/utils';
import StatusPill from '@/components/StatusPill';
import { Package } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: sale } = await supabase
    .from('sales')
    .select('*, customers(name, phone, company, address), sale_items(*), payments(*)')
    .eq('id', params.id)
    .single();

  if (!sale) notFound();

  const balance = Math.max(0, Number(sale.total) - Number(sale.paid_amount));

  return (
    <div className="max-w-3xl mx-auto bg-white border border-[#E8ECF1] rounded-2xl p-8 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start pb-6 border-b border-[#E8ECF1]">
        <div>
          <div className="flex items-center space-x-2 text-[#3E9A60] font-bold text-lg mb-1">
            <Package className="w-6 h-6" />
            <span>StockPilot Ltd</span>
          </div>
          <div className="text-xs text-[#64748B]">Level 4, Gulberg III, Lahore, Pakistan</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-xl text-[#3E9A60]">{sale.invoice_number}</div>
          <div className="text-xs text-[#64748B]">Issued: {dateFmt(sale.issue_date)}</div>
          <div className="mt-2"><StatusPill status={sale.status} /></div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="py-4 border-b border-[#E8ECF1] text-xs">
        <div className="text-[10px] uppercase font-bold text-[#94A3B8]">Invoiced To:</div>
        <div className="font-bold text-sm text-[#0F1B2D]">{sale.customers?.name || 'Walk-in Retail Customer'}</div>
        <div className="text-[#64748B]">{sale.customers?.company || 'Counter Sale'}</div>
      </div>

      {/* Items */}
      <div className="py-6">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#E8ECF1] text-[#94A3B8]">
            <tr>
              <th className="pb-2">Item & SKU</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Price</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8ECF1]">
            {(sale.sale_items || []).map((item: any) => (
              <tr key={item.id}>
                <td className="py-3">
                  <div className="font-bold text-[#0F1B2D]">{item.product_name}</div>
                  <div className="font-mono text-[10px] text-[#94A3B8]">{item.sku}</div>
                </td>
                <td className="py-3 font-semibold">{item.quantity}</td>
                <td className="py-3 tabular-nums">{money(item.unit_price)}</td>
                <td className="py-3 font-bold tabular-nums text-right">{money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculations */}
      <div className="pt-4 border-t border-[#E8ECF1] flex justify-end">
        <div className="w-56 space-y-1.5 text-xs">
          <div className="flex justify-between text-[#64748B]">
            <span>Subtotal:</span>
            <span className="font-bold tabular-nums">{money(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#64748B]">
            <span>GST (16%):</span>
            <span className="font-bold tabular-nums">{money(sale.tax_amount)}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-[#3E9A60] pt-2 border-t border-[#E8ECF1]">
            <span>Grand Total:</span>
            <span className="tabular-nums">{money(sale.total)}</span>
          </div>
          <div className="flex justify-between text-[#2F7D4E] font-semibold">
            <span>Amount Paid:</span>
            <span className="tabular-nums">{money(sale.paid_amount)}</span>
          </div>
          <div className="flex justify-between text-red-600 font-bold">
            <span>Balance Due:</span>
            <span className="tabular-nums">{money(balance)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
