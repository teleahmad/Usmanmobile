import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

export const REMOVED_IMAGE_MARKER = '__REMOVED__';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  fallbackSrc?: string;
  /** Set true only for above-the-fold hero imagery; defaults to lazy loading for fast page loads. */
  priority?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'h-full w-full object-cover',
  fallbackTitle,
  fallbackSrc,
  priority = false,
}) => {
  const [failed, setFailed] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFailed(false);
    setUsedFallback(false);
    setLoaded(false);
  }, [src]);

  const activeSrc = usedFallback && fallbackSrc ? fallbackSrc : src;

  // Cold-load wait before live Firestore media arrives — smooth shimmer instead of flashing old/deleted image
  if (!activeSrc) {
    return (
      <div
        aria-hidden="true"
        className={`${className} animate-pulse bg-[#EAE0D5]`}
      />
    );
  }

  // Permanently removed by Admin — never fall back to the old deleted photo
  if (activeSrc === REMOVED_IMAGE_MARKER) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} flex flex-col items-center justify-center bg-[#EFE7DF] px-4 text-center text-neutral-400`}
      >
        <ImageOff className="h-7 w-7 text-neutral-400/80" aria-hidden="true" />
        <span className="mt-2 text-xs font-medium text-neutral-500">
          Photo removed — upload a new image
        </span>
      </div>
    );
  }

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-full w-full flex-col items-center justify-center bg-slate-100 px-4 text-center text-slate-500"
      >
        <ImageOff className="h-6 w-6 text-slate-400" aria-hidden="true" />
        <span className="mt-2 text-xs font-medium text-slate-600">
          {fallbackTitle ?? alt}
        </span>
      </div>
    );
  }

  const isDataUrl = activeSrc.startsWith('data:');

  return (
    <img
      src={activeSrc}
      alt={alt}
      loading={priority || isDataUrl ? 'eager' : 'lazy'}
      decoding={priority || isDataUrl ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (!usedFallback && fallbackSrc && fallbackSrc !== src) {
          setUsedFallback(true);
          return;
        }
        setFailed(true);
      }}
      className={`${className} transition-opacity duration-200 ${
        loaded || priority || isDataUrl ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
};
