import React, { useState } from 'react';
import { CheckCircle2, Clock, MessageCircle, Search, ShieldCheck, Smartphone, Wrench } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { SHOP_CONFIG } from '../config/shopConfig';
import {
  buildRepairQuoteWhatsAppUrl,
  DIGITAL_SERVICES,
  formatPkr,
  PHONE_BRANDS,
  REPAIR_SERVICES,
} from '../data/catalogData';
import { db } from '../firebase';

export const RepairsPage: React.FC = () => {
  const [brand, setBrand] = useState<string>(PHONE_BRANDS[0]);
  const [model, setModel] = useState('');
  const [serviceId, setServiceId] = useState(REPAIR_SERVICES[0].id);
  const [customerName, setCustomerName] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [submittedQuote, setSubmittedQuote] = useState<{
    brand: string;
    model: string;
    serviceTitle: string;
    whatsappUrl: string;
  } | null>(null);

  const selectedService =
    REPAIR_SERVICES.find((s) => s.id === serviceId) ?? REPAIR_SERVICES[0];

  const handleSelectServiceRow = (id: string) => {
    setServiceId(id);
    document
      .getElementById('repair-quote-form')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildRepairQuoteWhatsAppUrl({
      brand,
      model,
      serviceTitle: selectedService.title,
      issueNotes,
      customerName,
    });

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();

    setSubmittedQuote({
      brand,
      model: model.trim() || 'Model to confirm',
      serviceTitle: selectedService.title,
      whatsappUrl: url,
    });
  };

  // Customer Live Repair Tracker state
  const [trackToken, setTrackToken] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackToken.trim()) return;
    setTrackingLoading(true);
    setTrackError('');
    setTrackResult(null);

    try {
      const cleanToken = trackToken.trim().toUpperCase();
      const q = query(collection(db, 'repairs'), where('token', '==', cleanToken));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTrackResult(snap.docs[0].data());
      } else {
        setTrackError(
          `No repair ticket found for "${cleanToken}". Please verify token (e.g. UMR-1024) or contact our shop on WhatsApp.`,
        );
      }
    } catch (err) {
      console.warn('Track query:', err);
      setTrackError('Could not query tracking. Please check your connection or contact us.');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="bg-[#F3ECE6] text-[#141414]">
      {/* Header */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <p className="text-xs font-semibold text-[#EA4E1B]">
            Free Fault Check · Same-Day Service in Chak No. 8
          </p>
          <h1 className="font-display mt-1.5 text-3xl font-extrabold tracking-tight text-[#141414] sm:text-4xl">
            Mobile <span className="text-[#EA4E1B]">Repair Lab</span> &amp; Digital Desk
          </h1>
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Select any repair service below to view estimated starting rates and send
            your handset model straight to Usman Sarwar on WhatsApp.
          </p>

          {/* Real-time Customer Repair Status Tracker Box */}
          <div className="mt-8 rounded-2xl border border-black/10 bg-[#F3ECE6]/60 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#141414] flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#EA4E1B]" />
                  <span>Track Your Repair Status (اپنے موبائل کا اسٹیٹس چیک کریں)</span>
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Enter your tracking token receipt number (e.g. UMR-1024) to see live progress.
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={trackToken}
                  onChange={(e) => setTrackToken(e.target.value)}
                  placeholder="e.g. UMR-2048"
                  className="rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-mono uppercase focus:border-[#EA4E1B] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="rounded-xl bg-[#EA4E1B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#d44212] disabled:opacity-50"
                >
                  {trackingLoading ? 'Checking...' : 'Track'}
                </button>
              </form>
            </div>

            {trackError && (
              <div className="mt-3 text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {trackError}
              </div>
            )}

            {trackResult && (
              <div className="mt-4 rounded-xl bg-white p-4 border border-black/5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#EA4E1B] bg-[#EA4E1B]/10 px-2.5 py-1 rounded-md">
                      {trackResult.token}
                    </span>
                    <span className="ml-2.5 text-sm font-bold text-[#141414]">
                      {trackResult.deviceModel}
                    </span>
                    <span className="ml-2 text-xs text-neutral-500">({trackResult.customerName})</span>
                  </div>
                  <div className="text-xs font-bold text-neutral-700">
                    Estimated: {formatPkr(trackResult.costPkr)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-neutral-500">Fault:</span>
                    <span>{trackResult.issue}</span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="font-semibold text-neutral-500">Status:</span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded-full text-xs uppercase ${
                        trackResult.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-800'
                          : trackResult.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : trackResult.status === 'delivered'
                          ? 'bg-neutral-100 text-neutral-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {trackResult.status === 'ready'
                        ? 'Ready for Pickup (تیار ہے)'
                        : trackResult.status === 'in_progress'
                        ? 'In Lab Repair (کام جاری ہے)'
                        : trackResult.status === 'delivered'
                        ? 'Delivered (حوالے کر دیا گیا)'
                        : 'Received at Shop (موصول ہوا)'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Repair Rates + Quote Form */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left: Service Cards */}
          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl font-extrabold text-[#141414]">
              Repair <span className="text-[#EA4E1B]">Rates</span>
            </h2>
            <p className="mt-1 text-xs text-neutral-600">
              Click any service to pre-fill the quote form.
            </p>

            <div className="mt-6 space-y-3.5">
              {REPAIR_SERVICES.map((service) => {
                const isSelected = serviceId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelectServiceRow(service.id)}
                    className={`w-full rounded-2xl border p-5 text-left transition-all ${
                      isSelected
                        ? 'border-[#EA4E1B] bg-[#EA4E1B] text-white shadow-md'
                        : 'border-black/5 bg-white text-[#141414] shadow-xs hover:border-[#EA4E1B]'
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                      <h3 className="text-base font-bold">{service.title}</h3>
                      <span
                        className={`font-display shrink-0 text-sm font-extrabold tabular-nums ${
                          isSelected ? 'text-white' : 'text-[#EA4E1B]'
                        }`}
                      >
                        From {formatPkr(service.startingPricePkr)}
                      </span>
                    </div>

                    <p
                      className={`mt-1.5 text-xs leading-relaxed ${
                        isSelected ? 'text-white/90' : 'text-neutral-600'
                      }`}
                    >
                      {service.summary}
                    </p>

                    <div
                      className={`mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-medium ${
                        isSelected ? 'text-white/85' : 'text-neutral-500'
                      }`}
                    >
                      <span>Time: {service.turnaround}</span>
                      <span aria-hidden="true">·</span>
                      <span>{service.warranty}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: WhatsApp Quote Form */}
          <div className="lg:sticky lg:top-24 lg:col-span-5">
            <form
              id="repair-quote-form"
              onSubmit={handleSubmitQuote}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7"
            >
              <p className="text-xs font-bold text-[#EA4E1B]">
                Direct WhatsApp · {SHOP_CONFIG.PHONES[0]}
              </p>
              <h2 className="font-display mt-1 text-2xl font-extrabold text-[#141414]">
                Get Repair Quote
              </h2>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="repair-brand"
                    className="block text-xs font-bold text-neutral-700"
                  >
                    Phone Brand
                  </label>
                  <select
                    id="repair-brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-[#F8F6F4] px-3 text-sm text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  >
                    {PHONE_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="repair-model"
                    className="block text-xs font-bold text-neutral-700"
                  >
                    Phone Model
                  </label>
                  <input
                    id="repair-model"
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Infinix Hot 40, Samsung A15, iPhone 11"
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-[#F8F6F4] px-3 text-sm text-[#141414] placeholder:text-neutral-400 focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="repair-service"
                    className="block text-xs font-bold text-neutral-700"
                  >
                    Repair Needed
                  </label>
                  <select
                    id="repair-service"
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-[#F8F6F4] px-3 text-sm text-[#141414] focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  >
                    {REPAIR_SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} (From {formatPkr(s.startingPricePkr)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="repair-name"
                    className="block text-xs font-bold text-neutral-700"
                  >
                    Your Name (optional)
                  </label>
                  <input
                    id="repair-name"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-[#F8F6F4] px-3 text-sm text-[#141414] placeholder:text-neutral-400 focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="repair-notes"
                    className="block text-xs font-bold text-neutral-700"
                  >
                    Extra Details (optional)
                  </label>
                  <textarea
                    id="repair-notes"
                    rows={3}
                    value={issueNotes}
                    onChange={(e) => setIssueNotes(e.target.value)}
                    placeholder="e.g. Display black but phone rings, or loose charging port"
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-[#F8F6F4] px-3 py-2 text-sm text-[#141414] placeholder:text-neutral-400 focus:border-[#EA4E1B] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs">
                <span className="text-neutral-500">Typical Time</span>
                <span className="font-bold text-[#141414]">
                  {selectedService.turnaround}
                </span>
              </div>

              <button
                type="submit"
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#EA4E1B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#d44212]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Send Quote on WhatsApp
              </button>

              {submittedQuote && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs text-green-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-green-700"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold">
                        Ready for {submittedQuote.brand} {submittedQuote.model}
                      </p>
                      <p className="mt-0.5 text-green-900">
                        {submittedQuote.serviceTitle}.{' '}
                        <a
                          href={submittedQuote.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold underline"
                        >
                          Open WhatsApp again
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Digital Services */}
      <section className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <h2 className="font-display text-2xl font-extrabold text-[#141414] sm:text-3xl">
          Easypaisa, JazzCash &amp; <span className="text-[#EA4E1B]">Bill Counter</span>
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DIGITAL_SERVICES.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-black/5 bg-white p-6 shadow-xs"
            >
              <div>
                <h3 className="text-base font-bold text-[#141414]">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
                  {item.details}
                </p>
              </div>
              <p className="mt-5 border-t border-neutral-100 pt-3 text-xs font-bold text-[#EA4E1B]">
                {item.availability}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
