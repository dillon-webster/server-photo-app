import type { Photo } from "../types";

type UpdatePhoto = (
  id: string,
  patch: { latitude: number; longitude: number },
) => Promise<Photo>;

export function savePhotoLocation(
  updatePhoto: UpdatePhoto,
  photoId: string,
  latitude: number,
  longitude: number,
) {
  return updatePhoto(photoId, { latitude, longitude });
}
