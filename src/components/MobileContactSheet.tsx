import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { getWhatsAppUrl } from '../config/shopConfig';
import { useLanguage } from '../context/LanguageContext';
import { SitePage } from '../data/catalogData';
import { VisitCallShopSection } from './VisitCallShopSection';

interface MobileContactSheetProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: SitePage, sectionHash?: string) => void;
}

export const MobileContactSheet: React.FC<MobileContactSheetProps> = ({
  open,
  onClose,
  onNavigate,
}) => {
  const { t, isUrdu } = useLanguage();

  if (!open) return null;

  return (
    <div className="md:hidden">
      {/* Soft Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
      />

      {/* Mobile Bottom Sheet displaying a copy of Visit & Call Shop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Visit & Call Shop', 'دکان کا پتہ اور کال کریں')}
        className="fixed inset-x-3 bottom-[84px] z-50 max-h-[78dvh] overflow-y-auto rounded-3xl border border-black/10 bg-white shadow-2xl"
      >
        {/* Top bar with quick direct WhatsApp CTA + Close */}
        <div className="flex items-center justify-between border-b border-black/6 bg-[#FAF5F0] px-4 py-3">
          <a
            href={getWhatsAppUrl('Assalam o Alaikum Usman Mobile')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className={`inline-flex h-9 items-center gap-2 rounded-full bg-[#16A34A] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#15803D] active:scale-95 ${
              isUrdu ? 'font-urdu text-sm font-semibold' : ''
            }`}
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('Open WhatsApp Chat', 'واٹس ایپ چیٹ کھولیں')}</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close', 'بند کریں')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/6 text-neutral-700 transition hover:bg-black/10"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Exact Copy of Footer Visit & Call Shop Section */}
        <div className="p-4">
          <VisitCallShopSection
            compact
            onNavigate={onNavigate}
            onActionComplete={onClose}
          />
        </div>
      </div>
    </div>
  );
};
