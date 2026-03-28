import { useState } from "react";
import { api } from "../api";

const TREK_PRESETS = [
  { name: "Everest Base Camp", days: 14, guide: 80, hotel: 25, food: 30, transport: 220, permit: 70 },
  { name: "Annapurna Circuit", days: 18, guide: 65, hotel: 20, food: 25, transport: 80, permit: 30 },
  { name: "Poon Hill", days: 5, guide: 60, hotel: 15, food: 20, transport: 40, permit: 15 },
  { name: "Langtang Valley", days: 8, guide: 65, hotel: 18, food: 22, transport: 30, permit: 25 },
  { name: "Chitwan Safari", days: 3, guide: 55, hotel: 120, food: 35, transport: 15, permit: 25 },
  { name: "Pokhara City", days: 4, guide: 50, hotel: 80, food: 30, transport: 10, permit: 0 },
];

export default function TripCostEstimator({ navigate }) {
  const [preset, setPreset] = useState(null);
  const [form, setForm] = useState({ days: 7, travelers: 2, style: "mid", guide: true, porter: true });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const styleMultiplier = { budget: 0.6, mid: 1, luxury: 2.2 };

  const calculate = async () => {
    setLoading(true);
    const base = preset || { guide: 65, hotel: 30, food: 25, transport: 50, permit: 30 };
    const m = styleMultiplier[form.style];
    const guideTotal = form.guide ? base.guide * form.days : 0;
    const porterTotal = form.porter ? 18 * form.days : 0; // $18/day fair wage
    const hotelTotal = base.hotel * m * form.days * form.travelers;
    const foodTotal = base.food * m * form.days * form.travelers;
    const transportTotal = (base.transport || 50) * form.travelers;
    const permitTotal = (base.permit || 30) * form.travelers;
    const total = guideTotal + porterTotal + hotelTotal + foodTotal + transportTotal + permitTotal;

    setResult({
      guide: guideTotal,
      porter: porterTotal,
      hotel: hotelTotal,
      food: foodTotal,
      transport: transportTotal,
      permit: permitTotal,
      total: Math.round(total),
      perPerson: Math.round(total / form.travelers),
    });
    setLoading(false);
  };

  const applyPreset = (p) => {
    setPreset(p);
    setForm(f => ({ ...f, days: p.days }));
    setResult(null);
  };

  return (
    <div>
      <div className="page-header" style={{ background:"linear-gradient(135deg,#0f0c29,#302b63)" }}>
        <div className="inner container">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a onClick={() => navigate("home")}>Home</a></li>
            <li className="breadcrumb-item">Trip Cost Estimator</li>
          </ol>
          <h1>🧮 Trip Cost Estimator</h1>
          <p>Plan your Nepal budget with fair porter wages built in.</p>
        </div>
      </div>

      <div className="container section">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"flex-start" }}>

          {/* Left: form */}
          <div>
            <div className="clay-card" style={{ padding:32, marginBottom:24 }}>
              <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:20 }}>Quick Presets</h5>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {TREK_PRESETS.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)}
                    style={{ padding:"10px 14px", borderRadius:14, border:`2px solid ${preset?.name===p.name?"var(--clay-red)":"rgba(0,0,0,0.08)"}`,
                      background: preset?.name===p.name ? "rgba(232,72,85,0.08)" : "var(--bg3)",
                      cursor:"pointer", textAlign:"left", transition:"all 0.2s" }}>
                    <div style={{ fontWeight:800, fontSize:"0.85rem", color:"var(--text)" }}>{p.name}</div>
                    <div style={{ fontSize:"0.72rem", color:"var(--text3)", fontWeight:600 }}>{p.days} days</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="clay-card" style={{ padding:32 }}>
              <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:20 }}>Customize</h5>

              <label className="form-lbl">Duration (days)</label>
              <input type="number" className="clay-input" min={1} max={30} value={form.days}
                onChange={e => setForm({...form, days: parseInt(e.target.value)||1})} />

              <label className="form-lbl">Number of Travelers</label>
              <input type="number" className="clay-input" min={1} max={20} value={form.travelers}
                onChange={e => setForm({...form, travelers: parseInt(e.target.value)||1})} />

              <label className="form-lbl">Travel Style</label>
              <select className="clay-select" value={form.style} onChange={e => setForm({...form, style: e.target.value})}>
                <option value="budget">Budget (teahouses, local food)</option>
                <option value="mid">Mid-range (comfortable lodges)</option>
                <option value="luxury">Luxury (premium lodges & camps)</option>
              </select>

              <div style={{ display:"flex", gap:16, marginBottom:20 }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontWeight:700, color:"var(--text2)" }}>
                  <input type="checkbox" checked={form.guide} onChange={e => setForm({...form, guide: e.target.checked})} />
                  Include Certified Guide
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontWeight:700, color:"var(--text2)" }}>
                  <input type="checkbox" checked={form.porter} onChange={e => setForm({...form, porter: e.target.checked})} />
                  Include Porter (fair wage)
                </label>
              </div>

              {form.porter && (
                <div style={{ padding:"10px 14px", background:"rgba(6,214,160,0.08)", border:"2px solid rgba(6,214,160,0.2)", borderRadius:12, marginBottom:16, fontSize:"0.82rem", color:"var(--clay-green)", fontWeight:700 }}>
                  ⚖️ Porter wage calculated at $18/day — Tour Tech's verified fair wage standard.
                </div>
              )}

              <button className="clay-btn clay-btn-red clay-btn-full clay-btn-lg" onClick={calculate} disabled={loading}>
                <i className={`fas ${loading?"fa-spinner fa-spin":"fa-calculator"}`}></i>
                {loading ? "Calculating..." : "Calculate Budget"}
              </button>
            </div>
          </div>

          {/* Right: result */}
          <div>
            {result ? (
              <div className="clay-card" style={{ padding:32 }}>
                <div style={{ textAlign:"center", marginBottom:28, padding:24, background:"linear-gradient(135deg,#0f0c29,#302b63)", borderRadius:20 }}>
                  <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.82rem", fontWeight:800, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
                    Estimated Total
                  </div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"3.5rem", fontWeight:900, color:"#ffd166" }}>
                    ${result.total.toLocaleString()}
                  </div>
                  <div style={{ color:"rgba(255,255,255,0.6)", fontWeight:600, marginTop:4 }}>
                    ${result.perPerson.toLocaleString()} per person · {form.days} days · {form.travelers} traveler{form.travelers>1?"s":""}
                  </div>
                </div>

                <h6 style={{ fontWeight:800, color:"var(--text)", marginBottom:16 }}>Cost Breakdown</h6>
                {[
                  { label:"Guide", amount:result.guide, color:"#4361ee", icon:"fa-user-tie" },
                  { label:"Porter (fair wage)", amount:result.porter, color:"#06d6a0", icon:"fa-hiking" },
                  { label:"Accommodation", amount:result.hotel, color:"#f59e0b", icon:"fa-bed" },
                  { label:"Food & Drinks", amount:result.food, color:"#e84855", icon:"fa-utensils" },
                  { label:"Transport", amount:result.transport, color:"#7c3aed", icon:"fa-bus" },
                  { label:"Permits & Fees", amount:result.permit, color:"#06b6d4", icon:"fa-ticket-alt" },
                ].filter(i => i.amount > 0).map(item => (
                  <div key={item.label} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.85rem", fontWeight:700, color:"var(--text2)" }}>
                        <i className={`fas ${item.icon}`} style={{ color:item.color, width:16 }}></i>
                        {item.label}
                      </span>
                      <span style={{ fontWeight:900, color:item.color }}>${item.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ height:8, borderRadius:99, background:"var(--bg2)", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.round((item.amount/result.total)*100)}%`, background:item.color, borderRadius:99 }} />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop:24, padding:"14px 18px", background:"rgba(255,209,102,0.08)", border:"2px solid rgba(255,209,102,0.2)", borderRadius:14 }}>
                  <div style={{ fontWeight:800, color:"var(--text)", marginBottom:4, fontSize:"0.85rem" }}>💡 Budget Tips</div>
                  <ul style={{ margin:0, paddingLeft:18, color:"var(--text3)", fontSize:"0.82rem", fontWeight:600, lineHeight:1.8 }}>
                    <li>Travel Oct–Nov or Mar–May for best weather and value</li>
                    <li>Book guides 2–4 weeks in advance for best rates</li>
                    <li>All porter wages on Tour Tech meet the $18/day standard</li>
                  </ul>
                </div>

                <div style={{ display:"flex", gap:10, marginTop:20 }}>
                  <button className="clay-btn clay-btn-red clay-btn-full" onClick={() => navigate("guides")}>
                    <i className="fas fa-user-tie"></i> Book a Guide
                  </button>
                  <button className="clay-btn clay-btn-outline clay-btn-full" onClick={() => navigate("destinations")}>
                    <i className="fas fa-map-marked-alt"></i> Explore
                  </button>
                </div>
              </div>
            ) : (
              <div className="clay-card" style={{ padding:60, textAlign:"center" }}>
                <div style={{ fontSize:"4rem", marginBottom:16 }}>🧮</div>
                <h5 style={{ fontWeight:800, color:"var(--text)", marginBottom:8 }}>Your Budget Estimate</h5>
                <p style={{ color:"var(--text3)", fontWeight:600 }}>Select a preset or customize your trip, then click Calculate.</p>
                <div style={{ marginTop:24, padding:"14px 18px", background:"rgba(6,214,160,0.08)", border:"2px solid rgba(6,214,160,0.2)", borderRadius:14, textAlign:"left" }}>
                  <div style={{ fontWeight:800, color:"var(--clay-green)", marginBottom:4, fontSize:"0.85rem" }}>⚖️ Porter Ethics Built In</div>
                  <p style={{ margin:0, color:"var(--text3)", fontSize:"0.82rem", fontWeight:600, lineHeight:1.7 }}>
                    Every estimate includes porter wages at the verified fair rate of $18/day — the Tour Tech standard. No hidden exploitation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:768px){.container.section>div{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
