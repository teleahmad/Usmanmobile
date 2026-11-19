import React from 'react';
import { Compass, Home, MapPin, MessageCircle, ShoppingBag, Store } from 'lucide-react';
import { getWhatsAppUrl, SHOP_CONFIG } from '../config/shopConfig';
import { SitePage } from '../data/catalogData';

interface MobileBottomNavProps {
  activePage: SitePage;
  cartOpen?: boolean;
  cartCount: number;
  onNavigate: (page: SitePage) => void;
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  cartOpen = false,
  cartCount,
  onNavigate,
  onOpenCart,
}) => {
  return (
    <nav
      aria-label="Mobile Web App Navigation"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-black/10 bg-white/95 px-2 py-2 backdrop-blur-md md:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.08)]"
    >
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className={`group relative flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all duration-300 active:scale-95 ${
          !cartOpen && activePage === 'home'
            ? 'text-[#EA4E1B] bg-[#EA4E1B]/10 shadow-sm'
            : 'text-neutral-500 hover:text-[#141414]'
        }`}
      >
        <Home className="h-5 w-5" aria-hidden="true" />
        <span>Home</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('products')}
        className={`group relative flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all duration-300 active:scale-95 ${
          !cartOpen && activePage === 'products'
            ? 'text-[#EA4E1B] bg-[#EA4E1B]/10 shadow-sm'
            : 'text-neutral-500 hover:text-[#141414]'
        }`}
      >
        <Store className="h-5 w-5" aria-hidden="true" />
        <span>Products</span>
      </button>

      <button
        type="button"
        onClick={() => onNavigate('virtual-shop')}
        className={`group relative flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all duration-300 active:scale-95 ${
          !cartOpen && activePage === 'virtual-shop'
            ? 'text-[#EA4E1B] bg-[#EA4E1B]/10 shadow-sm'
            : 'text-neutral-500 hover:text-[#141414]'
        }`}
      >
        <Compass className="h-5 w-5" aria-hidden="true" />
        <span>3D Shop</span>
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        className={`group relative flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all duration-300 active:scale-95 ${
          cartOpen
            ? 'text-[#EA4E1B] bg-[#EA4E1B]/10 shadow-sm'
            : 'text-neutral-500 hover:text-[#141414]'
        }`}
      >
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        <span>Cart</span>
        {cartCount > 0 && (
          <span className="absolute -top-0.5 right-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#EA4E1B] px-1 text-[9px] font-bold tabular-nums text-white shadow-md">
            {cartCount}
          </span>
        )}
      </button>

      <a
        href={getWhatsAppUrl('Assalam o Alaikum Usman Mobile')}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold text-neutral-500 transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 hover:bg-neutral-100 hover:text-[#16A34A] hover:shadow-[0_8px_20px_rgba(22,163,74,0.25)] active:scale-95"
      >
        <MessageCircle className="h-5 w-5 text-[#16A34A] transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" aria-hidden="true" />
        <span>WhatsApp</span>
      </a>
    </nav>
  );
};
