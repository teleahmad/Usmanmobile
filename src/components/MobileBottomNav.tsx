import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Home, MessageCircle, ShoppingBag, Store } from 'lucide-react';
import { getWhatsAppUrl } from '../config/shopConfig';
import { SitePage } from '../data/catalogData';

interface MobileBottomNavProps {
  activePage: SitePage;
  cartOpen?: boolean;
  cartCount: number;
  onNavigate: (page: SitePage) => void;
  onOpenCart: () => void;
}

const TAB_COUNT = 5;

const TABS = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'products', label: 'Products', Icon: Store },
  { id: 'shop3d', label: '3D Shop', Icon: Compass },
  { id: 'cart', label: 'Cart', Icon: ShoppingBag },
  { id: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
] as const;

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePage,
  cartOpen = false,
  cartCount,
  onNavigate,
  onOpenCart,
}) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Zero-lag spring physics refs (no React re-render per pointermove)
  const draggingRef = useRef(false);
  const currentPosRef = useRef(0);
  const targetPosRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const hoveredIdxRef = useRef<number>(0);

  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeIndex = useMemo<number>(() => {
    if (cartOpen) return 3;
    if (activePage === 'home') return 0;
    if (activePage === 'products') return 1;
    if (activePage === 'virtual-shop') return 2;
    return -1;
  }, [activePage, cartOpen]);

  const applyLensTransform = useCallback((pos: number, vel: number, dragging: boolean) => {
    const lens = lensRef.current;
    if (!lens) return;
    // Organic liquid glass velocity stretch while gliding across buttons
    const speed = Math.min(Math.abs(vel), 0.45);
    const stretchX = dragging ? 1.07 + speed * 0.34 : 1 + speed * 0.22;
    const stretchY = dragging ? 1.05 - speed * 0.14 : 1 - speed * 0.08;
    lens.style.transform = `translate3d(${pos * 100}%, 0, 0) scale(${stretchX.toFixed(
      4,
    )}, ${stretchY.toFixed(4)})`;
  }, []);

  const startPhysicsLoop = useCallback(() => {
    if (rafRef.current !== null) return;

    const tick = () => {
      const target = targetPosRef.current;
      const current = currentPosRef.current;
      const dragging = draggingRef.current;

      // Critically damped spring when snapping, silky high-response lerp when dragging
      const stiffness = dragging ? 0.38 : 0.22;
      const damping = dragging ? 0.52 : 0.68;

      const force = (target - current) * stiffness;
      velocityRef.current = (velocityRef.current + force) * damping;
      currentPosRef.current = current + velocityRef.current;

      applyLensTransform(currentPosRef.current, velocityRef.current, dragging);

      const settled =
        !dragging &&
        Math.abs(target - currentPosRef.current) < 0.0015 &&
        Math.abs(velocityRef.current) < 0.0015;

      if (settled) {
        currentPosRef.current = target;
        velocityRef.current = 0;
        applyLensTransform(target, 0, false);
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [applyLensTransform]);

  // Keep lens synced smoothly when activePage/cartOpen changes externally
  useEffect(() => {
    if (draggingRef.current) return;
    if (activeIndex >= 0) {
      targetPosRef.current = activeIndex;
      hoveredIdxRef.current = activeIndex;
      startPhysicsLoop();
    }
  }, [activeIndex, startPhysicsLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const computeSlotPos = (clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    const raw = ((clientX - rect.left) / rect.width) * TAB_COUNT - 0.5;
    if (raw < 0) return raw * 0.16;
    if (raw > TAB_COUNT - 1) return TAB_COUNT - 1 + (raw - (TAB_COUNT - 1)) * 0.16;
    return raw;
  };

  const triggerTabAction = (index: number) => {
    if (index === 0) {
      onNavigate('home');
    } else if (index === 1) {
      onNavigate('products');
    } else if (index === 2) {
      onNavigate('virtual-shop');
    } else if (index === 3) {
      onOpenCart();
    } else if (index === 4) {
      const link = document.createElement('a');
      link.href = getWhatsAppUrl('Assalam o Alaikum Usman Mobile');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    }
  };

  const updateDragTarget = (clientX: number) => {
    const pos = computeSlotPos(clientX);
    targetPosRef.current = pos;
    const snapped = Math.max(0, Math.min(TAB_COUNT - 1, Math.round(pos)));
    if (snapped !== hoveredIdxRef.current) {
      hoveredIdxRef.current = snapped;
      setHoveredIdx(snapped);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(6);
        } catch {
          // Ignore vibration restrictions
        }
      }
    }
    startPhysicsLoop();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore capture errors
    }
    const pos = computeSlotPos(e.clientX);
    if (activeIndex < 0) {
      currentPosRef.current = pos;
    }
    draggingRef.current = true;
    setIsDragging(true);
    hoveredIdxRef.current = Math.max(0, Math.min(TAB_COUNT - 1, Math.round(pos)));
    setHoveredIdx(hoveredIdxRef.current);
    targetPosRef.current = pos;
    startPhysicsLoop();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || pointerIdRef.current !== e.pointerId) return;
    updateDragTarget(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const finalPos = computeSlotPos(e.clientX);
    const targetIdx = Math.max(0, Math.min(TAB_COUNT - 1, Math.round(finalPos)));
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore release errors
    }
    pointerIdRef.current = null;
    draggingRef.current = false;
    setIsDragging(false);
    setHoveredIdx(null);
    targetPosRef.current = targetIdx;
    startPhysicsLoop();
    triggerTabAction(targetIdx);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    draggingRef.current = false;
    setIsDragging(false);
    setHoveredIdx(null);
    if (activeIndex >= 0) {
      targetPosRef.current = activeIndex;
      startPhysicsLoop();
    }
  };

  const highlightedIndex = hoveredIdx !== null ? hoveredIdx : activeIndex;
  const showLens = isDragging || activeIndex >= 0;
  const isOverWhatsApp = highlightedIndex === 4;

  return (
    <nav
      aria-label="Mobile Web App Navigation"
      className="pointer-events-none fixed right-0 bottom-0 left-0 z-50 px-3 pt-1 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {/* iOS Liquid Glass Floating Dock */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="pointer-events-auto relative mx-auto grid max-w-md grid-cols-5 items-center rounded-[30px] border border-white/85 bg-white/60 p-1.5 backdrop-blur-2xl backdrop-saturate-[2] select-none touch-none shadow-[0_14px_36px_rgba(20,20,20,0.16),inset_0_1.5px_1.5px_rgba(255,255,255,0.96),inset_0_-1px_2px_rgba(20,20,20,0.06)]"
      >
        {/* Top Specular Glass Rim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 top-0.5 h-3 rounded-full bg-gradient-to-b from-white/80 to-transparent"
        />

        {/* GPU-Accelerated Spring Liquid Glass Lens */}
        {showLens && (
          <div
            ref={lensRef}
            aria-hidden="true"
            style={{
              width: `calc((100% - 12px) / ${TAB_COUNT})`,
              transform: `translate3d(${Math.max(0, activeIndex) * 100}%, 0, 0)`,
              willChange: 'transform',
            }}
            className={`pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 rounded-[24px] border border-white/95 backdrop-blur-xl transition-[background-color,box-shadow] duration-200 ${
              isOverWhatsApp
                ? 'bg-gradient-to-b from-white/95 via-emerald-50/75 to-emerald-100/55 shadow-[0_8px_22px_rgba(22,163,74,0.24),inset_0_2px_2px_rgba(255,255,255,0.98),inset_0_-1.5px_3px_rgba(22,163,74,0.14)]'
                : 'bg-gradient-to-b from-white/95 via-white/72 to-[#EA4E1B]/12 shadow-[0_8px_22px_rgba(234,78,27,0.22),inset_0_2px_2px_rgba(255,255,255,0.98),inset_0_-1.5px_3px_rgba(234,78,27,0.12)]'
            }`}
          >
            <span className="absolute inset-x-2.5 top-1 h-2 rounded-full bg-gradient-to-b from-white/95 to-transparent" />
          </div>
        )}

        {TABS.map(({ id, label, Icon }, idx) => {
          const isSelected = highlightedIndex === idx;
          const isWhatsApp = idx === 4;
          const colorClass = isSelected
            ? isWhatsApp
              ? 'text-[#16A34A]'
              : 'text-[#EA4E1B]'
            : isWhatsApp
              ? 'text-[#16A34A]/85'
              : 'text-neutral-600';

          return (
            <button
              key={id}
              type="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  triggerTabAction(idx);
                }
              }}
              aria-current={activeIndex === idx ? 'page' : undefined}
              className={`relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-[24px] py-2 text-[10px] font-bold transition-transform duration-150 will-change-transform ${colorClass} ${
                isSelected && isDragging
                  ? 'scale-[1.13] -translate-y-0.5'
                  : isSelected
                    ? 'scale-[1.03]'
                    : 'scale-100'
              }`}
            >
              <div className="relative">
                <Icon
                  className="h-5 w-5"
                  strokeWidth={isSelected ? 2.4 : 2}
                  aria-hidden="true"
                />
                {idx === 3 && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#EA4E1B] px-1 text-[9px] font-extrabold tabular-nums text-white shadow-sm ring-1 ring-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="leading-none tracking-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
