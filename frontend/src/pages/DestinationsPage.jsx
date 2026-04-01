import { useState, useEffect } from "react";
import { destinations as mockDests, categories, hotels as mockHotels } from "../data/mockData";
import { DestinationCard, ReviewItem, ReviewForm, MapEmbed } from "../components/Cards";
import { api } from "../api";
import { useLang } from "../context/LangContext";
import NepalImage from "../components/common/NepalImage";

export function DestinationsPage({ navigate, user }) {
  const { t } = useLang();
  const [selCat, setSelCat] = useState("");
  const [selCountry, setSelCountry] = useState("");
  const [sort, setSort] = useState("-rating");
  const [destinations, setDestinations] = useState(mockDests);

  useEffect(() => {
    api.destinations().then(data => {
      const items = Array.isArray(data) ? data : data?.results;
      if (items?.length) setDestinations(items);
    }).catch(() => {});
  }, []);

  const countries = [...new Set(destinations.map((d) => d.country_key || d.country || "Nepal"))];

  let filtered = destinations
    .filter((d) => !selCat || (d.category?.slug || d.category?.name?.toLowerCase()) === selCat)
    .filter((d) => !selCountry || (d.country_key || d.country) === selCountry);

  if (sort === "-rating") filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  if (sort === "name") filtered = [...filtered].sort((a, b) => (a.name||"").localeCompare(b.name||""));
  if (sort === "entry_fee") filtered = [...filtered].sort((a, b) => a.entry_fee - b.entry_fee);
  if (sort === "-entry_fee") filtered = [...filtered].sort((a, b) => b.entry_fee - a.entry_fee);

  return (
    <div>
      <div className="page-header">
        <div className="inner container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a onClick={() => navigate("home")}>{t("home")}</a>
            </li>
            <li className="breadcrumb-item">{t("destinations")}</li>
          </ol>
          <h1>🗺️ {t("explore_destinations")}</h1>
          <p>{t("discover_places_nepal")}</p>
        </div>
      </div>

      <div className="container section">
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>
          <div className="filter-sidebar">
            <h6>🔍 {t("filter_results")}</h6>

            <label className="form-lbl">{t("category")}</label>
            <select className="clay-select" value={selCat} onChange={(e) => setSelCat(e.target.value)}>
              <option value="">{t("all_categories")}</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug || c.name?.toLowerCase()}>
                  {c.icon} {t(c.name_key || c.name || c.slug)}
                </option>
              ))}
            </select>

            <label className="form-lbl">{t("country")}</label>
            <select className="clay-select" value={selCountry} onChange={(e) => setSelCountry(e.target.value)}>
              <option value="">{t("all_countries")}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {t(c)}
                </option>
              ))}
            </select>

            <label className="form-lbl">{t("sort_by")}</label>
            <select className="clay-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="-rating">{t("top_rated")}</option>
              <option value="name">{t("name_az")}</option>
              <option value="entry_fee">{t("price_low")}</option>
              <option value="-entry_fee">{t("price_high")}</option>
            </select>

            {(selCat || selCountry) && (
              <button
                className="clay-btn clay-btn-outline clay-btn-sm clay-btn-full"
                onClick={() => {
                  setSelCat("");
                  setSelCountry("");
                }}
              >
                ✕ {t("clear_filters")}
              </button>
            )}
          </div>

          <div>
            <p style={{ color: "var(--text3)", marginBottom: 24, fontWeight: 700 }}>
              {filtered.length} {t("destinations_found")}
            </p>

            {filtered.length > 0 ? (
              <div className="grid-3">
                {filtered.map((dest, i) => (
                  <DestinationCard key={dest.id} dest={dest} navigate={navigate} delay={i * 0.04} user={user} />
                ))}
              </div>
            ) : (
              <div className="clay-card text-center" style={{ padding: 60 }}>
                <div style={{ fontSize: "4rem", marginBottom: 16 }}>🔍</div>
                <h5 style={{ color: "var(--text3)", fontWeight: 800 }}>{t("no_destinations_found")}</h5>
                <p style={{ color: "var(--text4)", fontWeight: 600 }}>{t("try_adjusting_filters")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){.container.section>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

export function DestinationDetailPage({ navigate, pageParams, user }) {
  const { t } = useLang();
  const mockDest = mockDests.find((d) => d.id === pageParams.id) || mockDests[0];
  const [dest, setDest] = useState(mockDest);
  const nearby = mockDests.filter((d) => d.id !== dest.id && (d.country_key || d.country) === (dest.country_key || dest.country)).slice(0, 4);
  const nearbyHotels = mockHotels.filter((h) => h.destination.city === dest.city).slice(0, 3);

  const [reviews, setReviews] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Try to load from backend by slug
    if (dest.slug) {
      api.destination(dest.slug).then(d => { if (d?.id) setDest(d); }).catch(() => {});
    }
    fetch(`/api/destinations/${dest.slug || dest.id}/reviews/`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setReviews(d); }).catch(() => setReviews([]));
    if (user) {
      api.addVisit({ content_type: "destination", destination_id: dest.id, item_name: dest.name }).catch(() => {});
      api.checkFavorite("destination", dest.id).then(r => setSaved(!!r?.is_favourite)).catch(() => {});
    }
  }, [dest.id, user?.id]);

  const handleReviewSubmit = async (r) => {
    if (!user) { navigate("login"); return; }
    try {
      const saved_review = await api.submitReview({ content_type: "destination", destination_id: dest.id, rating: r.rating, comment: r.comment });
      setReviews(prev => [saved_review, ...prev]);
      navigate("profile", { tab: "reviews" });
      setTimeout(() => window.dispatchEvent(new CustomEvent("nw-data-changed")), 0);
    } catch {}
  };

  const handleSave = async () => {
    if (!user) { navigate("login"); return; }
    try {
      const res = await api.toggleFavorite({ content_type: "destination", id: dest.id, item_name: dest.name });
      setSaved(res?.removed ? false : true);
      window.dispatchEvent(new CustomEvent("nw-data-changed"));
    } catch {}
  };

  const tips = [
    { category: t("health"), tip: t("tip_health") },
    { category: t("packing"), tip: t("tip_packing") },
    { category: t("culture"), tip: t("tip_culture") },
    { category: t("safety"), tip: t("tip_safety") },
  ];

  const destName = t(dest.name_key || dest.name);
  const destDescription = t(dest.description_key || dest.description);
  const destCity = t(dest.city_key || dest.city);
  const destCountry = t(dest.country_key || dest.country);
  const destCategory = dest.category ? t(dest.category.name_key || dest.category.name || dest.category.slug) : "";

  return (
    <div>
      <div className="detail-hero">
        <NepalImage item={dest} entityType="destination" style={{ width: "100%", height: "100%" }} showCredit={true} />

        <div className="detail-hero-overlay"></div>

        <div className="detail-hero-content">
          <div className="container">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a onClick={() => navigate("home")}>{t("home")}</a>
              </li>
              <li className="breadcrumb-item">
                <a onClick={() => navigate("destinations")}>{t("destinations")}</a>
              </li>
              <li className="breadcrumb-item">{destName}</li>
            </ol>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                {dest.category && (
                  <span className="badge badge-solid-red" style={{ marginBottom: 8, display: "inline-block" }}>
                    {destCategory}
                  </span>
                )}

                <h1
                  style={{
                    color: "#fff",
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "2.5rem",
                    fontWeight: 900,
                    marginBottom: 4,
                  }}
                >
                  {destName}
                </h1>

                <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                  📍 {destCity}, {destCountry}
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span
                  style={{
                    background: "rgba(255,209,102,0.9)",
                    color: "#1a1a2e",
                    padding: "8px 18px",
                    borderRadius: 99,
                    fontWeight: 800,
                    boxShadow: "4px 4px 0px rgba(0,0,0,0.15)",
                  }}
                >
                  ⭐ {dest.rating}/5
                </span>

                <button
                  className="clay-btn clay-btn-outline"
                  style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}
                  onClick={handleSave}
                >
                  {saved ? "❤️" : "🤍"} {saved ? `${t("save_favorite")} ✓` : t("save_favorite")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: "60px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "flex-start" }}>
          <div>
            <div className="clay-card mb-24" style={{ padding: 32 }}>
              <h4 style={{ fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>
                {t("about_destination")} {destName}
              </h4>
              <p style={{ color: "var(--text2)", lineHeight: 1.8, fontWeight: 500 }}>{destDescription}</p>
            </div>

            <div className="clay-card mb-24" style={{ padding: 32 }}>
              <h5 style={{ fontWeight: 800, marginBottom: 20, color: "var(--text)" }}>⚡ {t("quick_info")}</h5>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  {
                    icon: "fa-calendar",
                    label: t("best_time"),
                    value: dest.best_time_to_visit_key ? t(dest.best_time_to_visit_key) : (dest.best_time_to_visit || t("year_round")),
                    color: "#4361ee",
                  },
                  {
                    icon: "fa-ticket-alt",
                    label: t("entry_fee"),
                    value: dest.entry_fee > 0 ? `${dest.currency} ${dest.entry_fee}` : t("free"),
                    color: "#f59e0b",
                  },
                  {
                    icon: "fa-mountain",
                    label: t("altitude"),
                    value: dest.altitude_key ? t(dest.altitude_key) : (dest.altitude || t("varies")),
                    color: "#06d6a0",
                  },
                  {
                    icon: "fa-hiking",
                    label: t("difficulty"),
                    value: dest.difficulty_key ? t(dest.difficulty_key) : (dest.difficulty || t("moderate")),
                    color: "#e84855",
                  },
                ].map((item) => (
                  <div key={item.label} className="info-row">
                    <div
                      className="info-icon-box"
                      style={{ background: `linear-gradient(135deg,${item.color},${item.color}99)` }}
                    >
                      <i className={`fas ${item.icon}`} style={{ color: "#fff", fontSize: "0.9rem" }}></i>
                    </div>
                    <div>
                      <small style={{ color: "var(--text3)", fontWeight: 700, display: "block" }}>{item.label}</small>
                      <strong style={{ color: "var(--text)", fontWeight: 800 }}>{item.value}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {dest.latitude && dest.longitude && (
              <div className="clay-card mb-24" style={{ padding: 32 }}>
                <h5 style={{ fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>🗺️ {t("location_map")}</h5>
                <MapEmbed lat={dest.latitude} lng={dest.longitude} name={destName} />
              </div>
            )}

            <div className="clay-card mb-24" style={{ padding: 32 }}>
              <h5 style={{ fontWeight: 800, marginBottom: 20, color: "var(--text)" }}>💡 {t("travel_tips")}</h5>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {tips.map((tip) => (
                  <div
                    key={tip.category}
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      background: "var(--bg)",
                      border: "var(--clay-border)",
                      borderLeft: "4px solid var(--clay-blue)",
                      boxShadow: "3px 3px 0px rgba(0,0,0,0.06)",
                    }}
                  >
                    <span className="badge badge-blue" style={{ marginBottom: 8, display: "inline-block", fontSize: "0.68rem" }}>
                      {tip.category}
                    </span>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text2)", fontWeight: 500, lineHeight: 1.6 }}>
                      {tip.tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="clay-card" style={{ padding: 32 }}>
              <h5 style={{ fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>
                ⭐ {t("reviews")} ({reviews.length})
              </h5>

              {reviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}

              {user ? (
                <ReviewForm onSubmit={handleReviewSubmit} />
              ) : (
                <div
                  style={{
                    padding: 16,
                    background: "rgba(67,97,238,0.08)",
                    borderRadius: 14,
                    border: "var(--clay-border)",
                    color: "var(--text2)",
                    fontWeight: 600,
                  }}
                >
                  <span className="auth-link" onClick={() => navigate("login")}>
                    {t("login")}
                  </span>{" "}
                  {t("login_to_review")}
                </div>
              )}
            </div>
          </div>

          <div>
            {nearbyHotels.length > 0 && (
              <div className="clay-card mb-24" style={{ padding: 24 }}>
                <h6 style={{ fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>🏨 {t("hotels_here")}</h6>

                {nearbyHotels.map((hotel) => (
                  <div
                    key={hotel.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      marginBottom: 16,
                      paddingBottom: 16,
                      borderBottom: "2px dashed rgba(0,0,0,0.06)",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("hotel-detail", { id: hotel.id })}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 14,
                        overflow: "hidden",
                        flexShrink: 0,
                        boxShadow: "3px 3px 0px rgba(0,0,0,0.1)",
                      }}
                    >
                      {hotel.image ? (
                        <img src={hotel.image} alt={hotel.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <NepalImage item={hotel} entityType="hotel" style={{ width: "100%", height: "100%" }} />
                      )}
                    </div>

                    <div>
                      <strong style={{ fontSize: "0.875rem", color: "var(--text)", display: "block", fontWeight: 800 }}>
                        {hotel.name}
                      </strong>
                      <span style={{ color: "var(--clay-gold)", fontSize: "0.8rem" }}>{"★".repeat(hotel.stars)}</span>
                      <div style={{ color: "var(--clay-red)", fontWeight: 800, fontSize: "0.875rem" }}>
                        ${hotel.price_per_night}
                        {t("per_night")}
                      </div>
                    </div>
                  </div>
                ))}

                <button className="clay-btn clay-btn-outline clay-btn-sm clay-btn-full" onClick={() => navigate("hotels")}>
                  {t("all_hotels")}
                </button>
              </div>
            )}

            {nearby.length > 0 && (
              <div className="clay-card" style={{ padding: 24 }}>
                <h6 style={{ fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>📍 {t("nearby_destinations")}</h6>

                {nearby.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 16,
                      paddingBottom: 16,
                      borderBottom: "2px dashed rgba(0,0,0,0.06)",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("destination-detail", { id: d.id })}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 12,
                        overflow: "hidden",
                        flexShrink: 0,
                        boxShadow: "3px 3px 0px rgba(0,0,0,0.1)",
                      }}
                    >
                      {d.image ? (
                        <img src={d.image} alt={t(d.name_key || d.name)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <NepalImage item={d} entityType="destination" style={{ width: "100%", height: "100%" }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "0.875rem", color: "var(--text)", display: "block", fontWeight: 800 }}>
                        {t(d.name_key || d.name)}
                      </strong>
                      <small style={{ color: "var(--text3)", fontWeight: 600 }}>{t(d.city_key || d.city)}</small>
                    </div>

                    <span style={{ color: "var(--clay-gold)", fontWeight: 800, fontSize: "0.8rem" }}>⭐{d.rating}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){.container>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

export default DestinationsPage;