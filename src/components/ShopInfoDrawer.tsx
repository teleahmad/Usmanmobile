import React from 'react';
import {
  Camera,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { getWhatsAppUrl, SHOP_CONFIG, SHOP_IMAGES } from '../config/shopConfig';

interface ShopInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenPano: () => void;
}

export const ShopInfoDrawer: React.FC<ShopInfoDrawerProps> = ({
  open,
  onClose,
  onOpenPano,
}) => {
  if (!open) return null;

  return (
    <aside
      aria-label="Shop Details"
      className="absolute right-3 bottom-24 z-30 w-[min(360px,calc(100vw-24px))] max-h-[calc(100%-7.5rem)] overflow-y-auto rounded-2xl border border-white/15 bg-[#0D162A]/95 p-4 text-slate-100 shadow-2xl"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            {SHOP_CONFIG.NAME}
          </h2>
          <p dir="rtl" className="font-urdu mt-0.5 text-sm font-medium text-amber-300">
            {SHOP_CONFIG.URDU_NAME}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close shop details"
          className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <img
          src={SHOP_IMAGES.storefront}
          alt="Usman Mobile Repairing Centre storefront"
          className="h-32 w-full object-cover object-top"
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-b border-white/10 pb-2.5 text-xs tracking-[0.14em] text-sky-300">
        <span>{SHOP_CONFIG.TAG}</span>
        <button
          type="button"
          onClick={() => {
            onOpenPano();
            onClose();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1769FF] px-2.5 py-1 text-[11px] font-medium tracking-normal text-white transition hover:bg-blue-500"
        >
          <Camera className="h-3.5 w-3.5" />
          360° Interior
        </button>
      </div>

      <dl className="mt-3 space-y-2 text-xs text-slate-300">
        <div className="flex items-start gap-2">
          <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <div>
            <dt className="sr-only">Owner</dt>
            <dd>
              <span className="text-slate-400">Owner:</span>{' '}
              <span className="font-medium text-white">{SHOP_CONFIG.OWNER}</span>
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <dd>{SHOP_CONFIG.ADDRESS}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <dd>{SHOP_CONFIG.HOURS}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <dd className="flex flex-wrap gap-x-2 gap-y-1">
            {SHOP_CONFIG.PHONES.map((phone, idx) => (
              <React.Fragment key={phone}>
                <a
                  href={`tel:${phone.replace(/-/g, '')}`}
                  className="font-medium text-white underline decoration-white/25 underline-offset-2 hover:text-amber-300"
                >
                  {phone}
                </a>
                {idx < SHOP_CONFIG.PHONES.length - 1 && <span className="text-slate-500">/</span>}
              </React.Fragment>
            ))}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <dd>
            <a href={`mailto:${SHOP_CONFIG.EMAIL}`} className="text-slate-200 hover:text-white">
              {SHOP_CONFIG.EMAIL}
            </a>
          </dd>
        </div>
      </dl>

      <div className="mt-3.5 border-t border-white/10 pt-3">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <Wrench className="h-3.5 w-3.5 text-sky-400" />
          Services & Products
        </div>
        <ul className="grid grid-cols-1 gap-1 text-xs text-slate-200">
          {SHOP_CONFIG.CATEGORIES.map((cat) => (
            <li key={cat} className="flex items-center gap-2">
              <span className="h-1 w-1 shrink-0 rounded-full bg-sky-400" />
              <span>{cat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#19A974] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={SHOP_CONFIG.MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          <ExternalLink className="h-4 w-4" />
          Get Directions
        </a>
      </div>
    </aside>
  );
};
