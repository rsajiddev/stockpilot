'use client';

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
