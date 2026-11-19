import bentoAudioImg from '../assets/images/bento_audio_collection_1795068494283.jpg';
import bentoCasesTrioImg from '../assets/images/bento_cases_trio_1795068493756.jpg';
import heroMobileLifestyleImg from '../assets/images/hero_mobile_lifestyle_1795068495146.jpg';
import btSpeakerImg from '../assets/images/item_bt_speaker_1795068000118.jpg';
import handsfreeWiredImg from '../assets/images/item_handsfree_wired_1795068000417.jpg';
import keypadPhoneImg from '../assets/images/item_keypad_phone_1795068000112.jpg';
import mobileBatteryImg from '../assets/images/item_mobile_battery_1795068000470.jpg';
import temperedGlassImg from '../assets/images/item_tempered_glass_1795068001458.jpg';
import typecCableImg from '../assets/images/item_typec_cable_1795068000823.jpg';
import airpodsAudioImg from '../assets/images/product_airpods_audio_1795067240054.jpg';
import coversGlassImg from '../assets/images/product_covers_glass_1795067239657.jpg';
import fastChargerImg from '../assets/images/product_fast_charger_1795067239408.jpg';
import powerbankBatteryImg from '../assets/images/product_powerbank_battery_1795067239912.jpg';
import smartphonesWatchImg from '../assets/images/product_smartphones_watch_1795067238787.jpg';
import { SHOP_CONFIG, SHOP_IMAGES } from '../config/shopConfig';

export type SitePage = 'home' | 'products' | 'repairs' | 'virtual-shop' | 'about' | 'admin';

export type ProductCategory =
  | 'All'
  | 'Charging'
  | 'Audio'
  | 'Protection'
  | 'Power & Parts'
  | 'Phones & Wearables';

export interface CatalogProduct {
  id: string;
  sku: string;
  shopItemKey: string;
  name: string;
  category: Exclude<ProductCategory, 'All'>;
  pricePkr: number;
  originalPricePkr?: number;
  discountPercent?: number;
  rating: string;
  reviewsCount?: number;
  soldCount?: string;
  status: string;
  specs: string;
  description: string;
  warrantyNote: string;
  image: string;
  variants: string[];
  featured?: boolean;
  freeDelivery?: boolean;
}

export interface CartItem {
  productId: string;
  variant: string;
  quantity: number;
}

export interface RepairService {
  id: string;
  title: string;
  turnaround: string;
  startingPricePkr: number;
  summary: string;
  warranty: string;
}

export interface DigitalService {
  id: string;
  title: string;
  details: string;
  availability: string;
}

export interface ShopGalleryPhoto {
  id: string;
  src: string;
  title: string;
  caption: string;
}

export interface CustomerReview {
  id: string;
  name: string;
  location: string;
  service: string;
  quote: string;
}

export const SITE_IMAGES = {
  heroLifestyle: heroMobileLifestyleImg,
  bentoCasesTrio: bentoCasesTrioImg,
  bentoAudioCollection: bentoAudioImg,
  bentoAirpods: airpodsAudioImg,
  bentoSmartwatch: smartphonesWatchImg,
  realInteriorCounter: '/assets/aistudio/WhatsApp_Image_2026-11-19_at_9.08.33_AM__1__bf16940b.jpeg',
  realInteriorDoor: '/assets/aistudio/WhatsApp_Image_2026-11-19_at_9.08.33_AM_9d61709f.jpeg',
  storefront: SHOP_IMAGES.storefront,
  interiorWide: SHOP_IMAGES.interiorWide,
  signboard: SHOP_IMAGES.signboard,
  aerialMap: SHOP_IMAGES.aerialMap,
} as const;

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'All',
  'Charging',
  'Audio',
  'Protection',
  'Power & Parts',
  'Phones & Wearables',
];

// 11 authentic catalog items — every single product has its own unique photograph (zero duplicates)
export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'fast-charger-67w',
    sku: 'UM-CHG-67',
    shopItemKey: 'Fast Charger',
    name: '67W GaN Turbo Charger',
    category: 'Charging',
    pricePkr: 1650,
    originalPricePkr: 2200,
    discountPercent: 25,
    rating: '5.0',
    reviewsCount: 563,
    soldCount: '5.8K sold',
    freeDelivery: true,
    status: 'In Stock',
    specs: 'USB-C PD & USB-A · Over-Voltage Protection · 1.2m Cable',
    description:
      'Tested on our live voltage and amperage meter before handover. Supports fast charging for Xiaomi, Samsung, Vivo, Oppo, Tecno, and Infinix handsets.',
    warrantyNote: '7-day replacement check',
    image: fastChargerImg,
    variants: ['33W Fast Adapter Set', '67W Turbo Set'],
    featured: true,
  },
  {
    id: 'ronin-r9-handsfree',
    sku: 'UM-AUD-R9',
    shopItemKey: 'Handsfree',
    name: 'Ronin R-9 Handsfree',
    category: 'Audio',
    pricePkr: 650,
    originalPricePkr: 950,
    discountPercent: 32,
    rating: '4.9',
    reviewsCount: 840,
    soldCount: '8.2K sold',
    freeDelivery: true,
    status: 'In Stock',
    specs: '3.5mm Gold-Plated Jack · Inline Call Mic · Metal Earbuds',
    description:
      'Everyday wired handsfree with clean call voice pickup, strong braided strain relief, and deep bass. Sealed original pack.',
    warrantyNote: 'Sound-tested at counter',
    image: handsfreeWiredImg,
    variants: ['3.5mm Aux Jack', 'Type-C Digital Audio'],
    featured: true,
  },
  {
    id: 'airpods-pro-tws',
    sku: 'UM-AUD-TWS',
    shopItemKey: 'AirPods Pro',
    name: 'AirPods Pro TWS',
    category: 'Audio',
    pricePkr: 2850,
    originalPricePkr: 3800,
    discountPercent: 25,
    rating: '5.0',
    reviewsCount: 412,
    soldCount: '3.1K sold',
    freeDelivery: true,
    status: 'In Stock',
    specs: 'Bluetooth 5.3 · Touch Controls · 24H Backup Case',
    description:
      'Compact wireless earbuds for calls and video playback. Pair directly with your phone at our counter to verify sound before buying.',
    warrantyNote: 'Live sound check included',
    image: airpodsAudioImg,
    variants: ['Standard White', 'ANC Pro Edition'],
    featured: true,
  },
  {
    id: 'type-c-65w-cable',
    sku: 'UM-CBL-6A',
    shopItemKey: 'Type-C Data Cable',
    name: '65W Type-C Data Cable',
    category: 'Charging',
    pricePkr: 450,
    originalPricePkr: 750,
    discountPercent: 40,
    rating: '4.9',
    reviewsCount: 1150,
    soldCount: '12.4K sold',
    freeDelivery: true,
    status: 'In Stock',
    specs: '6A Super Fast Charge · 1.2m Nylon Weave · Metal Connectors',
    description:
      'Thick braided charging and data cable built to hold up against daily bending while maintaining stable fast-charge speeds.',
    warrantyNote: 'Ampere-tested at counter',
    image: typecCableImg,
    variants: ['USB-A to Type-C', 'Type-C to Type-C', 'iPhone Lightning'],
    featured: true,
  },
  {
    id: 'shockproof-magsafe-cover',
    sku: 'UM-COV-MAG',
    shopItemKey: 'Phone Cover',
    name: 'MagSafe Armor Cover',
    category: 'Protection',
    pricePkr: 550,
    originalPricePkr: 900,
    discountPercent: 39,
    rating: '5.0',
    reviewsCount: 680,
    soldCount: '6.7K sold',
    freeDelivery: true,
    status: 'All Models',
    specs: 'Raised Camera Lip · Corner Bumpers · Matte Grip',
    description:
      'Stocked for Infinix, Tecno, Samsung, Vivo, Oppo, Redmi, and iPhone models. Mention your exact handset model when sending your order.',
    warrantyNote: 'Exact fit verified',
    image: coversGlassImg,
    variants: ['Matte Charcoal', 'Midnight Navy', 'Clear Bumper'],
    featured: true,
  },
  {
    id: 'tempered-glass-9d',
    sku: 'UM-GLS-9D',
    shopItemKey: 'Tempered Glass',
    name: '9D Tempered Glass',
    category: 'Protection',
    pricePkr: 300,
    originalPricePkr: 500,
    discountPercent: 40,
    rating: '5.0',
    reviewsCount: 1620,
    soldCount: '18.9K sold',
    freeDelivery: true,
    status: 'Free Fitting',
    specs: '9H Scratch Resistant · Edge-to-Edge Black Frame · Zero Halo',
    description:
      'Available in clear HD, matte gaming, and anti-peep privacy glass. Free dust-free installation at the counter.',
    warrantyNote: 'Free counter installation',
    image: temperedGlassImg,
    variants: ['Clear HD 9D', 'Matte Gaming 9D', 'Privacy Glass'],
    featured: true,
  },
  {
    id: 'powerbank-20000mah',
    sku: 'UM-PWR-20K',
    shopItemKey: 'Power Bank',
    name: '20,000mAh Power Bank',
    category: 'Power & Parts',
    pricePkr: 4400,
    originalPricePkr: 5500,
    discountPercent: 20,
    rating: '4.9',
    reviewsCount: 295,
    soldCount: '2.4K sold',
    freeDelivery: true,
    status: 'In Stock',
    specs: 'Dual USB + Type-C PD · LED Indicator · Aluminum Shell',
    description:
      'Recharges a standard smartphone 3 to 4 times on a single charge—practical for long load-shedding hours and travel.',
    warrantyNote: '15-day backup check',
    image: powerbankBatteryImg,
    variants: ['10,000mAh Compact', '20,000mAh 22.5W'],
    featured: true,
  },
  {
    id: 'play-1-keypad-phone',
    sku: 'UM-PHN-KEY',
    shopItemKey: 'PLAY 1 Mobile',
    name: 'PTA Keypad Phone',
    category: 'Phones & Wearables',
    pricePkr: 3250,
    originalPricePkr: 3850,
    discountPercent: 16,
    rating: '4.8',
    reviewsCount: 180,
    soldCount: '1.5K sold',
    freeDelivery: true,
    status: 'PTA Approved',
    specs: 'Dual SIM · 3000mAh Multi-Day Battery · Torch & Wireless FM',
    description:
      'Loud earpiece volume, clear tactile keypad, and multi-day standby battery. Official PTA-approved box pack.',
    warrantyNote: 'Official box · PTA verified',
    image: keypadPhoneImg,
    variants: ['Matte Black', 'Navy Blue'],
    featured: true,
  },
  {
    id: 'original-battery-5000mah',
    sku: 'UM-BAT-5K',
    shopItemKey: 'Original Battery',
    name: '5000mAh Phone Battery',
    category: 'Power & Parts',
    pricePkr: 1850,
    originalPricePkr: 2400,
    discountPercent: 23,
    rating: '4.9',
    reviewsCount: 340,
    soldCount: '2.9K sold',
    freeDelivery: true,
    status: 'In Stock',
    specs: 'Zero-Cycle Cell · Original Flex Connector · Protection IC',
    description:
      'Fresh replacement internal batteries stocked for major Android and iPhone handsets, fitted cleanly at our repair desk.',
    warrantyNote: 'Includes fitting & voltage test',
    image: mobileBatteryImg,
    variants: ['Standard Cell (4000mAh)', 'High-Capacity 5000mAh'],
  },
  {
    id: 'bluetooth-bass-speaker',
    sku: 'UM-AUD-SPK',
    shopItemKey: 'Bluetooth Speaker',
    name: 'Bass Bluetooth Speaker',
    category: 'Audio',
    pricePkr: 1950,
    originalPricePkr: 2600,
    discountPercent: 25,
    rating: '4.9',
    reviewsCount: 490,
    soldCount: '3.8K sold',
    freeDelivery: true,
    status: 'In Stock',
    specs: 'Bluetooth 5.1 · USB / SD Card / AUX · 8H Playtime',
    description:
      'Loud room-filling sound in a compact woven-fabric body with carry strap and Type-C charging.',
    warrantyNote: 'Test live before buying',
    image: btSpeakerImg,
    variants: ['Matte Black', 'Slate Gray'],
  },
  {
    id: 'ultra-smartwatch-phones',
    sku: 'UM-WCH-ULT',
    shopItemKey: 'Smartwatch',
    name: 'Ultra Calling Watch',
    category: 'Phones & Wearables',
    pricePkr: 3600,
    originalPricePkr: 4800,
    discountPercent: 25,
    rating: '5.0',
    reviewsCount: 520,
    soldCount: '4.2K sold',
    freeDelivery: true,
    status: 'In Stock',
    specs: 'Bluetooth Calls · WhatsApp Alerts · Titanium-Finish Frame',
    description:
      'Bright AMOLED-style display with Bluetooth calling, notifications, and spare silicone strap. Also ask us for latest PTA box-pack smartphones.',
    warrantyNote: 'Includes magnetic charger + spare strap',
    image: smartphonesWatchImg,
    variants: ['Titanium Gray', 'Matte Black'],
  },
];

export const REPAIR_SERVICES: RepairService[] = [
  {
    id: 'lcd-replacement',
    title: 'LCD / Touch Panel Replacement',
    turnaround: '45 – 90 mins',
    startingPricePkr: 2500,
    summary: 'IPS & AMOLED panel swaps with clean frame gluing and full touch test.',
    warranty: 'Checked before sealing',
  },
  {
    id: 'charging-port-ic',
    title: 'Charging Jack & Charging IC Work',
    turnaround: '30 – 60 mins',
    startingPricePkr: 700,
    summary: 'Type-C / Micro-USB jack replacement, slow-charging fix, and IC soldering.',
    warranty: 'Ampere-meter tested',
  },
  {
    id: 'battery-replacement',
    title: 'Swollen / Fast-Draining Battery Swap',
    turnaround: '20 – 30 mins',
    startingPricePkr: 1600,
    summary: 'Safe removal of weak batteries and fitting of fresh zero-cycle cells.',
    warranty: 'Voltage check included',
  },
  {
    id: 'software-flash-unlock',
    title: 'Software Flash, Hang-on-Logo & FRP',
    turnaround: '30 – 60 mins',
    startingPricePkr: 500,
    summary: 'Official firmware flashing, bootloop recovery, and lock resets.',
    warranty: 'Official stock files',
  },
  {
    id: 'audio-camera-sensors',
    title: 'Mic, Earpiece, Ringer & Camera Glass',
    turnaround: '30 – 45 mins',
    startingPricePkr: 600,
    summary: 'Clear call audio repair, loudspeaker swap, and cracked camera lens glass.',
    warranty: 'Live call test',
  },
  {
    id: 'water-damage-lab',
    title: 'Water Damage & Dead Board Diagnostics',
    turnaround: 'Same Day',
    startingPricePkr: 1000,
    summary: 'Board cleaning, rust removal, and short-circuit tracing under magnification.',
    warranty: 'Free initial check',
  },
];

export const DIGITAL_SERVICES: DigitalService[] = [
  {
    id: 'easypaisa-jazzcash',
    title: 'Easypaisa & JazzCash',
    details: 'Cash deposit, cash withdrawal, CNIC transfer, and mobile wallet help.',
    availability: 'Instant receipt',
  },
  {
    id: 'raast-qr',
    title: 'Raast QR Counter Pay',
    details: 'Pay for any repair or accessory via Raast QR, Easypaisa, or JazzCash.',
    availability: 'No extra fee',
  },
  {
    id: 'easyload-packages',
    title: 'Easyload & 4G Packages',
    details: 'Daily, weekly, and monthly Jazz, Zong, Telenor, and Ufone bundles.',
    availability: 'All networks',
  },
  {
    id: 'utility-bills',
    title: 'LESCO & Gas Utility Bills',
    details: 'Electricity, Sui Gas, and internet bills paid daily with confirmation.',
    availability: '9 AM – 10 PM daily',
  },
];

export const PHONE_BRANDS = [
  'Infinix',
  'Tecno',
  'Samsung',
  'Vivo',
  'Oppo',
  'Xiaomi / Redmi',
  'iPhone',
  'Realme / Other',
] as const;

export const SHOP_GALLERY: ShopGalleryPhoto[] = [
  {
    id: 'gallery-interior-counter',
    src: SITE_IMAGES.realInteriorCounter,
    title: 'Accessories Wall & Marble Showcase',
    caption: 'Cables, handsfree, glass showcase counter, and rear repair desk.',
  },
  {
    id: 'gallery-interior-door',
    src: SITE_IMAGES.realInteriorDoor,
    title: 'Front Entrance & Counter PC',
    caption: 'Main Bazar roadside door, display counter, and customer billing desk.',
  },
  {
    id: 'gallery-storefront',
    src: SITE_IMAGES.storefront,
    title: 'Main Bazar Storefront',
    caption: 'Usman Mobile Repairing Centre entrance in Hussain Khan Wala, Chak No. 8.',
  },
  {
    id: 'gallery-signboard',
    src: SITE_IMAGES.signboard,
    title: 'Main Shop Signboard',
    caption: 'Repairing, software, accessories, Easypaisa, JazzCash & bill payments.',
  },
  {
    id: 'gallery-wide',
    src: SITE_IMAGES.interiorWide,
    title: 'Wide Shop View',
    caption: 'Full view of shelves, glass showcase, and daily counter.',
  },
];

export const CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    name: 'Muhammad Bilal',
    location: 'Chak No. 8, Hussain Khan Wala',
    service: 'Infinix Screen Replacement',
    quote:
      'Replaced my broken Infinix display in under an hour with clean fitting. Touch and brightness work just like original.',
  },
  {
    id: 'rev-2',
    name: 'Tariq Mahmood',
    location: 'Chak No. 8, Pattoki',
    service: '67W Charger & Ronin Handsfree',
    quote:
      'Usman checks every charger and handsfree on the spot before handover. Still using the 67W charger daily after 6 months.',
  },
  {
    id: 'rev-3',
    name: 'Salman Rasheed',
    location: 'Main Bazar, Pattoki',
    service: 'Charging IC Repair',
    quote:
      'Two other shops said the board could not be repaired. Fixed my charging IC the same day at a fair local rate.',
  },
];

export function formatPkr(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-PK')}`;
}

export function findCatalogProductByShopKey(shopItemKey: string): CatalogProduct | undefined {
  return CATALOG_PRODUCTS.find((p) => p.shopItemKey === shopItemKey);
}

export function buildCartWhatsAppUrl(
  cartItems: CartItem[],
  customerName: string,
  fulfillment: 'pickup' | 'delivery',
  note: string,
): string {
  const lines: string[] = [
    'Assalam o Alaikum Usman Mobile Repairing Centre,',
    'I would like to order:',
    '',
  ];

  let subtotal = 0;
  cartItems.forEach((item, idx) => {
    const product = CATALOG_PRODUCTS.find((p) => p.id === item.productId);
    if (!product) return;
    const lineTotal = product.pricePkr * item.quantity;
    subtotal += lineTotal;
    lines.push(
      `${idx + 1}. ${product.name} (${item.variant}) × ${item.quantity} — ${formatPkr(lineTotal)}`,
    );
  });

  lines.push('');
  lines.push(`Total: ${formatPkr(subtotal)}`);
  lines.push(
    `Option: ${fulfillment === 'pickup' ? 'Shop Pickup (Hussain Khan Wala)' : 'Local Delivery (Chak 8 / Pattoki)'}`,
  );
  if (customerName.trim()) {
    lines.push(`Name: ${customerName.trim()}`);
  }
  if (note.trim()) {
    lines.push(`Phone Model / Note: ${note.trim()}`);
  }

  return `https://wa.me/${SHOP_CONFIG.WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildRepairQuoteWhatsAppUrl(params: {
  brand: string;
  model: string;
  serviceTitle: string;
  issueNotes: string;
  customerName: string;
}): string {
  const lines = [
    'Assalam o Alaikum Usman Mobile Repairing Centre,',
    'Please share repair price for:',
    '',
    `Brand: ${params.brand}`,
    `Model: ${params.model.trim() || 'Not specified'}`,
    `Issue: ${params.serviceTitle}`,
  ];
  if (params.customerName.trim()) {
    lines.push(`Name: ${params.customerName.trim()}`);
  }
  if (params.issueNotes.trim()) {
    lines.push(`Notes: ${params.issueNotes.trim()}`);
  }
  return `https://wa.me/${SHOP_CONFIG.WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
}
