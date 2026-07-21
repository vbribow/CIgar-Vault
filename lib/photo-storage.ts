type StoredObject = { body: ReadableStream; httpMetadata?: { contentType?: string }; size?: number; writeHttpMetadata(headers: Headers): void };
type PhotoBucket = {
  put(key: string, value: ArrayBuffer, options: { httpMetadata: { contentType: string }; customMetadata: Record<string, string> }): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
};

export const photoKinds = ["cigar", "box", "habanos-seal", "box-code", "provenance"] as const;
export type PhotoKind = typeof photoKinds[number];

export const photoFields: Record<PhotoKind, "photoLink" | "boxPhotoLink" | "habanosSealPhotoLink" | "boxCodePhotoLink" | "provenanceDocumentLink"> = {
  cigar: "photoLink",
  box: "boxPhotoLink",
  "habanos-seal": "habanosSealPhotoLink",
  "box-code": "boxCodePhotoLink",
  provenance: "provenanceDocumentLink",
};

export async function photoBucket(): Promise<PhotoBucket> {
  const { env } = await import("cloudflare:workers");
  const bucket = env.PHOTOS as PhotoBucket | undefined;
  if (!bucket) throw new Error("Photo storage is not configured");
  return bucket;
}

export function safePhotoKey(inventoryId: string, kind: PhotoKind, file: File) {
  const extension = file.name.toLowerCase().match(/\.(jpe?g|png|webp|heic|pdf)$/)?.[1] || (file.type === "application/pdf" ? "pdf" : "jpg");
  return `${inventoryId.replace(/[^a-zA-Z0-9_-]/g, "-")}/${kind}/${crypto.randomUUID()}.${extension}`;
}
