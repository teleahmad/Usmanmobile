import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  DoorOpen,
  ExternalLink,
  Info,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  RotateCcw,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import {
  getShopProduct,
  getWhatsAppUrl,
  INTERIOR_HOTSPOTS,
  PanoTab,
  ROAD_LABELS,
  SHOP_CONFIG,
  SHOP_IMAGES,
  ViewMode,
} from '../config/shopConfig';
import {
  CatalogProduct,
  findCatalogProductByShopKey,
  formatPkr,
} from '../data/catalogData';
import { OverlayDomRefs } from './ShopViewport';

interface ShopHudProps {
  viewMode: ViewMode;
  panoTab: PanoTab;
  roadDetailsVisible: boolean;
  editPinMode: boolean;
  isDefaultPin: boolean;
  infoOpen: boolean;
  dockCollapsed: boolean;
  shutterOpen: boolean;
  isMap3D: boolean;
  insideShop: boolean;
  hoveredItemType: string | null;
  selectedItemType: string | null;
  overlayDomRef: React.MutableRefObject<OverlayDomRefs>;
  onModeChange: (mode: ViewMode) => void;
  onPanoTabChange: (tab: PanoTab) => void;
  onToggleRoads: () => void;
  onToggleMapTilt: () => void;
  onExitShop: () => void;
  onCloseSelectedItem: () => void;
  onToggleEditPin: () => void;
  onResetPin: () => void;
  onToggleInfo: () => void;
  onToggleDock: () => void;
  onItemWhatsApp: (topic: string) => void;
  onAddCatalogProduct?: (product: CatalogProduct) => void;
}

const PIN_DWELL_MS = 2000;
const RING_CIRCUMFERENCE = 2 * Math.PI * 22;

export const ShopHud: React.FC<ShopHudProps> = ({
  viewMode,
  panoTab,
  roadDetailsVisible,
  editPinMode,
  isDefaultPin,
  infoOpen,
  dockCollapsed,
  shutterOpen,
  isMap3D,
  insideShop,
  hoveredItemType,
  selectedItemType,
  overlayDomRef,
  onModeChange,
  onPanoTabChange,
  onToggleRoads,
  onToggleMapTilt,
  onExitShop,
  onCloseSelectedItem,
  onToggleEditPin,
  onResetPin,
  onToggleInfo,
  onToggleDock,
  onItemWhatsApp,
  onAddCatalogProduct,
}) => {
  const [pinHoverProgress, setPinHoverProgress] = useState(0);
  const [addedSpotlightId, setAddedSpotlightId] = useState<string | null>(null);
  const pinRafRef = useRef<number | null>(null);

  const cancelPinHover = () => {
    if (pinRafRef.current !== null) {
      cancelAnimationFrame(pinRafRef.current);
      pinRafRef.current = null;
    }
    setPinHoverProgress(0);
  };

  const startPinHover = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'touch' || viewMode !== 'map' || editPinMode) return;
    cancelPinHover();
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / PIN_DWELL_MS);
      setPinHoverProgress(progress);
      if (progress >= 1) {
        pinRafRef.current = null;
        setPinHoverProgress(0);
        onModeChange('shop');
      } else {
        pinRafRef.current = requestAnimationFrame(tick);
      }
    };
    pinRafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (viewMode !== 'map' || editPinMode) {
      cancelPinHover();
    }
    return () => {
      if (pinRafRef.current !== null) {
        cancelAnimationFrame(pinRafRef.current);
      }
    };
  }, [viewMode, editPinMode]);
  const hoveredProduct = hoveredItemType ? getShopProduct(hoveredItemType) : null;
  const selectedProduct = selectedItemType ? getShopProduct(selectedItemType) : null;
  const matchedCatalogProduct = selectedItemType
    ? findCatalogProductByShopKey(selectedItemType)
    : undefined;

  return (
    <>
      {/* Storefront photograph lightbox when Storefront tab is active in 360° View */}
      {viewMode === 'pano' && panoTab === 'storefront' && (
        <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center bg-[#0A1120]/95 p-6 pb-28">
          <div className="relative max-h-[75vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#0D162A] shadow-2xl">
            <img
              src={SHOP_IMAGES.storefront}
              alt="Usman Mobile Repairing Centre actual storefront"
              className="max-h-[65vh] w-full object-contain bg-black"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-300">
              <div>
                <span className="font-semibold text-white">{SHOP_CONFIG.NAME}</span>
                <span className="mx-2 text-slate-500">·</span>
                <span>{SHOP_CONFIG.ADDRESS}</span>
              </div>
              <button
                type="button"
                onClick={() => onPanoTabChange('interior')}
                className="rounded-lg bg-[#1769FF] px-3 py-1.5 font-medium text-white transition hover:bg-blue-500"
              >
                Switch to 360° Interior
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map side legend removed per user request */}

      {/* Edit Pin Calibration Helper Banner */}
      {viewMode === 'map' && editPinMode && (
        <div className="pointer-events-auto absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-400/40 bg-[#0D162A]/95 px-4 py-2 text-xs text-amber-100 shadow-xl">
          <MapPin className="h-4 w-4 shrink-0 text-amber-400" />
          <span>Click anywhere on the aerial map to reposition the shop pin</span>
          {!isDefaultPin && (
            <button
              type="button"
              onClick={onResetPin}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-medium text-white hover:bg-white/20"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onToggleEditPin}
            className="rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-semibold text-slate-950 hover:bg-amber-300"
          >
            Done
          </button>
        </div>
      )}

      {/* Projected Spatial Overlays Layer */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {/* Yellow 3D Map Pin (Hold cursor 2s or click/tap to fly down to Usman Mobile exterior) */}
        <button
          ref={(el) => {
            overlayDomRef.current.pinEl = el;
          }}
          type="button"
          onClick={() => {
            cancelPinHover();
            onModeChange('shop');
          }}
          onPointerEnter={startPinHover}
          onPointerLeave={cancelPinHover}
          aria-label="Hold cursor 2 seconds or click to view shop exterior"
          style={{ opacity: 0 }}
          className="group absolute top-0 left-0 -ml-6 -mt-6 flex items-center transition-opacity duration-200"
        >
          <span className="relative grid h-12 w-12 place-items-center">
            <svg
              className="pointer-events-none absolute inset-0 h-12 w-12 -rotate-90"
              viewBox="0 0 48 48"
            >
              <circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke="rgba(255, 197, 49, 0.25)"
                strokeWidth="3"
              />
              {pinHoverProgress > 0 && (
                <circle
                  cx="24"
                  cy="24"
                  r="22"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - pinHoverProgress)}
                />
              )}
            </svg>
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-slate-950 bg-[#FFC531] text-slate-950 shadow-[0_0_0_4px_rgba(255,197,49,0.28)] transition-transform group-hover:scale-110">
              <MapPin className="h-5 w-5" />
            </span>
          </span>
          <span className="ml-2 whitespace-nowrap rounded-lg border border-white/15 bg-[#0D162A]/92 px-2.5 py-1 text-left text-xs font-medium text-white shadow-lg">
            {pinHoverProgress > 0 ? (
              'Opening Exterior View...'
            ) : (
              <>
                <span className="sm:hidden">Usman Mobile · Tap</span>
                <span className="hidden sm:inline">Usman Mobile · Hover 2s or Click</span>
              </>
            )}
          </span>
        </button>

        {/* Road & Chowk Labels */}
        {ROAD_LABELS.map((lbl) => (
          <div
            key={lbl.id}
            ref={(el) => {
              overlayDomRef.current.roadLabelEls[lbl.id] = el;
            }}
            style={{ opacity: 0 }}
            className={
              lbl.isChowk
                ? 'absolute top-0 left-0 flex flex-col items-center transition-opacity duration-200'
                : 'absolute top-0 left-0 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 bg-[#0D162A]/92 px-2.5 py-1 text-[11px] font-medium text-slate-100 shadow transition-opacity duration-200'
            }
          >
            {lbl.isChowk ? (
              <>
                {lbl.labelBelow && (
                  <span
                    className="mb-0.5 h-2.5 w-0.5"
                    style={{ backgroundColor: lbl.color }}
                  />
                )}
                <span className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/25 bg-[#0B1427]/95 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-lg">
                  <span
                    className="h-2 w-2 rounded-full ring-2 ring-white/30"
                    style={{ backgroundColor: lbl.color }}
                  />
                  {lbl.label}
                </span>
                {!lbl.labelBelow && (
                  <span
                    className="mt-0.5 h-2.5 w-0.5"
                    style={{ backgroundColor: lbl.color }}
                  />
                )}
              </>
            ) : (
              <>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: lbl.color }}
                />
                {lbl.label}
              </>
            )}
          </div>
        ))}

        {/* 360° Interior Panorama Hotspots */}
        {INTERIOR_HOTSPOTS.map((hs) => (
          <div
            key={`pano-${hs.id}`}
            ref={(el) => {
              overlayDomRef.current.panoHotspotEls[hs.id] = el;
            }}
            style={{ opacity: 0 }}
            className="group absolute top-0 left-0 transition-opacity duration-200"
          >
            <button
              type="button"
              onClick={() => onItemWhatsApp(hs.title)}
              className="flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#19A974] shadow-lg transition-transform hover:scale-125"
              aria-label={`Ask about ${hs.title} on WhatsApp`}
            >
              <span className="h-2 w-2 rounded-full bg-white" />
            </button>
            <div
              className={`pointer-events-none absolute top-0 w-48 -translate-y-1/2 rounded-xl border border-white/15 bg-[#0D162A]/95 px-3 py-2 text-xs text-slate-200 opacity-0 shadow-xl transition-opacity group-hover:opacity-100 ${
                hs.alignRight ? 'right-5' : 'left-5'
              }`}
            >
              <div className="font-semibold text-white">{hs.title}</div>
              <div className="mt-0.5 text-[11px] text-slate-300">{hs.description}</div>
              <div className="mt-1 text-[10px] font-medium text-emerald-400">
                Click to ask on WhatsApp
              </div>
            </div>
          </div>
        ))}

        {/* Interactive 3D Product Hover Preview Card (follows cursor cleanly) */}
        <div
          ref={(el) => {
            overlayDomRef.current.itemTooltipEl = el;
          }}
          style={{ opacity: hoveredProduct && viewMode !== 'pano' ? 1 : 0 }}
          className="absolute top-0 left-0 z-30 w-60 rounded-xl border border-white/20 bg-[#0B152A]/95 p-2.5 text-left text-white shadow-2xl transition-opacity duration-150"
        >
          {hoveredProduct && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: hoveredProduct.accent }}
                  />
                  {hoveredProduct.category}
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  {hoveredProduct.badge}
                </span>
              </div>
              <div className="mt-1 text-xs font-bold leading-snug text-white">
                {hoveredProduct.name}
              </div>
              <div className="mt-0.5 text-[11px] leading-tight text-slate-300">
                {hoveredProduct.specs}
              </div>
              <div className="mt-1.5 text-[10px] font-semibold text-amber-300">
                Click to inspect &amp; ask price
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interactive Product Spotlight Card (opens when customer clicks any product inside the shop) */}
      {selectedProduct && viewMode !== 'pano' && (
        <aside
          aria-label="Selected shop product details"
          className="pointer-events-auto absolute top-3 right-3 z-30 w-[min(320px,calc(100vw-1.5rem))] rounded-2xl border border-white/20 bg-[#0B152A]/96 p-4 text-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span>{selectedProduct.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-300">
                  {selectedProduct.badge}
                </span>
              </div>
              <h2 className="mt-1 text-sm font-bold leading-snug text-white">
                {selectedProduct.name}
              </h2>
              {matchedCatalogProduct && (
                <div className="mt-1 text-sm font-bold tabular-nums text-amber-300">
                  {formatPkr(matchedCatalogProduct.pricePkr)}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onCloseSelectedItem}
              aria-label="Close product card"
              className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-300 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-slate-200">
            {selectedProduct.specs}
          </p>

          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{selectedProduct.highlight}</span>
          </div>

          <div className="mt-3.5 flex flex-col gap-2">
            {matchedCatalogProduct && onAddCatalogProduct && (
              <button
                type="button"
                onClick={() => {
                  onAddCatalogProduct(matchedCatalogProduct);
                  setAddedSpotlightId(matchedCatalogProduct.id);
                  window.setTimeout(() => setAddedSpotlightId(null), 1300);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                {addedSpotlightId === matchedCatalogProduct.id
                  ? 'Added to Website Cart'
                  : `Add to Cart · ${formatPkr(matchedCatalogProduct.pricePkr)}`}
              </button>
            )}
            <button
              type="button"
              onClick={() => onItemWhatsApp(selectedProduct.name)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#19A974] px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ask Price on WhatsApp
            </button>
          </div>
          <div className="mt-2 text-center text-[10px] text-slate-400">
            Usman Mobile · Hussain Khan Wala · {SHOP_CONFIG.PHONES[0]}
          </div>
        </aside>
      )}

    </>
  );
};
