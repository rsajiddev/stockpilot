import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ label, value, icon: Icon, trend, trendUp = true }: Props) {
  return (
    <div className="bg-white dark:bg-[#121B2D] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase font-bold tracking-wider text-[#64748B]">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-[#EEF8F2] dark:bg-[#1A263D] text-[#3E9A60] flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-[#0F1B2D] dark:text-[#E6EDF7] tabular-nums mb-1">
        {value}
      </div>
      {trend && (
        <span className={`text-xs font-semibold ${trendUp ? 'text-[#2F7D4E]' : 'text-red-600'}`}>
          {trend}
        </span>
      )}
    </div>
  );
}
