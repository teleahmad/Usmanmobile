import React from 'react';
import { Clock, ExternalLink, MapPin, Phone } from 'lucide-react';
import { SHOP_CONFIG } from '../config/shopConfig';
import { useLanguage } from '../context/LanguageContext';
import { SitePage } from '../data/catalogData';

interface VisitCallShopSectionProps {
  onNavigate: (page: SitePage, sectionHash?: string) => void;
  onActionComplete?: () => void;
  compact?: boolean;
}

export const VisitCallShopSection: React.FC<VisitCallShopSectionProps> = ({
  onNavigate,
  onActionComplete,
  compact = false,
}) => {
  const { t, isUrdu } = useLanguage();

  return (
    <div>
      <h3
        className={`font-display text-sm font-extrabold text-[#141414] ${
          isUrdu ? 'font-urdu text-base' : ''
        }`}
      >
        {t('Visit & Call Shop', 'دکان کا پتہ اور کال کریں')}
      </h3>

      {/* Larger, High-Visibility Phone Numbers */}
      <div className={`${compact ? 'mt-2.5 space-y-2' : 'mt-3.5 space-y-2'}`}>
        {SHOP_CONFIG.PHONES.map((phone, idx) => (
          <a
            key={phone}
            href={`tel:${phone.replace(/-/g, '')}`}
            className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-[#F8F6F4] px-3.5 py-2.5 transition hover:border-[#EA4E1B] hover:bg-orange-50/40"
          >
            <span className="font-display text-base font-extrabold tracking-tight tabular-nums text-[#141414] sm:text-lg">
              {phone}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EA4E1B] px-3 py-1 text-xs font-bold text-white shadow-2xs">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{idx === 0 ? t('Call Now', 'کال کریں') : t('Call', 'کال')}</span>
            </span>
          </a>
        ))}
      </div>

      {/* Business Hours */}
      <div
        className={`${
          compact ? 'mt-3' : 'mt-4'
        } flex items-start gap-2.5 rounded-xl bg-[#F3ECE6]/70 px-3.5 py-3`}
      >
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
        <div>
          <div className={`text-xs font-bold text-[#141414] ${isUrdu ? 'font-urdu text-sm' : ''}`}>
            {t('Business Hours', 'اوقاتِ کار')}
          </div>
          <div className="mt-0.5 text-sm font-extrabold tabular-nums text-[#141414]">
            {SHOP_CONFIG.HOURS}
          </div>
          <div className="mt-1 text-xs leading-snug text-neutral-600">
            {SHOP_CONFIG.ADDRESS}
          </div>
        </div>
      </div>

      {/* Prominent Contact & Directions Buttons */}
      <div className={`${compact ? 'mt-3' : 'mt-3.5'} flex flex-wrap items-center gap-2`}>
        <button
          type="button"
          onClick={() => {
            onActionComplete?.();
            onNavigate('about', 'contact');
          }}
          className={`inline-flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#141414] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#EA4E1B] ${
            isUrdu ? 'font-urdu text-sm' : ''
          }`}
        >
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('Contact & Directions', 'رابطہ اور راستہ')}</span>
        </button>

        <a
          href={SHOP_CONFIG.MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-black/15 bg-white px-4 text-xs font-bold text-[#141414] transition hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t('Google Maps', 'گوگل میپ')}</span>
        </a>
      </div>
    </div>
  );
};
