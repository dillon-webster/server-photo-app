import type { Photo, Album, AlbumWithPhotos, TimelineYear, MapPhoto } from "./types";
import { buildUploadFormData } from "./uploadFormData";
import {
  type UploadResult,
  uploadRequestError,
} from "./uploadResult";

const BASE = (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const TOKEN_KEY = "photos_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(BASE + url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    window.location.href = "/";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (password: string) =>
      request<{ token: string }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }),
  },

  photos: {
    timeline: () => request<TimelineYear[]>("/api/photos/timeline"),
    map: () => request<MapPhoto[]>("/api/photos/map"),
    get: (id: string) => request<Photo>(`/api/photos/${id}`),
    update: (id: string, data: { dateTaken?: number | null; city?: string | null; country?: string | null; latitude?: number | null; longitude?: number | null; locationSearch?: string | null }) =>
      request<Photo>(`/api/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/photos/${id}`, { method: "DELETE" }),
  },

  albums: {
    list: () => request<Album[]>("/api/albums"),
    get: (id: string) => request<AlbumWithPhotos>(`/api/albums/${id}`),
    create: (name: string, description?: string) =>
      request<Album>("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      }),
    update: (id: string, data: { name?: string; description?: string; coverPhotoId?: string | null }) =>
      request<Album>(`/api/albums/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/albums/${id}`, { method: "DELETE" }),
    addPhotos: (id: string, photoIds: string[]) =>
      request<{ ok: boolean }>(`/api/albums/${id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds }),
      }),
    removePhoto: (albumId: string, photoId: string) =>
      request<{ ok: boolean }>(`/api/albums/${albumId}/photos/${photoId}`, {
        method: "DELETE",
      }),
  },

  upload: (
    files: File[],
    onProgress?: (loaded: number, total: number) => void
  ): Promise<UploadResult[]> => {
    return new Promise((resolve, reject) => {
      const formData = buildUploadFormData(files);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", BASE + "/api/upload");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded, e.total);
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(uploadRequestError(xhr.status, xhr.responseText)));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.send(formData);
    });
  },
};

export function thumbnailUrl(photo: { id: string }) {
  return `${BASE}/uploads/thumbnails/${photo.id}.webp`;
}

export function originalUrl(photo: { filename: string }) {
  return `${BASE}/uploads/originals/${photo.filename}`;
}

export function playbackUrl(photo: { id: string }) {
  return `${BASE}/uploads/playback/${photo.id}.mp4`;
}
