export interface Photo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  duration: number | null;
  dateTaken: number | null;
  dateUploaded: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
}

export interface Album {
  id: string;
  name: string;
  description: string | null;
  coverPhotoId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AlbumWithPhotos extends Album {
  photos: Photo[];
}

export interface TimelineMonth {
  month: string;
  photos: Photo[];
}

export interface TimelineYear {
  year: string;
  months: TimelineMonth[];
}

export interface MapPhoto {
  id: string;
  filename: string;
  latitude: number;
  longitude: number;
  dateTaken: number | null;
  city: string | null;
  country: string | null;
}
