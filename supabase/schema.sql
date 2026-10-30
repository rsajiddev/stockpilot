-- ============================================================================
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
