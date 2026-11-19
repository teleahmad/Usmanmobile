import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export type SocialPlatformKey = 'tiktok' | 'youtube' | 'facebook' | 'instagram' | 'x';

export interface SocialLinksConfig {
  tiktok: string;
  youtube: string;
  facebook: string;
  instagram: string;
  x: string;
  updatedAt?: string;
}

export const DEFAULT_SOCIAL_LINKS: SocialLinksConfig = {
  tiktok: '',
  youtube: '',
  facebook: '',
  instagram: '',
  x: '',
};

export function normalizeSocialUrl(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    return '';
  }
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const SOCIAL_PLATFORMS: Array<{
  key: SocialPlatformKey;
  label: string;
  placeholder: string;
  hoverClass: string;
  activeBgClass: string;
}> = [
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://www.tiktok.com/@usmanmobile',
    hoverClass: 'hover:bg-[#111111] hover:text-white hover:border-[#111111]',
    activeBgClass: 'bg-[#111111] text-white border-[#111111] hover:bg-[#262626]',
  },
  {
    key: 'youtube',
    label: 'YouTube',
    placeholder: 'https://www.youtube.com/@usmanmobile',
    hoverClass: 'hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]',
    activeBgClass: 'bg-[#FF0000] text-white border-[#FF0000] hover:bg-[#DC0000]',
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://www.facebook.com/usmanmobile',
    hoverClass: 'hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]',
    activeBgClass: 'bg-[#1877F2] text-white border-[#1877F2] hover:bg-[#1464CC]',
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://www.instagram.com/usmanmobile',
    hoverClass:
      'hover:bg-gradient-to-tr hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:text-white hover:border-transparent',
    activeBgClass:
      'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white border-transparent hover:opacity-90',
  },
  {
    key: 'x',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/usmanmobile',
    hoverClass: 'hover:bg-[#0F1419] hover:text-white hover:border-[#0F1419]',
    activeBgClass: 'bg-[#0F1419] text-white border-[#0F1419] hover:bg-neutral-800',
  },
];

export const SocialBrandIcon: React.FC<{ platform: SocialPlatformKey; className?: string }> = ({
  platform,
  className = 'h-4 w-4',
}) => {
  switch (platform) {
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.52V8.48L15.82 12l-6.07 3.52z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
  }
};

interface SocialLinksBarProps {
  socialLinks?: SocialLinksConfig;
  compact?: boolean;
}

export const SocialLinksBar: React.FC<SocialLinksBarProps> = ({
  socialLinks = DEFAULT_SOCIAL_LINKS,
  compact = false,
}) => {
  const { t, isUrdu } = useLanguage();
  const [notice, setNotice] = useState<string | null>(null);

  const handleUnconfiguredClick = (platformLabel: string) => {
    setNotice(
      t(
        `${platformLabel} link coming soon`,
        `${platformLabel} لنک جلد شامل کیا جائے گا`,
      ),
    );
    window.setTimeout(() => {
      setNotice((prev) => (prev?.includes(platformLabel) ? null : prev));
    }, 2400);
  };

  return (
    <div className={compact ? '' : 'mt-5'}>
      {!compact && (
        <p
          className={`text-[11px] font-bold uppercase tracking-wider text-neutral-400 ${
            isUrdu ? 'font-urdu normal-case tracking-normal text-xs' : ''
          }`}
        >
          {t('Follow Us', 'سوشل میڈیا پر فالو کریں')}
        </p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {SOCIAL_PLATFORMS.map((item) => {
          const url = normalizeSocialUrl(socialLinks[item.key]);
          if (url) {
            return (
              <a
                key={item.key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                title={item.label}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${item.activeBgClass}`}
              >
                <SocialBrandIcon platform={item.key} className="h-4 w-4" />
              </a>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleUnconfiguredClick(item.label)}
              aria-label={`${item.label} (coming soon)`}
              title={`${item.label} — Coming soon`}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-[#F8F6F4] text-[#141414] shadow-2xs transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${item.hoverClass}`}
            >
              <SocialBrandIcon platform={item.key} className="h-4 w-4" />
            </button>
          );
        })}
      </div>
      {notice && (
        <p className={`mt-2 text-[11px] font-medium text-[#EA4E1B] ${isUrdu ? 'font-urdu' : ''}`}>
          {notice}
        </p>
      )}
    </div>
  );
};
