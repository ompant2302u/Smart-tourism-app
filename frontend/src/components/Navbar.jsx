import { useState, useEffect, useRef } from "react";
import { useLang, LANGUAGES } from "../context/LangContext";
import { destinations, hotels, guides } from "../data/mockData";
import { clearToken } from "../api";


const NAV_KEYS = [
  { key:"destinations", icon:"fa-map-marked-alt" },
  { key:"hotels",       icon:"fa-hotel" },
  { key:"transport",    icon:"fa-bus" },
  { key:"guides",       icon:"fa-user-tie" },
  { key:"safety",       icon:"fa-shield-alt" },
  { key:"estimator",    icon:"fa-calculator" },
];

const SEARCH_INDEX = [
  ...destinations.map(d => ({ label:d.name, sub:`${d.city}, ${d.country}`, type:"destination-detail", id:d.id, emoji:"📍" })),
  ...hotels.map(h =>       ({ label:h.name, sub:h.destination.city,         type:"hotel-detail",       id:h.id, emoji:"🏨" })),
  ...guides.map(g =>       ({ label:g.name, sub:g.specialties?.split(",")[0]||"Guide", type:"guide-detail", id:g.id, emoji:"👤" })),
];

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

  const searchWrap = useRef(null);
  const langWrap   = useRef(null);
  const userWrap   = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (!searchWrap.current?.contains(e.target)) closeSearch();
      if (!langWrap.current?.contains(e.target)) setLangDrop(false);
      if (!userWrap.current?.contains(e.target)) setUserDrop(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

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
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i+1, suggests.length)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i-1, -1)); }
    if (e.key === "Enter")     { activeIdx >= 0 && activeIdx < suggests.length ? commit(suggests[activeIdx]) : commit(null); }
    if (e.key === "Escape")    { closeSearch(); }
  };

  const goTo = (pg) => { navigate(pg); setMenuOpen(false); };
  const curLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <nav className={`clay-nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">

        {/* Brand */}
        <span className="nav-brand" onClick={() => goTo("home")}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Flag_of_Nepal.svg/40px-Flag_of_Nepal.svg.png"
            alt="Nepal" style={{height:26,borderRadius:4,boxShadow:"2px 2px 0px rgba(0,0,0,0.1)"}} />
          Tour Tech
        </span>

        {/* Desktop links */}
        <ul className="nav-links">
          {NAV_KEYS.map(item => (
            <li key={item.key}>
              <button className={`nav-link-btn${page===item.key?" active":""}`} onClick={() => goTo(item.key)}>
                <i className={`fas ${item.icon}`} style={{fontSize:"0.78rem"}}></i>
                {t(item.key)}
              </button>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="nav-actions">

          {/* ── INLINE SEARCH ── */}
          <div ref={searchWrap} style={{position:"relative"}}>
            <div className={`nav-search-wrap${searchOpen?" open":""}`}>
              <button className="nav-search-icon-btn" onClick={searchOpen ? () => commit(null) : openSearch} title="Search">
                <i className="fas fa-search"></i>
              </button>
              <input
                ref={inputRef}
                type="text"
                className="nav-search-input"
                placeholder={t("search_placeholder")}
                value={searchQ}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={onKeyDown}
              />
              {searchQ && (
                <button className="nav-search-clear" onClick={() => { setSearchQ(""); setSuggests([]); inputRef.current?.focus(); }}>×</button>
              )}
            </div>

            {/* Suggestion dropdown */}
            {searchOpen && (suggests.length > 0 || searchQ.trim().length >= 1) && (
              <div className="search-dropdown">
                {suggests.map((item, i) => (
                  <div key={`${item.type}-${item.id}`}
                    className={`search-item${activeIdx===i?" active":""}`}
                    onMouseDown={() => commit(item)}
                    onMouseEnter={() => setActiveIdx(i)}>
                    <span className="search-item-emoji">{item.emoji}</span>
                    <div className="search-item-text">
                      <span className="search-item-label">{item.label}</span>
                      <span className="search-item-sub">{item.sub}</span>
                    </div>
                    <span className="search-item-tag">{item.type.replace("-detail","")}</span>
                  </div>
                ))}
                {searchQ.trim().length >= 1 && (
                  <div className={`search-item search-all${activeIdx===suggests.length?" active":""}`}
                    onMouseDown={() => commit(null)}
                    onMouseEnter={() => setActiveIdx(suggests.length)}>
                    <span className="search-item-emoji">🔍</span>
                    <div className="search-item-text">
                      <span className="search-item-label">Search all for "<strong>{searchQ}</strong>"</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button className="nav-icon-btn" onClick={() => setTheme(theme==="dark"?"light":"dark")}>
            <i className={`fas ${theme==="dark"?"fa-sun":"fa-moon"}`}></i>
          </button>

          {/* ── LANGUAGE SWITCHER ── */}
          <div ref={langWrap} style={{position:"relative"}}>
            <button className="lang-btn" onClick={() => setLangDrop(!langDrop)}>
              <span style={{fontSize:"1rem"}}>{curLang.flag}</span>
              <span className="lang-code-label">{curLang.code.toUpperCase()}</span>
              <i className={`fas fa-chevron-${langDrop?"up":"down"}`} style={{fontSize:"0.55rem",opacity:0.7}}></i>
            </button>
            {langDrop && (
              <div className="lang-dropdown">
                <div className="lang-drop-header">🌍 Select Language</div>
                {LANGUAGES.map(l => (
                  <button key={l.code} className={`lang-option${lang===l.code?" active":""}`}
                    onClick={() => { setLang(l.code); setLangDrop(false); }}>
                    <span style={{fontSize:"1.15rem"}}>{l.flag}</span>
                    <span style={{flex:1,textAlign:"left",fontWeight:700}}>{l.label}</span>
                    {lang===l.code && <i className="fas fa-check" style={{color:"var(--clay-green)",fontSize:"0.8rem"}}></i>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User */}
          {user ? (
            <div ref={userWrap} style={{position:"relative"}}>
              <button className="clay-btn clay-btn-gold clay-btn-sm" onClick={() => setUserDrop(!userDrop)}>
                <i className="fas fa-user-circle"></i>
                {user.firstName || user.username}
                <i className={`fas fa-chevron-${userDrop?"up":"down"}`} style={{fontSize:"0.6rem"}}></i>
              </button>
              {userDrop && (
                <div className="user-menu">
                  <button className="user-menu-item" onClick={() => { goTo("profile"); setUserDrop(false); }}>
                    <i className="fas fa-user"></i> {t("profile")}
                  </button>
                  {(user.isAdmin || user.is_staff || user.is_superuser) && (
                    <>
                      <button className="user-menu-item" onClick={() => { window.open("http://localhost:8000/admin/", "_blank"); setUserDrop(false); }} style={{ color:"var(--clay-red)", fontWeight:800 }}>
                        <i className="fas fa-tools"></i> Admin Panel
                      </button>
                      <button className="user-menu-item" onClick={() => { goTo("activity"); setUserDrop(false); }} style={{ color:"var(--clay-purple)", fontWeight:800 }}>
                        <i className="fas fa-history"></i> Activity Tracker
                      </button>
                    </>
                  )}
                  <hr style={{border:"none",borderTop:"2px dashed rgba(0,0,0,0.06)",margin:"4px 0"}} />
                  <button className="user-menu-item danger" onClick={() => { setUser(null); clearToken(); setUserDrop(false); goTo("home"); }}>
                    <i className="fas fa-sign-out-alt"></i> {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="clay-btn clay-btn-outline clay-btn-sm" onClick={() => goTo("login")}>{t("login")}</button>
              <button className="clay-btn clay-btn-red clay-btn-sm"    onClick={() => goTo("register")}>{t("signup")}</button>
            </>
          )}

          {/* Hamburger */}
          <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <span style={{transform:menuOpen?"rotate(45deg) translate(5px,5px)":"none"}}></span>
            <span style={{opacity:menuOpen?0:1}}></span>
            <span style={{transform:menuOpen?"rotate(-45deg) translate(5px,-5px)":"none"}}></span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen?" open":""}`}>
        {NAV_KEYS.map(item => (
          <button key={item.key} className={`nav-link-btn${page===item.key?" active":""}`}
            style={{width:"100%",justifyContent:"flex-start"}} onClick={() => goTo(item.key)}>
            <i className={`fas ${item.icon}`}></i> {t(item.key)}
          </button>
        ))}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <input type="text" className="clay-input" placeholder={t("search_placeholder")}
            value={mobileQ} onChange={e=>setMobileQ(e.target.value)} style={{flex:1,marginBottom:0,height:44}}
            onKeyDown={e=>e.key==="Enter"&&mobileQ&&(navigate("search",{q:mobileQ}),setMenuOpen(false),setMobileQ(""))} />
          <button className="clay-btn clay-btn-red clay-btn-sm" style={{height:44}}
            onClick={() => {if(mobileQ){navigate("search",{q:mobileQ});setMenuOpen(false);setMobileQ("");}}}>
            <i className="fas fa-search"></i>
          </button>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={()=>setLang(l.code)}
              style={{padding:"6px 10px",borderRadius:10,border:"2px solid var(--clay-border)",background:lang===l.code?"var(--clay-red)":"var(--card-bg)",color:lang===l.code?"#fff":"var(--text2)",fontWeight:800,fontSize:"0.78rem",cursor:"pointer",display:"flex",alignItems:"center",gap:4,boxShadow:lang===l.code?"3px 3px 0px rgba(232,72,85,0.25)":"2px 2px 0px rgba(0,0,0,0.08)"}}>
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>
        <hr style={{border:"none",borderTop:"2px dashed rgba(0,0,0,0.06)"}} />
        {user ? (
          <>
            <button className="nav-link-btn" style={{width:"100%",justifyContent:"flex-start"}} onClick={() => goTo("profile")}>
              <i className="fas fa-user"></i> {t("profile")}
            </button>
            <button className="nav-link-btn" style={{width:"100%",justifyContent:"flex-start",color:"var(--clay-red)"}}
              onClick={() => { setUser(null); goTo("home"); }}>
              <i className="fas fa-sign-out-alt"></i> {t("logout")}
            </button>
          </>
        ) : (
          <div style={{display:"flex",gap:8}}>
            <button className="clay-btn clay-btn-outline clay-btn-sm" onClick={() => goTo("login")}>{t("login")}</button>
            <button className="clay-btn clay-btn-red clay-btn-sm" onClick={() => goTo("register")}>{t("signup")}</button>
          </div>
        )}
      </div>
    </nav>
  );
}
