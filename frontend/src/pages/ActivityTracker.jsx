import { useState, useEffect } from "react";
import { api } from "../api";

function Badge({ color, children }) {
  const map = {
    green:["rgba(6,214,160,0.12)","var(--clay-green)"],
    red:["rgba(232,72,85,0.12)","var(--clay-red)"],
    gold:["rgba(255,209,102,0.2)","#b8860b"],
    blue:["rgba(67,97,238,0.12)","var(--clay-blue)"],
    purple:["rgba(114,9,183,0.12)","var(--clay-purple)"],
  };
  const [bg, text] = map[color] || map.blue;
  return (
    <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:99, fontSize:"0.7rem", fontWeight:800, background:bg, color:text, border:"1px solid currentColor" }}>
      {children}
    </span>
  );
}

const typeIcon = { destination:"📍", hotel:"🏨", guide:"👤", transport:"🚌" };
const actionColor = { book_hotel:"blue", book_guide:"purple", book_transport:"green", subscribe:"gold", contact:"red", save_dest:"blue" };
const statusColor = { confirmed:"green", pending:"gold", cancelled:"red", refunded:"blue", completed:"green" };

// ── Edit Review Modal ──────────────────────────────────────────────
function EditReviewModal({ review, onClose, onSave }) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await api.adminUpdateReview(review.id, { rating, comment });
      onSave(updated);
    } catch (_) {}
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"var(--card-bg)",borderRadius:24,border:"var(--clay-border)",boxShadow:"var(--clay-shadow-lg)",width:"100%",maxWidth:440,padding:28,position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute",top:12,right:12,width:28,height:28,borderRadius:8,border:"none",background:"rgba(232,72,85,0.1)",color:"var(--clay-red)",cursor:"pointer",fontWeight:900 }}>✕</button>
        <h5 style={{ fontWeight:900,color:"var(--text)",marginBottom:4 }}>✏️ Edit Review</h5>
        <p style={{ color:"var(--text3)",fontSize:"0.82rem",fontWeight:600,marginBottom:18 }}>
          By <strong>{review.user?.username}</strong> on <strong>{review.destination?.name || review.hotel?.name || review.guide?.name || "—"}</strong>
        </p>
        <form onSubmit={submit}>
          <label style={{ fontWeight:700,fontSize:"0.82rem",color:"var(--text2)" }}>Rating (1–5)</label>
          <input className="clay-input" type="number" min={1} max={5} value={rating}
            onChange={e => setRating(+e.target.value)} required style={{ marginBottom:12 }} />
          <label style={{ fontWeight:700,fontSize:"0.82rem",color:"var(--text2)" }}>Comment</label>
          <textarea className="clay-input" rows={4} value={comment}
            onChange={e => setComment(e.target.value)} required style={{ resize:"vertical",marginBottom:16 }} />
          <div style={{ display:"flex",gap:10 }}>
            <button type="button" className="clay-btn clay-btn-outline" onClick={onClose} style={{ flex:1 }}>Cancel</button>
            <button type="submit" className="clay-btn clay-btn-red" style={{ flex:2,justifyContent:"center" }} disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function ActivityTracker({ navigate, user }) {
  const [tab, setTab] = useState("users"); // "users" | "reviews"

  // ── User Activity tab state ──
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);

  // ── All Reviews tab state ──
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [reviewSearch, setReviewSearch] = useState("");

  useEffect(() => {
    if (!user?.isAdmin) { navigate("home"); return; }
    api.adminUserActivity().then(d => setAllUsers(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const loadDetail = async (uid) => {
    setSelected(uid);
    setDetail(null);
    setDetailLoading(true);
    const d = await api.adminUserActivity(uid).catch(() => null);
    setDetail(d);
    setDetailLoading(false);
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    const d = await api.adminReviews().catch(() => []);
    setAllReviews(Array.isArray(d) ? d : []);
    setReviewsLoading(false);
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === "reviews" && allReviews.length === 0) loadReviews();
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    await api.adminDeleteReview(id).catch(() => {});
    setAllReviews(prev => prev.filter(r => r.id !== id));
    // also refresh detail if open
    if (detail) setDetail(d => ({ ...d, reviews: d.reviews?.filter(r => r.id !== id) }));
  };

  const confirmBooking = async (bookingId, status) => {
    setConfirmingId(bookingId);
    try {
      const updated = await api.adminConfirmBooking(bookingId, status);
      // update in detail
      setDetail(d => ({
        ...d,
        bookings: d.bookings?.map(b => b.id === bookingId ? { ...b, status: updated.status } : b),
      }));
    } catch (_) {}
    setConfirmingId(null);
  };

  const filtered = allUsers.filter(u =>
    !search || u.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredReviews = allReviews.filter(r =>
    !reviewSearch ||
    r.user?.username?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    r.destination?.name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    r.hotel?.name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    r.guide?.name?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
    r.comment?.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  if (!user?.isAdmin) return null;

  const tabStyle = (t) => ({
    padding:"9px 22px", borderRadius:12, border:"2px solid",
    borderColor: tab===t ? "var(--clay-red)" : "rgba(0,0,0,0.08)",
    background: tab===t ? "var(--clay-red)" : "var(--bg3)",
    color: tab===t ? "#fff" : "var(--text)",
    fontWeight:800, fontSize:"0.85rem", cursor:"pointer", transition:"all 0.2s",
  });

  return (
    <div style={{ minHeight:"100vh" }}>
      {editReview && (
        <EditReviewModal
          review={editReview}
          onClose={() => setEditReview(null)}
          onSave={(updated) => {
            setAllReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
            if (detail) setDetail(d => ({ ...d, reviews: d.reviews?.map(r => r.id === updated.id ? updated : r) }));
            setEditReview(null);
          }}
        />
      )}

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f0c29,#302b63)", padding:"80px 0 40px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:0.06, background:"url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=60') center/cover" }}></div>
        <div className="container" style={{ position:"relative", zIndex:2 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:"0.78rem", fontWeight:800, textTransform:"uppercase", letterSpacing:2, marginBottom:6 }}>Admin Panel</div>
              <h1 style={{ color:"#fff", fontWeight:900, fontFamily:"'Playfair Display',serif", margin:0, fontSize:"2rem" }}>
                <i className="fas fa-history" style={{ marginRight:12, color:"var(--clay-gold)" }}></i>
                Activity Tracker
              </h1>
              <p style={{ color:"rgba(255,255,255,0.5)", fontWeight:600, marginTop:6 }}>Manage user bookings, reviews and favourites</p>
            </div>
            <button className="clay-btn clay-btn-outline" style={{ color:"#fff", borderColor:"rgba(255,255,255,0.3)" }} onClick={() => navigate("admin")}>
              <i className="fas fa-chart-bar"></i> Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="container" style={{ paddingTop:28, paddingBottom:0 }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button style={tabStyle("users")} onClick={() => handleTabChange("users")}>
            👥 User Activity
          </button>
          <button style={tabStyle("reviews")} onClick={() => handleTabChange("reviews")}>
            ⭐ All Reviews
          </button>
        </div>
      </div>

      {/* ═══════════════════ USER ACTIVITY TAB ═══════════════════ */}
      {tab === "users" && (
        <div className="container" style={{ padding:"28px 24px 80px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"320px 1fr", gap:28, alignItems:"flex-start" }}>

            {/* User list */}
            <div style={{ position:"sticky", top:90 }}>
              <div className="clay-card" style={{ padding:20 }}>
                <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:16 }}>
                  👥 Users ({filtered.length})
                </h5>
                <input className="clay-input" placeholder="Search users..." value={search}
                  onChange={e => setSearch(e.target.value)} style={{ marginBottom:14 }} />
                {loading ? (
                  <div style={{ textAlign:"center", padding:40 }}><div className="loader-spinner" style={{ margin:"0 auto" }}></div></div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:600, overflowY:"auto" }}>
                    {filtered.map((u, i) => (
                      <button key={i} onClick={() => loadDetail(u.user?.id)}
                        style={{ padding:"12px 14px", borderRadius:14, border:`2px solid ${selected===u.user?.id?"var(--clay-red)":"rgba(0,0,0,0.08)"}`,
                          background: selected===u.user?.id?"rgba(232,72,85,0.08)":"var(--bg3)",
                          cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontWeight:800, color:"var(--text)", fontSize:"0.9rem" }}>{u.user?.username}</div>
                            <div style={{ fontSize:"0.72rem", color:"var(--text3)", fontWeight:600 }}>{u.user?.email}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:"0.72rem", color:"var(--clay-green)", fontWeight:800 }}>${u.payment_total?.toFixed(0)}</div>
                            <div style={{ fontSize:"0.68rem", color:"var(--text4)", fontWeight:600 }}>{u.booking_count} bookings</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                          {[
                            { l:"📋", v:u.booking_count },
                            { l:"⭐", v:u.review_count },
                            { l:"🗺️", v:u.visit_count },
                          ].map(s => (
                            <span key={s.l} style={{ fontSize:"0.68rem", fontWeight:700, color:"var(--text3)" }}>{s.l}{s.v}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detail panel */}
            <div>
              {!selected ? (
                <div className="clay-card" style={{ padding:60, textAlign:"center" }}>
                  <div style={{ fontSize:"3rem", marginBottom:16 }}>👈</div>
                  <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:8 }}>Select a user</h5>
                  <p style={{ color:"var(--text3)", fontWeight:600 }}>Click any user on the left to see their full activity history.</p>
                </div>
              ) : detailLoading ? (
                <div style={{ textAlign:"center", padding:80 }}><div className="loader-spinner" style={{ margin:"0 auto" }}></div></div>
              ) : detail ? (
                <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

                  {/* User header */}
                  <div className="clay-card" style={{ padding:24, background:"linear-gradient(135deg,rgba(67,97,238,0.08),rgba(114,9,183,0.08))" }}>
                    <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
                      <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,var(--clay-red),var(--clay-purple))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.5rem", fontWeight:900, color:"#fff", flexShrink:0 }}>
                        {detail.user?.username?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:900, fontSize:"1.2rem", color:"var(--text)" }}>{detail.user?.username}</div>
                        <div style={{ color:"var(--text3)", fontWeight:600, fontSize:"0.85rem" }}>{detail.user?.email}</div>
                      </div>
                      <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                        {[
                          { l:"Bookings", v:detail.bookings?.length, c:"var(--clay-blue)" },
                          { l:"Revenue", v:`$${detail.payments?.reduce((s,p)=>s+(p.amount||0),0).toFixed(0)}`, c:"var(--clay-green)" },
                          { l:"Reviews", v:detail.reviews?.length, c:"var(--clay-gold)" },
                          { l:"Visits", v:detail.visit_history?.length, c:"var(--clay-purple)" },
                        ].map(s => (
                          <div key={s.l} style={{ textAlign:"center" }}>
                            <div style={{ fontWeight:900, fontSize:"1.3rem", color:s.c }}>{s.v}</div>
                            <div style={{ fontSize:"0.7rem", color:"var(--text3)", fontWeight:700 }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bookings with Approve/Cancel */}
                  <div className="clay-card" style={{ padding:24 }}>
                    <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:16 }}>📋 Booking History ({detail.bookings?.length})</h5>
                    {detail.bookings?.length === 0 ? <p style={{ color:"var(--text3)", fontWeight:600 }}>No bookings yet.</p> :
                      detail.bookings?.map((b,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px dashed rgba(0,0,0,0.06)", flexWrap:"wrap", gap:8, alignItems:"center" }}>
                          <div style={{ display:"flex", gap:10, alignItems:"center", flex:1, minWidth:200 }}>
                            <Badge color={actionColor[b.action]||"blue"}>{b.action?.replace(/_/g," ")}</Badge>
                            <span style={{ fontWeight:700, color:"var(--text)", fontSize:"0.88rem" }}>{b.item_name?.slice(0,40)}</span>
                          </div>
                          <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                            {b.amount > 0 && <span style={{ fontWeight:800, color:"var(--clay-green)", fontSize:"0.9rem" }}>${b.amount}</span>}
                            <Badge color={statusColor[b.status]||"gold"}>{b.status}</Badge>
                            <span style={{ fontSize:"0.75rem", color:"var(--text4)" }}>{new Date(b.created_at).toLocaleDateString()}</span>
                            {b.status === "pending" && (
                              <>
                                <button
                                  onClick={() => confirmBooking(b.id, "confirmed")}
                                  disabled={confirmingId === b.id}
                                  style={{ padding:"4px 12px", borderRadius:8, border:"none", background:"rgba(6,214,160,0.15)", color:"var(--clay-green)", fontWeight:800, fontSize:"0.75rem", cursor:"pointer" }}>
                                  {confirmingId===b.id ? "…" : "✅ Approve"}
                                </button>
                                <button
                                  onClick={() => confirmBooking(b.id, "cancelled")}
                                  disabled={confirmingId === b.id}
                                  style={{ padding:"4px 12px", borderRadius:8, border:"none", background:"rgba(232,72,85,0.12)", color:"var(--clay-red)", fontWeight:800, fontSize:"0.75rem", cursor:"pointer" }}>
                                  {confirmingId===b.id ? "…" : "❌ Cancel"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Visit History */}
                  <div className="clay-card" style={{ padding:24 }}>
                    <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:16 }}>🗺️ Visit History ({detail.visit_history?.length})</h5>
                    {detail.visit_history?.length === 0 ? <p style={{ color:"var(--text3)", fontWeight:600 }}>No visits tracked yet.</p> :
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                        {detail.visit_history?.map((v,i) => (
                          <div key={i} style={{ padding:14, borderRadius:14, background:"var(--bg3)", border:"var(--clay-border)", display:"flex", gap:10, alignItems:"center" }}>
                            <span style={{ fontSize:"1.4rem" }}>{typeIcon[v.content_type]||"🌐"}</span>
                            <div>
                              <div style={{ fontWeight:700, color:"var(--text)", fontSize:"0.85rem" }}>{v.item_name || v.destination?.name || v.hotel?.name || v.guide?.name || "—"}</div>
                              <div style={{ fontSize:"0.7rem", color:"var(--text3)", fontWeight:600 }}>{v.content_type} · {new Date(v.visited_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  </div>

                  {/* Reviews with edit/delete */}
                  {detail.reviews?.length > 0 && (
                    <div className="clay-card" style={{ padding:24 }}>
                      <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:16 }}>⭐ Reviews ({detail.reviews?.length})</h5>
                      {detail.reviews?.map((r,i) => (
                        <div key={i} style={{ padding:"12px 0", borderBottom:"1px dashed rgba(0,0,0,0.06)" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:4, alignItems:"center" }}>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <Badge color={r.content_type==="hotel"?"blue":r.content_type==="guide"?"purple":"red"}>{r.content_type}</Badge>
                              <span style={{ fontWeight:700, color:"var(--text)", fontSize:"0.88rem" }}>
                                {r.destination?.name || r.hotel?.name || r.guide?.name || "—"}
                              </span>
                            </div>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <span style={{ color:"var(--clay-gold)" }}>{"★".repeat(r.rating)}</span>
                              <button onClick={() => setEditReview(r)} style={{ padding:"3px 10px", borderRadius:8, border:"none", background:"rgba(67,97,238,0.1)", color:"var(--clay-blue)", fontWeight:800, fontSize:"0.72rem", cursor:"pointer" }}>✏️ Edit</button>
                              <button onClick={() => deleteReview(r.id)} style={{ padding:"3px 10px", borderRadius:8, border:"none", background:"rgba(232,72,85,0.1)", color:"var(--clay-red)", fontWeight:800, fontSize:"0.72rem", cursor:"pointer" }}>🗑️ Delete</button>
                            </div>
                          </div>
                          <p style={{ margin:0, fontSize:"0.82rem", color:"var(--text3)", fontWeight:500 }}>{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ ALL REVIEWS TAB ═══════════════════ */}
      {tab === "reviews" && (
        <div className="container" style={{ padding:"28px 24px 80px" }}>
          <div className="clay-card" style={{ padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:20 }}>
              <h5 style={{ fontWeight:800, color:"var(--text)", margin:0 }}>
                ⭐ All User Reviews ({filteredReviews.length})
              </h5>
              <input className="clay-input" placeholder="Search by user, destination, comment…" value={reviewSearch}
                onChange={e => setReviewSearch(e.target.value)} style={{ maxWidth:320, margin:0 }} />
            </div>
            {reviewsLoading ? (
              <div style={{ textAlign:"center", padding:60 }}><div className="loader-spinner" style={{ margin:"0 auto" }}></div></div>
            ) : filteredReviews.length === 0 ? (
              <p style={{ color:"var(--text3)", fontWeight:600, textAlign:"center", padding:40 }}>No reviews found.</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                {filteredReviews.map((r, i) => (
                  <div key={r.id} style={{ padding:"14px 0", borderBottom:"1px dashed rgba(0,0,0,0.07)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6, flexWrap:"wrap" }}>
                        <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,var(--clay-red),var(--clay-purple))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.8rem", fontWeight:900, color:"#fff", flexShrink:0 }}>
                          {r.user?.username?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight:800, fontSize:"0.88rem", color:"var(--text)" }}>{r.user?.username}</span>
                        <Badge color={r.content_type==="hotel"?"blue":r.content_type==="guide"?"purple":"red"}>{r.content_type}</Badge>
                        <span style={{ fontWeight:700, color:"var(--text2)", fontSize:"0.85rem" }}>
                          {r.destination?.name || r.hotel?.name || r.guide?.name || "—"}
                        </span>
                      </div>
                      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:4 }}>
                        <span style={{ color:"var(--clay-gold)", fontSize:"1rem" }}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
                        <span style={{ fontSize:"0.72rem", color:"var(--text4)", fontWeight:600 }}>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ margin:0, fontSize:"0.83rem", color:"var(--text3)", fontWeight:500, lineHeight:1.5 }}>{r.comment}</p>
                    </div>
                    <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                      <button onClick={() => setEditReview(r)} style={{ padding:"6px 14px", borderRadius:10, border:"none", background:"rgba(67,97,238,0.1)", color:"var(--clay-blue)", fontWeight:800, fontSize:"0.78rem", cursor:"pointer" }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => deleteReview(r.id)} style={{ padding:"6px 14px", borderRadius:10, border:"none", background:"rgba(232,72,85,0.1)", color:"var(--clay-red)", fontWeight:800, fontSize:"0.78rem", cursor:"pointer" }}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`@media(max-width:768px){.container>div[style*="320px"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
