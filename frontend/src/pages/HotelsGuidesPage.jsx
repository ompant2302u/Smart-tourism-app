import { useState, useEffect } from "react";
import { hotels as mockHotels, guides as mockGuides, destinations as mockDests } from "../data/mockData";
import { HotelCard, GuideCard, ReviewItem, ReviewForm, MapEmbed } from "../components/Cards";
import NepalImage from "../components/common/NepalImage";
import { api } from "../api";
import { useLang } from "../context/LangContext";
import { BookingModal } from "../components/BookingModal";

/* ─── HOTELS LIST ─── */
export function HotelsPage({ navigate, user }) {
  const { t } = useLang();
  const [selDest, setSelDest] = useState("");
  const [selStars, setSelStars] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("-rating");
  const [hotels, setHotels] = useState(mockHotels);
  const [destinations, setDestinations] = useState(mockDests);

  useEffect(() => {
    api.hotels().then(data => {
      const items = Array.isArray(data) ? data : data?.results;
      if (items?.length) setHotels(items);
    }).catch(() => {});
    api.destinations().then(data => {
      const items = Array.isArray(data) ? data : data?.results;
      if (items?.length) setDestinations(items);
    }).catch(() => {});
  }, []);

  let filtered = hotels
    .filter((h) => !selDest || String(h.destination?.id) === selDest)
    .filter((h) => !selStars || h.stars === parseInt(selStars))
    .filter((h) => !maxPrice || h.price_per_night <= parseInt(maxPrice));

  if (sort === "-rating") filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  if (sort === "price_per_night") filtered = [...filtered].sort((a, b) => a.price_per_night - b.price_per_night);
  if (sort === "-price_per_night") filtered = [...filtered].sort((a, b) => b.price_per_night - a.price_per_night);
  if (sort === "-stars") filtered = [...filtered].sort((a, b) => b.stars - a.stars);

  return (
    <div>
      <div className="page-header">
        <div className="inner container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a onClick={() => navigate("home")}>{t("home")}</a>
            </li>
            <li className="breadcrumb-item">{t("hotels")}</li>
          </ol>
          <h1>🏨 {t("find_hotel")}</h1>
          <p>{t("hotel_sub")}</p>
        </div>
      </div>

      <div className="container section">
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>
          <div className="filter-sidebar">
            <h6>🔍 {t("filter_hotels")}</h6>

            <label className="form-lbl">{t("destination")}</label>
            <select className="clay-select" value={selDest} onChange={(e) => setSelDest(e.target.value)}>
              <option value="">{t("all_destinations")}</option>
              {destinations.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.city}, {d.country}
                </option>
              ))}
            </select>

            <label className="form-lbl">{t("stars")}</label>
            <select className="clay-select" value={selStars} onChange={(e) => setSelStars(e.target.value)}>
              <option value="">{t("any_stars")}</option>
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {s} ★
                </option>
              ))}
            </select>

            <label className="form-lbl">{t("max_price")}</label>
            <input
              className="clay-input"
              type="number"
              placeholder={t("price_example")}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />

            <label className="form-lbl">{t("sort_by")}</label>
            <select className="clay-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="-rating">{t("top_rated")}</option>
              <option value="price_per_night">{t("price_low")}</option>
              <option value="-price_per_night">{t("price_high")}</option>
              <option value="-stars">{t("most_stars")}</option>
            </select>

            <button
              className="clay-btn clay-btn-outline clay-btn-sm clay-btn-full"
              onClick={() => {
                setSelDest("");
                setSelStars("");
                setMaxPrice("");
                setSort("-rating");
              }}
            >
              ✕ {t("clear")}
            </button>
          </div>

          <div>
            <p style={{ color: "var(--text3)", marginBottom: 24, fontWeight: 700 }}>
              {filtered.length} {t("hotels_found")}
            </p>

            {filtered.length > 0 ? (
              <div className="grid-2">
                {filtered.map((h, i) => (
                  <HotelCard key={h.id} hotel={h} navigate={navigate} delay={i * 0.05} user={user} />
                ))}
              </div>
            ) : (
              <div className="clay-card text-center" style={{ padding: 60 }}>
                <div style={{ fontSize: "4rem", marginBottom: 16 }}>🏨</div>
                <h5 style={{ color: "var(--text3)", fontWeight: 800 }}>{t("no_hotels_found")}</h5>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){.container.section>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

/* ─── HOTEL DETAIL ─── */
export function HotelDetailPage({ navigate, pageParams, user }) {
  const { t } = useLang();
  const [hotel, setHotel] = useState(mockHotels.find((h) => h.id === pageParams.id) || mockHotels[0]);
  const nearby = mockHotels.filter((h) => h.id !== hotel.id && h.destination?.city === hotel.destination?.city);

  const [reviews, setReviews] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(null);

  useEffect(() => {
    if (hotel.slug) {
      api.hotel(hotel.slug).then(d => { if (d?.id) setHotel(d); }).catch(() => {});
    }
    fetch(`/api/hotels/${hotel.slug || hotel.id}/reviews/`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setReviews(d); }).catch(() => setReviews([]));
    if (user) {
      api.addVisit({ content_type: "hotel", hotel_id: hotel.id, item_name: hotel.name }).catch(() => {});
      api.checkFavorite("hotel", hotel.id).then(r => setSaved(!!r?.is_favourite)).catch(() => {});
    }
  }, [hotel.id, user?.id]);

  const handleSave = async () => {
    if (!user) { navigate("login"); return; }
    try {
      const res = await api.toggleFavorite({ content_type: "hotel", id: hotel.id, item_name: hotel.name });
      setSaved(res?.removed ? false : true);
      window.dispatchEvent(new CustomEvent("nw-data-changed"));
    } catch {}
  };

  const handleReviewSubmit = async (r) => {
    if (!user) { navigate("login"); return; }
    try {
      const saved_review = await api.submitReview({ content_type: "hotel", hotel_id: hotel.id, rating: r.rating, comment: r.comment });
      setReviews(prev => [saved_review, ...prev]);
      navigate("profile", { tab: "reviews" });
      setTimeout(() => window.dispatchEvent(new CustomEvent("nw-data-changed")), 0);
    } catch {}
  };

  return (
    <div>
      <div className="detail-hero">
        <NepalImage item={hotel} entityType="hotel" style={{ width: "100%", height: "100%" }} showCredit={true} />
        <div className="detail-hero-overlay"></div>
        <div className="detail-hero-content">
          <div className="container">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a onClick={() => navigate("home")}>{t("home")}</a>
              </li>
              <li className="breadcrumb-item">
                <a onClick={() => navigate("hotels")}>{t("hotels")}</a>
              </li>
              <li className="breadcrumb-item">{hotel.name}</li>
            </ol>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ color: "var(--clay-gold)", fontSize: "1.1rem", marginBottom: 4 }}>
                  {"★".repeat(hotel.stars)}
                </div>
                <h1
                  style={{
                    color: "#fff",
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "2.2rem",
                    fontWeight: 900,
                    marginBottom: 4,
                  }}
                >
                  {hotel.name}
                </h1>
                <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>📍 {hotel.address}</p>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    background: "rgba(255,209,102,0.9)",
                    color: "#1a1a2e",
                    padding: "6px 16px",
                    borderRadius: 99,
                    fontWeight: 800,
                    marginBottom: 8,
                    display: "inline-block",
                  }}
                >
                  ⭐ {hotel.rating}/5
                </div>
                <div style={{ color: "#fff", fontSize: "1.8rem", fontWeight: 900, fontFamily: "'Playfair Display',serif" }}>
                  ${hotel.price_per_night}
                  <span
                    style={{
                      fontSize: "0.9rem",
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: "Nunito",
                      fontWeight: 600,
                    }}
                  >
                    {t("per_night")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: "60px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "flex-start" }}>
          <div>
            <div className="clay-card mb-24" style={{ padding: 32 }}>
              <h4 style={{ fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>{t("about_this_hotel")}</h4>
              <p style={{ color: "var(--text2)", lineHeight: 1.8, fontWeight: 500, marginBottom: 24 }}>{hotel.description}</p>

              <hr style={{ border: "none", borderTop: "3px dashed rgba(0,0,0,0.06)", marginBottom: 24 }} />
              <h6 style={{ fontWeight: 800, marginBottom: 14, color: "var(--text)" }}>🎯 {t("amenities")}</h6>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  { k: "has_wifi", icon: "fa-wifi", l: t("wifi") },
                  { k: "has_pool", icon: "fa-swimming-pool", l: t("pool") },
                  { k: "has_gym", icon: "fa-dumbbell", l: t("gym") },
                  { k: "has_restaurant", icon: "fa-utensils", l: t("restaurant") },
                  { k: "has_parking", icon: "fa-parking", l: t("parking") },
                  { k: "has_spa", icon: "fa-spa", l: t("spa") },
                ].map((a) => (
                  <span key={a.k} className={`amenity-chip${hotel[a.k] ? " on" : ""}`}>
                    <i className={`fas ${a.icon}`}></i> {a.l}
                  </span>
                ))}
              </div>
            </div>

            {hotel.latitude && hotel.longitude && (
              <div className="clay-card mb-24" style={{ padding: 32 }}>
                <h5 style={{ fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>🗺️ {t("location")}</h5>
                <MapEmbed lat={hotel.latitude} lng={hotel.longitude} name={hotel.name} />
              </div>
            )}

            <div className="clay-card" style={{ padding: 32 }}>
              <h5 style={{ fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>
                ⭐ {t("guest_reviews")} ({reviews.length})
              </h5>

              {reviews.map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}

              {user ? (
                <ReviewForm onSubmit={handleReviewSubmit} />
              ) : (
                <div style={{ padding:16, background:"rgba(67,97,238,0.08)", borderRadius:14, border:"var(--clay-border)", fontWeight:600, color:"var(--text2)" }}>
                  <span className="auth-link" onClick={() => navigate("login")}>{t("login")}</span>{" "}{t("login_to_review")}
                </div>
              )}
            </div>
          </div>

          <div className="detail-sidebar-col">
            <div className="clay-card" style={{ padding: 24 }}>
              <h5 style={{ fontWeight: 800, marginBottom: 14, color: "var(--text)" }}>📋 {t("book_hotel")}</h5>

              <div className="price-tag mb-16">
                ${hotel.price_per_night}
                <small
                  style={{
                    color: "var(--text3)",
                    fontSize: "0.9rem",
                    fontFamily: "Nunito",
                    fontWeight: 600,
                  }}
                >
                  {t("per_night")}
                </small>
              </div>

              {hotel.phone && (
                <p style={{ marginBottom: 8, color: "var(--text2)", fontSize: "0.9rem", fontWeight: 600 }}>
                  📞 {hotel.phone}
                </p>
              )}
              {hotel.email && (
                <p style={{ marginBottom: 16, color: "var(--text2)", fontSize: "0.9rem", fontWeight: 600 }}>
                  ✉️ {hotel.email}
                </p>
              )}

              {bookingDone && (
                <div style={{ padding:"10px 14px",background:"rgba(6,214,160,0.12)",border:"3px solid rgba(6,214,160,0.25)",borderRadius:12,marginBottom:12,color:"var(--clay-green)",fontWeight:800,fontSize:"0.85rem" }}>
                  ⏳ Booking submitted! ${bookingDone.amount} paid via {bookingDone.method?.toUpperCase()}. Awaiting admin approval.
                </div>
              )}

              <button className="clay-btn clay-btn-red clay-btn-full mb-8" onClick={() => { if (!user) { navigate("login"); return; } setShowBooking(true); }}>
                <i className="fas fa-calendar-check"></i> {t("book_now")}
              </button>

              <button
                className="clay-btn clay-btn-blue clay-btn-full mb-8"
                onClick={() => navigate("destination-detail", { id: hotel.destination.id })}
              >
                📍 {t("view_destination")}
              </button>

              <button className="clay-btn clay-btn-outline clay-btn-full" onClick={handleSave}>
                {saved ? "❤️" : "🤍"} {saved ? `${t("save_favorite")} ✓` : t("save_favorite")}
              </button>
            </div>

            {showBooking && (
              <BookingModal
                config={{ type:"hotel", item: hotel, action:"book_hotel" }}
                user={user}
                onClose={() => setShowBooking(false)}
                onSuccess={result => { setShowBooking(false); setBookingDone(result); setTimeout(()=>setBookingDone(null),6000); }}
              />
            )}

            {nearby.length > 0 && (
              <div className="clay-card" style={{ padding: 24 }}>
                <h6 style={{ fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>🏨 {t("nearby_hotels")}</h6>
                {nearby.slice(0, 3).map((h) => (
                  <div
                    key={h.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 16,
                      paddingBottom: 16,
                      borderBottom: "2px dashed rgba(0,0,0,0.06)",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("hotel-detail", { id: h.id })}
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
                      {h.image ? (
                        <img src={h.image} alt={h.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <NepalImage item={h} entityType="hotel" style={{ width: "100%", height: "100%" }} />
                      )}
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text)", display: "block", fontWeight: 800 }}>
                        {h.name}
                      </strong>
                      <div style={{ color: "var(--clay-gold)", fontSize: "0.75rem" }}>{"★".repeat(h.stars)}</div>
                      <div style={{ color: "var(--clay-red)", fontWeight: 800, fontSize: "0.8rem" }}>
                        ${h.price_per_night}
                        {t("per_night")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .container>div{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}

/* ─── GUIDES LIST ─── */
export function GuidesPage({ navigate, user }) {
  const { t } = useLang();
  const [selDest, setSelDest] = useState("");
  const [selLang, setSelLang] = useState("");
  const [guides, setGuides] = useState(mockGuides);
  const [destinations, setDestinations] = useState(mockDests);
  const langs = ["English", "French", "Spanish", "German", "Arabic", "Chinese", "Hindi", "Japanese", "Tibetan", "Nepali"];

  useEffect(() => {
    api.guides().then(data => {
      const items = Array.isArray(data) ? data : data?.results;
      if (items?.length) setGuides(items);
    }).catch(() => {});
    api.destinations().then(data => {
      const items = Array.isArray(data) ? data : data?.results;
      if (items?.length) setDestinations(items);
    }).catch(() => {});
  }, []);

  let filtered = guides
    .filter((g) => !selDest || g.destinations?.some((d) => String(d.id) === selDest))
    .filter((g) => !selLang || g.languages?.toLowerCase().includes(selLang.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div className="inner container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a onClick={() => navigate("home")}>{t("home")}</a>
            </li>
            <li className="breadcrumb-item">{t("guides")}</li>
          </ol>
          <h1>👨‍💼 {t("local_guides")}</h1>
          <p>{t("guides_sub_page")}</p>
        </div>
      </div>

      <div className="container section">
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 32 }}>
          <div className="filter-sidebar">
            <h6>🔍 {t("filter_guides")}</h6>

            <label className="form-lbl">{t("destination")}</label>
            <select className="clay-select" value={selDest} onChange={(e) => setSelDest(e.target.value)}>
              <option value="">{t("all_destinations")}</option>
              {destinations.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.city}
                </option>
              ))}
            </select>

            <label className="form-lbl">{t("language")}</label>
            <select className="clay-select" value={selLang} onChange={(e) => setSelLang(e.target.value)}>
              <option value="">{t("any_language")}</option>
              {langs.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <button
              className="clay-btn clay-btn-outline clay-btn-sm clay-btn-full"
              onClick={() => {
                setSelDest("");
                setSelLang("");
              }}
            >
              ✕ {t("clear")}
            </button>
          </div>

          <div>
            <p style={{ color: "var(--text3)", marginBottom: 24, fontWeight: 700 }}>
              {filtered.length} {t("guides_available")}
            </p>

            {filtered.length > 0 ? (
              <div className="grid-4">
                {filtered.map((g, i) => (
                  <GuideCard key={g.id} guide={g} navigate={navigate} delay={i * 0.06} user={user} />
                ))}
              </div>
            ) : (
              <div className="clay-card text-center" style={{ padding: 60 }}>
                <div style={{ fontSize: "4rem", marginBottom: 16 }}>👤</div>
                <h5 style={{ color: "var(--text3)", fontWeight: 800 }}>{t("no_guides_found")}</h5>
                <button
                  className="clay-btn clay-btn-red mt-16"
                  onClick={() => {
                    setSelDest("");
                    setSelLang("");
                  }}
                >
                  {t("clear_filters")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){.container.section>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

/* ─── GUIDE DETAIL ─── */
export function GuideDetailPage({ navigate, pageParams, user }) {
  const { t } = useLang();
  const [guide, setGuide] = useState(mockGuides.find((g) => g.id === pageParams.id) || mockGuides[0]);
  const langs = guide.languages?.split(",").map((l) => l.trim()) || [];
  const [reviews, setReviews] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDone, setBookingDone] = useState(null);
  const [guideSaved, setGuideSaved] = useState(false);

  useEffect(() => {
    if (guide.slug) {
      api.guide(guide.slug).then(d => { if (d?.id) setGuide(d); }).catch(() => {});
    }
    fetch(`/api/guides/${guide.slug || guide.id}/reviews/`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setReviews(d); }).catch(() => setReviews([]));
    if (user) {
      api.addVisit({ content_type: "guide", guide_id: guide.id, item_name: guide.name }).catch(() => {});
      api.checkFavorite("guide", guide.id).then(r => setGuideSaved(!!r?.is_favourite)).catch(() => {});
    }
  }, [guide.id, user?.id]);

  const handleGuideSave = async () => {
    if (!user) { navigate("login"); return; }
    try {
      const res = await api.toggleFavorite({ content_type: "guide", id: guide.id, item_name: guide.name });
      setGuideSaved(res?.removed ? false : true);
      window.dispatchEvent(new CustomEvent("nw-data-changed"));
    } catch {}
  };

  const handleReviewSubmit = async (r) => {
    if (!user) { navigate("login"); return; }
    try {
      const saved_review = await api.submitReview({ content_type: "guide", guide_id: guide.id, rating: r.rating, comment: r.comment });
      setReviews(prev => [saved_review, ...prev]);
      navigate("profile", { tab: "reviews" });
      setTimeout(() => window.dispatchEvent(new CustomEvent("nw-data-changed")), 0);
    } catch {}
  };

  return (
    <div>
      {/* BookingModal rendered at top level, not inside sidebar */}
      {showBooking && (
        <BookingModal
          config={{ type:"guide", item: guide, action:"book_guide" }}
          user={user}
          onClose={() => setShowBooking(false)}
          onSuccess={result => { setShowBooking(false); setBookingDone(result); setTimeout(()=>setBookingDone(null),6000); }}
        />
      )}
      <div className="page-header">

        <div className="inner container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a onClick={() => navigate("home")}>{t("home")}</a>
            </li>
            <li className="breadcrumb-item">
              <a onClick={() => navigate("guides")}>{t("guides")}</a>
            </li>
            <li className="breadcrumb-item">{guide.name}</li>
          </ol>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 16, flexWrap: "wrap" }}>
            {guide.image ? (
              <img
                src={guide.image}
                alt={guide.name}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid var(--clay-gold)",
                  boxShadow: "6px 6px 0px rgba(0,0,0,0.2)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#4361ee,#7209b7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "4px solid var(--clay-gold)",
                  fontSize: "2.5rem",
                  boxShadow: "6px 6px 0px rgba(0,0,0,0.2)",
                }}
              >
                👤
              </div>
            )}

            <div>
              {guide.is_certified && (
                <span className="badge badge-solid-green" style={{ marginBottom: 8, display: "inline-block" }}>
                  ✓ {t("certified_guide")}
                </span>
              )}
              <h1 style={{ color: "#fff", fontFamily: "'Playfair Display',serif", marginBottom: 4, fontWeight: 900 }}>
                {guide.name}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                ⭐ {guide.rating}/5 · {guide.years_experience} {t("years_experience")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: "60px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32, alignItems: "flex-start" }}>
          <div>
            <div className="clay-card mb-24" style={{ padding: 32 }}>
              <h4 style={{ fontWeight: 800, marginBottom: 16, color: "var(--text)" }}>
                {t("about_guide")} {guide.name}
              </h4>
              <p style={{ color: "var(--text2)", lineHeight: 1.8, fontWeight: 500, marginBottom: 20 }}>{guide.bio}</p>

              {guide.specialties && (
                <>
                  <hr style={{ border: "none", borderTop: "3px dashed rgba(0,0,0,0.06)", marginBottom: 20 }} />
                  <h6 style={{ fontWeight: 800, marginBottom: 8, color: "var(--text)" }}>🎯 {t("specialties")}</h6>
                  <p style={{ color: "var(--text2)", fontWeight: 500 }}>{guide.specialties}</p>
                </>
              )}

              <hr style={{ border: "none", borderTop: "3px dashed rgba(0,0,0,0.06)", marginBottom: 20 }} />
              <h6 style={{ fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>🌍 {t("languages_spoken")}</h6>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {langs.map((l) => (
                  <span key={l} className="lang-tag" style={{ fontSize: "0.85rem", padding: "5px 14px" }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>

            {guide.destinations?.length > 0 && (
              <div className="clay-card mb-24" style={{ padding: 32 }}>
                <h5 style={{ fontWeight: 800, marginBottom: 20, color: "var(--text)" }}>
                  📍 {t("destinations_covered")}
                </h5>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {guide.destinations.map((dest) => (
                    <div
                      key={dest.id}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        padding: 14,
                        borderRadius: 16,
                        border: "var(--clay-border)",
                        cursor: "pointer",
                        boxShadow: "3px 3px 0px rgba(0,0,0,0.06)",
                        transition: "all 0.2s",
                      }}
                      onClick={() => navigate("destination-detail", { id: dest.id })}
                    >
                      <div style={{ width: 50, height: 50, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                        {dest.image ? (
                          <img src={dest.image} alt={dest.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <NepalImage item={dest} entityType="destination" style={{ width: "100%", height: "100%" }} />
                        )}
                      </div>
                      <div>
                        <strong style={{ color: "var(--text)", display: "block", fontSize: "0.9rem", fontWeight: 800 }}>
                          {dest.name}
                        </strong>
                        <small style={{ color: "var(--text3)", fontWeight: 600 }}>{dest.city}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    fontWeight: 600,
                    color: "var(--text2)",
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

          <div className="detail-sidebar-col">
            <div className="clay-card" style={{ padding: 24 }}>
              <h5 style={{ fontWeight: 800, marginBottom: 14, color: "var(--text)" }}>📋 {t("book_guide")}</h5>

              <div className="price-tag mb-16">
                ${guide.price_per_day}
                <small
                  style={{
                    color: "var(--text3)",
                    fontSize: "0.9rem",
                    fontFamily: "Nunito",
                    fontWeight: 600,
                  }}
                >
                  {t("per_day")}
                </small>
              </div>


              {bookingDone && (
                <div style={{ padding:"10px 14px",background:"rgba(6,214,160,0.12)",border:"3px solid rgba(6,214,160,0.25)",borderRadius:12,marginBottom:12,color:"var(--clay-green)",fontWeight:800,fontSize:"0.85rem" }}>
                  ⏳ Guide booking submitted! ${bookingDone.amount} paid via {bookingDone.method?.toUpperCase()}. Awaiting admin approval.
                </div>
              )}

              <button className="clay-btn clay-btn-red clay-btn-full mb-8" onClick={() => { if (!user) { navigate("login"); return; } setShowBooking(true); }}>
                <i className="fas fa-calendar-check"></i> {t("book_now")}
              </button>

              <button className="clay-btn clay-btn-outline clay-btn-full" onClick={handleGuideSave}>
                {guideSaved ? "❤️" : "🤍"} {guideSaved ? `${t("save_favorite")} ✓` : t("save_favorite")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){.container>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}