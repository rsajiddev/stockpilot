#!/usr/bin/env node

/**
 * StockPilot - Next.js (App Router) + Supabase Full-Stack Scaffold Generator
 * Generates entire modern enterprise inventory & POS application in a single execution.
 *
 * Usage:
 *   node scaffold_stockpilot_nextjs.js
 *   node scaffold_stockpilot_nextjs.js --force
 */

const fs = require('fs');
const path = require('path');

const force = process.argv.includes('--force');
const files = {};

// ============================================================================
// 1. PROJECT CONFIGURATION & ENVIRONMENT
// ============================================================================

files['package.json'] = JSON.stringify({
    "name": "stockpilot-nextjs",
    "version": "2.0.0",
    "private": true,
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
    },
    "dependencies": {
        "@supabase/ssr": "^0.5.2",
        "@supabase/supabase-js": "^2.48.1",
        "chart.js": "^4.4.7",
        "clsx": "^2.1.1",
        "lucide-react": "^0.474.0",
        "next": "14.2.23",
        "react": "^18.3.1",
        "react-chartjs-2": "^5.3.0",
        "react-dom": "^18.3.1",
        "tailwind-merge": "^2.6.0"
    },
    "devDependencies": {
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        "autoprefixer": "^10.4.20",
        "postcss": "^8.4.49",
        "tailwindcss": "^3.4.17",
        "typescript": "^5"
    }
}, null, 2);

files['tsconfig.json'] = JSON.stringify({
    "compilerOptions": {
        "lib": ["dom", "dom.iterable", "esnext"],
        "allowJs": true,
        "skipLibCheck": true,
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "preserve",
        "incremental": true,
        "plugins": [{ "name": "next" }],
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}, null, 2);

files['next.config.mjs'] = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
`;

files['tailwind.config.ts'] = `import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spGreen: {
          50: '#EEF8F2',
          100: '#D5EEDF',
          200: '#AEDDC1',
          400: '#6CC08B',
          500: '#52B073',
          600: '#3E9A60',
          700: '#2F7D4E',
          800: '#266340',
          900: '#1D4B31',
        },
      },
    },
  },
  plugins: [],
};
export default config;
`;

files['postcss.config.mjs'] = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

files['.gitignore'] = `node_modules
/.next/
/out/
build
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
`;

files['.env.example'] = `# Supabase Project Connection Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_COMPANY_NAME="StockPilot Ltd"
NEXT_PUBLIC_CURRENCY="Rs"
`;

// ============================================================================
// 2. SUPABASE POSTGRESQL SCHEMA WITH RPC & RLS (supabase/schema.sql)
// ============================================================================

files['supabase/schema.sql'] = `-- ============================================================================
-- StockPilot Supabase Database Schema (PostgreSQL)
-- Includes strict foreign keys, atomic inventory RPC triggers, RLS, & Seed Data
-- ============================================================================

-- Clean reset if necessary
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.purchase_order_items CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 1. User Profiles linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Product Categories
CREATE TABLE public.categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  colour TEXT NOT NULL DEFAULT '#52B073',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Expense Categories
CREATE TABLE public.expense_categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  colour TEXT NOT NULL DEFAULT '#6D4AE0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Suppliers
CREATE TABLE public.suppliers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Customers
CREATE TABLE public.customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  city TEXT,
  address TEXT,
  type TEXT NOT NULL DEFAULT 'regular' CHECK (type IN ('regular', 'vip', 'wholesale')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Products
CREATE TABLE public.products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  supplier_id BIGINT REFERENCES public.suppliers(id) ON DELETE SET NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Immutable Stock Movements Ledger
CREATE TABLE public.stock_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjust')),
  quantity INT NOT NULL,
  balance_after INT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('opening', 'purchase', 'sale', 'customer_return', 'damage', 'correction', 'cancelled_sale')),
  reference_type TEXT,
  reference_id BIGINT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Purchase Orders
CREATE TABLE public.purchase_orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id BIGINT NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_at TIMESTAMPTZ,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Purchase Order Items
CREATE TABLE public.purchase_order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  purchase_order_id BIGINT NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);

-- 10. Sales / Invoices
CREATE TABLE public.sales (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id BIGINT REFERENCES public.customers(id) ON DELETE RESTRICT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + 15),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 16.00,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Sale Line Items
CREATE TABLE public.sale_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  unit_cost NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);

-- 12. Settlement Payments
CREATE TABLE public.payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'bank_transfer', 'cheque')),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 13. Expenses
CREATE TABLE public.expenses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  category_id BIGINT NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  payee TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'card', 'bank_transfer', 'cheque')),
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Audit Log
CREATE TABLE public.audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Settings
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ============================================================================
-- STORED PROCEDURES (POSTGRESQL FUNCTIONS FOR ATOMIC STOCK SAFETY)
-- ============================================================================

-- Procedure 1: Apply Stock Movement with Row Lock
CREATE OR REPLACE FUNCTION public.apply_stock_movement(
  p_product_id BIGINT,
  p_signed_qty INT,
  p_type TEXT,
  p_reason TEXT,
  p_user_id UUID,
  p_ref_type TEXT DEFAULT NULL,
  p_ref_id BIGINT DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_qty INT;
  v_new_qty INT;
  v_movement_id BIGINT;
BEGIN
  -- Row Lock on product record to prevent race conditions
  SELECT quantity INTO v_current_qty
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product with ID % not found', p_product_id;
  END IF;

  v_new_qty := v_current_qty + p_signed_qty;

  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'Insufficient stock balance. Current: %, requested change: %', v_current_qty, p_signed_qty;
  END IF;

  -- Update product balance
  UPDATE public.products
  SET quantity = v_new_qty, updated_at = NOW()
  WHERE id = p_product_id;

  -- Record audit movement
  INSERT INTO public.stock_movements (
    product_id, user_id, type, quantity, balance_after,
    reason, reference_type, reference_id, note
  ) VALUES (
    p_product_id, p_user_id, p_type, p_signed_qty, v_new_qty,
    p_reason, p_ref_type, p_ref_id, p_note
  ) RETURNING id INTO v_movement_id;

  RETURN v_movement_id;
END;
$$;

-- Procedure 2: Complete Sale Order atomically (Reduces Stock & Writes Items)
CREATE OR REPLACE FUNCTION public.create_sale_transaction(
  p_invoice_number TEXT,
  p_customer_id BIGINT,
  p_issue_date DATE,
  p_due_date DATE,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_tax_rate NUMERIC,
  p_tax_amount NUMERIC,
  p_total NUMERIC,
  p_paid_now NUMERIC,
  p_payment_method TEXT,
  p_payment_ref TEXT,
  p_notes TEXT,
  p_user_id UUID,
  p_items JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id BIGINT;
  v_item JSONB;
  v_pid BIGINT;
  v_qty INT;
  v_price NUMERIC;
  v_cost NUMERIC;
  v_name TEXT;
  v_sku TEXT;
BEGIN
  -- Insert Sale Header
  INSERT INTO public.sales (
    invoice_number, customer_id, issue_date, due_date,
    subtotal, discount_amount, tax_rate, tax_amount, total, paid_amount,
    notes, created_by
  ) VALUES (
    p_invoice_number, p_customer_id, p_issue_date, p_due_date,
    p_subtotal, p_discount, p_tax_rate, p_tax_amount, p_total, p_paid_now,
    p_notes, p_user_id
  ) RETURNING id INTO v_sale_id;

  -- Iterate through items array
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_pid := (v_item->>'product_id')::BIGINT;
    v_qty := (v_item->>'quantity')::INT;
    v_price := (v_item->>'unit_price')::NUMERIC;
    v_cost := (v_item->>'unit_cost')::NUMERIC;
    v_name := v_item->>'product_name';
    v_sku := v_item->>'sku';

    -- Insert sale item
    INSERT INTO public.sale_items (
      sale_id, product_id, product_name, sku, quantity, unit_price, unit_cost, line_total
    ) VALUES (
      v_sale_id, v_pid, v_name, v_sku, v_qty, v_price, v_cost, (v_qty * v_price)
    );

    -- Apply atomic decrement
    PERFORM public.apply_stock_movement(
      v_pid, -v_qty, 'out', 'sale', p_user_id, 'sale', v_sale_id, 'Invoice ' || p_invoice_number
    );
  END LOOP;

  -- Record payment if tendered
  IF p_paid_now > 0 THEN
    INSERT INTO public.payments (
      sale_id, amount, method, reference, created_by
    ) VALUES (
      v_sale_id, p_paid_now, p_payment_method, p_payment_ref, p_user_id
    );
  END IF;

  RETURN v_sale_id;
END;
$$;

-- Procedure 3: Receive Purchase Order and deposit stock
CREATE OR REPLACE FUNCTION public.receive_purchase_order(
  p_po_id BIGINT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_po_num TEXT;
BEGIN
  SELECT po_number INTO v_po_num FROM public.purchase_orders WHERE id = p_po_id;

  FOR v_item IN SELECT product_id, quantity FROM public.purchase_order_items WHERE purchase_order_id = p_po_id
  LOOP
    PERFORM public.apply_stock_movement(
      v_item.product_id, v_item.quantity, 'in', 'purchase', p_user_id, 'purchase_order', p_po_id, 'Consignment ' || v_po_num
    );
  END LOOP;

  UPDATE public.purchase_orders
  SET status = 'received', received_at = NOW(), updated_at = NOW()
  WHERE id = p_po_id;
END;
$$;

-- Seed Default Settings & Categories
INSERT INTO public.categories (name, colour, description) VALUES
('Electronics', '#52B073', 'Computing & digital accessories'),
('Accessories', '#3E9A60', 'Cables, peripherals and adapters'),
('Office Stationery', '#6D4AE0', 'Paper reams, writing and desktop goods'),
('Home & Living', '#D9822B', 'Lighting, decor and small appliances')
ON CONFLICT DO NOTHING;

INSERT INTO public.expense_categories (name, colour) VALUES
('Office Rent', '#6D4AE0'),
('Staff Salaries', '#2F7D4E'),
('Utilities & Power', '#D9822B'),
('Logistics & Freight', '#2F54C9'),
('Marketing & Ads', '#C53030')
ON CONFLICT DO NOTHING;

INSERT INTO public.settings (key, value) VALUES
('company_name', 'StockPilot Ltd'),
('company_email', 'support@stockpilot.test'),
('company_phone', '+92 42 3588 9000'),
('company_address', 'Level 4, Tech Innovators Tower, Gulberg III, Lahore, Pakistan'),
('currency_symbol', 'Rs '),
('tax_rate', '16.00')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Base Authenticated User Policies (Full Access for logged-in operators)
CREATE POLICY "Allow authenticated read/write on profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on stock_movements" ON public.stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on sales" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on sale_items" ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on purchase_orders" ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on purchase_order_items" ON public.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated on expense_categories" ON public.expense_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

// ============================================================================
// 3. SUPABASE CLIENT & SERVER UTILITIES
// ============================================================================

files['src/lib/supabase/client.ts'] = `import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`;

files['src/lib/supabase/server.ts'] = `import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Invoked from Server Component ignore
          }
        },
      },
    }
  );
}
`;

files['src/middleware.ts'] = `import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  const isProtected = !isAuthPage && !request.nextUrl.pathname.startsWith('/_next') && !request.nextUrl.pathname.startsWith('/api') && request.nextUrl.pathname !== '/';

  if (!user && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && (isAuthPage || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
`;

files['src/lib/utils.ts'] = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(amount: number | string | null | undefined): string {
  const val = Number(amount || 0);
  return 'Rs ' + val.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function dateFmt(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
`;

// ============================================================================
// 4. CORE REUSABLE UI COMPONENTS
// ============================================================================

files['src/components/Sidebar.tsx'] = `'use client';

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
                className={\`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors \${
                  active
                    ? 'bg-[#EEF8F2] dark:bg-[#1A263D] text-[#3E9A60]'
                    : 'text-[#64748B] hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0F1B2D]'
                }\`}
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
`;

files['src/components/Header.tsx'] = `'use client';

import React, { useState } from 'react';
import { Search, Moon, Sun } from 'lucide-react';

export default function Header() {
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    const isDark = !dark;
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#121B2D]/95 backdrop-blur border-b border-[#E8ECF1] dark:border-[#1F2A3F] px-6 flex items-center justify-between">
      <div className="relative w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Global search (products, customers)..."
          className="w-full pl-9 pr-4 py-1.5 bg-[#F6F8FA] dark:bg-[#0E1626] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#3E9A60]"
        />
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-xl border border-[#E8ECF1] dark:border-[#1F2A3F] flex items-center justify-center text-[#64748B] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-[#E8ECF1] dark:border-[#1F2A3F]">
          <div className="w-7 h-7 rounded-full bg-[#3E9A60] text-white flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <span className="text-xs font-semibold text-[#0F1B2D] dark:text-[#E6EDF7]">Administrator</span>
        </div>
      </div>
    </header>
  );
}
`;

files['src/components/StatCard.tsx'] = `import React from 'react';
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
        <span className={\`text-xs font-semibold \${trendUp ? 'text-[#2F7D4E]' : 'text-red-600'}\`}>
          {trend}
        </span>
      )}
    </div>
  );
}
`;

files['src/components/StatusPill.tsx'] = `import React from 'react';

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
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize \${style}\`}>
      {status}
    </span>
  );
}
`;

// ============================================================================
// 5. APP ROUTER LAYOUTS & AUTH SCREENS
// ============================================================================

files['src/app/globals.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-page: #F6F8FA;
  --text-main: #0F1B2D;
}

.dark {
  --bg-page: #0B1220;
  --text-main: #E6EDF7;
}

body {
  background-color: var(--bg-page);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

@media print {
  aside, header, .no-print {
    display: none !important;
  }
  main {
    padding: 0 !important;
    margin: 0 !important;
    max-width: 100% !important;
  }
}
`;

files['src/app/layout.tsx'] = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockPilot - Cloud Stock Management",
  description: "Precision inventory control and point-of-sale ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
`;

files['src/app/(auth)/login/page.tsx'] = `'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Lock, Mail, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F8FA]">
      {/* Left Banner */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#2F7D4E] to-[#52B073] p-12 text-white flex flex-col justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">StockPilot</span>
        </div>

        <div className="max-w-md">
          <span className="px-3 py-1 bg-white/20 text-xs font-semibold rounded-full uppercase">Next.js + Supabase</span>
          <h2 className="text-3xl font-extrabold mt-4 mb-2">Real-time Cloud Inventory &amp; Point of Sale Terminal</h2>
          <p className="text-white/80 text-sm">Powered by PostgreSQL row-level locks, instantaneous stock deductions, and audit ledgers.</p>
        </div>

        <div className="text-xs text-white/60">&copy; {new Date().getFullYear()} StockPilot Cloud Systems.</div>
      </div>

      {/* Right Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-[#0F1B2D]">Sign In to Terminal</h1>
          <p className="text-xs text-[#64748B] mt-1 mb-6">Enter your Supabase Auth credentials to access terminal.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#64748B] mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@stockpilot.test"
                  className="w-full pl-9 pr-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#3E9A60]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#64748B] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#94A3B8]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#3E9A60]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#3E9A60] hover:bg-[#2F7D4E] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
`;

// ============================================================================
// 6. MAIN WORKSPACE WRAPPER & DASHBOARD
// ============================================================================

files['src/app/(dashboard)/layout.tsx'] = `import React from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 pl-64 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
`;

files['src/app/(dashboard)/dashboard/page.tsx'] = `import React from 'react';
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
                    <Link href={\`/invoices/\${sale.id}\`}>{sale.invoice_number}</Link>
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
                    <Link href={\`/purchases/create?product_id=\${item.id}\`} className="px-2.5 py-1 bg-[#EEF8F2] text-[#3E9A60] font-bold rounded-lg text-[11px]">
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
`;

// ============================================================================
// 7. INVENTORY MANAGEMENT (Products & Stock Movements)
// ============================================================================

files['src/app/(dashboard)/products/page.tsx'] = `import React from 'react';
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
                  <Link href={\`/products/\${p.id}\`} className="hover:text-[#3E9A60]">
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
`;

files['src/app/(dashboard)/products/create/page.tsx'] = `'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreateProductPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: '',
    sku: 'SP-' + Math.floor(100000 + Math.random() * 900000),
    category_id: 1,
    cost_price: 1000,
    sale_price: 1500,
    reorder_level: 10,
    opening_stock: 25,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert Product
    const { data: product, error } = await supabase.from('products').insert({
      name: form.name,
      sku: form.sku,
      category_id: Number(form.category_id),
      cost_price: Number(form.cost_price),
      sale_price: Number(form.sale_price),
      reorder_level: Number(form.reorder_level),
      quantity: 0,
    }).select().single();

    if (error || !product) {
      alert(error?.message || 'Failed to create product');
      setLoading(false);
      return;
    }

    // 2. If opening stock > 0, apply via RPC
    if (form.opening_stock > 0) {
      await supabase.rpc('apply_stock_movement', {
        p_product_id: product.id,
        p_signed_qty: Number(form.opening_stock),
        p_type: 'in',
        p_reason: 'opening',
        p_user_id: user?.id,
        p_ref_type: 'product',
        p_ref_id: product.id,
        p_note: 'Initial opening stock deposit'
      });
    }

    router.push('/products');
    router.refresh();
  };

  return (
    <div className="max-w-2xl bg-white dark:bg-[#121B2D] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-2xl p-6 shadow-sm">
      <h1 className="text-lg font-bold mb-4">Register New Catalog SKU</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#64748B] mb-1">Product Title</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ergonomic Office Desk Stand"
            className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">SKU</label>
            <input
              type="text"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">Initial Opening Quantity</label>
            <input
              type="number"
              min="0"
              required
              value={form.opening_stock}
              onChange={(e) => setForm({ ...form, opening_stock: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">Cost Price (Rs)</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">Sale Price (Rs)</label>
            <input
              type="number"
              step="0.01"
              required
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#64748B] mb-1">Reorder Level</label>
            <input
              type="number"
              required
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-xs font-semibold text-[#64748B]">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-5 py-2 bg-[#3E9A60] hover:bg-[#2F7D4E] text-white text-xs font-bold rounded-xl shadow-sm">
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
`;

files['src/app/(dashboard)/stock/movements/page.tsx'] = `import React from 'react';
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
                <td className={\`px-4 py-3 font-mono font-bold \${m.quantity >= 0 ? 'text-[#2F7D4E]' : 'text-red-600'}\`}>
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
`;

// ============================================================================
// 8. POINT OF SALE (POS) & INVOICES
// ============================================================================

files['src/app/(dashboard)/sales/create/page.tsx'] = `'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { money } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

interface CartItem {
  product_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  unit_cost: number;
  quantity: number;
  stock: number;
}

export default function POSPage() {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('products').select('*').is('deleted_at', null).then(({ data }) => {
      setProducts(data || []);
    });
  }, []);

  const addToCart = () => {
    const p = products.find((x) => x.id === Number(selectedProductId));
    if (!p) return;

    if (p.quantity <= 0) {
      alert('Product has zero physical inventory available.');
      return;
    }

    const existing = cart.find((i) => i.product_id === p.id);
    if (existing) {
      if (existing.quantity < p.quantity) {
        setCart(cart.map((i) => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
        alert('Cannot exceed available inventory count.');
      }
    } else {
      setCart([...cart, {
        product_id: p.id,
        product_name: p.name,
        sku: p.sku,
        unit_price: Number(p.sale_price),
        unit_cost: Number(p.cost_price),
        quantity: 1,
        stock: p.quantity,
      }]);
    }
  };

  const subtotal = cart.reduce((acc, i) => acc + (i.unit_price * i.quantity), 0);
  const tax = subtotal * 0.16; // 16% GST
  const grandTotal = subtotal + tax;

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert('Order cart is empty.');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const invoiceNumber = 'INV-' + Math.floor(100000 + Math.random() * 900000);

    const { data: saleId, error } = await supabase.rpc('create_sale_transaction', {
      p_invoice_number: invoiceNumber,
      p_customer_id: null,
      p_issue_date: new Date().toISOString().split('T')[0],
      p_due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      p_subtotal: subtotal,
      p_discount: 0,
      p_tax_rate: 16.0,
      p_tax_amount: tax,
      p_total: grandTotal,
      p_paid_now: paidNow,
      p_payment_method: paymentMethod,
      p_payment_ref: 'Cash Register Tender',
      p_notes: 'Counter POS Dispatch',
      p_user_id: user?.id,
      p_items: cart,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push(\`/invoices/\${saleId}\`);
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Item Picker & Cart */}
      <div className="lg:col-span-2 bg-white dark:bg-[#121B2D] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-2xl p-6 shadow-sm">
        <h1 className="text-lg font-bold mb-4">Point of Sale Terminal (POS)</h1>

        <div className="flex gap-2 mb-4">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="flex-1 px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none"
          >
            <option value="">Select product to add...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) • {money(p.sale_price)} • In Stock: {p.quantity}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addToCart}
            className="px-4 py-2 bg-[#3E9A60] hover:bg-[#2F7D4E] text-white text-xs font-bold rounded-xl flex items-center shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" /> Add
          </button>
        </div>

        <div className="border border-[#E8ECF1] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FB] border-b border-[#E8ECF1] text-[#64748B]">
              <tr>
                <th className="p-3">Product SKU</th>
                <th className="p-3">Price</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Subtotal</th>
                <th className="p-3 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF1]">
              {cart.map((item, idx) => (
                <tr key={item.product_id}>
                  <td className="p-3">
                    <div className="font-bold">{item.product_name}</div>
                    <div className="font-mono text-[10px] text-[#94A3B8]">{item.sku}</div>
                  </td>
                  <td className="p-3 tabular-nums">{money(item.unit_price)}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(item.stock, Number(e.target.value)));
                        setCart(cart.map((ci, cidx) => cidx === idx ? { ...ci, quantity: val } : ci));
                      }}
                      className="w-16 px-2 py-1 bg-[#F6F8FA] border border-[#E8ECF1] rounded-lg text-center font-bold"
                    />
                  </td>
                  <td className="p-3 font-bold tabular-nums">{money(item.unit_price * item.quantity)}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setCart(cart.filter((_, cidx) => cidx !== idx))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-xs text-[#94A3B8]">Your order cart is empty.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Checkout & Tender */}
      <div className="bg-white dark:bg-[#121B2D] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h2 className="text-sm font-bold border-b border-[#E8ECF1] pb-2">Financial Settlement</h2>

          <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Cart Subtotal:</span>
              <span className="font-bold tabular-nums">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">GST Tax (16%):</span>
              <span className="font-bold tabular-nums">{money(tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-[#2F7D4E] pt-2 border-t border-[#E8ECF1]">
              <span>Grand Total:</span>
              <span className="tabular-nums">{money(grandTotal)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">Tender Amount (Rs)</label>
              <input
                type="number"
                step="0.01"
                value={paidNow}
                onChange={(e) => setPaidNow(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#64748B] mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F8FA] border border-[#E8ECF1] rounded-xl text-xs outline-none"
              >
                <option value="cash">Cash Tender</option>
                <option value="card">Card Terminal</option>
                <option value="bank_transfer">Bank Wire</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleFinalize}
          disabled={loading || cart.length === 0}
          className="w-full mt-6 py-3 bg-[#3E9A60] hover:bg-[#2F7D4E] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
        >
          {loading ? 'Executing Atomic Ledger Write...' : 'Finalize Sale & Print Invoice'}
        </button>
      </div>
    </div>
  );
}
`;

files['src/app/(dashboard)/invoices/[id]/page.tsx'] = `import React from 'react';
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
`;

// ============================================================================
// 9. README.MD COMPLETE INSTRUCTIONS GUIDE
// ============================================================================

files['README.md'] = `# StockPilot (Next.js + Supabase Edition)

An enterprise-grade Inventory, Point-of-Sale (POS), and Warehouse Ledger ERP converted from PHP/MySQL into **Next.js (App Router)** and **Supabase (PostgreSQL)**.

---

## 1. Stack & Architecture

- **Front-end Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons
- **Database & Storage**: Supabase (PostgreSQL with Row Level Security, Pl/pgSQL Stored Procedures, and Auth)
- **State Management & Data Fetching**: Server Components + Supabase Client/Server SSR utilities

---

## 2. Quick Setup & Local Installation

### Step 1: Run the Scaffold Script
Execute this generator inside your desired folder:
\`\`\`bash
node scaffold_stockpilot_nextjs.js
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
npm install
\`\`\`

### Step 3: Configure Supabase Database
1. Go to your [Supabase Dashboard](https://supabase.com).
2. Create a new project (e.g. \`stockpilot-db\`).
3. Open the **SQL Editor** in your Supabase project dashboard.
4. Open the generated file \`supabase/schema.sql\`, copy all contents, and execute them in the SQL Editor.
5. In your Supabase Dashboard, navigate to **Project Settings -> API** to copy:
   - Project URL (\`NEXT_PUBLIC_SUPABASE_URL\`)
   - Project Anon Key (\`NEXT_PUBLIC_SUPABASE_ANON_KEY\`)

### Step 4: Configure Local Environment
Create \`.env.local\` by copying \`.env.example\`:
\`\`\`bash
cp .env.example .env.local
\`\`\`
Edit \`.env.local\` and paste your Supabase Project URL and Anon Key.

### Step 5: Create First User in Supabase Auth
In your Supabase Dashboard, go to **Authentication -> Users**, click **Add User -> Create User**:
- **Email**: \`admin@stockpilot.test\`
- **Password**: \`Admin@12345\`
- Check *Auto Confirm Email*

### Step 6: Launch Development Server
\`\`\`bash
npm run dev
\`\`\`
Visit **http://localhost:3000** in your browser to sign in.
`;

// ============================================================================
// 10. GENERATOR EXECUTION & FILE SYSTEM WRITER
// ============================================================================

let createdCount = 0;
let skippedCount = 0;

console.log("=========================================================");
console.log(" StockPilot Next.js + Supabase Single-File Scaffold Engine");
console.log("=========================================================");

Object.entries(files).forEach(([relPath, content]) => {
    const fullPath = path.join(process.cwd(), relPath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(fullPath) && !force) {
        skippedCount++;
        return;
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    createdCount++;
});

console.log(`[+] Files Written / Overwritten : ${createdCount}`);
console.log(`[*] Files Skipped (Already Exist): ${skippedCount}`);
console.log("=========================================================");
console.log("[✓] Complete Next.js + Supabase scaffold generated!");
console.log("\nNext Steps:");
console.log(" 1. npm install");
console.log(" 2. Run 'supabase/schema.sql' inside your Supabase project SQL Editor.");
console.log(" 3. Copy '.env.example' to '.env.local' and add your Supabase URL & keys.");
console.log(" 4. npm run dev\n");