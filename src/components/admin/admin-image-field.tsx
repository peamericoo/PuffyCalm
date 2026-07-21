"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { ensureAdminBackendSession } from "@/lib/api/admin-auth";
import {
  AdminMediaApiError,
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  uploadAdminMedia,
} from "@/lib/api/admin-media";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  googleIdToken?: string | null;
  /** Optional product id if associating upload with a product. */
  productId?: string;
  className?: string;
  placeholder?: string;
  help?: string;
};

const inputClass =
  "h-10 w-full rounded-xl border border-border bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

/**
 * Image URL + file upload (Railway S3 → public /media/… URL).
 * Same media API as products/categories.
 */
export function AdminImageField({
  label = "Image",
  value,
  onChange,
  googleIdToken,
  productId,
  className,
  placeholder = "/media/products/… or https://…",
  help = "Upload jpeg/png/webp/gif (max 5 MiB) or paste a URL.",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (file.size > MEDIA_MAX_BYTES) {
      setError(
        `File exceeds ${Math.round(MEDIA_MAX_BYTES / (1024 * 1024))} MiB limit`,
      );
      return;
    }
    setUploading(true);
    try {
      await ensureAdminBackendSession({ googleIdToken });
      const result = await uploadAdminMedia({
        file,
        productId: productId || undefined,
      });
      if (!result.url) {
        throw new Error("Upload returned no public URL");
      }
      onChange(result.url);
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
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="font-medium text-foreground">{label}</span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          className={cn(inputClass, "font-mono text-[13px] sm:flex-1")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <div className="flex shrink-0 items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept={MEDIA_ACCEPT}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              void onFile(e.target.files?.[0] ?? null);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>
      {value ? (
        <div className="mt-1 flex items-center gap-3">
          <div className="relative h-16 w-24 overflow-hidden rounded-xl bg-brand-soft ring-1 ring-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
          </div>
          <p className="text-[11px] text-muted-foreground break-all">{help}</p>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">{help}</p>
      )}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
