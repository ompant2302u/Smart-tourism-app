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
  const openSearch  = () => { setSearchOpen(true); requestAnimationFrame(() => inputRef.current?.focus()); };

  useEffect(() => {
    const close = (e) => {
      // Only close if click is truly outside the ref element
      if (searchWrap.current && !searchWrap.current.contains(e.target)) closeSearch();
      if (langWrap.current   && !langWrap.current.contains(e.target))   setLangDrop(false);
      if (userWrap.current   && !userWrap.current.contains(e.target))   setUserDrop(false);
      if (notifWrap.current  && !notifWrap.current.contains(e.target))  setNotifOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = (val) => {
    setSearchQ(val); setActiveIdx(-1);
    if (!val.trim()) { setSuggests([]); return; }
    const q = val.toLowerCase();
    setSuggests(SEARCH_INDEX.filter(i => i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q)).slice(0, 6));
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

  const isSolid  = scrolled || !DARK_HERO_PAGES.has(page);
  const goTo     = (pg) => { navigate(pg); setMenuOpen(false); setUserDrop(false); setLangDrop(false); };
  const curLang  = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  const initials = user ? (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase() : "U";

  return (
    <nav className={`clay-nav${isSolid ? " scrolled" : ""}${searchOpen ? " nav-search-active" : ""}`}>
      <div className="nav-inner">

        {/* Brand */}
        <div className="nav-brand" onClick={() => goTo("home")}>
          <div className="nav-brand-icon">🏔️</div>
          <span className="nav-brand-text">Tour Tech</span>
        </div>

        {/* Desktop Links */}
        <ul className="nav-links">
          {NAV_KEYS.map(item => (
            <li key={item.key}>
              <button className={`nav-link-btn${page === item.key ? " active" : ""}`} onClick={() => goTo(item.key)}>
                <i className={`fas ${item.icon}`} style={{ fontSize: "0.75rem" }} />
                {t(item.tKey)}
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop Actions — hidden on mobile */}
        <div className="nav-actions nav-actions-desktop">

          {/* Search */}
          <div ref={searchWrap} style={{ position: "relative" }}>
            <div className={`nav-search-wrap${searchOpen ? " open" : ""}`}>
              <button className="nav-search-icon-btn" onClick={searchOpen ? () => commit(null) : openSearch}>
                <i className="fas fa-search" />
              </button>
              <input ref={inputRef} type="text" className="nav-search-input"
                placeholder={t("search_placeholder")} value={searchQ}
                onChange={e => handleInput(e.target.value)} onKeyDown={onKeyDown} />
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
              <button className="nav-icon-btn" onClick={() => setNotifOpen(o => !o)} style={{ position: "relative" }}>
                <i className="fas fa-bell" />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
              {notifOpen && <NotifDropdown notifs={notifs} unreadCount={unreadCount} markAllRead={markAllRead} markOneRead={markOneRead} />}
            </div>
          )}

          {/* Theme */}
          <button className="nav-icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
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
                <span className="user-name-label">{user.firstName || user.username}</span>
                <i className={`fas fa-chevron-${userDrop ? "up" : "down"}`} style={{ fontSize: "0.58rem" }} />
              </button>
              {userDrop && <UserMenu user={user} setUser={setUser} goTo={goTo} setUserDrop={setUserDrop} t={t} />}
            </div>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm"
                style={{ color: isSolid ? "var(--text)" : "rgba(255,255,255,0.9)", border: "1px solid", borderColor: isSolid ? "var(--card-border)" : "rgba(255,255,255,0.3)" }}
                onClick={() => goTo("login")}>{t("sign_in")}</button>
              <button className="btn btn-accent btn-sm" onClick={() => goTo("register")}>{t("join_free")}</button>
            </>
          )}
        </div>

        {/* Mobile Right — only essential icons + hamburger */}
        <div className="nav-actions-mobile">
          {/* Search icon */}
          <button className="nav-icon-btn" onClick={() => { setMenuOpen(false); openSearch(); }}>
            <i className="fas fa-search" />
          </button>

          {/* Notification badge (mobile) */}
          {user && unreadCount > 0 && (
            <button className="nav-icon-btn" style={{ position: "relative" }} onClick={() => { setMenuOpen(true); }}>
              <i className="fas fa-bell" />
              <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            </button>
          )}

          {/* User avatar (mobile) — taps open menu */}
          {user ? (
            <button className="nav-avatar-btn" onClick={() => setMenuOpen(o => !o)}>
              <div className="user-avatar">{initials}</div>
            </button>
          ) : (
            <button className="btn btn-accent btn-sm" style={{ fontSize: "0.75rem", padding: "6px 12px" }} onClick={() => goTo("login")}>
              {t("sign_in")}
            </button>
          )}

          {/* Hamburger */}
          <button className="hamburger-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px,5px)" : "none" }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Mobile Search Bar — full width, shown when searchOpen on mobile */}
      {searchOpen && (
        <div className="mobile-search-bar" ref={searchWrap}>
          <div className="mobile-search-inner">
            <i className="fas fa-search" style={{ color: "var(--text4)", flexShrink: 0 }} />
            <input ref={inputRef} type="text" className="mobile-search-input"
              placeholder="Search destinations, hotels, guides…"
              value={searchQ} onChange={e => handleInput(e.target.value)} onKeyDown={onKeyDown}
              autoFocus />
            <button onClick={closeSearch} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: "1.1rem", cursor: "pointer", padding: "0 4px" }}>✕</button>
          </div>
          {(suggests.length > 0 || searchQ.trim().length >= 1) && (
            <div className="mobile-search-results">
              {suggests.map((item, i) => (
                <div key={`${item.type}-${item.id}`} className={`search-item${activeIdx === i ? " active" : ""}`}
                  onMouseDown={() => commit(item)} onTouchEnd={() => commit(item)}>
                  <span className="search-item-emoji">{item.emoji}</span>
                  <div className="search-item-text">
                    <span className="search-item-label">{item.label}</span>
                    <span className="search-item-sub">{item.sub}</span>
                  </div>
                </div>
              ))}
              {searchQ.trim().length >= 1 && (
                <div className="search-item search-all" onMouseDown={() => commit(null)} onTouchEnd={() => commit(null)}>
                  <span className="search-item-emoji">🔍</span>
                  <div className="search-item-text">
                    <span className="search-item-label">Search all for "<strong>{searchQ}</strong>"</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Menu Drawer */}
      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>

        {/* Nav links grid */}
        <div className="mobile-nav-grid">
          {NAV_KEYS.map(item => (
            <button key={item.key} className={`mobile-nav-link${page === item.key ? " active" : ""}`} onClick={() => goTo(item.key)}>
              <i className={`fas ${item.icon}`} />
              <span>{t(item.tKey)}</span>
            </button>
          ))}
        </div>

        <div className="mobile-menu-divider" />

        {/* Language row */}
        <div className="mobile-lang-row">
          {LANGUAGES.map(l => (
            <button key={l.code} className={`mobile-lang-btn${lang === l.code ? " active" : ""}`}
              onClick={() => { setLang(l.code); }}>
              {l.flag} <span>{l.code.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <div className="mobile-menu-divider" />

        {/* Theme toggle */}
        <button className="mobile-action-row" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          <i className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Notifications (if user) */}
        {user && notifs.length > 0 && (
          <button className="mobile-action-row" onClick={() => { goTo("profile"); }}>
            <i className="fas fa-bell" />
            <span>Notifications {unreadCount > 0 && <span className="notif-badge" style={{ position:"static", marginLeft:6 }}>{unreadCount}</span>}</span>
          </button>
        )}

        <div className="mobile-menu-divider" />

        {/* Auth */}
        {user ? (
          <div className="mobile-user-section">
            <div className="mobile-user-info">
              <div className="user-avatar" style={{ width:36, height:36, fontSize:"0.9rem" }}>{initials}</div>
              <div>
                <div style={{ fontWeight:700, fontSize:"0.9rem", color:"var(--text)" }}>{user.firstName || user.username}</div>
                {user.email && <div style={{ fontSize:"0.72rem", color:"var(--text4)" }}>{user.email}</div>}
              </div>
            </div>
            <div className="mobile-user-actions">
              <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => goTo("profile")}>
                <i className="fas fa-user" /> {t("profile")}
              </button>
              {(user.isAdmin || user.is_staff || user.is_superuser) && (
                <button className="btn btn-sm" style={{ flex:1, background:"rgba(193,18,31,0.08)", color:"var(--nepal-red)" }}
                  onClick={() => { window.open((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/admin/", "_blank"); setMenuOpen(false); }}>
                  <i className="fas fa-tools" /> Admin
                </button>
              )}
              <button className="btn btn-sm" style={{ flex:1, background:"rgba(193,18,31,0.08)", color:"var(--nepal-red)" }}
                onClick={() => { setUser(null); clearToken(); goTo("home"); }}>
                <i className="fas fa-sign-out-alt" /> {t("logout")}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => goTo("login")}>{t("sign_in")}</button>
            <button className="btn btn-accent btn-sm" style={{ flex:1 }} onClick={() => goTo("register")}>{t("join_free")}</button>
          </div>
        )}
      </div>
    </nav>
  );
}

function NotifDropdown({ notifs, unreadCount, markAllRead, markOneRead }) {
  return (
    <div style={{ position:"absolute", top:"calc(100% + 10px)", right:0, width:340, background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:20, boxShadow:"var(--shadow-xl)", zIndex:9999, overflow:"hidden" }}>
      <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid var(--card-border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontWeight:800, fontSize:"0.9rem", color:"var(--text)" }}>
          🔔 Notifications {unreadCount > 0 && <span style={{ background:"var(--clay-red)", color:"#fff", borderRadius:99, fontSize:"0.65rem", padding:"1px 7px", marginLeft:4 }}>{unreadCount}</span>}
        </span>
        {unreadCount > 0 && <button onClick={markAllRead} style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--clay-blue)", background:"none", border:"none", cursor:"pointer" }}>Mark all read</button>}
      </div>
      <div style={{ maxHeight:360, overflowY:"auto" }}>
        {notifs.length === 0 ? (
          <div style={{ padding:"28px 16px", textAlign:"center", color:"var(--text3)", fontWeight:600, fontSize:"0.85rem" }}>No notifications yet.</div>
        ) : notifs.slice(0, 15).map(n => (
          <div key={n.id} onClick={() => markOneRead(n.id)}
            style={{ padding:"12px 16px", borderBottom:"1px solid var(--card-border)", background: n.is_read ? "transparent" : "rgba(67,97,238,0.05)", cursor:"pointer" }}>
            <div style={{ fontWeight: n.is_read ? 600 : 800, fontSize:"0.83rem", color:"var(--text)", marginBottom:2 }}>
              {n.type === "booking_pending" ? "⏳" : n.type === "booking_confirmed" ? "✅" : n.type === "booking_cancelled" ? "❌" : "📢"} {n.title}
            </div>
            <div style={{ fontSize:"0.76rem", color:"var(--text3)", fontWeight:500 }}>{n.message}</div>
            <div style={{ fontSize:"0.68rem", color:"var(--text4)", fontWeight:600, marginTop:4 }}>{new Date(n.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserMenu({ user, setUser, goTo, setUserDrop, t }) {
  return (
    <div className="user-menu">
      <div style={{ padding:"12px 16px 8px", borderBottom:"1px solid var(--card-border)" }}>
        <div style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:"0.87rem", color:"var(--text)" }}>{user.firstName || user.username}</div>
        <div style={{ fontSize:"0.74rem", color:"var(--text4)" }}>{user.email}</div>
      </div>
      <button className="user-menu-item" onClick={() => { goTo("profile"); setUserDrop(false); }}>
        <i className="fas fa-user" /> {t("profile_trips")}
      </button>
      {(user.isAdmin || user.is_staff || user.is_superuser) && (
        <>
          <button className="user-menu-item" style={{ color:"var(--nepal-red)" }}
            onClick={() => { window.open((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/admin/", "_blank"); setUserDrop(false); }}>
            <i className="fas fa-tools" style={{ color:"var(--nepal-red)" }} /> {t("admin_panel")}
          </button>
          <button className="user-menu-item" onClick={() => { goTo("activity"); setUserDrop(false); }}>
            <i className="fas fa-history" /> {t("activity_tracker")}
          </button>
        </>
      )}
      <div style={{ height:1, background:"var(--card-border)", margin:"4px 0" }} />
      <button className="user-menu-item danger" onClick={() => { setUser(null); clearToken(); setUserDrop(false); goTo("home"); }}>
        <i className="fas fa-sign-out-alt" /> {t("logout")}
      </button>
    </div>
  );
}
