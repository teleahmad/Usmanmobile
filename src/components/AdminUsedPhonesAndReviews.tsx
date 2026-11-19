import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Plus,
  Smartphone,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { formatPkr } from '../data/catalogData';
import {
  CONDITION_OPTIONS,
  PTA_STATUS_OPTIONS,
  PtaStatus,
  USED_PHONE_BRANDS,
  UsedPhoneItem,
} from '../data/usedPhonesData';
import { db } from '../firebase';
import { LiveCustomerReview } from '../hooks/useLiveStoreData';
import { readFileAsDataUrl } from '../utils/imageUpload';
import { ImageCropperModal } from './ImageCropperModal';
import { ResilientImage } from './ResilientImage';

interface FeedbackHandler {
  onFeedback: (msg: { text: string; type: 'success' | 'error' }) => void;
}

interface AdminUsedPhonesManagerProps extends FeedbackHandler {
  usedPhones: UsedPhoneItem[];
}

export const AdminUsedPhonesManager: React.FC<AdminUsedPhonesManagerProps> = ({
  usedPhones,
  onFeedback,
}) => {
  const formRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState(USED_PHONE_BRANDS[0]);
  const [pricePkr, setPricePkr] = useState('');
  const [marketPricePkr, setMarketPricePkr] = useState('');
  const [storage, setStorage] = useState('128GB');
  const [condition, setCondition] = useState(CONDITION_OPTIONS[1]);
  const [ptaStatus, setPtaStatus] = useState<PtaStatus>('PTA Approved');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [accessories, setAccessories] = useState('Phone + Charger');
  const [warrantyNote, setWarrantyNote] = useState('3-day shop check warranty');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [available, setAvailable] = useState(true);

  const [cropSource, setCropSource] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UsedPhoneItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setBrand(USED_PHONE_BRANDS[0]);
    setPricePkr('');
    setMarketPricePkr('');
    setStorage('128GB');
    setCondition(CONDITION_OPTIONS[1]);
    setPtaStatus('PTA Approved');
    setBatteryHealth('');
    setAccessories('Phone + Charger');
    setWarrantyNote('3-day shop check warranty');
    setNotes('');
    setPhotos([]);
    setAvailable(true);
  };

  const handleStartEdit = (phone: UsedPhoneItem) => {
    setEditingId(phone.id);
    setTitle(phone.title);
    setBrand(phone.brand);
    setPricePkr(String(phone.pricePkr));
    setMarketPricePkr(phone.marketPricePkr ? String(phone.marketPricePkr) : '');
    setStorage(phone.storage);
    setCondition(phone.condition);
    setPtaStatus(phone.ptaStatus);
    setBatteryHealth(phone.batteryHealth || '');
    setAccessories(phone.accessories || '');
    setWarrantyNote(phone.warrantyNote || '');
    setNotes(phone.notes || '');
    setPhotos(phone.photos || []);
    setAvailable(phone.available);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => titleInputRef.current?.focus(), 250);
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (photos.length >= 4) {
      onFeedback({ text: 'Maximum 4 photos per used phone.', type: 'error' });
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSource(dataUrl);
    } catch (err) {
      onFeedback({
        text: err instanceof Error ? err.message : 'Could not read image.',
        type: 'error',
      });
    }
  };

  const handleSaveUsedPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const numericPrice = Number(pricePkr);
    if (cleanTitle.length < 2 || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      onFeedback({ text: 'Please enter phone title and valid price (PKR).', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const docId =
        editingId ||
        `used-${cleanTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 32)}-${String(Date.now()).slice(-4)}`;

      const numericMarket = Number(marketPricePkr);
      const nowIso = new Date().toISOString();

      const payload: Record<string, unknown> = {
        title: cleanTitle.slice(0, 100),
        brand: brand.trim().slice(0, 40),
        pricePkr: numericPrice,
        storage: storage.trim().slice(0, 40) || '128GB',
        condition: condition.trim().slice(0, 40) || '9/10 Clean',
        ptaStatus,
        batteryHealth: batteryHealth.trim().slice(0, 40),
        accessories: accessories.trim().slice(0, 80),
        warrantyNote: warrantyNote.trim().slice(0, 120),
        notes: notes.trim().slice(0, 600),
        photos: photos.slice(0, 4),
        available,
        deleted: false,
        updatedAt: nowIso,
      };

      if (Number.isFinite(numericMarket) && numericMarket > 0) {
        payload.marketPricePkr = numericMarket;
      }
      if (!editingId) {
        payload.createdAt = nowIso;
      }

      await setDoc(doc(db, 'usedPhones', docId), payload, { merge: true });

      onFeedback({
        text: editingId
          ? `Updated "${cleanTitle}" live on website!`
          : `Added "${cleanTitle}" to Used Phones section!`,
        type: 'success',
      });
      resetForm();
    } catch (err) {
      console.error('Used phone save error:', err);
      onFeedback({ text: 'Could not save used phone to Firestore.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailable = async (phone: UsedPhoneItem) => {
    try {
      await setDoc(
        doc(db, 'usedPhones', phone.id),
        {
          title: phone.title,
          brand: phone.brand,
          pricePkr: phone.pricePkr,
          storage: phone.storage,
          condition: phone.condition,
          ptaStatus: phone.ptaStatus,
          available: !phone.available,
          photos: phone.photos,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      onFeedback({
        text: `${phone.title} marked as ${!phone.available ? 'Available' : 'Sold Out'}.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Toggle available error:', err);
      onFeedback({ text: 'Could not update availability status.', type: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.isCustom) {
        await deleteDoc(doc(db, 'usedPhones', deleteTarget.id));
      } else {
        await setDoc(
          doc(db, 'usedPhones', deleteTarget.id),
          {
            title: deleteTarget.title,
            brand: deleteTarget.brand,
            pricePkr: deleteTarget.pricePkr,
            storage: deleteTarget.storage,
            condition: deleteTarget.condition,
            ptaStatus: deleteTarget.ptaStatus,
            available: false,
            deleted: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      onFeedback({ text: `Deleted "${deleteTarget.title}".`, type: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete used phone error:', err);
      onFeedback({ text: 'Could not delete used phone.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add / Edit Used Phone Form */}
      <div
        ref={formRef}
        className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display flex items-center gap-2 text-lg font-bold text-[#141414]">
              <Smartphone className="h-5 w-5 text-[#EA4E1B]" />
              {editingId
                ? 'Edit Used Phone Listing'
                : 'Add Used / Second-Hand Phone (استعمال شدہ فون شامل کریں)'}
            </h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              Upload up to 4 real cropped photos with PTA status, condition grade, and battery health.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-black/15 px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSaveUsedPhone} className="mt-5 space-y-4">
          {/* Multi-photo uploader */}
          <div className="rounded-2xl border border-black/8 bg-[#F8F6F4] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-neutral-700">
                Phone Photos ({photos.length}/4) · Free-form crop enabled
              </span>
              {photos.length < 4 && (
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#141414] px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Upload &amp; Crop Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-white"
                  >
                    <ResilientImage
                      src={photo}
                      alt={`Phone photo ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Remove photo"
                      className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Phone Model / Title *
              </label>
              <input
                ref={titleInputRef}
                type="text"
                required
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. iPhone 13 Pro 256GB Graphite"
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">Brand *</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
              >
                {USED_PHONE_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">PTA Status *</label>
              <select
                value={ptaStatus}
                onChange={(e) => setPtaStatus(e.target.value as PtaStatus)}
                className="mt-1 h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
              >
                {PTA_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Sale Price (Rs.) *
              </label>
              <input
                type="number"
                required
                min={500}
                value={pricePkr}
                onChange={(e) => setPricePkr(e.target.value)}
                placeholder="e.g. 42000"
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm tabular-nums focus:border-[#EA4E1B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Market / Original Price (Optional)
              </label>
              <input
                type="number"
                min={0}
                value={marketPricePkr}
                onChange={(e) => setMarketPricePkr(e.target.value)}
                placeholder="e.g. 49000"
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm tabular-nums focus:border-[#EA4E1B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Storage / RAM *
              </label>
              <input
                type="text"
                required
                maxLength={40}
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="e.g. 8GB / 256GB"
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">Condition *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Battery Health
              </label>
              <input
                type="text"
                maxLength={40}
                value={batteryHealth}
                onChange={(e) => setBatteryHealth(e.target.value)}
                placeholder="e.g. 89% Original / 5000 mAh"
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Box / Accessories
              </label>
              <input
                type="text"
                maxLength={80}
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
                placeholder="e.g. Complete Box + Fast Charger"
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700">
                Warranty / Check Guarantee
              </label>
              <input
                type="text"
                maxLength={120}
                value={warrantyNote}
                onChange={(e) => setWarrantyNote(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-black/15 px-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-neutral-700">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="h-4 w-4 accent-[#EA4E1B]"
                />
                <span>Available in Stock (uncheck if Sold)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-neutral-700">
              Condition Notes / Details
            </label>
            <textarea
              rows={2}
              maxLength={600}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Waterpack, Face ID working, zero dot or shade..."
              className="mt-1 w-full rounded-xl border border-black/15 p-3 text-sm focus:border-[#EA4E1B] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#EA4E1B] px-7 text-sm font-bold text-white shadow-sm transition hover:bg-[#d44212] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Used Phone'}
            </span>
          </button>
        </form>
      </div>

      {/* Existing Used Phones List */}
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <h3 className="font-display text-base font-bold text-[#141414]">
          Live Used Phones Inventory ({usedPhones.length})
        </h3>

        <div className="mt-4 divide-y divide-black/5">
          {usedPhones.map((phone) => (
            <div
              key={phone.id}
              className={`flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center ${
                editingId === phone.id ? 'rounded-xl bg-orange-50/60 px-3' : ''
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-14 w-18 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#F8F6F4]">
                  {phone.photos[0] ? (
                    <ResilientImage
                      src={phone.photos[0]}
                      alt={phone.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-neutral-400">
                      <Smartphone className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[#141414]">{phone.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                    <span className="font-bold text-[#EA4E1B] tabular-nums">
                      {formatPkr(phone.pricePkr)}
                    </span>
                    <span>·</span>
                    <span>{phone.ptaStatus}</span>
                    <span>·</span>
                    <span>{phone.storage}</span>
                    <span>·</span>
                    <span>{phone.condition}</span>
                    <span>·</span>
                    <span className={phone.available ? 'font-bold text-emerald-700' : 'font-bold text-red-600'}>
                      {phone.available ? 'Available' : 'Sold'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStartEdit(phone)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/15 bg-white px-3 text-xs font-semibold text-[#141414] hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
                >
                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAvailable(phone)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-black/15 bg-white px-3 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {phone.available ? 'Mark Sold' : 'Mark Available'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(phone)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free-Form Cropper Modal */}
      <ImageCropperModal
        imageSrc={cropSource}
        maxDimension={780}
        maxBytes={160_000}
        onCancel={() => setCropSource(null)}
        onApply={(croppedUrl) => {
          setPhotos((prev) => [...prev, croppedUrl].slice(0, 4));
          setCropSource(null);
        }}
      />

      {/* In-App Yes/No Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h4 className="font-display text-base font-extrabold text-[#141414]">
                Delete Used Phone?
              </h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong> from your
              website?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="h-9 rounded-xl border border-black/15 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                No, Keep
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="h-9 rounded-xl bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdminReviewsManagerProps extends FeedbackHandler {
  liveReviews: LiveCustomerReview[];
}

export const AdminReviewsManager: React.FC<AdminReviewsManagerProps> = ({
  liveReviews,
  onFeedback,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<LiveCustomerReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteReview = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'reviews', deleteTarget.id));
      await deleteDoc(doc(db, 'reviewKeys', deleteTarget.id)).catch(() => {});
      onFeedback({ text: `Deleted review by ${deleteTarget.customerName}.`, type: 'success' });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete review error:', err);
      onFeedback({ text: 'Could not delete review.', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="font-display text-base font-bold text-[#141414]">
        Live Customer Reviews ({liveReviews.length})
      </h3>
      <p className="mt-1 text-xs text-neutral-500">
        Reviews submitted by customers on your website. Only the last 4 digits of each mobile number
        are stored for customer privacy.
      </p>

      {liveReviews.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-[#F8F6F4] p-8 text-center text-xs text-neutral-500">
          No customer reviews submitted yet. Once customers post reviews on your Home page, they will
          appear here in real time.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-black/5">
          {liveReviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-start"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#141414]">{review.customerName}</span>
                  <span className="font-mono text-xs text-neutral-500">{review.maskedPhone}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {review.rating}/5
                  </span>
                  {review.service && (
                    <span className="text-xs text-neutral-500">· {review.service}</span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-700">
                  “{review.comment}”
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteTarget(review)}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h4 className="font-display text-base font-extrabold text-[#141414]">
                Delete Customer Review?
              </h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600">
              Are you sure you want to delete the review from{' '}
              <strong>{deleteTarget.customerName}</strong> ({deleteTarget.maskedPhone})?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="h-9 rounded-xl border border-black/15 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                No, Keep
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteReview}
                className="h-9 rounded-xl bg-red-600 px-4 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
