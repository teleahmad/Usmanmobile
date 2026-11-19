import React, { useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Lock, Search, Star, X } from 'lucide-react';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { CUSTOMER_REVIEWS } from '../data/catalogData';
import { db } from '../firebase';
import { LiveCustomerReview } from '../hooks/useLiveStoreData';
import {
  deriveReviewCredentials,
  isValidPhoneInput,
  loadMySavedReviewIds,
  maskPhoneLast4,
  rememberMyReviewId,
} from '../utils/reviewPrivacy';

interface CustomerReviewsSectionProps {
  liveReviews: LiveCustomerReview[];
  compact?: boolean;
}

const SERVICE_OPTIONS = [
  'Mobile Repair / LCD',
  'Fast Charger & Accessories',
  'Used Phone Purchase',
  'Battery & Charging Port',
  'AirPods & Audio',
  'Easypaisa / JazzCash',
  'Shop Visit',
];

const STAR_LABELS_EN = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const STAR_LABELS_UR = ['', 'کمزور', 'مناسب', 'اچھا', 'بہت اچھا', 'بہترین'];

export const CustomerReviewsSection: React.FC<CustomerReviewsSectionProps> = ({
  liveReviews,
  compact = false,
}) => {
  const { t, isUrdu } = useLanguage();

  const [formOpen, setFormOpen] = useState(false);
  const [editLookupMode, setEditLookupMode] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [existingCreatedAt, setExistingCreatedAt] = useState<string | null>(null);
  const [mySavedIds, setMySavedIds] = useState<string[]>(() => loadMySavedReviewIds());

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [service, setService] = useState(SERVICE_OPTIONS[0]);
  const [comment, setComment] = useState('');

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null,
  );

  // Merge live Firestore reviews with verified baseline shop reviews
  const combinedReviews = useMemo(() => {
    const baseline: LiveCustomerReview[] = CUSTOMER_REVIEWS.map((r, idx) => ({
      id: `seed-${r.id}`,
      customerName: r.name,
      maskedPhone: idx === 0 ? '••••••4192' : idx === 1 ? '••••••7830' : '••••••6045',
      rating: 5,
      service: `${r.service} · ${r.location}`,
      comment: r.quote,
      createdAt: '2026-10-01T10:00:00.000Z',
      updatedAt: '2026-10-01T10:00:00.000Z',
      isSeed: true,
    }));
    return [...liveReviews, ...baseline];
  }, [liveReviews]);

  const stats = useMemo(() => {
    const total = combinedReviews.length;
    if (total === 0) return { average: '5.0', total: 0 };
    const sum = combinedReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return {
      average: (sum / total).toFixed(1),
      total,
    };
  }, [combinedReviews]);

  const resetForm = () => {
    setCustomerName('');
    setPhoneInput('');
    setRating(5);
    setHoverRating(0);
    setService(SERVICE_OPTIONS[0]);
    setComment('');
    setEditingReviewId(null);
    setExistingCreatedAt(null);
    setEditLookupMode(false);
  };

  const openWriteForm = () => {
    resetForm();
    setStatusMsg(null);
    setFormOpen(true);
  };

  const openEditLookup = () => {
    resetForm();
    setStatusMsg(null);
    setEditLookupMode(true);
    setFormOpen(true);
  };

  const openEditForCard = (review: LiveCustomerReview) => {
    setStatusMsg(null);
    setFormOpen(true);
    setEditLookupMode(false);
    setEditingReviewId(review.id);
    setExistingCreatedAt(review.createdAt);
    setCustomerName(review.customerName);
    setRating(review.rating);
    setService(review.service || SERVICE_OPTIONS[0]);
    setComment(review.comment);
    setPhoneInput('');
    document.getElementById('customer-review-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const handleLookupByPhone = async () => {
    if (!isValidPhoneInput(phoneInput)) {
      setStatusMsg({
        text: t(
          'Please enter a valid 11-digit mobile number (e.g. 0300-1234567).',
          'براہ کرم درست 11 ہندسوں کا موبائل نمبر درج کریں (مثلاً 0300-1234567)۔',
        ),
        type: 'error',
      });
      return;
    }

    try {
      setLookingUp(true);
      setStatusMsg(null);
      const { reviewId } = await deriveReviewCredentials(phoneInput);
      const snap = await getDoc(doc(db, 'reviews', reviewId));
      if (!snap.exists()) {
        setStatusMsg({
          text: t(
            'No previous review found for this number. You can write a new review below!',
            'اس نمبر پر پہلے سے کوئی ریویو موجود نہیں۔ آپ نیچے نیا ریویو لکھ سکتے ہیں!',
          ),
          type: 'error',
        });
        setEditLookupMode(false);
        setEditingReviewId(null);
        setExistingCreatedAt(null);
        return;
      }

      const data = snap.data();
      setEditingReviewId(reviewId);
      setExistingCreatedAt(typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString());
      setCustomerName(typeof data.customerName === 'string' ? data.customerName : '');
      setRating(typeof data.rating === 'number' ? data.rating : 5);
      setService(typeof data.service === 'string' && data.service ? data.service : SERVICE_OPTIONS[0]);
      setComment(typeof data.comment === 'string' ? data.comment : '');
      setEditLookupMode(false);
      setStatusMsg({
        text: t(
          'Your previous review is loaded! Edit your stars or message and click Update.',
          'آپ کا پرانا ریویو لوڈ ہو گیا ہے! تبدیلی کر کے اپڈیٹ پر کلک کریں۔',
        ),
        type: 'success',
      });
    } catch (err) {
      console.error('Review lookup failed:', err);
      setStatusMsg({
        text: t(
          'Could not check your number right now. Please try again.',
          'اس وقت نمبر چیک نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔',
        ),
        type: 'error',
      });
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanName = customerName.trim();
    const cleanComment = comment.trim();

    if (cleanName.length < 2) {
      setStatusMsg({
        text: t('Please enter your name (at least 2 characters).', 'براہ کرم اپنا نام درج کریں۔'),
        type: 'error',
      });
      return;
    }

    if (!isValidPhoneInput(phoneInput)) {
      setStatusMsg({
        text: t(
          'Please enter your valid mobile number (10-15 digits). Only last 4 digits will be visible.',
          'براہ کرم درست موبائل نمبر درج کریں۔ پرائیویسی کے لیے صرف آخری 4 ہندسے دکھائے جائیں گے۔',
        ),
        type: 'error',
      });
      return;
    }

    if (cleanComment.length < 4) {
      setStatusMsg({
        text: t(
          'Please write a short review message (at least 4 characters).',
          'براہ کرم کم از کم 4 حروف کا ریویو لکھیں۔',
        ),
        type: 'error',
      });
      return;
    }

    try {
      setSubmitting(true);
      const { reviewId, phoneHash, maskedPhone } = await deriveReviewCredentials(phoneInput);

      // If user clicked Edit on a specific card, verify the entered phone belongs to that card
      if (editingReviewId && editingReviewId !== reviewId) {
        setStatusMsg({
          text: t(
            'This mobile number does not match the number used when posting this review.',
            'یہ موبائل نمبر اس ریویو والے اصل نمبر سے میل نہیں کھاتا۔',
          ),
          type: 'error',
        });
        setSubmitting(false);
        return;
      }

      const nowIso = new Date().toISOString();
      const reviewRef = doc(db, 'reviews', reviewId);
      const keyRef = doc(db, 'reviewKeys', reviewId);
      const existingSnap = await getDoc(reviewRef);

      const batch = writeBatch(db);

      if (existingSnap.exists()) {
        const prev = existingSnap.data();
        const preservedCreatedAt =
          typeof prev.createdAt === 'string'
            ? prev.createdAt
            : existingCreatedAt || nowIso;
        const preservedMaskedPhone =
          typeof prev.maskedPhone === 'string' ? prev.maskedPhone : maskedPhone;

        batch.update(keyRef, {
          phoneHash,
          updatedAt: nowIso,
        });

        batch.update(reviewRef, {
          customerName: cleanName.slice(0, 60),
          maskedPhone: preservedMaskedPhone,
          rating: Math.max(1, Math.min(5, Math.round(rating))),
          service: service.trim().slice(0, 60),
          comment: cleanComment.slice(0, 500),
          createdAt: preservedCreatedAt,
          updatedAt: nowIso,
        });
      } else {
        batch.set(keyRef, {
          phoneHash,
          updatedAt: nowIso,
        });

        batch.set(reviewRef, {
          customerName: cleanName.slice(0, 60),
          maskedPhone,
          rating: Math.max(1, Math.min(5, Math.round(rating))),
          service: service.trim().slice(0, 60),
          comment: cleanComment.slice(0, 500),
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      await batch.commit();

      rememberMyReviewId(reviewId);
      setMySavedIds(loadMySavedReviewIds());

      setStatusMsg({
        text: existingSnap.exists()
          ? t(
              `Review updated! Displayed safely as ${maskedPhone}.`,
              `آپ کا ریویو اپڈیٹ ہو گیا! آپ کا نمبر ${maskedPhone} کے طور پر محفوظ ہے۔`,
            )
          : t(
              `Thank you ${cleanName}! Your review is live (${maskedPhone}). You can edit it anytime with your number.`,
              `شکریہ ${cleanName}! آپ کا ریویو شائع ہو گیا (${maskedPhone})۔ آپ اپنے نمبر سے کبھی بھی اس میں تبدیلی کر سکتے ہیں۔`,
            ),
        type: 'success',
      });

      resetForm();
      setFormOpen(false);
    } catch (err) {
      console.error('Review save error:', err);
      setStatusMsg({
        text: t(
          'Could not save review. If editing an existing review, make sure you entered the exact same mobile number.',
          'ریویو محفوظ نہیں ہو سکا۔ تبدیلی کے لیے وہی موبائل نمبر درج کریں جو پہلے استعمال کیا تھا۔',
        ),
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const activeStar = hoverRating || rating;
  const visibleReviews = compact ? combinedReviews.slice(0, 6) : combinedReviews;
  const previewMasked = isValidPhoneInput(phoneInput) ? maskPhoneLast4(phoneInput) : '••••••1234';

  return (
    <section
      id="reviews"
      className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14"
    >
      {/* Header + Rating Summary Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-black/8 pb-6 sm:flex-row sm:items-end">
        <div>
          <p className={`text-xs font-bold text-[#EA4E1B] ${isUrdu ? 'font-urdu text-sm' : ''}`}>
            {t('Verified Customer Feedback', 'تصدیق شدہ کسٹمر ریویوز')}
          </p>
          <h2
            className={`font-display mt-1 text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl ${
              isUrdu ? 'font-urdu' : ''
            }`}
          >
            {t('Customer', 'کسٹمرز کی')}{' '}
            <span className="text-[#EA4E1B]">{t('Reviews & Ratings', 'رائے اور ریٹنگ')}</span>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
            <span className="inline-flex items-center gap-1 font-extrabold tabular-nums text-[#141414]">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {stats.average} / 5.0
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {stats.total} {t('reviews', 'ریویوز')}
            </span>
            <span aria-hidden="true">·</span>
            <span className={isUrdu ? 'font-urdu' : ''}>
              {t('Phone privacy: last 4 digits only', 'پرائیویسی: نمبر کے صرف آخری 4 ہندسے')}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={openWriteForm}
            className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#EA4E1B] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[#d44212] ${
              isUrdu ? 'font-urdu text-sm font-semibold' : ''
            }`}
          >
            <Star className="h-3.5 w-3.5 fill-white" aria-hidden="true" />
            <span>{t('Write a Review', 'ریویو لکھیں')}</span>
          </button>

          <button
            type="button"
            onClick={openEditLookup}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-black/15 bg-white px-4 text-xs font-semibold text-[#141414] transition hover:border-[#EA4E1B] hover:text-[#EA4E1B] ${
              isUrdu ? 'font-urdu text-sm' : ''
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('Edit My Review', 'اپنا ریویو بدلیں')}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusMsg && (
        <div
          className={`mt-5 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          } ${isUrdu ? 'font-urdu text-sm' : ''}`}
        >
          <span className="flex items-center gap-2">
            {statusMsg.type === 'success' && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            )}
            {statusMsg.text}
          </span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            aria-label="Dismiss"
            className="shrink-0 p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Write / Edit Review Form */}
      {formOpen && (
        <div
          id="customer-review-form"
          className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4">
            <div>
              <h3
                className={`font-display text-lg font-extrabold text-[#141414] ${
                  isUrdu ? 'font-urdu' : ''
                }`}
              >
                {editLookupMode
                  ? t('Find & Edit Your Review', 'اپنا ریویو تلاش کر کے تبدیل کریں')
                  : editingReviewId
                    ? t('Update Your Review', 'اپنا ریویو اپڈیٹ کریں')
                    : t('Rate Usman Mobile Repairing Centre', 'عثمان موبائل کو ریٹنگ دیں')}
              </h3>
              <p className={`mt-1 flex items-center gap-1.5 text-xs text-neutral-500 ${isUrdu ? 'font-urdu' : ''}`}>
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
                {t(
                  'Your full mobile number is never displayed — only the last 4 digits show publicly.',
                  'آپ کا پورا نمبر کبھی ظاہر نہیں ہوتا — صرف آخری 4 ہندسے دکھائے جاتے ہیں۔',
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                resetForm();
              }}
              aria-label={t('Close form', 'بند کریں')}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-[#141414]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {editLookupMode ? (
            <div className="mt-5 max-w-md space-y-3">
              <label className={`block text-xs font-bold text-neutral-700 ${isUrdu ? 'font-urdu' : ''}`}>
                {t(
                  'Enter the mobile number you used when writing your review:',
                  'وہ موبائل نمبر درج کریں جو آپ نے ریویو لکھتے وقت دیا تھا:',
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0300-1234567"
                  className="h-11 flex-1 rounded-xl border border-black/15 bg-[#F8F6F4] px-3.5 text-sm tabular-nums text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  disabled={lookingUp}
                  onClick={handleLookupByPhone}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#141414] px-5 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{lookingUp ? t('Checking...', 'تلاش...') : t('Find Review', 'تلاش کریں')}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="mt-5 space-y-5">
              {/* Interactive Star Rating Selector */}
              <div>
                <label className={`block text-xs font-bold text-neutral-700 ${isUrdu ? 'font-urdu' : ''}`}>
                  {t('Your Rating *', 'آپ کی ریٹنگ *')}
                </label>
                <div className="mt-2 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const filled = starVal <= activeStar;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(starVal)}
                        aria-label={`${starVal} star${starVal > 1 ? 's' : ''}`}
                        className="grid h-11 w-11 place-items-center rounded-xl border border-black/5 bg-[#F8F6F4] transition hover:scale-105 hover:border-amber-300 active:scale-95"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            filled ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                  <span
                    className={`ml-2 text-xs font-bold text-[#141414] ${
                      isUrdu ? 'font-urdu text-sm' : ''
                    }`}
                  >
                    {activeStar}/5 · {isUrdu ? STAR_LABELS_UR[activeStar] : STAR_LABELS_EN[activeStar]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={`block text-xs font-bold text-neutral-700 ${isUrdu ? 'font-urdu' : ''}`}>
                    {t('Your Name *', 'آپ کا نام *')}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t('e.g. Muhammad Bilal', 'مثلاً محمد بلال')}
                    className="mt-1.5 h-11 w-full rounded-xl border border-black/15 bg-[#F8F6F4] px-3.5 text-sm text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold text-neutral-700 ${isUrdu ? 'font-urdu' : ''}`}>
                    {editingReviewId
                      ? t('Verify Your Mobile Number *', 'اپنا موبائل نمبر تصدیق کریں *')
                      : t('Mobile Number (Private) *', 'موبائل نمبر (خفیہ) *')}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={18}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0300-1234567"
                    className="mt-1.5 h-11 w-full rounded-xl border border-black/15 bg-[#F8F6F4] px-3.5 text-sm tabular-nums text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500 tabular-nums">
                    {t('Public preview:', 'اس طرح نظر آئے گا:')}{' '}
                    <strong className="font-mono text-[#141414]">{previewMasked}</strong>
                  </p>
                </div>

                <div>
                  <label className={`block text-xs font-bold text-neutral-700 ${isUrdu ? 'font-urdu' : ''}`}>
                    {t('Service / Purchase', 'سروس یا خریداری')}
                  </label>
                  <select
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-black/15 bg-[#F8F6F4] px-3.5 text-sm text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  >
                    {SERVICE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold text-neutral-700 ${isUrdu ? 'font-urdu' : ''}`}>
                  {t('Write Your Review *', 'اپنا تجربہ لکھیں *')}
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t(
                    'Share your experience with our mobile repair, accessories, or used phones...',
                    'ہمارے موبائل ریپئرنگ، ایسسریز یا استعمال شدہ فونز کے بارے میں اپنی رائے لکھیں...',
                  )}
                  className={`mt-1.5 w-full rounded-xl border border-black/15 bg-[#F8F6F4] p-3.5 text-sm text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                />
                <div className="mt-1 text-right text-[11px] tabular-nums text-neutral-400">
                  {comment.length}/500
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#EA4E1B] px-7 text-sm font-bold text-white shadow-sm transition hover:bg-[#d44212] disabled:opacity-50 ${
                    isUrdu ? 'font-urdu' : ''
                  }`}
                >
                  {submitting
                    ? t('Saving...', 'محفوظ ہو رہا ہے...')
                    : editingReviewId
                      ? t('Update My Review', 'ریویو اپڈیٹ کریں')
                      : t('Submit Review', 'ریویو جمع کروائیں')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    resetForm();
                  }}
                  className="inline-flex h-11 items-center rounded-full border border-black/15 bg-white px-5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {t('Cancel', 'منسوخ')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Live Reviews Grid */}
      <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleReviews.map((review) => {
          const initials = review.customerName
            .split(' ')
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
          const isOwnDeviceReview = !review.isSeed && mySavedIds.includes(review.id);
          const wasEdited =
            !review.isSeed &&
            review.updatedAt &&
            review.createdAt &&
            review.updatedAt !== review.createdAt;

          return (
            <article
              key={review.id}
              className="flex flex-col justify-between rounded-2xl border border-black/6 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${
                          s <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-200'
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  {!review.isSeed && (
                    <button
                      type="button"
                      onClick={() => openEditForCard(review)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold transition ${
                        isOwnDeviceReview
                          ? 'text-[#EA4E1B] hover:underline'
                          : 'text-neutral-400 hover:text-[#141414]'
                      }`}
                      title={t('Edit with your phone number', 'اپنے نمبر سے ایڈٹ کریں')}
                    >
                      <Edit3 className="h-3 w-3" aria-hidden="true" />
                      <span>{isOwnDeviceReview ? t('Edit Mine', 'ایڈٹ') : t('Edit', 'ایڈٹ')}</span>
                    </button>
                  )}
                </div>

                <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                  “{review.comment}”
                </p>
              </div>

              <footer className="mt-4 flex items-center gap-3 border-t border-black/5 pt-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F3ECE6] text-xs font-extrabold text-[#EA4E1B]">
                  {initials || 'UM'}
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-xs font-bold text-[#141414]">
                    {review.customerName}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                    <span className="font-mono tabular-nums text-neutral-700">
                      {review.maskedPhone}
                    </span>
                    {review.service && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{review.service}</span>
                      </>
                    )}
                    {wasEdited && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-neutral-400">{t('Edited', 'تبدیل شدہ')}</span>
                      </>
                    )}
                  </div>
                </div>
              </footer>
            </article>
          );
        })}
      </div>
    </section>
  );
};
