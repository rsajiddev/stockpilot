'use client';

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
