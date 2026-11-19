import React, { useEffect, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { CheckCircle2, ExternalLink, Save, Share2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  DEFAULT_SOCIAL_LINKS,
  normalizeSocialUrl,
  SOCIAL_PLATFORMS,
  SocialBrandIcon,
  SocialLinksBar,
  SocialLinksConfig,
  SocialPlatformKey,
} from './SocialLinksBar';

interface AdminSocialLinksManagerProps {
  socialLinks: SocialLinksConfig;
  setFeedbackMsg: (msg: { text: string; type: 'success' | 'error' } | null) => void;
}

export const AdminSocialLinksManager: React.FC<AdminSocialLinksManagerProps> = ({
  socialLinks,
  setFeedbackMsg,
}) => {
  const [formValues, setFormValues] = useState<SocialLinksConfig>(socialLinks);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormValues(socialLinks);
  }, [socialLinks]);

  const handleFieldChange = (key: SocialPlatformKey, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFeedbackMsg(null);

      const payload: SocialLinksConfig = {
        tiktok: normalizeSocialUrl(formValues.tiktok).slice(0, 300),
        youtube: normalizeSocialUrl(formValues.youtube).slice(0, 300),
        facebook: normalizeSocialUrl(formValues.facebook).slice(0, 300),
        instagram: normalizeSocialUrl(formValues.instagram).slice(0, 300),
        x: normalizeSocialUrl(formValues.x).slice(0, 300),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'siteSettings', 'socialLinks'), payload, { merge: true });
      setFeedbackMsg({
        text: 'Social media links saved live! Footer buttons are updated instantly.',
        type: 'success',
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, 'siteSettings/socialLinks');
      } catch {
        // Error already logged with full context
      }
      setFeedbackMsg({
        text: 'Could not save social links. Please make sure you are signed in as admin.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    setFormValues({ ...DEFAULT_SOCIAL_LINKS });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-display flex items-center gap-2 text-lg font-extrabold text-[#141414]">
              <Share2 className="h-5 w-5 text-[#EA4E1B]" />
              <span>Social Media Links (سوشل میڈیا لنکس)</span>
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Add your official TikTok, YouTube, Facebook, Instagram, and X (Twitter) profile links.
              They appear immediately as clickable buttons in the website footer.
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-[#F8F6F4] px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Live Footer Preview
            </div>
            <SocialLinksBar socialLinks={formValues} compact />
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => {
              const rawVal = formValues[platform.key] || '';
              const normalized = normalizeSocialUrl(rawVal);
              return (
                <div
                  key={platform.key}
                  className="rounded-2xl border border-black/8 bg-[#FBF9F7] p-4 transition focus-within:border-[#EA4E1B] focus-within:bg-white"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={`social-${platform.key}`}
                      className="flex items-center gap-2 text-xs font-bold text-[#141414]"
                    >
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${
                          normalized
                            ? platform.activeBgClass
                            : 'border-black/10 bg-white text-[#141414]'
                        }`}
                      >
                        <SocialBrandIcon platform={platform.key} className="h-3.5 w-3.5" />
                      </span>
                      <span>{platform.label}</span>
                    </label>

                    {normalized && (
                      <a
                        href={normalized}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#EA4E1B] hover:underline"
                      >
                        <span>Test</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <input
                    id={`social-${platform.key}`}
                    type="text"
                    maxLength={300}
                    value={rawVal}
                    onChange={(e) => handleFieldChange(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="mt-2.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs text-[#141414] placeholder:text-neutral-400 focus:border-[#EA4E1B] focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:border-red-400 hover:text-red-600"
            >
              Clear All Fields
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#EA4E1B] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#d44212] disabled:opacity-60"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Social Links</span>
                </>
              )}
            </button>
          </div>

          {socialLinks.updatedAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Last updated: {new Date(socialLinks.updatedAt).toLocaleString()}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
