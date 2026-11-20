import {
  CatalogProduct,
  DIGITAL_SERVICES,
  DigitalService,
  REPAIR_SERVICES,
  RepairService,
} from '../data/catalogData';

const SYNONYM_MAP: Record<string, string[]> = {
  cover: ['cover', 'case', 'magsafe', 'armor', 'bumper', 'pouch', 'protection'],
  case: ['case', 'cover', 'magsafe', 'armor', 'bumper', 'pouch', 'protection'],
  glass: ['glass', 'tempered', '9d', 'protector', 'screen', 'protection'],
  charger: ['charger', 'adapter', 'charging', 'gan', 'power', '65w', '67w', '33w'],
  cable: ['cable', 'type-c', 'usb', 'lightning', 'cord', 'data'],
  airpods: ['airpods', 'tws', 'earbuds', 'bluetooth', 'pods', 'audio'],
  handsfree: ['handsfree', 'earphone', 'earphones', 'aux', 'ronin', 'audio'],
  battery: ['battery', 'cell', '5000mah', 'power', 'backup', 'drain'],
  powerbank: ['power bank', 'powerbank', '20,000mah', '10,000mah', 'battery'],
  watch: ['watch', 'smartwatch', 'calling', 'wearable'],
  speaker: ['speaker', 'bluetooth', 'bass', 'audio'],
  keypad: ['keypad', 'pta', 'button', 'dual sim', 'phone'],
  lcd: ['lcd', 'screen', 'panel', 'touch', 'display', 'amoled', 'ips', 'repair'],
  screen: ['screen', 'lcd', 'panel', 'touch', 'display', 'glass', 'repair'],
  repair: ['repair', 'replacement', 'fix', 'ic', 'flash', 'swap', 'diagnostics', 'service'],
  software: ['software', 'flash', 'frp', 'unlock', 'logo', 'bootloop'],
  jack: ['jack', 'charging', 'port', 'ic', 'repair'],
  mic: ['mic', 'speaker', 'earpiece', 'ringer', 'audio', 'camera', 'repair'],
  water: ['water', 'dead', 'board', 'damage', 'repair'],
  infinix: ['infinix', 'hot', 'note', 'smart', 'zero'],
  samsung: ['samsung', 'galaxy', 'a54', 's23', 's24', 'ultra'],
  tecno: ['tecno', 'spark', 'camon', 'pova'],
  xiaomi: ['xiaomi', 'redmi', 'note'],
  iphone: ['iphone', 'apple', 'pro', 'max'],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function getKeywords(text: string): Set<string> {
  const tokens = tokenize(text);
  const set = new Set<string>(tokens);
  // Add synonyms
  for (const token of tokens) {
    for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
      if (token === key || syns.includes(token)) {
        set.add(key);
        syns.forEach((s) => set.add(s));
      }
    }
  }
  return set;
}

export function matchesProductQuery(product: CatalogProduct, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;

  const productText = [
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

  // Direct substring match
  if (productText.includes(q)) return true;

  const queryTokens = tokenize(q);
  if (queryTokens.length === 0) return false;

  const productKeywords = getKeywords(productText);

  // Check if every query token or its synonym is present in product keywords or text
  const matchCount = queryTokens.filter((token) => {
    if (productText.includes(token) || productKeywords.has(token)) return true;
    // Check synonym matches
    for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
      if (token === key || syns.includes(token)) {
        if (productText.includes(key) || syns.some((s) => productText.includes(s))) {
          return true;
        }
      }
    }
    return false;
  }).length;

  // Match if at least 70% of tokens match (or all tokens for short queries)
  const threshold = queryTokens.length <= 2 ? queryTokens.length : Math.ceil(queryTokens.length * 0.6);
  return matchCount >= threshold;
}

export function matchesRepairQuery(service: RepairService, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;

  const repairText = `${service.title} ${service.summary} ${service.warranty} repair service`.toLowerCase();
  if (repairText.includes(q)) return true;

  const queryTokens = tokenize(q);
  if (queryTokens.length === 0) return false;

  // If query specifically mentions repair or parts/lcd/battery/charging/jack/software/mic/water
  const repairKeywords = getKeywords(repairText);
  const matchCount = queryTokens.filter((token) => {
    if (repairText.includes(token) || repairKeywords.has(token)) return true;
    for (const [key, syns] of Object.entries(SYNONYM_MAP)) {
      if (token === key || syns.includes(token)) {
        if (repairText.includes(key) || syns.some((s) => repairText.includes(s))) {
          return true;
        }
      }
    }
    return false;
  }).length;

  return matchCount >= Math.min(queryTokens.length, 1);
}

export function matchesDigitalServiceQuery(service: DigitalService, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;

  const text = `${service.title} ${service.details} ${service.availability}`.toLowerCase();
  if (text.includes(q)) return true;

  const queryTokens = tokenize(q);
  return queryTokens.some((t) => text.includes(t));
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
