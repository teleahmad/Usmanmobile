import React, { useMemo, useState } from 'react';
import {
  BatteryCharging,
  Box,
  CheckCircle2,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { SHOP_CONFIG } from '../config/shopConfig';
import { useLanguage } from '../context/LanguageContext';
import { formatPkr } from '../data/catalogData';
import {
  buildUsedPhoneWhatsAppUrl,
  PTA_STATUS_OPTIONS,
  UsedPhoneItem,
} from '../data/usedPhonesData';
import { ResilientImage } from './ResilientImage';

interface UsedPhonesSectionProps {
  usedPhones: UsedPhoneItem[];
  compact?: boolean;
  onViewAll?: () => void;
}

export const UsedPhonesSection: React.FC<UsedPhonesSectionProps> = ({
  usedPhones,
  compact = false,
  onViewAll,
}) => {
  const { t, isUrdu } = useLanguage();
  const [ptaFilter, setPtaFilter] = useState<'All' | string>('All');
  const [selectedPhone, setSelectedPhone] = useState<UsedPhoneItem | null>(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  const filteredPhones = useMemo(() => {
    const list =
      ptaFilter === 'All'
        ? usedPhones
        : usedPhones.filter((p) => p.ptaStatus === ptaFilter);
    return compact ? list.slice(0, 3) : list;
  }, [usedPhones, ptaFilter, compact]);

  const handleInspect = (phone: UsedPhoneItem) => {
    setActivePhotoIdx(0);
    setSelectedPhone(phone);
  };

  return (
    <section
      id="used-phones"
      className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14"
    >
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className={`text-xs font-bold text-[#EA4E1B] ${isUrdu ? 'font-urdu text-sm' : ''}`}>
            {t(
              'Shop-Tested Pre-Owned Stock · 3-Day Check Warranty',
              'دکان پر چیک شدہ استعمال شدہ موبائل · 3 دن چیک وارنٹی',
            )}
          </p>
          <h2
            className={`font-display mt-1 text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl ${
              isUrdu ? 'font-urdu' : ''
            }`}
          >
            {t('Used & Second-Hand', 'استعمال شدہ')}{' '}
            <span className="text-[#EA4E1B]">{t('Phones', 'اسمارٹ فونز')}</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!compact && (
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {['All', ...PTA_STATUS_OPTIONS].map((status) => {
                const active = ptaFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setPtaFilter(status)}
                    className={`h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition ${
                      active
                        ? 'bg-[#141414] text-white'
                        : 'bg-white text-neutral-700 hover:text-[#EA4E1B]'
                    }`}
                  >
                    {status === 'All' ? t('All Stock', 'سب فونز') : status}
                  </button>
                );
              })}
            </div>
          )}

          {compact && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className={`inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-[#141414] px-5 text-xs font-semibold text-white transition hover:bg-neutral-800 ${
                isUrdu ? 'font-urdu text-sm' : ''
              }`}
            >
              {t(`View All (${usedPhones.length})`, `تمام فونز دیکھیں (${usedPhones.length})`)}
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredPhones.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-black/5 bg-white p-10 text-center">
          <Smartphone className="mx-auto h-8 w-8 text-neutral-400" aria-hidden="true" />
          <p className="mt-3 text-sm font-bold text-[#141414]">
            {t('No used phones match this filter right now.', 'اس وقت اس کیٹیگری میں کوئی فون موجود نہیں۔')}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {t(
              'Message us on WhatsApp to ask about fresh arrivals at our Chak No. 8 shop.',
              'نئے اسٹاک کی معلومات کے لیے واٹس ایپ پر میسج کریں۔',
            )}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPhones.map((phone) => {
            const coverPhoto = phone.photos[0] || '';
            const savings =
              phone.marketPricePkr && phone.marketPricePkr > phone.pricePkr
                ? phone.marketPricePkr - phone.pricePkr
                : 0;

            return (
              <article
                key={phone.id}
                onClick={() => handleInspect(phone)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-black/6 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#EA4E1B] hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F8F6F4]">
                  {coverPhoto ? (
                    <ResilientImage
                      src={coverPhoto}
                      alt={phone.title}
                      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                        !phone.available ? 'grayscale opacity-65' : ''
                      }`}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-neutral-400">
                      <Smartphone className="h-10 w-10" aria-hidden="true" />
                    </div>
                  )}

                  {!phone.available && (
                    <div className="absolute inset-0 grid place-items-center bg-black/45">
                      <span className="rounded-lg bg-white px-3.5 py-1.5 text-xs font-extrabold tracking-wide text-[#141414]">
                        {t('SOLD OUT', 'فروخت ہو چکا')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    {/* Clean Unboxed Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                      <span className="font-bold text-[#141414]">{phone.brand}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          phone.ptaStatus === 'PTA Approved' ||
                          phone.ptaStatus === 'Official Warranty'
                            ? 'font-semibold text-emerald-700'
                            : 'font-semibold text-amber-700'
                        }
                      >
                        {phone.ptaStatus}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{phone.condition}</span>
                    </div>

                    <h3 className="font-display mt-1.5 text-base font-extrabold leading-snug text-[#141414] group-hover:text-[#EA4E1B]">
                      {phone.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-baseline gap-2">
                      <span className="font-display text-lg font-extrabold tabular-nums text-[#EA4E1B]">
                        {formatPkr(phone.pricePkr)}
                      </span>
                      {savings > 0 && phone.marketPricePkr && (
                        <span className="text-xs text-neutral-400 line-through tabular-nums">
                          {formatPkr(phone.marketPricePkr)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
                      <span>{phone.storage}</span>
                      {phone.batteryHealth && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Battery: {phone.batteryHealth}</span>
                        </>
                      )}
                      {phone.photos.length > 1 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{phone.photos.length} photos</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/5 pt-3.5">
                    <span className="truncate text-[11px] text-neutral-500">
                      {phone.accessories || t('Shop checked', 'دکان پر چیک شدہ')}
                    </span>
                    <span className="shrink-0 text-xs font-bold text-[#EA4E1B]">
                      {t('Details →', 'تفصیل →')}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Detailed Multi-Photo Modal */}
      {selectedPhone && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-black/65 p-3 backdrop-blur-xs sm:p-6"
          onClick={() => setSelectedPhone(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedPhone.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white/95 px-5 py-3.5 backdrop-blur-md">
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#EA4E1B]">
                  {selectedPhone.brand} · {selectedPhone.ptaStatus}
                </p>
                <h3 className="font-display truncate text-base font-extrabold text-[#141414]">
                  {selectedPhone.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhone(null)}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 md:grid-cols-12">
              {/* Multi-Photo Gallery */}
              <div className="md:col-span-6 space-y-3">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#F8F6F4]">
                  <ResilientImage
                    src={selectedPhone.photos[activePhotoIdx] || selectedPhone.photos[0] || ''}
                    alt={selectedPhone.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                {selectedPhone.photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {selectedPhone.photos.map((photoUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                          activePhotoIdx === idx
                            ? 'border-[#EA4E1B]'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <ResilientImage
                          src={photoUrl}
                          alt={`${selectedPhone.title} view ${idx + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Specs & Direct Booking */}
              <div className="flex flex-col justify-between md:col-span-6">
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-display text-2xl font-extrabold tabular-nums text-[#EA4E1B]">
                      {formatPkr(selectedPhone.pricePkr)}
                    </span>
                    {selectedPhone.marketPricePkr &&
                      selectedPhone.marketPricePkr > selectedPhone.pricePkr && (
                        <span className="text-sm text-neutral-400 line-through tabular-nums">
                          {formatPkr(selectedPhone.marketPricePkr)}
                        </span>
                      )}
                  </div>

                  <p className="mt-1 text-xs font-semibold text-neutral-600">
                    {selectedPhone.available
                      ? t('Available at Hussain Khan Wala shop', 'حسین خان والا دکان پر دستیاب ہے')
                      : t('Currently Sold Out', 'فروخت ہو چکا ہے')}
                  </p>

                  <dl className="mt-4 divide-y divide-black/5 rounded-2xl border border-black/6 bg-[#F8F6F4] px-4 py-1 text-xs">
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-neutral-500">{t('PTA Status', 'پی ٹی اے اسٹیٹس')}</dt>
                      <dd className="font-bold text-[#141414]">{selectedPhone.ptaStatus}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-neutral-500">{t('Condition', 'کنڈیشن')}</dt>
                      <dd className="font-bold text-[#141414]">{selectedPhone.condition}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-neutral-500">{t('Storage / RAM', 'اسٹوریج / ریم')}</dt>
                      <dd className="font-bold text-[#141414]">{selectedPhone.storage}</dd>
                    </div>
                    {selectedPhone.batteryHealth && (
                      <div className="flex items-center justify-between py-2.5">
                        <dt className="flex items-center gap-1.5 text-neutral-500">
                          <BatteryCharging className="h-3.5 w-3.5 text-[#EA4E1B]" aria-hidden="true" />
                          {t('Battery Health', 'بیٹری ہیلتھ')}
                        </dt>
                        <dd className="font-bold text-[#141414]">{selectedPhone.batteryHealth}</dd>
                      </div>
                    )}
                    {selectedPhone.accessories && (
                      <div className="flex items-center justify-between py-2.5">
                        <dt className="flex items-center gap-1.5 text-neutral-500">
                          <Box className="h-3.5 w-3.5 text-[#EA4E1B]" aria-hidden="true" />
                          {t('Box / Charger', 'باکس / چارجر')}
                        </dt>
                        <dd className="font-bold text-[#141414]">{selectedPhone.accessories}</dd>
                      </div>
                    )}
                    {selectedPhone.warrantyNote && (
                      <div className="flex items-center justify-between py-2.5">
                        <dt className="flex items-center gap-1.5 text-neutral-500">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          {t('Check Warranty', 'چیک وارنٹی')}
                        </dt>
                        <dd className="font-bold text-emerald-700">{selectedPhone.warrantyNote}</dd>
                      </div>
                    )}
                  </dl>

                  {selectedPhone.notes && (
                    <p className="mt-4 text-xs leading-relaxed text-neutral-600">
                      {selectedPhone.notes}
                    </p>
                  )}
                </div>

                <div className="mt-6 space-y-2.5">
                  <a
                    href={buildUsedPhoneWhatsAppUrl(selectedPhone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#16A34A] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#15803D]"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {selectedPhone.available
                        ? t('Book / Ask on WhatsApp', 'واٹس ایپ پر بک کریں / پوچھیں')
                        : t('Ask for Similar Phone on WhatsApp', 'اسی طرح کا فون پوچھیں')}
                    </span>
                  </a>
                  <a
                    href={`tel:${SHOP_CONFIG.PHONES[0].replace(/-/g, '')}`}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-5 text-xs font-bold text-[#141414] transition hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">
                      {t('Call Shop:', 'کال کریں:')} {SHOP_CONFIG.PHONES[0]}
                    </span>
                  </a>
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                    {t('Inspect live at Main Bazar counter before paying', 'ادائیگی سے پہلے دکان پر خود چیک کریں')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
