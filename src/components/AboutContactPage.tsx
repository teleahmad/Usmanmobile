import React, { useState } from 'react';
import {
  Clock,
  Compass,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';
import { getWhatsAppUrl, SHOP_CONFIG, ViewMode } from '../config/shopConfig';
import { useLanguage } from '../context/LanguageContext';
import {
  SHOP_GALLERY,
  ShopGalleryPhoto,
  SITE_IMAGES,
} from '../data/catalogData';
import { LiveCustomerReview } from '../hooks/useLiveStoreData';
import { CustomerReviewsSection } from './CustomerReviewsSection';
import { ResilientImage } from './ResilientImage';

interface AboutContactPageProps {
  siteImages?: Record<keyof typeof SITE_IMAGES, string>;
  shopGallery?: ShopGalleryPhoto[];
  liveReviews?: LiveCustomerReview[];
  onOpenVirtualShop: (mode: ViewMode) => void;
}

export const AboutContactPage: React.FC<AboutContactPageProps> = ({
  siteImages = SITE_IMAGES,
  shopGallery = SHOP_GALLERY,
  liveReviews = [],
  onOpenVirtualShop,
}) => {
  const { t, isUrdu } = useLanguage();
  const [lightboxPhoto, setLightboxPhoto] = useState<ShopGalleryPhoto | null>(null);

  return (
    <div className="bg-[#F3ECE6] text-[#141414]">
      {/* About Hero */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-bold text-[#EA4E1B]">
                Main Bazar · Hussain Khan Wala, Chak No. 8, Pattoki
              </p>
              <h1
                className={`font-display mt-2 text-3xl font-extrabold tracking-tight text-[#141414] sm:text-4xl ${
                  isUrdu ? 'font-urdu' : ''
                }`}
              >
                {t('About', 'تعارف')}{' '}
                <span className="text-[#EA4E1B]">{t('Usman Mobile', 'عثمان موبائل')}</span>
              </h1>
              <p dir="rtl" className="font-urdu mt-2 text-lg font-semibold text-neutral-700">
                {SHOP_CONFIG.URDU_NAME}
              </p>
              <p
                className={`mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base ${
                  isUrdu ? 'font-urdu' : ''
                }`}
              >
                {t(
                  `Managed by ${SHOP_CONFIG.OWNER}, Usman Mobile Repairing Centre is your neighborhood shop in Chak No. 8 for same-day smartphone repairs, tested mobile accessories, used & PTA phones, and daily Easypaisa, JazzCash & bill payments.`,
                  `${SHOP_CONFIG.OWNER} کی زیر نگرانی، عثمان موبائل اینڈ ریپئرنگ سینٹر چک نمبر 8 میں ایک ہی دن میں موبائل ریپئرنگ، معیاری ایسسریز، استعمال شدہ فونز، اور روزانہ ایزی پیسہ، جاز کیش اور بل ادائیگی کی خدمات فراہم کرتا ہے۔`,
                )}
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="relative aspect-[8/3] w-full overflow-hidden rounded-2xl bg-white">
                <ResilientImage
                  src={siteImages.signboard}
                  alt="Usman Mobile Repairing Centre Main Bazar signboard"
                  priority
                  className="h-full w-full object-cover"
                />
                {/* Seamless 4-side feathered blur & smooth white dissolve without clipping signboard edges */}
                <div className="pointer-events-none absolute inset-0 backdrop-blur-[2px] [-webkit-mask-image:radial-gradient(ellipse_82%_78%_at_center,transparent_66%,black_100%)] [mask-image:radial-gradient(ellipse_82%_78%_at_center,transparent_66%,black_100%)]" />
                <div className="pointer-events-none absolute -inset-px rounded-2xl shadow-[inset_0_0_16px_10px_#ffffff]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Shop Photo Gallery */}
      <section className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 className="font-display text-2xl font-extrabold text-[#141414] sm:text-3xl">
            Real Shop <span className="text-[#EA4E1B]">Gallery</span>
          </h2>
          <p className="text-xs text-neutral-600">Click any photo to view full size</p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shopGallery.map((photo) => (
            <figure
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-black/5 bg-white p-3 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#EA4E1B]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-white">
                <ResilientImage
                  src={photo.src}
                  alt={photo.title}
                  className="h-full w-full scale-[1.02] object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                />
                {/* Seamless 4-side feathered blur & smooth white dissolve (zero corner artifacts) */}
                <div className="pointer-events-none absolute inset-0 backdrop-blur-[2.5px] [-webkit-mask-image:radial-gradient(ellipse_74%_70%_at_center,transparent_58%,black_100%)] [mask-image:radial-gradient(ellipse_74%_70%_at_center,transparent_58%,black_100%)]" />
                <div className="pointer-events-none absolute -inset-px rounded-xl shadow-[inset_0_0_24px_14px_#ffffff]" />
              </div>
              <figcaption className="px-1 pt-3 pb-1">
                <div className="text-sm font-bold text-[#141414]">{photo.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  {photo.caption}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Contact & 3D Map Split */}
      <section
        id="contact"
        className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20"
      >
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-xs sm:p-8 lg:col-span-6">
            <p className="text-xs font-bold text-[#EA4E1B]">Contact Us</p>
            <h2 className="font-display mt-1 text-2xl font-extrabold text-[#141414] sm:text-3xl">
              Visit or Message Directly
            </h2>

            <dl className="mt-6 space-y-5 text-sm text-neutral-700">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
                <div>
                  <dt className="font-bold text-[#141414]">Address</dt>
                  <dd className="mt-0.5 text-neutral-600">{SHOP_CONFIG.ADDRESS}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
                <div>
                  <dt className="font-bold text-[#141414]">Shop Timings</dt>
                  <dd className="mt-0.5 tabular-nums text-neutral-600">
                    {SHOP_CONFIG.HOURS}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
                <div>
                  <dt className="font-bold text-[#141414]">Call / WhatsApp</dt>
                  <dd className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
                    {SHOP_CONFIG.PHONES.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone.replace(/-/g, '')}`}
                        className="font-bold text-[#141414] hover:text-[#EA4E1B]"
                      >
                        {phone}
                      </a>
                    ))}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
                <div>
                  <dt className="font-bold text-[#141414]">Email</dt>
                  <dd className="mt-0.5">
                    <a
                      href={`mailto:${SHOP_CONFIG.EMAIL}`}
                      className="text-neutral-600 hover:text-[#EA4E1B]"
                    >
                      {SHOP_CONFIG.EMAIL}
                    </a>
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-6">
              <a
                href={getWhatsAppUrl('Assalam o Alaikum Usman Mobile')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#EA4E1B] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#d44212]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                WhatsApp Now
              </a>
              <a
                href={SHOP_CONFIG.MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-[#141414] transition-colors hover:border-[#EA4E1B] hover:text-[#EA4E1B]"
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                Google Maps
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-black/5 bg-white p-3 shadow-xs lg:col-span-6">
            <div className="aspect-[16/10] w-full overflow-hidden rounded-xl bg-neutral-100 lg:flex-1">
              <ResilientImage
                src={SITE_IMAGES.aerialMap}
                alt="Interactive 3D village map of Hussain Khan Wala"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-4 sm:p-5">
              <h3 className="font-display text-xl font-extrabold text-[#141414]">
                Explore Interactive <span className="text-[#EA4E1B]">3D Map</span>
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                View Main Bazar, Member Chowk, Taiba Chowk, and zoom straight inside our
                3D shopfront and counter.
              </p>
              <button
                type="button"
                onClick={() => onOpenVirtualShop('map')}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-[#141414] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#EA4E1B]"
              >
                <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
                Open Interactive 3D Map
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Customer Reviews & Ratings */}
      <CustomerReviewsSection liveReviews={liveReviews} />

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={lightboxPhoto.title}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-neutral-950"
          >
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              aria-label="Close photo preview"
              className="absolute top-3 right-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-white hover:bg-[#EA4E1B]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex max-h-[75vh] items-center justify-center bg-black">
              <ResilientImage
                src={lightboxPhoto.src}
                alt={lightboxPhoto.title}
                className="max-h-[75vh] w-full object-contain"
              />
            </div>
            <div className="border-t border-white/10 px-6 py-4 text-white">
              <h3 className="text-base font-bold">{lightboxPhoto.title}</h3>
              <p className="mt-1 text-xs text-neutral-300">{lightboxPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
