import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Clock,
  MessageCircle,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Wrench,
  X,
} from 'lucide-react';
import { getWhatsAppUrl } from '../config/shopConfig';
import { useLanguage } from '../context/LanguageContext';
import {
  CatalogProduct,
  formatPkr,
  SitePage,
} from '../data/catalogData';
import { runGlobalCatalogSearch } from '../utils/catalogSearch';
import { AdminProductEditTrigger } from './AdminInlineControls';
import { ResilientImage } from './ResilientImage';

export const QUICK_SEARCH_CHIPS: Array<{ label: string; urLabel: string }> = [
  { label: 'Infinix Cover', urLabel: 'انفنکس کور' },
  { label: '65W Charger', urLabel: '65W چارجر' },
  { label: 'AirPods', urLabel: 'ایئرپوڈز' },
  { label: '9D Glass', urLabel: '9D گلاس' },
  { label: 'LCD Repair', urLabel: 'LCD ریپئرنگ' },
];

interface GlobalSearchBarProps {
  query: string;
  onQueryChange: (next: string) => void;
  activePage: SitePage;
  products: CatalogProduct[];
  onInspectProduct: (product: CatalogProduct) => void;
  onQuickAddToCart: (product: CatalogProduct) => void;
  onNavigate: (page: SitePage, sectionHash?: string) => void;
  onAdminEditProduct?: (product: CatalogProduct) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  query,
  onQueryChange,
  activePage,
  products,
  onInspectProduct,
  onQuickAddToCart,
  onNavigate,
  onAdminEditProduct,
}) => {
  const { t, isUrdu } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const trimmed = query.trim();

  const results = useMemo(
    () => runGlobalCatalogSearch(products, trimmed),
    [products, trimmed],
  );

  const handleClear = () => {
    onQueryChange('');
    inputRef.current?.focus();
  };

  const handleChipClick = (chipLabel: string) => {
    const isSame = trimmed.toLowerCase() === chipLabel.toLowerCase();
    onQueryChange(isSame ? '' : chipLabel);
    if (!isSame) {
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 40);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const handleQuickAdd = (e: React.MouseEvent, product: CatalogProduct) => {
    e.stopPropagation();
    onQuickAddToCart(product);
    setAddedId(product.id);
    window.setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1100);
  };

  // On ProductsPage, the product grid itself filters live via the synced query;
  // show inline results here on Home/Repairs/About, or show matching repair/digital services on ProductsPage.
  const showFullInlineResults = trimmed.length > 0 && activePage !== 'products';
  const showServicesBannerOnProducts =
    trimmed.length > 0 &&
    activePage === 'products' &&
    (results.repairs.length > 0 || results.digitalServices.length > 0);

  return (
    <section
      aria-label="Global product and repair search"
      className="border-b border-black/6 bg-[#FAF5F0]"
    >
      <div className="mx-auto max-w-[1200px] px-3 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        {/* Search Form */}
        <form
          onSubmit={handleFormSubmit}
          role="search"
          className="mx-auto flex max-w-3xl items-center gap-1.5 rounded-2xl border border-black/10 bg-white p-1.5 shadow-[0_2px_10px_rgba(20,20,20,0.04)] transition-all focus-within:border-[#F25C19] focus-within:ring-2 focus-within:ring-[#F25C19]/15"
        >
          <div className="flex flex-1 items-center gap-2 pl-2.5 sm:pl-3">
            <Search
              className="h-4 w-4 shrink-0 text-[#F25C19] sm:h-[18px] sm:w-[18px]"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t(
                'Search covers, 65W charger, AirPods, LCD, or phone model...',
                'کور، 65W چارجر، ایئرپوڈز، LCD یا موبائل ماڈل تلاش کریں...',
              )}
              aria-label="Search covers, 65W charger, AirPods, LCD, or phone model"
              className={`h-9 w-full bg-transparent text-xs text-[#141414] placeholder:text-neutral-400 focus:outline-none sm:h-10 sm:text-sm ${
                isUrdu ? 'font-urdu' : ''
              }`}
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                title="Clear search"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200 hover:text-[#141414]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#F25C19] px-4 text-xs font-bold text-white shadow-2xs transition hover:bg-[#d94d10] active:scale-[0.98] sm:h-10 sm:px-5 sm:text-sm ${
              isUrdu ? 'font-urdu' : ''
            }`}
          >
            <span>{t('Search', 'تلاش کریں')}</span>
          </button>
        </form>

        {/* Quick-Tap Suggestion Chips */}
        <div className="mx-auto mt-2.5 flex max-w-3xl items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
          <span
            className={`hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-neutral-400 sm:inline-flex ${
              isUrdu ? 'font-urdu' : ''
            }`}
          >
            <Sparkles className="h-3 w-3 text-[#F25C19]" aria-hidden="true" />
            {t('Popular:', 'مشہور:')}
          </span>
          {QUICK_SEARCH_CHIPS.map((chip) => {
            const isSelected = trimmed.toLowerCase() === chip.label.toLowerCase();
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip.label)}
                className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-3 py-1 text-[11px] font-semibold transition sm:text-xs ${
                  isUrdu ? 'font-urdu' : ''
                } ${
                  isSelected
                    ? 'border-[#F25C19] bg-[#F25C19] text-white shadow-2xs'
                    : 'border-black/8 bg-white text-neutral-700 hover:border-[#F25C19]/60 hover:bg-orange-50/70 hover:text-[#F25C19]'
                }`}
              >
                {isUrdu ? chip.urLabel : chip.label}
              </button>
            );
          })}
        </div>

        {/* Live Filtered Results Panel (Home, Repairs, About) */}
        {showFullInlineResults && (
          <div
            ref={resultsRef}
            className="mt-4 rounded-2xl border border-black/8 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/6 pb-3">
              <div>
                <h2
                  className={`font-display text-sm font-extrabold text-[#141414] sm:text-base ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                >
                  {t(
                    `Search results for "${trimmed}"`,
                    `"${trimmed}" کے لیے نتائج`,
                  )}
                </h2>
                <p className="mt-0.5 text-xs text-neutral-500 tabular-nums">
                  {results.totalCount === 0
                    ? t('No matching items found', 'کوئی ملتی جلتی چیز نہیں ملی')
                    : t(
                        `Found ${results.products.length} product${results.products.length === 1 ? '' : 's'}${
                          results.repairs.length + results.digitalServices.length > 0
                            ? ` & ${results.repairs.length + results.digitalServices.length} service${
                                results.repairs.length + results.digitalServices.length === 1 ? '' : 's'
                              }`
                            : ''
                        }`,
                        `${results.products.length} پراڈکٹس اور ${results.repairs.length + results.digitalServices.length} سروسز ملیں`,
                      )}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/12 bg-[#FAF5F0] px-3.5 py-1.5 text-xs font-bold text-[#141414] transition hover:border-[#F25C19] hover:text-[#F25C19]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('Reset', 'ری سیٹ')}</span>
              </button>
            </div>

            {results.totalCount === 0 ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#FAF5F0] text-[#F25C19]">
                  <Search className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3
                  className={`font-display text-base font-extrabold text-[#141414] ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                >
                  {t('No matching items found', 'کوئی ملتی جلتی چیز نہیں ملی')}
                </h3>
                <p
                  className={`mx-auto mt-1 max-w-md text-xs text-neutral-500 sm:text-sm ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                >
                  {t(
                    'Try searching another keyword like "AirPods", "65W Charger", "9D Glass", or ask us directly on WhatsApp for your exact phone model.',
                    'کوئی اور لفظ تلاش کریں جیسے "AirPods" یا "65W Charger"، یا اپنے فون ماڈل کے لیے واٹس ایپ پر پوچھیں۔',
                  )}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#F25C19] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#d94d10]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('Reset Search', 'تلاش ری سیٹ کریں')}</span>
                  </button>
                  <a
                    href={getWhatsAppUrl(`Assalam o Alaikum! Do you have "${trimmed}" in stock?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-[#16A34A]/30 bg-emerald-50 px-5 text-xs font-bold text-emerald-700 transition hover:bg-[#16A34A] hover:text-white"
                  >
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('Ask on WhatsApp', 'واٹس ایپ پر پوچھیں')}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                {/* Matching Products Grid */}
                {results.products.length > 0 && (
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        {t('Products & Accessories', 'پراڈکٹس اور ایسسریز')} ({results.products.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('products')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#F25C19] hover:underline"
                      >
                        <span>{t('View in Store', 'اسٹور میں دیکھیں')}</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                      {results.products.map((product) => {
                        const isAdded = addedId === product.id;
                        const discount = product.discountPercent ?? 25;
                        return (
                          <article
                            key={product.id}
                            onClick={() => onInspectProduct(product)}
                            className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-black/6 bg-[#FAF8F6] transition hover:-translate-y-0.5 hover:border-[#F25C19] hover:bg-white hover:shadow-md"
                          >
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3ECE6]">
                              <ResilientImage
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                              />
                              {onAdminEditProduct && (
                                <AdminProductEditTrigger
                                  onClick={() => onAdminEditProduct(product)}
                                />
                              )}
                            </div>
                            <div className="flex flex-1 flex-col justify-between p-2.5">
                              <div>
                                <h3 className="line-clamp-2 text-xs font-bold leading-snug text-[#141414] group-hover:text-[#F25C19]">
                                  {product.name}
                                </h3>
                                <div className="mt-1 flex flex-wrap items-baseline gap-1">
                                  <span className="font-display text-sm font-extrabold tabular-nums text-[#F25C19]">
                                    {formatPkr(product.pricePkr)}
                                  </span>
                                  <span className="rounded-xs bg-orange-50 px-1 py-0.5 text-[9px] font-bold text-[#F25C19]">
                                    -{discount}%
                                  </span>
                                </div>
                                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-500">
                                  <Star
                                    className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                                    aria-hidden="true"
                                  />
                                  <span className="font-semibold text-neutral-700">
                                    {product.rating}
                                  </span>
                                  <span className="truncate text-neutral-400">· {product.category}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleQuickAdd(e, product)}
                                className={`mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1 rounded-full text-[11px] font-bold text-white transition ${
                                  isAdded ? 'bg-[#16A34A]' : 'bg-[#F25C19] hover:bg-[#d94d10]'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="h-3 w-3" aria-hidden="true" />
                                    <span>Added</span>
                                  </>
                                ) : (
                                  <span>Add To Cart</span>
                                )}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Matching Repair & Digital Services */}
                {(results.repairs.length > 0 || results.digitalServices.length > 0) && (
                  <div>
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                        {t('Repair & Counter Services', 'ریپئرنگ اور کاؤنٹر سروسز')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('repairs')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#F25C19] hover:underline"
                      >
                        <span>{t('Open Repair Lab', 'ریپئرنگ لیب کھولیں')}</span>
                        <ArrowRight className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {results.repairs.map((repair) => (
                        <div
                          key={repair.id}
                          className="flex flex-col justify-between gap-2.5 rounded-xl border border-black/8 bg-[#FAF5F0]/70 p-3.5 transition hover:border-[#F25C19]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F25C19]/12 text-[#F25C19]">
                                <Wrench className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <div>
                                <h3 className="text-xs font-extrabold text-[#141414] sm:text-sm">
                                  {repair.title}
                                </h3>
                                <p className="mt-0.5 text-[11px] leading-snug text-neutral-600">
                                  {repair.summary}
                                </p>
                              </div>
                            </div>
                            <span className="shrink-0 font-display text-xs font-extrabold tabular-nums text-[#F25C19] sm:text-sm">
                              From {formatPkr(repair.startingPricePkr)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                              <Clock className="h-3 w-3 text-[#F25C19]" aria-hidden="true" />
                              {repair.turnaround} · {repair.warranty}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onNavigate('repairs')}
                                className="rounded-full border border-black/12 bg-white px-3 py-1 text-[11px] font-bold text-[#141414] transition hover:border-[#F25C19] hover:text-[#F25C19]"
                              >
                                {t('Details', 'تفصیل')}
                              </button>
                              <a
                                href={getWhatsAppUrl(
                                  `Assalam o Alaikum! I need "${repair.title}" (searched: ${trimmed}). Please share estimate.`,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-[#16A34A] px-3 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-700"
                              >
                                <MessageCircle className="h-3 w-3" aria-hidden="true" />
                                <span>{t('Book', 'بک کریں')}</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}

                      {results.digitalServices.map((svc) => (
                        <div
                          key={svc.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-[#FAF5F0]/70 p-3.5"
                        >
                          <div>
                            <h3 className="text-xs font-extrabold text-[#141414] sm:text-sm">
                              {svc.title}
                            </h3>
                            <p className="mt-0.5 text-[11px] text-neutral-600">{svc.details}</p>
                            <span className="mt-1 inline-block text-[10px] font-bold text-[#F25C19]">
                              {svc.availability}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onNavigate('repairs')}
                            className="shrink-0 rounded-full bg-[#141414] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#F25C19]"
                          >
                            {t('View', 'دیکھیں')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Compact Services Match Strip when already viewing ProductsPage */}
        {showServicesBannerOnProducts && (
          <div
            ref={resultsRef}
            className="mt-3 rounded-2xl border border-[#F25C19]/25 bg-white p-3.5 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#141414]">
                <Wrench className="h-4 w-4 text-[#F25C19]" aria-hidden="true" />
                <span>
                  {t('Matching Repair & Counter Services:', 'ملتی جلتی ریپئرنگ سروسز:')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('repairs')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#F25C19] hover:underline"
              >
                <span>{t('Open Repair Lab', 'ریپئرنگ لیب')}</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {results.repairs.map((repair) => (
                <a
                  key={repair.id}
                  href={getWhatsAppUrl(`Assalam o Alaikum! I need ${repair.title} (${trimmed}).`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-black/8 bg-[#FAF5F0] px-3 py-1.5 text-xs font-semibold text-[#141414] transition hover:border-[#F25C19] hover:text-[#F25C19]"
                >
                  <span>{repair.title}</span>
                  <span className="font-bold text-[#F25C19]">
                    {formatPkr(repair.startingPricePkr)}+
                  </span>
                </a>
              ))}
              {results.digitalServices.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => onNavigate('repairs')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/8 bg-[#FAF5F0] px-3 py-1.5 text-xs font-semibold text-[#141414] transition hover:border-[#F25C19] hover:text-[#F25C19]"
                >
                  <span>{svc.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
