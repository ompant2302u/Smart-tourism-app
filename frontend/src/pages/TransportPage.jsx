import { useState } from "react";
import { useLang } from "../context/LangContext";
import { BookingModal } from "../components/BookingModal";


const TRANSPORT_TYPES = [
  {
    key:"flights", icon:"fa-plane", color:"#4361ee", gradient:"linear-gradient(135deg,#4361ee,#7c3aed)",
    title_key:"transport_flights", desc_key:"transport_flights_desc",
    options:[
      { name_key:"route_kathmandu_lukla",       duration_key:"duration_35_min",    price:"$180–220", note_key:"note_gateway_everest",    image:"https://images.unsplash.com/photo-1570641963303-92ce4845ed4c?w=400&q=80" },
      { name_key:"route_kathmandu_pokhara",     duration_key:"duration_25_min",    price:"$80–120",  note_key:"note_popular_route",      image:"https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80" },
      { name_key:"route_kathmandu_bharatpur",   duration_key:"duration_20_min",    price:"$60–90",   note_key:"note_chitwan_access",     image:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { name_key:"route_kathmandu_biratnagar",  duration_key:"duration_40_min",    price:"$90–130",  note_key:"note_eastern_nepal",      image:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name_key:"route_kathmandu_nepalgunj",   duration_key:"duration_55_min",    price:"$100–150", note_key:"note_western_gateway",    image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" },
      { name_key:"route_kathmandu_jumla",       duration_key:"duration_1_hr",      price:"$120–180", note_key:"note_rara_access",        image:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80" },
      { name_key:"route_kathmandu_simikot",     duration_key:"duration_1_5_hr",    price:"$150–200", note_key:"note_humla_remote",       image:"https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&q=80" },
      { name_key:"route_pokhara_jomsom",        duration_key:"duration_20_min",    price:"$70–100",  note_key:"note_mustang_gateway",    image:"https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=400&q=80" },
    ],
  },
  {
    key:"buses", icon:"fa-bus", color:"#f59e0b", gradient:"linear-gradient(135deg,#f59e0b,#ef4444)",
    title_key:"transport_buses", desc_key:"transport_buses_desc",
    options:[
      { name_key:"route_kathmandu_pokhara",     duration_key:"duration_6_7_hours", price:"$10–20",   note_key:"note_scenic_highway",     image:"https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80" },
      { name_key:"route_kathmandu_chitwan",     duration_key:"duration_4_5_hours", price:"$8–15",    note_key:"note_wildlife_gateway",   image:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { name_key:"route_pokhara_lumbini",       duration_key:"duration_5_6_hours", price:"$8–14",    note_key:"note_buddha_birthplace",  image:"https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80" },
      { name_key:"route_kathmandu_bhairahawa",  duration_key:"duration_6_7_hours", price:"$10–18",   note_key:"note_india_border",       image:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name_key:"route_kathmandu_janakpur",    duration_key:"duration_7_8_hours", price:"$10–16",   note_key:"note_maithili_culture",   image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" },
      { name_key:"route_kathmandu_ilam",        duration_key:"duration_10_12_hrs", price:"$12–20",   note_key:"note_tea_gardens",        image:"https://images.unsplash.com/photo-1582665173446-66f165bd3fdc?w=400&q=80" },
      { name_key:"route_pokhara_tansen",        duration_key:"duration_3_4_hours", price:"$6–10",    note_key:"note_newari_hilltop",     image:"https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&q=80" },
      { name_key:"route_kathmandu_gorkha",      duration_key:"duration_4_5_hours", price:"$7–12",    note_key:"note_prithvi_birthplace", image:"https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=400&q=80" },
    ],
  },
  {
    key:"jeeps", icon:"fa-truck-monster", color:"#06d6a0", gradient:"linear-gradient(135deg,#06d6a0,#059669)",
    title_key:"transport_jeeps", desc_key:"transport_jeeps_desc",
    options:[
      { name_key:"route_pokhara_jomsom_mustang",  duration_key:"duration_8_10_hours", price:"$25–40",  note_key:"note_shared_jeep",         image:"https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=400&q=80" },
      { name_key:"route_besisahar_manang",         duration_key:"duration_6_8_hours",  price:"$20–35",  note_key:"note_annapurna_circuit",   image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" },
      { name_key:"route_kathmandu_syabrubesi",     duration_key:"duration_7_8_hours",  price:"$20–30",  note_key:"note_langtang_access",     image:"https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&q=80" },
      { name_key:"route_pokhara_ghandruk",         duration_key:"duration_3_4_hours",  price:"$15–25",  note_key:"note_annapurna_foothills", image:"https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80" },
      { name_key:"route_kathmandu_bandipur",       duration_key:"duration_4_5_hours",  price:"$15–25",  note_key:"note_medieval_hilltop",    image:"https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&q=80" },
      { name_key:"route_nepalgunj_bardia",         duration_key:"duration_2_3_hours",  price:"$10–18",  note_key:"note_tiger_country",       image:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
      { name_key:"route_kathmandu_nagarkot",       duration_key:"duration_1_5_hours",  price:"$8–15",   note_key:"note_sunrise_viewpoint",   image:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name_key:"route_kathmandu_dhulikhel",      duration_key:"duration_1_hour",     price:"$6–12",   note_key:"note_valley_viewpoint",    image:"https://images.unsplash.com/photo-1582665173446-66f165bd3fdc?w=400&q=80" },
    ],
  },
  {
    key:"trek", icon:"fa-hiking", color:"#e84855", gradient:"linear-gradient(135deg,#e84855,#991b1b)",
    title_key:"transport_trek", desc_key:"transport_trek_desc",
    options:[
      { name_key:"trek_everest_base_camp",    duration_key:"duration_12_14_days",  price:"$800–1500",  note_key:"note_most_iconic",         image:"https://images.unsplash.com/photo-1570641963303-92ce4845ed4c?w=400&q=80" },
      { name_key:"trek_annapurna_circuit",    duration_key:"duration_14_21_days",  price:"$600–1200",  note_key:"note_classic_route",       image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80" },
      { name_key:"trek_langtang_valley",      duration_key:"duration_7_10_days",   price:"$400–800",   note_key:"note_near_kathmandu",      image:"https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&q=80" },
      { name_key:"trek_ghorepani_poonhill",   duration_key:"duration_4_5_days",    price:"$200–400",   note_key:"note_best_sunrise_views",  image:"https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&q=80" },
      { name_key:"trek_manaslu_circuit",      duration_key:"duration_14_18_days",  price:"$900–1600",  note_key:"note_restricted_area",     image:"https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=400&q=80" },
      { name_key:"trek_upper_mustang",        duration_key:"duration_10_14_days",  price:"$1500–2500", note_key:"note_forbidden_kingdom",   image:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name_key:"trek_rara_lake",            duration_key:"duration_8_12_days",   price:"$600–1000",  note_key:"note_remote_paradise",     image:"https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80" },
      { name_key:"trek_gosaikunda",           duration_key:"duration_4_6_days",    price:"$250–450",   note_key:"note_sacred_alpine_lake",  image:"https://images.unsplash.com/photo-1582665173446-66f165bd3fdc?w=400&q=80" },
    ],
  },
];
const POPULAR_ROUTES = [
  {
    from_key: "city_kathmandu",
    to_key: "city_pokhara",
    mode_key: "mode_flight",
    duration_key: "duration_25_min",
    price: "$80–120",
  },
  {
    from_key: "city_kathmandu",
    to_key: "city_pokhara",
    mode_key: "mode_bus",
    duration_key: "duration_6_7_hours",
    price: "$10–20",
  },
  {
    from_key: "city_kathmandu",
    to_key: "city_lukla",
    mode_key: "mode_flight",
    duration_key: "duration_35_min",
    price: "$180–220",
  },
  {
    from_key: "city_pokhara",
    to_key: "city_jomsom",
    mode_key: "mode_jeep",
    duration_key: "duration_8_10_hours",
    price: "$25–40",
  },
  {
    from_key: "city_kathmandu",
    to_key: "city_chitwan",
    mode_key: "mode_bus",
    duration_key: "duration_4_5_hours",
    price: "$8–15",
  },
  {
    from_key: "city_kathmandu",
    to_key: "city_lumbini",
    mode_key: "mode_bus",
    duration_key: "duration_6_7_hours",
    price: "$10–18",
  },
];

const TIPS = [
  { icon: "fa-cloud-sun", key: "transport_weather", sub_key: "transport_weather_sub", color: "#3b82f6" },
  { icon: "fa-mountain", key: "transport_altitude", sub_key: "transport_altitude_sub", color: "#8b5cf6" },
  { icon: "fa-calendar-check", key: "transport_book_advance", sub_key: "transport_book_advance_sub", color: "#f59e0b" },
  { icon: "fa-taxi", key: "transport_local", sub_key: "transport_local_sub", color: "#10b981" },
];

const ROUTE_CONDITIONS = {
  "Kathmandu–Pokhara": { status: "good", note_key: "route_note_clear_roads" },
  "Kathmandu–Lukla": { status: "check", note_key: "route_note_weather_dependent" },
  "Pokhara–Jomsom": { status: "good", note_key: "route_note_dry_season_open" },
  "Kathmandu–Chitwan": { status: "good", note_key: "route_note_highway_clear" },
  "Besisahar–Manang": { status: "caution", note_key: "route_note_landslide_risk" },
};

function RouteConditionChecker({ t }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const cities = [
    { value: "Kathmandu", key: "city_kathmandu" },
    { value: "Pokhara", key: "city_pokhara" },
    { value: "Lukla", key: "city_lukla" },
    { value: "Chitwan", key: "city_chitwan" },
    { value: "Jomsom", key: "city_jomsom" },
    { value: "Manang", key: "city_manang" },
    { value: "Lumbini", key: "city_lumbini" },
    { value: "Biratnagar", key: "city_biratnagar" },
  ];

  const key = from && to ? `${from}–${to}` : null;
  const condition = key
    ? ROUTE_CONDITIONS[key] || { status: "unknown", note_key: "route_note_no_live_data" }
    : null;

  const statusColor = {
    good: "#10b981",
    check: "#f59e0b",
    caution: "#ef4444",
    unknown: "#6b7280",
  };

  const statusLabelKey = {
    good: "route_status_good",
    check: "route_status_check",
    caution: "route_status_caution",
    unknown: "route_status_unknown",
  };

  return (
    <div className="clay-card" style={{ padding: 32, marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: "linear-gradient(135deg,#4361ee,#7c3aed)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px solid rgba(0,0,0,0.08)",
            boxShadow: "4px 4px 0px rgba(0,0,0,0.1)",
          }}
        >
          <i className="fas fa-route" style={{ color: "#fff", fontSize: "1.1rem" }}></i>
        </div>
        <div>
          <h5 style={{ fontWeight: 800, margin: 0, color: "var(--text)" }}>{t("transport_unique_title")}</h5>
          <p style={{ margin: 0, color: "var(--text3)", fontSize: "0.85rem", fontWeight: 600 }}>
            {t("transport_unique_sub")}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <select
          className="clay-select"
          style={{ flex: 1, minWidth: 160, marginBottom: 0 }}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        >
          <option value="">{t("transport_from_placeholder")}</option>
          {cities.map((c) => (
            <option key={c.value} value={c.value}>
              {t(c.key)}
            </option>
          ))}
        </select>

        <i className="fas fa-arrow-right" style={{ color: "var(--text3)", flexShrink: 0 }}></i>

        <select
          className="clay-select"
          style={{ flex: 1, minWidth: 160, marginBottom: 0 }}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        >
          <option value="">{t("transport_to_placeholder")}</option>
          {cities
            .filter((c) => c.value !== from)
            .map((c) => (
              <option key={c.value} value={c.value}>
                {t(c.key)}
              </option>
            ))}
        </select>
      </div>

      {condition && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 16,
            background: `${statusColor[condition.status]}18`,
            border: `3px solid ${statusColor[condition.status]}44`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: statusColor[condition.status],
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "3px solid rgba(0,0,0,0.08)",
            }}
          >
            <i className="fas fa-signal" style={{ color: "#fff" }}></i>
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
              {t(statusLabelKey[condition.status])}
            </div>
            <div style={{ color: "var(--text3)", fontSize: "0.875rem", fontWeight: 600 }}>
              {t(condition.note_key)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransportPage({ navigate, user }) {
  const { t } = useLang();
  const [activeType, setActiveType] = useState("flights");
  const [bookingTarget, setBookingTarget] = useState(null);
  const [bookingDone, setBookingDone] = useState(null);
  const active = TRANSPORT_TYPES.find((tp) => tp.key === activeType);

  const handleBook = (opt) => {
    if (!user) { navigate("login"); return; }
    setBookingTarget({ ...opt, name: t(opt.name_key), price: opt.price });
  };

  const heroImages = {
    flights: "https://images.unsplash.com/photo-1570641963303-92ce4845ed4c?w=1400&q=80",
    buses:   "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1400&q=80",
    jeeps:   "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1400&q=80",
    trek:    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=80",
  };

  return (
    <div>
      {bookingTarget && (
        <BookingModal
          config={{ type:"transport", item: bookingTarget, action:"book_transport" }}
          user={user}
          onClose={() => setBookingTarget(null)}
          onSuccess={result => { setBookingTarget(null); setBookingDone(result); setTimeout(()=>setBookingDone(null),5000); }}
        />
      )}
      {bookingDone && (
        <div style={{ position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,var(--clay-green),#059669)",color:"#fff",fontWeight:800,padding:"14px 28px",borderRadius:99,boxShadow:"0 8px 30px rgba(6,214,160,0.4)",zIndex:10000,border:"2px solid rgba(255,255,255,0.2)" }}>
          ✅ Transport booked! ${bookingDone.amount} paid via {bookingDone.method?.toUpperCase()}.
        </div>
      )}

      {/* ── CINEMATIC HERO ── */}
      <div style={{ position:"relative", height:"520px", overflow:"hidden" }}>
        <img
          key={activeType}
          src={heroImages[activeType]}
          alt={activeType}
          style={{ width:"100%", height:"100%", objectFit:"cover", animation:"tp-zoom 8s ease-out forwards" }}
        />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(10,10,30,0.35) 0%, rgba(10,10,30,0.75) 60%, rgba(10,10,30,0.97) 100%)" }} />
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"0 24px" }}>
          <ol className="breadcrumb" style={{ justifyContent:"center", marginBottom:16 }}>
            <li className="breadcrumb-item"><a onClick={() => navigate("home")} style={{ color:"rgba(255,255,255,0.6)", cursor:"pointer" }}>{t("home")}</a></li>
            <li className="breadcrumb-item" style={{ color:"rgba(255,255,255,0.9)" }}>{t("transport")}</li>
          </ol>
          <div style={{ fontSize:"4rem", marginBottom:8, animation:"tp-bounce 1s ease-out" }}>
            <i className={`fas ${active?.icon || "fa-bus"}`} style={{ background: active?.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}></i>
          </div>
          <h1 style={{ color:"#fff", fontFamily:"'Playfair Display',serif", fontSize:"clamp(2.2rem,5vw,4rem)", fontWeight:900, margin:"0 0 12px", lineHeight:1.1, textShadow:"0 4px 24px rgba(0,0,0,0.5)", animation:"tp-fadein 0.7s ease-out" }}>
            {t("transport_title")}
          </h1>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:"clamp(1rem,2vw,1.25rem)", fontWeight:600, maxWidth:600, margin:"0 0 32px", animation:"tp-fadein 0.9s ease-out" }}>
            {t("transport_sub")}
          </p>
          {/* Type selector pills in hero */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", animation:"tp-fadein 1.1s ease-out" }}>
            {TRANSPORT_TYPES.map((tp) => (
              <button key={tp.key} onClick={() => setActiveType(tp.key)}
                style={{ padding:"12px 24px", borderRadius:99, fontWeight:800, fontSize:"0.95rem", cursor:"pointer", display:"flex", alignItems:"center", gap:8, transition:"all 0.25s cubic-bezier(.34,1.56,.64,1)",
                  background: activeType===tp.key ? tp.gradient : "rgba(255,255,255,0.12)",
                  color:"#fff", border: activeType===tp.key ? "2px solid rgba(255,255,255,0.3)" : "2px solid rgba(255,255,255,0.15)",
                  boxShadow: activeType===tp.key ? `0 8px 28px rgba(0,0,0,0.35)` : "none",
                  transform: activeType===tp.key ? "translateY(-4px) scale(1.06)" : "none",
                  backdropFilter:"blur(8px)" }}>
                <i className={`fas ${tp.icon}`}></i>
                {t(tp.title_key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container section">
        <RouteConditionChecker t={t} />

        {active && (
          <div style={{ marginBottom: 56 }}>
            {/* Section header with big font */}
            <div style={{ textAlign:"center", marginBottom:40 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:14, background: active.gradient, borderRadius:99, padding:"10px 28px", marginBottom:16, boxShadow:`0 8px 28px rgba(0,0,0,0.18)` }}>
                <i className={`fas ${active.icon}`} style={{ color:"#fff", fontSize:"1.3rem" }}></i>
                <span style={{ color:"#fff", fontWeight:900, fontSize:"1.1rem", letterSpacing:0.5 }}>{t(active.title_key)}</span>
              </div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(1.8rem,4vw,3rem)", color:"var(--text)", margin:"0 0 10px", lineHeight:1.15 }}>
                {t(active.desc_key)}
              </h2>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
              {active.options.map((opt, idx) => (
                <div key={opt.name_key} className="anim-fadeup" style={{ animationDelay:`${idx*0.06}s`, borderRadius:22, overflow:"hidden", boxShadow:"0 8px 32px rgba(0,0,0,0.14)", border:"var(--clay-border)", background:"var(--card-bg)", transition:"transform 0.25s, box-shadow 0.25s", cursor:"default" }}
                  onMouseEnter={e => { e.currentTarget.style.transform="translateY(-6px)"; e.currentTarget.style.boxShadow="0 18px 48px rgba(0,0,0,0.22)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.14)"; }}>
                  {/* Image */}
                  <div style={{ position:"relative", height:160, overflow:"hidden" }}>
                    <img src={opt.image} alt={t(opt.name_key)} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.5s" }}
                      onMouseEnter={e => e.target.style.transform="scale(1.08)"}
                      onMouseLeave={e => e.target.style.transform="scale(1)"} />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
                    <span style={{ position:"absolute", bottom:12, left:12, background: active.gradient, color:"#fff", borderRadius:99, padding:"4px 12px", fontSize:"0.72rem", fontWeight:800 }}>
                      {t(opt.note_key)}
                    </span>
                    <span style={{ position:"absolute", top:12, right:12, background:"rgba(0,0,0,0.55)", color:"#fff", borderRadius:99, padding:"4px 12px", fontSize:"0.78rem", fontWeight:800, backdropFilter:"blur(4px)" }}>
                      {opt.price}
                    </span>
                  </div>
                  {/* Body */}
                  <div style={{ padding:"18px 20px 20px" }}>
                    <h5 style={{ fontWeight:900, color:"var(--text)", margin:"0 0 10px", fontSize:"1rem", fontFamily:"'Playfair Display',serif" }}>
                      {t(opt.name_key)}
                    </h5>
                    <div style={{ display:"flex", gap:16, marginBottom:16 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:5, color:"var(--text3)", fontSize:"0.82rem", fontWeight:700 }}>
                        <i className="fas fa-clock" style={{ color: active.color }}></i> {t(opt.duration_key)}
                      </span>
                      <span style={{ display:"flex", alignItems:"center", gap:5, fontWeight:900, fontSize:"0.95rem", background: active.gradient, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                        {opt.price}
                      </span>
                    </div>
                    <button className="clay-btn clay-btn-sm" style={{ background: active.gradient, color:"#fff", border:"none", width:"100%", justifyContent:"center", fontWeight:800, fontSize:"0.9rem", padding:"10px 0", borderRadius:12 }}
                      onClick={() => handleBook(opt)}>
                      <i className="fas fa-calendar-check"></i> {t("book_now")}
                    </button>
                    {user && (
                      <button className="clay-btn clay-btn-outline clay-btn-sm" style={{ width:"100%", justifyContent:"center", marginTop:8 }}
                        onClick={() => {
                          api.toggleFavorite({ content_type:"transport", item_name: t(opt.name_key) });
                          navigate("profile", { tab:"favourites" });
                        }}>
                        ❤️ Save to Favourites
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 56 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(1.5rem,3vw,2.2rem)", marginBottom:28, color:"var(--text)", textAlign:"center" }}>
            🗺️ {t("transport_popular_routes")}
          </h3>

          <div className="clay-card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#1a0533,#0d1117)" }}>
                    {[
                      t("transport_route_from"),
                      t("transport_route_to"),
                      t("transport_mode"),
                      t("transport_route_duration"),
                      t("transport_route_price"),
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "14px 20px",
                          color: "rgba(255,255,255,0.8)",
                          fontWeight: 800,
                          fontSize: "0.8rem",
                          textAlign: "left",
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {POPULAR_ROUTES.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "2px solid var(--bg2)",
                        background: i % 2 === 0 ? "var(--card-bg)" : "var(--bg2)",
                      }}
                    >
                      <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--text)" }}>{t(r.from_key)}</td>
                      <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--text)" }}>{t(r.to_key)}</td>
                      <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--text2)" }}>{t(r.mode_key)}</td>
                      <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--text2)" }}>{t(r.duration_key)}</td>
                      <td style={{ padding: "14px 20px", fontWeight: 800, color: "var(--clay-green)" }}>{r.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:"clamp(1.5rem,3vw,2.2rem)", marginBottom:28, color:"var(--text)", textAlign:"center" }}>
            💡 {t("transport_tip_title")}
          </h3>

          <div className="grid-2">
            {TIPS.map((tip) => (
              <div key={tip.key} className="clay-card" style={{ padding:28, display:"flex", gap:18, alignItems:"flex-start", transition:"transform 0.2s", borderLeft:`4px solid ${tip.color}` }}
                onMouseEnter={e => e.currentTarget.style.transform="translateX(4px)"}
                onMouseLeave={e => e.currentTarget.style.transform="none"}>
                <div style={{ width:52, height:52, background:`linear-gradient(135deg,${tip.color},${tip.color}99)`, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:"3px solid rgba(0,0,0,0.08)", boxShadow:"4px 4px 0px rgba(0,0,0,0.1)" }}>
                  <i className={`fas ${tip.icon}`} style={{ color:"#fff", fontSize:"1.2rem" }}></i>
                </div>
                <div>
                  <strong style={{ display:"block", marginBottom:6, color:"var(--text)", fontWeight:900, fontSize:"1.05rem" }}>
                    {t(tip.key)}
                  </strong>
                  <p style={{ margin:0, fontSize:"0.9rem", color:"var(--text3)", fontWeight:500, lineHeight:1.7 }}>
                    {t(tip.sub_key)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tp-zoom { from { transform:scale(1.08); } to { transform:scale(1); } }
        @keyframes tp-bounce { 0%{transform:translateY(-20px);opacity:0} 60%{transform:translateY(4px)} 100%{transform:translateY(0);opacity:1} }
        @keyframes tp-fadein { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        @media(max-width:768px){.grid-2{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  );
}