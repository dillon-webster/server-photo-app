import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { missingDatePhotoIds, uploadResultError } from "../uploadResult";
import { dateInputToTimestamp } from "./photoDate";

function localDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface UploadItem {
  name: string;
  loaded: number;
  total: number;
  done: boolean;
  error?: string;
}

export interface UploadController {
  uploads: UploadItem[];
  stageFiles: (files: File[]) => void;
  missingDateIds: string[];
  fallbackDate: string;
  setFallbackDate: (value: string) => void;
  savingDate: boolean;
  dateError: string;
  saveMissingDates: () => Promise<void>;
}

export function useUpload(
  onUploaded?: (photoIds: string[]) => void | Promise<void>
): UploadController {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [missingDateIds, setMissingDateIds] = useState<string[]>([]);
  const [fallbackDate, setFallbackDate] = useState(() => localDateInputValue(new Date()));
  const [savingDate, setSavingDate] = useState(false);
  const [dateError, setDateError] = useState("");
  const queryClient = useQueryClient();

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;
      const items: UploadItem[] = files.map((f) => ({
        name: f.name,
        loaded: 0,
        total: f.size,
        done: false,
      }));
      setUploads((prev) => [...prev, ...items]);

      try {
        const results = await api.upload(files, (loaded, total) => {
          setUploads((prev) =>
            prev.map((item, i) =>
              i >= prev.length - files.length
                ? { ...item, loaded: Math.round((loaded / total) * item.total), total: item.total }
                : item
            )
          );
        });
        // Mark each file done or errored based on per-file server result
        setUploads((prev) => {
          const offset = prev.length - files.length;
          return prev.map((item, i) => {
            if (i < offset) return item;
            const result = results[i - offset];
            return result?.ok
              ? { ...item, done: true, loaded: item.total }
              : { ...item, error: result ? uploadResultError(result) : "Upload failed" };
          });
        });
        if (results.some((r) => r.ok)) {
          queryClient.invalidateQueries({ queryKey: ["timeline"] });
          queryClient.invalidateQueries({ queryKey: ["map-photos"] });
          const uploadedIds = results.flatMap((r) => (r.ok && r.photo ? [r.photo.id] : []));
          await onUploaded?.(uploadedIds);
        }
        const ids = missingDatePhotoIds(results);
        if (ids.length) {
          setMissingDateIds(ids);
          setDateError("");
        }
        setTimeout(() => setUploads((prev) => prev.filter((u) => !u.done)), 2500);
      } catch (err) {
        setUploads((prev) =>
          prev.map((item, i) =>
            i >= prev.length - files.length
              ? { ...item, error: String(err) }
              : item
          )
        );
      }
    },
    [queryClient, onUploaded]
  );

  const stageFiles = useCallback((files: File[]) => {
    if (!files.length) return;
    void uploadFiles(files);
  }, [uploadFiles]);

  const saveMissingDates = useCallback(async () => {
    if (!missingDateIds.length || !fallbackDate || savingDate) return;

    setSavingDate(true);
    setDateError("");
    try {
      const dateTaken = dateInputToTimestamp(fallbackDate);
      await Promise.all(
        missingDateIds.map((id) => api.photos.update(id, { dateTaken })),
      );
      setMissingDateIds([]);
      queryClient.invalidateQueries({ queryKey: ["timeline"] });
      queryClient.invalidateQueries({ queryKey: ["map-photos"] });
    } catch (err) {
      setDateError(err instanceof Error ? err.message : "Could not save date");
    } finally {
      setSavingDate(false);
    }
  }, [fallbackDate, missingDateIds, queryClient, savingDate]);

  return {
    uploads,
    stageFiles,
    missingDateIds,
    fallbackDate,
    setFallbackDate,
    savingDate,
    dateError,
    saveMissingDates,
  };
}
