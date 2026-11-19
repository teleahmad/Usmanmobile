import aerialMapImg from '../assets/shop/aerial-map-full.jpg';
import signImg from '../assets/shop/sign.jpg';
import storeImg from '../assets/shop/store.jpg';
import wideImg from '../assets/shop/wide.jpg';

export type ViewMode = 'map' | 'shop' | 'pano';
export type PanoTab = 'interior' | 'storefront';

export interface RoadLineSpec {
  id: string;
  isMain: boolean;
  color: number;
  width: number;
  points: [number, number][];
}

export interface RoadLabelSpec {
  id: string;
  label: string;
  color: string;
  isChowk?: boolean;
  labelBelow?: boolean;
  lineIndex?: number;
  t?: number;
  mapCoord?: [number, number];
}

export interface InteriorHotspot {
  id: string;
  title: string;
  description: string;
  shopPos: [number, number, number];
  panoUv: [number, number];
  alignRight?: boolean;
}

export const SHOP_IMAGES = {
  aerialMap: aerialMapImg,
  storefront: storeImg,
  interiorWide: wideImg,
  signboard: signImg,
} as const;

export const SHOP_CONFIG = {
  NAME: 'Usman Mobile Repairing Centre',
  URDU_NAME: 'عثمان موبائل اینڈ ریپئرنگ سینٹر',
  TAG: 'FAST • TRUSTED • EXPERT',
  ADDRESS: 'Hussain Khan Wala, Chak No. 8, Pattoki, Punjab, Pakistan',
  EMAIL: 'hkwpro@gmail.com',
  OWNER: 'Usman Sarwar',
  PHONES: ['0300-1088723', '0320-6882843'] as const,
  MAPS_URL: 'https://maps.app.goo.gl/pNfJjiGDRQUJELsq7',
  HOURS: 'Open 7 days: 9:00 AM – 10:00 PM',
  CATEGORIES: [
    'Mobile repair and software',
    'Accessories',
    'Handsfree and AirPods',
    'Chargers and cables',
    'Easyload, Easypaisa, JazzCash',
    'Electricity bill payment',
    'Electrical items',
  ] as const,
  WHATSAPP: '923001088723',
  BUY_PRODUCTS_URL:
    'https://wa.me/923001088723?text=Assalam%20o%20Alaikum%2C%20I%20want%20to%20buy%20mobile%20accessories%20from%20Usman%20Mobile%20Repairing%20Centre',
  MAP_W: 148,
  MAP_H: 111,
  MAP_REF_W: 890,
  MAP_REF_H: 666,
  DEFAULT_SHOP_UV: [0.402, 0.486] as [number, number],
  SHOP_SIZE: [6, 5, 3.2] as [number, number, number],
} as const;

export const ITEM_TYPES = [
  'Fast Charger',
  'Type-C Data Cable',
  'Handsfree',
  'AirPods Pro',
  'Phone Cover',
  'Tempered Glass',
  'Original Battery',
  'Power Bank',
  'Bluetooth Speaker',
  'Smartwatch',
  'PLAY 1 Mobile',
  'Smartphone',
  'LCD Display',
  'Repair Bench',
  'Easypaisa & JazzCash',
] as const;

export interface ShopProductDetail {
  id: string;
  name: string;
  category: string;
  specs: string;
  highlight: string;
  badge: string;
  accent: string;
}

export const SHOP_PRODUCTS: Record<string, ShopProductDetail> = {
  Handsfree: {
    id: 'Handsfree',
    name: 'Ronin R-9 Super Bass Handsfree',
    category: 'Audio & Handsfree',
    specs: '3.5mm Stereo Jack · HD Calling Mic · Deep Bass',
    highlight: 'Sound-tested before handover · Original pack',
    badge: 'In Stock',
    accent: '#16A34A',
  },
  'Type-C Data Cable': {
    id: 'Type-C Data Cable',
    name: '65W Turbo Type-C Data Cable',
    category: 'Fast Charging',
    specs: '6A Fast Charge · 1.2m Durable Braided Wire',
    highlight: 'Supports Samsung, Vivo, Oppo, Tecno & Xiaomi',
    badge: 'Best Seller',
    accent: '#0EA5E9',
  },
  'Fast Charger': {
    id: 'Fast Charger',
    name: '33W / 67W Super Fast Charger',
    category: 'Fast Charging',
    specs: 'Smart Over-Voltage IC · USB-A & PD Type-C',
    highlight: 'Original quality adapter + cable with check warranty',
    badge: 'Warranty',
    accent: '#F59E0B',
  },
  'AirPods Pro': {
    id: 'AirPods Pro',
    name: 'AirPods Pro & TWS Earbuds',
    category: 'Wireless Audio',
    specs: 'Bluetooth 5.3 · Touch Controls · 24H Charging Case',
    highlight: 'Crystal clear calls & rich bass — test live in shop',
    badge: 'Popular',
    accent: '#3B82F6',
  },
  'PLAY 1 Mobile': {
    id: 'PLAY 1 Mobile',
    name: 'PLAY 1 Keypad Feature Phone',
    category: 'Mobile Phones',
    specs: 'PTA Approved · Dual SIM · 3000mAh Long Battery',
    highlight: 'Loud speaker, bright torch & wireless FM radio',
    badge: 'PTA Approved',
    accent: '#EAB308',
  },
  Smartphone: {
    id: 'Smartphone',
    name: 'Box-Pack Android Smartphones',
    category: 'Mobile Phones',
    specs: '128GB / 256GB · Official Warranty · PTA Approved',
    highlight: 'Tecno, Infinix, Samsung, Redmi & Vivo models',
    badge: 'Official Stock',
    accent: '#14B8A6',
  },
  'Phone Cover': {
    id: 'Phone Cover',
    name: 'Shockproof & MagSafe Covers',
    category: 'Protection',
    specs: 'Soft Silicone · Camera Lens Guard · Anti-Slip Grip',
    highlight: 'Fitted cases available for all new & classic phones',
    badge: 'All Models',
    accent: '#EC4899',
  },
  'Tempered Glass': {
    id: 'Tempered Glass',
    name: '9D Full-Glue Tempered Glass',
    category: 'Screen Protection',
    specs: '9H Anti-Scratch · Matte Gaming & Clear HD Options',
    highlight: 'Free bubble-free installation at the counter',
    badge: 'Free Install',
    accent: '#8B5CF6',
  },
  'Original Battery': {
    id: 'Original Battery',
    name: 'Zero-Cycle Original Batteries',
    category: 'Spare Parts',
    specs: '5000mAh High Backup · Genuine IC Protection',
    highlight: 'Safe on-site fitting & voltage test included',
    badge: 'Original',
    accent: '#10B981',
  },
  'LCD Display': {
    id: 'LCD Display',
    name: 'Original LCD & Touch Panels',
    category: 'Screen Repair',
    specs: 'AMOLED & IPS Displays · Vivid Brightness & Smooth Touch',
    highlight: 'Same-day professional screen replacement',
    badge: 'Same-Day Fix',
    accent: '#0284C7',
  },
  'Power Bank': {
    id: 'Power Bank',
    name: '20,000mAh 22.5W Power Bank',
    category: 'Power & Backup',
    specs: 'LED Battery % Display · Dual USB + Type-C PD',
    highlight: 'Charges up to 4 phones — ideal for load-shedding',
    badge: 'High Backup',
    accent: '#F97316',
  },
  'Bluetooth Speaker': {
    id: 'Bluetooth Speaker',
    name: 'Bass Boost Bluetooth Speaker',
    category: 'Audio & Sound',
    specs: 'USB / SD Card / AUX · RGB Glow · 8H Playtime',
    highlight: 'Loud punchy sound — test before buying',
    badge: 'In Stock',
    accent: '#EF4444',
  },
  Smartwatch: {
    id: 'Smartwatch',
    name: 'Ultra Series Calling Smartwatch',
    category: 'Wearables',
    specs: 'AMOLED Display · Bluetooth Calls · Extra Straps',
    highlight: 'Works with Android & iPhone · Health & WhatsApp alerts',
    badge: 'Trending',
    accent: '#6366F1',
  },
  'Repair Bench': {
    id: 'Repair Bench',
    name: 'Hardware & Software Repair Lab',
    category: 'Expert Repair',
    specs: 'IC Micro-Soldering · Charging Port · Flashing & Unlock',
    highlight: 'Free fault diagnosis by Usman Sarwar · Fast turnaround',
    badge: 'Expert Lab',
    accent: '#06B6D4',
  },
  'Easypaisa & JazzCash': {
    id: 'Easypaisa & JazzCash',
    name: 'Easypaisa, JazzCash & Bill Pay',
    category: 'Digital Services',
    specs: 'Cash Deposit/Withdraw · Easyload · Electricity Bills',
    highlight: 'Raast QR Pay & all Jazz, Zong, Telenor, Ufone packages',
    badge: 'Instant Service',
    accent: '#22C55E',
  },
};

export function getShopProduct(key: string): ShopProductDetail {
  return (
    SHOP_PRODUCTS[key] ?? {
      id: key,
      name: key,
      category: 'Shop Product',
      specs: 'Original quality available at Usman Mobile',
      highlight: 'Ask on WhatsApp for latest price & stock',
      badge: 'In Stock',
      accent: '#1769FF',
    }
  );
}

// Road centre-lines traced against the full extended 890 x 666 Hussain Khan Wala satellite aerial image.
// Red = Main Bazar Hussain Khan Wala; Yellow = Connecting village streets.
export const ROAD_LINES: RoadLineSpec[] = [
  {
    id: 'main-bazar',
    isMain: true,
    color: 0xef4444,
    width: 1.85,
    points: [
      [335, 0],
      [333, 85],
      [331, 175],
      [329, 255],
      [327, 325],
      [326, 396],
      [326, 408],
      [329, 412],
      [340, 413],
      [405, 416],
      [453, 418],
      [505, 421],
      [542, 422],
      [550, 423],
      [552, 430],
      [552, 444],
      [552, 495],
      [551, 540],
      [550, 595],
      [549, 642],
      [550, 650],
      [558, 652],
      [580, 653],
      [645, 655],
      [720, 657],
      [805, 659],
      [890, 661],
    ],
  },
  {
    id: 'south-bazar-continuation',
    isMain: false,
    color: 0xfacc15,
    width: 1.24,
    points: [
      [325, 418],
      [323, 475],
      [321, 535],
      [318, 595],
      [315, 644],
      [314, 666],
    ],
  },
  {
    id: 'east-street-1',
    isMain: false,
    color: 0xfacc15,
    width: 1.26,
    points: [
      [455, 0],
      [454, 95],
      [453, 195],
      [452, 294],
      [452, 360],
      [453, 418],
      [454, 480],
      [455, 535],
      [456, 595],
      [456, 649],
      [456, 666],
    ],
  },
  {
    id: 'taiba-north-street',
    isMain: false,
    color: 0xfacc15,
    width: 1.2,
    points: [
      [565, 300],
      [559, 360],
      [552, 416],
    ],
  },
  {
    id: 'east-street-2',
    isMain: false,
    color: 0xfacc15,
    width: 1.26,
    points: [
      [682, 165],
      [678, 240],
      [675, 305],
      [672, 370],
      [670, 428],
      [668, 490],
      [667, 545],
      [665, 600],
      [664, 655],
      [664, 666],
    ],
  },
  {
    id: 'cross-street-north',
    isMain: false,
    color: 0xfacc15,
    width: 1.22,
    points: [
      [331, 286],
      [395, 290],
      [452, 294],
      [512, 297],
      [565, 300],
      [625, 303],
      [675, 305],
    ],
  },
  {
    id: 'cross-street-mid-west',
    isMain: false,
    color: 0xfacc15,
    width: 1.18,
    points: [
      [218, 405],
      [272, 407],
      [320, 410],
    ],
  },
  {
    id: 'cross-street-mid-east',
    isMain: false,
    color: 0xfacc15,
    width: 1.22,
    points: [
      [557, 424],
      [615, 426],
      [670, 428],
      [740, 431],
      [815, 434],
      [890, 437],
    ],
  },
  {
    id: 'cross-street-south',
    isMain: false,
    color: 0xfacc15,
    width: 1.24,
    points: [
      [182, 520],
      [250, 524],
      [321, 528],
      [390, 532],
      [455, 535],
      [505, 538],
      [551, 540],
      [612, 543],
      [667, 545],
      [740, 548],
      [815, 550],
      [890, 553],
    ],
  },
  {
    id: 'cross-street-bottom',
    isMain: false,
    color: 0xfacc15,
    width: 1.22,
    points: [
      [315, 643],
      [385, 646],
      [456, 649],
      [505, 650],
      [544, 651],
    ],
  },
  {
    id: 'west-edge-step-street',
    isMain: false,
    color: 0xfacc15,
    width: 1.18,
    points: [
      [318, 503],
      [268, 502],
      [264, 511],
      [205, 510],
      [186, 512],
      [180, 545],
      [172, 585],
      [168, 638],
    ],
  },
];

export const ROAD_LABELS: RoadLabelSpec[] = [
  {
    id: 'lbl-main-bazar',
    label: 'Main Bazar · Hussain Khan Wala',
    color: '#EF4444',
    lineIndex: 0,
    t: 0.11,
  },
  {
    id: 'lbl-streets',
    label: 'Streets',
    color: '#FACC15',
    lineIndex: 5,
    t: 0.75,
  },
  {
    id: 'chowk-member',
    label: 'Member Chowk',
    color: '#EF4444',
    isChowk: true,
    labelBelow: true,
    mapCoord: [326, 412],
  },
  {
    id: 'chowk-taiba',
    label: 'Taiba Chowk',
    color: '#EF4444',
    isChowk: true,
    mapCoord: [551, 423],
  },
  {
    id: 'chowk-masjid',
    label: 'Masjid Chowk',
    color: '#EF4444',
    isChowk: true,
    mapCoord: [550, 650],
  },
];

const [, SD] = SHOP_CONFIG.SHOP_SIZE;

export const INTERIOR_HOTSPOTS: InteriorHotspot[] = [
  {
    id: 'hs-accessories',
    title: 'Accessories Wall',
    description: 'Chargers, cables, handsfree and AirPods',
    shopPos: [-1.25, 1.55, -SD / 2 + 0.45],
    panoUv: [0.78, 0.4],
    alignRight: true,
  },
  {
    id: 'hs-covers',
    title: 'Covers & Protectors',
    description: 'Mobile covers, glass protectors and batteries',
    shopPos: [-SHOP_CONFIG.SHOP_SIZE[0] / 2 + 0.55, 1.55, 0.25],
    panoUv: [0.37, 0.34],
  },
  {
    id: 'hs-counter',
    title: 'Display Counter',
    description: 'AirPods, new phones, Easypaisa & JazzCash',
    shopPos: [0.7, 1.28, 1.05],
    panoUv: [0.25, 0.78],
  },
  {
    id: 'hs-repair',
    title: 'Repair Bench',
    description: 'Screen, charging, software and IC work',
    shopPos: [1.75, 1.45, -SD / 2 + 0.75],
    panoUv: [0.62, 0.62],
    alignRight: true,
  },
];

const SHOP_UV_STORAGE_KEY = 'usman_mobile_shop_uv_v3';

export function loadSavedShopUv(): [number, number] {
  try {
    const raw = localStorage.getItem(SHOP_UV_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        Array.isArray(parsed) &&
        parsed.length === 2 &&
        typeof parsed[0] === 'number' &&
        typeof parsed[1] === 'number'
      ) {
        return [
          Math.max(0.05, Math.min(0.95, parsed[0])),
          Math.max(0.05, Math.min(0.95, parsed[1])),
        ];
      }
    }
  } catch {
    // Ignore storage read errors in restricted environments
  }
  return [...SHOP_CONFIG.DEFAULT_SHOP_UV];
}

export function saveShopUv(uv: [number, number]): void {
  try {
    localStorage.setItem(SHOP_UV_STORAGE_KEY, JSON.stringify(uv));
  } catch {
    // Ignore storage write errors
  }
}

export function uvToWorld(uv: [number, number]): [number, number] {
  return [
    (uv[0] - 0.5) * SHOP_CONFIG.MAP_W,
    (uv[1] - 0.5) * SHOP_CONFIG.MAP_H,
  ];
}

export function worldToUv(x: number, z: number): [number, number] {
  return [
    Number(Math.max(0.05, Math.min(0.95, x / SHOP_CONFIG.MAP_W + 0.5)).toFixed(4)),
    Number(Math.max(0.05, Math.min(0.95, z / SHOP_CONFIG.MAP_H + 0.5)).toFixed(4)),
  ];
}

export function getWhatsAppUrl(topic?: string): string {
  const base = `https://wa.me/${SHOP_CONFIG.WHATSAPP}`;
  if (!topic) return base;
  return `${base}?text=${encodeURIComponent(
    `Assalam o Alaikum, I want to ask about: ${topic}`,
  )}`;
}
