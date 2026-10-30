import React from 'react';

export default function StatusPill({ status }: { status: string }) {
  const clean = (status || '').toLowerCase().trim();

  let style = 'bg-slate-100 text-slate-700';
  if (['active', 'paid', 'received', 'in stock'].includes(clean)) {
    style = 'bg-emerald-50 text-[#2F7D4E] border border-emerald-200';
  } else if (['pending', 'low stock', 'ordered', 'partial'].includes(clean)) {
    style = 'bg-amber-50 text-amber-700 border border-amber-200';
  } else if (['cancelled', 'out of stock', 'disabled', 'overdue'].includes(clean)) {
    style = 'bg-red-50 text-red-700 border border-red-200';
  } else if (['vip', 'wholesale'].includes(clean)) {
    style = 'bg-purple-50 text-purple-700 border border-purple-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${style}`}>
      {status}
    </span>
  );
}
