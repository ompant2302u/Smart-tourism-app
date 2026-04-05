import { useState } from "react";
import { useNepalImage, NEPAL_FALLBACKS } from "../../hooks/useNepalImage";

export default function NepalImage({ item, entityType, className = "", style = {}, showCredit = false }) {
  const { imgSrc, credit } = useNepalImage(item, entityType);
  const [errored, setErrored] = useState(false);

  return (
    <div style={{ position: "relative", overflow: "hidden", ...style }}>
      <img
        src={errored ? NEPAL_FALLBACKS[entityType] : imgSrc}
        alt={item?.image_alt || item?.name || entityType}
        onError={() => setErrored(true)}
        className={className}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        loading="lazy"
      />
      {showCredit && credit && (
        <a
          href={`${credit.link}?utm_source=tourtech&utm_medium=referral`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "absolute", bottom: 6, right: 8, fontSize: "10px",
            color: "rgba(255,255,255,0.8)", textDecoration: "none",
            background: "rgba(0,0,0,0.4)", padding: "2px 6px", borderRadius: 4,
          }}
        >
          📷 {credit.name} / Unsplash
        </a>
      )}
    </div>
  );
}
