import { useState, useEffect } from "react";
import { destinations as mockDests, hotels as mockHotels, guides as mockGuides, safetyAlerts, emergencyContacts } from "../data/mockData";
import { DestinationCard, HotelCard, GuideCard } from "../components/Cards";
import { api, saveToken, clearToken } from "../api";
import { useLang } from "../context/LangContext";

/* ═══ SEARCH ═══ */
export function SearchPage({ navigate, pageParams }) {
  const { t } = useLang();
  const [query, setQuery] = useState(pageParams?.q || "");
  const [filter, setFilter] = useState("all");
  const [submitted, setSubmitted] = useState(!!pageParams?.q);
  const [apiResults, setApiResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Search backend when submitted
  useEffect(() => {
    if (!submitted || !query.trim()) return;
    setSearching(true);
    api.search(query.trim()).then(data => {
      setApiResults(data);
    }).catch(() => setApiResults(null)).finally(() => setSearching(false));
  }, [submitted, query]);

  const q = query.toLowerCase().trim();

  // Merge backend results with mock fallback
  const results = submitted && q ? {
    destinations: apiResults?.destinations?.length ? apiResults.destinations
      : mockDests.filter(d => d.name.toLowerCase().includes(q) || d.city.toLowerCase().includes(q) || d.short_description?.toLowerCase().includes(q)),
    hotels: apiResults?.hotels?.length ? apiResults.hotels
      : mockHotels.filter(h => h.name.toLowerCase().includes(q) || h.destination?.city?.toLowerCase().includes(q)),
    guides: apiResults?.guides?.length ? apiResults.guides
      : mockGuides.filter(g => g.name.toLowerCase().includes(q) || g.specialties?.toLowerCase().includes(q) || g.languages?.toLowerCase().includes(q)),
  } : null;

  const total = results ? results.destinations.length + results.hotels.length + results.guides.length : 0;
  const show = (k) => filter === "all" || filter === k;

  return (
    <div>
      <div className="search-hero">
        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <h1
            style={{
              color: "#fff",
              fontWeight: 900,
              fontSize: "2.5rem",
              marginBottom: 24,
              fontFamily: "'Playfair Display',serif",
            }}
          >
            🔍 {t("search_discover")}
          </h1>

          <div className="hero-search" style={{ maxWidth: 800 }}>
            <i
              className="fas fa-search"
              style={{
                color: "rgba(255,255,255,0.7)",
                marginLeft: 8,
                fontSize: "1.1rem",
                flexShrink: 0,
              }}
            ></i>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSubmitted(true)}
              placeholder={t("search_placeholder_full")}
              autoFocus
            />

            <button className="clay-btn clay-btn-gold" onClick={() => setSubmitted(true)}>
              <i className="fas fa-search"></i> {t("search")}
            </button>
          </div>

          {submitted && q && (
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 12, fontWeight: 600 }}>
              {t("showing_results_for")}{" "}
              <strong style={{ color: "#fff" }}>{query}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: "60px 24px" }}>
        {searching && (
          <div style={{ textAlign:"center", padding:60 }}>
            <div className="loader-spinner" style={{ margin:"0 auto 16px" }}></div>
            <p style={{ color:"var(--text3)", fontWeight:600 }}>Searching...</p>
          </div>
        )}
        {!searching && submitted && results ? (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              {[
                { k: "all", l: t("all_results"), n: total },
                { k: "destinations", l: t("destinations"), n: results.destinations.length },
                { k: "hotels", l: t("hotels"), n: results.hotels.length },
                { k: "guides", l: t("guides"), n: results.guides.length },
              ].map((f) => (
                <button
                  key={f.k}
                  className={`filter-chip${filter === f.k ? " active" : ""}`}
                  onClick={() => setFilter(f.k)}
                >
                  {f.l} ({f.n})
                </button>
              ))}
            </div>

            {total === 0 ? (
              <div className="clay-card text-center" style={{ padding: 80 }}>
                <div style={{ fontSize: "5rem", marginBottom: 20 }}>😔</div>
                <h4 style={{ fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
                  {t("no_results_found")}
                </h4>
                <p style={{ color: "var(--text3)", fontWeight: 600, marginBottom: 24 }}>
                  {t("try_different_keywords")}
                </p>

                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="clay-btn clay-btn-blue" onClick={() => navigate("destinations")}>
                    📍 {t("browse_destinations")}
                  </button>
                  <button className="clay-btn clay-btn-gold" onClick={() => navigate("hotels")}>
                    🏨 {t("browse_hotels")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {show("destinations") && results.destinations.length > 0 && (
                  <div style={{ marginBottom: 48 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 24,
                      }}
                    >
                      <h4 style={{ fontWeight: 800, color: "var(--text)", margin: 0 }}>
                        📍 {t("destinations")}
                      </h4>
                      <span
                        style={{
                          background: "linear-gradient(135deg,var(--clay-red),var(--clay-gold))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          fontWeight: 800,
                        }}
                      >
                        {results.destinations.length} {t("found")}
                      </span>
                    </div>

                    <div className="grid-3">
                      {results.destinations.map((d, i) => (
                        <DestinationCard key={d.id} dest={d} navigate={navigate} delay={i * 0.04} />
                      ))}
                    </div>
                  </div>
                )}

                {show("hotels") && results.hotels.length > 0 && (
                  <div style={{ marginBottom: 48 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 24,
                      }}
                    >
                      <h4 style={{ fontWeight: 800, color: "var(--text)", margin: 0 }}>
                        🏨 {t("hotels")}
                      </h4>
                      <span
                        style={{
                          background: "linear-gradient(135deg,var(--clay-red),var(--clay-gold))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          fontWeight: 800,
                        }}
                      >
                        {results.hotels.length} {t("found")}
                      </span>
                    </div>

                    <div className="grid-3">
                      {results.hotels.map((h, i) => (
                        <HotelCard key={h.id} hotel={h} navigate={navigate} delay={i * 0.04} />
                      ))}
                    </div>
                  </div>
                )}

                {show("guides") && results.guides.length > 0 && (
                  <div style={{ marginBottom: 48 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 24,
                      }}
                    >
                      <h4 style={{ fontWeight: 800, color: "var(--text)", margin: 0 }}>
                        👨‍💼 {t("guides")}
                      </h4>
                      <span
                        style={{
                          background: "linear-gradient(135deg,var(--clay-red),var(--clay-gold))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          fontWeight: 800,
                        }}
                      >
                        {results.guides.length} {t("found")}
                      </span>
                    </div>

                    <div className="grid-4">
                      {results.guides.map((g, i) => (
                        <GuideCard key={g.id} guide={g} navigate={navigate} delay={i * 0.05} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          !searching && <div className="clay-card text-center" style={{ padding: 80 }}>
            <div style={{ fontSize: "5rem", marginBottom: 20 }}>🔍</div>
            <h4 style={{ fontWeight: 800, marginBottom: 12, color: "var(--text)" }}>
              {t("start_your_search")}
            </h4>
            <p style={{ color: "var(--text3)", fontWeight: 600 }}>{t("search_page_sub")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ SAFETY ═══ */
const generalTips = [
  { icon: "fa-mountain", title_key: "safety_tip_altitude", content_key: "safety_tip_altitude_desc" },
  { icon: "fa-id-card", title_key: "safety_tip_documents", content_key: "safety_tip_documents_desc" },
  { icon: "fa-first-aid", title_key: "safety_tip_medical", content_key: "safety_tip_medical_desc" },
  { icon: "fa-wifi", title_key: "safety_tip_connected", content_key: "safety_tip_connected_desc" },
  { icon: "fa-tint", title_key: "safety_tip_water", content_key: "safety_tip_water_desc" },
  { icon: "fa-paw", title_key: "safety_tip_wildlife", content_key: "safety_tip_wildlife_desc" },
];

const ecClass = {
  police: "ec-police",
  tourist_police: "ec-tourist_police",
  ambulance: "ec-ambulance",
  fire: "ec-fire",
  hospital: "ec-hospital",
};

const ecIcon = {
  police: "fa-shield-alt",
  tourist_police: "fa-user-shield",
  ambulance: "fa-ambulance",
  fire: "fa-fire-extinguisher",
  hospital: "fa-hospital",
};

export function SafetyPage({ navigate }) {
  const { t } = useLang();
  const [selDest, setSelDest] = useState("");
  const [alerts, setAlerts] = useState(safetyAlerts);
  const [contacts, setContacts] = useState(emergencyContacts);
  const [destinations, setDestinations] = useState(mockDests);

  useEffect(() => {
    api.safetyAlerts().then(d => { const items = d?.results || d; if (Array.isArray(items) && items.length) setAlerts(items); }).catch(() => {});
    api.emergencyContacts().then(d => { const items = d?.results || d; if (Array.isArray(items) && items.length) setContacts(items); }).catch(() => {});
    api.destinations().then(d => { const items = d?.results || d; if (Array.isArray(items) && items.length) setDestinations(items); }).catch(() => {});
  }, []);

  const visibleAlerts = selDest
    ? alerts.filter((a) => String(a.destination?.id) === selDest)
    : alerts;

  return (
    <div>
      <div className="page-header">
        <div className="inner container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a onClick={() => navigate("home")}>{t("home")}</a>
            </li>
            <li className="breadcrumb-item">{t("safety")}</li>
          </ol>

          <h1>🛡️ {t("safety_information")}</h1>
          <p>{t("safety_page_sub")}</p>
        </div>
      </div>

      <div className="container section">
        <div className="clay-card mb-48" style={{ padding: 32 }}>
          <h5 style={{ fontWeight: 800, marginBottom: 20, color: "var(--text)" }}>
            🔍 {t("find_safety_info")}
          </h5>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <select
              className="clay-select"
              style={{ flex: 1, minWidth: 280, marginBottom: 0 }}
              value={selDest}
              onChange={(e) => setSelDest(e.target.value)}
            >
              <option value="">{t("select_destination")}</option>
              {destinations.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name} — {d.city}
                </option>
              ))}
            </select>

            {selDest && (
              <button className="clay-btn clay-btn-outline" onClick={() => setSelDest("")}>
                ✕ {t("clear")}
              </button>
            )}
          </div>
        </div>

        {visibleAlerts.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h4 style={{ fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>
              ⚠️ {t("active_travel_alerts")}
            </h4>

            <div className="grid-2">
              {visibleAlerts.map((alert) => (
                <div key={alert.id} className={`alert-strip alert-${alert.level}`}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background:
                        alert.level === "critical"
                          ? "#dc2626"
                          : alert.level === "high"
                          ? "#f59e0b"
                          : alert.level === "medium"
                          ? "#3b82f6"
                          : "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "2px solid rgba(255,255,255,0.3)",
                      boxShadow: "3px 3px 0px rgba(0,0,0,0.1)",
                    }}
                  >
                    <i
                      className={`fas fa-${
                        alert.level === "critical"
                          ? "skull"
                          : alert.level === "high"
                          ? "exclamation"
                          : alert.level === "medium"
                          ? "info"
                          : "check"
                      }`}
                      style={{ color: "#fff", fontSize: "0.85rem" }}
                    ></i>
                  </div>

                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <strong style={{ color: "var(--text)", fontWeight: 800 }}>{alert.title}</strong>
                      <span
                        className={`badge badge-${alert.level === "critical" || alert.level === "high" ? "red" : "blue"}`}
                        style={{ fontSize: "0.65rem" }}
                      >
                        {alert.level.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ margin: "0 0 4px", fontSize: "0.875rem", color: "var(--text2)", fontWeight: 500 }}>
                      {alert.description}
                    </p>

                    <small style={{ color: "var(--text3)", fontWeight: 600 }}>
                      📍 {alert.destination?.city}, {alert.destination?.country}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 48 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>
            📞 {t("emergency_contacts")}
          </h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {contacts.map((c) => (
              <div key={c.id} className={`emergency-card ${ecClass[c.service_type] || "ec-default"}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <i className={`fas ${ecIcon[c.service_type] || "fa-phone"}`} style={{ fontSize: "1.4rem" }}></i>
                  <div>
                    <div style={{ fontWeight: 800 }}>{c.name}</div>
                    <small style={{ opacity: 0.75 }}>{t(`service_${c.service_type}`)}</small>
                  </div>
                </div>

                <div style={{ fontSize: "1.9rem", fontWeight: 900, marginBottom: 4, fontFamily: "'Playfair Display',serif" }}>
                  {c.phone}
                </div>

                {c.address && <small style={{ opacity: 0.75 }}>📍 {c.address}</small>}

                {c.available_24h && (
                  <div style={{ marginTop: 10 }}>
                    <span
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        padding: "3px 12px",
                        borderRadius: 99,
                        fontSize: "0.75rem",
                        fontWeight: 800,
                      }}
                    >
                      ⏰ {t("available_24_7")}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 48 }}>
          <h4 style={{ fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>
            💡 {t("general_travel_safety_tips")}
          </h4>

          <div className="grid-3">
            {generalTips.map((tip) => (
              <div key={tip.title_key} className="clay-card" style={{ padding: 22 }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      background: "linear-gradient(135deg,var(--clay-blue),var(--clay-purple))",
                      borderRadius: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "2px solid rgba(0,0,0,0.08)",
                      boxShadow: "3px 3px 0px rgba(0,0,0,0.1)",
                    }}
                  >
                    <i className={`fas ${tip.icon}`} style={{ color: "#fff", fontSize: "0.9rem" }}></i>
                  </div>

                  <div>
                    <strong style={{ display: "block", marginBottom: 4, color: "var(--text)", fontWeight: 800 }}>
                      {t(tip.title_key)}
                    </strong>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        color: "var(--text3)",
                        fontWeight: 500,
                        lineHeight: 1.6,
                      }}
                    >
                      {t(tip.content_key)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg,#dc2626,#991b1b)",
            borderRadius: 24,
            padding: 48,
            textAlign: "center",
            border: "3px solid rgba(0,0,0,0.08)",
            boxShadow: "var(--clay-shadow-lg)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📞</div>
          <h4
            style={{
              color: "#fff",
              fontWeight: 900,
              marginBottom: 8,
              fontFamily: "'Playfair Display',serif",
            }}
          >
            {t("international_emergency")}
          </h4>

          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 28, fontWeight: 600 }}>
            {t("international_emergency_sub")}
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap" }}>
            {[
              ["112", t("region_europe_global")],
              ["911", t("region_usa_canada")],
              ["999", t("region_uk_australia")],
            ].map(([n, l]) => (
              <div key={n} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "2.2rem",
                    fontWeight: 900,
                    color: "#fff",
                    fontFamily: "'Playfair Display',serif",
                  }}
                >
                  {n}
                </div>
                <small style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{l}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ ABOUT ═══ */
export function AboutPage({ navigate }) {
  const { t } = useLang();

  return (
    <div>
      <div className="page-header" style={{ background:"linear-gradient(135deg,#0f0c29,#302b63)" }}>
        <div className="inner container">
          <h1>🏔️ About Tour Tech</h1>
          <p>Nepal's first ethical travel marketplace — built for travelers who care.</p>
        </div>
      </div>

      <div className="container section">
        {/* Mission */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center", marginBottom:64 }}>
          <div>
            <div className="section-badge">Our Mission</div>
            <h2 className="section-title" style={{ marginTop:8, marginBottom:20 }}>
              Travel That Gives Back
            </h2>
            <p style={{ color:"var(--text2)", lineHeight:1.8, marginBottom:16, fontWeight:500 }}>
              Tour Tech was built on a simple belief: the best travel experiences are the ones that benefit the communities you visit. We connect travelers with authentic Nepal experiences while ensuring that every porter is paid fairly, every guide is certified, and every booking supports local families.
            </p>
            <p style={{ color:"var(--text2)", lineHeight:1.8, fontWeight:500 }}>
              We are the only travel platform in Nepal with a built-in Porter Ethics System — scoring every agency on fair wages, load limits, equipment, and insurance. This isn't a marketing claim. It's a verifiable standard that we enforce.
            </p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[
              { g:"linear-gradient(135deg,#4361ee,#7c3aed)", icon:"fa-map-marked-alt", l:"500+ Destinations" },
              { g:"linear-gradient(135deg,#f59e0b,#ef4444)", icon:"fa-hotel", l:"200+ Verified Hotels" },
              { g:"linear-gradient(135deg,#06d6a0,#059669)", icon:"fa-user-tie", l:"100+ Certified Guides" },
              { g:"linear-gradient(135deg,#e84855,#991b1b)", icon:"fa-shield-alt", l:"Porter Ethics Certified" },
            ].map(item => (
              <div key={item.l} style={{ background:item.g, borderRadius:20, padding:24, textAlign:"center", border:"3px solid rgba(0,0,0,0.08)", boxShadow:"var(--clay-shadow)" }}>
                <i className={`fas ${item.icon}`} style={{ color:"#fff", fontSize:"2rem", marginBottom:8, display:"block" }}></i>
                <div style={{ color:"#fff", fontWeight:800 }}>{item.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* USP 1 */}
        <div className="clay-card" style={{ padding:40, marginBottom:32, background:"linear-gradient(135deg,rgba(255,209,102,0.06),rgba(255,123,84,0.06))", border:"3px solid rgba(255,209,102,0.2)" }}>
          <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ width:60, height:60, borderRadius:18, background:"linear-gradient(135deg,#ffd166,#ff7b54)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"1.8rem" }}>🤝</div>
            <div style={{ flex:1 }}>
              <h4 style={{ fontWeight:900, color:"var(--text)", marginBottom:8 }}>Micro-Experience Marketplace</h4>
              <p style={{ color:"var(--text2)", lineHeight:1.8, fontWeight:500, marginBottom:12 }}>
                "Book a day with a Sherpa family" is not a tour package — it's a story worth sharing. Our micro-experience marketplace connects travelers with authentic, non-commoditized experiences: cooking dal bhat at altitude, learning Thangka painting from a master, joining a yak herder on seasonal migration routes. These are the experiences that get written about in travel journalism, shared on Reddit's r/Nepal, and remembered for a lifetime.
              </p>
              <button className="clay-btn clay-btn-gold" onClick={() => navigate("guides")}>
                <i className="fas fa-compass"></i> Browse Micro-Experiences
              </button>
            </div>
          </div>
        </div>

        {/* USP 2 */}
        <div className="clay-card" style={{ padding:40, marginBottom:48, background:"linear-gradient(135deg,rgba(6,214,160,0.06),rgba(67,97,238,0.06))", border:"3px solid rgba(6,214,160,0.2)" }}>
          <div style={{ display:"flex", gap:20, alignItems:"flex-start", flexWrap:"wrap" }}>
            <div style={{ width:60, height:60, borderRadius:18, background:"linear-gradient(135deg,#06d6a0,#4361ee)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"1.8rem" }}>⚖️</div>
            <div style={{ flex:1 }}>
              <h4 style={{ fontWeight:900, color:"var(--text)", marginBottom:8 }}>Porter Ethics System — Industry First</h4>
              <p style={{ color:"var(--text2)", lineHeight:1.8, fontWeight:500, marginBottom:12 }}>
                The responsible-travel market cares deeply about porter welfare, yet zero booking platforms have built tooling for it — until now. Every trekking agency on Tour Tech is scored on fair wages (minimum $18/day), load limits (25kg maximum), proper equipment, and mandatory insurance. Agencies with low scores are removed. This turns a moral gap into a competitive advantage — the kind of feature that gets written about, shared, and that agency partners actively want to display as a badge.
              </p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {["Fair Wages Verified","25kg Load Limit","Medical Insurance","Porter Reviews"].map(b => (
                  <span key={b} style={{ background:"rgba(6,214,160,0.12)", color:"var(--clay-green)", border:"2px solid rgba(6,214,160,0.25)", borderRadius:99, padding:"5px 14px", fontSize:"0.8rem", fontWeight:800 }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Team values */}
        <div className="text-center mb-32">
          <div className="section-badge">Why Choose Us</div>
          <h2 className="section-title" style={{ marginTop:8 }}>Built Different</h2>
        </div>
        <div className="grid-3">
          {[
            { e:"🤝", t2:"Micro-Experience Marketplace", d:"Authentic, shareable experiences with local families — not commoditized tour packages." },
            { e:"⚖️", t2:"Porter Ethics System", d:"Industry-first scoring of every agency on porter welfare. A moral gap turned into a badge." },
            { e:"🛡️", t2:t("why_safety"), d:t("why_safety_desc") },
            { e:"🌐", t2:t("why_multilingual"), d:t("why_multilingual_desc") },
            { e:"🗺️", t2:t("why_maps"), d:t("why_maps_desc") },
            { e:"📱", t2:t("why_mobile"), d:t("why_mobile_desc") },
          ].map(f => (
            <div key={f.t2} className="clay-card" style={{ padding:28 }}>
              <div style={{ fontSize:"2.5rem", marginBottom:14 }}>{f.e}</div>
              <h5 style={{ fontWeight:800, marginBottom:8, color:"var(--text)" }}>{f.t2}</h5>
              <p style={{ color:"var(--text3)", fontSize:"0.875rem", margin:0, fontWeight:500, lineHeight:1.6 }}>{f.d}</p>
            </div>
          ))}
        </div>

        <div style={{ background:"linear-gradient(135deg,#1a0533,#1a0505)", borderRadius:28, padding:56, textAlign:"center", marginTop:60, border:"3px solid rgba(255,255,255,0.08)", boxShadow:"var(--clay-shadow-lg)" }}>
          <h3 style={{ color:"#fff", fontWeight:900, marginBottom:12, fontFamily:"'Playfair Display',serif", fontSize:"2rem" }}>
            Ready to Travel Ethically?
          </h3>
          <p style={{ color:"rgba(255,255,255,0.7)", marginBottom:28, fontWeight:600 }}>Join thousands of travelers who choose experiences that give back.</p>
          <div style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="clay-btn clay-btn-gold clay-btn-lg" onClick={() => navigate("destinations")}>
              🗺️ Explore Destinations
            </button>
            <button className="clay-btn clay-btn-outline clay-btn-lg" style={{ color:"#fff", borderColor:"rgba(255,255,255,0.3)" }} onClick={() => navigate("contact")}>
              ✉️ Contact Us
            </button>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.container.section>div:first-child{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

/* ═══ CONTACT ═══ */
export function ContactPage({ navigate }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await api.contact(form); } catch {}
    setSent(true);
    setLoading(false);
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div>
      <div className="page-header" style={{ background:"linear-gradient(135deg,#0f0c29,#302b63)" }}>
        <div className="inner container">
          <h1>📬 {t("contact_us")}</h1>
          <p>We respond within 2 hours. WhatsApp preferred for urgent trek queries.</p>
        </div>
      </div>

      <div className="container section">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 48, maxWidth: 960, margin: "0 auto" }}>
          <div>
            <h4 style={{ fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>{t("get_in_touch")}</h4>

            {[
              { icon: "fa-whatsapp fab", label: "WhatsApp (fastest)", value: "+977-9841234567", g: "linear-gradient(135deg,#25d366,#128c7e)", href:"https://wa.me/9779841234567" },
              { icon: "fa-envelope", label: t("email"), value: "hello@tourtech.np", g: "linear-gradient(135deg,#4361ee,#7209b7)", href:"mailto:hello@tourtech.np" },
              { icon: "fa-phone", label: t("phone"), value: "+977-1-4256909", g: "linear-gradient(135deg,#f59e0b,#ef4444)", href:"tel:+97714256909" },
              { icon: "fa-clock", label: t("support_hours"), value: "Daily 6am–10pm NPT", g: "linear-gradient(135deg,#06d6a0,#059669)" },
              { icon: "fa-map-marker-alt", label: t("address"), value: "Thamel, Kathmandu, Nepal", g: "linear-gradient(135deg,#e84855,#991b1b)" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <div style={{ width:52, height:52, background:item.g, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"3px solid rgba(0,0,0,0.08)", boxShadow:"4px 4px 0px rgba(0,0,0,0.1)" }}>
                  <i className={`${item.icon.includes("fab")?"fab":"fas"} ${item.icon.replace(" fab","")}`} style={{ color:"#fff" }}></i>
                </div>
                <div>
                  <strong style={{ display:"block", color:"var(--text)", fontWeight:800 }}>{item.label}</strong>
                  {item.href
                    ? <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ color:"var(--clay-red)", fontWeight:700, textDecoration:"none" }}>{item.value}</a>
                    : <span style={{ color:"var(--text3)", fontWeight:600 }}>{item.value}</span>
                  }
                </div>
              </div>
            ))}

            {/* Social links */}
            <div style={{ marginTop:24 }}>
              <div style={{ fontWeight:800, color:"var(--text)", marginBottom:12, fontSize:"0.85rem" }}>Follow Us</div>
              <div style={{ display:"flex", gap:10 }}>
                {[
                  { icon:"fa-facebook-f", color:"#1877f2", href:"#" },
                  { icon:"fa-instagram", color:"#e1306c", href:"#" },
                  { icon:"fa-reddit-alien", color:"#ff4500", href:"#" },
                  { icon:"fa-youtube", color:"#ff0000", href:"#" },
                ].map(s => (
                  <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ width:40, height:40, borderRadius:12, background:s.color, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", textDecoration:"none", fontSize:"0.9rem", boxShadow:"3px 3px 0px rgba(0,0,0,0.15)" }}>
                    <i className={`fab ${s.icon}`}></i>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="clay-card" style={{ padding: 40 }}>
            <h5 style={{ fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>{t("send_message")}</h5>

            {sent && (
              <div
                style={{
                  padding: 14,
                  background: "rgba(6,214,160,0.12)",
                  border: "3px solid rgba(6,214,160,0.25)",
                  borderRadius: 14,
                  marginBottom: 20,
                  color: "var(--clay-green)",
                  fontWeight: 800,
                }}
              >
                ✓ {t("sent_success")}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 0 }}>
                <div>
                  <label className="form-lbl">{t("your_name")}</label>
                  <input
                    className="clay-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-lbl">{t("email")}</label>
                  <input
                    className="clay-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <label className="form-lbl">{t("subject")}</label>
              <input
                className="clay-input"
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />

              <label className="form-lbl">{t("message")}</label>
              <textarea
                className="clay-input"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                style={{ resize: "vertical" }}
              />

              <button type="submit" className="clay-btn clay-btn-red clay-btn-full clay-btn-lg mt-8" disabled={loading}>
                <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-paper-plane"}`}></i> {t("send")}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:768px){.container.section>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

/* ═══ SHARED AUTH STYLES ═══ */
const cardStyle = { background:"#fff", borderRadius:"0 0 20px 20px", padding:"36px 40px", boxShadow:"0 24px 64px rgba(0,0,0,0.4)", width:"100%" };
const labelStyle = { display:"block", fontSize:"0.72rem", fontWeight:700, color:"#4a6fa5", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 };
const inputStyle = { paddingLeft:44, height:52, marginBottom:0, color:"#0f172a", background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:10, width:"100%", fontFamily:"Inter,sans-serif", fontSize:"0.93rem", outline:"none", boxSizing:"border-box" };
const iconStyle = { position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"#94a3b8", fontSize:"0.9rem", pointerEvents:"none" };

function AuthField({ label, type, icon, value, onChange, placeholder, autoFocus }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ position:"relative" }}>
        <i className={`fas ${icon}`} style={iconStyle} />
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
          autoFocus={autoFocus} required autoComplete={type === "password" ? "current-password" : "username"}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor="#2563b0"}
          onBlur={e => e.target.style.borderColor="#e2e8f0"}
        />
      </div>
    </div>
  );
}

function AuthWrap({ children, maxWidth = 420 }) {
  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div style={{ position:"relative", zIndex:2, width:"100%", maxWidth, margin:"0 auto" }}>
        <div className="nepal-strip" />
        <div style={cardStyle}>{children}</div>
      </div>
    </div>
  );
}

/* ═══ LOGIN ═══ */
export function LoginPage({ navigate, setUser }) {
  const { t } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await api.login({ username: username.trim(), password });
      if (res.access && res.refresh) {
        saveToken(res.access, res.refresh);
        const profile = await api.profile();
        setUser({
          id: profile.id, username: profile.username,
          firstName: profile.first_name || profile.username,
          lastName: profile.last_name || "", email: profile.email || "",
          is_staff: profile.is_staff, is_superuser: profile.is_superuser,
          isAdmin: profile.is_staff || profile.is_superuser,
        });
        navigate("home");
      } else {
        setError("Invalid username or password.");
        clearToken();
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Cannot connect to server. Make sure the backend is running on port 8000.");
      } else {
        const msg = typeof err === "object" && err !== null
          ? (err.detail || Object.values(err).flat().join(" "))
          : String(err || "");
        setError(msg || "Invalid username or password.");
      }
      clearToken();
    } finally { setLoading(false); }
  };

  return (
    <AuthWrap>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:"2.8rem", marginBottom:8 }}>🏔️</div>
        <h2 style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, fontSize:"1.55rem", color:"#0f172a", margin:"0 0 6px" }}>Welcome back</h2>
        <p style={{ color:"#4a6fa5", fontSize:"0.88rem", margin:0 }}>Sign in to continue your Nepal adventure</p>
      </div>

      {error && <div style={{ padding:"10px 14px", background:"#fef2f2", border:"1.5px solid #fca5a5", borderRadius:10, marginBottom:16, color:"#c1121f", fontWeight:600, fontSize:"0.85rem" }}>⚠️ {error}</div>}

      <form onSubmit={handleSubmit}>
        <AuthField label="Username" type="text" icon="fa-user" value={username}
          onChange={e => setUsername(e.target.value)} placeholder="Enter your username" autoFocus />
        <AuthField label="Password" type="password" icon="fa-lock" value={password}
          onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />

        <button type="submit" disabled={loading} style={{
          width:"100%", height:52, marginTop:8, border:"none", borderRadius:12, cursor:"pointer",
          background:"linear-gradient(135deg,#c1121f,#e63946)", color:"#fff",
          fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:"1rem",
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
          opacity: loading ? 0.7 : 1, transition:"opacity 0.2s",
        }}>
          <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-sign-in-alt"}`} />
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p style={{ textAlign:"center", marginTop:20, color:"#94a3b8", fontSize:"0.83rem" }}>
        Don't have an account?{" "}
        <span onClick={() => navigate("register")} style={{ color:"#2563b0", fontWeight:700, cursor:"pointer" }}>Sign up free</span>
      </p>
    </AuthWrap>
  );
}

/* ═══ REGISTER ═══ */
function formatError(err) {
  if (!err) return "Something went wrong. Please try again.";
  // Plain string
  if (typeof err === "string") return err;
  // DRF detail field
  if (err.detail) return String(err.detail);
  // DRF field errors: { username: ["msg"], password: ["msg"], non_field_errors: ["msg"] }
  if (typeof err === "object") {
    const parts = [];
    for (const [field, msgs] of Object.entries(err)) {
      const text = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      if (field === "non_field_errors") parts.push(text);
      else parts.push(`${field.replace(/_/g, " ")}: ${text}`);
    }
    if (parts.length) return parts.join(" | ");
  }
  return "Something went wrong. Please try again.";
}

export function RegisterPage({ navigate }) {
  const { t } = useLang();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = username.trim();
    if (!u) { setError("Username is required."); return; }
    if (u.length < 3) { setError("Username must be at least 3 characters."); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(u)) { setError("Username can only contain letters, numbers and underscores."); return; }
    if (password !== password2) { setError("Passwords do not match."); return; }
    if (password.length < 8)    { setError("Password must be at least 8 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.register({
        username: u,
        password, password2,
        first_name: "", last_name: "",
      });
      if (res.access || res.user) {
        setDone(true);
        setTimeout(() => navigate("login"), 1500);
      } else {
        setError(formatError(res));
      }
    } catch (err) {
      if (err instanceof TypeError || (typeof err === "string" && err.includes("fetch"))) {
        setError("Cannot connect to server. Make sure the backend is running on port 8000.");
      } else {
        setError(formatError(err));
      }
    } finally { setLoading(false); }
  };

  return (
    <AuthWrap maxWidth={420}>
      <div style={{ textAlign:"center", marginBottom:24 }}>
        <div style={{ fontSize:"2.8rem", marginBottom:8 }}>🏔️</div>
        <h2 style={{ fontFamily:"'Poppins',sans-serif", fontWeight:800, fontSize:"1.55rem", color:"#0f172a", margin:"0 0 6px" }}>Create account</h2>
        <p style={{ color:"#4a6fa5", fontSize:"0.88rem", margin:0 }}>Join thousands of Nepal travelers</p>
      </div>

      {done && (
        <div style={{ padding:"12px 14px", background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:10, marginBottom:16, color:"#15803d", fontWeight:700, textAlign:"center" }}>
          ✅ Account created! Redirecting to login…
        </div>
      )}

      {error && <div style={{ padding:"10px 14px", background:"#fef2f2", border:"1.5px solid #fca5a5", borderRadius:10, marginBottom:16, color:"#c1121f", fontWeight:600, fontSize:"0.85rem" }}>⚠️ {error}</div>}

      {!done && (
        <form onSubmit={handleSubmit}>
          <AuthField label="Username" type="text" icon="fa-user" value={username}
            onChange={e => setUsername(e.target.value)} placeholder="Choose a username" autoFocus />
          <AuthField label="Password" type="password" icon="fa-lock" value={password}
            onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" />
          <AuthField label="Confirm Password" type="password" icon="fa-lock" value={password2}
            onChange={e => setPassword2(e.target.value)} placeholder="Repeat your password" />

          <button type="submit" disabled={loading} style={{
            width:"100%", height:52, marginTop:8, border:"none", borderRadius:12, cursor:"pointer",
            background:"linear-gradient(135deg,#1a3a6e,#2563b0)", color:"#fff",
            fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:"1rem",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            opacity: loading ? 0.7 : 1, transition:"opacity 0.2s",
          }}>
            <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-user-plus"}`} />
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>
      )}

      <p style={{ textAlign:"center", marginTop:20, color:"#94a3b8", fontSize:"0.83rem" }}>
        Already have an account?{" "}
        <span onClick={() => navigate("login")} style={{ color:"#2563b0", fontWeight:700, cursor:"pointer" }}>Sign in</span>
      </p>
    </AuthWrap>
  );
}

/* ═══ END ═══ */


