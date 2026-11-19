import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { getWhatsAppUrl, SHOP_CONFIG } from '../config/shopConfig';
import { useLanguage } from '../context/LanguageContext';

interface FloatingWhatsAppButtonProps {
  hidden?: boolean;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  hidden = false,
}) => {
  const { t, isUrdu } = useLanguage();
  const [open, setOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  if (hidden) return null;

  const openWhatsApp = (message: string) => {
    const link = document.createElement('a');
    link.href = getWhatsAppUrl(message);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg =
      customMsg.trim() ||
      'Assalam o Alaikum Usman Mobile, mujhe accessories ya repairing ke bare me maloomat chahiye.';
    openWhatsApp(msg);
    setCustomMsg('');
  };

  const quickTopics = [
    {
      label: t('Ask Accessory Price', 'ایسسریز کی قیمت پوچھیں'),
      message: 'Assalam o Alaikum Usman Mobile! Mujhe accessories / charger / AirPods ki price maloom karni hai.',
    },
    {
      label: t('Book Mobile Repair', 'موبائل ریپئرنگ کا ریٹ پوچھیں'),
      message: 'Assalam o Alaikum Usman Mobile! Mujhe apne mobile ki repair / LCD rate pochna hai.',
    },
    {
      label: t('Used Phones Stock', 'استعمال شدہ فونز کا اسٹاک'),
      message: 'Assalam o Alaikum Usman Mobile! Aap ke paas aaj konse used / second-hand phones available hain?',
    },
  ];

  return (
    <div className="fixed right-4 bottom-[86px] z-40 flex flex-col items-end md:right-6 md:bottom-6">
      {open && (
        <div
          role="dialog"
          aria-label={t('WhatsApp Quick Chat', 'واٹس ایپ کوئیک چیٹ')}
          className="mb-3 w-[300px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl sm:w-[320px]"
        >
          {/* Compact WhatsApp Header */}
          <div className="flex items-center justify-between bg-[#15803D] px-4 py-3 text-white">
            <div className="min-w-0">
              <p className={`text-sm font-bold leading-tight ${isUrdu ? 'font-urdu' : ''}`}>
                {t('Usman Mobile WhatsApp', 'عثمان موبائل واٹس ایپ')}
              </p>
              <p className="mt-0.5 text-[11px] text-white/85 tabular-nums">
                {SHOP_CONFIG.PHONES[0]} · {t('Fast reply', 'فوری جواب')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('Close chat', 'بند کریں')}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Quick 1-Tap Topics */}
          <div className="bg-[#F8F6F4] p-3.5 space-y-2">
            <p className={`text-[11px] font-medium text-neutral-600 ${isUrdu ? 'font-urdu text-right' : ''}`}>
              {t('Tap a topic or type your message:', 'کوئی آپشن منتخب کریں یا پیغام لکھیں:')}
            </p>
            <div className="flex flex-col gap-1.5">
              {quickTopics.map((topic) => (
                <button
                  key={topic.label}
                  type="button"
                  onClick={() => openWhatsApp(topic.message)}
                  className={`w-full rounded-xl border border-black/8 bg-white px-3 py-2 text-xs font-semibold text-[#141414] transition hover:border-[#16A34A] hover:text-[#15803D] ${
                    isUrdu ? 'font-urdu text-right' : 'text-left'
                  }`}
                >
                  {topic.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5 border-t border-black/5 bg-white p-2.5">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder={t('Type message...', 'پیغام لکھیں...')}
              className={`h-9 flex-1 rounded-full border border-black/10 bg-[#F8F6F4] px-3.5 text-xs text-[#141414] placeholder:text-neutral-400 focus:border-[#16A34A] focus:bg-white focus:outline-none ${
                isUrdu ? 'font-urdu text-right' : ''
              }`}
            />
            <button
              type="submit"
              aria-label={t('Send on WhatsApp', 'واٹس ایپ پر بھیجیں')}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#16A34A] text-white transition hover:bg-[#15803D] active:scale-95"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}

      {/* Primary Floating WhatsApp Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t('WhatsApp Quick Chat', 'واٹس ایپ پر رابطہ کریں')}
        aria-expanded={open}
        className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#16A34A] px-3.5 text-white shadow-[0_10px_28px_rgba(22,163,74,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#15803D] active:scale-95 md:h-13 md:px-4"
      >
        {open ? (
          <X className="h-5 w-5 shrink-0" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-5 w-5 shrink-0 fill-white/20" aria-hidden="true" />
        )}
        <span
          className={`hidden whitespace-nowrap text-xs font-bold sm:inline ${
            isUrdu ? 'font-urdu text-sm font-semibold' : ''
          }`}
        >
          {open ? t('Close', 'بند کریں') : t('WhatsApp Chat', 'واٹس ایپ چیٹ')}
        </span>
      </button>
    </div>
  );
};
