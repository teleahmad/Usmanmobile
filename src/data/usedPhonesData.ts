import usedIphone13ProImg from '../assets/images/used_iphone_13_pro_1795098411004.jpg';
import usedRedmiNote13Img from '../assets/images/used_redmi_note_13_1795098410452.jpg';
import usedSamsungA54Img from '../assets/images/used_samsung_galaxy_a54_1795098410361.jpg';
import { getWhatsAppUrl } from '../config/shopConfig';
import { formatPkr } from './catalogData';

export type PtaStatus = 'PTA Approved' | 'Non-PTA' | 'JV / Patch' | 'Official Warranty';

export interface UsedPhoneItem {
  id: string;
  title: string;
  brand: string;
  pricePkr: number;
  marketPricePkr?: number;
  storage: string;
  condition: string;
  ptaStatus: PtaStatus;
  batteryHealth?: string;
  accessories?: string;
  warrantyNote?: string;
  notes?: string;
  photos: string[];
  available: boolean;
  isCustom?: boolean;
  isOverridden?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const PTA_STATUS_OPTIONS: PtaStatus[] = [
  'PTA Approved',
  'Non-PTA',
  'JV / Patch',
  'Official Warranty',
];

export const USED_PHONE_BRANDS = [
  'Apple',
  'Samsung',
  'Redmi / Xiaomi',
  'Infinix',
  'Tecno',
  'Vivo',
  'Oppo',
  'Realme',
  'Google Pixel',
  'OnePlus',
  'Other',
];

export const CONDITION_OPTIONS = [
  '10/10 Like New',
  '9.5/10 Mint',
  '9/10 Clean',
  '8.5/10 Good',
  '8/10 Fair',
];

export const DEFAULT_USED_PHONES: UsedPhoneItem[] = [
  {
    id: 'used-iphone-13-pro-256',
    title: 'iPhone 13 Pro — Graphite',
    brand: 'Apple',
    pricePkr: 148000,
    marketPricePkr: 162000,
    storage: '256GB',
    condition: '9.5/10 Mint',
    ptaStatus: 'Non-PTA',
    batteryHealth: '88% Original',
    accessories: 'Phone + Original Fast Cable',
    warrantyNote: '3-day full check warranty at Usman Mobile',
    notes: 'Waterpack original set, Face ID & True Tone working 100%, zero scratches on screen. Live counter check before payment.',
    photos: [usedIphone13ProImg],
    available: true,
  },
  {
    id: 'used-samsung-s22-ultra-256',
    title: 'Samsung Galaxy S22 Ultra',
    brand: 'Samsung',
    pricePkr: 132000,
    marketPricePkr: 145000,
    storage: '12GB / 256GB',
    condition: '9.5/10 Mint',
    ptaStatus: 'PTA Approved',
    batteryHealth: '5000 mAh Excellent',
    accessories: 'Phone + 45W Fast Charger',
    warrantyNote: '3-day check warranty at counter',
    notes: 'Official PTA Approved dual SIM, original S-Pen working, crisp AMOLED display with zero dot or shade.',
    photos: [usedSamsungA54Img],
    available: true,
  },
  {
    id: 'used-redmi-note-13-256',
    title: 'Redmi Note 13 — Ocean Teal',
    brand: 'Redmi / Xiaomi',
    pricePkr: 41500,
    marketPricePkr: 49000,
    storage: '8GB / 256GB',
    condition: '10/10 Like New',
    ptaStatus: 'PTA Approved',
    batteryHealth: '5000 mAh Like New',
    accessories: 'Complete Box + 33W Charger',
    warrantyNote: '3-day shop check warranty',
    notes: 'Lightly used with complete box and original 33W charger. Official PTA approved, smooth 120Hz AMOLED screen.',
    photos: [usedRedmiNote13Img],
    available: true,
  },
];

export function buildUsedPhoneWhatsAppUrl(phone: UsedPhoneItem): string {
  const lines = [
    'Assalam o Alaikum Usman Mobile!',
    `I am interested in this used phone: ${phone.title}`,
    `Specs: ${phone.storage} | ${phone.ptaStatus} | Condition: ${phone.condition}`,
    `Listed Price: ${formatPkr(phone.pricePkr)}`,
    'Is it still available at Hussain Khan Wala shop?',
  ];
  return getWhatsAppUrl(lines.join('\n'));
}
