import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tag,
  Truck,
} from 'lucide-react';
import { getWhatsAppUrl, ViewMode } from '../config/shopConfig';
import { CatalogProduct, CUSTOMER_REVIEWS, formatPkr } from '../data/catalogData';
import { ResilientImage } from './ResilientImage';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  cartCount?: number;
  onClose: () => void;
  onAddToCart: (product: CatalogProduct, variant: string, quantity: number) => void;
  onOpenCart?: () => void;
  onOpenVirtualShop?: (mode: ViewMode) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  cartCount = 0,
  onClose,
  onAddToCart,
  onOpenCart,
  onOpenVirtualShop,
}) => {
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0] ?? 'Standard');
      setQuantity(1);
      setJustAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const originalPrice = product.originalPricePkr ?? Math.round(product.pricePkr * 1.35);
  const discountPercent =
    product.discountPercent ??
    Math.max(10, Math.round(((originalPrice - product.pricePkr) / originalPrice) * 100));
  const savedAmount = Math.max(50, originalPrice - product.pricePkr);
  const reviewsCount = product.reviewsCount ?? 450;
  const soldCount = product.soldCount ?? '2.5K sold';
  const specChips = product.specs
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);

  const handleAdd = () => {
    onAddToCart(product, selectedVariant, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1500);
  };

  const handleBuyNow = () => {
    onAddToCart(product, selectedVariant, quantity);
    onClose();
    if (onOpenCart) {
      window.setTimeout(() => onOpenCart(), 40);
    }
  };

  const whatsappItemUrl = getWhatsAppUrl(
    `Assalam o Alaikum, I want to ask about: ${product.name} (${selectedVariant}) × ${quantity} — ${formatPkr(product.pricePkr * quantity)}`,
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdp-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-lg flex-col bg-[#F5F5F5] shadow-2xl"
      >
        {/* Top Sticky Header with Back Button */}
        <header className="sticky top-0 z-20 flex h-13 shrink-0 items-center justify-between gap-2 border-b border-black/10 bg-white px-2.5 sm:px-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to products"
            className="inline-flex h-9 items-center gap-1 rounded-full px-2 text-xs font-bold text-[#141414] transition-colors hover:bg-neutral-100 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            <span>Back</span>
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-xs font-bold text-[#141414]">{product.name}</p>
            <p className="text-[10px] text-neutral-500">
              {product.category} · {product.sku}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenCart) {
                window.setTimeout(() => onOpenCart(), 40);
              }
            }}
            aria-label="Open Cart"
            className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#141414] transition-colors hover:bg-neutral-100"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#EA4E1B] px-1 text-[9px] font-extrabold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {/* Product Photo */}
          <div className="relative aspect-[4/3] w-full bg-white">
            <ResilientImage
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white">
              {product.status}
            </span>
          </div>

          {/* Daraz-Style Promo Price Banner */}
          <div className="bg-gradient-to-r from-[#5B21B6] via-[#7C3AED] to-[#EA4E1B] px-4 py-3 text-white">
            <div className="flex items-center justify-between text-[11px] font-semibold text-white/90">
              <span>Rs. {savedAmount.toLocaleString('en-PK')} off with Shop Deal</span>
              <span className="rounded-xs bg-yellow-300 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-[#141414]">
                -{discountPercent}% OFF
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2.5">
              <span className="font-display text-2xl font-extrabold tabular-nums">
                {formatPkr(product.pricePkr)}
              </span>
              <span className="text-xs text-white/75 line-through tabular-nums">
                {formatPkr(originalPrice)}
              </span>
            </div>
          </div>

          {/* Main Product Info Block */}
          <div className="bg-white px-4 py-3.5 shadow-2xs">
            {/* Voucher / Promo Chip */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-xs bg-pink-50 px-2 py-0.5 text-[10px] font-bold text-[#E11D48]">
                <Tag className="h-3 w-3" aria-hidden="true" />
                Extra Shop Discount Available
              </span>
              <span className="rounded-xs bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Free Live Testing
              </span>
            </div>

            <h2
              id="pdp-title"
              className="font-display mt-2 text-lg font-bold leading-snug text-[#141414]"
            >
              {product.name}
            </h2>

            {/* Best Seller Banner */}
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50/90 px-2.5 py-1 text-[11px] font-bold text-amber-900">
              <span className="text-[#EA4E1B]">Best Seller</span>
              <span className="text-amber-400">·</span>
              <span>Top Pick in {product.category}</span>
            </div>

            {/* Specs Highlights */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-[#9A5B32]">
              {specChips.map((chip, idx) => (
                <React.Fragment key={chip}>
                  {idx > 0 && <span className="text-neutral-300">|</span>}
                  <span>{chip}</span>
                </React.Fragment>
              ))}
            </div>

            {/* Rating, Reviews Count & Sold Count Row */}
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5">
              <div className="flex items-center gap-1.5 text-xs">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="font-extrabold text-[#141414]">{product.rating}</span>
                <span className="text-neutral-500">({reviewsCount} reviews)</span>
                <span className="text-neutral-300">|</span>
                <span className="font-semibold text-neutral-700">{soldCount}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">
                {product.status}
              </span>
            </div>
          </div>

          {/* Delivery & Warranty Guarantee Card */}
          <div className="mt-2 bg-white px-4 py-3 shadow-2xs space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-[#141414]">
                  Verified Quality · {product.warrantyNote}
                </p>
                <p className="text-[11px] text-neutral-500">
                  Tested live on voltage/sound meter before handover
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 border-t border-neutral-100 pt-2.5 text-xs">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#141414]">
                    Same-Day Pickup or Local Delivery
                  </p>
                  <span className="font-bold text-emerald-700">Free Pickup</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Hussain Khan Wala, Chak No. 8 &amp; Pattoki · Pay Cash / Easypaisa / JazzCash
                </p>
              </div>
            </div>
          </div>

          {/* Variant & Quantity Selection */}
          <div className="mt-2 bg-white px-4 py-3.5 shadow-2xs">
            {product.variants.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#141414]">Select Option</span>
                  <span className="font-semibold text-[#EA4E1B]">{selectedVariant}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const active = selectedVariant === variant;
                    return (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`h-8 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-all ${
                          active
                            ? 'border-[#EA4E1B] bg-[#EA4E1B]/10 text-[#EA4E1B]'
                            : 'border-neutral-200 bg-[#F8F6F4] text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {variant}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
              <div>
                <span className="block text-xs font-bold text-[#141414]">Quantity</span>
                <span className="text-[11px] text-neutral-500">
                  Total: {formatPkr(product.pricePkr * quantity)}
                </span>
              </div>
              <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-[#F8F6F4]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="flex h-8 w-8 items-center justify-center text-neutral-700 hover:bg-white"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="w-9 text-center text-xs font-extrabold tabular-nums text-[#141414]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="flex h-8 w-8 items-center justify-center text-neutral-700 hover:bg-white"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="mt-2 bg-white px-4 py-3.5 shadow-2xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#141414]">
              Product Details
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              {product.description}
            </p>
          </div>

          {/* Ratings & Reviews Section */}
          <div className="mt-2 bg-white px-4 py-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-[#141414]">
                Ratings &amp; Reviews ({reviewsCount})
              </h3>
              <div className="flex items-center gap-1 text-xs font-extrabold text-[#141414]">
                <span>{product.rating}</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-3 w-3 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2.5">
              {CUSTOMER_REVIEWS.slice(0, 2).map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-xl bg-[#F8F6F4] p-3 text-xs text-neutral-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#141414]">{rev.name}</span>
                    <span className="text-[10px] font-medium text-emerald-700">
                      Verified Buyer
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
                    “{rev.quote}”
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Purchase Bar (Chat | Buy Now | Add to Cart) */}
        <footer className="sticky bottom-0 z-20 flex shrink-0 items-center gap-2 border-t border-black/10 bg-white px-3 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <a
            href={whatsappItemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center px-2 text-[10px] font-semibold text-neutral-600 transition-colors hover:text-[#16A34A]"
          >
            <MessageCircle className="h-5 w-5 text-[#16A34A]" aria-hidden="true" />
            <span className="mt-0.5">Chat</span>
          </a>

          <div className="flex flex-1 items-center gap-1.5">
            <button
              type="button"
              onClick={handleBuyNow}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] px-3 text-xs font-extrabold text-white shadow-xs transition-all hover:brightness-105 active:scale-[0.98]"
            >
              Buy Now
            </button>

            <button
              type="button"
              onClick={handleAdd}
              className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-white shadow-xs transition-all active:scale-[0.98] ${
                justAdded
                  ? 'bg-[#16A34A]'
                  : 'bg-[#EA4E1B] hover:bg-[#d44212]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Added!
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
