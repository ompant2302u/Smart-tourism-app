import { useState, useEffect } from "react";
import { api, clearToken } from "../api";
import { useLang } from "../context/LangContext";

// Currency per language
const LANG_CURRENCY = {
  en:{ code:"USD", symbol:"$",  rate:1 },
  ne:{ code:"NPR", symbol:"रू", rate:133.5 },
  hi:{ code:"INR", symbol:"₹",  rate:83.5 },
  zh:{ code:"CNY", symbol:"¥",  rate:7.24 },
  de:{ code:"EUR", symbol:"€",  rate:0.92 },
  fr:{ code:"EUR", symbol:"€",  rate:0.92 },
  ja:{ code:"JPY", symbol:"¥",  rate:149.5 },
};
function fmtAmt(usd, curr) {
  const v = usd * curr.rate;
  return `${curr.symbol}${v.toFixed(curr.rate > 50 ? 0 : 2)}`;
}

const TABS = ["overview","reviews","favourites","payments","tickets","settings"];

const PAY_METHODS = [
  { id:"visa",       label:"Visa",       fab:"fa-cc-visa",       grad:"linear-gradient(135deg,#1a1f71,#2563eb)", tag:"foreign" },
  { id:"mastercard", label:"Mastercard", fab:"fa-cc-mastercard", grad:"linear-gradient(135deg,#eb001b,#f79e1b)", tag:"foreign" },
  { id:"esewa",      label:"eSewa",      fab:"fa-wallet",        grad:"linear-gradient(135deg,#60bb46,#3d8b2f)", tag:"domestic" },
  { id:"khalti",     label:"Khalti",     fab:"fa-wallet",        grad:"linear-gradient(135deg,#5c2d91,#9b59b6)", tag:"domestic" },
];

function Badge({ color, children }) {
  const colors = {
    red:"rgba(232,72,85,0.12)", green:"rgba(6,214,160,0.12)",
    blue:"rgba(67,97,238,0.12)", gold:"rgba(255,209,102,0.2)", purple:"rgba(114,9,183,0.12)"
  };
  const text = { red:"var(--clay-red)", green:"var(--clay-green)", blue:"var(--clay-blue)", gold:"#b8860b", purple:"var(--clay-purple)" };
  return (
    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:99, fontSize:"0.7rem", fontWeight:800,
      background:colors[color]||colors.blue, color:text[color]||text.blue, border:"2px solid currentColor", opacity:0.9 }}>
      {children}
    </span>
  );
}

function StatCard({ icon, label, value, grad }) {
  return (
    <div className="profile-stat-box" style={{ background: grad || "var(--bg3)" }}>
      <div style={{ fontSize:"2rem", marginBottom:6 }}>{icon}</div>
      <div className="profile-stat-num">{value}</div>
      <div style={{ color:"var(--text3)", fontWeight:700, fontSize:"0.85rem" }}>{label}</div>
    </div>
  );
}

function PaymentModal({ booking, onClose, onSuccess }) {
  const { lang } = useLang();
  const curr = LANG_CURRENCY[lang] || LANG_CURRENCY.en;
  const [method, setMethod] = useState("visa");
  const [card, setCard] = useState({ num:"", exp:"", cvv:"" });
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const sel = PAY_METHODS.find(m => m.id === method);
  const isForeign = sel?.tag === "foreign";

  const pay = async (e) => {
    e.preventDefault(); setLoading(true); setErr("");
    try {
      const p = await api.createPayment({
        method, amount: booking.amount, currency: booking.currency || "USD",
        item_name: booking.item_name, item_id: booking.item_id,
        action: booking.action || "book_hotel",
        extra_data: isForeign ? { card_last4: card.num.slice(-4) } : { mobile },
      });
      onSuccess(p);
    } catch(e) { setErr(typeof e==="object" ? Object.values(e).flat().join(" ") : "Payment failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box anim-spinin">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:"2.5rem" }}>💳</div>
          <h4 style={{ fontWeight:900, color:"var(--text)", margin:"8px 0 4px" }}>Complete Payment</h4>
          <p style={{ color:"var(--text3)", fontWeight:600 }}>{booking.item_name} — <strong style={{ color:"var(--clay-red)" }}>{fmtAmt(booking.amount, curr)}</strong></p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {PAY_METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} className={`pay-method-btn${method===m.id?" active":""}`}
              style={{ "--grad": m.grad }}>
              <i className={`fab ${m.fab}`} style={{ fontSize:"1.4rem", display:"block", marginBottom:4 }}></i>
              <span style={{ fontSize:"0.78rem", fontWeight:800 }}>{m.label}</span>
              <span style={{ display:"block", fontSize:"0.62rem", fontWeight:700, opacity:0.7, marginTop:2 }}>{m.tag}</span>
            </button>
          ))}
        </div>
        {err && <div className="form-error">⚠️ {err}</div>}
        <form onSubmit={pay}>
          {isForeign ? (<>
            <label className="form-lbl">Card Number</label>
            <input className="clay-input" placeholder="1234 5678 9012 3456" value={card.num}
              onChange={e => setCard({...card, num:e.target.value.replace(/\D/g,"").slice(0,16)})} required />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div><label className="form-lbl">Expiry</label>
                <input className="clay-input" placeholder="MM/YY" value={card.exp}
                  onChange={e => setCard({...card, exp:e.target.value})} required /></div>
              <div><label className="form-lbl">CVV</label>
                <input className="clay-input" placeholder="123" value={card.cvv}
                  onChange={e => setCard({...card, cvv:e.target.value.replace(/\D/g,"").slice(0,4)})} required /></div>
            </div>
          </>) : (<>
            <label className="form-lbl">{sel?.label} Mobile Number</label>
            <input className="clay-input" placeholder="98XXXXXXXX" value={mobile}
              onChange={e => setMobile(e.target.value.replace(/\D/g,"").slice(0,10))} required />
            <p style={{ fontSize:"0.8rem", color:"var(--text3)", fontWeight:600, marginBottom:12 }}>
              You'll receive a confirmation on your {sel?.label} app.
            </p>
          </>)}
          <button type="submit" className="clay-btn clay-btn-red clay-btn-full clay-btn-lg" style={{ marginTop:8 }} disabled={loading}>
            <i className={`fas ${loading?"fa-spinner fa-spin":"fa-lock"}`}></i> {loading?"Processing...":(`Pay ${fmtAmt(booking.amount, curr)}`)}
          </button>
        </form>
      </div>
    </div>
  );
}

function RefundModal({ payment, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErr("");
    try { onSuccess(await api.requestRefund({ payment_id: payment.id, reason })); }
    catch(e) { setErr(typeof e==="object" ? Object.values(e).flat().join(" ") : "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box anim-spinin">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontSize:"2.5rem" }}>↩️</div>
          <h4 style={{ fontWeight:900, color:"var(--text)", margin:"8px 0 4px" }}>Request Refund</h4>
          <p style={{ color:"var(--text3)", fontWeight:600 }}>${payment.amount} — {payment.method?.toUpperCase()}</p>
          <p style={{ fontSize:"0.78rem", color:"var(--text4)", fontWeight:600 }}>Refunds available within 7 days of booking.</p>
        </div>
        {err && <div className="form-error">⚠️ {err}</div>}
        <form onSubmit={submit}>
          <label className="form-lbl">Reason</label>
          <textarea className="clay-input" rows={3} value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Why do you need a refund?" required style={{ resize:"vertical" }} />
          <button type="submit" className="clay-btn clay-btn-green clay-btn-full clay-btn-lg" style={{ marginTop:8 }} disabled={loading}>
            <i className={`fas ${loading?"fa-spinner fa-spin":"fa-undo"}`}></i> {loading?"Submitting...":"Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ProfilePage({ navigate, user, setUser, pageParams }) {
  const { t } = useLang();
  const [tab, setTab] = useState(pageParams?.tab || "overview");
  const [reviews, setReviews] = useState([]);
  const [favs, setFavs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ first_name: user?.firstName||"", last_name: user?.lastName||"", email: user?.email||"" });
  const [saved, setSaved] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadData = () => {
    Promise.all([
      api.myReviews().catch(() => []),
      api.favorites().catch(() => []),
      api.payments().catch(() => []),
      api.refunds().catch(() => []),
    ]).then(([r, f, p, rf]) => {
      setReviews(r); setFavs(f); setPayments(p); setRefunds(rf);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) { navigate("login"); return; }
    loadData();
    const refresh = () => loadData();
    window.addEventListener("nw-data-changed", refresh);
    return () => window.removeEventListener("nw-data-changed", refresh);
  }, [user]);

  // Reload data and switch tab when navigated with a tab param
  useEffect(() => {
    if (pageParams?.tab) {
      setTab(pageParams.tab);
      if (user) loadData();
    }
  }, [pageParams?.tab]);

  if (!user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile(form);
      setUser({ ...user, firstName: form.first_name, lastName: form.last_name, email: form.email });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch {}
  };

  const handleDeleteReview = async (id) => {
    await api.deleteReview(id).catch(() => {});
    setReviews(r => r.filter(x => x.id !== id));
    showToast("Review deleted");
  };

  const handleRemoveFav = async (fav) => {
    const ct = fav.content_type;
    const id = fav.destination?.id || fav.hotel?.id || fav.guide?.id;
    await api.removeFavorite({ content_type: ct, id }).catch(() => {});
    setFavs(f => f.filter(x => x.id !== fav.id));
    showToast("Removed from favourites");
  };

  const tabIcons = { overview:"fa-th-large", reviews:"fa-star", favourites:"fa-heart", payments:"fa-credit-card", tickets:"fa-ticket-alt", settings:"fa-cog" };

  return (
    <div className="profile-page-wrap">
      {toast && <div className="profile-toast anim-fadeup">{toast}</div>}
      {payModal && <PaymentModal booking={payModal} onClose={() => setPayModal(null)}
        onSuccess={p => { setPayments(prev => [p, ...prev]); setPayModal(null); showToast("Payment successful! 🎉"); }} />}
      {refundModal && <RefundModal payment={refundModal} onClose={() => setRefundModal(null)}
        onSuccess={r => {
          setRefunds(prev => [r, ...prev]);
          // Mark payment as refunded in local state
          setPayments(prev => prev.map(p => p.id === r.payment ? { ...p, status:"refunded" } : p));
          setRefundModal(null);
          showToast("Refund requested ✓");
        }} />}

      {/* ── HERO HEADER ── */}
      <div className="profile-header">
        <div className="profile-header-bg"></div>
        <div className="container" style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:28, flexWrap:"wrap", paddingBottom:32 }}>
            <div className="profile-avatar-ring anim-float">
              <div className="profile-avatar-inner">
                {user.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom:6 }}>
                <h1 style={{ color:"#fff", fontWeight:900, fontSize:"2.2rem", fontFamily:"'Playfair Display',serif", margin:0 }}>
                  {user.firstName || user.username}
                </h1>
                {user.isAdmin && <Badge color="gold">Admin</Badge>}
              </div>
              <p style={{ color:"rgba(255,255,255,0.65)", fontWeight:600, margin:0 }}>✉️ {user.email}</p>
            </div>
            <button className="clay-btn clay-btn-outline" style={{ color:"#fff", borderColor:"rgba(255,255,255,0.3)" }}
              onClick={() => { clearToken(); setUser(null); navigate("home"); }}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>

          {/* Stats row */}
          <div className="profile-stats-row">
            {[
              { icon:"⭐", label:"Reviews",    value: reviews.length,  grad:"linear-gradient(135deg,rgba(232,72,85,0.25),rgba(255,107,107,0.15))", tab:"reviews" },
              { icon:"❤️", label:"Favourites", value: favs.length,     grad:"linear-gradient(135deg,rgba(255,209,102,0.25),rgba(255,179,71,0.15))", tab:"favourites" },
              { icon:"💳", label:"Payments",   value: payments.length, grad:"linear-gradient(135deg,rgba(6,214,160,0.25),rgba(5,150,105,0.15))", tab:"payments" },
            ].map(s => (
              <div key={s.label} className="profile-stat-pill" style={{ background: s.grad, cursor:"pointer" }} onClick={() => setTab(s.tab)}>
                <span style={{ fontSize:"1.4rem" }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight:900, fontSize:"1.4rem", color:"#fff", lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.7)", fontWeight:700 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="profile-tabs-bar">
        <div className="container">
          <div className="profile-tabs">
            {TABS.map(t => (
              <button key={t} className={`profile-tab-btn${tab===t?" active":""}`} onClick={() => setTab(t)}>
                <i className={`fas ${tabIcons[t]}`}></i>
                <span>{t.charAt(0).toUpperCase()+t.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="container" style={{ padding:"40px 24px 80px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:80 }}>
            <div className="loader-spinner" style={{ margin:"0 auto" }}></div>
          </div>
        ) : (
          <>
            {tab === "overview" && <OverviewTab reviews={reviews} favs={favs} payments={payments} navigate={navigate} setTab={setTab} />}
            {tab === "reviews" && <ReviewsTab reviews={reviews} onDelete={handleDeleteReview} navigate={navigate} />}
            {tab === "favourites" && <FavouritesTab favs={favs} onRemove={handleRemoveFav} navigate={navigate} />}
            {tab === "payments" && <PaymentsTab payments={payments} refunds={refunds} onRefund={p => setRefundModal(p)} onNewPayment={() => setPayModal({ item_name:"Custom Booking", amount:100, currency:"USD", action:"book_hotel" })} />}
            {tab === "tickets" && <TicketsTab payments={payments} />}
            {tab === "settings" && <SettingsTab form={form} setForm={setForm} onSave={handleSave} saved={saved} user={user} />}
          </>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ reviews, favs, payments, navigate, setTab }) {
  const { lang } = useLang();
  const curr = LANG_CURRENCY[lang] || LANG_CURRENCY.en;
  const recentPays = [...payments].slice(0, 3);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
      <div className="clay-card" style={{ padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h5 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>⭐ Recent Reviews</h5>
          <button className="clay-btn clay-btn-outline clay-btn-sm" onClick={() => setTab("reviews")}>View all</button>
        </div>
        {reviews.slice(0,3).length === 0 ? <EmptyState icon="⭐" msg="No reviews yet" /> :
          reviews.slice(0,3).map(r => (
            <div key={r.id} style={{ padding:"12px 0", borderBottom:"1px dashed rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontWeight:700, fontSize:"0.85rem", color:"var(--text)" }}>
                  {r.destination?.name || r.hotel?.name || r.guide?.name || r.content_type}
                </span>
                <span style={{ color:"var(--clay-gold)", fontSize:"0.9rem" }}>{"★".repeat(r.rating)}</span>
              </div>
              <p style={{ margin:0, fontSize:"0.82rem", color:"var(--text3)", fontWeight:500 }}>{r.comment?.slice(0,80)}{r.comment?.length>80?"…":""}</p>
            </div>
          ))
        }
      </div>

      <div className="clay-card" style={{ padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h5 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>❤️ Favourites</h5>
          <button className="clay-btn clay-btn-outline clay-btn-sm" onClick={() => setTab("favourites")}>View all</button>
        </div>
        {favs.slice(0,4).length === 0 ? <EmptyState icon="❤️" msg="No favourites yet" /> :
          favs.slice(0,4).map(f => {
            const item = f.destination || f.hotel || f.guide;
            const icon = f.content_type==="hotel"?"🏨":f.content_type==="guide"?"👤":f.content_type==="transport"?"🚌":"📍";
            return (
              <div key={f.id} style={{ display:"flex", gap:12, alignItems:"center", padding:"10px 0", borderBottom:"1px dashed rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize:"1.4rem" }}>{icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:"0.85rem", color:"var(--text)" }}>{item?.name || "—"}</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--text3)", fontWeight:600, textTransform:"capitalize" }}>{f.content_type}</div>
                </div>
              </div>
            );
          })
        }
      </div>

      <div className="clay-card" style={{ padding:28, gridColumn:"1/-1" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h5 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>💳 Recent Payments</h5>
          <button className="clay-btn clay-btn-outline clay-btn-sm" onClick={() => setTab("payments")}>View all</button>
        </div>
        {recentPays.length === 0 ? <EmptyState icon="💳" msg="No payments yet" /> :
          recentPays.map(p => (
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px dashed rgba(0,0,0,0.06)" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:"0.85rem", color:"var(--text)" }}>{p.booking?.item_name || p.method}</div>
                <div style={{ fontSize:"0.75rem", color:"var(--text3)", fontWeight:600 }}>{p.method?.toUpperCase()} · {new Date(p.created_at).toLocaleDateString()}</div>
              </div>
              <span style={{ fontWeight:900, color:"var(--clay-green)", fontSize:"0.95rem" }}>{fmtAmt(p.amount, curr)}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function ReviewsTab({ reviews, onDelete, navigate }) {
  if (reviews.length === 0) return (
    <div className="clay-card" style={{ padding:60, textAlign:"center" }}>
      <EmptyState icon="⭐" msg="You haven't written any reviews yet." cta="Explore destinations" onCta={() => navigate("destinations")} />
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {reviews.map(r => (
        <div key={r.id} className="clay-card profile-review-card">
          <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
            <div className="review-avatar">⭐</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:6 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <Badge color={r.content_type==="hotel"?"blue":r.content_type==="guide"?"purple":"red"}>{r.content_type}</Badge>
                  <strong style={{ color:"var(--text)", fontWeight:800 }}>
                    {r.destination?.name || r.hotel?.name || r.guide?.name || "—"}
                  </strong>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ color:"var(--clay-gold)", fontSize:"1rem" }}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
                  <small style={{ color:"var(--text3)", fontWeight:600 }}>{new Date(r.created_at).toLocaleDateString()}</small>
                </div>
              </div>
              <p style={{ margin:"0 0 12px", color:"var(--text2)", fontSize:"0.9rem", fontWeight:500, lineHeight:1.6 }}>{r.comment}</p>
              <button className="clay-btn clay-btn-outline clay-btn-sm" style={{ color:"var(--clay-red)", borderColor:"rgba(232,72,85,0.3)" }}
                onClick={() => onDelete(r.id)}>
                <i className="fas fa-trash-alt"></i> Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FavouritesTab({ favs, onRemove, navigate }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? favs : favs.filter(f => f.content_type === filter);
  if (favs.length === 0) return (
    <div className="clay-card" style={{ padding:60, textAlign:"center" }}>
      <EmptyState icon="❤️" msg="No favourites saved yet." cta="Explore destinations" onCta={() => navigate("destinations")} />
    </div>
  );
  const typeIcon = { destination:"📍", hotel:"🏨", guide:"👤", transport:"🚌" };
  const typeColor = { destination:"red", hotel:"blue", guide:"purple", transport:"green" };
  const typePage = { destination:"destination-detail", hotel:"hotel-detail", guide:"guide-detail" };
  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
        {["all","destination","hotel","guide","transport"].map(f => (
          <button key={f} className={`filter-chip${filter===f?" active":""}`} onClick={() => setFilter(f)}>
            {typeIcon[f]||"🌐"} {f==="all"?"All":f.charAt(0).toUpperCase()+f.slice(1)}s ({f==="all"?favs.length:favs.filter(x=>x.content_type===f).length})
          </button>
        ))}
      </div>
      <div className="grid-3">
        {filtered.map(fav => {
          const item = fav.destination || fav.hotel || fav.guide;
          const pg = typePage[fav.content_type];
          return (
            <div key={fav.id} className="clay-card fav-card">
              {item?.image && <img src={item.image} alt={item.name} style={{ width:"100%", height:160, objectFit:"cover", borderRadius:"20px 20px 0 0" }} />}
              {!item?.image && (
                <div style={{ width:"100%", height:100, borderRadius:"20px 20px 0 0", background:"linear-gradient(135deg,var(--clay-red),var(--clay-purple))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem" }}>
                  {typeIcon[fav.content_type]||"❤️"}
                </div>
              )}
              <div style={{ padding:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div>
                    <Badge color={typeColor[fav.content_type]||"blue"}>{fav.content_type}</Badge>
                    <h6 style={{ fontWeight:800, color:"var(--text)", margin:"6px 0 0" }}>{item?.name || fav.item_name || "Transport Route"}</h6>
                  </div>
                  <button className="fav-remove-btn" onClick={() => onRemove(fav)} title="Remove">
                    <i className="fas fa-heart-broken"></i>
                  </button>
                </div>
                {pg && item?.id && (
                  <button className="clay-btn clay-btn-outline clay-btn-sm clay-btn-full" style={{ marginTop:8 }}
                    onClick={() => navigate(pg, { id: item.id })}>
                    View Details
                  </button>
                )}
                {fav.content_type === "transport" && (
                  <button className="clay-btn clay-btn-outline clay-btn-sm clay-btn-full" style={{ marginTop:8 }}
                    onClick={() => navigate("transport")}>
                    View Transport
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VisitedTab({ history, navigate }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? history : history.filter(h => h.content_type === filter);
  const typeIcon = { destination:"📍", hotel:"🏨", transport:"🚌", guide:"👤" };

  const goToItem = (h) => {
    if (h.content_type === "hotel" && h.hotel?.id) navigate("hotel-detail", { id: h.hotel.id });
    else if (h.content_type === "destination" && h.destination?.id) navigate("destination-detail", { id: h.destination.id });
    else if (h.content_type === "guide" && h.guide?.id) navigate("guide-detail", { id: h.guide.id });
    else if (h.content_type === "transport") navigate("transport");
  };

  if (history.length === 0) return (
    <div className="clay-card" style={{ padding:60, textAlign:"center" }}>
      <EmptyState icon="🗺️" msg="No visit history yet. Start exploring!" cta="Explore" onCta={() => navigate("destinations")} />
    </div>
  );
  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
        {["all","destination","hotel","guide","transport"].map(f => (
          <button key={f} className={`filter-chip${filter===f?" active":""}`} onClick={() => setFilter(f)}>
            {typeIcon[f]||"🌐"} {f==="all"?"All":f.charAt(0).toUpperCase()+f.slice(1)}s
            {" "}({f==="all" ? history.length : history.filter(h=>h.content_type===f).length})
          </button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {filtered.map((h,i) => (
          <div key={i} className="clay-card visit-row" style={{ animationDelay:`${i*0.04}s`, cursor: h.content_type!=="transport"?"pointer":"default" }}
            onClick={() => goToItem(h)}>
            <div className="visit-icon-box">{typeIcon[h.content_type]||"🌐"}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, color:"var(--text)", marginBottom:2 }}>
                {h.item_name || h.destination?.name || h.hotel?.name || h.guide?.name || "—"}
              </div>
              <div style={{ fontSize:"0.78rem", color:"var(--text3)", fontWeight:600, display:"flex", gap:8, alignItems:"center" }}>
                <Badge color={h.content_type==="hotel"?"blue":h.content_type==="guide"?"purple":h.content_type==="transport"?"green":"red"}>{h.content_type}</Badge>
                <span>{new Date(h.visited_at).toLocaleString()}</span>
              </div>
            </div>
            {h.content_type !== "transport" && (
              <i className="fas fa-chevron-right" style={{ color:"var(--text4)", fontSize:"0.8rem" }}></i>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentsTab({ payments, refunds, onRefund, onNewPayment }) {
  const { lang } = useLang();
  const curr = LANG_CURRENCY[lang] || LANG_CURRENCY.en;
  const [view, setView] = useState("payments");
  const statusColor = { completed:"green", pending:"gold", failed:"red", refunded:"blue", requested:"gold", approved:"blue", processed:"green", rejected:"red" };
  const methodIcon = { visa:"fa-cc-visa", mastercard:"fa-cc-mastercard", esewa:"fa-wallet", khalti:"fa-wallet" };
  return (
    <div>
      <div style={{ display:"flex", gap:10, marginBottom:24 }}>
        <button className={`filter-chip${view==="payments"?" active":""}`} onClick={() => setView("payments")}>
          💳 Payments ({payments.length})
        </button>
        <button className={`filter-chip${view==="refunds"?" active":""}`} onClick={() => setView("refunds")}>
          ↩️ Refunds ({refunds.length})
        </button>
      </div>

      {view === "payments" && (
        payments.length === 0 ? <div className="clay-card" style={{ padding:60, textAlign:"center" }}><EmptyState icon="💳" msg="No payments yet." /></div> :
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {payments.map(p => {
            const canRefund = p.status === "completed" && !refunds.find(r => r.payment === p.id || r.payment?.id === p.id);
            return (
              <div key={p.id} className="clay-card" style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                  <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                    <div style={{ width:44, height:44, borderRadius:14, background:"linear-gradient(135deg,var(--clay-blue),var(--clay-purple))", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid rgba(0,0,0,0.08)" }}>
                      <i className={`fab ${methodIcon[p.method]||"fa-credit-card"}`} style={{ color:"#fff", fontSize:"1.2rem" }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight:800, color:"var(--text)" }}>{p.booking?.item_name || "Payment"}</div>
                      <div style={{ fontSize:"0.78rem", color:"var(--text3)", fontWeight:600 }}>
                        {p.method?.toUpperCase()} · TXN: {p.transaction_id} · {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontWeight:900, fontSize:"1.1rem", color:"var(--clay-green)" }}>{fmtAmt(p.amount, curr)}</span>
                    <Badge color={statusColor[p.status]||"blue"}>{p.status}</Badge>
                    {canRefund && (
                      <button className="clay-btn clay-btn-outline clay-btn-sm" style={{ color:"var(--clay-red)", borderColor:"rgba(232,72,85,0.3)" }}
                        onClick={() => onRefund(p)}>
                        <i className="fas fa-undo"></i> Refund
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "refunds" && (
        refunds.length === 0 ? <div className="clay-card" style={{ padding:60, textAlign:"center" }}><EmptyState icon="↩️" msg="No refund requests." /></div> :
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {refunds.map(r => (
            <div key={r.id} className="clay-card" style={{ padding:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                <div>
                  <div style={{ fontWeight:800, color:"var(--text)", marginBottom:4 }}>Refund #{r.id} — {fmtAmt(r.amount, curr)}</div>
                  <div style={{ fontSize:"0.82rem", color:"var(--text3)", fontWeight:600, marginBottom:4 }}>{r.reason}</div>
                  {r.admin_note && <div style={{ fontSize:"0.78rem", color:"var(--clay-blue)", fontWeight:700 }}>Admin: {r.admin_note}</div>}
                  <small style={{ color:"var(--text4)", fontWeight:600 }}>{new Date(r.created_at).toLocaleDateString()}</small>
                </div>
                <Badge color={statusColor[r.status]||"gold"}>{r.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ form, setForm, onSave, saved, user }) {
  return (
    <div style={{ maxWidth:560 }}>
      <div className="clay-card" style={{ padding:36, borderRadius:28 }}>
        <h5 style={{ fontWeight:800, marginBottom:24, color:"var(--text)" }}>✏️ Edit Profile</h5>
        {saved && <div className="form-success">✓ Profile saved successfully!</div>}
        <form onSubmit={onSave}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label className="form-lbl">First Name</label>
              <input className="clay-input" value={form.first_name} onChange={e => setForm({...form, first_name:e.target.value})} />
            </div>
            <div>
              <label className="form-lbl">Last Name</label>
              <input className="clay-input" value={form.last_name} onChange={e => setForm({...form, last_name:e.target.value})} />
            </div>
          </div>
          <label className="form-lbl">Email</label>
          <input className="clay-input" type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
          <label className="form-lbl">Username</label>
          <input className="clay-input" value={user.username} disabled style={{ opacity:0.6 }} />
          <button type="submit" className="clay-btn clay-btn-red clay-btn-full" style={{ height:48, marginTop:8 }}>
            💾 Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ icon, msg, cta, onCta }) {
  return (
    <div style={{ textAlign:"center", padding:"20px 0" }}>
      <div style={{ fontSize:"3rem", marginBottom:12 }}>{icon}</div>
      <p style={{ color:"var(--text3)", fontWeight:600, marginBottom: cta?16:0 }}>{msg}</p>
      {cta && <button className="clay-btn clay-btn-blue" onClick={onCta}>{cta}</button>}
    </div>
  );
}

function TicketsTab({ payments }) {
  const { lang } = useLang();
  const curr = LANG_CURRENCY[lang] || LANG_CURRENCY.en;
  const booked = payments.filter(p => p.booking && ["book_hotel","book_guide","book_transport"].includes(p.booking?.action));
  const methodIcon = { visa:"fa-cc-visa", mastercard:"fa-cc-mastercard", esewa:"fa-wallet", khalti:"fa-wallet" };
  const actionLabel = { book_hotel:"🏨 Hotel", book_guide:"👤 Guide", book_transport:"🚌 Transport" };

  if (booked.length === 0) return (
    <div className="clay-card" style={{ padding:60, textAlign:"center" }}>
      <EmptyState icon="🎫" msg="No booking tickets yet. Book a hotel, guide or transport to see your tickets here." cta="Explore Hotels" onCta={() => {}} />
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {booked.map(p => {
        const b = p.booking;
        const extra = b?.extra_data || {};
        const isRefunded = p.status === "refunded";
        return (
          <div key={p.id} className="clay-card" style={{ padding:0, overflow:"hidden", opacity: isRefunded ? 0.7 : 1 }}>
            <div style={{ background: isRefunded ? "linear-gradient(135deg,#374151,#6b7280)" : "linear-gradient(135deg,#1a0533,#302b63)", padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.72rem", fontWeight:800, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>
                  {actionLabel[b?.action] || "Booking"} · TXN: {p.transaction_id}
                </div>
                <h5 style={{ color:"#fff", fontWeight:900, margin:0, fontFamily:"'Playfair Display',serif" }}>{b?.item_name || "Booking"}</h5>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color: isRefunded ? "#9ca3af" : "var(--clay-gold)", fontWeight:900, fontSize:"1.4rem" }}>{fmtAmt(p.amount, curr)}</div>
                <span style={{ fontSize:"0.7rem", fontWeight:800, padding:"3px 10px", borderRadius:99,
                  background: isRefunded ? "rgba(107,114,128,0.3)" : p.status==="completed" ? "rgba(6,214,160,0.2)" : "rgba(255,209,102,0.2)",
                  color: isRefunded ? "#9ca3af" : p.status==="completed" ? "#06d6a0" : "#f59e0b",
                  border:"1px solid currentColor" }}>
                  {isRefunded ? "REFUNDED" : p.status?.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ padding:"20px 28px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:16 }}>
              {[
                { label:"Payment Method", value: <><i className={`fab ${methodIcon[p.method]||"fa-credit-card"}`} style={{ marginRight:6 }}></i>{p.method?.toUpperCase()}</> },
                { label:"Booked On", value: new Date(p.created_at).toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"}) },
                extra.checkIn  && { label:"Check-in",   value: extra.checkIn },
                extra.checkOut && { label:"Check-out",  value: extra.checkOut },
                extra.guests   && { label:"Guests",     value: extra.guests },
                extra.rooms    && { label:"Rooms",      value: extra.rooms },
                extra.days     && { label:"Days",       value: extra.days },
                extra.fullName && { label:"Guest Name", value: extra.fullName },
                extra.phone    && { label:"Phone",      value: extra.phone },
              ].filter(Boolean).map((item,i) => (
                <div key={i}>
                  <div style={{ fontSize:"0.7rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.5, color:"var(--text3)", marginBottom:3 }}>{item.label}</div>
                  <div style={{ fontWeight:700, color:"var(--text)", fontSize:"0.9rem" }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop:"2px dashed rgba(0,0,0,0.08)", margin:"0 28px", paddingBottom:16, paddingTop:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:"0.75rem", color:"var(--text3)", fontWeight:600 }}>Tour Tech · Booking Confirmation</span>
              {isRefunded ? (
                <span style={{ fontSize:"0.78rem", color:"#9ca3af", fontWeight:700, padding:"6px 14px", borderRadius:99, background:"rgba(107,114,128,0.1)", border:"1px solid rgba(107,114,128,0.3)" }}>
                  ↩️ Refunded — ticket void
                </span>
              ) : (
                <button onClick={() => window.print()} className="clay-btn clay-btn-outline clay-btn-sm">
                  <i className="fas fa-print"></i> Print Ticket
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
