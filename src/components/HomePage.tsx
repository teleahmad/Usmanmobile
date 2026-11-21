import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Compass,
  Edit3,
  Images,
  Plus,
  Star,
  Store,
} from 'lucide-react';
import { SHOP_CONFIG, ViewMode } from '../config/shopConfig';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  CATALOG_PRODUCTS,
  CatalogProduct,
  formatPkr,
  ProductCategory,
  SITE_IMAGES,
  SitePage,
} from '../data/catalogData';
import {
  DEFAULT_HOME_SECTIONS,
  HomeSectionsConfig,
  LiveCustomerReview,
  SiteMediaOverride,
} from '../hooks/useLiveStoreData';
import {
  AdminHomeSectionPickerModal,
  AdminShowcaseCardModal,
  EditableShowcaseCard,
  HomeSectionKey,
} from './AdminHomeEditors';
import {
  AdminImageControls,
  AdminProductEditTrigger,
} from './AdminInlineControls';
import { CustomerReviewsSection } from './CustomerReviewsSection';
import { ResilientImage } from './ResilientImage';

interface HomePageProps {
  products?: CatalogProduct[];
  liveReviews?: LiveCustomerReview[];
  hiddenReviewIds?: string[];
  reviewsVisible?: boolean;
  homeSections?: HomeSectionsConfig;
  siteImages?: Record<keyof typeof SITE_IMAGES, string>;
  mediaOverrides?: Record<string, SiteMediaOverride>;
  onNavigate: (page: SitePage, sectionHash?: string) => void;
  onBrowseCategory: (category: ProductCategory) => void;
  onOpenVirtualShop: (initialMode: ViewMode) => void;
  onInspectProduct: (product: CatalogProduct) => void;
  onQuickAddToCart: (product: CatalogProduct) => void;
  onAdminEditProduct?: (product: CatalogProduct) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products = CATALOG_PRODUCTS,
  liveReviews = [],
  hiddenReviewIds = [],
  reviewsVisible = true,
  homeSections = DEFAULT_HOME_SECTIONS,
  siteImages = SITE_IMAGES,
  mediaOverrides = {},
  onNavigate,
  onBrowseCategory,
  onOpenVirtualShop,
  onInspectProduct,
  onQuickAddToCart,
  onAdminEditProduct,
}) => {
  const { t, isUrdu } = useLanguage();
  const { isAdmin } = useAdminAuth();
  const [addedId, setAddedId] = useState<string | null>(null);
  const [trendingOffset, setTrendingOffset] = useState(0);
  const [featuredOffset, setFeaturedOffset] = useState(0);
  const [arrivalOffset, setArrivalOffset] = useState(0);
  const [activePickerSection, setActivePickerSection] = useState<{
    key: HomeSectionKey;
    title: string;
  } | null>(null);
  const [editingShowcaseCard, setEditingShowcaseCard] =
    useState<EditableShowcaseCard | null>(null);

  const genuineReviews = liveReviews.filter((r) => !hiddenReviewIds.includes(r.id));
  const totalReviewCount = genuineReviews.length;
  const averageRating =
    totalReviewCount > 0
      ? (
          genuineReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
          totalReviewCount
        ).toFixed(1)
      : null;
  const reviewerInitials = genuineReviews.slice(0, 3).map((r) =>
    r.customerName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'UM',
  );

  const catalogList = products.length > 0 ? products : CATALOG_PRODUCTS;

  const handleQuickAdd = (e: React.MouseEvent, product: CatalogProduct) => {
    e.stopPropagation();
    onQuickAddToCart(product);
    setAddedId(product.id);
    window.setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1100);
  };

  const resolveSectionPool = (
    ids: string[],
    fallback: CatalogProduct[],
  ): CatalogProduct[] => {
    if (!ids || ids.length === 0) return fallback;
    const byId = new Map(catalogList.map((p) => [p.id, p]));
    const resolved = ids
      .map((id) => byId.get(id))
      .filter((p): p is CatalogProduct => Boolean(p));
    return resolved.length > 0 ? resolved : fallback;
  };

  const getSectionSlice = (
    pool: CatalogProduct[],
    offset: number,
    count: number,
  ): CatalogProduct[] => {
    if (pool.length === 0) return [];
    if (pool.length <= count) return pool;
    const normalizedOffset = ((offset % pool.length) + pool.length) % pool.length;
    const result: CatalogProduct[] = [];
    for (let i = 0; i < count; i++) {
      result.push(pool[(normalizedOffset + i) % pool.length]);
    }
    return result;
  };

  const trendingPool = resolveSectionPool(homeSections.trendingIds, catalogList);
  const featuredPool = resolveSectionPool(homeSections.featuredIds, catalogList);
  const arrivalPool = resolveSectionPool(homeSections.newArrivalIds, catalogList);

  const trendingItems = getSectionSlice(trendingPool, trendingOffset, 4);
  const featuredItems = getSectionSlice(featuredPool, featuredOffset, 4);
  const arrivalStartOffset =
    homeSections.newArrivalIds.length > 0 ? arrivalOffset : arrivalOffset + 4;
  const arrivalItems = getSectionSlice(arrivalPool, arrivalStartOffset, 4);

  const airpodsTitle =
    mediaOverrides.bentoAirpods?.title?.trim() || 'Awesome\nAirPods & Buds';
  const smartwatchTitle =
    mediaOverrides.bentoSmartwatch?.title?.trim() || 'Smart Watches\n& PTA Phones';
  const audioTitle =
    mediaOverrides.bentoAudioCollection?.title?.trim() ||
    'Premium Audio & Headphone Collection';
  const audioCaption =
    mediaOverrides.bentoAudioCollection?.caption?.trim() ||
    'Ronin R-9 wired handsfree, Bluetooth speakers, and wireless earbuds — sound-tested right at our counter before you pay.';

  const renderProductCard = (
    product: CatalogProduct,
    highlighted = false,
    extraClassName = '',
  ) => {
    const isAdded = addedId === product.id;
    const discount = product.discountPercent ?? 25;
    const original = product.originalPricePkr ?? Math.round(product.pricePkr * 1.35);
    const hasRating = Boolean(product.rating?.trim());
    const reviews = product.reviewsCount && product.reviewsCount > 0 ? product.reviewsCount : null;
    const sold = product.soldCount?.trim() || null;
    const extraPhotosCount = product.galleryImages?.length ?? 0;

    return (
      <article
        key={product.id}
        onClick={() => onInspectProduct(product)}
        className={`group flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-[#EA4E1B] hover:shadow-md sm:rounded-2xl ${
          highlighted
            ? 'border border-[#EA4E1B]/70 shadow-xs'
            : 'border border-black/5 shadow-xs'
        } ${extraClassName}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F8F6F4]">
          <AdminProductEditTrigger onClick={() => onAdminEditProduct?.(product)} />
          <ResilientImage
            src={product.image}
            fallbackSrc={product.galleryImages?.[0]}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {extraPhotosCount > 0 && (
            <span className="pointer-events-none absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
              <Images className="h-2.5 w-2.5" aria-hidden="true" />
              <span>{extraPhotosCount + 1}</span>
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between p-2.5 sm:p-3.5">
          <div>
            <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-[#141414] group-hover:text-[#EA4E1B] sm:text-sm">
              {product.name}
            </h3>

            <div className="mt-1 flex flex-wrap items-baseline gap-1">
              <span className="font-display text-sm font-extrabold tabular-nums text-[#EA4E1B] sm:text-base">
                {formatPkr(product.pricePkr)}
              </span>
              <span className="rounded-xs bg-orange-50 px-1 py-0.5 text-[9px] font-bold text-[#EA4E1B] sm:text-[10px]">
                -{discount}%
              </span>
            </div>

            <div className="text-[9px] text-neutral-400 line-through tabular-nums sm:text-[11px]">
              {formatPkr(original)}
            </div>

            {(hasRating || reviews || sold) ? (
              <div className="mt-1 flex items-center gap-0.5 text-[9px] text-neutral-500 sm:mt-1.5 sm:gap-1 sm:text-[11px]">
                {hasRating && (
                  <>
                    <Star
                      className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400 sm:h-3 sm:w-3"
                      aria-hidden="true"
                    />
                    <span className="font-bold text-neutral-700">{product.rating}</span>
                  </>
                )}
                {reviews && <span className="text-neutral-400">({reviews})</span>}
                {(hasRating || reviews) && sold && <span className="text-neutral-300">|</span>}
                {sold && <span className="truncate font-medium text-neutral-600">{sold}</span>}
              </div>
            ) : (
              <div className="mt-1 text-[9px] font-semibold text-emerald-700 sm:mt-1.5 sm:text-[11px]">
                {product.status}
              </div>
            )}
          </div>

          <div className="mt-2.5 hidden border-t border-black/5 pt-2 sm:block">
            <button
              type="button"
              onClick={(e) => handleQuickAdd(e, product)}
              className={`inline-flex h-8 w-full items-center justify-center gap-1 whitespace-nowrap rounded-full px-3 text-[11px] font-bold text-white transition-colors ${
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
  };

  return (
    <div className="bg-[#F3ECE6] text-[#141414]">
      {/* 1. Warm Sand Editorial Hero Section */}
      <section className="overflow-hidden bg-[#F3ECE6]">
        <div className="mx-auto max-w-[1200px] px-4 pt-8 pb-0 sm:px-6 lg:px-8 lg:pt-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Left Copy */}
            <div className="pb-10 lg:col-span-6 lg:pb-16">
              <p className="text-xs font-semibold text-neutral-600" style={{ fontFamily: 'Georgia' }}>
                Usman Mobile Repairing Centre · Hussain Khan Wala, Chak No. 8, Pattoki
              </p>

              <h1
                className={`font-display mt-3 text-[clamp(2.4rem,4.5vw,3.8rem)] font-extrabold leading-[1.08] tracking-tight text-[#141414] text-balance ${
                  isUrdu ? 'font-urdu leading-[1.28]' : ''
                }`}
              >
                {t('Elevate Your', 'اپنے موبائل کا')}{' '}
                <span className="text-[#EA4E1B]">{t('Mobile', 'بہترین')}</span>{' '}
                {t('Experience', 'تجربہ پائیں')}
              </h1>

              <p
                className="font-urdu mt-2.5 text-lg font-medium text-neutral-700 lg:text-left"
                style={{ textAlign: 'left' }}
              >
                {SHOP_CONFIG.URDU_NAME}
              </p>

              <p
                className={`mt-4 max-w-md text-sm leading-relaxed text-neutral-600 sm:text-base ${
                  isUrdu ? 'font-urdu' : ''
                }`}
                style={{ fontFamily: isUrdu ? undefined : 'Times New Roman' }}
              >
                {t(
                  'Tested chargers, AirPods, covers, used phones & same-day phone repair — plus Easypaisa, JazzCash & interactive 3D shop walkthrough.',
                  'چیک شدہ چارجرز، ایئرپوڈز، کورز، استعمال شدہ فونز اور ایک ہی دن میں موبائل ریپئرنگ — ساتھ ایزی پیسہ، جاز کیش اور تھری ڈی شاپ وزٹ۔',
                )}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onBrowseCategory('All')}
                  className={`inline-flex h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full bg-[#EA4E1B] pr-2 pl-6 text-sm font-semibold text-white transition-colors hover:bg-[#d44212] ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                >
                  <span>{t('Shop Now', 'خریداری کریں')}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#EA4E1B]">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenVirtualShop('shop')}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-neutral-800/20 bg-white px-5 text-sm font-semibold text-[#141414] transition-colors hover:border-[#EA4E1B] hover:text-[#EA4E1B] ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                >
                  <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t('Visit 3D Shop', 'تھری ڈی شاپ دیکھیں')}
                </button>
              </div>
            </div>

            {/* Right Editorial Shop Owner Portrait + Floating Local Proof Card */}
            <div className="relative flex items-end justify-center lg:col-span-6 lg:justify-end">
              <div className="relative flex w-full max-w-[560px] items-center justify-center overflow-hidden rounded-t-3xl bg-[#F3ECE6]">
                <AdminImageControls
                  slotKey="heroLifestyle"
                  label="Hero Photo"
                  currentImage={siteImages.heroLifestyle}
                  hasOverride={Boolean(mediaOverrides.heroLifestyle)}
                />
                <ResilientImage
                  src={siteImages.heroLifestyle}
                  fallbackSrc={SITE_IMAGES.heroLifestyle}
                  alt="Usman Sarwar inside Usman Mobile Repairing Centre with phone repair tools and accessories"
                  priority
                  className="block max-h-[440px] w-full h-auto object-contain"
                />
                {/* Soft left feathered blur + blend into sand canvas */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 backdrop-blur-[2px] [-webkit-mask-image:linear-gradient(to_right,black_0%,transparent_100%)] [mask-image:linear-gradient(to_right,black_0%,transparent_100%)]" />
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#F3ECE6] via-[#F3ECE6]/55 to-transparent" />
              </div>

              {/* Compact Floating Social Proof Card (jumps to live reviews) */}
              {reviewsVisible && (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('usman:open-reviews'));
                    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="absolute bottom-5 left-2 rounded-2xl border border-black/5 bg-white px-4 py-3 text-left shadow-lg transition hover:-translate-y-0.5 sm:left-6"
                >
                  <p className={`text-[11px] font-bold text-[#141414] ${isUrdu ? 'font-urdu' : ''}`}>
                    {t('Our Reviews', 'کسٹمر ریویوز')}
                  </p>
                  {totalReviewCount > 0 && averageRating ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {reviewerInitials.map((initials, idx) => (
                          <span
                            key={`${initials}-${idx}`}
                            className="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-[#141414] text-[10px] font-bold text-white"
                          >
                            {initials}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-extrabold tabular-nums text-[#141414]">
                        {averageRating} ★ · {totalReviewCount}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#EA4E1B]">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      <span>{t('Write a review', 'ریویو لکھیں')}</span>
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pure White Strip: Our Trending Products (Orange Left Block + 3 Product Cards) */}
      <section className="bg-white py-14 lg:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-center justify-end gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setActivePickerSection({
                    key: 'trendingIds',
                    title: 'Our Trending Products',
                  })
                }
                title="Add listed products to Trending"
                aria-label="Add listed products to Trending"
                className="inline-flex h-9 items-center gap-1 rounded-full bg-[#141414] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#EA4E1B]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const len = Math.max(1, trendingPool.length);
                setTrendingOffset((prev) => (prev - 1 + len) % len);
              }}
              aria-label="Previous trending products"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#EA4E1B]/50 text-[#EA4E1B] transition-colors hover:bg-[#EA4E1B] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                const len = Math.max(1, trendingPool.length);
                setTrendingOffset((prev) => (prev + 1) % len);
              }}
              aria-label="Next trending products"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#EA4E1B] text-white transition-colors hover:bg-[#d44212]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
              {/* Signature Solid Burnt-Orange Anchor Card */}
              <button
                type="button"
                onClick={() => onBrowseCategory('All')}
                className="group col-span-2 flex min-h-[160px] flex-col justify-between rounded-2xl bg-[#EA4E1B] p-5 text-left text-white transition-colors hover:bg-[#d44212] lg:col-span-1 lg:min-h-[290px] lg:p-6"
              >
                <div>
                  <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-[28px]">
                    Our Trending Products
                  </h2>
                  <p className="mt-3 text-xs leading-relaxed text-white/85">
                    Live-tested fast chargers, handsfree, AirPods &amp; covers stocked
                    daily at our Main Bazar counter.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <span className="text-xs font-semibold text-white/90">
                    View full store
                  </span>
                  <ArrowUpRight
                    className="h-6 w-6 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </div>
              </button>

              {trendingItems.map((product, idx) =>
                renderProductCard(product, idx === 0, idx === 3 ? 'lg:hidden' : ''),
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setActivePickerSection({
                    key: 'trendingIds',
                    title: 'Our Trending Products',
                  })
                }
                title="Add listed product to Trending"
                aria-label="Add listed product to Trending"
                className="grid absolute right-1 top-1/2 z-20 h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#EA4E1B] text-white shadow-lg ring-4 ring-white transition hover:scale-105 hover:bg-[#d44212] lg:-right-4 lg:h-11 lg:w-11"
              >
                <Plus className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Shop Product by Category (Signature Editorial Bento Showcase on Warm Sand) */}
      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-[#141414] sm:text-4xl">
            Shop Product by
            <br />
            <span className="text-[#EA4E1B]">Category</span>
          </h2>

          <button
            type="button"
            onClick={() => onBrowseCategory('All')}
            className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#EA4E1B] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#d44212]"
          >
            View All
          </button>
        </div>

        <div className="mt-8 space-y-5">
          {/* Row 1: Two-Column Split — AirPods & Smart Watches */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="relative grid grid-cols-1 items-center gap-4 overflow-hidden rounded-2xl bg-white p-7 shadow-xs sm:grid-cols-12 sm:p-8">
              <div className="sm:col-span-6">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingShowcaseCard({
                        slotKey: 'bentoAirpods',
                        defaultTitle: 'Awesome AirPods & Buds',
                        currentTitle: airpodsTitle.replace(/\n/g, ' '),
                        currentImage: siteImages.bentoAirpods,
                        defaultImage: SITE_IMAGES.bentoAirpods,
                        aspectClass: 'aspect-[4/3]',
                        hasOverride: Boolean(mediaOverrides.bentoAirpods),
                        showCaptionField: false,
                      })
                    }
                    className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#141414] px-3 py-1 text-[11px] font-bold text-white shadow-xs transition hover:bg-[#EA4E1B]"
                  >
                    <Edit3 className="h-3 w-3" aria-hidden="true" />
                    <span>Edit Name &amp; Photo</span>
                  </button>
                )}
                <h3 className="font-display whitespace-pre-line text-2xl font-extrabold leading-tight text-[#141414]">
                  {airpodsTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => onBrowseCategory('Audio')}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#EA4E1B] pr-1.5 pl-5 text-xs font-semibold text-white transition-colors hover:bg-[#d44212]"
                >
                  <span>Shop Now</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#EA4E1B]">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              </div>
              <div className="sm:col-span-6">
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[12px] bg-[#F8F6F4]">
                  <AdminImageControls
                    slotKey="bentoAirpods"
                    label="AirPods Photo"
                    currentImage={siteImages.bentoAirpods}
                    hasOverride={Boolean(mediaOverrides.bentoAirpods)}
                  />
                  <ResilientImage
                    src={siteImages.bentoAirpods}
                    fallbackSrc={SITE_IMAGES.bentoAirpods}
                    alt={airpodsTitle}
                    className="block max-h-[340px] w-full h-auto rounded-[12px] object-contain sm:max-h-[380px]"
                  />
                </div>
              </div>
            </div>

            <div className="relative grid grid-cols-1 items-center gap-4 overflow-hidden rounded-2xl bg-white p-7 shadow-xs sm:grid-cols-12 sm:p-8">
              <div className="sm:col-span-6">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingShowcaseCard({
                        slotKey: 'bentoSmartwatch',
                        defaultTitle: 'Smart Watches & PTA Phones',
                        currentTitle: smartwatchTitle.replace(/\n/g, ' '),
                        currentImage: siteImages.bentoSmartwatch,
                        defaultImage: SITE_IMAGES.bentoSmartwatch,
                        aspectClass: 'aspect-[4/3]',
                        hasOverride: Boolean(mediaOverrides.bentoSmartwatch),
                        showCaptionField: false,
                      })
                    }
                    className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#141414] px-3 py-1 text-[11px] font-bold text-white shadow-xs transition hover:bg-[#EA4E1B]"
                  >
                    <Edit3 className="h-3 w-3" aria-hidden="true" />
                    <span>Edit Name &amp; Photo</span>
                  </button>
                )}
                <h3 className="font-display whitespace-pre-line text-2xl font-extrabold leading-tight text-[#141414]">
                  {smartwatchTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => onBrowseCategory('Phones & Wearables')}
                  className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-[#EA4E1B] pr-1.5 pl-5 text-xs font-semibold text-white transition-colors hover:bg-[#d44212]"
                >
                  <span>Shop Now</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#EA4E1B]">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              </div>
              <div className="sm:col-span-6">
                <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[12px] bg-white">
                  <AdminImageControls
                    slotKey="bentoSmartwatch"
                    label="Smartwatch Photo"
                    currentImage={siteImages.bentoSmartwatch}
                    hasOverride={Boolean(mediaOverrides.bentoSmartwatch)}
                  />
                  <ResilientImage
                    src={siteImages.bentoSmartwatch}
                    fallbackSrc={SITE_IMAGES.bentoSmartwatch}
                    alt={smartwatchTitle}
                    className="block max-h-[340px] w-full h-auto rounded-[12px] object-contain sm:max-h-[380px]"
                  />
                  {/* Slightly rounded corners with subtle feathered edge blur */}
                  <div className="pointer-events-none absolute inset-0 rounded-[12px] backdrop-blur-[2px] [-webkit-mask-image:radial-gradient(ellipse_78%_74%_at_center,transparent_60%,black_100%)] [mask-image:radial-gradient(ellipse_78%_74%_at_center,transparent_60%,black_100%)]" />
                  <div className="pointer-events-none absolute -inset-px rounded-[12px] shadow-[inset_0_0_22px_12px_#ffffff]" />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Full-Width White Showcase — Premium Audio Collection */}
          <div className="relative grid grid-cols-1 items-center gap-6 overflow-hidden rounded-2xl bg-white p-7 shadow-xs sm:p-10 md:grid-cols-12">
            <div className="md:col-span-5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    setEditingShowcaseCard({
                      slotKey: 'bentoAudioCollection',
                      defaultTitle: 'Premium Audio & Headphone Collection',
                      currentTitle: audioTitle,
                      defaultCaption:
                        'Ronin R-9 wired handsfree, Bluetooth speakers, and wireless earbuds — sound-tested right at our counter before you pay.',
                      currentCaption: audioCaption,
                      currentImage: siteImages.bentoAudioCollection,
                      defaultImage: SITE_IMAGES.bentoAudioCollection,
                      aspectClass: 'aspect-[16/9]',
                      hasOverride: Boolean(mediaOverrides.bentoAudioCollection),
                      showCaptionField: true,
                    })
                  }
                  className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#141414] px-3 py-1 text-[11px] font-bold text-white shadow-xs transition hover:bg-[#EA4E1B]"
                >
                  <Edit3 className="h-3 w-3" aria-hidden="true" />
                  <span>Edit Name &amp; Photo</span>
                </button>
              )}
              <h3 className="font-display whitespace-pre-line text-2xl font-extrabold leading-tight text-[#141414] sm:text-3xl">
                {audioTitle}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                {audioCaption}
              </p>
              <button
                type="button"
                onClick={() => onBrowseCategory('Audio')}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-[#EA4E1B] pr-1.5 pl-5 text-xs font-semibold text-white transition-colors hover:bg-[#d44212]"
              >
                <span>Shop Now</span>
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#EA4E1B]">
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </button>
            </div>
            <div className="md:col-span-7">
              <div className="relative flex w-full items-center justify-center overflow-hidden rounded-[12px] bg-[#F8F6F4]">
                <AdminImageControls
                  slotKey="bentoAudioCollection"
                  label="Audio Collection Photo"
                  currentImage={siteImages.bentoAudioCollection}
                  hasOverride={Boolean(mediaOverrides.bentoAudioCollection)}
                />
                <ResilientImage
                  src={siteImages.bentoAudioCollection}
                  fallbackSrc={SITE_IMAGES.bentoAudioCollection}
                  alt={audioTitle}
                  className="block max-h-[380px] w-full h-auto rounded-[12px] object-contain sm:max-h-[420px]"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Full-Width White Showcase — 3D Virtual Shop, Map & Repair Lab */}
          <div className="grid grid-cols-1 items-center gap-6 overflow-hidden rounded-2xl bg-white p-7 shadow-xs sm:p-10 md:grid-cols-12">
            <div className="md:col-span-6">
              <p className="text-xs font-bold text-[#EA4E1B]">
                Hussain Khan Wala · Main Bazar
              </p>
              <h3 className="font-display mt-1.5 text-2xl font-extrabold leading-tight text-[#141414] sm:text-3xl">
                Walk Inside Our 3D Shop &amp; Repair Lab
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutral-500">
                Explore our interactive village map, zoom straight inside Usman Mobile
                in 360°, or book same-day LCD, charging IC, and software repairs.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenVirtualShop('shop')}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#EA4E1B] pr-1.5 pl-5 text-xs font-semibold text-white transition-colors hover:bg-[#d44212]"
                >
                  <span>Open 3D Shop</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#EA4E1B]">
                    <Store className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenVirtualShop('map')}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 text-xs font-semibold text-[#141414] transition-colors hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
                >
                  <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                  Village Map
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('repairs')}
                  className="inline-flex h-10 items-center rounded-full bg-[#141414] px-4 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
                >
                  Repair Rates
                </button>
              </div>
            </div>
            <div className="md:col-span-6">
              <div className="relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-white">
                <AdminImageControls
                  slotKey="realInteriorCounter"
                  label="Shop Interior Photo"
                  currentImage={siteImages.realInteriorCounter}
                  hasOverride={Boolean(mediaOverrides.realInteriorCounter)}
                />
                <ResilientImage
                  src={siteImages.realInteriorCounter}
                  fallbackSrc={SITE_IMAGES.realInteriorCounter}
                  alt="Real interior view of Usman Mobile Repairing Centre counter and accessories wall"
                  className="block max-h-[360px] w-full h-auto object-contain"
                />
                {/* Seamless 4-side feathered blur & smooth white dissolve (no corner seams) */}
                <div className="pointer-events-none absolute inset-0 backdrop-blur-[2.5px] [-webkit-mask-image:radial-gradient(ellipse_74%_70%_at_center,transparent_58%,black_100%)] [mask-image:radial-gradient(ellipse_74%_70%_at_center,transparent_58%,black_100%)]" />
                <div className="pointer-events-none absolute -inset-px rounded-xl shadow-[inset_0_0_26px_16px_#ffffff]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Products (4-Column Carousel Grid on Warm Sand) */}
      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl">
            Featured <span className="text-[#EA4E1B]">Products</span>
          </h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setActivePickerSection({
                    key: 'featuredIds',
                    title: 'Featured Products',
                  })
                }
                title="Add listed products to Featured Products"
                aria-label="Add listed products to Featured Products"
                className="inline-flex h-9 items-center gap-1 rounded-full bg-[#141414] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#EA4E1B]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const len = Math.max(1, featuredPool.length);
                setFeaturedOffset((prev) => (prev - 1 + len) % len);
              }}
              aria-label="Previous featured products"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#EA4E1B]/50 bg-white text-[#EA4E1B] transition-colors hover:bg-[#EA4E1B] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                const len = Math.max(1, featuredPool.length);
                setFeaturedOffset((prev) => (prev + 1) % len);
              }}
              aria-label="Next featured products"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#EA4E1B] text-white transition-colors hover:bg-[#d44212]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="relative mt-5 sm:mt-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {featuredItems.map((product) => renderProductCard(product))}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                setActivePickerSection({
                  key: 'featuredIds',
                  title: 'Featured Products',
                })
              }
              title="Add listed product to Featured Products"
              aria-label="Add listed product to Featured Products"
              className="grid absolute right-1 top-1/2 z-20 h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#EA4E1B] text-white shadow-lg ring-4 ring-[#F3ECE6] transition hover:scale-105 hover:bg-[#d44212] lg:-right-4 lg:h-11 lg:w-11"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* 5. New Arrival (4-Column Carousel Grid on Warm Sand) */}
      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl">
            New <span className="text-[#EA4E1B]">Arrival</span>
          </h2>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setActivePickerSection({
                    key: 'newArrivalIds',
                    title: 'New Arrival',
                  })
                }
                title="Add listed products to New Arrival"
                aria-label="Add listed products to New Arrival"
                className="inline-flex h-9 items-center gap-1 rounded-full bg-[#141414] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#EA4E1B]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Add</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const len = Math.max(1, arrivalPool.length);
                setArrivalOffset((prev) => (prev - 1 + len) % len);
              }}
              aria-label="Previous new arrivals"
              className="grid h-9 w-9 place-items-center rounded-full border border-[#EA4E1B]/50 bg-white text-[#EA4E1B] transition-colors hover:bg-[#EA4E1B] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                const len = Math.max(1, arrivalPool.length);
                setArrivalOffset((prev) => (prev + 1) % len);
              }}
              aria-label="Next new arrivals"
              className="grid h-9 w-9 place-items-center rounded-full bg-[#EA4E1B] text-white transition-colors hover:bg-[#d44212]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="relative mt-5 sm:mt-6">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {arrivalItems.map((product) => renderProductCard(product))}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() =>
                setActivePickerSection({
                  key: 'newArrivalIds',
                  title: 'New Arrival',
                })
              }
              title="Add listed product to New Arrival"
              aria-label="Add listed product to New Arrival"
              className="grid absolute right-1 top-1/2 z-20 h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-[#EA4E1B] text-white shadow-lg ring-4 ring-[#F3ECE6] transition hover:scale-105 hover:bg-[#d44212] lg:-right-4 lg:h-11 lg:w-11"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      {/* 6. Real Customer Reviews & Ratings (with 4-digit privacy, self-edit & admin show/hide/delete) */}
      <CustomerReviewsSection
        liveReviews={liveReviews}
        hiddenReviewIds={hiddenReviewIds}
        reviewsVisible={reviewsVisible}
        compact
      />

      {/* Admin Modals for Home Product Rows (+) & Home Showcase Cards */}
      <AdminHomeSectionPickerModal
        sectionKey={activePickerSection?.key ?? null}
        sectionTitle={activePickerSection?.title ?? ''}
        allProducts={catalogList}
        homeSections={homeSections}
        onClose={() => setActivePickerSection(null)}
      />

      <AdminShowcaseCardModal
        card={editingShowcaseCard}
        onClose={() => setEditingShowcaseCard(null)}
      />
    </div>
  );
};
