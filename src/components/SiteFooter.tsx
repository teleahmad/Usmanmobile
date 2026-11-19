import React, { useRef, useState } from 'react';
import { ExternalLink, MapPin, MessageCircle, Phone, Smartphone } from 'lucide-react';
import { getWhatsAppUrl, SHOP_CONFIG } from '../config/shopConfig';
import { ProductCategory, SitePage } from '../data/catalogData';

interface SiteFooterProps {
  onNavigate: (page: SitePage, sectionHash?: string) => void;
  onBrowseCategory: (category: ProductCategory) => void;
  onToggleAdmin: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  onNavigate,
  onBrowseCategory,
  onToggleAdmin,
}) => {
  const [quickInquiry, setQuickInquiry] = useState('');
  const copyrightClicksRef = useRef<number[]>([]);

  const handleCopyrightClick = () => {
    const now = Date.now();
    const recent = copyrightClicksRef.current.filter((t) => now - t <= 2500);
    recent.push(now);
    if (recent.length >= 5) {
      copyrightClicksRef.current = [];
      onToggleAdmin();
    } else {
      copyrightClicksRef.current = recent;
    }
  };

  const handleQuickWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = quickInquiry.trim()
      ? quickInquiry.trim()
      : 'Assalam o Alaikum, please send me your latest accessories & repair rates';
    const link = document.createElement('a');
    link.href = getWhatsAppUrl(message);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    setQuickInquiry('');
  };

  return (
    <footer className="bg-white text-neutral-700">
      {/* Signature Full-Width Burnt-Orange WhatsApp / Repair Quote Strip */}
      <div className="bg-[#EA4E1B] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
          <div className="text-center lg:text-left">
            <h2 className="font-display text-sm font-extrabold tracking-wide uppercase sm:text-base">
              Quick WhatsApp Order &amp; Repair Quote
            </h2>
            <p className="mt-0.5 text-xs text-white/85">
              Type your phone model or needed accessory — direct to {SHOP_CONFIG.PHONES[0]}
            </p>
          </div>

          <form
            onSubmit={handleQuickWhatsAppSubmit}
            className="flex w-full max-w-md items-center rounded-full bg-white p-1.5 shadow-sm"
          >
            <input
              type="text"
              value={quickInquiry}
              onChange={(e) => setQuickInquiry(e.target.value)}
              placeholder="e.g. Infinix Hot 40 LCD or 67W charger..."
              aria-label="Phone model or accessory inquiry"
              className="h-9 flex-1 bg-transparent px-4 text-sm text-[#141414] placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              type="submit"
              className="h-9 shrink-0 whitespace-nowrap rounded-full bg-[#141414] px-5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              Send WhatsApp
            </button>
          </form>

          <div className="flex items-center gap-2.5">
            <a
              href={getWhatsAppUrl('Assalam o Alaikum Usman Mobile')}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#EA4E1B] transition-transform hover:scale-105"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={`tel:${SHOP_CONFIG.PHONES[0].replace(/-/g, '')}`}
              aria-label="Call Shop"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#EA4E1B] transition-transform hover:scale-105"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={SHOP_CONFIG.MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Google Maps Directions"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#EA4E1B] transition-transform hover:scale-105"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => onNavigate('virtual-shop')}
              aria-label="Open 3D Shop"
              className="flex h-9 items-center gap-1 rounded-lg bg-white px-3 text-xs font-bold text-[#EA4E1B] transition-transform hover:scale-105"
            >
              3D
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Crisp White Multi-Column Footer */}
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="font-display text-xl font-extrabold tracking-tight text-[#EA4E1B]">
              USMAN MOBILE
            </div>
            <p dir="rtl" className="font-urdu mt-1 text-base font-medium text-[#141414]">
              {SHOP_CONFIG.URDU_NAME}
            </p>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-neutral-500">
              Elevate your mobile experience with tested accessories, same-day phone
              repairing, and daily Easypaisa &amp; JazzCash services in Hussain Khan Wala.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-xs font-bold text-[#141414]">Explore</h3>
            <ul className="mt-3.5 space-y-2.5 text-xs text-neutral-600">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="transition-colors hover:text-[#EA4E1B]"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="transition-colors hover:text-[#EA4E1B]"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('repairs')}
                  className="transition-colors hover:text-[#EA4E1B]"
                >
                  Repair Lab
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('virtual-shop')}
                  className="transition-colors hover:text-[#EA4E1B]"
                >
                  3D Virtual Shop
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-bold text-[#141414]">Categories</h3>
            <ul className="mt-3.5 space-y-2.5 text-xs text-neutral-600">
              <li>
                <button
                  type="button"
                  onClick={() => onBrowseCategory('Protection')}
                  className="transition-colors hover:text-[#EA4E1B]"
                >
                  Mobile Cases &amp; 9D Glass
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onBrowseCategory('Audio')}
                  className="transition-colors hover:text-[#EA4E1B]"
                >
                  AirPods &amp; Handsfree
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onBrowseCategory('Charging')}
                  className="transition-colors hover:text-[#EA4E1B]"
                >
                  Fast Chargers &amp; Cables
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onBrowseCategory('Phones & Wearables')}
                  className="transition-colors hover:text-[#EA4E1B]"
                >
                  Smart Watches &amp; Phones
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-bold text-[#141414]">Visit &amp; Call</h3>
            <ul className="mt-3.5 space-y-2 text-xs text-neutral-600">
              <li className="tabular-nums font-medium text-[#141414]">
                {SHOP_CONFIG.PHONES.join(' / ')}
              </li>
              <li>{SHOP_CONFIG.HOURS}</li>
              <li>{SHOP_CONFIG.ADDRESS}</li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about', 'contact')}
                  className="font-semibold text-[#EA4E1B] hover:underline"
                >
                  Contact &amp; Directions
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Warm Sand Bottom Copyright Bar — Small mobile icon triggers Admin Login -> Dashboard on 5 rapid clicks */}
      <div className="select-none bg-[#F3ECE6] px-4 py-4 text-center text-xs text-neutral-600">
        <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2">
          <span>
            © {new Date().getFullYear()} {SHOP_CONFIG.NAME} · Hussain Khan Wala, Chak No. 8,
            Pattoki
          </span>
          <button
            type="button"
            onClick={handleCopyrightClick}
            aria-label="Mobile"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-500/80 transition-colors hover:text-[#EA4E1B] active:scale-90"
          >
            <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};
