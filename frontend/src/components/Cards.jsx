import { useState } from "react";
import { useLang } from "../context/LangContext";
import NepalImage from "./common/NepalImage";

export function StarRating({ rating, size = "1rem" }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            fontSize: size,
            color: i <= Math.round(rating) ? "var(--clay-gold)" : "var(--text4)",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

/* ─── DESTINATION CARD — entire card is clickable ─── */
export function DestinationCard({ dest, navigate, delay = 0 }) {
  const { t } = useLang();

  const destName = t(dest.name_key || dest.name);
  const destShort = t(dest.short_description_key || dest.short_description);
  const destCity = t(dest.city_key || dest.city);
  const destCountry = t(dest.country_key || dest.country);
  const destCategory = dest.category ? t(dest.category.name_key || dest.category.name || dest.category.slug) : "";

  return (
    <div
      className="dest-card anim-fadeup"
      style={{ animationDelay: `${delay}s`, cursor: "pointer" }}
      onClick={() => navigate("destination-detail", { id: dest.id })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("destination-detail", { id: dest.id })}
    >
      <div className="dest-card-img">
        <NepalImage
          item={dest}
          entityType="destination"
          style={{ width: "100%", height: "100%" }}
        />

        <div className="dest-card-overlay"></div>

        {dest.category && (
          <span
            className="card-chip card-chip-tl"
            style={{
              background: "linear-gradient(135deg,rgba(102,126,234,0.95),rgba(118,75,162,0.95))",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            }}
          >
            {destCategory}
          </span>
        )}

        <span
          className="card-chip card-chip-tr"
          style={{
            background: "linear-gradient(135deg,rgba(255,193,7,0.95),rgba(255,140,0,0.95))",
            color: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          ⭐ {dest.rating}
        </span>

        <span
          className="card-chip card-chip-bl"
          style={{
            background: "linear-gradient(135deg,rgba(15,32,39,0.92),rgba(44,83,100,0.92))",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.16)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
          }}
        >
          📍 {destCity}, {destCountry}
        </span>
      </div>

      <div className="dest-card-body">
        <h5>{destName}</h5>
        <p>
          {destShort?.slice(0, 88)}
          {destShort?.length > 88 ? "..." : ""}
        </p>

        <div className="card-footer">
          {dest.entry_fee > 0 ? (
            <span style={{ color: "var(--text3)", fontSize: "0.85rem", fontWeight: 700 }}>
              {t("from")} ${dest.entry_fee}
            </span>
          ) : (
            <span className="badge badge-green" style={{ background:"linear-gradient(135deg,#11998e,#38ef7d)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)" }}>
              {t("free_entry")}
            </span>
          )}
          {dest.difficulty && (
            <span style={{
              fontSize:"0.72rem", fontWeight:800, padding:"4px 10px", borderRadius:99,
              background: dest.difficulty==="Easy" ? "rgba(6,214,160,0.12)" : dest.difficulty==="Moderate" ? "rgba(255,209,102,0.2)" : dest.difficulty==="Challenging" ? "rgba(255,95,109,0.12)" : "rgba(232,72,85,0.12)",
              color: dest.difficulty==="Easy" ? "var(--clay-green)" : dest.difficulty==="Moderate" ? "#b8860b" : dest.difficulty==="Challenging" ? "var(--clay-red)" : "var(--clay-red)",
              border:"2px solid currentColor"
            }}>
              {dest.difficulty}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── HOTEL CARD — entire card is clickable ─── */
export function HotelCard({ hotel, navigate, delay = 0 }) {
  const { t } = useLang();

  const hotelCity = t(hotel.destination?.city_key || hotel.destination?.city || "");
  const hotelCountry = t(hotel.destination?.country_key || hotel.destination?.country || "");

  return (
    <div
      className="hotel-card anim-fadeup"
      style={{ animationDelay: `${delay}s`, cursor: "pointer" }}
      onClick={() => navigate("hotel-detail", { id: hotel.id })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("hotel-detail", { id: hotel.id })}
    >
      <div className="dest-card-img">
        <NepalImage
          item={hotel}
          entityType="hotel"
          style={{ width: "100%", height: "100%" }}
        />

        <div className="dest-card-overlay"></div>

        <span
          className="card-chip card-chip-tl"
          style={{
            background: "linear-gradient(135deg,rgba(255,179,71,0.96),rgba(255,140,0,0.96))",
            color: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          {"★".repeat(hotel.stars)}
        </span>

        <span
          className="card-chip card-chip-tr"
          style={{
            background: "linear-gradient(135deg,rgba(54,209,220,0.96),rgba(91,134,229,0.96))",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}
        >
          ⭐ {hotel.rating}
        </span>
      </div>

      <div className="dest-card-body">
        <h5>{hotel.name}</h5>
        <p style={{ fontSize: "0.82rem", marginBottom: 10, color: "var(--text3)" }}>
          📍 {hotelCity}, {hotelCountry}
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {hotel.has_wifi && (
            <span
              className="amenity-chip on"
              style={{
                background: "linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.12))",
                borderColor: "rgba(102,126,234,0.25)",
              }}
            >
              <i className="fas fa-wifi"></i> {t("wifi")}
            </span>
          )}
          {hotel.has_pool && (
            <span
              className="amenity-chip on"
              style={{
                background: "linear-gradient(135deg,rgba(54,209,220,0.12),rgba(91,134,229,0.12))",
                borderColor: "rgba(54,209,220,0.25)",
              }}
            >
              <i className="fas fa-swimming-pool"></i> {t("pool")}
            </span>
          )}
          {hotel.has_restaurant && (
            <span
              className="amenity-chip on"
              style={{
                background: "linear-gradient(135deg,rgba(247,151,30,0.12),rgba(255,210,0,0.12))",
                borderColor: "rgba(247,151,30,0.25)",
              }}
            >
              <i className="fas fa-utensils"></i> {t("restaurant")}
            </span>
          )}
          {hotel.has_spa && (
            <span
              className="amenity-chip on"
              style={{
                background: "linear-gradient(135deg,rgba(255,95,109,0.12),rgba(255,195,113,0.12))",
                borderColor: "rgba(255,95,109,0.25)",
              }}
            >
              <i className="fas fa-spa"></i> {t("spa")}
            </span>
          )}
        </div>

        <div className="card-footer">
          <div>
            <span
              className="price-tag"
              style={{
                background: "linear-gradient(135deg,#f7971e,#ffd200)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              ${hotel.price_per_night}
            </span>
            <small style={{ color: "var(--text3)", fontWeight: 700 }}>{t("per_night")}</small>
          </div>


        </div>
      </div>
    </div>
  );
}

/* ─── GUIDE CARD — entire card is clickable ─── */
export function GuideCard({ guide, navigate, delay = 0 }) {
  const { t } = useLang();
  const langs = guide.languages?.split(",").map((l) => l.trim()).slice(0, 3) || [];

  return (
    <div
      className="guide-card anim-fadeup"
      style={{ animationDelay: `${delay}s`, cursor: "pointer" }}
      onClick={() => navigate("guide-detail", { id: guide.id })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("guide-detail", { id: guide.id })}
    >
      {guide.image ? (
        <img src={guide.image} alt={guide.name} className="guide-avatar" />
      ) : (
        <div
          className="guide-avatar-ph"
          style={{
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            color: "#fff",
          }}
        >
          👤
        </div>
      )}

      {guide.is_certified && (
        <span
          className="badge badge-solid-green"
          style={{
            marginBottom: 10,
            display: "inline-block",
            background: "linear-gradient(135deg,#11998e,#38ef7d)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          ✓ {t("certified")}
        </span>
      )}

      <h5 style={{ fontWeight: 800, marginBottom: 4, color: "var(--text)" }}>{guide.name}</h5>

      <p style={{ color: "var(--text3)", fontSize: "0.82rem", marginBottom: 8, fontWeight: 600 }}>
        ⭐ {guide.rating} · {guide.years_experience} {t("yrs_exp")}
      </p>

      {guide.specialties && (
        <p style={{ color: "var(--text3)", fontSize: "0.8rem", marginBottom: 12, fontWeight: 500 }}>
          {guide.specialties.slice(0, 55)}...
        </p>
      )}

      <div style={{ marginBottom: 14 }}>
        {langs.map((l) => (
          <span
            key={l}
            className="lang-tag"
            style={{
              background: "linear-gradient(135deg,rgba(102,126,234,0.12),rgba(118,75,162,0.12))",
              borderColor: "rgba(102,126,234,0.22)",
            }}
          >
            {l}
          </span>
        ))}
      </div>

      <div className="card-footer">
        <div>
          <span
            className="price-tag"
            style={{
              fontSize: "1.1rem",
              background: "linear-gradient(135deg,#11998e,#38ef7d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            ${guide.price_per_day}
          </span>
          <small style={{ color: "var(--text3)", fontWeight: 700 }}>{t("per_day")}</small>
        </div>


      </div>
    </div>
  );
}

/* ─── REVIEW ITEM ─── */
export function ReviewItem({ review }) {
  return (
    <div className="review-item">
      <div
        className="review-avatar"
        style={{
          background: "linear-gradient(135deg,#667eea,#764ba2)",
          boxShadow: "0 8px 18px rgba(102,126,234,0.22)",
        }}
      >
        <i className="fas fa-user" style={{ color: "#fff" }}></i>
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <strong style={{ color: "var(--text)", fontWeight: 800 }}>
            {review.user?.first_name} {review.user?.last_name || review.user?.username}
          </strong>
          <small style={{ color: "var(--text3)", fontWeight: 600 }}>{review.created_at}</small>
        </div>

        <StarRating rating={review.rating} />

        <p
          style={{
            color: "var(--text2)",
            marginTop: 6,
            marginBottom: 0,
            fontSize: "0.9rem",
            fontWeight: 500,
            lineHeight: 1.6,
          }}
        >
          {review.comment}
        </p>
      </div>
    </div>
  );
}

/* ─── REVIEW FORM ─── */
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
    setComment("");
    setRating(5);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} style={{ paddingTop: 20 }}>
      <h6 style={{ fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
        ✍️ {t("write_review")}
      </h6>

      {success && (
        <div
          style={{
            padding: "12px 16px",
            background: "linear-gradient(135deg,rgba(17,153,142,0.12),rgba(56,239,125,0.12))",
            border: "3px solid rgba(17,153,142,0.22)",
            borderRadius: 14,
            marginBottom: 12,
            color: "var(--clay-green)",
            fontWeight: 800,
          }}
        >
          {t("review_success")}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            fontSize: "0.8rem",
            fontWeight: 800,
            color: "var(--text2)",
            display: "block",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {t("your_rating")}
        </label>

        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              style={{
                fontSize: "1.8rem",
                cursor: "pointer",
                userSelect: "none",
                color: i <= (hovered || rating) ? "var(--clay-gold)" : "var(--text4)",
                transform: i <= (hovered || rating) ? "scale(1.2)" : "scale(1)",
                display: "inline-block",
                transition: "transform 0.15s, color 0.15s",
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <textarea
          className="clay-input"
          rows={3}
          placeholder={t("write_review") + "..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          style={{
            resize: "vertical",
            marginBottom: 0,
            background: "linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))",
          }}
        />
      </div>

      <button
        type="submit"
        className="clay-btn clay-btn-red"
        style={{
          background: "linear-gradient(135deg,#ff5f6d,#ffc371)",
          color: "#fff",
          border: "none",
          boxShadow: "0 10px 22px rgba(255,95,109,0.22)",
        }}
      >
        <i className="fas fa-paper-plane"></i> {t("submit_review")}
      </button>
    </form>
  );
}

/* ─── MAP EMBED ─── */
export function MapEmbed({ lat, lng, name }) {
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lng}`;
  return <iframe src={url} className="clay-map" title={`Map of ${name}`} loading="lazy" style={{ border: "none" }} />;
}