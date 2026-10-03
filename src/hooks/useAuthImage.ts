import { useEffect, useState } from "react";
import apiClient from "../api/Client";

/**
 * Uploaded student photos/signatures and college logos/banners are not public files any more
 * (DEC-12). The API returns a stored path such as "students/<guid>_photo.png"; this hook fetches
 * it through the authenticated axios client (GET /api/Files?path=...) as a blob and exposes an
 * object URL that an <img> can use. The URL is revoked when the path changes or the component
 * unmounts.
 *
 * Values that are already displayable are passed through untouched: blob:/data: URLs (a freshly
 * chosen local file) and absolute http(s) URLs.
 */
const isDirectlyDisplayable = (src: string) =>
  /^(blob:|data:|https?:\/\/)/i.test(src);

export interface AuthImageState {
  url: string | null;
  loading: boolean;
  error: boolean;
}

export function useAuthImage(src?: string | null): AuthImageState {
  const [loaded, setLoaded] = useState<{
    src: string;
    url: string | null;
    error: boolean;
  } | null>(null);

  const path = src?.trim() || null;
  const direct = path !== null && isDirectlyDisplayable(path);

  useEffect(() => {
    if (!path || direct) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    apiClient
      .get<Blob>("/Files", { params: { path }, responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setLoaded({ src: path, url: objectUrl, error: false });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ src: path, url: null, error: true });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, direct]);

  if (!path) return { url: null, loading: false, error: false };
  if (direct) return { url: path, loading: false, error: false };

  // Ignore a result that belongs to a previous path while the new one is loading.
  const current = loaded && loaded.src === path ? loaded : null;
  return {
    url: current?.url ?? null,
    loading: current === null,
    error: current?.error ?? false,
  };
}

export default useAuthImage;
