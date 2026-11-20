import React, { useRef, useState } from 'react';
import {
  Camera,
  Check,
  Edit3,
  Images,
  LayoutDashboard,
  Link2,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  CatalogProduct,
  PRODUCT_CATEGORIES,
} from '../data/catalogData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SiteMediaSlotKey } from '../hooks/useLiveStoreData';
import { compressImageFileToDataUrl } from '../utils/imageUpload';
import { REMOVED_IMAGE_MARKER, ResilientImage } from './ResilientImage';

/* ============================================================================
 * 1. Slim Admin Mode Bar (visible only when signed in as Admin on storefront)
 * ============================================================================ */
interface AdminModeBannerProps {
  onOpenDashboard: () => void;
}

export const AdminModeBanner: React.FC<AdminModeBannerProps> = ({ onOpenDashboard }) => {
  const { user, isAdmin, signOutAdmin } = useAdminAuth();

  if (!isAdmin) return null;

  return (
    <div className="border-b border-orange-500/20 bg-[#141414] text-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#EA4E1B] text-white">
            <Shield className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="font-bold">Admin Edit Mode Active</span>
          <span className="hidden text-neutral-400 sm:inline">
            · {user?.email} · Edit products, images &amp; manage reviews live
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenDashboard}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#EA4E1B] px-3 py-1 text-[11px] font-bold text-white transition hover:bg-[#d44212]"
          >
            <LayoutDashboard className="h-3 w-3" aria-hidden="true" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            onClick={() => void signOutAdmin()}
            className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold text-neutral-200 transition hover:border-white/50 hover:text-white"
          >
            <LogOut className="h-3 w-3" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. Inline Admin Image Controls (Upload / Paste URL / Delete-Reset)
 * ============================================================================ */
interface AdminImageControlsProps {
  slotKey: SiteMediaSlotKey;
  label: string;
  hasOverride?: boolean;
  onStatus?: (msg: string) => void;
}

export const AdminImageControls: React.FC<AdminImageControlsProps> = ({
  slotKey,
  label,
  hasOverride = false,
  onStatus,
}) => {
  const { isAdmin } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  if (!isAdmin) return null;

  const flash = (msg: string) => {
    setToast(msg);
    onStatus?.(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const handleFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setBusy(true);
      const dataUrl = await compressImageFileToDataUrl(file, 1100, 260_000);
      await setDoc(
        doc(db, 'siteMedia', slotKey),
        {
          slotKey,
          imageUrl: dataUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      flash('Saved live!');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `siteMedia/${slotKey}`);
      } catch {
        // logged
      }
      flash('Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = urlInput.trim();
    if (!clean) return;
    try {
      setBusy(true);
      await setDoc(
        doc(db, 'siteMedia', slotKey),
        {
          slotKey,
          imageUrl: clean,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      setUrlInput('');
      setUrlOpen(false);
      flash('Photo updated!');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `siteMedia/${slotKey}`);
      } catch {
        // logged
      }
      flash('Update failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setBusy(true);
      await setDoc(
        doc(db, 'siteMedia', slotKey),
        {
          slotKey,
          imageUrl: REMOVED_IMAGE_MARKER,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      flash('Deleted!');
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `siteMedia/${slotKey}`);
      } catch {
        // logged
      }
      flash('Delete failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-2.5 right-2.5 z-20 flex flex-col items-end gap-1.5"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFilePicked}
        className="hidden"
      />

      <div className="flex items-center gap-1 rounded-full border border-white/25 bg-[#141414]/88 p-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md">
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          title={`Upload new ${label}`}
          className="inline-flex items-center gap-1 rounded-full bg-[#EA4E1B] px-2.5 py-1 text-white transition hover:bg-[#d44212] disabled:opacity-50"
        >
          <Upload className="h-3 w-3" aria-hidden="true" />
          <span>{busy ? '...' : 'Change'}</span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            setUrlOpen((prev) => !prev);
          }}
          title="Paste image URL"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        >
          <Link2 className="h-3 w-3" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={handleDeleteImage}
          title={hasOverride ? 'Delete this image permanently' : 'Remove photo'}
          className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      {urlOpen && (
        <form
          onSubmit={handleSaveUrl}
          className="flex w-64 items-center gap-1 rounded-xl border border-black/15 bg-white p-1.5 shadow-xl"
        >
          <input
            type="url"
            required
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://... image URL"
            className="h-7 flex-1 rounded-lg bg-neutral-50 px-2 text-xs text-[#141414] focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-7 items-center rounded-lg bg-[#EA4E1B] px-2.5 text-[11px] font-bold text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setUrlOpen(false)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </form>
      )}

      {toast && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
          <Check className="h-3 w-3" />
          {toast}
        </span>
      )}
    </div>
  );
};

/* ============================================================================
 * 3. Inline Product Card Edit Trigger Button (Top-right of every product card)
 * ============================================================================ */
interface AdminProductEditTriggerProps {
  onClick: (e: React.MouseEvent) => void;
}

export const AdminProductEditTrigger: React.FC<AdminProductEditTriggerProps> = ({ onClick }) => {
  const { isAdmin } = useAdminAuth();
  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      title="Edit product details or photo"
      className="absolute top-2 right-2 z-20 inline-flex items-center gap-1 rounded-full border border-white/25 bg-[#141414]/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-md transition hover:bg-[#EA4E1B]"
    >
      <Edit3 className="h-3 w-3" aria-hidden="true" />
      <span>Edit</span>
    </button>
  );
};

/* ============================================================================
 * 4. Inline Product Quick-Edit Modal (saves directly to Firestore `products`)
 * ============================================================================ */
interface AdminInlineProductModalProps {
  product: CatalogProduct | null;
  onClose: () => void;
}

const DEFAULT_CATS = PRODUCT_CATEGORIES.filter((c) => c !== 'All');

export const AdminInlineProductModal: React.FC<AdminInlineProductModalProps> = ({
  product,
  onClose,
}) => {
  const { isAdmin } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const galleryFileRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Charging');
  const [pricePkr, setPricePkr] = useState(String(product?.pricePkr ?? 0));
  const [originalPricePkr, setOriginalPricePkr] = useState(
    String(product?.originalPricePkr ?? Math.round((product?.pricePkr ?? 0) * 1.25)),
  );
  const [inStock, setInStock] = useState((product?.status || 'In Stock') !== 'Out of Stock');
  const [specs, setSpecs] = useState(product?.specs || '');
  const [description, setDescription] = useState(product?.description || '');
  const [variantsText, setVariantsText] = useState((product?.variants || ['Standard']).join(', '));
  const [image, setImage] = useState(product?.image || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.galleryImages || []);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep fields synced whenever product changes
  React.useEffect(() => {
    if (!product) return;
    setName(product.name);
    setCategory(product.category);
    setPricePkr(String(product.pricePkr));
    setOriginalPricePkr(
      String(product.originalPricePkr ?? Math.round(product.pricePkr * 1.25)),
    );
    setInStock((product.status || 'In Stock') !== 'Out of Stock');
    setSpecs(product.specs);
    setDescription(product.description);
    setVariantsText((product.variants || ['Standard']).join(', '));
    setImage(product.image);
    setGalleryImages(Array.isArray(product.galleryImages) ? product.galleryImages.slice(0, 5) : []);
    setGalleryUrlInput('');
    setConfirmDelete(false);
    setErrorMsg(null);
  }, [product]);

  if (!product || !isAdmin) return null;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      const dataUrl = await compressImageFileToDataUrl(file, 900, 240_000);
      setImage(dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process image.');
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const remaining = Math.max(0, 5 - galleryImages.length);
    if (remaining === 0) {
      setErrorMsg('You can add up to 5 extra gallery photos per product.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      const selected = files.slice(0, remaining);
      const uploaded: string[] = [];
      for (const file of selected) {
        const dataUrl = await compressImageFileToDataUrl(file, 800, 115_000);
        uploaded.push(dataUrl);
      }
      setGalleryImages((prev) => [...prev, ...uploaded].slice(0, 5));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process gallery image.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGalleryUrl = () => {
    const clean = galleryUrlInput.trim();
    if (!clean) return;
    if (galleryImages.length >= 5) {
      setErrorMsg('Maximum 5 extra gallery photos allowed per product.');
      return;
    }
    setGalleryImages((prev) => [...prev, clean].slice(0, 5));
    setGalleryUrlInput('');
    setErrorMsg(null);
  };

  const handleMakeGalleryPhotoDisplay = (idx: number) => {
    const picked = galleryImages[idx];
    if (!picked) return;
    const prevDisplay = image.trim();
    setImage(picked);
    setGalleryImages((prev) => {
      const next = [...prev];
      if (prevDisplay) {
        next[idx] = prevDisplay;
      } else {
        next.splice(idx, 1);
      }
      return next.slice(0, 5);
    });
  };

  const handleRemoveGalleryPhoto = (idx: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMsg('Product name is required.');
      return;
    }

    const numPrice = Math.max(0, Number(pricePkr) || 0);
    const numOrig = Math.max(numPrice, Number(originalPricePkr) || Math.round(numPrice * 1.25));
    const discountPercent =
      numOrig > numPrice ? Math.min(99, Math.round(((numOrig - numPrice) / numOrig) * 100)) : 0;
    const parsedVariants = variantsText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 10);

    try {
      setSaving(true);
      setErrorMsg(null);

      const cleanGallery = galleryImages
        .map((u) => u.trim())
        .filter((u) => u.length > 0 && u.length <= 200_000)
        .slice(0, 5);

      await setDoc(
        doc(db, 'products', product.id),
        {
          sku: product.sku,
          shopItemKey: product.shopItemKey,
          name: cleanName.slice(0, 100),
          category: (category.trim() || 'Charging').slice(0, 50),
          pricePkr: numPrice,
          originalPricePkr: numOrig,
          discountPercent,
          rating: product.rating || '',
          reviewsCount: product.reviewsCount ?? 0,
          soldCount: product.soldCount || '',
          status: inStock ? 'In Stock' : 'Out of Stock',
          inStock,
          hidden: false,
          deleted: false,
          featured: product.featured ?? true,
          specs: specs.trim().slice(0, 240),
          description: description.trim().slice(0, 1000),
          warrantyNote: product.warrantyNote || 'Live check at counter',
          image: image.trim(),
          galleryImages: cleanGallery,
          variants: parsedVariants.length > 0 ? parsedVariants : ['Standard'],
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
      } catch {
        // logged
      }
      setErrorMsg('Could not save changes to backend. Make sure you are signed in as admin.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      setSaving(true);
      await setDoc(
        doc(db, 'products', product.id),
        {
          name: product.name,
          category: product.category,
          pricePkr: product.pricePkr,
          inStock: false,
          deleted: true,
          hidden: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `products/${product.id}`);
      } catch {
        // logged
      }
      setErrorMsg('Failed to delete product.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPhoto = () => {
    setImage('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-center justify-between border-b border-black/8 pb-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#EA4E1B]/12 text-[#EA4E1B]">
              <Edit3 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold text-[#141414]">
                Quick Edit Product
              </h2>
              <p className="text-[11px] text-neutral-500">
                Changes save live to Firebase backend instantly
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* Display Photo (Main Card Image) */}
          <div className="space-y-2.5 rounded-2xl border border-black/8 bg-[#FAF5F0] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#141414]">
                <Star className="h-3.5 w-3.5 fill-[#EA4E1B] text-[#EA4E1B]" />
                <span>Display Photo (Main Card Image)</span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-500">
                Shown on Home &amp; Products grid
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                {image ? (
                  <ResilientImage src={image} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-neutral-300">
                    <Camera className="h-7 w-7" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#141414] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#EA4E1B]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Display Pic</span>
                  </button>
                  {image && (
                    <button
                      type="button"
                      onClick={handleResetPhoto}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={image.startsWith('data:') ? '' : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Or paste display photo URL here..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-[#141414] focus:border-[#EA4E1B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Additional Product Gallery Photos (Products Only — up to 5) */}
          <div className="space-y-3 rounded-2xl border border-black/8 bg-neutral-50/90 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Images className="h-3.5 w-3.5 text-[#EA4E1B]" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#141414]">
                  More Product Photos ({galleryImages.length}/5)
                </span>
              </div>

              <div>
                <input
                  ref={galleryFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={saving || galleryImages.length >= 5}
                  onClick={() => galleryFileRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-full bg-[#EA4E1B] px-3 py-1 text-[11px] font-bold text-white transition hover:bg-[#d44212] disabled:opacity-45"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Photos</span>
                </button>
              </div>
            </div>

            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {galleryImages.map((imgUrl, idx) => (
                  <div
                    key={`inline-gallery-${idx}`}
                    className="group relative overflow-hidden rounded-xl border border-black/10 bg-white"
                  >
                    <div className="aspect-square w-full overflow-hidden">
                      <ResilientImage
                        src={imgUrl}
                        alt={`Gallery photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryPhoto(idx)}
                      aria-label={`Remove photo ${idx + 1}`}
                      className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/75 text-white hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMakeGalleryPhotoDisplay(idx)}
                      title="Make this the Display Photo"
                      className="block w-full border-t border-black/8 bg-white px-1 py-1 text-center text-[10px] font-bold text-[#141414] transition hover:bg-[#EA4E1B] hover:text-white"
                    >
                      Set Display
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500">
                Upload extra angles or color photos here. Customers can swipe through all photos
                when opening this product.
              </p>
            )}

            {galleryImages.length < 5 && (
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={galleryUrlInput}
                  onChange={(e) => setGalleryUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGalleryUrl();
                    }
                  }}
                  placeholder="Or paste extra photo URL..."
                  className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs text-[#141414] focus:border-[#EA4E1B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="shrink-0 rounded-xl border border-black/15 bg-white px-3 py-1.5 text-[11px] font-bold text-[#141414] hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
                >
                  + Add
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-neutral-700">Product Name *</label>
              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-semibold text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">Sale Price (Rs.) *</label>
              <input
                type="number"
                required
                min={0}
                value={pricePkr}
                onChange={(e) => setPricePkr(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-bold text-[#EA4E1B] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Original Price (Rs.)
              </label>
              <input
                type="number"
                min={0}
                value={originalPricePkr}
                onChange={(e) => setOriginalPricePkr(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              >
                {Array.from(new Set([...DEFAULT_CATS, category])).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-neutral-700">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="h-4 w-4 accent-[#EA4E1B]"
                />
                <span>{inStock ? 'In Stock (Available)' : 'Out of Stock'}</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-neutral-700">Short Specs</label>
              <input
                type="text"
                maxLength={240}
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-neutral-700">
                Variants (comma separated)
              </label>
              <input
                type="text"
                value={variantsText}
                onChange={(e) => setVariantsText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-neutral-700">Description</label>
              <textarea
                rows={2}
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/8 pt-4">
            {!confirmDelete ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Product</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDeleteProduct}
                  className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs font-semibold text-neutral-600"
                >
                  Cancel
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#EA4E1B] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#d44212] disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
