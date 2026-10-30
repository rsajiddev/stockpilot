'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  BadgePercent,
  Receipt,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  History,
  LogOut,
  Package,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Products', href: '/products', icon: Boxes },
    { label: 'Categories', href: '/categories', icon: Package },
    { label: 'Stock Ledger', href: '/stock/movements', icon: History },
    { label: 'Purchases (PO)', href: '/purchases', icon: ShoppingCart },
    { label: 'POS Terminal', href: '/sales/create', icon: BadgePercent },
    { label: 'Invoices', href: '/invoices', icon: Receipt },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Suppliers', href: '/suppliers', icon: Truck },
    { label: 'Expenses', href: '/expenses', icon: Wallet },
    { label: 'Financial Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#121B2D] border-r border-[#E8ECF1] dark:border-[#1F2A3F] flex flex-col justify-between">
      <div>
        {/* Brand Block */}
        <div className="h-16 px-6 border-b border-[#E8ECF1] dark:border-[#1F2A3F] flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[#EEF8F2] dark:bg-[#1A263D] text-[#3E9A60] flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-[#0F1B2D] dark:text-[#E6EDF7] block leading-none">StockPilot</span>
            <span className="text-[9px] tracking-widest uppercase font-semibold text-[#64748B]">Next.js Cloud POS</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#EEF8F2] dark:bg-[#1A263D] text-[#3E9A60]'
                    : 'text-[#64748B] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0F1B2D]'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div className="p-3 border-t border-[#E8ECF1] dark:border-[#1F2A3F]">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-3 py-2 text-xs font-semibold text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
