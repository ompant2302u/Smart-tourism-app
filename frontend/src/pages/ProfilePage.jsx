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

  useEffect(() => {
    if (pageParams?.tab) { setTab(pageParams.tab); if (user) loadData(); }
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
    showToast("✓ Review deleted");
  };

  const handleRemoveFav = async (fav) => {
    const ct = fav.content_type;
    const id = fav.destination?.id || fav.hotel?.id || fav.guide?.id;
    await api.removeFavorite({ content_type: ct, id }).catch(() => {});
    setFavs(f => f.filter(x => x.id !== fav.id));
    showToast("✓ Removed from favourites");
  };

  const TABS = [
    { id:"overview",   icon:"fa-th-large",    label:"Overview" },
    { id:"reviews",    icon:"fa-star",         label:"Reviews" },
    { id:"favourites", icon:"fa-heart",        label:"Favourites" },
    { id:"payments",   icon:"fa-credit-card",  label:"Payments" },
    { id:"tickets",    icon:"fa-ticket-alt",   label:"Tickets" },
    { id:"chat-history", icon:"fa-microphone", label:"Voice Chats" },
    { id:"settings",   icon:"fa-cog",          label:"Settings" },
  ];

  const initials = (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase();

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      {toast && <div className="profile-toast">{toast}</div>}
      {payModal && <PaymentModal booking={payModal} onClose={() => setPayModal(null)}
        onSuccess={p => { setPayments(prev => [p, ...prev]); setPayModal(null); showToast("🎉 Payment successful!"); }} />}
      {refundModal && <RefundModal payment={refundModal} onClose={() => setRefundModal(null)}
        onSuccess={r => {
          setRefunds(prev => [r, ...prev]);
          setPayments(prev => prev.map(p => p.id === r.payment ? { ...p, status:"refunded" } : p));
          setRefundModal(null); showToast("✓ Refund requested");
        }} />}

      {/* ── HERO HEADER ── */}
      <div className="profile-header">
        <div className="profile-header-bg" />
        <div className="container" style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:24, flexWrap:"wrap", paddingBottom:0 }}>
            <div className="profile-avatar-ring anim-float">
              <div className="profile-avatar-inner">{initials}</div>
            </div>
            <div style={{ flex:1, paddingBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginBottom:4 }}>
                <h1 style={{ color:"#fff", fontWeight:900, fontSize:"clamp(1.5rem,4vw,2.2rem)", fontFamily:"'Poppins',sans-serif", margin:0 }}>
                  {user.firstName || user.username}
                </h1>
                {user.isAdmin && (
                  <span style={{ padding:"3px 12px", borderRadius:99, background:"linear-gradient(135deg,#b8860b,#d4a017)", color:"#fff", fontSize:"0.72rem", fontWeight:800 }}>
                    ⭐ Admin
                  </span>
                )}
              </div>
              <p style={{ color:"rgba(255,255,255,0.55)", fontWeight:500, margin:0, fontSize:"0.9rem" }}>
                @{user.username}{user.email ? ` · ${user.email}` : ""}
              </p>
            </div>
            <button onClick={() => { clearToken(); setUser(null); navigate("home"); }}
              style={{ padding:"10px 20px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.08)", color:"#fff", fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:"0.85rem", cursor:"pointer", display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(8px)", marginBottom:8 }}>
              <i className="fas fa-sign-out-alt" /> Sign Out
            </button>
          </div>

          {/* Stats pills */}
          <div className="profile-stats-row">
            {[
              { icon:"⭐", label:"Reviews",    value:reviews.length,  grad:"linear-gradient(135deg,rgba(193,18,31,0.35),rgba(230,57,70,0.2))",   tab:"reviews" },
              { icon:"❤️", label:"Favourites", value:favs.length,     grad:"linear-gradient(135deg,rgba(255,183,3,0.35),rgba(244,162,97,0.2))",  tab:"favourites" },
              { icon:"💳", label:"Payments",   value:payments.length, grad:"linear-gradient(135deg,rgba(6,214,160,0.35),rgba(5,150,105,0.2))",   tab:"payments" },
              { icon:"🎫", label:"Tickets",    value:payments.filter(p=>p.booking).length, grad:"linear-gradient(135deg,rgba(37,99,176,0.35),rgba(124,58,237,0.2))", tab:"tickets" },
            ].map(s => (
              <div key={s.label} className="profile-stat-pill" style={{ background:s.grad, cursor:"pointer" }} onClick={() => setTab(s.tab)}>
                <span style={{ fontSize:"1.5rem" }}>{s.icon}</span>
                <div>
                  <div style={{ fontWeight:900, fontSize:"1.5rem", color:"#fff", lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.65)", fontWeight:700, marginTop:2 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div style={{ height:40, background:"var(--bg)", marginTop:24, clipPath:"ellipse(55% 100% at 50% 100%)" }} />
      </div>

      {/* ── TABS ── */}
      <div className="profile-tabs-bar">
        <div className="container">
          <div className="profile-tabs">
            {TABS.map(tb => (
              <button key={tb.id} className={`profile-tab-btn${tab===tb.id?" active":""}`} onClick={() => setTab(tb.id)}>
                <i className={`fas ${tb.icon}`} />
                <span>{tb.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="container" style={{ padding:"36px 24px 80px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:80 }}>
            <div className="loader-spinner" style={{ margin:"0 auto 16px" }} />
            <p style={{ color:"var(--text3)", fontWeight:600 }}>Loading your profile…</p>
          </div>
        ) : (
          <>
            {tab==="overview"      && <OverviewTab reviews={reviews} favs={favs} payments={payments} navigate={navigate} setTab={setTab} />}
            {tab==="reviews"       && <ReviewsTab reviews={reviews} onDelete={handleDeleteReview} navigate={navigate} />}
            {tab==="favourites"    && <FavouritesTab favs={favs} onRemove={handleRemoveFav} navigate={navigate} />}
            {tab==="payments"      && <PaymentsTab payments={payments} refunds={refunds} onRefund={p => setRefundModal(p)} onNewPayment={() => setPayModal({ item_name:"Custom Booking", amount:100, currency:"USD", action:"book_hotel" })} />}
            {tab==="tickets"       && <TicketsTab payments={payments} />}
            {tab==="chat-history"  && <ChatHistoryTab />}
            {tab==="settings"      && <SettingsTab form={form} setForm={setForm} onSave={handleSave} saved={saved} user={user} />}
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

function printTicket(p, curr) {
  const b      = p.booking;
  const extra  = b?.extra_data || {};
  const type   = extra.type || (b?.action === "book_hotel" ? "hotel" : b?.action === "book_guide" ? "guide" : "transport");
  const bkStatus  = b?.status || "pending";
  const isConfirmed = bkStatus === "confirmed";
  const isCancelled = bkStatus === "cancelled";
  const isRefunded  = p.status === "refunded";

  const fmtD = (d) => d ? new Date(d).toLocaleDateString("en-US",{weekday:"short",day:"numeric",month:"long",year:"numeric"}) : "—";
  const fmtAm = (usd) => { const v = usd * curr.rate; return `${curr.symbol}${v.toFixed(curr.rate > 50 ? 0 : 2)}`; };
  const nights = (extra.checkIn && extra.checkOut)
    ? Math.max(0, Math.round((new Date(extra.checkOut) - new Date(extra.checkIn)) / 86400000)) : null;
  const bookingRef = `NW-${String(b?.id || p.id).padStart(4,"0")}-${p.transaction_id?.slice(-4) || "XXXX"}`;
  const methodLabel = { visa:"Visa", mastercard:"Mastercard", esewa:"eSewa", khalti:"Khalti" };

  const statusText  = isRefunded ? "REFUNDED" : isCancelled ? "CANCELLED" : isConfirmed ? "CONFIRMED" : "PENDING APPROVAL";
  const statusColor = isRefunded ? "#6b7280" : isCancelled ? "#dc2626" : isConfirmed ? "#059669" : "#d97706";
  const headerBg    = isRefunded ? "#374151" : isCancelled ? "#7f1d1d" : isConfirmed ? "#064e3b" : "#1a0533";
  const typeLabel   = type === "hotel" ? "Hotel Booking" : type === "guide" ? "Guide Booking" : "Transport Booking";
  const typeEmoji   = type === "hotel" ? "🏨" : type === "guide" ? "👤" : "🚌";

  const row = (label, value) => value ? `
    <tr>
      <td style="padding:7px 0;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;white-space:nowrap;padding-right:24px;">${label}</td>
      <td style="padding:7px 0;color:#111827;font-size:13px;font-weight:600;">${value}</td>
    </tr>` : "";

  const section = (title, rows) => `
    <div style="margin-bottom:18px;">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#9ca3af;margin-bottom:10px;padding-bottom:6px;border-bottom:1px dashed #e5e7eb;">${title}</div>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
    </div>`;

  // Build date/duration block
  let dateBlock = "";
  if (type === "hotel" && extra.checkIn) {
    dateBlock = `
      <div style="display:flex;gap:0;margin-bottom:18px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <div style="flex:1;padding:14px 18px;background:#f9fafb;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:4px;">Check-In</div>
          <div style="font-size:13px;font-weight:700;color:#111827;">${fmtD(extra.checkIn)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">From 14:00 (2:00 PM)</div>
        </div>
        <div style="width:1px;background:#e5e7eb;"></div>
        <div style="width:90px;padding:14px 8px;background:#fef3c7;text-align:center;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#92400e;margin-bottom:4px;">Nights</div>
          <div style="font-size:28px;font-weight:900;color:#d97706;line-height:1;">${nights ?? "—"}</div>
          <div style="font-size:10px;color:#92400e;font-weight:700;">${nights === 1 ? "Night" : "Nights"}</div>
        </div>
        <div style="width:1px;background:#e5e7eb;"></div>
        <div style="flex:1;padding:14px 18px;background:#f9fafb;text-align:right;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:4px;">Check-Out</div>
          <div style="font-size:13px;font-weight:700;color:#111827;">${fmtD(extra.checkOut)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">Until 12:00 (12:00 PM)</div>
        </div>
      </div>`;
  } else if (type === "guide") {
    dateBlock = `
      <div style="display:flex;gap:0;margin-bottom:18px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <div style="flex:1;padding:14px 18px;background:#f9fafb;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:4px;">Tour Start Date</div>
          <div style="font-size:13px;font-weight:700;color:#111827;">${fmtD(extra.checkIn)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;">Meeting time: 08:00 AM</div>
        </div>
        <div style="width:1px;background:#e5e7eb;"></div>
        <div style="width:90px;padding:14px 8px;background:#f5f3ff;text-align:center;">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#5b21b6;margin-bottom:4px;">Duration</div>
          <div style="font-size:28px;font-weight:900;color:#7c3aed;line-height:1;">${extra.days || "—"}</div>
          <div style="font-size:10px;color:#5b21b6;font-weight:700;">${extra.days === 1 ? "Day" : "Days"}</div>
        </div>
      </div>`;
  } else if (type === "transport" && extra.checkIn) {
    dateBlock = `
      <div style="margin-bottom:18px;padding:14px 18px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;">
        <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:4px;">Departure Date</div>
        <div style="font-size:13px;font-weight:700;color:#111827;">${fmtD(extra.checkIn)}</div>
      </div>`;
  }

  const guestRows = [
    row("Guest Name", extra.fullName),
    row("Email", extra.email),
    row("Phone", extra.phone),
    type === "hotel" ? row("Rooms", extra.rooms ? `${extra.rooms} Room${extra.rooms > 1 ? "s" : ""}` : "") : "",
    (type === "hotel" || type === "guide") ? row("Guests", extra.guests ? `${extra.guests} Guest${extra.guests > 1 ? "s" : ""}` : "") : "",
    type === "transport" ? row("Passengers", extra.guests || "") : "",
    extra.requests ? row("Special Requests", `<em>${extra.requests}</em>`) : "",
  ].join("");

  const payRows = [
    row("Payment Method", `${methodLabel[p.method] || p.method?.toUpperCase()}${extra.card_last4 ? " ····" + extra.card_last4 : ""}${extra.mobile ? " " + extra.mobile : ""}`),
    row("Amount Paid", `<strong style="color:#059669;font-size:15px;">${fmtAm(p.amount)}</strong>`),
    row("Transaction ID", `<code style="font-size:12px;background:#f3f4f6;padding:2px 6px;border-radius:4px;">${p.transaction_id}</code>`),
    row("Payment Status", `<span style="color:${statusColor};font-weight:800;">${p.status?.toUpperCase()}</span>`),
    row("Booked On", `${new Date(p.created_at).toLocaleDateString("en-US",{day:"numeric",month:"long",year:"numeric"})} at ${new Date(p.created_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}`),
  ].join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Booking Confirmation – ${b?.item_name || "NepalWander"}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    @page{size:A4;margin:15mm 15mm;}
    @media print{
      body{background:#fff;}
      .no-print{display:none!important;}
      .ticket{box-shadow:none!important;border:1px solid #e5e7eb!important;}
    }
    .print-btn{position:fixed;top:16px;right:16px;padding:10px 22px;background:#1a0533;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px;}
    .ticket{max-width:680px;margin:24px auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.12);overflow:hidden;}
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Print / Save PDF</button>

  <div class="ticket">

    <!-- HEADER -->
    <div style="background:${headerBg};padding:24px 28px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:20px;">${typeEmoji}</span>
            <span style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;">${typeLabel} · NepalWander</span>
          </div>
          <h1 style="color:#fff;font-size:22px;font-weight:900;line-height:1.2;margin-bottom:6px;">${b?.item_name || "Booking"}</h1>
          <div style="color:rgba(255,255,255,0.5);font-size:11px;font-weight:600;">Booking Ref: <strong style="color:rgba(255,255,255,0.85);letter-spacing:1px;">${bookingRef}</strong></div>
        </div>
        <div style="text-align:right;">
          <div style="color:#fff;font-size:26px;font-weight:900;line-height:1;margin-bottom:8px;">${fmtAm(p.amount)}</div>
          <div style="display:inline-block;padding:4px 14px;border-radius:99px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;font-size:11px;font-weight:800;letter-spacing:0.8px;">${statusText}</div>
        </div>
      </div>
    </div>

    <!-- BODY -->
    <div style="padding:24px 28px;">

      ${dateBlock}

      ${section("Guest Details", guestRows)}
      ${section("Payment Details", payRows)}

    </div>

    <!-- FOOTER -->
    <div style="border-top:2px dashed #e5e7eb;margin:0 28px;padding:14px 0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;">🏔️</span>
        <div>
          <div style="font-size:12px;font-weight:800;color:#374151;">NepalWander</div>
          <div style="font-size:10px;color:#9ca3af;">Official Booking Confirmation · Nepal Tourism</div>
        </div>
      </div>
      <div style="font-size:10px;color:#9ca3af;text-align:right;">
        Printed: ${new Date().toLocaleString("en-US",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}<br/>
        This document serves as your official booking confirmation.
      </div>
    </div>

  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=780,height=900");
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

function TicketsTab({ payments }) {
  const { lang } = useLang();
  const curr = LANG_CURRENCY[lang] || LANG_CURRENCY.en;
  const booked = payments.filter(p => p.booking && ["book_hotel","book_guide","book_transport"].includes(p.booking?.action));

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { weekday:"short", day:"numeric", month:"short", year:"numeric" }) : null;
  const methodLabel = { visa:"Visa", mastercard:"Mastercard", esewa:"eSewa", khalti:"Khalti" };
  const methodIcon  = { visa:"fa-cc-visa", mastercard:"fa-cc-mastercard", esewa:"fa-wallet", khalti:"fa-wallet" };

  if (booked.length === 0) return (
    <div className="clay-card" style={{ padding:60, textAlign:"center" }}>
      <EmptyState icon="🎫" msg="No booking tickets yet. Book a hotel, guide or transport to see your tickets here." cta="Explore Hotels" onCta={() => {}} />
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {booked.map(p => {
        const b      = p.booking;
        const extra  = b?.extra_data || {};
        const type   = extra.type || (b?.action === "book_hotel" ? "hotel" : b?.action === "book_guide" ? "guide" : "transport");
        const bkStatus = b?.status || "pending";   // booking status from admin
        const payStatus = p.status;                // payment status

        const isConfirmed = bkStatus === "confirmed";
        const isCancelled = bkStatus === "cancelled";
        const isRefunded  = payStatus === "refunded";
        const isPending   = bkStatus === "pending" && !isRefunded;

        // Header gradient and status colour per booking status
        const headerGrad = isRefunded   ? "linear-gradient(135deg,#374151,#6b7280)"
                         : isCancelled  ? "linear-gradient(135deg,#7f1d1d,#dc2626)"
                         : isConfirmed  ? "linear-gradient(135deg,#064e3b,#059669)"
                         :               "linear-gradient(135deg,#1a0533,#302b63)";

        const statusBadge = isRefunded  ? { label:"REFUNDED",  bg:"rgba(107,114,128,0.35)", col:"#d1d5db" }
                          : isCancelled ? { label:"CANCELLED",  bg:"rgba(220,38,38,0.25)",   col:"#fca5a5" }
                          : isConfirmed ? { label:"CONFIRMED ✓", bg:"rgba(6,214,160,0.25)",  col:"#6ee7b7" }
                          :               { label:"PENDING APPROVAL", bg:"rgba(251,191,36,0.25)", col:"#fcd34d" };

        const nights = (extra.checkIn && extra.checkOut)
          ? Math.max(0, Math.round((new Date(extra.checkOut) - new Date(extra.checkIn)) / 86400000))
          : null;

        const bookingRef = `NW-${String(b?.id || p.id).padStart(4,"0")}-${p.transaction_id?.slice(-4) || "XXXX"}`;

        // Section divider (dashed perforation)
        const Divider = () => (
          <div style={{ position:"relative", margin:"0 0" }}>
            <div style={{ borderTop:"2px dashed rgba(0,0,0,0.1)", margin:"0 28px" }} />
            <div style={{ position:"absolute", left:-12, top:-10, width:22, height:22, borderRadius:"50%", background:"var(--bg2)", border:"2px dashed rgba(0,0,0,0.1)" }} />
            <div style={{ position:"absolute", right:-12, top:-10, width:22, height:22, borderRadius:"50%", background:"var(--bg2)", border:"2px dashed rgba(0,0,0,0.1)" }} />
          </div>
        );

        // Reusable field cell
        const Field = ({ label, value, wide }) => value != null && value !== "" ? (
          <div style={{ gridColumn: wide ? "span 2" : "span 1" }}>
            <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>{label}</div>
            <div style={{ fontWeight:700, color:"var(--text)", fontSize:"0.88rem", lineHeight:1.4 }}>{value}</div>
          </div>
        ) : null;

        return (
          <div key={p.id} style={{
            borderRadius:20, overflow:"visible", border:"var(--clay-border)",
            boxShadow:"var(--clay-shadow-lg)", background:"var(--card-bg)",
            opacity: isCancelled || isRefunded ? 0.8 : 1,
          }}>

            {/* ── HEADER ── */}
            <div style={{ background:headerGrad, padding:"22px 28px", borderRadius:"20px 20px 0 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:"1.2rem" }}>{type==="hotel"?"🏨":type==="guide"?"👤":"🚌"}</span>
                  <span style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.7rem", fontWeight:800, textTransform:"uppercase", letterSpacing:1.5 }}>
                    {type==="hotel"?"Hotel Booking":type==="guide"?"Guide Booking":"Transport Booking"} · NepalWander
                  </span>
                </div>
                <h4 style={{ color:"#fff", fontWeight:900, margin:0, fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", lineHeight:1.2 }}>
                  {b?.item_name || "Booking"}
                </h4>
                <div style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.72rem", fontWeight:600, marginTop:5 }}>
                  Ref: {bookingRef}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ color:"#fff", fontWeight:900, fontSize:"1.6rem", lineHeight:1, marginBottom:6 }}>
                  {fmtAmt(p.amount, curr)}
                </div>
                <span style={{ fontSize:"0.68rem", fontWeight:900, padding:"4px 12px", borderRadius:99,
                  background:statusBadge.bg, color:statusBadge.col, border:"1px solid currentColor", letterSpacing:0.5 }}>
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* ── DATES / DURATION ── */}
            {type === "hotel" && extra.checkIn && (
              <>
                <div style={{ padding:"18px 28px", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, background:"var(--bg3)" }}>
                  <div>
                    <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Check-In</div>
                    <div style={{ fontWeight:800, color:"var(--text)", fontSize:"0.95rem" }}>{fmtDate(extra.checkIn)}</div>
                    <div style={{ fontSize:"0.75rem", color:"var(--text3)", fontWeight:600, marginTop:2 }}>From 14:00 (2:00 PM)</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Duration</div>
                    <div style={{ fontWeight:900, fontSize:"2rem", color:"var(--clay-red)", lineHeight:1 }}>{nights ?? "—"}</div>
                    <div style={{ fontSize:"0.72rem", color:"var(--text3)", fontWeight:700 }}>{nights === 1 ? "Night" : "Nights"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Check-Out</div>
                    <div style={{ fontWeight:800, color:"var(--text)", fontSize:"0.95rem" }}>{fmtDate(extra.checkOut)}</div>
                    <div style={{ fontSize:"0.75rem", color:"var(--text3)", fontWeight:600, marginTop:2 }}>Until 12:00 (12:00 PM)</div>
                  </div>
                </div>
                <Divider />
              </>
            )}

            {type === "guide" && (extra.checkIn || extra.days) && (
              <>
                <div style={{ padding:"18px 28px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, background:"var(--bg3)" }}>
                  <div>
                    <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Tour Start Date</div>
                    <div style={{ fontWeight:800, color:"var(--text)", fontSize:"0.95rem" }}>{fmtDate(extra.checkIn) || "—"}</div>
                    <div style={{ fontSize:"0.75rem", color:"var(--text3)", fontWeight:600, marginTop:2 }}>Meeting time: 08:00 AM</div>
                  </div>
                  <div>
                    <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Duration</div>
                    <div style={{ fontWeight:900, fontSize:"1.6rem", color:"var(--clay-purple)", lineHeight:1 }}>{extra.days || "—"}</div>
                    <div style={{ fontSize:"0.72rem", color:"var(--text3)", fontWeight:700 }}>{extra.days === 1 ? "Day" : "Days"}</div>
                  </div>
                </div>
                <Divider />
              </>
            )}

            {type === "transport" && extra.checkIn && (
              <>
                <div style={{ padding:"18px 28px", background:"var(--bg3)" }}>
                  <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Departure Date</div>
                  <div style={{ fontWeight:800, color:"var(--text)", fontSize:"0.95rem" }}>{fmtDate(extra.checkIn)}</div>
                </div>
                <Divider />
              </>
            )}

            {/* ── GUEST & BOOKING DETAILS ── */}
            <div style={{ padding:"18px 28px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:14 }}>
              <Field label="Guest Name"  value={extra.fullName} />
              <Field label="Email"       value={extra.email} />
              <Field label="Phone"       value={extra.phone} />
              {type === "hotel" && <Field label="Rooms"  value={extra.rooms ? `${extra.rooms} Room${extra.rooms > 1 ? "s" : ""}` : null} />}
              {type === "hotel" && <Field label="Guests" value={extra.guests ? `${extra.guests} Guest${extra.guests > 1 ? "s" : ""}` : null} />}
              {type === "guide" && <Field label="Guests" value={extra.guests ? `${extra.guests} Person${extra.guests > 1 ? "s" : ""}` : null} />}
              {type === "transport" && <Field label="Passengers" value={extra.guests ? `${extra.guests}` : null} />}
            </div>

            {extra.requests && extra.requests.trim() && (
              <>
                <Divider />
                <div style={{ padding:"14px 28px" }}>
                  <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:4 }}>Special Requests</div>
                  <div style={{ fontSize:"0.85rem", color:"var(--text2)", fontWeight:600, fontStyle:"italic" }}>{extra.requests}</div>
                </div>
              </>
            )}

            {/* ── PAYMENT ── */}
            <Divider />
            <div style={{ padding:"16px 28px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:14 }}>
              <div>
                <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Payment Method</div>
                <div style={{ fontWeight:700, color:"var(--text)", fontSize:"0.88rem", display:"flex", alignItems:"center", gap:6 }}>
                  <i className={`fab ${methodIcon[p.method] || "fa-credit-card"}`} />
                  {methodLabel[p.method] || p.method?.toUpperCase()}
                  {extra.card_last4 && <span style={{ color:"var(--text3)", fontSize:"0.8rem" }}> ····{extra.card_last4}</span>}
                  {extra.mobile && <span style={{ color:"var(--text3)", fontSize:"0.8rem" }}> {extra.mobile}</span>}
                </div>
              </div>
              <div>
                <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Amount Paid</div>
                <div style={{ fontWeight:800, color:"var(--clay-green)", fontSize:"1rem" }}>{fmtAmt(p.amount, curr)}</div>
              </div>
              <div>
                <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Transaction ID</div>
                <div style={{ fontWeight:700, color:"var(--text)", fontSize:"0.8rem", fontFamily:"monospace" }}>{p.transaction_id}</div>
              </div>
              <div>
                <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:0.8, color:"var(--text4)", marginBottom:3 }}>Booked On</div>
                <div style={{ fontWeight:700, color:"var(--text)", fontSize:"0.88rem" }}>
                  {new Date(p.created_at).toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"})}
                  <span style={{ display:"block", fontSize:"0.75rem", color:"var(--text3)", fontWeight:600 }}>
                    {new Date(p.created_at).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
                  </span>
                </div>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{ borderTop:"2px dashed rgba(0,0,0,0.08)", margin:"0 28px", padding:"14px 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:"1.1rem" }}>🏔️</span>
                <span style={{ fontSize:"0.72rem", color:"var(--text3)", fontWeight:700 }}>NepalWander · Official Booking Confirmation</span>
              </div>
              {isRefunded ? (
                <span style={{ fontSize:"0.75rem", color:"#9ca3af", fontWeight:700, padding:"5px 14px", borderRadius:99, background:"rgba(107,114,128,0.1)", border:"1px solid rgba(107,114,128,0.3)" }}>
                  ↩️ Refunded — Ticket Void
                </span>
              ) : isCancelled ? (
                <span style={{ fontSize:"0.75rem", color:"#fca5a5", fontWeight:700, padding:"5px 14px", borderRadius:99, background:"rgba(220,38,38,0.1)", border:"1px solid rgba(220,38,38,0.3)" }}>
                  ❌ Cancelled — Ticket Void
                </span>
              ) : isPending ? (
                <span style={{ fontSize:"0.75rem", color:"#d97706", fontWeight:700, padding:"5px 14px", borderRadius:99, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)" }}>
                  ⏳ Awaiting Admin Approval
                </span>
              ) : (
                <button onClick={() => printTicket(p, curr)} className="clay-btn clay-btn-outline clay-btn-sm">
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

function ChatHistoryTab() {
  const [sessions, setSessions] = useState(() =>
    JSON.parse(localStorage.getItem("nw-voice-history") || "[]")
  );
  const [open, setOpen] = useState(null);

  const deleteSession = (i) => {
    const updated = sessions.filter((_, idx) => idx !== i);
    setSessions(updated);
    localStorage.setItem("nw-voice-history", JSON.stringify(updated));
    if (open === i) setOpen(null);
  };

  const clearAll = () => {
    setSessions([]);
    localStorage.removeItem("nw-voice-history");
    setOpen(null);
  };

  if (!sessions.length) return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:"3rem", marginBottom:16 }}>🎙️</div>
      <div style={{ fontFamily:"Poppins,sans-serif", fontWeight:700, fontSize:"1.1rem", color:"var(--text)", marginBottom:8 }}>No voice chats yet</div>
      <div style={{ color:"var(--text3)", fontSize:"0.9rem" }}>Start a voice conversation — it will be saved here automatically.</div>
    </div>
  );

  return (
    <div style={{ padding:"24px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <div style={{ fontFamily:"Poppins,sans-serif", fontWeight:700, fontSize:"1.1rem", color:"var(--text)" }}>
          🎙️ Voice Chat History <span style={{ fontSize:"0.8rem", color:"var(--text4)", fontWeight:500 }}>({sessions.length} sessions)</span>
        </div>
        <button onClick={clearAll} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(193,18,31,0.3)", background:"rgba(193,18,31,0.07)", color:"var(--nepal-red)", fontWeight:700, fontSize:"0.78rem", cursor:"pointer" }}>
          Clear All
        </button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {sessions.map((s, i) => {
          const d = new Date(s.date);
          const label = d.toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour:"2-digit", minute:"2-digit" });
          const preview = s.messages[0]?.text?.slice(0, 80) || "Voice session";
          return (
            <div key={i} style={{ background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:14, overflow:"hidden" }}>
              <div
                onClick={() => setOpen(open === i ? null : i)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", cursor:"pointer" }}
              >
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"0.78rem", color:"var(--text4)", fontWeight:600, marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:"0.88rem", color:"var(--text)", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{preview}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, marginLeft:12 }}>
                  <span style={{ fontSize:"0.72rem", color:"var(--text4)" }}>{s.messages.length} msgs</span>
                  <button onClick={e => { e.stopPropagation(); deleteSession(i); }} style={{ width:26, height:26, borderRadius:"50%", border:"1px solid rgba(193,18,31,0.25)", background:"rgba(193,18,31,0.06)", color:"var(--nepal-red)", cursor:"pointer", fontSize:"0.75rem", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                  <span style={{ color:"var(--text4)", fontSize:"0.8rem" }}>{open === i ? "▲" : "▼"}</span>
                </div>
              </div>
              {open === i && (
                <div style={{ borderTop:"1px solid var(--card-border)", padding:"12px 18px", display:"flex", flexDirection:"column", gap:8, maxHeight:320, overflowY:"auto" }}>
                  {s.messages.map((m, j) => (
                    <div key={j} style={{ display:"flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth:"80%", padding:"7px 12px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: m.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "var(--bg2)",
                        color: m.role === "user" ? "#fff" : "var(--text)",
                        fontSize:"0.85rem", lineHeight:1.55,
                        border: m.role === "ai" ? "1px solid var(--card-border)" : "none",
                      }}>
                        <span style={{ fontSize:"0.7rem", opacity:0.6, display:"block", marginBottom:2 }}>{m.role === "ai" ? "🤖 AI" : "🧑 You"}</span>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
