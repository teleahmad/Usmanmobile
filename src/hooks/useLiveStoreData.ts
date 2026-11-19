import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import {
  DEFAULT_SOCIAL_LINKS,
  SocialLinksConfig,
} from '../components/SocialLinksBar';
import {
  CATALOG_PRODUCTS,
  CatalogProduct,
  SHOP_GALLERY,
  ShopGalleryPhoto,
  SITE_IMAGES,
} from '../data/catalogData';
import type { UsedPhoneItem } from '../data/usedPhonesData';
import { db } from '../firebase';

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
  | 'heroLifestyle';

export interface SiteMediaOverride {
  slotKey: SiteMediaSlotKey;
  title?: string;
  caption?: string;
  imageUrl: string;
  updatedAt?: string;
}

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
];

export function useLiveStoreData() {
  const [productDocs, setProductDocs] = useState<Record<string, FirestoreProductDoc>>({});
  const [mediaOverrides, setMediaOverrides] = useState<Record<string, SiteMediaOverride>>({});
  const [liveReviews, setLiveReviews] = useState<LiveCustomerReview[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinksConfig>(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const next: Record<string, FirestoreProductDoc> = {};
        snap.docs.forEach((docSnap) => {
          next[docSnap.id] = docSnap.data() as FirestoreProductDoc;
        });
        setProductDocs(next);
      },
      (err) => {
        console.warn('Products live sync notice:', err.message);
      },
    );

    const unsubMedia = onSnapshot(
      collection(db, 'siteMedia'),
      (snap) => {
        const next: Record<string, SiteMediaOverride> = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data() as Partial<SiteMediaOverride>;
          if (data.slotKey && data.imageUrl) {
            next[docSnap.id] = {
              slotKey: data.slotKey as SiteMediaSlotKey,
              title: data.title,
              caption: data.caption,
              imageUrl: data.imageUrl,
              updatedAt: data.updatedAt,
            };
          }
        });
        setMediaOverrides(next);
      },
      (err) => {
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

    return () => {
      unsubProducts();
      unsubMedia();
      unsubReviews();
      unsubSocial();
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
          return [{ ...base, inStock: true, hidden: false, isCustom: false, isOverridden: false }];
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
              typeof override.reviewsCount === 'number'
                ? override.reviewsCount
                : base.reviewsCount,
            soldCount: override.soldCount || base.soldCount,
            status: override.status || (inStock ? base.status : 'Out of Stock'),
            inStock,
            hidden: Boolean(override.hidden),
            featured: override.featured !== undefined ? override.featured : base.featured,
            specs: override.specs || base.specs,
            description: override.description || base.description,
            warrantyNote: override.warrantyNote || base.warrantyNote,
            image: override.image || base.image,
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

        return {
          id,
          sku: data.sku || `UM-${id.slice(0, 6).toUpperCase()}`,
          shopItemKey: data.shopItemKey || data.name || 'Accessory',
          name: data.name || 'New Product',
          category: data.category || 'Charging',
          pricePkr,
          originalPricePkr,
          discountPercent,
          rating: data.rating || '4.9',
          reviewsCount: typeof data.reviewsCount === 'number' ? data.reviewsCount : 120,
          soldCount: data.soldCount || '500+ sold',
          status: data.status || (inStock ? 'In Stock' : 'Out of Stock'),
          inStock,
          hidden: Boolean(data.hidden),
          featured: data.featured !== undefined ? data.featured : true,
          specs: data.specs || 'Tested at Usman Mobile Counter · Quality Guaranteed',
          description:
            data.description ||
            'Available for pickup at Usman Mobile Repairing Centre or local delivery in Chak No. 8 & Pattoki.',
          warrantyNote: data.warrantyNote || 'Live check at counter',
          image: data.image || SITE_IMAGES.realInteriorCounter,
          variants:
            Array.isArray(data.variants) && data.variants.length > 0
              ? data.variants
              : ['Standard'],
          isCustom: true,
          isOverridden: true,
        };
      });

    return [...customProducts, ...mergedDefaults];
  }, [productDocs]);

  const visibleProducts = useMemo(
    () => allProducts.filter((p) => !p.hidden),
    [allProducts],
  );

  const usedPhones = useMemo<UsedPhoneItem[]>(() => [], []);

  const liveSiteImages = useMemo(
    () => ({
      ...SITE_IMAGES,
      realInteriorCounter:
        mediaOverrides.realInteriorCounter?.imageUrl || SITE_IMAGES.realInteriorCounter,
      realInteriorDoor:
        mediaOverrides.realInteriorDoor?.imageUrl || SITE_IMAGES.realInteriorDoor,
      storefront: mediaOverrides.storefront?.imageUrl || SITE_IMAGES.storefront,
      signboard: mediaOverrides.signboard?.imageUrl || SITE_IMAGES.signboard,
      interiorWide: mediaOverrides.interiorWide?.imageUrl || SITE_IMAGES.interiorWide,
      heroLifestyle: mediaOverrides.heroLifestyle?.imageUrl || SITE_IMAGES.heroLifestyle,
    }),
    [mediaOverrides],
  );

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
      if (!override) return photo;
      return {
        ...photo,
        src: override.imageUrl || photo.src,
        title: override.title?.trim() || photo.title,
        caption: override.caption?.trim() || photo.caption,
      };
    });
  }, [mediaOverrides]);

  return {
    products: visibleProducts,
    allProducts,
    usedPhones,
    liveReviews,
    socialLinks,
    siteImages: liveSiteImages,
    shopGallery: liveShopGallery,
    mediaOverrides,
  };
}
