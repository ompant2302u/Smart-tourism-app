import { useState } from "react";
import { useLang } from "../context/LangContext";
import { api } from "../api";

export default function Footer({ navigate }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [subDone, setSubDone] = useState(false);

  const handleSub = async (e) => {
    e.preventDefault();
    if (!email) return;
    try { await api.newsletter(email); } catch {}
    setSubDone(true);
    setEmail("");
    setTimeout(() => setSubDone(false), 5000);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.3fr", gap: 40, marginBottom: 48 }}>

          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,var(--mountain-500),var(--forest-600))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                🏔️
              </div>
              <span className="footer-brand">NepalWander</span>
            </div>
            <p className="footer-desc">{t("footer_desc")}</p>
            <div className="footer-social">
              {[
                { cls: "fb", icon: "facebook-f" },
                { cls: "ig", icon: "instagram" },
                { cls: "yt", icon: "youtube" },
                { cls: "tw", icon: "twitter" },
              ].map(s => (
                <a key={s.cls} href="#" className={`footer-social-link ${s.cls}`} aria-label={s.cls}>
                  <i className={`fab fa-${s.icon}`} />
                </a>
              ))}
            </div>

            {/* Contact */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", marginBottom: 6 }}>
                <i className="fas fa-phone" style={{ color: "var(--sunset-400)", width: 14 }} />
                {t("footer_ntb")}: +977-1-4256909
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>
                <i className="fas fa-envelope" style={{ color: "var(--mountain-300)", width: 14 }} />
                info@nepalwander.com
              </div>
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="footer-heading">{t("explore_footer")}</p>
            {[
              ["destinations", t("destinations")],
              ["hotels", t("footer_hotels_homestays")],
              ["guides", t("local_guides")],
              ["transport", t("transport")],
              ["estimator", t("footer_budget_planner")],
            ].map(([pg, lbl]) => (
              <a key={pg} className="footer-link" onClick={() => navigate(pg)}>{lbl}</a>
            ))}
          </div>

          {/* Features */}
          <div>
            <p className="footer-heading">{t("footer_features")}</p>
            {[
              ["ai-itinerary",   t("footer_ai_planner")],
              ["interactive-map", t("footer_interactive_map")],
              ["safety",          t("footer_safety_alerts")],
              ["about",           t("about_us")],
              ["contact",         t("contact_us")],
            ].map(([pg, lbl]) => (
              <a key={pg} className="footer-link" onClick={() => navigate(pg)}>{lbl}</a>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <p className="footer-heading">{t("footer_stay_updated")}</p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.83rem", marginBottom: 14, lineHeight: 1.6 }}>
              {t("footer_newsletter_brief")}
            </p>

            {subDone ? (
              <div style={{ padding: "10px 14px", background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: "var(--radius-lg)", color: "var(--forest-300)", fontWeight: 700, fontSize: "0.85rem", marginBottom: 14 }}>
                {t("footer_subscribed_short")}
              </div>
            ) : (
              <form onSubmit={handleSub} style={{ marginBottom: 14 }}>
                <div className="footer-input-wrap">
                  <input type="email" className="footer-input" placeholder={t("newsletter_placeholder")} value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-accent w-full btn-sm">
                  <i className="fas fa-paper-plane" /> {t("subscribe")}
                </button>
              </form>
            )}

            {/* Safety badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "rgba(37,99,176,0.08)", border: "1px solid rgba(37,99,176,0.15)", borderRadius: "var(--radius-md)" }}>
              <i className="fas fa-shield-alt" style={{ color: "var(--mountain-400)", fontSize: "1rem" }} />
              <div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.76rem", fontWeight: 600 }}>{t("footer_realtime_safety")}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem" }}>{t("footer_monitoring")}</div>
              </div>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p className="footer-copy">{t("footer_copyright")}</p>
          <div style={{ display: "flex", gap: 16 }}>
            <a style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", cursor: "pointer" }}>{t("footer_privacy")}</a>
            <a style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", cursor: "pointer" }}>{t("footer_terms")}</a>
            <a style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", cursor: "pointer" }}>{t("footer_cookie")}</a>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:1024px){
          .footer .container > div:first-child { grid-template-columns: 1fr 1fr !important; }
        }
        @media(max-width:640px){
          .footer .container > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
