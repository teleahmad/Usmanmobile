import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { REMOVED_IMAGE_MARKER } from '../components/ResilientImage';
import {
  DEFAULT_SOCIAL_LINKS,
  SocialLinksConfig,
} from '../components/SocialLinksBar';
import {
  CATALOG_PRODUCTS,
  CatalogProduct,
  resolvePortableAssetUrl,
  SHOP_GALLERY,
  ShopGalleryPhoto,
  SITE_IMAGES,
} from '../data/catalogData';
import type { UsedPhoneItem } from '../data/usedPhonesData';
import { db } from '../firebase';

const MEDIA_CACHE_KEY = 'usman_live_media_cache_v1';
const PRODUCTS_CACHE_KEY = 'usman_live_products_cache_v1';
const HOME_SECTIONS_CACHE_KEY = 'usman_live_home_sections_cache_v1';

function readJsonCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJsonCache(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors (Firestore IndexedDB persistentLocalCache still backs it up)
  }
}

export interface LiveCustomerReview {
  id: string;
  customerName: string;
  maskedPhone: string;
  rating: number;
  service?: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  isSeed?: boolean;
}

export type SiteMediaSlotKey =
  | 'realInteriorCounter'
  | 'realInteriorDoor'
  | 'storefront'
  | 'signboard'
  | 'interiorWide'
  | 'heroLifestyle'
  | 'bentoCasesTrio'
  | 'bentoAirpods'
  | 'bentoSmartwatch'
  | 'bentoAudioCollection'
  | 'aerialMap'
  | 'monitorScreen';

export interface SiteMediaOverride {
  slotKey: SiteMediaSlotKey;
  title?: string;
  caption?: string;
  imageUrl?: string;
  updatedAt?: string;
}

export interface HomeSectionsConfig {
  trendingIds: string[];
  featuredIds: string[];
  newArrivalIds: string[];
}

export const DEFAULT_HOME_SECTIONS: HomeSectionsConfig = {
  trendingIds: [],
  featuredIds: [],
  newArrivalIds: [],
};

export interface LiveCatalogProduct extends CatalogProduct {
  inStock?: boolean;
  hidden?: boolean;
  isCustom?: boolean;
  isOverridden?: boolean;
}

interface FirestoreProductDoc {
  sku?: string;
  shopItemKey?: string;
  name?: string;
  category?: string;
  pricePkr?: number;
  originalPricePkr?: number;
  discountPercent?: number;
  rating?: string;
  reviewsCount?: number;
  soldCount?: string;
  status?: string;
  inStock?: boolean;
  hidden?: boolean;
  deleted?: boolean;
  featured?: boolean;
  specs?: string;
  description?: string;
  warrantyNote?: string;
  image?: string;
  galleryImages?: string[];
  variants?: string[];
}

export interface SiteMediaSlotConfig {
  slotKey: SiteMediaSlotKey;
  label: string;
  description: string;
  defaultTitle: string;
  defaultCaption: string;
  defaultImage: string;
}

export const SITE_MEDIA_SLOTS: SiteMediaSlotConfig[] = [
  {
    slotKey: 'storefront',
    label: 'Shop Bahir / Storefront (دکان کے باہر کی تصویر)',
    description: 'Main Bazar exterior shop front displayed in Gallery & About page',
    defaultTitle: 'Main Bazar Storefront',
    defaultCaption: 'Usman Mobile Repairing Centre entrance in Hussain Khan Wala, Chak No. 8.',
    defaultImage: SITE_IMAGES.storefront,
  },
  {
    slotKey: 'realInteriorCounter',
    label: 'Shop Andar / Counter & Accessories Wall (اندرونی کاؤنٹر)',
    description: 'Featured on Home page 3D Shop showcase & Shop Gallery',
    defaultTitle: 'Accessories Wall & Marble Showcase',
    defaultCaption: 'Cables, handsfree, glass showcase counter, and rear repair desk.',
    defaultImage: SITE_IMAGES.realInteriorCounter,
  },
  {
    slotKey: 'realInteriorDoor',
    label: 'Shop Andar / Front Entrance & PC Desk (اندرونی دروازہ)',
    description: 'Displayed inside Real Shop Gallery on About & Contact page',
    defaultTitle: 'Front Entrance & Counter PC',
    defaultCaption: 'Main Bazar roadside door, display counter, and customer billing desk.',
    defaultImage: SITE_IMAGES.realInteriorDoor,
  },
  {
    slotKey: 'signboard',
    label: 'Main Shop Signboard (مین سائن بورڈ)',
    description: 'Hero banner image on the About Us page & Shop Gallery',
    defaultTitle: 'Main Shop Signboard',
    defaultCaption: 'Repairing, software, accessories, Easypaisa, JazzCash & bill payments.',
    defaultImage: SITE_IMAGES.signboard,
  },
  {
    slotKey: 'interiorWide',
    label: 'Wide Shop Interior View (دکان کا مکمل منظر)',
    description: 'Wide angle interior shelves photo shown in Shop Gallery',
    defaultTitle: 'Wide Shop View',
    defaultCaption: 'Full view of shelves, glass showcase, and daily counter.',
    defaultImage: SITE_IMAGES.interiorWide,
  },
  {
    slotKey: 'heroLifestyle',
    label: 'Home Page Main Banner Photo (ہوم پیج مین تصویر)',
    description: 'Top hero photograph on the Home page',
    defaultTitle: 'Home Hero Photo',
    defaultCaption: 'Main hero showcase on the website landing section.',
    defaultImage: SITE_IMAGES.heroLifestyle,
  },
  {
    slotKey: 'monitorScreen',
    label: '3D Counter Monitor Screenshot (3D مانیٹر سکرین تصویر)',
    description: 'Custom HD screenshot displayed on the 3D counter PC monitor in virtual shop',
    defaultTitle: '3D Counter Monitor Screen',
    defaultCaption: 'High-resolution custom screen display on shop counter PC.',
    defaultImage: '',
  },
];

export function useLiveStoreData() {
  const initialCachedProducts = useMemo(
    () => readJsonCache<Record<string, FirestoreProductDoc>>(PRODUCTS_CACHE_KEY),
    [],
  );
  const initialCachedMedia = useMemo(
    () => readJsonCache<Record<string, SiteMediaOverride>>(MEDIA_CACHE_KEY),
    [],
  );
  const initialCachedHomeSections = useMemo(
    () => readJsonCache<HomeSectionsConfig>(HOME_SECTIONS_CACHE_KEY),
    [],
  );

  const [productDocs, setProductDocs] = useState<Record<string, FirestoreProductDoc>>(
    () => initialCachedProducts ?? {},
  );
  const [productsReady, setProductsReady] = useState<boolean>(
    () => initialCachedProducts !== null,
  );
  const [mediaOverrides, setMediaOverrides] = useState<Record<string, SiteMediaOverride>>(
    () => initialCachedMedia ?? {},
  );
  const [mediaReady, setMediaReady] = useState<boolean>(() => initialCachedMedia !== null);
  const [liveReviews, setLiveReviews] = useState<LiveCustomerReview[]>([]);
  const [hiddenReviewIds, setHiddenReviewIds] = useState<string[]>([]);
  const [reviewsVisible, setReviewsVisible] = useState<boolean>(true);
  const [homeSections, setHomeSections] = useState<HomeSectionsConfig>(
    () => initialCachedHomeSections ?? DEFAULT_HOME_SECTIONS,
  );
  const [socialLinks, setSocialLinks] = useState<SocialLinksConfig>(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    const coldFallbackTimer = window.setTimeout(() => {
      setMediaReady(true);
      setProductsReady(true);
    }, 2200);

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const next: Record<string, FirestoreProductDoc> = {};
        snap.docs.forEach((docSnap) => {
          next[docSnap.id] = docSnap.data() as FirestoreProductDoc;
        });
        setProductDocs(next);
        setProductsReady(true);
        try {
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(next));
        } catch {
          // Persist as many full products as fit within localStorage quota without stripping images to undefined
          const partial: Record<string, FirestoreProductDoc> = {};
          for (const [id, docData] of Object.entries(next)) {
            const candidate = { ...partial, [id]: docData };
            try {
              localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(candidate));
              partial[id] = docData;
            } catch {
              // Preserve deleted/hidden metadata cleanly if image base64 exceeds 5MB quota
              const slimDoc: FirestoreProductDoc = {
                ...docData,
                image:
                  docData.image && docData.image.length > 60_000 ? undefined : docData.image,
                galleryImages: Array.isArray(docData.galleryImages)
                  ? docData.galleryImages.filter(
                      (g) => typeof g === 'string' && g.length <= 60_000,
                    )
                  : undefined,
              };
              partial[id] = slimDoc;
              writeJsonCache(PRODUCTS_CACHE_KEY, partial);
            }
          }
        }
      },
      (err) => {
        setProductsReady(true);
        console.warn('Products live sync notice:', err.message);
      },
    );

    const unsubMedia = onSnapshot(
      collection(db, 'siteMedia'),
      (snap) => {
        const next: Record<string, SiteMediaOverride> = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as Partial<SiteMediaOverride>;
          if (data.slotKey) {
            next[docSnap.id] = {
              slotKey: data.slotKey as SiteMediaSlotKey,
              title: typeof data.title === 'string' ? data.title : undefined,
              caption: typeof data.caption === 'string' ? data.caption : undefined,
              imageUrl:
                typeof data.imageUrl === 'string' && data.imageUrl.trim()
                  ? data.imageUrl
                  : undefined,
              updatedAt: data.updatedAt,
            };
          }
        });
        setMediaOverrides(next);
        setMediaReady(true);
        try {
          localStorage.setItem(MEDIA_CACHE_KEY, JSON.stringify(next));
        } catch {
          // Persist most recently updated slots & all removal markers within quota
          const sorted = Object.entries(next).sort((a, b) =>
            (b[1].updatedAt || '').localeCompare(a[1].updatedAt || ''),
          );
          const partial: Record<string, SiteMediaOverride> = {};
          for (const [k, v] of sorted) {
            const candidate = { ...partial, [k]: v };
            try {
              localStorage.setItem(MEDIA_CACHE_KEY, JSON.stringify(candidate));
              partial[k] = v;
            } catch {
              // Keep at least removal marker / title without large base64 if tight on quota
              if (v.imageUrl === REMOVED_IMAGE_MARKER) {
                partial[k] = v;
              }
            }
          }
        }
      },
      (err) => {
        setMediaReady(true);
        console.warn('Site media live sync notice:', err.message);
      },
    );

    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        const loaded: LiveCustomerReview[] = snap.docs
          .map((docSnap) => {
            const d = docSnap.data() as Partial<LiveCustomerReview>;
            return {
              id: docSnap.id,
              customerName: d.customerName || 'Customer',
              maskedPhone: d.maskedPhone || '••••••0000',
              rating: typeof d.rating === 'number' ? d.rating : 5,
              service: d.service || '',
              comment: d.comment || '',
              createdAt: d.createdAt || '',
              updatedAt: d.updatedAt || d.createdAt || '',
            };
          })
          .filter((r) => r.comment.trim().length > 0)
          .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
        setLiveReviews(loaded);
      },
      (err) => {
        console.warn('Reviews live sync notice:', err.message);
      },
    );

    const unsubSocial = onSnapshot(
      doc(db, 'siteSettings', 'socialLinks'),
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data() as Partial<SocialLinksConfig>;
          setSocialLinks({
            tiktok: typeof d.tiktok === 'string' ? d.tiktok : '',
            youtube: typeof d.youtube === 'string' ? d.youtube : '',
            facebook: typeof d.facebook === 'string' ? d.facebook : '',
            instagram: typeof d.instagram === 'string' ? d.instagram : '',
            x: typeof d.x === 'string' ? d.x : '',
            updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : undefined,
          });
        } else {
          setSocialLinks(DEFAULT_SOCIAL_LINKS);
        }
      },
      (err) => {
        console.warn('Social links live sync notice:', err.message);
      },
    );

    const unsubHiddenReviews = onSnapshot(
      doc(db, 'siteSettings', 'hiddenReviews'),
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data() as { hiddenIds?: unknown; reviewsVisible?: unknown };
          setHiddenReviewIds(
            Array.isArray(d.hiddenIds)
              ? d.hiddenIds.filter((id): id is string => typeof id === 'string')
              : [],
          );
          setReviewsVisible(typeof d.reviewsVisible === 'boolean' ? d.reviewsVisible : true);
          return;
        }
        setHiddenReviewIds([]);
        setReviewsVisible(true);
      },
      (err) => {
        console.warn('Hidden reviews live sync notice:', err.message);
      },
    );

    const unsubHomeSections = onSnapshot(
      doc(db, 'siteSettings', 'homeSections'),
      (docSnap) => {
        if (docSnap.exists()) {
          const d = docSnap.data() as {
            trendingIds?: unknown;
            featuredIds?: unknown;
            newArrivalIds?: unknown;
          };
          const toIds = (v: unknown) =>
            Array.isArray(v) ? v.filter((id): id is string => typeof id === 'string') : [];
          const resolvedSections: HomeSectionsConfig = {
            trendingIds: toIds(d.trendingIds),
            featuredIds: toIds(d.featuredIds),
            newArrivalIds: toIds(d.newArrivalIds),
          };
          setHomeSections(resolvedSections);
          writeJsonCache(HOME_SECTIONS_CACHE_KEY, resolvedSections);
          return;
        }
        setHomeSections(DEFAULT_HOME_SECTIONS);
        writeJsonCache(HOME_SECTIONS_CACHE_KEY, DEFAULT_HOME_SECTIONS);
      },
      (err) => {
        console.warn('Home sections live sync notice:', err.message);
      },
    );

    return () => {
      window.clearTimeout(coldFallbackTimer);
      unsubProducts();
      unsubMedia();
      unsubReviews();
      unsubSocial();
      unsubHiddenReviews();
      unsubHomeSections();
    };
  }, []);

  const allProducts = useMemo<LiveCatalogProduct[]>(() => {
    const seenIds = new Set<string>();

    const mergedDefaults: LiveCatalogProduct[] = CATALOG_PRODUCTS.flatMap(
      (base): LiveCatalogProduct[] => {
        seenIds.add(base.id);
        const override = productDocs[base.id];
        if (override?.deleted) {
          return [];
        }
        if (!override) {
          return [
            {
              ...base,
              image: productsReady ? base.image : '',
              inStock: true,
              hidden: false,
              isCustom: false,
              isOverridden: false,
            },
          ];
        }
        const inStock = override.inStock !== undefined ? override.inStock : true;
        return [
          {
            ...base,
            sku: override.sku || base.sku,
            shopItemKey: override.shopItemKey || base.shopItemKey,
            name: override.name || base.name,
            category: override.category || base.category,
            pricePkr: typeof override.pricePkr === 'number' ? override.pricePkr : base.pricePkr,
            originalPricePkr:
              typeof override.originalPricePkr === 'number'
                ? override.originalPricePkr
                : base.originalPricePkr,
            discountPercent:
              typeof override.discountPercent === 'number'
                ? override.discountPercent
                : base.discountPercent,
            rating: override.rating || base.rating,
            reviewsCount:
              typeof override.reviewsCount === 'number' && override.reviewsCount > 0
                ? override.reviewsCount
                : undefined,
            soldCount: override.soldCount?.trim() || undefined,
            status: override.status || (inStock ? base.status : 'Out of Stock'),
            inStock,
            hidden: Boolean(override.hidden),
            featured: override.featured !== undefined ? override.featured : base.featured,
            specs: override.specs || base.specs,
            description: override.description || base.description,
            warrantyNote: override.warrantyNote || base.warrantyNote,
            image: override.image
              ? resolvePortableAssetUrl(override.image, base.image)
              : productsReady
                ? base.image
                : '',
            galleryImages: Array.isArray(override.galleryImages)
              ? override.galleryImages
                  .filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
                  .map((g) => resolvePortableAssetUrl(g, base.image))
              : undefined,
            variants:
              Array.isArray(override.variants) && override.variants.length > 0
                ? override.variants
                : base.variants,
            isCustom: false,
            isOverridden: true,
          },
        ];
      },
    );

    const customProducts: LiveCatalogProduct[] = Object.entries(productDocs)
      .filter(([id, data]) => !seenIds.has(id) && !data.deleted)
      .map(([id, data]) => {
        const inStock = data.inStock !== undefined ? data.inStock : true;
        const pricePkr = typeof data.pricePkr === 'number' ? data.pricePkr : 0;
        const originalPricePkr =
          typeof data.originalPricePkr === 'number'
            ? data.originalPricePkr
            : Math.round(pricePkr * 1.25);
        const discountPercent =
          typeof data.discountPercent === 'number'
            ? data.discountPercent
            : originalPricePkr > pricePkr
              ? Math.round(((originalPricePkr - pricePkr) / originalPricePkr) * 100)
              : 0;
        const resolvedGallery = Array.isArray(data.galleryImages)
          ? data.galleryImages
              .filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
              .map((g) => resolvePortableAssetUrl(g, SITE_IMAGES.realInteriorCounter))
          : undefined;
        const fallbackCustomImg =
          resolvedGallery?.[0] || (productsReady ? SITE_IMAGES.realInteriorCounter : '');

        return {
          id,
          sku: data.sku || `UM-${id.slice(0, 6).toUpperCase()}`,
          shopItemKey: data.shopItemKey || data.name || 'Accessory',
          name: data.name || 'New Product',
          category: data.category || 'Charging',
          pricePkr,
          originalPricePkr,
          discountPercent,
          rating: data.rating?.trim() || '',
          reviewsCount:
            typeof data.reviewsCount === 'number' && data.reviewsCount > 0
              ? data.reviewsCount
              : undefined,
          soldCount: data.soldCount?.trim() || undefined,
          status: data.status || (inStock ? 'In Stock' : 'Out of Stock'),
          inStock,
          hidden: Boolean(data.hidden),
          featured: data.featured !== undefined ? data.featured : true,
          specs: data.specs || 'Tested at Usman Mobile Counter · Quality Guaranteed',
          description:
            data.description ||
            'Available for pickup at Usman Mobile Repairing Centre or local delivery in Chak No. 8 & Pattoki.',
          warrantyNote: data.warrantyNote || 'Live check at counter',
          image: data.image
            ? resolvePortableAssetUrl(data.image, fallbackCustomImg)
            : fallbackCustomImg,
          galleryImages: resolvedGallery,
          variants:
            Array.isArray(data.variants) && data.variants.length > 0
              ? data.variants
              : ['Standard'],
          isCustom: true,
          isOverridden: true,
        };
      });

    return [...customProducts, ...mergedDefaults];
  }, [productDocs, productsReady]);

  const visibleProducts = useMemo(
    () => allProducts.filter((p) => !p.hidden),
    [allProducts],
  );

  const usedPhones = useMemo<UsedPhoneItem[]>(() => [], []);

  const liveSiteImages = useMemo(() => {
    const resolveSlot = (slotKey: keyof typeof SITE_IMAGES): string => {
      const overrideUrl = mediaOverrides[slotKey]?.imageUrl;
      if (overrideUrl === REMOVED_IMAGE_MARKER) return REMOVED_IMAGE_MARKER;
      if (overrideUrl) return resolvePortableAssetUrl(overrideUrl, SITE_IMAGES[slotKey]);
      // On a brand-new browser before initial Firestore siteMedia arrives, render clean shimmer
      // instead of flashing an old/deleted default image for 1–2 seconds.
      if (!mediaReady) return '';
      return SITE_IMAGES[slotKey];
    };

    return {
      ...SITE_IMAGES,
      realInteriorCounter: resolveSlot('realInteriorCounter'),
      realInteriorDoor: resolveSlot('realInteriorDoor'),
      storefront: resolveSlot('storefront'),
      signboard: resolveSlot('signboard'),
      interiorWide: resolveSlot('interiorWide'),
      heroLifestyle: resolveSlot('heroLifestyle'),
      bentoCasesTrio: resolveSlot('bentoCasesTrio'),
      bentoAirpods: resolveSlot('bentoAirpods'),
      bentoSmartwatch: resolveSlot('bentoSmartwatch'),
      bentoAudioCollection: resolveSlot('bentoAudioCollection'),
      aerialMap: resolveSlot('aerialMap'),
      monitorScreen: resolveSlot('monitorScreen'),
    };
  }, [mediaOverrides, mediaReady]);

  const liveShopGallery = useMemo<ShopGalleryPhoto[]>(() => {
    const slotMap: Record<string, SiteMediaSlotKey> = {
      'gallery-interior-counter': 'realInteriorCounter',
      'gallery-interior-door': 'realInteriorDoor',
      'gallery-storefront': 'storefront',
      'gallery-signboard': 'signboard',
      'gallery-wide': 'interiorWide',
    };

    return SHOP_GALLERY.map((photo) => {
      const slotKey = slotMap[photo.id];
      const override = slotKey ? mediaOverrides[slotKey] : undefined;
      const src =
        override?.imageUrl === REMOVED_IMAGE_MARKER
          ? REMOVED_IMAGE_MARKER
          : override?.imageUrl
            ? resolvePortableAssetUrl(override.imageUrl, photo.src)
            : !mediaReady
              ? ''
              : photo.src;
      return {
        ...photo,
        src,
        title: override?.title?.trim() || photo.title,
        caption: override?.caption?.trim() || photo.caption,
      };
    });
  }, [mediaOverrides, mediaReady]);

  return {
    products: visibleProducts,
    allProducts,
    usedPhones,
    liveReviews,
    hiddenReviewIds,
    reviewsVisible,
    homeSections,
    socialLinks,
    siteImages: liveSiteImages,
    shopGallery: liveShopGallery,
    mediaOverrides,
  };
}
