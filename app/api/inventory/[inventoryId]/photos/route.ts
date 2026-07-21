import { NextResponse } from "next/server";
import { authorizeWrite, dataMode } from "@/lib/config";
import { loadInventory } from "@/lib/inventory";
import { photoBucket, photoFields, photoKinds, safePhotoKey, type PhotoKind } from "@/lib/photo-storage";
import { updateInventoryRow } from "@/lib/smartsheet";

const MAX_BYTES = 12 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"]);

export async function POST(request: Request, { params }: { params: Promise<{ inventoryId: string }> }) {
  if (!authorizeWrite(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (dataMode() === "mock") return NextResponse.json({ error: "Uploads are disabled in preview mode" }, { status: 409 });
  const { inventoryId } = await params;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "") as PhotoKind;
    if (!(file instanceof File) || !photoKinds.includes(kind)) return NextResponse.json({ error: "Choose a file and photo type" }, { status: 422 });
    if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP, HEIC, or PDF file" }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Files must be smaller than 12 MB" }, { status: 413 });
    const item = (await loadInventory()).find((candidate) => candidate.inventoryId === inventoryId);
    if (!item) return NextResponse.json({ error: "Inventory lot not found" }, { status: 404 });
    const key = safePhotoKey(inventoryId, kind, file);
    await (await photoBucket()).put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type }, customMetadata: { inventoryId, kind, originalName: file.name.slice(0, 200) } });
    const url = new URL(`/api/photos/${key.split("/").map(encodeURIComponent).join("/")}`, request.url).toString();
    const updated = { ...item, [photoFields[kind]]: url };
    await updateInventoryRow(inventoryId, updated);
    return NextResponse.json({ data: updated, url, kind });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 502 });
  }
}
