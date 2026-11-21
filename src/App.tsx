import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import {
  AdminInlineProductModal,
  AdminModeBanner,
} from './components/AdminInlineControls';
import { CartDrawer } from './components/CartDrawer';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { HomePage } from './components/HomePage';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileContactSheet } from './components/MobileContactSheet';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProductDetailModal } from './components/ProductDetailModal';
import type { OverlayDomRefs } from './components/ShopViewport';
import { SiteFooter } from './components/SiteFooter';
import { SiteHeader } from './components/SiteHeader';
import {
  getWhatsAppUrl,
  loadSavedShopUv,
  PanoTab,
  saveShopUv,
  SHOP_CONFIG,
  ViewMode,
} from './config/shopConfig';
import {
  CartItem,
  CatalogProduct,
  ProductCategory,
  SITE_IMAGES,
  SitePage,
} from './data/catalogData';
import { useLiveStoreData } from './hooks/useLiveStoreData';

const AboutContactPage = lazy(() =>
  import('./components/AboutContactPage').then((m) => ({ default: m.AboutContactPage })),
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const ProductsPage = lazy(() =>
  import('./components/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const RepairsPage = lazy(() =>
  import('./components/RepairsPage').then((m) => ({ default: m.RepairsPage })),
);
const ShopHud = lazy(() =>
  import('./components/ShopHud').then((m) => ({ default: m.ShopHud })),
);
const ShopInfoDrawer = lazy(() =>
  import('./components/ShopInfoDrawer').then((m) => ({ default: m.ShopInfoDrawer })),
);
const ShopViewport = lazy(() =>
  import('./components/ShopViewport').then((m) => ({ default: m.ShopViewport })),
);

function PageLoader({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 ${
        dark ? 'h-[calc(100dvh-4rem)] bg-[#0A1120] text-white' : 'bg-[#F3ECE6] text-[#141414]'
      }`}
    >
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#EA4E1B]/25 border-t-[#EA4E1B]" />
      <p className="text-xs font-semibold opacity-70">Loading...</p>
    </div>
  );
}

const CART_STORAGE_KEY = 'usman_mobile_cart_v1';

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
}

function loadSavedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is CartItem =>
            item &&
            typeof item.productId === 'string' &&
            typeof item.variant === 'string' &&
            typeof item.quantity === 'number' &&
            item.quantity > 0,
        );
      }
    }
  } catch {
    // Ignore storage read issues
  }
  return [];
}

export default function App() {
  const [activePage, setActivePage] = useState<SitePage>('home');
  const [initialProductCategory, setInitialProductCategory] =
    useState<ProductCategory>('All');
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadSavedCart());
  const [cartOpen, setCartOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState<CatalogProduct | null>(null);
  const [editingAdminProduct, setEditingAdminProduct] = useState<CatalogProduct | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [enteringFromMonitor, setEnteringFromMonitor] = useState(false);
  const [shopRevealUnderlay, setShopRevealUnderlay] = useState(false);
  const [homeEnterPhase, setHomeEnterPhase] = useState<'idle' | 'pre' | 'animating'>(
    'idle',
  );
  const monitorTransitionTimersRef = useRef<number[]>([]);

  const {
    products: liveProducts,
    allProducts: allAdminProducts,
    usedPhones,
    liveReviews,
    hiddenReviewIds,
    reviewsVisible,
    homeSections,
    socialLinks,
    siteImages: liveSiteImages,
    shopGallery: liveShopGallery,
    mediaOverrides,
  } = useLiveStoreData();

  const genuineReviewsList = useMemo(
    () => liveReviews.filter((r) => !hiddenReviewIds.includes(r.id)),
    [liveReviews, hiddenReviewIds],
  );

  const monitorPreview = useMemo(() => {
    const count = genuineReviewsList.length;
    const avg =
      count > 0
        ? (
            genuineReviewsList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) /
            count
          ).toFixed(1)
        : undefined;
    const initials = genuineReviewsList.slice(0, 3).map(
      (r) =>
        r.customerName
          .split(' ')
          .filter(Boolean)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'UM',
    );
    return {
      heroImageUrl: liveSiteImages.heroLifestyle,
      fallbackHeroUrl: SITE_IMAGES.heroLifestyle,
      monitorScreenImg: liveSiteImages.monitorScreen,
      reviewsVisible,
      reviewCount: count,
      reviewAvg: avg,
      reviewInitials: initials,
    };
  }, [liveSiteImages.heroLifestyle, liveSiteImages.monitorScreen, reviewsVisible, genuineReviewsList]);

  // 3D Virtual Shop & Map state (mobile defaults to 3D shop, desktop defaults to full village map)
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    isMobileViewport() ? 'shop' : 'map',
  );
  const [panoTab, setPanoTab] = useState<PanoTab>('interior');
  const [roadDetailsVisible, setRoadDetailsVisible] = useState(true);
  const [editPinMode, setEditPinMode] = useState(false);
  const [shopUv, setShopUv] = useState<[number, number]>(() => loadSavedShopUv());
  const [infoOpen, setInfoOpen] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [shutterOpen, setShutterOpen] = useState(false);
  const [isMap3D, setIsMap3D] = useState(false);
  const [insideShop, setInsideShop] = useState(false);
  const [hoveredItemType, setHoveredItemType] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const enterShopRef = useRef<(() => void) | null>(null);
  const savedScrollYRef = useRef<number | null>(null);
  const pushedModalHistoryRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const restoreSavedScroll = useCallback(() => {
    const savedY = savedScrollYRef.current;
    if (savedY !== null) {
      savedScrollYRef.current = null;
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: 'instant' as ScrollBehavior });
      });
    }
  }, []);

  const handleInspectProduct = useCallback((product: CatalogProduct) => {
    savedScrollYRef.current = window.scrollY;
    try {
      window.history.pushState({ productModalId: product.id }, '');
      pushedModalHistoryRef.current = true;
    } catch {
      // Ignore history push errors in restricted iframes
    }
    setInspectedProduct(product);
  }, []);

  const handleCloseInspectedProduct = useCallback(() => {
    setInspectedProduct(null);
    if (pushedModalHistoryRef.current) {
      pushedModalHistoryRef.current = false;
      try {
        window.history.back();
      } catch {
        // Ignore history back errors
      }
    }
    restoreSavedScroll();
  }, [restoreSavedScroll]);

  useEffect(() => {
    const handlePopState = () => {
      if (pushedModalHistoryRef.current) {
        pushedModalHistoryRef.current = false;
        setInspectedProduct(null);
        restoreSavedScroll();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [restoreSavedScroll]);

  useEffect(() => {
    if (inspectedProduct) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [inspectedProduct]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMapTiltRef = useRef<(() => void) | null>(null);
  const exitShopRef = useRef<(() => void) | null>(null);
  const overlayDomRef = useRef<OverlayDomRefs>({
    pinEl: null,
    roadLabelEls: {},
    shopHotspotEls: {},
    panoHotspotEls: {},
    itemTooltipEl: null,
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage write issues
    }
  }, [cartItems]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCartOpen(false);
        setWhatsAppOpen(false);
        if (inspectedProduct) {
          handleCloseInspectedProduct();
        }
      }
      if (activePage === 'virtual-shop' && (e.key === 'h' || e.key === 'H')) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          setDockCollapsed((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activePage, inspectedProduct, handleCloseInspectedProduct]);

  const totalCartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const clearMonitorTransitionTimers = useCallback(() => {
    monitorTransitionTimersRef.current.forEach((id) => window.clearTimeout(id));
    monitorTransitionTimersRef.current = [];
  }, []);

  const handleNavigate = useCallback((page: SitePage, sectionHash?: string) => {
    setCartOpen(false);
    setWhatsAppOpen(false);
    clearMonitorTransitionTimers();
    setEnteringFromMonitor(false);
    setShopRevealUnderlay(false);
    setHomeEnterPhase('idle');
    if (page === 'products') {
      setInitialProductCategory('All');
    }
    if (page === 'virtual-shop') {
      setEditPinMode(false);
      setSelectedItemType(null);
      if (insideShop) {
        exitShopRef.current?.();
      }
      setViewMode(isMobileViewport() ? 'shop' : 'map');
    }
    setActivePage(page);
    if (sectionHash) {
      window.setTimeout(() => {
        document.getElementById(sectionHash)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [insideShop, clearMonitorTransitionTimers]);

  const handleToggleAdmin = useCallback(() => {
    setCartOpen(false);
    clearMonitorTransitionTimers();
    setEnteringFromMonitor(false);
    setShopRevealUnderlay(false);
    setHomeEnterPhase('idle');
    setActivePage((prev) => (prev === 'admin' ? 'home' : 'admin'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [clearMonitorTransitionTimers]);

  const handleBrowseCategory = useCallback((category: ProductCategory) => {
    setCartOpen(false);
    clearMonitorTransitionTimers();
    setEnteringFromMonitor(false);
    setShopRevealUnderlay(false);
    setHomeEnterPhase('idle');
    setInitialProductCategory(category);
    setActivePage('products');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [clearMonitorTransitionTimers]);

  const handleOpenVirtualShop = useCallback((initialMode: ViewMode) => {
    setCartOpen(false);
    clearMonitorTransitionTimers();
    setEnteringFromMonitor(false);
    setShopRevealUnderlay(false);
    setHomeEnterPhase('idle');
    setEditPinMode(false);
    setSelectedItemType(null);
    const resolvedMode: ViewMode =
      initialMode === 'shop' ? (isMobileViewport() ? 'shop' : 'map') : initialMode;
    setViewMode(resolvedMode);
    if (resolvedMode === 'pano') {
      setPanoTab('interior');
    }
    setActivePage('virtual-shop');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [clearMonitorTransitionTimers]);

  const handleAddToCart = useCallback(
    (product: CatalogProduct, variant?: string, quantity = 1) => {
      const resolvedVariant = variant ?? product.variants[0] ?? 'Standard';
      setCartItems((prev) => {
        const existingIdx = prev.findIndex(
          (i) => i.productId === product.id && i.variant === resolvedVariant,
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: next[existingIdx].quantity + quantity,
          };
          return next;
        }
        return [
          ...prev,
          { productId: product.id, variant: resolvedVariant, quantity },
        ];
      });
    },
    [],
  );

  const handleUpdateCartQty = useCallback(
    (productId: string, variant: string, nextQty: number) => {
      setCartItems((prev) => {
        if (nextQty <= 0) {
          return prev.filter(
            (i) => !(i.productId === productId && i.variant === variant),
          );
        }
        return prev.map((i) =>
          i.productId === productId && i.variant === variant
            ? { ...i, quantity: nextQty }
            : i,
        );
      });
    },
    [],
  );

  const handleRemoveCartItem = useCallback((productId: string, variant: string) => {
    setCartItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variant === variant)),
    );
  }, []);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // 3D Viewport handlers
  const handleModeChange = useCallback(
    (nextMode: ViewMode) => {
      setEditPinMode(false);
      setSelectedItemType(null);
      if (nextMode === viewMode && insideShop) {
        exitShopRef.current?.();
        return;
      }
      setViewMode(nextMode);
      if (nextMode === 'pano') {
        setPanoTab('interior');
      }
    },
    [viewMode, insideShop],
  );

  const handleInsideShopChange = useCallback((inside: boolean) => {
    setInsideShop(inside);
    if (!inside) {
      setSelectedItemType(null);
    }
  }, []);

  const handleProductInspect3D = useCallback((itemType: string) => {
    setSelectedItemType(itemType);
  }, []);

  useEffect(() => {
    return () => {
      clearMonitorTransitionTimers();
    };
  }, [clearMonitorTransitionTimers]);

  const handleStartEnterHomeFromMonitor = useCallback(() => {
    setSelectedItemType(null);
    setHoveredItemType(null);
    setInfoOpen(false);
    setEnteringFromMonitor(true);
  }, []);

  const handleEnterHomeFromMonitor = useCallback(() => {
    clearMonitorTransitionTimers();
    setSelectedItemType(null);
    setHoveredItemType(null);
    setInfoOpen(false);
    setShopRevealUnderlay(true);
    setHomeEnterPhase('pre');
    setInsideShop(false);
    setActivePage('home');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setHomeEnterPhase('animating');
      });
    });

    const cleanupTimer = window.setTimeout(() => {
      setShopRevealUnderlay(false);
      setEnteringFromMonitor(false);
      setHomeEnterPhase('idle');
    }, 480);

    monitorTransitionTimersRef.current = [raf1, raf2, cleanupTimer];
  }, [clearMonitorTransitionTimers]);

  const handleShopUvChange = useCallback((nextUv: [number, number]) => {
    setShopUv(nextUv);
    saveShopUv(nextUv);
    setEditPinMode(false);
  }, []);

  const handleResetPin = useCallback(() => {
    const def: [number, number] = [...SHOP_CONFIG.DEFAULT_SHOP_UV];
    setShopUv(def);
    saveShopUv(def);
  }, []);

  const handleOpenWhatsAppTopic = useCallback((topic: string) => {
    const link = document.createElement('a');
    link.href = getWhatsAppUrl(topic);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }, []);

  const isDefaultPin =
    Math.abs(shopUv[0] - SHOP_CONFIG.DEFAULT_SHOP_UV[0]) < 0.001 &&
    Math.abs(shopUv[1] - SHOP_CONFIG.DEFAULT_SHOP_UV[1]) < 0.001;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F3ECE6] text-[#141414] pb-24 md:pb-0">
      <SiteHeader
        activePage={activePage}
        cartCount={totalCartCount}
        onNavigate={handleNavigate}
        onOpenCart={() => setCartOpen(true)}
      />

      {activePage !== 'virtual-shop' && activePage !== 'admin' && (
        <AdminModeBanner onOpenDashboard={() => handleNavigate('admin')} />
      )}

      {activePage !== 'virtual-shop' && activePage !== 'admin' && (
        <div
          className={
            homeEnterPhase === 'pre'
              ? 'relative z-20 origin-bottom scale-[0.96] opacity-0 transition-all duration-[460ms] ease-[cubic-bezier(0.16,1,0.3,1)]'
              : homeEnterPhase === 'animating'
                ? 'relative z-20 origin-bottom scale-100 opacity-100 transition-all duration-[460ms] ease-[cubic-bezier(0.16,1,0.3,1)]'
                : undefined
          }
        >
          <GlobalSearchBar
            query={globalSearchQuery}
            onQueryChange={setGlobalSearchQuery}
            activePage={activePage}
            products={liveProducts}
            onInspectProduct={handleInspectProduct}
            onQuickAddToCart={(product) => handleAddToCart(product)}
            onNavigate={handleNavigate}
            onAdminEditProduct={setEditingAdminProduct}
          />
        </div>
      )}

      <main className="flex-1">
        {activePage === 'home' && (
          <div
            className={
              homeEnterPhase === 'pre'
                ? 'relative z-20 origin-center scale-[0.95] opacity-0 transition-all duration-[460ms] ease-[cubic-bezier(0.16,1,0.3,1)]'
                : homeEnterPhase === 'animating'
                  ? 'relative z-20 origin-center scale-100 opacity-100 transition-all duration-[460ms] ease-[cubic-bezier(0.16,1,0.3,1)]'
                  : undefined
            }
          >
            <HomePage
              products={liveProducts}
              liveReviews={liveReviews}
              hiddenReviewIds={hiddenReviewIds}
              reviewsVisible={reviewsVisible}
              homeSections={homeSections}
              siteImages={liveSiteImages}
              mediaOverrides={mediaOverrides}
              onNavigate={handleNavigate}
              onBrowseCategory={handleBrowseCategory}
              onOpenVirtualShop={handleOpenVirtualShop}
              onInspectProduct={handleInspectProduct}
              onQuickAddToCart={(product) => handleAddToCart(product)}
              onAdminEditProduct={setEditingAdminProduct}
            />
          </div>
        )}

        {activePage === 'products' && (
          <Suspense fallback={<PageLoader />}>
            <ProductsPage
              products={liveProducts}
              initialCategory={initialProductCategory}
              externalSearchQuery={globalSearchQuery}
              onExternalSearchChange={setGlobalSearchQuery}
              onInspectProduct={handleInspectProduct}
              onQuickAddToCart={(product) => handleAddToCart(product)}
              onOpenVirtualShop={handleOpenVirtualShop}
              onAdminEditProduct={setEditingAdminProduct}
            />
          </Suspense>
        )}

        {activePage === 'repairs' && (
          <Suspense fallback={<PageLoader />}>
            <RepairsPage />
          </Suspense>
        )}

        {activePage === 'about' && (
          <Suspense fallback={<PageLoader />}>
            <AboutContactPage
              siteImages={liveSiteImages}
              shopGallery={liveShopGallery}
              mediaOverrides={mediaOverrides}
              liveReviews={liveReviews}
              hiddenReviewIds={hiddenReviewIds}
              reviewsVisible={reviewsVisible}
              onOpenVirtualShop={handleOpenVirtualShop}
            />
          </Suspense>
        )}

        {activePage === 'admin' && (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboard
              products={allAdminProducts}
              usedPhones={usedPhones}
              liveReviews={liveReviews}
              reviewsVisible={reviewsVisible}
              socialLinks={socialLinks}
              mediaOverrides={mediaOverrides}
              onNavigate={handleNavigate}
            />
          </Suspense>
        )}

        {(activePage === 'virtual-shop' || shopRevealUnderlay) && (
          <Suspense fallback={<PageLoader dark />}>
            <div
              className={
                shopRevealUnderlay
                  ? 'pointer-events-none fixed inset-x-0 top-16 bottom-0 z-10 overflow-hidden bg-[#0A1120] select-none'
                  : 'relative h-[calc(100dvh-4rem)] w-full overflow-hidden overscroll-none bg-[#0A1120] select-none'
              }
            >
              <ShopViewport
                viewMode={viewMode}
                panoTab={panoTab}
                roadDetailsVisible={roadDetailsVisible}
                editPinMode={editPinMode}
                shopUv={shopUv}
                monitorPreview={monitorPreview}
                overlayDomRef={overlayDomRef}
                toggleMapTiltRef={toggleMapTiltRef}
                exitShopRef={exitShopRef}
                enterShopRef={enterShopRef}
                onShopUvChange={handleShopUvChange}
                onModeChange={handleModeChange}
                onHoveredItemChange={setHoveredItemType}
                onItemClick={handleProductInspect3D}
                onShutterOpenChange={setShutterOpen}
                onMap3DChange={setIsMap3D}
                onInsideShopChange={handleInsideShopChange}
                onStartEnterWebsiteFromMonitor={handleStartEnterHomeFromMonitor}
                onEnterWebsiteFromMonitor={handleEnterHomeFromMonitor}
              />

              <div
                className={`transition-opacity duration-200 ${
                  enteringFromMonitor || shopRevealUnderlay
                    ? 'pointer-events-none opacity-0'
                    : 'opacity-100'
                }`}
              >
                <ShopHud
                  viewMode={viewMode}
                  panoTab={panoTab}
                  roadDetailsVisible={roadDetailsVisible}
                  editPinMode={editPinMode}
                  isDefaultPin={isDefaultPin}
                  infoOpen={infoOpen}
                  dockCollapsed={dockCollapsed}
                  shutterOpen={shutterOpen}
                  isMap3D={isMap3D}
                  insideShop={insideShop}
                  hoveredItemType={hoveredItemType}
                  selectedItemType={selectedItemType}
                  overlayDomRef={overlayDomRef}
                  onModeChange={handleModeChange}
                  onPanoTabChange={setPanoTab}
                  onToggleRoads={() => setRoadDetailsVisible((prev) => !prev)}
                  onToggleMapTilt={() => toggleMapTiltRef.current?.()}
                  onExitShop={() => exitShopRef.current?.()}
                  onCloseSelectedItem={() => setSelectedItemType(null)}
                  onToggleEditPin={() => setEditPinMode((prev) => !prev)}
                  onResetPin={handleResetPin}
                  onToggleInfo={() => setInfoOpen((prev) => !prev)}
                  onToggleDock={() => setDockCollapsed((prev) => !prev)}
                  onItemWhatsApp={handleOpenWhatsAppTopic}
                  onAddCatalogProduct={(product) => handleAddToCart(product)}
                  onExitToContact={() => handleNavigate('about', 'contact')}
                />

                <ShopInfoDrawer
                  open={infoOpen}
                  onClose={() => setInfoOpen(false)}
                  onOpenPano={() => handleModeChange('pano')}
                />
              </div>
            </div>
          </Suspense>
        )}
      </main>

      {activePage !== 'virtual-shop' && (
        <div
          className={
            homeEnterPhase === 'pre'
              ? 'relative z-20 opacity-0 transition-opacity duration-[460ms] ease-out'
              : homeEnterPhase === 'animating'
                ? 'relative z-20 opacity-100 transition-opacity duration-[460ms] ease-out'
                : undefined
          }
        >
          <SiteFooter
            socialLinks={socialLinks}
            onNavigate={handleNavigate}
            onBrowseCategory={handleBrowseCategory}
            onToggleAdmin={handleToggleAdmin}
          />
        </div>
      )}

      <MobileBottomNav
        activePage={activePage}
        cartOpen={cartOpen}
        whatsAppOpen={whatsAppOpen}
        cartCount={totalCartCount}
        onNavigate={handleNavigate}
        onOpenCart={() => {
          setWhatsAppOpen(false);
          setCartOpen((prev) => !prev);
        }}
        onOpenWhatsApp={() => {
          setCartOpen(false);
          setWhatsAppOpen((prev) => !prev);
        }}
      />

      <OfflineIndicator />

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        products={liveProducts}
        onClose={() => setCartOpen(false)}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onNavigate={handleNavigate}
      />

      <ProductDetailModal
        product={inspectedProduct}
        liveReviews={liveReviews.filter((r) => !hiddenReviewIds.includes(r.id))}
        cartCount={totalCartCount}
        onClose={handleCloseInspectedProduct}
        onAddToCart={handleAddToCart}
        onOpenCart={() => setCartOpen(true)}
        onOpenVirtualShop={handleOpenVirtualShop}
      />

      <AdminInlineProductModal
        product={editingAdminProduct}
        onClose={() => setEditingAdminProduct(null)}
      />

      <MobileContactSheet
        open={whatsAppOpen}
        onClose={() => setWhatsAppOpen(false)}
        onNavigate={handleNavigate}
      />

      <FloatingWhatsAppButton hidden={activePage === 'virtual-shop'} />

      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed right-4 bottom-[148px] z-40 grid h-11 w-11 place-items-center rounded-full bg-[#EA4E1B] text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[#d44212] hover:shadow-xl active:scale-95 md:right-6 md:bottom-[86px]"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
