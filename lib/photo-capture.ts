export const maxIntakePhotos = 8;
export const maxIntakePhotoBytes = 12 * 1024 * 1024;
export const supportedIntakePhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type PhotoLike = { name: string; size: number; type: string };

export function validatePhotoSelection(existing: PhotoLike[], incoming: PhotoLike[]) {
  if (!incoming.length) return "No photo was selected. Try the camera again or choose an existing photo.";
  if (existing.length + incoming.length > maxIntakePhotos) return `Use no more than ${maxIntakePhotos} photos for one physical asset.`;
  const heic = incoming.find(file => ["image/heic","image/heif"].includes(file.type.toLowerCase())||/\.hei[cf]$/i.test(file.name));
  if (heic) return `${heic.name} is an iPhone HEIC photo that this browser cannot reliably prepare. Use Open rear camera to take a new photo, or share/export it as JPG first.`;
  const unsupported = incoming.find(file => !supportedIntakePhotoTypes.has(file.type.toLowerCase()));
  if (unsupported) return `${unsupported.name} is not a supported photo. Use JPG, PNG, or WebP.`;
  const oversized = incoming.find(file => file.size <= 0 || file.size > maxIntakePhotoBytes);
  if (oversized) return `${oversized.name} must be smaller than 12 MB.`;
  return null;
}

export function photoPreparationError(fileName:string){return `Cedriva could not prepare ${fileName}. On iPhone, use Open rear camera to take a new photo. For an existing image, share or export it as JPG first.`}
