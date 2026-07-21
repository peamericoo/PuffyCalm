/** Canvas helpers for admin image crop (react-easy-crop output → Blob). */

export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AspectPreset = "hero" | "product" | "square" | "wide" | "free";

/** Ratios match storefront frames (hero stage, product card 4:5, mood thumbs). */
export const ASPECT_PRESETS: Record<
  Exclude<AspectPreset, "free">,
  { label: string; value: number; frameClass: string }
> = {
  hero: {
    label: "Hero banner",
    value: 16 / 9,
    frameClass: "aspect-[16/9] w-full max-w-xl",
  },
  product: {
    label: "Product card",
    value: 4 / 5,
    frameClass: "aspect-[4/5] w-36",
  },
  square: {
    label: "Square",
    value: 1,
    frameClass: "aspect-square w-36",
  },
  wide: {
    label: "Wide tile",
    value: 2 / 1,
    frameClass: "aspect-[2/1] w-full max-w-sm",
  },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for crop"));
    img.src = src;
  });
}

/**
 * Produce a JPEG blob from pixel crop. Caps long edge for reasonable upload size.
 */
export async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: CropArea,
  options?: { maxEdge?: number; quality?: number; mime?: string },
): Promise<Blob> {
  const maxEdge = options?.maxEdge ?? 2400;
  const quality = options?.quality ?? 0.9;
  const mime = options?.mime ?? "image/jpeg";

  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  let { width, height } = pixelCrop;
  let scale = 1;
  if (Math.max(width, height) > maxEdge) {
    scale = maxEdge / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Crop export failed"));
        else resolve(blob);
      },
      mime,
      quality,
    );
  });
}

export function blobToFile(blob: Blob, name = "crop.jpg"): File {
  const ext = blob.type.includes("png") ? "png" : "jpg";
  const base = name.replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.${ext}`, { type: blob.type || "image/jpeg" });
}
