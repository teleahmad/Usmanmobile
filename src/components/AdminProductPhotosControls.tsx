import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  Crop,
  Edit3,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Images,
  Plus,
  RotateCcw,
  Save,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { formatPkr, PRODUCT_CATEGORIES } from '../data/catalogData';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  LiveCatalogProduct,
  SITE_MEDIA_SLOTS,
  SiteMediaOverride,
  SiteMediaSlotConfig,
} from '../hooks/useLiveStoreData';
import { compressImageFileToDataUrl, readFileAsDataUrl } from '../utils/imageUpload';
import { ImageCropperModal } from './ImageCropperModal';
import { ResilientImage } from './ResilientImage';

interface FeedbackSetter {
  (msg: { text: string; type: 'success' | 'error' } | null): void;
}

interface AdminProductsManagerProps {
  products: LiveCatalogProduct[];
  setFeedbackMsg: FeedbackSetter;
}

interface ProductFormState {
  id: string;
  isNew: boolean;
  sku: string;
  shopItemKey: string;
  name: string;
  category: string;
  pricePkr: string;
  originalPricePkr: string;
  discountPercent: string;
  rating: string;
  reviewsCount: string;
  soldCount: string;
  status: string;
  inStock: boolean;
  hidden: boolean;
  featured: boolean;
  specs: string;
  description: string;
  warrantyNote: string;
  variantsText: string;
  image: string;
  galleryImages: string[];
}

const DEFAULT_CATEGORIES: string[] = PRODUCT_CATEGORIES.filter((c) => c !== 'All');
const ADD_CATEGORY_SENTINEL = '__add_new_category__';

function buildEmptyForm(): ProductFormState {
  return {
    id: `custom-${Date.now()}`,
    isNew: true,
    sku: `UM-${String(Date.now()).slice(-4)}`,
    shopItemKey: 'Accessory',
    name: '',
    category: 'Charging',
    pricePkr: '1000',
    originalPricePkr: '1400',
    discountPercent: '29',
    rating: '',
    reviewsCount: '',
    soldCount: '',
    status: 'In Stock',
    inStock: true,
    hidden: false,
    featured: true,
    specs: 'Original Quality · Live Checked at Counter',
    description:
      'Available at Usman Mobile Repairing Centre, Hussain Khan Wala. Tested live before handover.',
    warrantyNote: '7-day replacement check',
    variantsText: 'Standard',
    image: '',
    galleryImages: [],
  };
}

function formFromProduct(p: LiveCatalogProduct): ProductFormState {
  return {
    id: p.id,
    isNew: false,
    sku: p.sku,
    shopItemKey: p.shopItemKey,
    name: p.name,
    category: p.category,
    pricePkr: String(p.pricePkr),
    originalPricePkr: String(p.originalPricePkr ?? Math.round(p.pricePkr * 1.25)),
    discountPercent: String(p.discountPercent ?? 20),
    rating: p.rating || '',
    reviewsCount: p.reviewsCount && p.reviewsCount > 0 ? String(p.reviewsCount) : '',
    soldCount: p.soldCount || '',
    status: p.status,
    inStock: p.inStock !== false,
    hidden: Boolean(p.hidden),
    featured: Boolean(p.featured),
    specs: p.specs,
    description: p.description,
    warrantyNote: p.warrantyNote,
    variantsText: (p.variants || ['Standard']).join(', '),
    image: p.image,
    galleryImages: Array.isArray(p.galleryImages) ? p.galleryImages.slice(0, 5) : [],
  };
}

export const AdminProductsManager: React.FC<AdminProductsManagerProps> = ({
  products,
  setFeedbackMsg,
}) => {
  const [search, setSearch] = useState('');
  const [editingForm, setEditingForm] = useState<ProductFormState>(() => buildEmptyForm());
  const [saving, setSaving] = useState(false);

  // Custom Category Creator state
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryDraft, setNewCategoryDraft] = useState('');

  // Free-form Cropper state
  const [cropSource, setCropSource] = useState<string | null>(null);

  // Additional gallery photos state (products only)
  const [galleryUrlDraft, setGalleryUrlDraft] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // In-app Delete confirmation modal state
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<LiveCatalogProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    products.forEach((p) => {
      if (p.category?.trim()) set.add(p.category.trim());
    });
    customCategories.forEach((c) => {
      if (c.trim()) set.add(c.trim());
    });
    if (editingForm.category?.trim()) {
      set.add(editingForm.category.trim());
    }
    return Array.from(set);
  }, [products, customCategories, editingForm.category]);

  const filtered = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const scrollToEditor = () => {
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        nameInputRef.current?.focus();
      }, 320);
    });
  };

  const handleStartEdit = (product: LiveCatalogProduct) => {
    setAddingCategory(false);
    setNewCategoryDraft('');
    setGalleryUrlDraft('');
    setEditingForm(formFromProduct(product));
    setFeedbackMsg({
      text: `Loaded "${product.name}" for editing — update fields below and click Save Product Live.`,
      type: 'success',
    });
    scrollToEditor();
  };

  const handleStartNewProduct = () => {
    setAddingCategory(false);
    setNewCategoryDraft('');
    setGalleryUrlDraft('');
    setEditingForm(buildEmptyForm());
    scrollToEditor();
  };

  const handleConfirmNewCategory = () => {
    const clean = newCategoryDraft.trim().slice(0, 50);
    if (!clean) {
      setFeedbackMsg({ text: 'Please type a category name first.', type: 'error' });
      return;
    }
    setCustomCategories((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setEditingForm((prev) => ({ ...prev, category: clean }));
    setNewCategoryDraft('');
    setAddingCategory(false);
    setFeedbackMsg({
      text: `Category "${clean}" added! Save the product to publish it to the store.`,
      type: 'success',
    });
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedbackMsg(null);
    try {
      const rawUrl = await readFileAsDataUrl(file);
      setCropSource(rawUrl);
    } catch (err) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : 'Failed to open image for cropping.',
        type: 'error',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const remaining = Math.max(0, 5 - editingForm.galleryImages.length);
    if (remaining === 0) {
      setFeedbackMsg({
        text: 'Maximum 5 extra gallery photos allowed per product.',
        type: 'error',
      });
      return;
    }

    setUploadingGallery(true);
    setFeedbackMsg(null);
    try {
      const selected = files.slice(0, remaining);
      const compressed: string[] = [];
      for (const file of selected) {
        const dataUrl = await compressImageFileToDataUrl(file, 800, 115_000);
        compressed.push(dataUrl);
      }
      setEditingForm((prev) => ({
        ...prev,
        galleryImages: [...prev.galleryImages, ...compressed].slice(0, 5),
      }));
      setFeedbackMsg({
        text: `Added ${compressed.length} gallery photo${compressed.length > 1 ? 's' : ''}! Click Save Product Live to publish.`,
        type: 'success',
      });
    } catch (err) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : 'Failed to upload gallery photos.',
        type: 'error',
      });
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleAddGalleryUrl = () => {
    const clean = galleryUrlDraft.trim();
    if (!clean) return;
    if (editingForm.galleryImages.length >= 5) {
      setFeedbackMsg({
        text: 'Maximum 5 extra gallery photos allowed per product.',
        type: 'error',
      });
      return;
    }
    setEditingForm((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, clean].slice(0, 5),
    }));
    setGalleryUrlDraft('');
  };

  const handleSetGalleryAsDisplay = (index: number) => {
    setEditingForm((prev) => {
      const picked = prev.galleryImages[index];
      if (!picked) return prev;
      const nextGallery = [...prev.galleryImages];
      const currentDisplay = prev.image.trim();
      if (currentDisplay) {
        nextGallery[index] = currentDisplay;
      } else {
        nextGallery.splice(index, 1);
      }
      return {
        ...prev,
        image: picked,
        galleryImages: nextGallery.slice(0, 5),
      };
    });
    setFeedbackMsg({
      text: 'Display photo updated! Save the product to publish.',
      type: 'success',
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    setEditingForm((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = editingForm.name.trim().slice(0, 100);
    const cleanCategory = editingForm.category.trim().slice(0, 50) || 'Charging';
    const priceNum = Math.max(0, Number(editingForm.pricePkr) || 0);
    const origNum = Math.max(priceNum, Number(editingForm.originalPricePkr) || priceNum);
    const calcDiscount =
      origNum > priceNum
        ? Math.min(99, Math.round(((origNum - priceNum) / origNum) * 100))
        : Math.max(0, Math.min(99, Number(editingForm.discountPercent) || 0));

    if (!cleanName) {
      setFeedbackMsg({ text: 'Product name is required.', type: 'error' });
      return;
    }

    const variants = editingForm.variantsText
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 10);

    const safeId = editingForm.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);

    const cleanGallery = editingForm.galleryImages
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .slice(0, 5);

    if (cleanGallery.some((u) => u.length > 200_000)) {
      setFeedbackMsg({
        text: 'One of the gallery photos is too large. Please remove and re-upload it.',
        type: 'error',
      });
      return;
    }

    const payload: Record<string, unknown> = {
      sku: editingForm.sku.trim().slice(0, 40) || `UM-${safeId.slice(0, 6).toUpperCase()}`,
      shopItemKey: editingForm.shopItemKey.trim().slice(0, 60) || cleanName.slice(0, 60),
      name: cleanName,
      category: cleanCategory,
      pricePkr: priceNum,
      originalPricePkr: origNum,
      discountPercent: calcDiscount,
      rating: editingForm.rating.trim().slice(0, 10),
      reviewsCount: Math.max(0, Number(editingForm.reviewsCount) || 0),
      soldCount: editingForm.soldCount.trim().slice(0, 30),
      status:
        editingForm.status.trim().slice(0, 40) ||
        (editingForm.inStock ? 'In Stock' : 'Out of Stock'),
      inStock: editingForm.inStock,
      hidden: editingForm.hidden,
      featured: editingForm.featured,
      specs: editingForm.specs.trim().slice(0, 240),
      description: editingForm.description.trim().slice(0, 1000),
      warrantyNote: editingForm.warrantyNote.trim().slice(0, 120),
      variants: variants.length > 0 ? variants : ['Standard'],
      galleryImages: cleanGallery,
      updatedAt: new Date().toISOString(),
    };

    if (editingForm.image.trim()) {
      if (editingForm.image.length > 350_000) {
        setFeedbackMsg({
          text: 'Image size is too large for database storage. Please upload or crop a smaller photo.',
          type: 'error',
        });
        return;
      }
      payload.image = editingForm.image.trim();
    }

    if (editingForm.isNew) {
      payload.createdAt = new Date().toISOString();
    }

    setSaving(true);
    setFeedbackMsg(null);
    try {
      await setDoc(doc(db, 'products', safeId), payload, { merge: true });
      setFeedbackMsg({
        text: editingForm.isNew
          ? `New product "${cleanName}" added and live on website!`
          : `Product "${cleanName}" updated live on website!`,
        type: 'success',
      });
      setEditingForm(buildEmptyForm());
      setAddingCategory(false);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `products/${safeId}`);
      } catch {
        setFeedbackMsg({
          text: 'Could not save product. Ensure you are signed in as the authorized admin.',
          type: 'error',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHidden = async (product: LiveCatalogProduct) => {
    const nextHidden = !product.hidden;
    try {
      await setDoc(
        doc(db, 'products', product.id),
        {
          name: product.name.slice(0, 100),
          category: product.category.slice(0, 50),
          pricePkr: product.pricePkr,
          inStock: product.inStock !== false,
          hidden: nextHidden,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      setFeedbackMsg({
        text: nextHidden
          ? `"${product.name}" hidden from customers.`
          : `"${product.name}" is now visible to customers.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ text: 'Failed to update product visibility.', type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteProduct || deleting) return;
    const product = pendingDeleteProduct;
    setDeleting(true);
    setFeedbackMsg(null);

    try {
      if (product.isCustom) {
        await deleteDoc(doc(db, 'products', product.id));
      } else {
        await setDoc(
          doc(db, 'products', product.id),
          {
            name: product.name.slice(0, 100),
            category: product.category.slice(0, 50),
            pricePkr: product.pricePkr,
            inStock: false,
            hidden: true,
            deleted: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }

      if (!editingForm.isNew && editingForm.id === product.id) {
        setEditingForm(buildEmptyForm());
      }
      setPendingDeleteProduct(null);
      setFeedbackMsg({
        text: `Deleted "${product.name}" permanently from the store.`,
        type: 'success',
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.DELETE, `products/${product.id}`);
      } catch {
        setFeedbackMsg({
          text: 'Could not delete product. Ensure you are signed in as the authorized admin.',
          type: 'error',
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Warning Modal */}
      {pendingDeleteProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-title"
          onClick={() => {
            if (!deleting) setPendingDeleteProduct(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h4
                  id="delete-product-title"
                  className="font-display text-base font-extrabold text-[#141414]"
                >
                  Are you sure you want to delete?
                </h4>
                <p className="mt-1 text-xs text-neutral-600">
                  This will permanently remove{' '}
                  <span className="font-bold text-[#141414]">
                    &ldquo;{pendingDeleteProduct.name}&rdquo;
                  </span>{' '}
                  from your store and admin catalog.
                </p>
                <p className="mt-1 text-xs font-medium text-neutral-500" dir="rtl">
                  کیا آپ واقعی اس پروڈکٹ کو ڈیلیٹ کرنا چاہتے ہیں؟
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F8F6F4] p-3 border border-black/5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                <ResilientImage
                  src={pendingDeleteProduct.image}
                  alt={pendingDeleteProduct.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#141414] truncate">
                  {pendingDeleteProduct.name}
                </p>
                <p className="text-[11px] font-bold text-[#EA4E1B]">
                  {formatPkr(pendingDeleteProduct.pricePkr)} · {pendingDeleteProduct.category}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDeleteProduct(null)}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
              >
                No, Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{deleting ? 'Deleting...' : 'Yes, Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Free-Form Cropper Modal */}
      <ImageCropperModal
        imageSrc={cropSource}
        maxDimension={860}
        maxBytes={230_000}
        onCancel={() => setCropSource(null)}
        onApply={(croppedUrl) => {
          setEditingForm((prev) => ({ ...prev, image: croppedUrl }));
          setCropSource(null);
          setFeedbackMsg({ text: 'Photo cropped and ready to save!', type: 'success' });
        }}
      />

      {/* Add / Edit Product Form */}
      <div
        ref={editorRef}
        className={`scroll-mt-20 rounded-3xl border-2 bg-white p-5 sm:p-7 shadow-md transition-colors ${
          editingForm.isNew ? 'border-[#EA4E1B]/40' : 'border-[#141414]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-extrabold text-[#141414]">
                {editingForm.isNew
                  ? 'Add New Product (نیا پروڈکٹ شامل کریں)'
                  : `Editing Product: ${editingForm.name}`}
              </h3>
              {!editingForm.isNew && (
                <span className="rounded-full bg-[#EA4E1B] px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
                  Edit Mode
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Changes save to Firestore and update live for all website visitors immediately.
            </p>
          </div>
          {!editingForm.isNew && (
            <button
              type="button"
              onClick={handleStartNewProduct}
              aria-label="Switch to Add New Product"
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-200 hover:text-[#141414]"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel Edit / New Product</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveProduct} className="mt-5 space-y-5">
          {/* Display Photo (Main Card Image) + Free-Form Crop Row */}
          <div className="space-y-3 rounded-2xl bg-[#F8F6F4] p-4 border border-black/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#141414]">
                <Star className="h-3.5 w-3.5 fill-[#EA4E1B] text-[#EA4E1B]" />
                <span>Display Photo (Main Card Thumbnail)</span>
              </span>
              <span className="text-[11px] text-neutral-500">
                Main picture shown on product cards &amp; cart
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-white">
                {editingForm.image ? (
                  <ResilientImage
                    src={editingForm.image}
                    alt="Display Photo Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#141414] px-4 py-2 text-xs font-bold text-white transition hover:bg-neutral-800">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload &amp; Crop Display Pic</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  {editingForm.image && (
                    <button
                      type="button"
                      onClick={() => setCropSource(editingForm.image)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#EA4E1B] bg-white px-3.5 py-2 text-xs font-bold text-[#EA4E1B] transition hover:bg-[#EA4E1B] hover:text-white"
                    >
                      <Crop className="h-3.5 w-3.5" />
                      <span>Free-Form Crop</span>
                    </button>
                  )}

                  <span className="text-[11px] text-neutral-500">
                    Drag corners freely to crop · Auto-compressed
                  </span>
                </div>

                <input
                  type="text"
                  value={editingForm.image.startsWith('data:') ? '' : editingForm.image}
                  onChange={(e) =>
                    setEditingForm((prev) => ({ ...prev, image: e.target.value }))
                  }
                  placeholder={
                    editingForm.image.startsWith('data:')
                      ? 'Cropped/uploaded display photo ready (or paste image URL to replace)'
                      : 'Or paste display photo URL (https://...)'
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-[#141414] focus:border-[#EA4E1B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Additional Product Photos (Multi-Image Upload — Products Only) */}
          <div className="space-y-3 rounded-2xl border border-black/8 bg-neutral-50/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Images className="h-4 w-4 text-[#EA4E1B]" />
                <span className="text-xs font-extrabold text-[#141414]">
                  Additional Product Photos ({editingForm.galleryImages.length}/5)
                </span>
              </div>

              <label
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-white transition ${
                  uploadingGallery || editingForm.galleryImages.length >= 5
                    ? 'bg-neutral-400 cursor-not-allowed'
                    : 'bg-[#EA4E1B] hover:bg-[#d44212]'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{uploadingGallery ? 'Uploading...' : 'Add More Photos'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingGallery || editingForm.galleryImages.length >= 5}
                  onChange={handleGalleryFilesChange}
                  className="hidden"
                />
              </label>
            </div>

            {editingForm.galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                {editingForm.galleryImages.map((imgUrl, idx) => (
                  <div
                    key={`dash-gallery-${idx}`}
                    className="relative overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs"
                  >
                    <div className="aspect-square w-full overflow-hidden bg-neutral-100">
                      <ResilientImage
                        src={imgUrl}
                        alt={`Additional product photo ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      aria-label={`Remove gallery photo ${idx + 1}`}
                      className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white transition hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetGalleryAsDisplay(idx)}
                      className="block w-full border-t border-black/8 bg-white px-2 py-1.5 text-center text-[11px] font-bold text-[#141414] transition hover:bg-[#EA4E1B] hover:text-white"
                    >
                      Set as Display
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                Select multiple photos at once to show extra angles, box contents, or color
                variants when customers open this product.
              </p>
            )}

            {editingForm.galleryImages.length < 5 && (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={galleryUrlDraft}
                  onChange={(e) => setGalleryUrlDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGalleryUrl();
                    }
                  }}
                  placeholder="Or paste an additional photo URL (https://...)"
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-[#141414] focus:border-[#EA4E1B] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryUrl}
                  className="shrink-0 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-[#141414] transition hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
                >
                  + Add URL
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Product Name *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                required
                maxLength={100}
                value={editingForm.name}
                onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                placeholder="e.g. 67W Fast Charger"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Category Selector with "+ Add New Category" Support */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-neutral-700">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAddingCategory((prev) => !prev);
                    setNewCategoryDraft('');
                  }}
                  className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#EA4E1B] hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  <span>{addingCategory ? 'Select Existing' : 'New Category'}</span>
                </button>
              </div>

              {addingCategory ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={50}
                    value={newCategoryDraft}
                    onChange={(e) => setNewCategoryDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmNewCategory();
                      }
                    }}
                    placeholder="e.g. Used Phones, Watches..."
                    className="w-full rounded-xl border border-[#EA4E1B] bg-white px-3 py-2 text-xs focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleConfirmNewCategory}
                    className="shrink-0 rounded-xl bg-[#EA4E1B] px-3 py-2 text-xs font-bold text-white hover:bg-[#d44212]"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={editingForm.category}
                  onChange={(e) => {
                    if (e.target.value === ADD_CATEGORY_SENTINEL) {
                      setAddingCategory(true);
                      setNewCategoryDraft('');
                    } else {
                      setEditingForm({ ...editingForm, category: e.target.value });
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value={ADD_CATEGORY_SENTINEL}>+ Add New Category...</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">Stock Badge</label>
              <input
                type="text"
                maxLength={40}
                value={editingForm.status}
                onChange={(e) => setEditingForm({ ...editingForm, status: e.target.value })}
                placeholder="In Stock / PTA Approved / Out of Stock"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Sale Price (Rs.) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={editingForm.pricePkr}
                onChange={(e) => setEditingForm({ ...editingForm, pricePkr: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-bold focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Original Cut Price (Rs.)
              </label>
              <input
                type="number"
                min={0}
                value={editingForm.originalPricePkr}
                onChange={(e) =>
                  setEditingForm({ ...editingForm, originalPricePkr: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Sold Count (Optional — leave blank to hide)
              </label>
              <input
                type="text"
                maxLength={30}
                value={editingForm.soldCount}
                onChange={(e) => setEditingForm({ ...editingForm, soldCount: e.target.value })}
                placeholder="Leave blank until you add real count"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Rating (Optional — leave blank to hide)
              </label>
              <input
                type="text"
                maxLength={10}
                value={editingForm.rating}
                onChange={(e) => setEditingForm({ ...editingForm, rating: e.target.value })}
                placeholder="e.g. 5.0 (optional)"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Reviews Count (Optional)
              </label>
              <input
                type="number"
                min={0}
                value={editingForm.reviewsCount}
                onChange={(e) => setEditingForm({ ...editingForm, reviewsCount: e.target.value })}
                placeholder="0 (hidden if empty)"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Warranty Note
              </label>
              <input
                type="text"
                maxLength={120}
                value={editingForm.warrantyNote}
                onChange={(e) => setEditingForm({ ...editingForm, warrantyNote: e.target.value })}
                placeholder="7-day replacement check"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[11px] font-bold text-neutral-700">
                Options / Variants (comma separated)
              </label>
              <input
                type="text"
                value={editingForm.variantsText}
                onChange={(e) => setEditingForm({ ...editingForm, variantsText: e.target.value })}
                placeholder="e.g. Matte Black, Clear Bumper, Navy Blue"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[11px] font-bold text-neutral-700">
                Specs Summary
              </label>
              <input
                type="text"
                maxLength={240}
                value={editingForm.specs}
                onChange={(e) => setEditingForm({ ...editingForm, specs: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[11px] font-bold text-neutral-700">Description</label>
              <textarea
                rows={2}
                maxLength={1000}
                value={editingForm.description}
                onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-700">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingForm.inStock}
                  onChange={(e) =>
                    setEditingForm({
                      ...editingForm,
                      inStock: e.target.checked,
                      status: e.target.checked ? 'In Stock' : 'Out of Stock',
                    })
                  }
                  className="h-4 w-4 accent-[#EA4E1B]"
                />
                In Stock
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingForm.hidden}
                  onChange={(e) => setEditingForm({ ...editingForm, hidden: e.target.checked })}
                  className="h-4 w-4 accent-[#EA4E1B]"
                />
                Hide from Store
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartNewProduct}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
              >
                {editingForm.isNew ? 'Clear Form' : 'Cancel Edit'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA4E1B] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#d44212] disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                <span>
                  {saving
                    ? 'Saving...'
                    : editingForm.isNew
                      ? 'Add Product Live'
                      : 'Save Product Live'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Product Inventory List */}
      <div className="rounded-3xl bg-white p-5 sm:p-7 shadow-sm border border-black/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
          <div>
            <h3 className="font-display text-base font-bold text-[#141414]">
              Manage Store Products ({products.length})
            </h3>
            <p className="text-xs text-neutral-500">
              Click Edit on any item to load it into the editor above.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-44 sm:w-56 rounded-full border border-neutral-200 bg-neutral-50 pl-8 pr-3 py-1.5 text-xs focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleStartNewProduct}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EA4E1B] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#d44212]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        <div className="mt-4 divide-y divide-neutral-100">
          {filtered.map((product) => {
            const isBeingEdited = !editingForm.isNew && editingForm.id === product.id;

            return (
              <div
                key={product.id}
                className={`py-3.5 px-2 -mx-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isBeingEdited ? 'bg-[#EA4E1B]/5 ring-1 ring-[#EA4E1B]/40' : ''
                } ${product.hidden ? 'opacity-55' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#F8F6F4]">
                    <ResilientImage
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-[#141414] truncate">
                        {product.name}
                      </span>
                      {isBeingEdited && (
                        <span className="rounded-xs bg-[#EA4E1B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          Editing
                        </span>
                      )}
                      {product.isCustom && (
                        <span className="rounded-xs bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">
                          Custom
                        </span>
                      )}
                      {product.isOverridden && !product.isCustom && (
                        <span className="rounded-xs bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                          Edited
                        </span>
                      )}
                      {product.hidden && (
                        <span className="rounded-xs bg-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
                          Hidden
                        </span>
                      )}
                      {product.galleryImages && product.galleryImages.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-xs bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          <Images className="h-2.5 w-2.5" />
                          <span>{product.galleryImages.length + 1} photos</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span className="font-extrabold text-[#EA4E1B]">
                        {formatPkr(product.pricePkr)}
                      </span>
                      {product.originalPricePkr &&
                        product.originalPricePkr > product.pricePkr && (
                          <span className="line-through text-neutral-400">
                            {formatPkr(product.originalPricePkr)}
                          </span>
                        )}
                      <span>· {product.category}</span>
                      <span>· {product.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(product)}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition ${
                      isBeingEdited
                        ? 'bg-[#EA4E1B] hover:bg-[#d44212]'
                        : 'bg-[#141414] hover:bg-neutral-800'
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{isBeingEdited ? 'Editing' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleHidden(product)}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
                    title={product.hidden ? 'Show in Store' : 'Hide from Store'}
                  >
                    {product.hidden ? (
                      <>
                        <Eye className="h-3.5 w-3.5" />
                        <span>Show</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Hide</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPendingDeleteProduct(product)}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    title="Delete Product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface AdminShopPhotosManagerProps {
  mediaOverrides: Record<string, SiteMediaOverride>;
  setFeedbackMsg: FeedbackSetter;
}

export const AdminShopPhotosManager: React.FC<AdminShopPhotosManagerProps> = ({
  mediaOverrides,
  setFeedbackMsg,
}) => {
  const [drafts, setDrafts] = useState<
    Record<string, { title: string; caption: string; imageUrl: string }>
  >({});
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const [cropRequest, setCropRequest] = useState<{
    slot: SiteMediaSlotConfig;
    src: string;
  } | null>(null);

  const getSlotState = (slot: SiteMediaSlotConfig) => {
    const draft = drafts[slot.slotKey];
    const live = mediaOverrides[slot.slotKey];
    return {
      title: draft?.title ?? live?.title ?? slot.defaultTitle,
      caption: draft?.caption ?? live?.caption ?? slot.defaultCaption,
      imageUrl: draft?.imageUrl ?? live?.imageUrl ?? slot.defaultImage,
      hasUnsavedDraft: Boolean(draft),
      isCustomized: Boolean(live),
    };
  };

  const updateDraft = (
    slot: SiteMediaSlotConfig,
    patch: Partial<{ title: string; caption: string; imageUrl: string }>,
  ) => {
    const current = getSlotState(slot);
    setDrafts((prev) => ({
      ...prev,
      [slot.slotKey]: {
        title: patch.title ?? current.title,
        caption: patch.caption ?? current.caption,
        imageUrl: patch.imageUrl ?? current.imageUrl,
      },
    }));
  };

  const handlePhotoUpload = async (
    slot: SiteMediaSlotConfig,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedbackMsg(null);
    try {
      const rawUrl = await readFileAsDataUrl(file);
      setCropRequest({ slot, src: rawUrl });
    } catch (err) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : 'Failed to read photo.',
        type: 'error',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveSlot = async (slot: SiteMediaSlotConfig) => {
    const current = getSlotState(slot);
    if (!current.imageUrl.trim()) {
      setFeedbackMsg({ text: 'Please select a photo or paste an image URL.', type: 'error' });
      return;
    }
    if (current.imageUrl.length > 350_000) {
      setFeedbackMsg({
        text: 'Image is too large. Please pick or crop a smaller image.',
        type: 'error',
      });
      return;
    }

    setSavingSlot(slot.slotKey);
    setFeedbackMsg(null);
    try {
      await setDoc(doc(db, 'siteMedia', slot.slotKey), {
        slotKey: slot.slotKey,
        title: current.title.trim().slice(0, 120),
        caption: current.caption.trim().slice(0, 300),
        imageUrl: current.imageUrl.trim(),
        updatedAt: new Date().toISOString(),
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[slot.slotKey];
        return next;
      });
      setFeedbackMsg({
        text: `Updated "${slot.label}" — live on website now!`,
        type: 'success',
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, `siteMedia/${slot.slotKey}`);
      } catch {
        setFeedbackMsg({
          text: 'Could not save photo. Ensure you are signed in as the authorized admin.',
          type: 'error',
        });
      }
    } finally {
      setSavingSlot(null);
    }
  };

  const handleResetSlot = async (slot: SiteMediaSlotConfig) => {
    if (!window.confirm(`Reset "${slot.defaultTitle}" back to original shop photo?`)) return;
    setSavingSlot(slot.slotKey);
    try {
      await deleteDoc(doc(db, 'siteMedia', slot.slotKey));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[slot.slotKey];
        return next;
      });
      setFeedbackMsg({
        text: `Reset "${slot.defaultTitle}" to original photo.`,
        type: 'success',
      });
    } catch (err) {
      console.error(err);
      setFeedbackMsg({ text: 'Failed to reset shop photo.', type: 'error' });
    } finally {
      setSavingSlot(null);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-5 sm:p-7 shadow-sm border border-black/5">
      {/* Free-Form Cropper Modal for Shop Photos */}
      <ImageCropperModal
        imageSrc={cropRequest?.src ?? null}
        maxDimension={960}
        maxBytes={260_000}
        onCancel={() => setCropRequest(null)}
        onApply={(croppedUrl) => {
          if (cropRequest) {
            updateDraft(cropRequest.slot, { imageUrl: croppedUrl });
          }
          setCropRequest(null);
          setFeedbackMsg({
            text: 'Shop photo cropped! Click Save Live to publish it.',
            type: 'success',
          });
        }}
      />

      <div className="pb-4 border-b border-black/5">
        <h3 className="font-display text-base font-bold text-[#141414] flex items-center gap-2">
          <Camera className="h-5 w-5 text-[#EA4E1B]" />
          Shop Interior &amp; Exterior Photos (دکان کی اندر اور باہر کی تصاویر)
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Upload &amp; free-form crop photos from your phone or PC to replace storefront, interior
          counter, signboard, and gallery images across the website.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {SITE_MEDIA_SLOTS.map((slot) => {
          const state = getSlotState(slot);
          const isSaving = savingSlot === slot.slotKey;

          return (
            <div
              key={slot.slotKey}
              className="flex flex-col justify-between rounded-2xl border border-black/10 bg-[#F8F6F4] p-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#141414]">{slot.label}</h4>
                    <p className="text-[11px] text-neutral-500">{slot.description}</p>
                  </div>
                  {state.isCustomized && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Custom
                    </span>
                  )}
                </div>

                <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#F8F6F4]">
                  <ResilientImage
                    src={state.imageUrl}
                    alt={state.title}
                    className="h-full w-full scale-[1.02] object-cover"
                  />
                  {/* Live preview: left-only blur for hero, 4-side seamless feather blur for all shop photos */}
                  {slot.slotKey === 'heroLifestyle' ? (
                    <>
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 backdrop-blur-[2px] [-webkit-mask-image:linear-gradient(to_right,black_0%,transparent_100%)] [mask-image:linear-gradient(to_right,black_0%,transparent_100%)]" />
                      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#F8F6F4] via-[#F8F6F4]/55 to-transparent" />
                    </>
                  ) : (
                    <>
                      <div className="pointer-events-none absolute inset-0 backdrop-blur-[2.5px] [-webkit-mask-image:radial-gradient(ellipse_74%_70%_at_center,transparent_58%,black_100%)] [mask-image:radial-gradient(ellipse_74%_70%_at_center,transparent_58%,black_100%)]" />
                      <div className="pointer-events-none absolute -inset-px rounded-xl shadow-[inset_0_0_24px_14px_#F8F6F4]" />
                    </>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    maxLength={120}
                    value={state.title}
                    onChange={(e) => updateDraft(slot, { title: e.target.value })}
                    placeholder="Photo title"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#141414] focus:border-[#EA4E1B] focus:outline-none"
                  />
                  <input
                    type="text"
                    maxLength={300}
                    value={state.caption}
                    onChange={(e) => updateDraft(slot, { caption: e.target.value })}
                    placeholder="Short caption"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 focus:border-[#EA4E1B] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3">
                <div className="flex items-center gap-1.5">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#141414] px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-neutral-800">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(slot, e)}
                      className="hidden"
                    />
                  </label>

                  {state.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setCropRequest({ slot, src: state.imageUrl })}
                      className="inline-flex items-center gap-1 rounded-full border border-[#EA4E1B] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#EA4E1B] transition hover:bg-[#EA4E1B] hover:text-white"
                    >
                      <Crop className="h-3 w-3" />
                      <span>Crop</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {state.isCustomized && (
                    <button
                      type="button"
                      onClick={() => handleResetSlot(slot)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-700 hover:bg-neutral-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSaveSlot(slot)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1 rounded-full bg-[#EA4E1B] px-3.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-[#d44212] disabled:opacity-60"
                  >
                    {isSaving ? (
                      <span>Saving...</span>
                    ) : state.hasUnsavedDraft ? (
                      <>
                        <Save className="h-3 w-3" />
                        <span>Save Live</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
