import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  fullWidth?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  fullWidth = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Install Usman Mobile App"
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#141414]/15 bg-white font-semibold text-[#141414] shadow-xs transition-all duration-200 hover:border-[#EA4E1B] hover:text-[#EA4E1B] active:scale-95 ${
          fullWidth ? 'w-full h-10 px-4 text-xs' : compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-xs sm:text-sm'
        }`}
      >
        <Download className="h-3.5 w-3.5 shrink-0 text-[#EA4E1B]" aria-hidden="true" />
        <span>{compact ? 'Install' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-black/10 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="Usman Mobile App Icon"
                  className="h-12 w-12 rounded-2xl shadow-md"
                />
                <div>
                  <h3
                    id="pwa-install-guide-title"
                    className="font-display text-base font-extrabold text-[#141414]"
                  >
                    Install Usman Mobile
                  </h3>
                  <p className="text-[11px] font-medium text-neutral-500">
                    Fast mobile app · Offline ready
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="grid h-8 w-8 place-items-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 rounded-2xl bg-[#F8F6F4] p-4 text-xs text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#EA4E1B] text-[10px] font-bold text-white">
                    1
                  </span>
                  <span>
                    Tap the <strong className="inline-flex items-center gap-0.5 text-[#141414]"><Share className="inline h-3 w-3" /> Share</strong> button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#EA4E1B] text-[10px] font-bold text-white">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong className="text-[#141414]">Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#EA4E1B] text-[10px] font-bold text-white">
                    3
                  </span>
                  <span>
                    Tap <strong className="text-[#141414]">Add</strong> — Usman Mobile will appear on your home screen like a native app.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="mt-4 space-y-2.5 rounded-2xl bg-[#F8F6F4] p-4 text-xs text-neutral-700">
                <div className="flex items-center gap-2 font-bold text-[#141414]">
                  <Smartphone className="h-4 w-4 text-[#EA4E1B]" aria-hidden="true" />
                  <span>Add to Home Screen / Desktop</span>
                </div>
                <p className="leading-relaxed">
                  Open your browser menu (<strong className="text-[#141414]">⋮</strong> in Chrome/Edge) and tap{' '}
                  <strong className="text-[#141414]">Install App</strong> or{' '}
                  <strong className="text-[#141414]">Add to Home screen</strong>.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-full bg-[#EA4E1B] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d44212]"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
