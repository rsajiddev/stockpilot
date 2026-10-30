'use client';

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

    router.push(`/invoices/${saleId}`);
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
