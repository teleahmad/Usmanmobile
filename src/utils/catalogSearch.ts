import {
  CatalogProduct,
  DIGITAL_SERVICES,
  DigitalService,
  REPAIR_SERVICES,
  RepairService,
} from '../data/catalogData';

const PHONE_BRAND_WORDS = new Set([
  'infinix',
  'tecno',
  'samsung',
  'vivo',
  'oppo',
  'xiaomi',
  'redmi',
  'iphone',
  'apple',
  'realme',
  'itel',
  'nokia',
  'oneplus',
  'huawei',
  'pixel',
  'spark',
  'hot',
  'note',
  'camon',
  'galaxy',
]);

const ACCESSORY_COMPATIBLE_CATEGORIES = new Set([
  'protection',
  'charging',
  'power & parts',
]);

const TOKEN_SYNONYMS: Record<string, string[]> = {
  cover: ['cover', 'case', 'magsafe', 'armor', 'bumper', 'pouch'],
  case: ['case', 'cover', 'magsafe', 'armor', 'bumper'],
  glass: ['glass', 'tempered', '9d', 'protector', 'screen'],
  protector: ['protector', 'glass', 'tempered', '9d'],
  '9d': ['9d', 'glass', 'tempered'],
  '65w': ['65w', '67w', 'fast', 'turbo', 'gan'],
  '67w': ['67w', '65w', 'fast', 'turbo', 'gan'],
  charger: ['charger', 'adapter', 'cable', 'gan', 'charging'],
  cable: ['cable', 'type-c', 'usb', 'lightning', 'data'],
  airpods: ['airpods', 'tws', 'earbuds', 'bluetooth', 'pods'],
  earbuds: ['earbuds', 'airpods', 'tws', 'handsfree'],
  handsfree: ['handsfree', 'earphone', 'earphones', 'aux', 'ronin'],
  battery: ['battery', 'cell', '5000mah', 'power', 'drain'],
  powerbank: ['power bank', 'powerbank', '20,000mah', '20000mah'],
  watch: ['watch', 'smartwatch', 'calling'],
  speaker: ['speaker', 'bluetooth', 'bass'],
  keypad: ['keypad', 'pta', 'button', 'dual sim'],
  lcd: ['lcd', 'screen', 'panel', 'touch', 'display', 'amoled', 'ips'],
  screen: ['screen', 'lcd', 'panel', 'touch', 'display', 'glass'],
  repair: ['repair', 'replacement', 'fix', 'ic', 'flash', 'swap', 'diagnostics'],
  software: ['software', 'flash', 'frp', 'unlock', 'logo', 'bootloop'],
  jack: ['jack', 'charging', 'port', 'ic'],
  mic: ['mic', 'speaker', 'earpiece', 'ringer', 'audio', 'camera'],
  water: ['water', 'dead', 'board', 'damage'],
};

function expandToken(token: string): string[] {
  return TOKEN_SYNONYMS[token] ?? [token];
}

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s\-+]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t !== 'for' && t !== 'and' && t !== 'or' && t !== 'mobile' && t !== 'phone');
}

export function matchesProductQuery(product: CatalogProduct, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    product.name,
    product.category,
    product.specs,
    product.description,
    product.sku,
    product.shopItemKey,
    product.variants.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  if (haystack.includes(q)) return true;

  const tokens = tokenizeQuery(q);
  if (tokens.length === 0) return haystack.includes(q);

  const nonBrandTokens = tokens.filter((t) => !PHONE_BRAND_WORDS.has(t));
  const hasBrandToken = tokens.some((t) => PHONE_BRAND_WORDS.has(t));

  // If user typed ONLY a phone brand (e.g. "Infinix" or "Samsung"), show compatible accessories
  if (hasBrandToken && nonBrandTokens.length === 0) {
    return (
      haystack.includes(tokens[0]) ||
      ACCESSORY_COMPATIBLE_CATEGORIES.has(product.category.toLowerCase())
    );
  }

  // Otherwise every non-brand token must match directly or via its synonym group
  const matchesCoreTokens = nonBrandTokens.every((token) => {
    const candidates = expandToken(token);
    return candidates.some((word) => haystack.includes(word));
  });

  if (!matchesCoreTokens) return false;

  // If a phone brand was also included (e.g. "Infinix Cover"), ensure product is brand-compatible or mentions it
  if (hasBrandToken) {
    return (
      tokens.some((t) => PHONE_BRAND_WORDS.has(t) && haystack.includes(t)) ||
      ACCESSORY_COMPATIBLE_CATEGORIES.has(product.category.toLowerCase()) ||
      product.category.toLowerCase() === 'audio'
    );
  }

  return true;
}

export function matchesRepairQuery(service: RepairService, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;

  const haystack = `${service.title} ${service.summary} ${service.warranty} repair`.toLowerCase();
  if (haystack.includes(q)) return true;

  const tokens = tokenizeQuery(q);
  if (tokens.length === 0) return false;

  const nonBrandTokens = tokens.filter((t) => !PHONE_BRAND_WORDS.has(t));
  const hasBrandToken = tokens.some((t) => PHONE_BRAND_WORDS.has(t));

  // Pure brand search (e.g. "Infinix", "Samsung") includes top LCD/Charging/Battery repairs
  if (hasBrandToken && nonBrandTokens.length === 0) {
    return true;
  }

  // Avoid matching repair services when user searches purely for accessories like "AirPods" or "Cover"
  const isRepairRelated = nonBrandTokens.some((t) =>
    ['lcd', 'screen', 'panel', 'touch', 'repair', 'fix', 'jack', 'port', 'ic', 'battery', 'software', 'flash', 'frp', 'unlock', 'mic', 'camera', 'water', 'dead', 'board'].includes(t),
  );
  if (!isRepairRelated) return false;

  return nonBrandTokens.every((token) => {
    if (token === 'repair') return true;
    const candidates = expandToken(token);
    return candidates.some((word) => haystack.includes(word));
  });
}

export function matchesDigitalServiceQuery(service: DigitalService, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;

  const haystack = `${service.title} ${service.details} ${service.availability}`.toLowerCase();
  if (haystack.includes(q)) return true;

  const tokens = tokenizeQuery(q);
  if (tokens.length === 0) return false;

  return tokens.every((t) => haystack.includes(t));
}

export interface GlobalSearchResults {
  products: CatalogProduct[];
  repairs: RepairService[];
  digitalServices: DigitalService[];
  totalCount: number;
}

export function runGlobalCatalogSearch(
  products: CatalogProduct[],
  rawQuery: string,
): GlobalSearchResults {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return { products: [], repairs: [], digitalServices: [], totalCount: 0 };
  }

  const matchedProducts = products.filter((p) => matchesProductQuery(p, trimmed));
  const matchedRepairs = REPAIR_SERVICES.filter((r) => matchesRepairQuery(r, trimmed));
  const matchedDigital = DIGITAL_SERVICES.filter((d) => matchesDigitalServiceQuery(d, trimmed));

  return {
    products: matchedProducts,
    repairs: matchedRepairs,
    digitalServices: matchedDigital,
    totalCount: matchedProducts.length + matchedRepairs.length + matchedDigital.length,
  };
}
