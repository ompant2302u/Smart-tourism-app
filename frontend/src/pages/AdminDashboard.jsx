import { useState, useEffect } from "react";
import { api } from "../api";

const TABS = ["overview","bookings","payments","reviews","favourites","subscribers","refunds","users","activity"];
const tabIcons = { overview:"fa-chart-bar", bookings:"fa-calendar-check", payments:"fa-dollar-sign", reviews:"fa-star", favourites:"fa-heart", subscribers:"fa-envelope", refunds:"fa-undo", users:"fa-users", activity:"fa-history" };

function StatBox({ icon, label, value, grad, sub }) {
  return (
    <div className="clay-card" style={{ padding:24, background:grad||"var(--card-bg)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:"0.75rem", fontWeight:800, textTransform:"uppercase", letterSpacing:1, color:"rgba(255,255,255,0.7)", marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:"2rem", fontWeight:900, color:"#fff", fontFamily:"'Playfair Display',serif" }}>{value ?? "—"}</div>
          {sub && <div style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.6)", fontWeight:600, marginTop:4 }}>{sub}</div>}
        </div>
        <div style={{ width:48, height:48, borderRadius:14, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid rgba(255,255,255,0.2)" }}>
          <i className={`fas ${icon}`} style={{ color:"#fff", fontSize:"1.2rem" }}></i>
        </div>
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  const map = { green:["rgba(6,214,160,0.12)","var(--clay-green)"], red:["rgba(232,72,85,0.12)","var(--clay-red)"], gold:["rgba(255,209,102,0.2)","#b8860b"], blue:["rgba(67,97,238,0.12)","var(--clay-blue)"], purple:["rgba(114,9,183,0.12)","var(--clay-purple)"] };
  const [bg, text] = map[color] || map.blue;
  return <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:99, fontSize:"0.7rem", fontWeight:800, background:bg, color:text, border:"1px solid currentColor" }}>{children}</span>;
}

export default function AdminDashboard({ navigate, user }) {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refundNote, setRefundNote] = useState({});
  const [initialTab, setInitialTab] = useState(null);

  useEffect(() => {
    if (!user?.isAdmin) { navigate("home"); return; }
    Promise.all([
      api.stats().catch(() => ({})),
      api.adminBookingLogs().catch(() => []),
      api.adminPayments().catch(() => []),
      api.adminRefunds().catch(() => []),
      api.adminUserActivity().catch(() => []),
    ]).then(([s, b, p, r, u]) => {
      setStats(s);
      setBookings(Array.isArray(b) ? b : []);
      setPayments(Array.isArray(p) ? p : []);
      setRefunds(Array.isArray(r) ? r : []);
      setAllUsers(Array.isArray(u) ? u : []);
    }).finally(() => setLoading(false));
  }, [user]);

  const loadUserDetail = async (uid) => {
    setSelectedUser(uid);
    setUserDetail(null);
    const d = await api.adminUserActivity(uid).catch(() => null);
    setUserDetail(d);
  };

  const handleRefundAction = async (id, status) => {
    await api.adminUpdateRefund(id, { status, admin_note: refundNote[id] || "" }).catch(() => {});
    setRefunds(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  if (!user?.isAdmin) return null;

  const actionColor = { book_hotel:"blue", book_guide:"purple", book_transport:"green", subscribe:"gold", contact:"red", save_dest:"blue" };
  const statusColor = { confirmed:"green", pending:"gold", cancelled:"red", refunded:"blue", completed:"green", requested:"gold", approved:"blue", processed:"green", rejected:"red" };

  const bookingLogs = bookings.filter(b => ["book_hotel","book_guide","book_transport"].includes(b.action));
  const reviews = bookings.filter(b => b.action === "save_dest" && b.extra_data?.review_id);
  const subscribers = bookings.filter(b => b.action === "subscribe");
  const contacts = bookings.filter(b => b.action === "contact");
  const favs = bookings.filter(b => b.action === "save_dest" && !b.extra_data?.review_id);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f0c29,#302b63)", padding:"60px 0 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.05, background:"url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=60') center/cover" }}></div>
        <div className="container" style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32, flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.8rem", fontWeight:800, textTransform:"uppercase", letterSpacing:2, marginBottom:6 }}>Tour Tech Admin</div>
              <h1 style={{ color:"#fff", fontWeight:900, fontFamily:"'Playfair Display',serif", margin:0, fontSize:"2rem" }}>Dashboard</h1>
            </div>
            <button className="clay-btn clay-btn-outline" style={{ color:"#fff", borderColor:"rgba(255,255,255,0.3)" }} onClick={() => navigate("home")}>
              <i className="fas fa-arrow-left"></i> Back to Site
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16, paddingBottom:40 }}>
            <div onClick={() => setTab("users")} style={{ cursor:"pointer" }}><StatBox icon="fa-users" label="Total Users" value={stats.users} grad="linear-gradient(135deg,#4361ee,#7c3aed)" /></div>
            <div onClick={() => setTab("bookings")} style={{ cursor:"pointer" }}><StatBox icon="fa-calendar-check" label="Bookings" value={bookingLogs.length} grad="linear-gradient(135deg,#e84855,#991b1b)" /></div>
            <div onClick={() => setTab("payments")} style={{ cursor:"pointer" }}><StatBox icon="fa-dollar-sign" label="Revenue" value={stats.total_revenue ? `$${stats.total_revenue}` : "$0"} grad="linear-gradient(135deg,#06d6a0,#059669)" /></div>
            <div onClick={() => setTab("reviews")} style={{ cursor:"pointer" }}><StatBox icon="fa-star" label="Reviews" value={stats.reviews} grad="linear-gradient(135deg,#f59e0b,#d97706)" /></div>
            <div onClick={() => setTab("favourites")} style={{ cursor:"pointer" }}><StatBox icon="fa-heart" label="Favourites" value={stats.favorites} grad="linear-gradient(135deg,#ec4899,#be185d)" /></div>
            <div onClick={() => setTab("subscribers")} style={{ cursor:"pointer" }}><StatBox icon="fa-envelope" label="Subscribers" value={stats.newsletter_subscribers} grad="linear-gradient(135deg,#3b82f6,#1d4ed8)" /></div>
            <div onClick={() => setTab("refunds")} style={{ cursor:"pointer" }}><StatBox icon="fa-undo" label="Pending Refunds" value={stats.pending_refunds} grad="linear-gradient(135deg,#8b5cf6,#6d28d9)" sub="Needs review" /></div>
            <div onClick={() => setTab("activity")} style={{ cursor:"pointer" }}><StatBox icon="fa-map-marked-alt" label="Destinations" value={stats.destinations} grad="linear-gradient(135deg,#14b8a6,#0f766e)" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"var(--card-bg)", borderBottom:"var(--clay-border)", boxShadow:"0 4px 20px rgba(0,0,0,0.06)", position:"sticky", top:70, zIndex:100 }}>
        <div className="container">
          <div style={{ display:"flex", gap:4, overflowX:"auto", padding:"8px 0", scrollbarWidth:"none" }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 18px", borderRadius:14, border:"none",
                  background: tab===t?"linear-gradient(135deg,var(--clay-red),var(--clay-red2))":"transparent",
                  color: tab===t?"#fff":"var(--text3)", fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:"0.88rem",
                  cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.2s",
                  boxShadow: tab===t?"4px 4px 0px rgba(232,72,85,0.3)":"none",
                  transform: tab===t?"translateY(-2px)":"none" }}>
                <i className={`fas ${tabIcons[t]}`}></i>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding:"40px 24px 80px" }}>
        {loading ? <div style={{ textAlign:"center", padding:80 }}><div className="loader-spinner" style={{ margin:"0 auto" }}></div></div> : (
          <>
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div>
                <h4 style={{ fontWeight:800, color:"var(--text)", marginBottom:24 }}>Recent Activity</h4>
                <div className="clay-card" style={{ padding:0, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"linear-gradient(135deg,#1a0533,#0d1117)" }}>
                      {["Action","User/Email","Item","Amount","Status","Date"].map(h => (
                        <th key={h} style={{ padding:"12px 16px", color:"rgba(255,255,255,0.8)", fontWeight:800, fontSize:"0.78rem", textAlign:"left", letterSpacing:0.5 }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {bookings.slice(0,20).map((b,i) => (
                        <tr key={b.id} style={{ borderBottom:"1px solid var(--bg2)", background: i%2===0?"var(--card-bg)":"var(--bg2)" }}>
                          <td style={{ padding:"12px 16px" }}><Badge color={actionColor[b.action]||"blue"}>{b.action?.replace("_"," ")}</Badge></td>
                          <td style={{ padding:"12px 16px", fontWeight:600, fontSize:"0.85rem", color:"var(--text2)" }}>{b.user?.username || b.email || "—"}</td>
                          <td style={{ padding:"12px 16px", fontWeight:600, fontSize:"0.85rem", color:"var(--text)" }}>{b.item_name?.slice(0,40) || "—"}</td>
                          <td style={{ padding:"12px 16px", fontWeight:800, color:"var(--clay-green)" }}>{b.amount > 0 ? `$${b.amount}` : "—"}</td>
                          <td style={{ padding:"12px 16px" }}><Badge color={statusColor[b.status]||"gold"}>{b.status}</Badge></td>
                          <td style={{ padding:"12px 16px", fontSize:"0.78rem", color:"var(--text3)", fontWeight:600 }}>{new Date(b.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BOOKINGS */}
            {tab === "bookings" && (
              <div>
                <h4 style={{ fontWeight:800, color:"var(--text)", marginBottom:24 }}>Booking Logs ({bookingLogs.length})</h4>
                <div className="clay-card" style={{ padding:0, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"linear-gradient(135deg,#1a0533,#0d1117)" }}>
                      {["Type","User","Item","Amount","Payment","Status","IP","Date"].map(h => (
                        <th key={h} style={{ padding:"12px 16px", color:"rgba(255,255,255,0.8)", fontWeight:800, fontSize:"0.78rem", textAlign:"left" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {bookingLogs.map((b,i) => (
                        <tr key={b.id} style={{ borderBottom:"1px solid var(--bg2)", background: i%2===0?"var(--card-bg)":"var(--bg2)" }}>
                          <td style={{ padding:"12px 16px" }}><Badge color={actionColor[b.action]||"blue"}>{b.action?.replace("book_","")}</Badge></td>
                          <td style={{ padding:"12px 16px", fontWeight:600, fontSize:"0.85rem", color:"var(--text2)" }}>{b.user?.username || b.email || "—"}</td>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"var(--text)", fontSize:"0.85rem" }}>{b.item_name?.slice(0,35) || "—"}</td>
                          <td style={{ padding:"12px 16px", fontWeight:800, color:"var(--clay-green)" }}>${b.amount}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.82rem", color:"var(--text3)", fontWeight:600 }}>{b.payment_method?.toUpperCase() || "—"}</td>
                          <td style={{ padding:"12px 16px" }}><Badge color={statusColor[b.status]||"gold"}>{b.status}</Badge></td>
                          <td style={{ padding:"12px 16px", fontSize:"0.75rem", color:"var(--text4)" }}>{b.ip_address || "—"}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.78rem", color:"var(--text3)" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PAYMENTS */}
            {tab === "payments" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                  <h4 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>Payments ({payments.length})</h4>
                  <div style={{ fontWeight:800, color:"var(--clay-green)", fontSize:"1.1rem" }}>
                    Total Revenue: ${payments.filter(p=>p.status==="completed").reduce((s,p)=>s+p.amount,0).toFixed(2)}
                  </div>
                </div>
                <div className="clay-card" style={{ padding:0, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"linear-gradient(135deg,#1a0533,#0d1117)" }}>
                      {["User","Item","Method","Amount","Currency","TXN ID","Status","Date"].map(h => (
                        <th key={h} style={{ padding:"12px 16px", color:"rgba(255,255,255,0.8)", fontWeight:800, fontSize:"0.78rem", textAlign:"left" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {payments.map((p,i) => (
                        <tr key={p.id} style={{ borderBottom:"1px solid var(--bg2)", background: i%2===0?"var(--card-bg)":"var(--bg2)" }}>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"var(--text2)", fontSize:"0.85rem" }}>{p.user?.username || "—"}</td>
                          <td style={{ padding:"12px 16px", fontWeight:600, color:"var(--text)", fontSize:"0.85rem" }}>{p.booking?.item_name?.slice(0,30) || "—"}</td>
                          <td style={{ padding:"12px 16px" }}><Badge color="blue">{p.method?.toUpperCase()}</Badge></td>
                          <td style={{ padding:"12px 16px", fontWeight:900, color:"var(--clay-green)" }}>${p.amount}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.82rem", color:"var(--text3)" }}>{p.currency}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.75rem", color:"var(--text4)", fontFamily:"monospace" }}>{p.transaction_id}</td>
                          <td style={{ padding:"12px 16px" }}><Badge color={statusColor[p.status]||"gold"}>{p.status}</Badge></td>
                          <td style={{ padding:"12px 16px", fontSize:"0.78rem", color:"var(--text3)" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REVIEWS */}
            {tab === "reviews" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                  <h4 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>Reviews ({reviews.length})</h4>
                  <a href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/admin/api/review/`} target="_blank" rel="noopener noreferrer" className="clay-btn clay-btn-sm" style={{ background:"linear-gradient(135deg,#f59e0b,#d97706)", color:"#fff", border:"none", textDecoration:"none" }}>
                    <i className="fas fa-external-link-alt"></i> Manage in Admin Panel
                  </a>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {reviews.length === 0 ? <div className="clay-card" style={{ padding:40, textAlign:"center", color:"var(--text3)" }}>No reviews logged yet.</div> :
                    reviews.map((r,i) => (
                      <div key={i} className="clay-card" style={{ padding:20 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                          <div>
                            <span style={{ fontWeight:800, color:"var(--text)" }}>{r.user?.username || r.email}</span>
                            <span style={{ color:"var(--text3)", fontSize:"0.82rem", fontWeight:600, marginLeft:12 }}>{r.item_name?.slice(0,60)}</span>
                          </div>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            {r.extra_data?.rating && <span style={{ color:"var(--clay-gold)" }}>{"★".repeat(r.extra_data.rating)}</span>}
                            <span style={{ fontSize:"0.78rem", color:"var(--text3)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* FAVOURITES */}
            {tab === "favourites" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                  <h4 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>Favourites ({favs.length})</h4>
                  <a href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/admin/api/favorite/`} target="_blank" rel="noopener noreferrer" className="clay-btn clay-btn-sm" style={{ background:"linear-gradient(135deg,#ec4899,#be185d)", color:"#fff", border:"none", textDecoration:"none" }}>
                    <i className="fas fa-external-link-alt"></i> Manage in Admin Panel
                  </a>
                </div>
                <div className="clay-card" style={{ padding:0, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"linear-gradient(135deg,#1a0533,#0d1117)" }}>
                      {["User","Item","Date"].map(h => <th key={h} style={{ padding:"12px 16px", color:"rgba(255,255,255,0.8)", fontWeight:800, fontSize:"0.78rem", textAlign:"left" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {favs.map((f,i) => (
                        <tr key={i} style={{ borderBottom:"1px solid var(--bg2)", background: i%2===0?"var(--card-bg)":"var(--bg2)" }}>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"var(--text2)" }}>{f.user?.username || f.email || "—"}</td>
                          <td style={{ padding:"12px 16px", fontWeight:600, color:"var(--text)" }}>{f.item_name?.slice(0,60) || "—"}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.78rem", color:"var(--text3)" }}>{new Date(f.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUBSCRIBERS */}
            {tab === "subscribers" && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                  <h4 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>Newsletter Subscribers ({subscribers.length})</h4>
                  <a href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/admin/api/newslettersubscriber/`} target="_blank" rel="noopener noreferrer" className="clay-btn clay-btn-sm" style={{ background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", color:"#fff", border:"none", textDecoration:"none" }}>
                    <i className="fas fa-external-link-alt"></i> Manage in Admin Panel
                  </a>
                </div>
                <div className="clay-card" style={{ padding:0, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"linear-gradient(135deg,#1a0533,#0d1117)" }}>
                      {["Email","IP Address","Date"].map(h => <th key={h} style={{ padding:"12px 16px", color:"rgba(255,255,255,0.8)", fontWeight:800, fontSize:"0.78rem", textAlign:"left" }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {subscribers.map((s,i) => (
                        <tr key={i} style={{ borderBottom:"1px solid var(--bg2)", background: i%2===0?"var(--card-bg)":"var(--bg2)" }}>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"var(--text)" }}>{s.email}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.82rem", color:"var(--text3)" }}>{s.ip_address || "—"}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.78rem", color:"var(--text3)" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* REFUNDS */}
            {tab === "refunds" && (
              <div>
                <h4 style={{ fontWeight:800, color:"var(--text)", marginBottom:24 }}>Refund Requests ({refunds.length})</h4>
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                  {refunds.length === 0 ? <div className="clay-card" style={{ padding:40, textAlign:"center", color:"var(--text3)" }}>No refund requests.</div> :
                    refunds.map(r => (
                      <div key={r.id} className="clay-card" style={{ padding:24 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:12 }}>
                          <div>
                            <div style={{ fontWeight:800, color:"var(--text)", marginBottom:4 }}>
                              Refund #{r.id} — <span style={{ color:"var(--clay-green)" }}>${r.amount}</span>
                            </div>
                            <div style={{ fontSize:"0.85rem", color:"var(--text2)", fontWeight:600 }}>User: {r.user?.username}</div>
                            <div style={{ fontSize:"0.82rem", color:"var(--text3)", marginTop:4 }}>Reason: {r.reason}</div>
                            {r.admin_note && <div style={{ fontSize:"0.78rem", color:"var(--clay-blue)", marginTop:4 }}>Note: {r.admin_note}</div>}
                          </div>
                          <Badge color={statusColor[r.status]||"gold"}>{r.status?.toUpperCase()}</Badge>
                        </div>
                        {r.status === "requested" && (
                          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                            <input className="clay-input" placeholder="Admin note (optional)" value={refundNote[r.id]||""} onChange={e => setRefundNote(n=>({...n,[r.id]:e.target.value}))} style={{ flex:1, minWidth:200, marginBottom:0, height:40 }} />
                            <button className="clay-btn clay-btn-green clay-btn-sm" onClick={() => handleRefundAction(r.id,"approved")}>✓ Approve</button>
                            <button className="clay-btn clay-btn-sm" style={{ background:"linear-gradient(135deg,#e84855,#991b1b)",color:"#fff",border:"none" }} onClick={() => handleRefundAction(r.id,"rejected")}>✕ Reject</button>
                            <button className="clay-btn clay-btn-blue clay-btn-sm" onClick={() => handleRefundAction(r.id,"processed")}>💸 Process</button>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* USERS */}
            {tab === "users" && (
              <div>
                <h4 style={{ fontWeight:800, color:"var(--text)", marginBottom:24 }}>Registered Users ({stats.users || 0})</h4>
                <div className="clay-card" style={{ padding:0, overflow:"hidden" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr style={{ background:"linear-gradient(135deg,#1a0533,#0d1117)" }}>
                      {["User","Email","Bookings","Revenue","Reviews","Favourites","Visits","Last Active",""].map(h => (
                        <th key={h} style={{ padding:"12px 16px", color:"rgba(255,255,255,0.8)", fontWeight:800, fontSize:"0.78rem", textAlign:"left" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {allUsers.map((u,i) => (
                        <tr key={i} style={{ borderBottom:"1px solid var(--bg2)", background: i%2===0?"var(--card-bg)":"var(--bg2)" }}>
                          <td style={{ padding:"12px 16px", fontWeight:800, color:"var(--text)" }}>{u.user?.username}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.82rem", color:"var(--text3)" }}>{u.user?.email}</td>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"var(--clay-blue)" }}>{u.booking_count}</td>
                          <td style={{ padding:"12px 16px", fontWeight:800, color:"var(--clay-green)" }}>${u.payment_total?.toFixed(2)}</td>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"var(--clay-gold)", cursor:"pointer", textDecoration:"underline dotted" }} onClick={() => { setTab("activity"); loadUserDetail(u.user?.id); }}>{u.review_count}</td>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"var(--clay-red)", cursor:"pointer", textDecoration:"underline dotted" }} onClick={() => { setTab("activity"); loadUserDetail(u.user?.id); }}>{u.favorite_count}</td>
                          <td style={{ padding:"12px 16px", fontWeight:700, color:"var(--clay-purple)", cursor:"pointer", textDecoration:"underline dotted" }} onClick={() => { setTab("activity"); loadUserDetail(u.user?.id); }}>{u.visit_count}</td>
                          <td style={{ padding:"12px 16px", fontSize:"0.75rem", color:"var(--text4)" }}>{u.last_active ? new Date(u.last_active).toLocaleDateString() : "—"}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <button className="clay-btn clay-btn-outline clay-btn-sm" onClick={() => { setTab("activity"); loadUserDetail(u.user?.id); }}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {tab === "activity" && (
              <div>
                <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:24, flexWrap:"wrap" }}>
                  <h4 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>User Activity Tracker</h4>
                  {selectedUser && (
                    <button className="clay-btn clay-btn-outline clay-btn-sm" onClick={() => { setSelectedUser(null); setUserDetail(null); }}>
                      ← All Users
                    </button>
                  )}
                </div>

                {!selectedUser ? (
                  <div className="clay-card" style={{ padding:24 }}>
                    <p style={{ color:"var(--text3)", fontWeight:600, marginBottom:20 }}>Select a user from the Users tab to view their full activity, or click below:</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
                      {allUsers.slice(0,20).map((u,i) => (
                        <button key={i} className="clay-card" style={{ padding:16, cursor:"pointer", border:"var(--clay-border)", background:"var(--bg3)", textAlign:"left" }}
                          onClick={() => loadUserDetail(u.user?.id)}>
                          <div style={{ fontWeight:800, color:"var(--text)", marginBottom:4 }}>{u.user?.username}</div>
                          <div style={{ fontSize:"0.78rem", color:"var(--text3)", fontWeight:600 }}>{u.booking_count} bookings · ${u.payment_total?.toFixed(2)} spent</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : !userDetail ? (
                  <div style={{ textAlign:"center", padding:60 }}><div className="loader-spinner" style={{ margin:"0 auto" }}></div></div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                    {/* User info */}
                    <div className="clay-card" style={{ padding:24, background:"linear-gradient(135deg,rgba(67,97,238,0.1),rgba(114,9,183,0.1))" }}>
                      <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                        <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,var(--clay-red),var(--clay-purple))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", fontWeight:900, color:"#fff" }}>
                          {userDetail.user?.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:900, fontSize:"1.2rem", color:"var(--text)" }}>{userDetail.user?.username}</div>
                          <div style={{ color:"var(--text3)", fontWeight:600 }}>{userDetail.user?.email}</div>
                        </div>
                        <div style={{ display:"flex", gap:16, marginLeft:"auto", flexWrap:"wrap" }}>
                          {[
                            { l:"Bookings", v: userDetail.bookings?.length, c:"var(--clay-blue)" },
                            { l:"Payments", v: userDetail.payments?.length, c:"var(--clay-green)" },
                            { l:"Reviews", v: userDetail.reviews?.length, c:"var(--clay-gold)" },
                            { l:"Favourites", v: userDetail.favorites?.length, c:"var(--clay-red)" },
                            { l:"Visits", v: userDetail.visit_history?.length, c:"var(--clay-purple)" },
                          ].map(s => (
                            <div key={s.l} style={{ textAlign:"center" }}>
                              <div style={{ fontWeight:900, fontSize:"1.4rem", color:s.c }}>{s.v}</div>
                              <div style={{ fontSize:"0.72rem", color:"var(--text3)", fontWeight:700 }}>{s.l}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bookings */}
                    {userDetail.bookings?.length > 0 && (
                      <div className="clay-card" style={{ padding:24 }}>
                        <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:16 }}>📋 Booking History</h5>
                        {userDetail.bookings.map((b,i) => (
                          <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px dashed rgba(0,0,0,0.06)", flexWrap:"wrap", gap:8 }}>
                            <div>
                              <Badge color={actionColor[b.action]||"blue"}>{b.action?.replace("_"," ")}</Badge>
                              <span style={{ marginLeft:10, fontWeight:700, color:"var(--text)", fontSize:"0.88rem" }}>{b.item_name?.slice(0,50)}</span>
                            </div>
                            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                              {b.amount > 0 && <span style={{ fontWeight:800, color:"var(--clay-green)" }}>${b.amount}</span>}
                              <Badge color={statusColor[b.status]||"gold"}>{b.status}</Badge>
                              <span style={{ fontSize:"0.75rem", color:"var(--text4)" }}>{new Date(b.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Visit History */}
                    {userDetail.visit_history?.length > 0 && (
                      <div className="clay-card" style={{ padding:24 }}>
                        <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:16 }}>🗺️ Visit History</h5>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                          {userDetail.visit_history.map((v,i) => (
                            <div key={i} style={{ padding:12, borderRadius:14, background:"var(--bg3)", border:"var(--clay-border)" }}>
                              <div style={{ fontWeight:700, color:"var(--text)", fontSize:"0.85rem" }}>{v.item_name}</div>
                              <div style={{ fontSize:"0.72rem", color:"var(--text3)", fontWeight:600, marginTop:3 }}>
                                {v.content_type} · {new Date(v.visited_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews */}
                    {userDetail.reviews?.length > 0 && (
                      <div className="clay-card" style={{ padding:24 }}>
                        <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:16 }}>⭐ Reviews</h5>
                        {userDetail.reviews.map((r,i) => (
                          <div key={i} style={{ padding:"10px 0", borderBottom:"1px dashed rgba(0,0,0,0.06)" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
                              <span style={{ fontWeight:700, color:"var(--text)", fontSize:"0.88rem" }}>
                                {r.destination?.name || r.hotel?.name || r.guide?.name || r.content_type}
                              </span>
                              <span style={{ color:"var(--clay-gold)" }}>{"★".repeat(r.rating)}</span>
                            </div>
                            <p style={{ margin:"4px 0 0", fontSize:"0.82rem", color:"var(--text3)", fontWeight:500 }}>{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
