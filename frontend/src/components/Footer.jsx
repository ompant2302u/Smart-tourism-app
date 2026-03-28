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
    try {
      await api.newsletter(email);
    } catch {}
    setSubDone(true);
    setEmail("");
    setTimeout(() => setSubDone(false), 4000);
  };

  return (
    <footer
      className="clay-footer"
      style={{
        background: "linear-gradient(135deg,#141e30,#243b55,#1b2735)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 28,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Flag_of_Nepal.svg/40px-Flag_of_Nepal.svg.png"
                alt="Nepal"
                style={{
                  height: 28,
                  borderRadius: 4,
                  boxShadow: "4px 4px 0px rgba(0,0,0,0.16)",
                }}
              />
              <span
                className="footer-brand"
                style={{
                  background: "linear-gradient(135deg,#ffd166,#ff9966,#ff5e62)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                TourTech
              </span>
            </div>

            <p className="footer-text mb-16">{t("gateway")}</p>

            <div style={{ display: "flex", gap: 8 }}>
              {["facebook", "instagram", "youtube", "twitter"].map((s, i) => {
                const socialGradients = [
                  "linear-gradient(135deg,#1877f2,#3b82f6)",
                  "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)",
                  "linear-gradient(135deg,#ff0000,#ff4d4d)",
                  "linear-gradient(135deg,#1da1f2,#60a5fa)",
                ];

                return (
                  <a
                    key={s}
                    href="#"
                    className="footer-social"
                    style={{
                      background: socialGradients[i],
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.12)",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
                    }}
                  >
                    <i className={`fab fa-${s}`}></i>
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <p
              className="footer-heading"
              style={{
                color: "#fff",
                background: "linear-gradient(135deg,#ffd166,#ffb347)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("explore_footer")}
            </p>

            {[
              ["destinations", t("destinations")],
              ["hotels", t("hotels")],
              ["transport", t("transport")],
              ["guides", t("guides")],
              ["estimator", "Budget Estimator"],
            ].map(([pg, lbl]) => (
              <a key={pg} className="footer-link" onClick={() => navigate(pg)}>
                {lbl}
              </a>
            ))}
          </div>

          <div>
            <p
              className="footer-heading"
              style={{
                color: "#fff",
                background: "linear-gradient(135deg,#36d1dc,#5b86e5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("support")}
            </p>

            {[
              ["safety", t("safety_info_footer")],
              ["about", t("about_footer")],
              ["contact", t("contact_footer")],
            ].map(([pg, lbl]) => (
              <a key={pg} className="footer-link" onClick={() => navigate(pg)}>
                {lbl}
              </a>
            ))}
          </div>

          <div>
            <p
              className="footer-heading"
              style={{
                color: "#fff",
                background: "linear-gradient(135deg,#11998e,#38ef7d)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("newsletter")}
            </p>

            <p className="footer-text mb-12" style={{ fontSize: "0.85rem" }}>
              {t("newsletter_sub")}
            </p>

            {subDone ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "linear-gradient(135deg,rgba(17,153,142,0.14),rgba(56,239,125,0.14))",
                  border: "2px solid rgba(17,153,142,0.3)",
                  borderRadius: 12,
                  color: "#38ef7d",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  marginBottom: 14,
                  boxShadow: "0 8px 18px rgba(17,153,142,0.12)",
                }}
              >
                ✅ Subscribed!
              </div>
            ) : (
              <form onSubmit={handleSub} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input
                  type="email"
                  className="clay-input"
                  placeholder={t("your_email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    marginBottom: 0,
                    background: "linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))",
                  }}
                />
                <button
                  type="submit"
                  className="clay-btn clay-btn-red clay-btn-sm"
                  style={{
                    flexShrink: 0,
                    background: "linear-gradient(135deg,#ff5f6d,#ffc371)",
                    color: "#fff",
                    border: "none",
                    boxShadow: "0 10px 20px rgba(255,95,109,0.22)",
                  }}
                >
                  {t("subscribe")}
                </button>
              </form>
            )}

            <p className="footer-text" style={{ fontSize: "0.82rem" }}>
              <i
                className="fas fa-phone"
                style={{
                  color: "#ff9966",
                  marginRight: 6,
                }}
              ></i>
              Nepal Tourism Board: +977-1-4256909
            </p>
          </div>
        </div>

        <hr
          className="footer-divider"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)",
          }}
        />

        <p className="footer-text" style={{ textAlign: "center", fontSize: "0.85rem" }}>
          © 2026 TourTech Pvt.Ltd. {t("all_rights")} | {t("built_with")}{" "}
          <i
            className="fas fa-heart"
            style={{
              background: "linear-gradient(135deg,#ff5f6d,#ff9966)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          ></i>{" "}
          {t("for_travelers")}
        </p>
      </div>

      <style>{`
        @media(max-width:768px){
          .clay-footer .container>div{
            grid-template-columns:1fr 1fr!important;
          }
        }
      `}</style>
    </footer>
  );
}