"use client";

import { useRef, useState } from "react";
import { Crop, Loader2, Upload } from "lucide-react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminMediaApiError,
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  uploadAdminMedia,
} from "@/lib/api/admin-media";
import {
  AdminImageCropDialog,
  FramePreview,
} from "@/components/admin/admin-image-crop-dialog";
import type { AspectPreset } from "@/lib/admin/image-crop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  googleIdToken?: string | null;
  productId?: string;
  /** Target frame on the storefront — drives crop aspect + preview shape. */
  aspect?: AspectPreset;
  className?: string;
  placeholder?: string;
  help?: string;
  /** Show large framed preview matching storefront crop. */
  showFramePreview?: boolean;
};

const inputClass =
  "h-10 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

/**
 * Global admin image control: URL, upload, crop/frame, framed preview.
 * Layout always stacks cleanly — never squeezes action buttons.
 */
export function AdminImageField({
  label = "Image",
  value,
  onChange,
  googleIdToken,
  productId,
  aspect = "square",
  className,
  placeholder = "/media/… or https://…",
  help,
  showFramePreview = true,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [revokeOnClose, setRevokeOnClose] = useState<string | null>(null);

  const defaultHelp =
    help ??
    "Upload → adjust the frame (pan/zoom) → applies the crop. Or paste a URL and click Adjust frame.";

  const uploadFile = async (file: File) => {
    if (file.size > MEDIA_MAX_BYTES) {
      throw new Error(
        `File exceeds ${Math.round(MEDIA_MAX_BYTES / (1024 * 1024))} MiB limit`,
      );
    }
    await ensureAdminBackendSession({ googleIdToken });
    const result = await uploadAdminMedia({
      file,
      productId: productId || undefined,
    });
    if (!result.url) throw new Error("Upload returned no public URL");
    onChange(result.url);
  };

  const openCropFromFile = (file: File | null) => {
    if (!file) return;
    setError(null);
    if (file.size > MEDIA_MAX_BYTES) {
      setError(
        `File exceeds ${Math.round(MEDIA_MAX_BYTES / (1024 * 1024))} MiB limit`,
      );
      return;
    }
    const url = URL.createObjectURL(file);
    setRevokeOnClose(url);
    setCropSrc(url);
  };

  const openCropFromValue = () => {
    if (!value.trim()) {
      setError("Add or upload an image first.");
      return;
    }
    setError(null);
    setRevokeOnClose(null);
    const raw = value.trim();
    if (raw.startsWith("blob:") || raw.startsWith("data:")) {
      setCropSrc(raw);
      return;
    }
    setCropSrc(`/api/admin/media-proxy?url=${encodeURIComponent(raw)}`);
  };

  const closeCrop = () => {
    if (revokeOnClose) URL.revokeObjectURL(revokeOnClose);
    setRevokeOnClose(null);
    setCropSrc(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onCropApply = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await uploadFile(file);
      closeCrop();
    } catch (e) {
      setError(
        e instanceof AdminMediaApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Upload failed",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2 text-sm", className)}>
      <span className="font-medium text-foreground">{label}</span>

      {showFramePreview ? (
        <FramePreview src={value || undefined} aspect={aspect} />
      ) : null}

      <input
        className={cn(inputClass, "font-mono text-[13px]")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />

      <div className="flex w-full min-w-0 flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={MEDIA_ACCEPT}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            openCropFromFile(e.target.files?.[0] ?? null);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 shrink-0"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Working…
            </>
          ) : (
            <>
              <Upload className="mr-1.5 h-4 w-4" />
              Upload & frame
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 shrink-0"
          disabled={uploading || !value.trim()}
          onClick={openCropFromValue}
        >
          <Crop className="mr-1.5 h-4 w-4" />
          Adjust frame
        </Button>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {defaultHelp}
      </p>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {cropSrc ? (
        <AdminImageCropDialog
          open
          imageSrc={cropSrc}
          aspect={aspect}
          title={`Frame · ${label}`}
          onCancel={closeCrop}
          onApply={onCropApply}
        />
      ) : null}
    </div>
  );
}
