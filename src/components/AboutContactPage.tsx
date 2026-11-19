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
import {
  CUSTOMER_REVIEWS,
  SHOP_GALLERY,
  ShopGalleryPhoto,
  SITE_IMAGES,
} from '../data/catalogData';
import { ResilientImage } from './ResilientImage';

interface AboutContactPageProps {
  onOpenVirtualShop: (mode: ViewMode) => void;
}

export const AboutContactPage: React.FC<AboutContactPageProps> = ({
  onOpenVirtualShop,
}) => {
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
              <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-[#141414] sm:text-4xl">
                About <span className="text-[#EA4E1B]">Usman Mobile</span>
              </h1>
              <p dir="rtl" className="font-urdu mt-2 text-lg font-semibold text-neutral-700">
                {SHOP_CONFIG.URDU_NAME}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600 sm:text-base">
                Managed by <strong className="text-[#141414]">{SHOP_CONFIG.OWNER}</strong>
                , Usman Mobile Repairing Centre is your neighborhood shop in Chak No. 8
                for same-day smartphone repairs, tested mobile accessories, PTA keypad
                and Android phones, and daily Easypaisa, JazzCash &amp; bill payments.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-black/5 bg-neutral-100 shadow-xs">
                <ResilientImage
                  src={SITE_IMAGES.signboard}
                  alt="Usman Mobile Repairing Centre Main Bazar signboard"
                  className="h-full w-full object-cover"
                />
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
          {SHOP_GALLERY.map((photo) => (
            <figure
              key={photo.id}
              onClick={() => setLightboxPhoto(photo)}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-black/5 bg-white p-3 shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#EA4E1B]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-100">
                <ResilientImage
                  src={photo.src}
                  alt={photo.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
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

        {/* Client Reviews */}
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {CUSTOMER_REVIEWS.map((review) => (
            <blockquote
              key={review.id}
              className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-6 shadow-xs"
            >
              <p className="text-xs leading-relaxed text-neutral-600 sm:text-sm">
                “{review.quote}”
              </p>
              <footer className="mt-4 border-t border-neutral-100 pt-3">
                <div className="text-sm font-bold text-[#141414]">{review.name}</div>
                <div className="text-[11px] text-neutral-500">
                  {review.service} · {review.location}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

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
