import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Crop,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  CatalogProduct,
  formatPkr,
  sanitizeImageForFirestore,
} from '../data/catalogData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  HomeSectionsConfig,
  SiteMediaSlotKey,
} from '../hooks/useLiveStoreData';
import { readFileAsDataUrl } from '../utils/imageUpload';
import { ImageCropperModal } from './ImageCropperModal';
import { ResilientImage } from './ResilientImage';

/* ============================================================================
 * 1. Admin Home Section Product Picker Modal (Trending / Featured / New Arrival)
 * ============================================================================ */
export type HomeSectionKey = 'trendingIds' | 'featuredIds' | 'newArrivalIds';

interface AdminHomeSectionPickerModalProps {
  sectionKey: HomeSectionKey | null;
  sectionTitle: string;
  allProducts: CatalogProduct[];
  homeSections: HomeSectionsConfig;
  onClose: () => void;
}

export const AdminHomeSectionPickerModal: React.FC<AdminHomeSectionPickerModalProps> = ({
  sectionKey,
  sectionTitle,
  allProducts,
  homeSections,
  onClose,
}) => {
  const { isAdmin } = useAdminAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!sectionKey) return;
    setSelectedIds(homeSections[sectionKey] || []);
    setSearch('');
    setErrorMsg(null);
  }, [sectionKey, homeSections]);

  const productById = useMemo(() => {
    const map = new Map<string, CatalogProduct>();
    allProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [allProducts, search]);

  if (!sectionKey || !isAdmin) return null;

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 24) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      await setDoc(
        doc(db, 'siteSettings', 'homeSections'),
        {
          [sectionKey]: selectedIds.slice(0, 24),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'siteSettings/homeSections');
      } catch {
        // logged
      }
      setErrorMsg('Could not save changes to backend. Make sure you are signed in as admin.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      await setDoc(
        doc(db, 'siteSettings', 'homeSections'),
        {
          [sectionKey]: [],
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'siteSettings/homeSections');
      } catch {
        // logged
      }
      setErrorMsg('Could not reset section.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Manage ${sectionTitle}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/8 bg-[#FAF5F0] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EA4E1B] text-white">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display text-base font-extrabold text-[#141414]">
                Add Listed Products to {sectionTitle}
              </h3>
              <p className="text-[11px] text-neutral-500">
                Select products from your store catalog · Saved live to Firebase
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => !saving && onClose()}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-black/6 text-neutral-700 hover:bg-black/12"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Selected Products Chips */}
          <div className="rounded-2xl border border-black/8 bg-[#FAF8F6] p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#141414]">
                Selected in {sectionTitle} ({selectedIds.length})
              </span>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setSelectedIds([])}
                  className="text-[11px] font-bold text-red-600 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {selectedIds.length === 0 ? (
              <p className="mt-1.5 text-[11px] text-neutral-500">
                No custom products selected yet — currently showing automatic default products. Tap{' '}
                <strong>+ Add</strong> on any product below to feature it here!
              </p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {selectedIds.map((id) => {
                  const p = productById.get(id);
                  if (!p) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#EA4E1B]/30 bg-white py-1 pr-2 pl-2.5 text-[11px] font-bold text-[#141414]"
                    >
                      <span className="max-w-[160px] truncate">{p.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleProduct(id)}
                        aria-label={`Remove ${p.name}`}
                        className="grid h-4 w-4 place-items-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Catalog */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search listed products by name or category..."
              className="h-10 w-full rounded-xl border border-black/12 bg-[#FAF8F6] pr-3.5 pl-10 text-xs font-medium text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
            />
          </div>

          {/* All Listed Products */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {filteredProducts.map((product) => {
              const isSelected = selectedIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-2.5 transition ${
                    isSelected
                      ? 'border-[#EA4E1B] bg-orange-50/50 shadow-2xs'
                      : 'border-black/8 bg-white hover:border-black/20'
                  }`}
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F3ECE6]">
                    <ResilientImage
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#141414]">{product.name}</p>
                    <p className="mt-0.5 text-[11px] font-extrabold tabular-nums text-[#EA4E1B]">
                      {formatPkr(product.pricePkr)}
                    </p>
                    <p className="truncate text-[10px] text-neutral-500">{product.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProduct(product.id);
                    }}
                    className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-bold transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white hover:bg-red-600'
                        : 'bg-[#141414] text-white hover:bg-[#EA4E1B]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-3 w-3" aria-hidden="true" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" aria-hidden="true" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/8 bg-[#FAF8F6] px-5 py-3.5">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleResetDefault()}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-black/15 bg-white px-4 text-xs font-semibold text-neutral-700 hover:border-[#EA4E1B] hover:text-[#EA4E1B] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Use Default Order</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-10 rounded-full border border-black/15 bg-white px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#EA4E1B] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d44212] disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * 2. Admin Showcase Card Editor Modal (Home Category Cards: Name + Caption + Photo)
 * ============================================================================ */
export interface EditableShowcaseCard {
  slotKey: SiteMediaSlotKey;
  defaultTitle: string;
  currentTitle: string;
  defaultCaption?: string;
  currentCaption?: string;
  currentImage: string;
  defaultImage: string;
  aspectClass: 'aspect-[4/3]' | 'aspect-[16/9]' | 'aspect-[16/10]';
  hasOverride: boolean;
  showCaptionField?: boolean;
}

interface AdminShowcaseCardModalProps {
  card: EditableShowcaseCard | null;
  onClose: () => void;
}

export const AdminShowcaseCardModal: React.FC<AdminShowcaseCardModalProps> = ({
  card,
  onClose,
}) => {
  const { isAdmin } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState('');
  const [pastedUrl, setPastedUrl] = useState('');
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!card) return;
    setTitle(card.currentTitle);
    setCaption(card.currentCaption || '');
    setPreviewImage(card.currentImage);
    setCustomImageUrl(card.currentImage !== card.defaultImage ? card.currentImage : null);
    setPastedUrl('');
    setCropSource(null);
    setErrorMsg(null);
  }, [card]);

  if (!card || !isAdmin) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setErrorMsg(null);
      const rawUrl = await readFileAsDataUrl(file);
      setCropSource(rawUrl);
    } catch {
      setErrorMsg('Could not read selected photo. Try another image.');
    }
  };

  const handleApplyUrl = () => {
    const clean = pastedUrl.trim();
    if (!clean) return;
    setCustomImageUrl(clean);
    setPreviewImage(clean);
    setPastedUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim().slice(0, 120);
    if (!cleanTitle) {
      setErrorMsg('Please enter a card title/name.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      const payload: Record<string, string> = {
        slotKey: card.slotKey,
        title: cleanTitle,
        updatedAt: new Date().toISOString(),
      };
      if (card.showCaptionField) {
        payload.caption = caption.trim().slice(0, 300);
      }
      if (customImageUrl) {
        const sanitized = sanitizeImageForFirestore(customImageUrl, card.defaultImage);
        payload.imageUrl = sanitized ?? '';
      } else {
        payload.imageUrl = '';
      }

      await setDoc(doc(db, 'siteMedia', card.slotKey), payload, { merge: true });
      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `siteMedia/${card.slotKey}`);
      } catch {
        // logged
      }
      setErrorMsg('Could not save changes to backend.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      await deleteDoc(doc(db, 'siteMedia', card.slotKey));
      onClose();
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `siteMedia/${card.slotKey}`);
      } catch {
        // logged
      }
      setErrorMsg('Could not reset card to default.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Home Showcase Card"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/8 bg-[#FAF5F0] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EA4E1B] text-white">
              <Edit3 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display text-base font-extrabold text-[#141414]">
                Edit Home Card Name &amp; Photo
              </h3>
              <p className="text-[11px] text-neutral-500">
                Exact frame size &amp; placement stay locked automatically
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-black/6 text-neutral-700 hover:bg-black/12"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 space-y-4 overflow-y-auto p-5">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          <ImageCropperModal
            imageSrc={cropSource}
            maxDimension={1100}
            maxBytes={220_000}
            onCancel={() => setCropSource(null)}
            onApply={(croppedUrl) => {
              setCustomImageUrl(croppedUrl);
              setPreviewImage(croppedUrl);
              setCropSource(null);
            }}
          />

          {/* Live Fit Photo Preview */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700">
              Photo Preview (Fits Image Size Automatically)
            </label>
            <div className="mt-1.5 relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-[#F8F6F4]">
              <ResilientImage
                src={previewImage || card.defaultImage}
                alt={title || card.defaultTitle}
                className="block max-h-60 w-full h-auto object-contain"
              />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={saving}
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#141414] px-4 text-xs font-bold text-white transition hover:bg-[#EA4E1B] disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Upload &amp; Crop Photo</span>
              </button>

              {(previewImage || card.defaultImage) && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setCropSource(previewImage || card.defaultImage)}
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-[#EA4E1B] bg-white px-3.5 text-xs font-bold text-[#EA4E1B] transition hover:bg-[#EA4E1B] hover:text-white"
                >
                  <Crop className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Crop</span>
                </button>
              )}

              {customImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomImageUrl(null);
                    setPreviewImage(card.defaultImage);
                  }}
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-black/15 bg-white px-3.5 text-xs font-semibold text-neutral-700 hover:border-red-300 hover:text-red-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset Photo</span>
                </button>
              )}
            </div>

            {/* Optional Paste URL */}
            <div className="mt-2 flex items-center gap-1.5">
              <input
                type="url"
                value={pastedUrl}
                onChange={(e) => setPastedUrl(e.target.value)}
                placeholder="Or paste direct image URL (https://...)"
                className="h-9 flex-1 rounded-xl border border-black/12 bg-[#FAF8F6] px-3 text-xs text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="h-9 rounded-xl bg-neutral-200 px-3 text-xs font-bold text-[#141414] hover:bg-neutral-300"
              >
                Use URL
              </button>
            </div>
          </div>

          {/* Card Title / Name */}
          <div>
            <label
              htmlFor="showcase-card-title"
              className="block text-[11px] font-bold text-neutral-700"
            >
              Card Name / Heading *
            </label>
            <input
              id="showcase-card-title"
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={card.defaultTitle}
              className="mt-1.5 h-11 w-full rounded-xl border border-black/15 bg-[#FAF8F6] px-3.5 text-sm font-semibold text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Optional Description */}
          {card.showCaptionField && (
            <div>
              <label
                htmlFor="showcase-card-caption"
                className="block text-[11px] font-bold text-neutral-700"
              >
                Description
              </label>
              <textarea
                id="showcase-card-caption"
                rows={3}
                maxLength={300}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={card.defaultCaption}
                className="mt-1.5 w-full rounded-xl border border-black/15 bg-[#FAF8F6] p-3 text-xs leading-relaxed text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/8 pt-4">
            {card.hasOverride ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleResetAll()}
                className="inline-flex h-10 items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset Default</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="h-10 rounded-full border border-black/15 bg-white px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#EA4E1B] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d44212] disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save Live'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
