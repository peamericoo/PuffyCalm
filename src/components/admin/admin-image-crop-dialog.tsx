"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Loader2 } from "lucide-react";
import {
  ASPECT_PRESETS,
  type AspectPreset,
  blobToFile,
  getCroppedBlob,
} from "@/lib/admin/image-crop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  imageSrc: string;
  aspect: AspectPreset;
  title?: string;
  onCancel: () => void;
  /** Called with cropped file ready to upload */
  onApply: (file: File) => void | Promise<void>;
};

/**
 * Modal crop / frame editor — pan + zoom inside the target aspect ratio.
 */
export function AdminImageCropDialog({
  open,
  imageSrc,
  aspect,
  title = "Adjust frame",
  onCancel,
  onApply,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectValue =
    aspect === "free" ? undefined : ASPECT_PRESETS[aspect].value;
  const aspectLabel =
    aspect === "free" ? "Free" : ASPECT_PRESETS[aspect].label;

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  if (!open) return null;

  const apply = async () => {
    if (!croppedAreaPixels) {
      setError("Move the image into the frame first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const file = blobToFile(blob, "frame-crop.jpg");
      await onApply(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Crop failed");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Drag to reframe · scroll or slider to zoom · frame:{" "}
              <strong>{aspectLabel}</strong>
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </Button>
        </div>

        <div className="relative h-[min(52vh,420px)] w-full bg-[#1a2332]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectValue}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            showGrid
          />
        </div>

        <div className="space-y-3 border-t border-border px-4 py-4 sm:px-5">
          <label className="flex items-center gap-3 text-sm">
            <span className="w-12 shrink-0 text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--brand-deep)]"
            />
          </label>
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void apply()} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying…
                </>
              ) : (
                "Apply frame & upload"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FramePreview({
  src,
  aspect,
  className,
  emptyLabel = "No image",
}: {
  src?: string;
  aspect: AspectPreset;
  className?: string;
  emptyLabel?: string;
}) {
  const frame =
    aspect === "free"
      ? "aspect-video w-full max-w-sm"
      : ASPECT_PRESETS[aspect].frameClass;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted ring-1 ring-border/70",
        frame,
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
