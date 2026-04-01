import { useState, useEffect, useRef } from "react";
import { destinations, hotels, guides, testimonials } from "../data/mockData";
import { DestinationCard, HotelCard, GuideCard } from "../components/Cards";
import { useLang } from "../context/LangContext";
import { api } from "../api";

/* ── Scroll Reveal Hook ── */
function useReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal,.reveal-left,.reveal-right,.reveal-scale").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  });
}

/* ── Animated Counter ── */
function Counter({ target, suffix = "", prefix = "" }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = null;
        const step = (ts) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / 1800, 1);
          setN(Math.floor((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{n.toLocaleString()}{suffix}</span>;
}

/* ── Rotating Word ── */
function RotatingWord() {
  const { t } = useLang();
  const words = [t("hero_word_1"), t("hero_word_2"), t("hero_word_3"), t("hero_word_4"), t("hero_word_5"), t("hero_word_6")];
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setVis(false);
      setTimeout(() => { setIdx((i) => (i + 1) % words.length); setVis(true); }, 350);
    }, 2500);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{
      display: "inline-block",
      background: "linear-gradient(135deg, #fdba74, #ffb703, #4ade80)",
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      transition: "opacity 0.35s ease, transform 0.35s ease",
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(-12px)",
    }}>
      {words[idx]}
    </span>
  );
}

/* ── Floating Particles ── */
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 80 + 20,
    left: Math.random() * 100,
    delay: Math.random() * 20,
    duration: Math.random() * 15 + 15,
    color: ["rgba(60,165,239,0.15)","rgba(74,222,128,0.12)","rgba(253,186,116,0.12)","rgba(255,255,255,0.06)"][Math.floor(Math.random()*4)],
  }));
  return (
    <div className="hero-particles" style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.left}%`, bottom: "-10%",
          width: p.size, height: p.size,
          background: p.color, borderRadius: "50%",
          animation: `floatParticle ${p.duration}s ease ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes floatParticle {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── HERO SECTION ── */
function HeroSection({ navigate }) {
  const { t } = useLang();
  const [q, setQ] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate("search", { q: q.trim() });
  };

  return (
    <section className="hero">
      <div className="hero-bg">
        <img className="hero-bg-img" src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1920&q=80" alt="Nepal Mountains" />
        <div className="hero-overlay" />
        <Particles />
      </div>
      <div className="hero-mountain-silhouette" />
      <div className="hero-content">
        <div className="container">
          <div className="hero-eyebrow">
            <span>🏔️</span> {t("hero_badge")}
          </div>
          <h1 className="hero-title">
            {t("hero_title_1")}
            <span className="accent-line"><RotatingWord /></span>
          </h1>
          <p className="hero-desc">{t("hero_sub")}</p>
          <form className="hero-search" onSubmit={handleSearch}>
            <i className="fas fa-search" style={{ color:"rgba(255,255,255,0.5)", marginRight:8, flexShrink:0 }} />
            <input type="text" placeholder={t("search_placeholder_full")} value={q} onChange={(e) => setQ(e.target.value)} />
            <button type="submit" className="btn btn-accent btn-sm">{t("explore")}</button>
          </form>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate("ai-itinerary")}>
              <i className="fas fa-robot" /> {t("ai_generate_btn")}
            </button>
            <button className="btn btn-outline-white btn-lg" onClick={() => navigate("interactive-map")}>
              <i className="fas fa-map" /> {t("hero_explore_map")}
            </button>
            <button className="btn" style={{ background:"rgba(255,255,255,0.1)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff" }} onClick={() => navigate("destinations")}>
              <i className="fas fa-compass" /> {t("hero_all_destinations")}
            </button>
          </div>
          <div className="hero-stats">
            {[
              { num:500,  suffix:"+", label: t("stat_destinations") },
              { num:2400, suffix:"+", label: t("stat_travelers") },
              { num:120,  suffix:"+", label: t("stat_guides") },
              { num:98,   suffix:"%", label: t("why_reviews") },
            ].map((s) => (
              <div className="hero-stat" key={s.label}>
                <div className="hero-stat-num"><Counter target={s.num} suffix={s.suffix} /></div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FEATURES SECTION ── */
function FeaturesSection({ navigate }) {
  useReveal();
  const { t } = useLang();
  const features = [
    { icon: "fa-robot",         color: "fi-blue",   title: t("why_all_in_one"),   desc: t("why_all_in_one_desc"),   action: () => navigate("ai-itinerary") },
    { icon: "fa-map-marked-alt",color: "fi-green",  title: t("why_maps"),         desc: t("why_maps_desc"),         action: () => navigate("interactive-map") },
    { icon: "fa-shield-alt",    color: "fi-red",    title: t("why_safety"),       desc: t("why_safety_desc"),       action: () => navigate("safety") },
    { icon: "fa-star",          color: "fi-orange", title: t("why_reviews"),      desc: t("why_reviews_desc"),      action: () => navigate("destinations") },
    { icon: "fa-hotel",         color: "fi-blue",   title: t("stay_in_style"),    desc: t("hotel_sub"),             action: () => navigate("hotels") },
    { icon: "fa-user-tie",      color: "fi-green",  title: t("certified_guides"), desc: t("guides_sub"),            action: () => navigate("guides") },
  ];

  return (
    <section className="section" style={{ background: "var(--bg)" }}>
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow reveal">✨ {t("everything_you_need")}</div>
          <h2 className="section-title reveal delay-1">
            {t("complete_companion")}
          </h2>
          <p className="section-subtitle reveal delay-2">
            {t("why_multilingual_desc")}
          </p>
        </div>

        <div className="grid-3">
          {features.map((f, i) => (
            <div key={f.title} className={`feature-card reveal delay-${i % 3 + 1}`} onClick={f.action} style={{ cursor: "pointer" }}>
              <div className={`feature-icon ${f.color}`}>
                <i className={`fas ${f.icon}`} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6, color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600 }}>
                {t("view")} <i className="fas fa-arrow-right" style={{ fontSize: "0.75rem" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── DESTINATIONS SECTION ── */
function DestinationsSection({ navigate, user }) {
  useReveal();
  const { t } = useLang();
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = [t("all"), t("trekking"), t("category_cultural"), t("category_adventure"), t("category_scenic"), t("category_hidden_gems")];
  const featured = destinations.slice(0, 6);

  return (
    <section className="section" style={{ background: "var(--bg2)" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="section-eyebrow reveal" style={{ marginBottom: 12 }}>🗺️ {t("destinations")}</div>
            <h2 className="section-title reveal delay-1" style={{ marginBottom: 0 }}>
              {t("featured_destinations")}
            </h2>
          </div>
          <button className="btn btn-outline reveal delay-2" onClick={() => navigate("destinations")}>
            {t("view_all_destinations")} <i className="fas fa-arrow-right" />
          </button>
        </div>

        <div className="filter-bar reveal delay-2">
          {filters.map(f => (
            <button key={f} className={`filter-chip${activeFilter === f ? " active" : ""}`} onClick={() => setActiveFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid-3" style={{ marginTop: 24 }}>
          {featured.map((d, i) => (
            <div key={d.id} className={`reveal delay-${i % 3 + 1}`}>
              <DestinationCard dest={d} onClick={() => navigate("destination-detail", { id: d.id })} navigate={navigate} user={user} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── STATS SECTION ── */
function StatsSection() {
  useReveal();
  const { t } = useLang();
  const stats = [
    { num:8849, suffix:"m",  label: t("hero_stat_everest"), icon:"fa-mountain",  color:"var(--mountain-300)" },
    { num:10,   suffix:"+",  label: t("hero_stat_unesco"),  icon:"fa-landmark",  color:"var(--sunset-300)" },
    { num:100,  suffix:"+",  label: t("hero_stat_routes"),  icon:"fa-route",     color:"var(--forest-300)" },
    { num:365,  suffix:"",   label: t("hero_stat_days"),    icon:"fa-calendar",  color:"var(--mountain-200)" },
  ];
  return (
    <section className="stats-bg">
      <div className="container" style={{ position:"relative", zIndex:1 }}>
        <div className="grid-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`stat-card reveal delay-${i + 1}`}>
              <i className={`fas ${s.icon}`} style={{ fontSize:"2rem", color:s.color, marginBottom:14 }} />
              <div className="stat-num"><Counter target={s.num} suffix={s.suffix} /></div>
              <div className="stat-label" style={{ color:"rgba(255,255,255,0.55)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── AI ITINERARY TEASER ── */
function AITeaserSection({ navigate }) {
  useReveal();
  const { t } = useLang();
  const [step, setStep] = useState(0);
  const steps = [
    { emoji:"📍", text: t("mood_adventure") + " · " + t("mood_culture") + " · " + t("mood_wildlife") },
    { emoji:"🧠", text: t("ai_feature_1") },
    { emoji:"🗓️", text: t("ai_feature_2") },
    { emoji:"✈️", text: t("ai_feature_3") },
  ];
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % steps.length), 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="grid-2" style={{ gap:60, alignItems:"center" }}>
          <div>
            <div className="section-eyebrow reveal" style={{ marginBottom:16 }}>{t("ai_section_badge")}</div>
            <h2 className="section-title reveal delay-1">{t("ai_section_title")}</h2>
            <p className="reveal delay-2" style={{ color:"var(--text3)", lineHeight:1.75, marginBottom:28, fontSize:"1.02rem" }}>
              {t("ai_section_sub")}
            </p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }} className="reveal delay-3">
              <button className="btn btn-primary btn-lg" onClick={() => navigate("ai-itinerary")}>
                <i className="fas fa-magic" /> {t("ai_generate_btn")}
              </button>
              <span className="new-tag" style={{ alignSelf:"center" }}>NEW</span>
            </div>
            <div style={{ marginTop:32, display:"flex", flexDirection:"column", gap:10 }} className="reveal delay-4">
              {[t("ai_feature_1"), t("ai_feature_2"), t("ai_feature_3"), t("ai_feature_4")].map(f => (
                <div key={f} style={{ display:"flex", alignItems:"center", gap:10, fontSize:"0.9rem", color:"var(--text3)" }}>
                  <i className="fas fa-check-circle" style={{ color:"var(--forest-500)", fontSize:"0.9rem" }} /> {f}
                </div>
              ))}
            </div>
          </div>
          <div className="reveal-right delay-2">
            <div style={{ background:"linear-gradient(135deg,var(--mountain-800),var(--mountain-900))", borderRadius:"var(--radius-2xl)", padding:36, border:"1px solid rgba(255,255,255,0.08)", boxShadow:"var(--shadow-xl)", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, background:"radial-gradient(circle,rgba(37,99,176,0.3),transparent)", borderRadius:"50%", pointerEvents:"none" }} />
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg,var(--primary),var(--forest-600))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.1rem" }}>🤖</div>
                <div>
                  <div style={{ color:"#fff", fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:"0.95rem" }}>{t("ai_section_title")}</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--forest-300)" }}>● Online</div>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {steps.map((s, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, border:"1px solid", borderColor:step===i?"rgba(37,99,176,0.5)":"rgba(255,255,255,0.06)", background:step===i?"rgba(37,99,176,0.15)":"rgba(255,255,255,0.03)", transition:"all 0.4s ease", transform:step===i?"translateX(4px)":"none" }}>
                    <span style={{ fontSize:"1.2rem" }}>{s.emoji}</span>
                    <span style={{ fontSize:"0.86rem", color:step===i?"#fff":"rgba(255,255,255,0.5)", fontWeight:step===i?600:400, transition:"all 0.4s" }}>{s.text}</span>
                    {step===i && <i className="fas fa-check" style={{ marginLeft:"auto", color:"var(--forest-400)", fontSize:"0.8rem" }} />}
                  </div>
                ))}
              </div>
              <button className="btn btn-accent w-full" style={{ marginTop:20 }} onClick={() => navigate("ai-itinerary")}>
                <i className="fas fa-rocket" /> {t("ai_start_free")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── EXPLORE LIKE A LOCAL ── */
function ExploreLocalSection({ navigate }) {
  useReveal();
  const { t } = useLang();
  const localItems = [
    { img:"https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80", tag: t("category_cultural"), title: t("dest_pashupatinath_name"), sub:"Kathmandu, Bhaktapur, Patan" },
    { img:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",    tag: t("category_local_places"), title: t("dest_chitwan_name"), sub: t("dest_chitwan_short") },
    { img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80", tag: t("category_hidden_gems"), title: t("dest_lumbini_name"), sub: t("dest_lumbini_short") },
  ];
  return (
    <section className="section" style={{ background:"var(--bg2)" }}>
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow reveal">{t("local_section_badge")}</div>
          <h2 className="section-title reveal delay-1">{t("local_section_title")}</h2>
          <p className="section-subtitle reveal delay-2">{t("local_section_sub")}</p>
        </div>
        <div className="local-grid reveal delay-2">
          <div className="local-card local-card-main" onClick={() => navigate("destinations")}>
            <img src={localItems[0].img} alt={localItems[0].title} />
            <div className="local-card-info">
              <div className="local-card-tag">{localItems[0].tag}</div>
              <h3 className="local-card-title" style={{ fontSize:"1.35rem" }}>{localItems[0].title}</h3>
              <p className="local-card-sub">{localItems[0].sub}</p>
            </div>
          </div>
          {localItems.slice(1).map((item) => (
            <div className="local-card" key={item.title} onClick={() => navigate("destinations")} style={{ height:"100%" }}>
              <img src={item.img} alt={item.title} />
              <div className="local-card-info">
                <div className="local-card-tag">{item.tag}</div>
                <h4 className="local-card-title">{item.title}</h4>
                <p className="local-card-sub">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:32, justifyContent:"center" }} className="reveal delay-3">
          {["🏔️ Everest", "🕌 Lumbini", "🦏 Chitwan", "🏊 Pokhara", "🎭 Newari", "🍵 Tea Garden", "🦋 Bardia", "❄️ Langtang"].map(tag => (
            <button key={tag} className="filter-chip" onClick={() => navigate("destinations")}>{tag}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── HOTELS SECTION ── */
function HotelsSection({ navigate, user }) {
  useReveal();
  const { t } = useLang();
  const featured = hotels.slice(0, 3);
  return (
    <section className="section">
      <div className="container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="section-eyebrow reveal" style={{ marginBottom: 12 }}>🏨 {t("hotels")}</div>
            <h2 className="section-title reveal delay-1" style={{ marginBottom: 0 }}>
              {t("top_hotels")}
            </h2>
          </div>
          <button className="btn btn-outline reveal delay-2" onClick={() => navigate("hotels")}>
            {t("view_all_hotels")} <i className="fas fa-arrow-right" />
          </button>
        </div>
        <div className="grid-3">
          {featured.map((h, i) => (
            <div key={h.id} className={`reveal delay-${i + 1}`}>
              <HotelCard hotel={h} onClick={() => navigate("hotel-detail", { id: h.id })} navigate={navigate} user={user} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── GUIDES SECTION ── */
function GuidesSection({ navigate, user }) {
  useReveal();
  const { t } = useLang();
  const featured = guides.slice(0, 4);
  return (
    <section className="section" style={{ background: "var(--bg2)" }}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="section-eyebrow reveal" style={{ marginBottom: 12 }}>🧭 {t("guides")}</div>
            <h2 className="section-title reveal delay-1" style={{ marginBottom: 0 }}>
              {t("certified_guides")}
            </h2>
          </div>
          <button className="btn btn-outline reveal delay-2" onClick={() => navigate("guides")}>
            {t("browse_all_guides")} <i className="fas fa-arrow-right" />
          </button>
        </div>
        <div className="grid-4">
          {featured.map((g, i) => (
            <div key={g.id} className={`reveal delay-${i + 1}`}>
              <GuideCard guide={g} onClick={() => navigate("guide-detail", { id: g.id })} navigate={navigate} user={user} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── SAFETY SECTION ── */
function SafetySection({ navigate }) {
  useReveal();
  const { t } = useLang();
  const alerts = [
    { level:"medium", icon:"fa-cloud-rain",         title: t("safety_tip_altitude"),  desc: t("safety_tip_altitude_desc"),  region:"Nationwide" },
    { level:"low",    icon:"fa-thermometer-half",    title: t("safety_tip_medical"),   desc: t("safety_tip_medical_desc"),   region:"Himalayan Region" },
    { level:"high",   icon:"fa-exclamation-triangle",title: t("safety_tip_water"),     desc: t("safety_tip_water_desc"),     region:"Annapurna Circuit" },
  ];
  const colors = { low:"var(--forest-600)", medium:"var(--sunset-600)", high:"var(--nepal-red)" };
  return (
    <section className="section">
      <div className="container">
        <div className="grid-2" style={{ gap:60, alignItems:"center" }}>
          <div>
            <div className="section-eyebrow reveal" style={{ marginBottom:16 }}>{t("safety_section_badge")}</div>
            <h2 className="section-title reveal delay-1">{t("safety_section_title")}</h2>
            <p className="reveal delay-2" style={{ color:"var(--text3)", lineHeight:1.75, marginBottom:28 }}>{t("safety_section_sub")}</p>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }} className="reveal delay-3">
              <button className="btn btn-primary" onClick={() => navigate("safety")}>
                <i className="fas fa-shield-alt" /> {t("safety_dashboard_btn")}
              </button>
              <button className="btn btn-ghost" onClick={() => navigate("safety")}>
                {t("safety_emergency_btn")} <i className="fas fa-phone" />
              </button>
            </div>
          </div>
          <div className="reveal-right delay-2">
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {alerts.map(a => (
                <div key={a.title} className={`alert-banner alert-${a.level}`}>
                  <i className={`fas ${a.icon}`} style={{ color:colors[a.level] }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, marginBottom:2, fontSize:"0.9rem" }}>{a.title}</div>
                    <div style={{ fontSize:"0.82rem", opacity:0.8 }}>{a.desc}</div>
                  </div>
                  <span className="badge" style={{ flexShrink:0, background:"rgba(0,0,0,0.05)", color:colors[a.level], border:`1px solid ${colors[a.level]}30`, fontSize:"0.7rem" }}>{a.region}</span>
                </div>
              ))}
              <button className="btn btn-outline w-full" style={{ marginTop:8 }} onClick={() => navigate("safety")}>
                {t("view_all_alerts")} <i className="fas fa-arrow-right" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── MAP PREVIEW ── */
function MapPreviewSection({ navigate }) {
  useReveal();
  const { t } = useLang();
  const routes = [
    { name: t("trek_everest_base_camp"), days:14, diff: t("trek_strenuous"),      color:"#e63946" },
    { name: t("trek_annapurna_circuit"), days:21, diff: t("trek_moderate_hard"),  color:"#f97316" },
    { name: t("trek_langtang_valley"),   days:10, diff: t("trek_moderate"),       color:"#16a34a" },
    { name: t("trek_ghorepani_poonhill"),days:5,  diff: t("trek_easy_moderate"),  color:"#8b5cf6" },
    { name: t("trek_manaslu_circuit") || "Manaslu Circuit", days:17, diff: t("trek_hard"), color:"#0891b2" },
  ];
  return (
    <section className="section" style={{ background:"var(--bg2)" }}>
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow reveal">{t("map_section_badge")}</div>
          <h2 className="section-title reveal delay-1">{t("map_section_title")}</h2>
          <p className="section-subtitle reveal delay-2">{t("map_section_sub")}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }} className="reveal delay-3">
          {/* Map preview */}
          <div className="map-container" style={{ height: 420, background: "linear-gradient(135deg,var(--mountain-800),var(--mountain-900))", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, cursor: "pointer", position: "relative", overflow: "hidden" }} onClick={() => navigate("interactive-map")}>
            {/* Fake map background */}
            <div style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                {Array.from({length:12},(_,i) => <line key={`h${i}`} x1="0" y1={`${i*8}%`} x2="100%" y2={`${i*8}%`} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>)}
                {Array.from({length:16},(_,i) => <line key={`v${i}`} x1={`${i*7}%`} y1="0" x2={`${i*7}%`} y2="100%" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>)}
                <path d="M80,280 Q120,200 180,160 Q240,120 320,90 Q380,60 440,80 Q500,95 560,70 Q620,45 680,30" fill="none" stroke="#e63946" strokeWidth="3" strokeDasharray="6,4"/>
                <path d="M40,320 Q100,260 160,220 Q240,170 320,150 Q400,130 480,110 Q560,90 640,60" fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="5,4"/>
                <path d="M200,380 Q260,320 300,260 Q340,200 380,160 Q420,120 460,100" fill="none" stroke="#16a34a" strokeWidth="2"/>
                {[{cx:320,cy:90,label:"EBC",c:"#e63946"},{cx:480,cy:110,label:"ABC",c:"#f97316"},{cx:300,cy:260,label:"Langtang",c:"#16a34a"},{cx:180,cy:160,label:"Poon Hill",c:"#8b5cf6"}].map(p => (
                  <g key={p.label}>
                    <circle cx={p.cx} cy={p.cy} r="8" fill={p.c} opacity="0.9"/>
                    <circle cx={p.cx} cy={p.cy} r="14" fill={p.c} opacity="0.2"/>
                    <text x={p.cx+16} y={p.cy+4} fill="#fff" fontSize="11" fontFamily="'Poppins',sans-serif" fontWeight="600">{p.label}</text>
                  </g>
                ))}
              </svg>
            </div>

            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🗺️</div>
              <h3 style={{ color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:"1.4rem", fontWeight:700, marginBottom:8 }}>{t("map_open_btn")}</h3>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.9rem" }}>{t("map_tagline")}</p>
              <button className="btn btn-primary" style={{ marginTop:20 }}>
                <i className="fas fa-map-marked-alt" /> {t("map_launch_btn")}
              </button>
            </div>
          </div>

          {/* Route list */}
          <div className="map-sidebar" style={{ padding: 16 }}>
            <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:"0.92rem", color:"var(--text)", marginBottom:14 }}>{t("map_popular_routes")}</div>
            {routes.map(r => (
              <div key={r.name} className="route-item" onClick={() => navigate("interactive-map")}>
                <div className="route-dot" style={{ background: r.color }} />
                <div>
                  <div className="route-name">{r.name}</div>
                  <div className="route-diff">{r.days} days · {r.diff}</div>
                </div>
                <i className="fas fa-chevron-right" style={{ color: "var(--text4)", fontSize: "0.7rem", marginLeft: "auto" }} />
              </div>
            ))}
            <button className="btn btn-primary w-full btn-sm" style={{ marginTop:8 }} onClick={() => navigate("interactive-map")}>
              {t("map_view_all")}
            </button>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){ .map-preview-grid{grid-template-columns:1fr!important;} }`}</style>
    </section>
  );
}

/* ── TESTIMONIALS ── */
function TestimonialsSection() {
  useReveal();
  const { t } = useLang();
  const items = testimonials && testimonials.length > 0 ? testimonials : [
    { name: "Sarah M.", country: "🇬🇧 United Kingdom", text: "The AI itinerary was spot-on! Saved me days of research. Everest Base Camp was life-changing.", avatar: "https://i.pravatar.cc/60?img=1" },
    { name: "Takeshi Y.", country: "🇯🇵 Japan", text: "Interactive map worked perfectly even without internet. The guide we booked spoke Japanese — incredible!", avatar: "https://i.pravatar.cc/60?img=3" },
    { name: "Priya S.", country: "🇮🇳 India", text: "Safety alerts helped us avoid a landslide area. The local food recommendations were authentic and amazing.", avatar: "https://i.pravatar.cc/60?img=5" },
    { name: "Marco A.", country: "🇮🇹 Italy", text: "Hidden gems section showed us places no other tourist visited. Upper Mustang was absolutely breathtaking.", avatar: "https://i.pravatar.cc/60?img=7" },
    { name: "Emma L.", country: "🇦🇺 Australia", text: "Booked a certified guide through the app. He knew every monastery and gave us genuine cultural insight.", avatar: "https://i.pravatar.cc/60?img=9" },
    { name: "Chen W.", country: "🇨🇳 China", text: "Multi-language support in Chinese made planning so easy. The budget estimator was remarkably accurate!", avatar: "https://i.pravatar.cc/60?img=11" },
  ];
  const doubled = [...items, ...items];

  return (
    <section style={{ background: "linear-gradient(135deg,var(--mountain-900),#0d1f35)", padding: "100px 0", overflow: "hidden" }}>
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow reveal" style={{ background:"rgba(255,255,255,0.08)", color:"var(--sunset-300)", borderColor:"rgba(255,255,255,0.12)" }}>
            {t("testimonials_badge")}
          </div>
          <h2 className="section-title reveal delay-1" style={{ color:"#fff" }}>
            {t("testimonials_title2")}
          </h2>
          <p className="section-subtitle reveal delay-2" style={{ color:"rgba(255,255,255,0.55)" }}>
            {t("testimonials_sub2")}
          </p>
        </div>
      </div>

      <div className="scroll-track-wrap">
        <div className="scroll-track">
          {doubled.map((item, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-quote">"</div>
              <div className="testimonial-stars">
                {[1,2,3,4,5].map(s => <span key={s} className="star">★</span>)}
              </div>
              <p className="testimonial-text">"{item.text}"</p>
              <div className="testimonial-author">
                <img className="testimonial-avatar" src={item.avatar} alt={item.name} />
                <div>
                  <div className="testimonial-name">{item.name}</div>
                  <div className="testimonial-origin">{item.country}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA SECTION ── */
function CTASection({ navigate }) {
  useReveal();
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email) return;
    try { await api.newsletter(email); } catch {}
    setDone(true);
    setEmail("");
    setTimeout(() => setDone(false), 5000);
  };

  return (
    <section className="cta-section">
      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div className="section-eyebrow cta-eyebrow reveal" style={{ marginBottom:16 }}>
          {t("cta_badge")}
        </div>
        <h2 className="section-title cta-title reveal delay-1" style={{ fontSize:"clamp(2rem,5vw,3.5rem)" }}>
          {t("cta_title")} <br />
          <span style={{ background:"linear-gradient(135deg,var(--sunset-300),var(--gold-light))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            {t("cta_subtitle")}
          </span>
        </h2>
        <p className="section-subtitle cta-subtitle reveal delay-2">{t("cta_sub")}</p>

        {done ? (
          <div className="reveal" style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"14px 28px", background:"rgba(22,163,74,0.15)", border:"1px solid rgba(22,163,74,0.3)", borderRadius:"var(--radius-full)", color:"var(--forest-300)", fontWeight:600, marginBottom:40 }}>
            {t("cta_subscribed")}
          </div>
        ) : (
          <form onSubmit={handleNewsletter} className="reveal delay-3" style={{ display:"flex", gap:10, maxWidth:480, margin:"0 auto 40px", background:"rgba(255,255,255,0.08)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"var(--radius-full)", padding:"6px 6px 6px 20px" }}>
            <input type="email" required placeholder={t("cta_email_placeholder")} value={email} onChange={e => setEmail(e.target.value)}
              style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"'Inter',sans-serif", fontSize:"0.93rem" }} />
            <button type="submit" className="btn btn-accent">{t("subscribe")} <i className="fas fa-arrow-right" /></button>
          </form>
        )}

        <div className="reveal delay-4" style={{ display:"flex", gap:20, justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn btn-primary btn-xl" onClick={() => navigate("ai-itinerary")}>
            <i className="fas fa-robot" /> {t("cta_plan_ai")}
          </button>
          <button className="btn btn-outline-white btn-xl" onClick={() => navigate("register")}>
            <i className="fas fa-user-plus" /> {t("cta_join_free")}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── MAIN HOME PAGE ── */
export default function HomePage({ navigate, user }) {
  return (
    <div>
      <HeroSection navigate={navigate} />
      <FeaturesSection navigate={navigate} />
      <DestinationsSection navigate={navigate} user={user} />
      <AITeaserSection navigate={navigate} />
      <StatsSection />
      <ExploreLocalSection navigate={navigate} />
      <HotelsSection navigate={navigate} user={user} />
      <GuidesSection navigate={navigate} user={user} />
      <SafetySection navigate={navigate} />
      <MapPreviewSection navigate={navigate} />
      <TestimonialsSection />
      <CTASection navigate={navigate} />
    </div>
  );
}
