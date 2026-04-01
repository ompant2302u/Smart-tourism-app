import { useState, useEffect } from "react";

export const NEPAL_FALLBACKS = {
  destination: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
  hotel: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
  transport: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  guide: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
};

// In-memory cache to avoid duplicate requests within a session
const _cache = {};

export function useNepalImage(item, entityType) {
  const existingUrl = item?.image || item?.image_url;
  const [imgSrc, setImgSrc] = useState(existingUrl || NEPAL_FALLBACKS[entityType]);
  const [credit, setCredit] = useState(
    item?.image_credit_name ? { name: item.image_credit_name, link: item.image_credit_link } : null
  );

  useEffect(() => {
    if (!item) return;
    // If the item already has an image, use it directly
    const url = item.image || item.image_url;
    if (url) {
      setImgSrc(url);
      if (item.image_credit_name) setCredit({ name: item.image_credit_name, link: item.image_credit_link });
      return;
    }
    // Otherwise fetch from backend proxy
    const name = item.name || item.transport_type || "";
    if (!name) return;
    const cacheKey = `${entityType}_${name}`;
    if (_cache[cacheKey]) {
      setImgSrc(_cache[cacheKey].url);
      setCredit(_cache[cacheKey].credit);
      return;
    }
    fetch(`/api/unsplash/?type=${entityType}&name=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.url) {
          _cache[cacheKey] = data;
          setImgSrc(data.url);
          setCredit(data.credit);
        }
      })
      .catch(() => setImgSrc(NEPAL_FALLBACKS[entityType]));
  }, [item?.id, item?.name]);

  return { imgSrc, credit };
}
