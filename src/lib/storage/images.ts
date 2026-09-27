/** Public bucket for site images (see migration storage_portfolio_bucket). */
export const PORTFOLIO_BUCKET = "portfolio";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif";

export type ImageKind = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/avif"; extension: string };

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/**
 * Identifies the image by its content (magic bytes), never by the file name or
 * the Content-Type sent by the client. Anything else (SVG, HTML, PDF...) is rejected.
 */
export function detectImageKind(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, i) => bytes[i] === value)) {
    return { mime: "image/png", extension: "png" };
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { mime: "image/webp", extension: "webp" };
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(bytes, 8, 4))) {
    return { mime: "image/avif", extension: "avif" };
  }
  return null;
}

export type ImageValidation = { ok: true; kind: ImageKind; bytes: Uint8Array } | { ok: false; error: string };

export async function validateImageFile(file: unknown): Promise<ImageValidation> {
  if (!(file instanceof Blob) || file.size === 0) return { ok: false, error: "Selecione uma imagem." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "A imagem deve ter no máximo 5 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectImageKind(bytes);
  if (!kind) return { ok: false, error: "Formato não suportado. Use JPEG, PNG, WebP ou AVIF." };
  return { ok: true, kind, bytes };
}

/** Unique, immutable object path per upload: projects/<projectId>/<uuid>.<ext> */
export function projectCoverPath(projectId: string, kind: ImageKind, id: string = crypto.randomUUID()) {
  return `projects/${projectId}/${id}.${kind.extension}`;
}

/** True only for objects this app stored in the bucket (not external URLs). */
export function isStoragePath(value: string | null | undefined): value is string {
  return Boolean(value) && /^[a-z]+\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(value as string);
}

/** Public URL for a stored path; external http(s) URLs pass through unchanged. */
export function publicImageUrl(value: string | null | undefined, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  if (!supabaseUrl) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PORTFOLIO_BUCKET}/${value}`;
}
