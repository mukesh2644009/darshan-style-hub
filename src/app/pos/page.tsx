'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FiSearch, FiPlus, FiMinus, FiTrash2, FiShoppingCart,
  FiUser, FiLogOut, FiX, FiLoader, FiCheck,
} from 'react-icons/fi';
import { normalizeProductImageUrl } from '@/lib/productImageUrl';

interface ProductSize { id: string; size: string; quantity: number; }
interface ProductImage { url: string; }
interface Product {
  id: string; sku: string; name: string; price: number; originalPrice?: number;
  category: string; inStock: boolean; images: ProductImage[]; sizes: ProductSize[];
}
interface CartItem {
  productId: string; productName: string; price: number;
  quantity: number; size: string; maxQty: number;
}
interface StaffUser { id: string; name: string; email: string; role: string; }

export default function POSPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCustomer, setShowCustomer] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null); // clicked product panel
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '', address: '' });
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || (d.user.role !== 'STAFF' && d.user.role !== 'ADMIN')) {
        router.push('/pos/login');
      } else {
        setStaff(d.user);
      }
    }).catch(() => router.push('/pos/login'));
  }, [router]);

  // Fetch products
  useEffect(() => {
    fetch('/api/pos/products')
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.products); })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach(p => s.add(p.category));
    return ['All', ...Array.from(s).sort()];
  }, [products]);

  const filtered = useMemo(() => products.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [products, category, search]);

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  function getCartQty(productId: string, size: string) {
    return cart.find(i => i.productId === productId && i.size === size)?.quantity || 0;
  }

  function changeQty(productId: string, productName: string, price: number, size: string, maxQty: number, delta: number) {
    setCart(prev => {
      const existing = prev.find(i => i.productId === productId && i.size === size);
      if (!existing) {
        if (delta <= 0) return prev;
        return [...prev, { productId, productName, price, size, maxQty, quantity: 1 }];
      }
      const newQty = Math.max(0, Math.min(existing.quantity + delta, maxQty));
      if (newQty === 0) return prev.filter(i => !(i.productId === productId && i.size === size));
      return prev.map(i => i.productId === productId && i.size === size ? { ...i, quantity: newQty } : i);
    });
  }

  function removeFromCart(productId: string, size: string) {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.size === size)));
  }

  async function handlePlaceOrder() {
    if (!customer.name || !customer.phone) return;
    setPlacing(true);
    try {
      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.productId, productName: i.productName, price: i.price, quantity: i.quantity, size: i.size })),
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          customerAddress: customer.address,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) router.push(`/pos/receipt/${data.order.id}`);
    } finally {
      setPlacing(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/pos/login');
  }

  if (loading || !staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <FiLoader className="animate-spin w-10 h-10 text-rose-600" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <span className="text-rose-700 font-bold">{staff.name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{staff.name}</p>
            <p className="text-xs text-gray-400">Staff · POS Terminal</p>
          </div>
        </div>
        <h1 className="text-base font-bold text-rose-700 hidden sm:block">Darshan Style Hub — POS</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors">
          <FiLogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Product grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + category filter */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-2 shrink-0">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or SKU…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    category === c ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(product => {
                const totalStock = product.sizes.reduce((s, sz) => s + sz.quantity, 0);
                const inCart = cart.filter(i => i.productId === product.id).reduce((s, i) => s + i.quantity, 0);
                const img = product.images[0]?.url;
                const outOfStock = !product.inStock || totalStock === 0;

                return (
                  <div key={product.id}
                    onClick={() => !outOfStock && setActiveProduct(product)}
                    className={`bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-all cursor-pointer
                      ${inCart > 0 ? 'border-rose-400 shadow-rose-100' : 'border-transparent hover:border-gray-200 hover:shadow-md'}
                      ${outOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {/* Image */}
                    <div className="relative aspect-[3/4] bg-gray-50">
                      {img ? (
                        <Image src={normalizeProductImageUrl(img)} alt={product.name} fill
                          className="object-cover" sizes="200px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">👗</div>
                      )}
                      {inCart > 0 && (
                        <div className="absolute top-2 right-2 min-w-[26px] h-[26px] px-1.5 bg-rose-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                          {inCart}
                        </div>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full">Out of Stock</span>
                        </div>
                      )}
                      {/* Tap hint */}
                      {!outOfStock && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">Tap to add</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-xs text-gray-400 font-mono mb-0.5">{product.sku}</p>
                      <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">{product.name}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-rose-700">₹{product.price.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-gray-400">{totalStock} pcs</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-400">
                  <p className="text-4xl mb-2">🔍</p>
                  <p>No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Cart panel */}
        <div className="w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <FiShoppingCart className="text-rose-600" />
              Cart {totalQty > 0 && <span className="text-rose-600">({totalQty})</span>}
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">Clear all</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 mt-16">
                <p className="text-4xl mb-2">🛒</p>
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Tap any product to add items</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={`${item.productId}-${item.size}`} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{item.productName}</p>
                      {item.size && <p className="text-xs text-gray-500 mt-0.5">Size: <strong>{item.size}</strong></p>}
                      <p className="text-xs text-gray-400">₹{item.price.toLocaleString('en-IN')} each</p>
                    </div>
                    <button onClick={() => removeFromCart(item.productId, item.size)}
                      className="text-gray-300 hover:text-red-500 ml-2 shrink-0">
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(item.productId, item.productName, item.price, item.size, item.maxQty, -1)}
                        className="w-9 h-9 rounded-xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:border-rose-400 hover:text-rose-600 active:scale-95 transition-all">
                        <FiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                      <button onClick={() => changeQty(item.productId, item.productName, item.price, item.size, item.maxQty, +1)}
                        disabled={item.quantity >= item.maxQty}
                        className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-40">
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                  {item.quantity >= item.maxQty && (
                    <p className="text-xs text-amber-600 mt-1">Max stock ({item.maxQty} pcs)</p>
                  )}
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-gray-100 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{totalQty} item{totalQty !== 1 ? 's' : ''}</span>
                <span className="text-2xl font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <button onClick={() => setShowCustomer(true)}
                className="w-full py-3.5 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base">
                <FiUser className="w-5 h-5" /> Add Customer & Bill
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Product size panel (slides in from bottom) ── */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setActiveProduct(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                {activeProduct.images[0]?.url ? (
                  <Image src={normalizeProductImageUrl(activeProduct.images[0].url)} alt={activeProduct.name} fill className="object-cover" sizes="56px" />
                ) : <div className="w-full h-full flex items-center justify-center text-2xl">👗</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 leading-tight line-clamp-2">{activeProduct.name}</p>
                <p className="text-rose-700 font-bold text-lg">₹{activeProduct.price.toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setActiveProduct(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Size rows */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Select Size & Quantity</p>
              {activeProduct.sizes.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">No sizes available</div>
              )}
              {activeProduct.sizes.map(sz => {
                const inCart = getCartQty(activeProduct.id, sz.size);
                const outOfStock = sz.quantity === 0;
                return (
                  <div key={sz.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                      outOfStock ? 'border-gray-100 bg-gray-50 opacity-50' :
                      inCart > 0 ? 'border-rose-400 bg-rose-50' : 'border-gray-100 bg-white'
                    }`}>
                    <div>
                      <p className={`font-bold text-lg ${inCart > 0 ? 'text-rose-700' : 'text-gray-800'}`}>{sz.size}</p>
                      <p className="text-xs text-gray-400">{sz.quantity} in stock</p>
                    </div>

                    {outOfStock ? (
                      <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-100 rounded-full">Out of stock</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => changeQty(activeProduct.id, activeProduct.name, activeProduct.price, sz.size, sz.quantity, -1)}
                          disabled={inCart === 0}
                          className="w-11 h-11 rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center text-gray-700 hover:border-rose-400 hover:text-rose-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
                          <FiMinus className="w-5 h-5" />
                        </button>
                        <span className={`w-8 text-center font-bold text-xl ${inCart > 0 ? 'text-rose-700' : 'text-gray-300'}`}>
                          {inCart}
                        </span>
                        <button
                          onClick={() => changeQty(activeProduct.id, activeProduct.name, activeProduct.price, sz.size, sz.quantity, +1)}
                          disabled={inCart >= sz.quantity}
                          className="w-11 h-11 rounded-2xl bg-rose-600 flex items-center justify-center text-white hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                          <FiPlus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Done button */}
            <div className="px-5 pb-5 pt-2">
              {cart.filter(i => i.productId === activeProduct.id).length > 0 && (
                <p className="text-center text-sm text-rose-700 font-semibold mb-2">
                  {cart.filter(i => i.productId === activeProduct.id).reduce((s, i) => s + i.quantity, 0)} added to cart
                  · ₹{cart.filter(i => i.productId === activeProduct.id).reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString('en-IN')}
                </p>
              )}
              <button onClick={() => setActiveProduct(null)}
                className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <FiCheck className="w-5 h-5" /> Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer details modal */}
      {showCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Customer Details</h3>
              <button onClick={() => setShowCustomer(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                <input value={customer.name} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))}
                  placeholder="Customer name" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile <span className="text-red-500">*</span></label>
                <input value={customer.phone} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))}
                  placeholder="10-digit mobile" type="tel" inputMode="numeric"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={customer.email} onChange={e => setCustomer(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com" type="email"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={customer.address} onChange={e => setCustomer(p => ({ ...p, address: e.target.value }))}
                  placeholder="Home / office address"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-rose-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'UPI'] as const).map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)}
                      className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        paymentMethod === m ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-700 hover:border-rose-300'
                      }`}>
                      {m === 'CASH' ? '💵 Cash' : '📱 UPI'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                {cart.map(i => (
                  <div key={`${i.productId}-${i.size}`} className="flex justify-between text-sm text-gray-700">
                    <span className="truncate mr-2">{i.productName} {i.size && `(${i.size})`} × {i.quantity}</span>
                    <span className="shrink-0 font-medium">₹{(i.price * i.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button onClick={handlePlaceOrder} disabled={!customer.name || !customer.phone || placing}
                className="w-full py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 disabled:opacity-50 flex items-center justify-center gap-2 text-base transition-colors">
                {placing ? <><FiLoader className="animate-spin w-5 h-5" /> Creating Bill…</> : <><FiCheck className="w-5 h-5" /> Create Bill — ₹{subtotal.toLocaleString('en-IN')}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
