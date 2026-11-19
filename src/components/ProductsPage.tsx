import React, { useEffect, useMemo, useState } from 'react';
import { Check, Search, Star, Store, X } from 'lucide-react';
import { ViewMode } from '../config/shopConfig';
import { useLanguage } from '../context/LanguageContext';
import {
  CATALOG_PRODUCTS,
  CatalogProduct,
  formatPkr,
  PRODUCT_CATEGORIES,
  ProductCategory,
} from '../data/catalogData';
import { matchesProductQuery } from '../utils/catalogSearch';
import { ResilientImage } from './ResilientImage';

interface ProductsPageProps {
  products?: CatalogProduct[];
  initialCategory?: ProductCategory;
  externalSearchQuery?: string;
  onExternalSearchChange?: (next: string) => void;
  onInspectProduct: (product: CatalogProduct) => void;
  onQuickAddToCart: (product: CatalogProduct) => void;
  onOpenVirtualShop: (mode: ViewMode) => void;
}

type SortOrder = 'featured' | 'price-asc' | 'price-desc';

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products = CATALOG_PRODUCTS,
  initialCategory = 'All',
  externalSearchQuery,
  onExternalSearchChange,
  onInspectProduct,
  onQuickAddToCart,
  onOpenVirtualShop,
}) => {
  const { t, isUrdu } = useLanguage();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : localSearchQuery;
  const setSearchQuery = (next: string) => {
    setLocalSearchQuery(next);
    onExternalSearchChange?.(next);
  };
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory>(initialCategory);
  const [sortOrder, setSortOrder] = useState<SortOrder>('featured');
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const availableCategories = useMemo<ProductCategory[]>(() => {
    const set = new Set<string>(PRODUCT_CATEGORIES);
    products.forEach((p) => {
      if (p.category?.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const list = products.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const matchesQuery = matchesProductQuery(item, searchQuery);
      return matchesCategory && matchesQuery;
    });

    if (sortOrder === 'price-asc') {
      return [...list].sort((a, b) => a.pricePkr - b.pricePkr);
    }
    if (sortOrder === 'price-desc') {
      return [...list].sort((a, b) => b.pricePkr - a.pricePkr);
    }
    return list;
  }, [products, searchQuery, selectedCategory, sortOrder]);

  const handleQuickAdd = (e: React.MouseEvent, product: CatalogProduct) => {
    e.stopPropagation();
    onQuickAddToCart(product);
    setAddedId(product.id);
    window.setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1100);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortOrder('featured');
  };

  return (
    <div className="bg-[#F3ECE6] text-[#141414]">
      {/* Store Header & Filter Strip */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-end">
            <div>
              <p className={`text-[11px] font-semibold text-[#EA4E1B] sm:text-xs ${isUrdu ? 'font-urdu' : ''}`}>
                {t(
                  'Usman Mobile Stock · Cash on Pickup or Local Delivery',
                  'عثمان موبائل اسٹاک · دکان پر کیش یا مقامی ڈیلیوری',
                )}
              </p>
              <h1
                className={`font-display mt-1 text-2xl font-extrabold tracking-tight text-[#141414] sm:text-4xl ${
                  isUrdu ? 'font-urdu' : ''
                }`}
              >
                {t('Shop All', 'تمام')}{' '}
                <span className="text-[#EA4E1B]">{t('Products', 'پراڈکٹس')}</span>
              </h1>
            </div>

            <button
              type="button"
              onClick={() => onOpenVirtualShop('shop')}
              className="hidden h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-neutral-300 bg-white px-5 text-xs font-semibold text-[#141414] transition-colors hover:border-[#EA4E1B] hover:text-[#EA4E1B] sm:inline-flex"
            >
              <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('View Shelves in 3D Shop', 'تھری ڈی شاپ دیکھیں')}
            </button>
          </div>

          <div className="mt-3.5 flex flex-col gap-2.5 sm:mt-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Search & Sort first on mobile for quick access */}
            <div className="flex items-center gap-2 lg:order-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search charger, AirPods, cover..."
                  aria-label="Search products"
                  className="h-9 sm:h-10 w-full rounded-full border border-[#EA4E1B]/40 bg-[#F8F6F4] pr-8 pl-9 text-xs sm:text-sm text-[#141414] placeholder:text-neutral-400 focus:border-[#EA4E1B] focus:bg-white focus:outline-none sm:w-64"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-neutral-400 hover:text-[#141414]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                aria-label="Sort products"
                className="h-9 sm:h-10 shrink-0 rounded-full border border-neutral-200 bg-[#F8F6F4] px-3 sm:px-4 text-[11px] sm:text-xs font-semibold text-neutral-800 focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low-High</option>
                <option value="price-desc">Price: High-Low</option>
              </select>
            </div>

            {/* Category Tabs (horizontal scroll on mobile) */}
            <div
              role="tablist"
              aria-label="Product categories"
              className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 lg:order-1"
            >
              {availableCategories.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(category)}
                    className={`h-8 sm:h-9 shrink-0 whitespace-nowrap rounded-full px-3 sm:px-4 text-[11px] sm:text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#EA4E1B] text-white'
                        : 'bg-[#F3ECE6] text-neutral-700 hover:bg-[#EA4E1B]/10 hover:text-[#EA4E1B]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="mx-auto max-w-[1200px] px-2.5 py-4 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mb-3 sm:mb-5 flex items-center justify-between text-[11px] sm:text-xs text-neutral-600 px-0.5">
          <span className="tabular-nums">
            Showing {filteredProducts.length} of {products.length} items · Tap any item for details
          </span>
          {(selectedCategory !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-bold text-[#EA4E1B] hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-xs">
            <h2 className="font-display text-lg font-bold text-[#141414]">
              No matching items found
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              Try another search keyword or reset the active filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-[#F25C19] px-6 text-xs font-semibold text-white hover:bg-[#d94d10]"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filteredProducts.map((product) => {
              const isAdded = addedId === product.id;
              const discount = product.discountPercent ?? 25;
              const original = product.originalPricePkr ?? Math.round(product.pricePkr * 1.35);
              const reviews = product.reviewsCount ?? 450;
              const sold = product.soldCount ?? '2.5K sold';

              return (
                <article
                  key={product.id}
                  onClick={() => onInspectProduct(product)}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#EA4E1B] hover:shadow-md sm:rounded-2xl"
                >
                  {/* Compact Image Container so 4 products (2x2) fit on mobile screen */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F8F6F4] sm:aspect-square">
                    <ResilientImage
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-2 sm:p-3">
                    <div>
                      {/* Title with mini Deal tag like Daraz */}
                      <h2 className="line-clamp-2 text-[11px] font-semibold leading-snug text-[#141414] group-hover:text-[#EA4E1B] sm:text-sm">
                        {product.name}
                      </h2>

                      {/* Price + Discount % + Strikethrough */}
                      <div className="mt-1 flex flex-wrap items-baseline gap-1">
                        <span className="font-display text-[13px] font-extrabold tabular-nums text-[#EA4E1B] sm:text-base">
                          {formatPkr(product.pricePkr)}
                        </span>
                        <span className="rounded-xs bg-orange-50 px-1 py-0.5 text-[9px] font-bold text-[#EA4E1B] sm:text-[10px]">
                          -{discount}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-neutral-400 line-through tabular-nums sm:text-[11px]">
                          {formatPkr(original)}
                        </span>
                        <span className="rounded-xs bg-amber-50 px-1 text-[8px] font-semibold text-amber-700 sm:text-[10px]">
                          Save Rs.{Math.max(50, original - product.pricePkr)}
                        </span>
                      </div>

                      {/* Star Rating, Reviews Count & Sold Count */}
                      <div className="mt-1 flex items-center gap-0.5 text-[9px] text-neutral-500 sm:mt-1.5 sm:gap-1 sm:text-[11px]">
                        <Star
                          className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400 sm:h-3 sm:w-3"
                          aria-hidden="true"
                        />
                        <span className="font-bold text-neutral-700">{product.rating}</span>
                        <span className="text-neutral-400">({reviews})</span>
                        <span className="text-neutral-300">|</span>
                        <span className="truncate font-medium text-neutral-600">{sold}</span>
                      </div>
                    </div>

                    {/* Quick Add visible on desktop, while mobile taps card to open details + Add to Cart */}
                    <div className="mt-2.5 hidden border-t border-black/5 pt-2 sm:block">
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        className={`inline-flex h-8 w-full items-center justify-center gap-1 rounded-full px-2 text-[11px] font-bold text-white transition-colors ${
                          isAdded
                            ? 'bg-[#16A34A]'
                            : 'bg-[#EA4E1B] hover:bg-[#d44212]'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Added
                          </>
                        ) : (
                          'Add To Cart'
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
