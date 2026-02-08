import { useState, useEffect, useRef } from "react";

const THUMBNAIL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-thumbnail`;
const MAX_CONCURRENT = 3;

/**
 * Lazily fetches thumbnails for products that have a productUrl.
 * Returns a map of productId → imageUrl (or "" if fetch failed/no image).
 */
export function useProductThumbnails(
  products: { id: string; productUrl?: string }[]
) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const fetchedRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<{ id: string; url: string }[]>([]);
  const activeRef = useRef(0);

  useEffect(() => {
    const pending = products.filter(
      (p) => p.productUrl && !fetchedRef.current.has(p.id)
    );

    if (pending.length === 0) return;

    for (const p of pending) {
      fetchedRef.current.add(p.id);
      queueRef.current.push({ id: p.id, url: p.productUrl! });
    }

    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  async function processQueue() {
    while (queueRef.current.length > 0 && activeRef.current < MAX_CONCURRENT) {
      const item = queueRef.current.shift();
      if (!item) break;

      activeRef.current++;
      fetchThumbnail(item.id, item.url).finally(() => {
        activeRef.current--;
        processQueue();
      });
    }
  }

  async function fetchThumbnail(productId: string, url: string) {
    try {
      const resp = await fetch(THUMBNAIL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ url }),
      });

      // On any error response, mark as "no image" so we don't retry forever
      if (!resp.ok) {
        setThumbnails((prev) => ({ ...prev, [productId]: "" }));
        return;
      }

      const data = await resp.json();
      // Set the image URL, or empty string if none found
      setThumbnails((prev) => ({
        ...prev,
        [productId]: data.imageUrl || "",
      }));
    } catch (err) {
      console.warn(`Thumbnail fetch failed for ${productId}:`, err);
      setThumbnails((prev) => ({ ...prev, [productId]: "" }));
    }
  }

  return thumbnails;
}
