import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { getWhatsAppUrl, SHOP_CONFIG } from '../config/shopConfig';
import { db } from '../firebase';
import {
  buildCartWhatsAppUrl,
  CartItem,
  CATALOG_PRODUCTS,
  formatPkr,
  SitePage,
} from '../data/catalogData';
import { ResilientImage } from './ResilientImage';

interface CartDrawerProps {
  open: boolean;
  items: CartItem[];
  products?: (typeof CATALOG_PRODUCTS)[number][];
  onClose: () => void;
  onUpdateQty: (productId: string, variant: string, nextQty: number) => void;
  onRemoveItem: (productId: string, variant: string) => void;
  onClearCart: () => void;
  onNavigate: (page: SitePage) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  items,
  products = CATALOG_PRODUCTS,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onNavigate,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [note, setNote] = useState('');
  const [orderRef, setOrderRef] = useState<string | null>(null);

  const enrichedItems = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return product ? { ...item, product } : null;
      })
      .filter((entry): entry is CartItem & { product: (typeof CATALOG_PRODUCTS)[number] } =>
        Boolean(entry),
      );
  }, [items, products]);

  const subtotal = useMemo(
    () =>
      enrichedItems.reduce(
        (sum, entry) => sum + entry.product.pricePkr * entry.quantity,
        0,
      ),
    [enrichedItems],
  );

  if (!open) return null;

  const handleCheckoutWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enrichedItems.length === 0) return;

    const url = buildCartWhatsAppUrl(items, customerName, fulfillment, note, products);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();

    const refCode = `UM-${String(Date.now()).slice(-4)}`;
    setOrderRef(refCode);

    try {
      const itemsSummary = enrichedItems
        .map((i) => `${i.product.name} (${i.variant}) x${i.quantity}`)
        .join(', ');
      addDoc(collection(db, 'orders'), {
        orderNumber: refCode,
        customerName: customerName.trim() || 'Online Customer',
        customerPhone: note.trim() || 'WhatsApp Customer',
        customerAddress: fulfillment,
        itemsSummary: itemsSummary.slice(0, 1000),
        totalPkr: subtotal,
        status: 'new',
        createdAt: new Date().toISOString(),
      }).catch((err) => console.warn('Order sync notice:', err));
    } catch {
      // Non-blocking
    }
  };

  return (
    <div
      className="fixed inset-x-0 top-0 bottom-[64px] z-40 flex justify-end bg-black/55 md:inset-0 md:z-50"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Order Cart"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-950">
              Order Cart
            </h2>
            <p className="text-xs text-zinc-500">
              Send itemized order to WhatsApp · {SHOP_CONFIG.PHONES[0]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {orderRef && (
            <div className="mb-5 border border-green-300 bg-green-50 p-4 text-sm text-green-950">
              <div className="flex items-start gap-2.5">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-700"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold">Order {orderRef} opened in WhatsApp</p>
                  <p className="mt-1 text-xs text-green-900">
                    Press send in WhatsApp ({SHOP_CONFIG.PHONES[0]}) to confirm pickup or
                    local delivery.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClearCart();
                      setOrderRef(null);
                    }}
                    className="mt-2 text-xs font-semibold underline"
                  >
                    Clear cart
                  </button>
                </div>
              </div>
            </div>
          )}

          {enrichedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-8 w-8 text-zinc-400" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold text-zinc-950">
                Cart is empty
              </h3>
              <p className="mt-1.5 max-w-xs text-sm text-zinc-500">
                Add items from the catalog or click products inside the 3D shop.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('products');
                }}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-sm bg-[#111214] px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                Browse Accessories
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200">
              {enrichedItems.map(({ product, variant, quantity }) => (
                <li
                  key={`${product.id}-${variant}`}
                  className="flex gap-4 py-4 first:pt-0"
                >
                  <div className="h-20 w-24 shrink-0 overflow-hidden border border-zinc-200 bg-zinc-50">
                    <ResilientImage
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-zinc-950">
                        {product.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id, variant)}
                        aria-label={`Remove ${product.name}`}
                        className="shrink-0 p-1 text-zinc-400 transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{variant}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-zinc-300">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, variant, quantity - 1)}
                          aria-label="Decrease quantity"
                          className="flex h-8 w-8 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold tabular-nums text-zinc-950">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, variant, quantity + 1)}
                          aria-label="Increase quantity"
                          className="flex h-8 w-8 items-center justify-center text-zinc-700 hover:bg-zinc-100"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-zinc-950">
                        {formatPkr(product.pricePkr * quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {enrichedItems.length === 0 ? (
          <div className="border-t border-black/10 bg-[#F3ECE6] px-5 py-4 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('products');
              }}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#EA4E1B] px-5 text-sm font-bold text-white transition-colors hover:bg-[#d44212]"
            >
              <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
              Browse Products
            </button>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={getWhatsAppUrl('Assalam o Alaikum, I want to ask about mobile accessories or repairs.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#16A34A] px-3 text-xs font-bold text-white transition-colors hover:bg-[#15803D]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                WhatsApp Help
              </a>
              <a
                href={`tel:${SHOP_CONFIG.PHONES[0].replace(/[^0-9+]/g, '')}`}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-black/15 bg-white px-3 text-xs font-bold text-[#141414] transition-colors hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
              >
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Call Shop
              </a>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleCheckoutWhatsApp}
            className="border-t border-black/5 bg-[#F3ECE6] px-6 py-5"
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFulfillment('pickup')}
                className={`h-9 rounded-full text-xs font-semibold transition-colors ${
                  fulfillment === 'pickup'
                    ? 'bg-[#141414] text-white'
                    : 'bg-white text-neutral-700 hover:text-[#EA4E1B]'
                }`}
              >
                Shop Pickup (Free)
              </button>
              <button
                type="button"
                onClick={() => setFulfillment('delivery')}
                className={`h-9 rounded-full text-xs font-semibold transition-colors ${
                  fulfillment === 'delivery'
                    ? 'bg-[#141414] text-white'
                    : 'bg-white text-neutral-700 hover:text-[#EA4E1B]'
                }`}
              >
                Chak 8 / Pattoki Delivery
              </button>
            </div>

            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name (optional)"
                className="h-10 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-[#141414] placeholder:text-neutral-400 focus:border-[#EA4E1B] focus:outline-none"
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Phone model for cover/glass or note"
                className="h-10 w-full rounded-xl border border-black/10 bg-white px-3.5 text-sm text-[#141414] placeholder:text-neutral-400 focus:border-[#EA4E1B] focus:outline-none"
              />
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-black/10 pt-3">
              <span className="text-sm font-medium text-neutral-700">Subtotal</span>
              <span className="font-display text-xl font-extrabold tabular-nums text-[#141414]">
                {formatPkr(subtotal)}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Pay cash, Easypaisa, or JazzCash on handover.
            </p>

            <button
              type="submit"
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#EA4E1B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#d44212]"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Send Order on WhatsApp
            </button>
          </form>
        )}
      </aside>
    </div>
  );
};
