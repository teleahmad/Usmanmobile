import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  /** Set true only for above-the-fold hero imagery; defaults to lazy loading for fast page loads. */
  priority?: boolean;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'h-full w-full object-cover',
  fallbackTitle,
  priority = false,
}) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`${className} transition-opacity duration-300 ${
        loaded || priority ? 'opacity-100' : 'opacity-0'
      }`}
    />
  );
};
