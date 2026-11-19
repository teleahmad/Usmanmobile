import React, { useState } from 'react';
import { Globe, Menu, ShoppingBag, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SitePage } from '../data/catalogData';

interface SiteHeaderProps {
  activePage: SitePage;
  cartCount: number;
  onNavigate: (page: SitePage) => void;
  onOpenCart: () => void;
}

const NAV_ITEMS: { id: SitePage; en: string; ur: string }[] = [
  { id: 'home', en: 'Home', ur: 'ہوم' },
  { id: 'products', en: 'Products', ur: 'پراڈکٹس' },
  { id: 'repairs', en: 'Repairs', ur: 'ریپئرنگ' },
  { id: 'virtual-shop', en: '3D Shop', ur: 'تھری ڈی شاپ' },
  { id: 'about', en: 'Contact Us', ur: 'رابطہ' },
];

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  activePage,
  cartCount,
  onNavigate,
  onOpenCart,
}) => {
  const { lang, isUrdu, toggleLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page: SitePage) => {
    setMobileMenuOpen(false);
    onNavigate(page);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[#F3ECE6]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:gap-8 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="group shrink-0 text-left transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA4E1B]"
        >
          <div
            className="font-display text-sm tracking-tight transition-colors sm:text-base"
            style={{
              fontStyle: 'normal',
              textDecorationLine: 'none',
              fontWeight: 'bold',
              fontFamily: 'Georgia',
              textAlign: 'left',
              color: '#000000',
            }}
          >
            Usman Mobile Repairing Centre
          </div>
          <div
            className={`text-[10px] font-medium tracking-wide ${isUrdu ? 'font-urdu text-[11px]' : ''}`}
            style={{ fontFamily: isUrdu ? undefined : 'Verdana', color: '#cf1c1c' }}
          >
            {t('Expert Repairs & Accessories', 'ماہر ریپئرنگ، ایسسریز اور استعمال شدہ فون')}
          </div>
        </button>

        {/* Zone 2: 5 Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 md:flex lg:gap-8"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative shrink-0 whitespace-nowrap py-1 text-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA4E1B] ${
                  isUrdu ? 'font-urdu text-[15px]' : ''
                } ${
                  isActive
                    ? 'font-bold text-[#141414]'
                    : 'font-medium text-neutral-600 hover:text-[#EA4E1B]'
                }`}
              >
                {isUrdu ? item.ur : item.en}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 -bottom-1 left-0 h-0.5 rounded-full bg-[#EA4E1B]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language Switcher + Cart + Mobile Menu Trigger */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'en' ? 'Switch to Urdu' : 'Switch to English'}
            title={lang === 'en' ? 'اردو میں دیکھیں' : 'View in English'}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-black/12 bg-white px-3 text-xs font-bold text-[#141414] shadow-2xs transition hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
            <span className={lang === 'en' ? 'font-urdu text-xs font-semibold' : ''}>
              {lang === 'en' ? 'اردو' : 'EN'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#EA4E1B] px-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-[#d44212] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA4E1B] sm:px-5"
          >
            <ShoppingBag
              className="h-4 w-4 shrink-0 transition-transform duration-200 hover:scale-110"
              aria-hidden="true"
            />
            <span className={`tabular-nums ${isUrdu ? 'font-urdu' : ''}`}>
              {t('Cart', 'کارٹ')}
              {cartCount > 0 ? ` (${cartCount})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-800 shadow-xs transition-colors hover:text-[#EA4E1B] md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-black/5 bg-white px-4 py-2 md:hidden"
        >
          <div className="flex flex-col divide-y divide-neutral-100">
            {NAV_ITEMS.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center justify-between py-2.5 text-left text-sm ${
                    isUrdu ? 'font-urdu text-base' : ''
                  } ${
                    isActive
                      ? 'font-bold text-[#EA4E1B]'
                      : 'font-medium text-neutral-700 hover:text-[#141414]'
                  }`}
                >
                  <span>{isUrdu ? item.ur : item.en}</span>
                  {isActive && (
                    <span className="text-xs text-[#EA4E1B]">{t('Active', 'موجودہ')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
