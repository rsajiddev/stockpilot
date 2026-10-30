# StockPilot (Next.js + Supabase Edition)

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
```bash
node scaffold_stockpilot_nextjs.js
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Supabase Database
1. Go to your [Supabase Dashboard](https://supabase.com).
2. Create a new project (e.g. `stockpilot-db`).
3. Open the **SQL Editor** in your Supabase project dashboard.
4. Open the generated file `supabase/schema.sql`, copy all contents, and execute them in the SQL Editor.
5. In your Supabase Dashboard, navigate to **Project Settings -> API** to copy:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Project Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### Step 4: Configure Local Environment
Create `.env.local` by copying `.env.example`:
```bash
cp .env.example .env.local
```
Edit `.env.local` and paste your Supabase Project URL and Anon Key.

### Step 5: Create First User in Supabase Auth
In your Supabase Dashboard, go to **Authentication -> Users**, click **Add User -> Create User**:
- **Email**: `admin@stockpilot.test`
- **Password**: `Admin@12345`
- Check *Auto Confirm Email*

### Step 6: Launch Development Server
```bash
npm run dev
```
Visit **http://localhost:3000** in your browser to sign in.
