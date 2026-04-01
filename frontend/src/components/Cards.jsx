import { useState, useEffect } from "react";
import { useLang } from "../context/LangContext";
import NepalImage from "./common/NepalImage";
import { api, hasToken } from "../api";

export function StarRating({ rating, size = "0.9rem" }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? "var(--gold)" : "var(--text4)" }}>★</span>
      ))}
    </span>
  );
}

/* ── DESTINATION CARD ── */
export function DestinationCard({ dest, onClick, navigate, delay = 0, user }) {
  const { t } = useLang();
  const [fav, setFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (user && dest?.id) {
      api.checkFavorite("destination", dest.id).then(r => setFav(!!r?.is_favourite)).catch(() => {});
    }
  }, [user?.id, dest?.id]);

  const destName     = t(dest.name_key     || dest.name);
  const destShort    = t(dest.short_description_key || dest.short_description || "");
  const destCity     = t(dest.city_key     || dest.city     || "");
  const destCountry  = t(dest.country_key  || dest.country  || "Nepal");
  const destCategory = dest.category ? t(dest.category.name_key || dest.category.name || dest.category.slug || "") : "";

  const handleClick = () => {
    if (onClick) onClick();
    else if (navigate) navigate("destination-detail", { id: dest.id });
  };

  const handleFav = async (e) => {
    e.stopPropagation();
    if (!hasToken()) { if (navigate) navigate("login"); return; }
    if (favLoading) return;
    setFavLoading(true);
    try {
      const res = await api.toggleFavorite({ content_type: "destination", id: dest.id, item_name: dest.name });
      setFav(res?.removed ? false : true);
      window.dispatchEvent(new CustomEvent("nw-data-changed"));
    } catch {} finally { setFavLoading(false); }
  };

  return (
    <div className="dest-card" style={{ animationDelay: `${delay}s` }} onClick={handleClick}>
      <div className="dest-card-img-wrap">
        <NepalImage item={dest} entityType="destination" style={{ width: "100%", height: "100%" }} className="dest-card-img" />
        <div className="dest-card-overlay" />
        {destCategory && <span className="dest-card-category">{destCategory}</span>}
        <button className={`dest-card-fav${fav ? " active" : ""}`}
          onClick={handleFav}
          title={fav ? "Remove from favourites" : "Save to favourites"}
          disabled={favLoading}>
          <i className={fav ? "fas fa-heart" : "far fa-heart"} />
        </button>
      </div>
      <div className="dest-card-body">
        <h3 className="dest-card-title">{destName}</h3>
        <div className="dest-card-location">
          <i className="fas fa-map-marker-alt" />
          {destCity}{destCity && destCountry ? ", " : ""}{destCountry}
        </div>
        {destShort && (
          <p style={{ fontSize: "0.82rem", color: "var(--text4)", marginBottom: 12, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {destShort}
          </p>
        )}
        <div className="dest-card-meta">
          <div className="dest-card-rating">
            <span className="star">★</span>
            {dest.rating}
            <span className="count">({dest.review_count || Math.floor(Math.random()*200+30)})</span>
          </div>
          {dest.entry_fee > 0 ? (
            <span className="dest-card-fee">{t("from")} ${dest.entry_fee}</span>
          ) : (
            <span className="dest-card-fee" style={{ background: "rgba(22,163,74,0.09)", color: "var(--forest-600)" }}>{t("free_entry")}</span>
          )}
        </div>
        {dest.difficulty && (
          <div style={{ marginTop: 10 }}>
            <span className={`badge ${dest.difficulty === "Easy" ? "badge-green" : dest.difficulty === "Moderate" ? "badge-gold" : "badge-red"}`}>
              {t({ Easy: "difficulty_easy", Moderate: "difficulty_moderate", Challenging: "difficulty_challenging", Strenuous: "difficulty_strenuous" }[dest.difficulty] || dest.difficulty)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── HOTEL CARD ── */
export function HotelCard({ hotel, onClick, navigate, delay = 0, user }) {
  const { t } = useLang();
  const [fav, setFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (user && hotel?.id) {
      api.checkFavorite("hotel", hotel.id).then(r => setFav(!!r?.is_favourite)).catch(() => {});
    }
  }, [user?.id, hotel?.id]);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (!hasToken()) { if (navigate) navigate("login"); return; }
    if (favLoading) return;
    setFavLoading(true);
    try {
      const res = await api.toggleFavorite({ content_type: "hotel", id: hotel.id, item_name: hotel.name });
      setFav(res?.removed ? false : true);
      window.dispatchEvent(new CustomEvent("nw-data-changed"));
    } catch {} finally { setFavLoading(false); }
  };

  const hotelCity    = t(hotel.destination?.city_key    || hotel.destination?.city    || "");
  const hotelCountry = t(hotel.destination?.country_key || hotel.destination?.country || "Nepal");

  const handleClick = () => {
    if (onClick) onClick();
    else if (navigate) navigate("hotel-detail", { id: hotel.id });
  };

  return (
    <div className="hotel-card" onClick={handleClick}>
      <div className="hotel-card-img-wrap">
        <NepalImage item={hotel} entityType="hotel" style={{ width: "100%", height: "100%" }} className="hotel-card-img" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(10,22,40,0.5) 0%,transparent 40%)", pointerEvents: "none" }} />
        <div className="hotel-card-stars">
          {Array.from({ length: hotel.stars || 3 }).map((_, i) => (
            <span key={i} className="star">★</span>
          ))}
        </div>
        <button className={`dest-card-fav${fav ? " active" : ""}`}
          onClick={handleFav} title={fav ? "Remove from favourites" : "Save to favourites"} disabled={favLoading}>
          <i className={fav ? "fas fa-heart" : "far fa-heart"} />
        </button>
      </div>
      <div className="hotel-card-body">
        <h3 className="hotel-card-title">{hotel.name}</h3>
        <div className="hotel-card-location">
          <i className="fas fa-map-marker-alt" />
          {hotelCity}{hotelCity ? ", " : ""}{hotelCountry}
        </div>
        {/* Amenities */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {hotel.has_wifi      && <span className="badge badge-blue"><i className="fas fa-wifi" /> {t("wifi")}</span>}
          {hotel.has_pool      && <span className="badge badge-blue"><i className="fas fa-swimming-pool" /> {t("pool")}</span>}
          {hotel.has_restaurant && <span className="badge badge-blue"><i className="fas fa-utensils" /> {t("restaurant")}</span>}
          {hotel.has_spa       && <span className="badge badge-blue"><i className="fas fa-spa" /> {t("spa")}</span>}
        </div>
        <div className="hotel-card-footer">
          <div className="hotel-card-price">
            <span className="amount">${hotel.price_per_night}</span>
            <span className="per"> {t("per_night")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.83rem", fontWeight: 600, color: "var(--text)" }}>
            <span style={{ color: "var(--gold)" }}>★</span>{hotel.rating}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── GUIDE CARD ── */
export function GuideCard({ guide, onClick, navigate, delay = 0, user }) {
  const { t } = useLang();
  const [fav, setFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (user && guide?.id) {
      api.checkFavorite("guide", guide.id).then(r => setFav(!!r?.is_favourite)).catch(() => {});
    }
  }, [user?.id, guide?.id]);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (!hasToken()) { if (navigate) navigate("login"); return; }
    if (favLoading) return;
    setFavLoading(true);
    try {
      const res = await api.toggleFavorite({ content_type: "guide", id: guide.id, item_name: guide.name });
      setFav(res?.removed ? false : true);
      window.dispatchEvent(new CustomEvent("nw-data-changed"));
    } catch {} finally { setFavLoading(false); }
  };

  const langs = guide.languages?.split(",").map(l => l.trim()).slice(0, 3) || [];

  const handleClick = () => {
    if (onClick) onClick();
    else if (navigate) navigate("guide-detail", { id: guide.id });
  };

  return (
    <div className="guide-card" onClick={handleClick}>
      <div style={{ position: "relative", width: "fit-content", margin: "0 auto" }}>
        <div className="guide-avatar-wrap">
          {guide.image ? (
            <img src={guide.image} alt={guide.name} className="guide-avatar" />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,var(--primary),var(--forest-600))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", border: "3px solid var(--primary)" }}>
              👤
            </div>
          )}
          {guide.is_certified && (
            <div className="guide-badge" title={t("certified_guide")}><i className="fas fa-check" /></div>
          )}
        </div>
        <button className={`dest-card-fav${fav ? " active" : ""}`}
          onClick={handleFav} title={fav ? "Remove from favourites" : "Save to favourites"} disabled={favLoading}
          style={{ position: "absolute", top: -4, right: -4, width: 28, height: 28 }}>
          <i className={fav ? "fas fa-heart" : "far fa-heart"} style={{ fontSize: "0.75rem" }} />
        </button>
      </div>

      {guide.is_certified && (
        <span className="badge badge-green" style={{ marginBottom: 8 }}>
          <i className="fas fa-certificate" /> {t("certified")}
        </span>
      )}

      <h3 className="guide-name">{guide.name}</h3>

      {guide.specialties && (
        <p className="guide-specialties">{guide.specialties}</p>
      )}

      <div className="guide-meta">
        <div className="guide-meta-item"><i className="fas fa-star" style={{ color: "var(--gold)" }} />{guide.rating}</div>
        <div className="guide-meta-item"><i className="fas fa-clock" />{guide.years_experience} {t("yrs_exp")}</div>
      </div>

      {langs.length > 0 && (
        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: 14 }}>
          {langs.map(l => (
            <span key={l} className="badge badge-blue" style={{ fontSize: "0.7rem" }}>{l}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div>
          <span className="guide-rate">${guide.price_per_day}</span>
          <span style={{ fontSize: "0.74rem", color: "var(--text4)" }}> {t("per_day")}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleClick}>
          {t("book_guide")} <i className="fas fa-arrow-right" />
        </button>
      </div>
    </div>
  );
}

/* ── REVIEW ITEM ── */
export function ReviewItem({ review, onDelete }) {
  const authorName = review.user?.first_name
    ? `${review.user.first_name} ${review.user.last_name || ""}`.trim()
    : review.user?.username || "Anonymous";

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-author">
          <div className="review-avatar">{authorName[0]?.toUpperCase()}</div>
          <div>
            <div className="review-name">{authorName}</div>
            <div className="review-date">{review.created_at?.slice(0, 10)}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StarRating rating={review.rating} />
          {onDelete && (
            <button onClick={onDelete} style={{ background: "none", border: "none", color: "var(--nepal-red)", cursor: "pointer", fontSize: "0.85rem" }}>
              <i className="fas fa-trash" />
            </button>
          )}
        </div>
      </div>
      <p className="review-text">{review.comment}</p>
    </div>
  );
}

/* ── REVIEW FORM ── */
export function ReviewForm({ onSubmit }) {
  const { t } = useLang();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hovered, setHovered] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onSubmit({ rating, comment });
    setComment(""); setRating(5);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: 20 }}>
      <h4 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, marginBottom: 14, color: "var(--text)", fontSize: "1rem" }}>
        ✍️ {t("write_review")}
      </h4>

      {success && (
        <div style={{ padding: "12px 16px", background: "rgba(22,163,74,0.09)", border: "1px solid rgba(22,163,74,0.22)", borderRadius: "var(--radius-lg)", marginBottom: 14, color: "var(--forest-600)", fontWeight: 600 }}>
          ✅ {t("review_success")}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{t("your_rating")}</label>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <span key={i} onClick={() => setRating(i)}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)}
              style={{ fontSize: "1.8rem", cursor: "pointer", color: i <= (hovered || rating) ? "var(--gold)" : "var(--text4)", transform: i <= (hovered || rating) ? "scale(1.2)" : "scale(1)", display: "inline-block", transition: "all 0.15s", userSelect: "none" }}>
              ★
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <textarea className="input" rows={3} placeholder={t("review_placeholder")}
          value={comment} onChange={e => setComment(e.target.value)} required
          style={{ resize: "vertical" }} />
      </div>

      <button type="submit" className="btn btn-primary">
        <i className="fas fa-paper-plane" /> {t("submit_review")}
      </button>
    </form>
  );
}

/* ── MAP EMBED ── */
export function MapEmbed({ lat, lng, name }) {
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <iframe src={url} title={`Map of ${name}`} loading="lazy"
      style={{ width: "100%", height: 280, border: "none", borderRadius: "var(--radius-xl)" }} />
  );
}
