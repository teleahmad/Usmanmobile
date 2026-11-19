import React, { useEffect, useRef, useState } from 'react';
import { Check, Crop, Maximize2, RotateCcw, X } from 'lucide-react';
import { NormalizedCropRect, renderCroppedImageToDataUrl } from '../utils/imageUpload';

interface ImageCropperModalProps {
  imageSrc: string | null;
  maxDimension?: number;
  maxBytes?: number;
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
}

type DragHandle =
  | 'move'
  | 'nw'
  | 'ne'
  | 'sw'
  | 'se'
  | 'n'
  | 's'
  | 'e'
  | 'w';

const MIN_SIZE = 0.08;

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  maxDimension = 900,
  maxBytes = 240_000,
  onCancel,
  onApply,
}) => {
  const [crop, setCrop] = useState<NormalizedCropRect>({ x: 0.06, y: 0.06, w: 0.88, h: 0.88 });
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number }>({ w: 1, h: 1 });
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    handle: DragHandle;
    startClientX: number;
    startClientY: number;
    startCrop: NormalizedCropRect;
    stageW: number;
    stageH: number;
  } | null>(null);

  useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0.06, y: 0.06, w: 0.88, h: 0.88 });
      setErrorMsg(null);
      setApplying(false);
    }
  }, [imageSrc]);

  if (!imageSrc) return null;

  const startDrag = (handle: DragHandle) => (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCrop: { ...crop },
      stageW: rect.width,
      stageH: rect.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    e.preventDefault();

    const dx = (e.clientX - drag.startClientX) / drag.stageW;
    const dy = (e.clientY - drag.startClientY) / drag.stageH;
    const s = drag.startCrop;

    if (drag.handle === 'move') {
      const nx = Math.max(0, Math.min(1 - s.w, s.x + dx));
      const ny = Math.max(0, Math.min(1 - s.h, s.y + dy));
      setCrop({ x: nx, y: ny, w: s.w, h: s.h });
      return;
    }

    let left = s.x;
    let right = s.x + s.w;
    let top = s.y;
    let bottom = s.y + s.h;

    if (drag.handle.includes('w')) {
      left = Math.max(0, Math.min(right - MIN_SIZE, s.x + dx));
    }
    if (drag.handle.includes('e')) {
      right = Math.min(1, Math.max(left + MIN_SIZE, s.x + s.w + dx));
    }
    if (drag.handle.includes('n')) {
      top = Math.max(0, Math.min(bottom - MIN_SIZE, s.y + dy));
    }
    if (drag.handle.includes('s')) {
      bottom = Math.min(1, Math.max(top + MIN_SIZE, s.y + s.h + dy));
    }

    setCrop({
      x: left,
      y: top,
      w: Math.max(MIN_SIZE, right - left),
      h: Math.max(MIN_SIZE, bottom - top),
    });
  };

  const endDrag = () => {
    dragStateRef.current = null;
  };

  const applyAspectPreset = (aspect: number | 'full') => {
    if (aspect === 'full') {
      setCrop({ x: 0, y: 0, w: 1, h: 1 });
      return;
    }
    const imgRatio = imgDimensions.w / Math.max(1, imgDimensions.h);
    let w = 0.85;
    let h = (w * imgRatio) / aspect;
    if (h > 0.88) {
      h = 0.88;
      w = (h * aspect) / imgRatio;
    }
    w = Math.max(MIN_SIZE, Math.min(1, w));
    h = Math.max(MIN_SIZE, Math.min(1, h));
    setCrop({
      x: (1 - w) / 2,
      y: (1 - h) / 2,
      w,
      h,
    });
  };

  const handleConfirmCrop = async (useFullOriginal = false) => {
    setApplying(true);
    setErrorMsg(null);
    try {
      const targetCrop = useFullOriginal ? { x: 0, y: 0, w: 1, h: 1 } : crop;
      const resultUrl = await renderCroppedImageToDataUrl(
        imageSrc,
        targetCrop,
        maxDimension,
        maxBytes,
      );
      onApply(resultUrl);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to crop image.');
    } finally {
      setApplying(false);
    }
  };

  const outPxW = Math.round(crop.w * imgDimensions.w);
  const outPxH = Math.round(crop.h * imgDimensions.h);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Free-Form Image Cropper"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-[#EA4E1B]" />
            <div>
              <h3 className="font-display text-sm font-extrabold text-[#141414] sm:text-base">
                Free-Form Photo Crop (تصویر کراپ کریں)
              </h3>
              <p className="text-[11px] text-neutral-500">
                Drag corners or edges freely to cut exactly what you want
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close cropper"
            className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 hover:text-[#141414]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 bg-[#F8F6F4] px-4 py-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCrop({ x: 0.08, y: 0.08, w: 0.84, h: 0.84 })}
              className="rounded-full bg-[#EA4E1B] px-2.5 py-1 font-bold text-white"
            >
              Free-Form
            </button>
            <button
              type="button"
              onClick={() => applyAspectPreset(1)}
              className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 font-semibold text-neutral-700 hover:border-[#EA4E1B]"
            >
              1:1 Square
            </button>
            <button
              type="button"
              onClick={() => applyAspectPreset(4 / 3)}
              className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 font-semibold text-neutral-700 hover:border-[#EA4E1B]"
            >
              4:3 Card
            </button>
            <button
              type="button"
              onClick={() => applyAspectPreset(16 / 10)}
              className="rounded-full border border-neutral-300 bg-white px-2.5 py-1 font-semibold text-neutral-700 hover:border-[#EA4E1B]"
            >
              16:10 Wide
            </button>
            <button
              type="button"
              onClick={() => applyAspectPreset('full')}
              className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-white px-2.5 py-1 font-semibold text-neutral-700 hover:border-[#EA4E1B]"
            >
              <Maximize2 className="h-3 w-3" />
              Full
            </button>
          </div>
          <span className="font-mono text-[10px] font-semibold text-neutral-500">
            {outPxW} × {outPxH} px
          </span>
        </div>

        {/* Interactive Stage */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[#121212] p-4 sm:p-6">
          <div
            ref={stageRef}
            className="relative inline-block max-h-[55dvh] max-w-full select-none touch-none"
          >
            <img
              src={imageSrc}
              alt="Crop source"
              draggable={false}
              onLoad={(e) => {
                const target = e.currentTarget;
                setImgDimensions({
                  w: target.naturalWidth || 800,
                  h: target.naturalHeight || 600,
                });
              }}
              className="block max-h-[55dvh] max-w-full object-contain pointer-events-none"
            />

            {/* Darkened outer masks around the crop rectangle */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bg-black/60"
              style={{ height: `${crop.y * 100}%` }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/60"
              style={{ height: `${Math.max(0, (1 - (crop.y + crop.h)) * 100)}%` }}
            />
            <div
              className="pointer-events-none absolute left-0 bg-black/60"
              style={{
                top: `${crop.y * 100}%`,
                height: `${crop.h * 100}%`,
                width: `${crop.x * 100}%`,
              }}
            />
            <div
              className="pointer-events-none absolute right-0 bg-black/60"
              style={{
                top: `${crop.y * 100}%`,
                height: `${crop.h * 100}%`,
                width: `${Math.max(0, (1 - (crop.x + crop.w)) * 100)}%`,
              }}
            />

            {/* Draggable Free-Form Selection Frame */}
            <div
              onPointerDown={startDrag('move')}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="absolute cursor-move border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.45)]"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
              }}
            >
              {/* Rule-of-thirds grid lines */}
              <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/35" />
              <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/35" />
              <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/35" />
              <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/35" />

              {/* 4 Corner Handles */}
              <div
                onPointerDown={startDrag('nw')}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute -top-2.5 -left-2.5 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-[#EA4E1B] shadow-md"
              />
              <div
                onPointerDown={startDrag('ne')}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute -top-2.5 -right-2.5 h-5 w-5 cursor-nesw-resize rounded-full border-2 border-white bg-[#EA4E1B] shadow-md"
              />
              <div
                onPointerDown={startDrag('sw')}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute -bottom-2.5 -left-2.5 h-5 w-5 cursor-nesw-resize rounded-full border-2 border-white bg-[#EA4E1B] shadow-md"
              />
              <div
                onPointerDown={startDrag('se')}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute -bottom-2.5 -right-2.5 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-[#EA4E1B] shadow-md"
              />

              {/* 4 Edge Handles (Free-Form horizontal & vertical stretch) */}
              <div
                onPointerDown={startDrag('n')}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute -top-1.5 left-1/2 h-3 w-8 -translate-x-1/2 cursor-ns-resize rounded-full border border-white bg-[#EA4E1B] shadow-xs"
              />
              <div
                onPointerDown={startDrag('s')}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute -bottom-1.5 left-1/2 h-3 w-8 -translate-x-1/2 cursor-ns-resize rounded-full border border-white bg-[#EA4E1B] shadow-xs"
              />
              <div
                onPointerDown={startDrag('w')}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute top-1/2 -left-1.5 h-8 w-3 -translate-y-1/2 cursor-ew-resize rounded-full border border-white bg-[#EA4E1B] shadow-xs"
              />
              <div
                onPointerDown={startDrag('e')}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="absolute top-1/2 -right-1.5 h-8 w-3 -translate-y-1/2 cursor-ew-resize rounded-full border border-white bg-[#EA4E1B] shadow-xs"
              />
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 border-t border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/10 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => handleConfirmCrop(true)}
            disabled={applying}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Use Full Photo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleConfirmCrop(false)}
              disabled={applying}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#EA4E1B] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#d44212] disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              <span>{applying ? 'Applying...' : 'Crop & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
