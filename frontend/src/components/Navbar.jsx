import { useState, useEffect, useRef } from "react";
import { useLang, LANGUAGES } from "../context/LangContext";
import { destinations, hotels, guides } from "../data/mockData";
import { clearToken, api } from "../api";

const NAV_KEYS = [
  { key: "destinations",    icon: "fa-map-marked-alt", tKey: "destinations" },
  { key: "hotels",          icon: "fa-hotel",           tKey: "hotels" },
  { key: "guides",          icon: "fa-user-tie",        tKey: "guides" },
  { key: "transport",       icon: "fa-bus",             tKey: "transport" },
  { key: "safety",          icon: "fa-shield-alt",      tKey: "safety" },
  { key: "ai-itinerary",   icon: "fa-robot",           tKey: "nav_ai_plan" },
  { key: "interactive-map", icon: "fa-map",             tKey: "nav_map" },
  { key: "estimator",       icon: "fa-calculator",      tKey: "nav_budget" },
];

const SEARCH_INDEX = [
  ...destinations.map(d => ({ label: d.name, sub: `${d.city || d.country}`, type: "destination-detail", id: d.id, emoji: "📍" })),
  ...hotels.map(h =>       ({ label: h.name, sub: h.destination?.city || "Hotel", type: "hotel-detail", id: h.id, emoji: "🏨" })),
  ...guides.map(g =>       ({ label: g.name, sub: g.specialties?.split(",")[0] || "Guide", type: "guide-detail", id: g.id, emoji: "👤" })),
];

// Pages that have a full-screen dark hero behind the navbar
const DARK_HERO_PAGES = new Set(["home", "ai-itinerary", "interactive-map"]);

export default function Navbar({ navigate, page, user, setUser, theme, setTheme }) {
  const { t, lang, setLang } = useLang();
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [userDrop,   setUserDrop]   = useState(false);
  const [langDrop,   setLangDrop]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ,    setSearchQ]    = useState("");
  const [suggests,   setSuggests]   = useState([]);
  const [activeIdx,  setActiveIdx]  = useState(-1);
  const [mobileQ,    setMobileQ]    = useState("");
  const [notifOpen,  setNotifOpen]  = useState(false);
  const [notifs,     setNotifs]     = useState([]);

  const searchWrap = useRef(null);
  const langWrap   = useRef(null);
  const userWrap   = useRef(null);
  const notifWrap  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (!searchWrap.current?.contains(e.target)) closeSearch();
      if (!langWrap.current?.contains(e.target))   setLangDrop(false);
      if (!userWrap.current?.contains(e.target))   setUserDrop(false);
      if (!notifWrap.current?.contains(e.target))  setNotifOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = () => api.notifications().then(d => setNotifs(Array.isArray(d) ? d : [])).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markOneRead = async (id) => {
    await api.markNotificationRead(id).catch(() => {});
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const closeSearch = () => { setSearchOpen(false); setSuggests([]); setSearchQ(""); setActiveIdx(-1); };

  const openSearch = () => {
    setSearchOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleInput = (val) => {
    setSearchQ(val);
    setActiveIdx(-1);
    if (!val.trim()) { setSuggests([]); return; }
    const q = val.toLowerCase();
    setSuggests(SEARCH_INDEX.filter(item =>
      item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q)
    ).slice(0, 6));
  };

  const commit = (item) => {
    if (item) navigate(item.type, { id: item.id });
    else if (searchQ.trim()) navigate("search", { q: searchQ.trim() });
    closeSearch();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggests.length)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === "Enter")     { activeIdx >= 0 && activeIdx < suggests.length ? commit(suggests[activeIdx]) : commit(null); }
    if (e.key === "Escape")    { closeSearch(); }
  };

  const isSolid = scrolled || !DARK_HERO_PAGES.has(page);
  const goTo = (pg) => { navigate(pg); setMenuOpen(false); };
  const curLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const initials = user ? (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase() : "U";

  return (
    <nav className={`clay-nav${(scrolled || !DARK_HERO_PAGES.has(page)) ? " scrolled" : ""}${searchOpen ? " nav-search-active" : ""}`}>
      <div className="nav-inner">

        {/* Brand */}
        <div className="nav-brand" onClick={() => goTo("home")}>
          <div className="nav-brand-icon">🏔️</div>
          <span>NepalWander</span>
        </div>

        {/* Desktop Links */}
        <ul className="nav-links">
          {NAV_KEYS.map(item => (
            <li key={item.key}>
              <button
                className={`nav-link-btn${page === item.key ? " active" : ""}`}
                onClick={() => goTo(item.key)}
              >
                <i className={`fas ${item.icon}`} style={{ fontSize: "0.75rem" }} />
                {t(item.tKey)}
                {item.isNew && (
                  <span style={{ padding: "1px 5px", background: "linear-gradient(135deg,var(--sunset-500),var(--sunset-700))", color: "#fff", borderRadius: 99, fontSize: "0.58rem", fontWeight: 700, lineHeight: 1.4 }}>{t("new_badge")}</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="nav-actions">

          {/* Search */}
          <div ref={searchWrap} style={{ position: "relative" }}>
            <div className={`nav-search-wrap${searchOpen ? " open" : ""}`}>
              <button className="nav-search-icon-btn" onClick={searchOpen ? () => commit(null) : openSearch}>
                <i className="fas fa-search" />
              </button>
              <input
                ref={inputRef} type="text" className="nav-search-input"
                placeholder={t("search_placeholder")} value={searchQ}
                onChange={e => handleInput(e.target.value)} onKeyDown={onKeyDown}
              />
              {searchQ && (
                <button className="nav-search-clear" onClick={() => { setSearchQ(""); setSuggests([]); inputRef.current?.focus(); }}>×</button>
              )}
            </div>
            {searchOpen && (suggests.length > 0 || searchQ.trim().length >= 1) && (
              <div className="search-dropdown">
                {suggests.map((item, i) => (
                  <div key={`${item.type}-${item.id}`} className={`search-item${activeIdx === i ? " active" : ""}`}
                    onMouseDown={() => commit(item)} onMouseEnter={() => setActiveIdx(i)}>
                    <span className="search-item-emoji">{item.emoji}</span>
                    <div className="search-item-text">
                      <span className="search-item-label">{item.label}</span>
                      <span className="search-item-sub">{item.sub}</span>
                    </div>
                    <span className="search-item-tag">{item.type.replace("-detail", "")}</span>
                  </div>
                ))}
                {searchQ.trim().length >= 1 && (
                  <div className={`search-item search-all${activeIdx === suggests.length ? " active" : ""}`}
                    onMouseDown={() => commit(null)} onMouseEnter={() => setActiveIdx(suggests.length)}>
                    <span className="search-item-emoji">🔍</span>
                    <div className="search-item-text">
                      <span className="search-item-label">Search all for "<strong>{searchQ}</strong>"</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          {user && (
            <div ref={notifWrap} style={{ position: "relative" }}>
              <button className="nav-icon-btn" onClick={() => setNotifOpen(o => !o)} title="Notifications"
                style={{ position: "relative" }}>
                <i className="fas fa-bell" />
                {unreadCount > 0 && (
                  <span style={{ position:"absolute", top:-4, right:-4, minWidth:16, height:16, borderRadius:99, background:"var(--clay-red)", color:"#fff", fontSize:"0.6rem", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px", lineHeight:1 }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position:"absolute", top:"calc(100% + 10px)", right:0, width:340, background:"var(--card-bg)", border:"var(--clay-border)", borderRadius:20, boxShadow:"var(--clay-shadow-lg)", zIndex:9999, overflow:"hidden" }}>
                  <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid var(--card-border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontWeight:800, fontSize:"0.9rem", color:"var(--text)" }}>
                      🔔 Notifications {unreadCount > 0 && <span style={{ background:"var(--clay-red)", color:"#fff", borderRadius:99, fontSize:"0.65rem", padding:"1px 7px", marginLeft:4 }}>{unreadCount}</span>}
                    </span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--clay-blue)", background:"none", border:"none", cursor:"pointer" }}>Mark all read</button>
                    )}
                  </div>
                  <div style={{ maxHeight:360, overflowY:"auto" }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding:"28px 16px", textAlign:"center", color:"var(--text3)", fontWeight:600, fontSize:"0.85rem" }}>No notifications yet.</div>
                    ) : notifs.slice(0, 15).map(n => (
                      <div key={n.id} onClick={() => markOneRead(n.id)}
                        style={{ padding:"12px 16px", borderBottom:"1px solid var(--card-border)", background: n.is_read ? "transparent" : "rgba(67,97,238,0.05)", cursor:"pointer", transition:"background 0.2s" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight: n.is_read ? 600 : 800, fontSize:"0.83rem", color:"var(--text)", marginBottom:2 }}>
                              {n.type === "booking_pending" ? "⏳" : n.type === "booking_confirmed" ? "✅" : n.type === "booking_cancelled" ? "❌" : n.type === "new_booking" ? "🛎️" : n.type === "refund_requested" ? "💰" : "📢"} {n.title}
                            </div>
                            <div style={{ fontSize:"0.76rem", color:"var(--text3)", fontWeight:500, lineHeight:1.4 }}>{n.message}</div>
                          </div>
                          {!n.is_read && <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--clay-blue)", flexShrink:0, marginTop:4 }}></div>}
                        </div>
                        <div style={{ fontSize:"0.68rem", color:"var(--text4)", fontWeight:600, marginTop:4 }}>{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme */}
          <button className="nav-icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
            <i className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
          </button>

          {/* Language */}
          <div ref={langWrap} style={{ position: "relative" }}>
            <button className="lang-btn" onClick={() => setLangDrop(!langDrop)}>
              <span style={{ fontSize: "1rem" }}>{curLang.flag}</span>
              <span className="lang-code-label">{curLang.label}</span>
              <i className={`fas fa-chevron-${langDrop ? "up" : "down"}`} style={{ fontSize: "0.52rem", opacity: 0.7 }} />
            </button>
            {langDrop && (
              <div className="lang-dropdown">
                <div className="lang-drop-header">🌍 {t("why_multilingual")}</div>
                {LANGUAGES.map(l => (
                  <button key={l.code} className={`lang-option${lang === l.code ? " active" : ""}`}
                    onClick={() => { setLang(l.code); setLangDrop(false); }}>
                    <span style={{ fontSize: "1.3rem" }}>{l.flag}</span>
                    <span style={{ flex: 1, textAlign: "left", fontWeight: 600 }}>{l.label}</span>
                    {lang === l.code && <i className="fas fa-check" style={{ color: "var(--forest-500)", fontSize: "0.78rem" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User */}
          {user ? (
            <div ref={userWrap} style={{ position: "relative" }}>
              <button className="user-btn" onClick={() => setUserDrop(!userDrop)}>
                <div className="user-avatar">{initials}</div>
                {user.firstName || user.username}
                <i className={`fas fa-chevron-${userDrop ? "up" : "down"}`} style={{ fontSize: "0.58rem" }} />
              </button>
              {userDrop && (
                <div className="user-menu">
                  <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid var(--card-border)" }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.87rem", color: "var(--text)" }}>{user.firstName || user.username}</div>
                    <div style={{ fontSize: "0.74rem", color: "var(--text4)" }}>{user.email}</div>
                  </div>
                  <button className="user-menu-item" onClick={() => { goTo("profile"); setUserDrop(false); }}>
                    <i className="fas fa-user" /> {t("profile_trips")}
                  </button>
                  {(user.isAdmin || user.is_staff || user.is_superuser) && (
                    <>
                      <button className="user-menu-item" style={{ color: "var(--nepal-red)" }}
                        onClick={() => { window.open((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/admin/", "_blank"); setUserDrop(false); }}>
                        <i className="fas fa-tools" style={{ color: "var(--nepal-red)" }} /> {t("admin_panel")}
                      </button>
                      <button className="user-menu-item" onClick={() => { goTo("activity"); setUserDrop(false); }}>
                        <i className="fas fa-history" /> {t("activity_tracker")}
                      </button>
                    </>
                  )}
                  <div style={{ height: 1, background: "var(--card-border)", margin: "4px 0" }} />
                  <button className="user-menu-item danger" onClick={() => { setUser(null); clearToken(); setUserDrop(false); goTo("home"); }}>
                    <i className="fas fa-sign-out-alt" /> {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm nav-desktop-only" style={{ color: isSolid ? "var(--text)" : "rgba(255,255,255,0.9)", border: "1px solid", borderColor: isSolid ? "var(--card-border)" : "rgba(255,255,255,0.3)" }} onClick={() => goTo("login")}>
                {t("sign_in")}
              </button>
              <button className="btn btn-accent btn-sm nav-desktop-only" onClick={() => goTo("register")}>
                {t("join_free")}
              </button>
            </>
          )}

          {/* Hamburger */}
          <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
          {NAV_KEYS.map(item => (
            <button key={item.key} className={`mobile-nav-link${page === item.key ? " active" : ""}`} onClick={() => goTo(item.key)}>
              <i className={`fas ${item.icon}`} />
              {t(item.tKey)}
              {item.isNew && <span className="new-tag" style={{ fontSize: "0.58rem", padding: "1px 5px" }}>{t("new_badge")}</span>}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input type="text" className="input" placeholder={t("search_nepal")} value={mobileQ}
            onChange={e => setMobileQ(e.target.value)} style={{ flex: 1 }}
            onKeyDown={e => e.key === "Enter" && mobileQ && (navigate("search", { q: mobileQ }), setMenuOpen(false), setMobileQ(""))} />
          <button className="btn btn-primary btn-sm" onClick={() => { if (mobileQ) { navigate("search", { q: mobileQ }); setMenuOpen(false); setMobileQ(""); } }}>
            <i className="fas fa-search" />
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} style={{
              padding: "5px 10px", borderRadius: "var(--radius-full)", border: "1.5px solid",
              borderColor: lang === l.code ? "var(--primary)" : "var(--card-border)",
              background: lang === l.code ? "var(--primary)" : "transparent",
              color: lang === l.code ? "#fff" : "var(--text3)",
              fontWeight: 600, fontSize: "0.76rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}>
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="divider" />

        {user ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm w-full" onClick={() => goTo("profile")}><i className="fas fa-user" /> {t("profile")}</button>
            <button className="btn btn-sm w-full" style={{ background: "rgba(193,18,31,0.08)", color: "var(--nepal-red)" }} onClick={() => { setUser(null); clearToken(); goTo("home"); }}><i className="fas fa-sign-out-alt" /> {t("logout")}</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm w-full" onClick={() => goTo("login")}>{t("sign_in")}</button>
            <button className="btn btn-accent btn-sm w-full" onClick={() => goTo("register")}>{t("join_free")}</button>
          </div>
        )}
      </div>
    </nav>
  );
}
