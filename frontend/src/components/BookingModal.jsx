// Shared BookingModal + PaymentFlow used by Hotel, Guide, Transport
import { useState } from "react";
import { api } from "../api";
import { useLang } from "../context/LangContext";

const PAY_METHODS = [
  { id:"visa",       label:"Visa",       icon:"fa-cc-visa",       grad:"linear-gradient(135deg,#1a1f71,#2563eb)", tag:"foreign" },
  { id:"mastercard", label:"Mastercard", icon:"fa-cc-mastercard", grad:"linear-gradient(135deg,#eb001b,#f79e1b)", tag:"foreign" },
  { id:"esewa",      label:"eSewa",      icon:"fa-wallet",        grad:"linear-gradient(135deg,#60bb46,#3d8b2f)", tag:"domestic" },
  { id:"khalti",     label:"Khalti",     icon:"fa-wallet",        grad:"linear-gradient(135deg,#5c2d91,#9b59b6)", tag:"domestic" },
];

// Currency config per language: { code, symbol, rate (from USD) }
const LANG_CURRENCY = {
  en: { code:"USD", symbol:"$",   rate:1 },
  ne: { code:"NPR", symbol:"रू",  rate:133.5 },
  hi: { code:"INR", symbol:"₹",   rate:83.5 },
  zh: { code:"CNY", symbol:"¥",   rate:7.24 },
  de: { code:"EUR", symbol:"€",   rate:0.92 },
  fr: { code:"EUR", symbol:"€",   rate:0.92 },
  ja: { code:"JPY", symbol:"¥",   rate:149.5 },
  ko: { code:"KRW", symbol:"₩",   rate:1325 },
  ar: { code:"USD", symbol:"$",   rate:1 },
};

function useCurrency() {
  const { lang } = useLang();
  return LANG_CURRENCY[lang] || LANG_CURRENCY.en;
}

function fmt(usdAmount, curr) {
  const converted = usdAmount * curr.rate;
  // For large currencies (JPY, KRW, NPR) show no decimals
  const decimals = curr.rate > 50 ? 0 : 2;
  return `${curr.symbol}${converted.toFixed(decimals)}`;
}

export function BookingModal({ config, user, onClose, onSuccess }) {
  const curr = useCurrency();
  // config: { type:"hotel"|"guide"|"transport", item, action:"book_hotel"|"book_guide"|"book_transport" }
  const [step, setStep] = useState(1); // 1=details, 2=payment
  const [form, setForm] = useState({
    fullName: user?.firstName || "",
    email: user?.email || "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: 2,
    rooms: 1,
    days: 1,
    requests: "",
  });
  const [method, setMethod] = useState("visa");
  const [card, setCard] = useState({ num:"", exp:"", cvv:"" });
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const { type, item, action } = config;
  const isForeign = ["visa","mastercard"].includes(method);

  const getNights = () => {
    if (!form.checkIn || !form.checkOut) return 0;
    const diff = new Date(form.checkOut) - new Date(form.checkIn);
    const n = Math.ceil(diff / 86400000);
    return n > 0 ? n : 0;
  };

  const nights = type === "hotel" ? getNights() : 0;
  const amount = type === "hotel"
    ? nights * (item.price_per_night || 0) * form.rooms
    : type === "guide"
    ? form.days * (item.price_per_day || 0)
    : type === "destination"
    ? (item.entry_fee || 0)
    : parseFloat((item.price || "0").replace(/[^0-9.]/g,"").split("–")[0]) || 50;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true); setErr("");
    try {
      const payment = await api.createPayment({
        method,
        amount: Math.round(amount * 100) / 100,
        currency: curr.code,
        item_name: item.name || item.name_key || "Booking",
        item_id: item.id || null,
        action,
        extra_data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          guests: form.guests,
          rooms: form.rooms,
          days: form.days,
          requests: form.requests,
          card_last4: isForeign ? card.num.slice(-4) : "",
          mobile: !isForeign ? mobile : "",
          type,
        },
      });
      // Track visit history
      if (type === "hotel" && item.id) {
        api.addVisit({ content_type:"hotel", hotel_id: item.id, item_name: item.name }).catch(()=>{});
      } else if (type === "guide" && item.id) {
        api.addVisit({ content_type:"guide", guide_id: item.id, item_name: item.name }).catch(()=>{});
      } else if (type === "destination" && item.id) {
        api.addVisit({ content_type:"destination", destination_id: item.id, item_name: item.name }).catch(()=>{});
      } else if (type === "transport") {
        api.addVisit({ content_type:"transport", item_name: item.name || item.name_key || "Transport" }).catch(()=>{});
      }
      onSuccess(payment);
    } catch(e) {
      setErr(typeof e==="object" ? Object.values(e).flat().join(" ") : "Payment failed. Try again.");
    } finally { setLoading(false); }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(6px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"var(--card-bg)",borderRadius:28,border:"var(--clay-border)",boxShadow:"var(--clay-shadow-lg)",width:"100%",maxWidth:500,padding:32,position:"relative",maxHeight:"90vh",overflowY:"auto" }}>
        <button onClick={onClose} style={{ position:"absolute",top:14,right:14,width:30,height:30,borderRadius:8,border:"none",background:"rgba(232,72,85,0.1)",color:"var(--clay-red)",cursor:"pointer",fontWeight:900,fontSize:"1rem" }}>✕</button>

        {/* Step indicator */}
        <div style={{ display:"flex",gap:8,marginBottom:24,alignItems:"center" }}>
          {["Details","Payment"].map((s,i) => (
            <div key={s} style={{ display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:28,height:28,borderRadius:"50%",background:step>i?"var(--clay-red)":step===i+1?"var(--clay-red)":"var(--bg3)",color:step>=i+1?"#fff":"var(--text3)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"0.8rem",border:"2px solid rgba(0,0,0,0.08)" }}>{i+1}</div>
              <span style={{ fontWeight:700,fontSize:"0.82rem",color:step===i+1?"var(--text)":"var(--text3)" }}>{s}</span>
              {i===0 && <div style={{ width:24,height:2,background:"var(--bg3)",borderRadius:99 }}></div>}
            </div>
          ))}
        </div>

        <h4 style={{ fontWeight:900,color:"var(--text)",marginBottom:4 }}>
          {type==="hotel"?"🏨 Book Hotel":type==="guide"?"👤 Book Guide":type==="destination"?"🎫 Book Destination":"🚌 Book Transport"}
        </h4>
        <p style={{ color:"var(--text3)",fontWeight:600,marginBottom:20,fontSize:"0.9rem" }}>
          {item.name || item.name_key}
          {amount > 0 && <strong style={{ color:"var(--clay-red)",marginLeft:8 }}>{fmt(amount,curr)}</strong>}
        </p>

        {err && <div style={{ padding:"10px 14px",background:"rgba(232,72,85,0.1)",border:"2px solid rgba(232,72,85,0.25)",borderRadius:12,color:"var(--clay-red)",fontWeight:700,fontSize:"0.85rem",marginBottom:14 }}>⚠️ {err}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                <div><label className="form-lbl">Full Name *</label>
                  <input className="clay-input" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} required /></div>
                <div><label className="form-lbl">Phone *</label>
                  <input className="clay-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required /></div>
              </div>
              <label className="form-lbl">Email *</label>
              <input className="clay-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />

              {type === "hotel" && (<>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                  <div><label className="form-lbl">Check-in *</label>
                    <input className="clay-input" type="date" min={today} value={form.checkIn} onChange={e=>setForm({...form,checkIn:e.target.value})} required /></div>
                  <div><label className="form-lbl">Check-out *</label>
                    <input className="clay-input" type="date" min={form.checkIn||today} value={form.checkOut} onChange={e=>setForm({...form,checkOut:e.target.value})} required /></div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                  <div><label className="form-lbl">Guests</label>
                    <input className="clay-input" type="number" min={1} value={form.guests} onChange={e=>setForm({...form,guests:+e.target.value})} /></div>
                  <div><label className="form-lbl">Rooms</label>
                    <input className="clay-input" type="number" min={1} value={form.rooms} onChange={e=>setForm({...form,rooms:+e.target.value})} /></div>
                </div>
              </>)}

              {type === "guide" && (
                <div><label className="form-lbl">Number of Days</label>
                  <input className="clay-input" type="number" min={1} value={form.days} onChange={e=>setForm({...form,days:+e.target.value})} /></div>
              )}

              {type === "destination" && item?.entry_fee > 0 && (
                <div style={{ padding:14,background:"rgba(67,97,238,0.06)",border:"var(--clay-border)",borderRadius:14,marginBottom:14 }}>
                  <div style={{ fontWeight:800,color:"var(--text)",marginBottom:4 }}>Entry Fee</div>
                  <div style={{ color:"var(--clay-red)",fontSize:"1.05rem",fontWeight:900 }}>{fmt(item.entry_fee,curr)} per person</div>
                </div>
              )}

              <label className="form-lbl">Special Requests</label>
              <textarea className="clay-input" rows={3} value={form.requests} onChange={e=>setForm({...form,requests:e.target.value})} placeholder="Any special requirements..." style={{ resize:"vertical" }} />

              {amount > 0 && (
                <div style={{ padding:14,background:"rgba(67,97,238,0.06)",border:"var(--clay-border)",borderRadius:14,marginBottom:14 }}>
                  <div style={{ fontWeight:800,color:"var(--text)",marginBottom:6 }}>Booking Summary</div>
                  {type==="hotel" && <div style={{ color:"var(--text2)",fontSize:"0.88rem",fontWeight:600 }}>Nights: {nights} × {fmt(item.price_per_night,curr)} × {form.rooms} room(s)</div>}
                  {type==="guide" && <div style={{ color:"var(--text2)",fontSize:"0.88rem",fontWeight:600 }}>Days: {form.days} × {fmt(item.price_per_day,curr)}/day</div>}
                  <div style={{ color:"var(--clay-red)",fontSize:"1.05rem",fontWeight:900,marginTop:6 }}>Total: {fmt(amount,curr)}</div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <p style={{ fontSize:"0.78rem",fontWeight:800,textTransform:"uppercase",letterSpacing:1,color:"var(--text3)",marginBottom:10 }}>Payment Method</p>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20 }}>
                {PAY_METHODS.map(m => (
                  <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                    style={{ padding:"12px 8px",borderRadius:14,border:`3px solid ${method===m.id?"rgba(232,72,85,0.5)":"rgba(0,0,0,0.08)"}`,background:method===m.id?m.grad:"var(--bg3)",cursor:"pointer",transition:"all 0.2s",transform:method===m.id?"translateY(-2px)":"none",textAlign:"center" }}>
                    <i className={`fab ${m.icon}`} style={{ fontSize:"1.3rem",color:method===m.id?"#fff":"inherit",display:"block",marginBottom:3 }}></i>
                    <span style={{ fontSize:"0.75rem",fontWeight:800,color:method===m.id?"#fff":"var(--text2)" }}>{m.label}</span>
                    <span style={{ display:"block",fontSize:"0.6rem",color:method===m.id?"rgba(255,255,255,0.7)":"var(--text4)",fontWeight:700 }}>{m.tag}</span>
                  </button>
                ))}
              </div>

              {isForeign ? (<>
                <label className="form-lbl">Card Number</label>
                <input className="clay-input" placeholder="1234 5678 9012 3456" value={card.num} onChange={e=>setCard({...card,num:e.target.value.replace(/\D/g,"").slice(0,16)})} required />
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
                  <div><label className="form-lbl">Expiry (MM/YY)</label><input className="clay-input" placeholder="MM/YY" value={card.exp} onChange={e=>setCard({...card,exp:e.target.value})} required /></div>
                  <div><label className="form-lbl">CVV</label><input className="clay-input" placeholder="123" value={card.cvv} onChange={e=>setCard({...card,cvv:e.target.value.replace(/\D/g,"").slice(0,4)})} required /></div>
                </div>
              </>) : (<>
                <label className="form-lbl">{PAY_METHODS.find(m=>m.id===method)?.label} Mobile Number</label>
                <input className="clay-input" placeholder="98XXXXXXXX" value={mobile} onChange={e=>setMobile(e.target.value.replace(/\D/g,"").slice(0,10))} required />
                <p style={{ fontSize:"0.8rem",color:"var(--text3)",fontWeight:600,marginBottom:12 }}>You'll receive a confirmation on your app.</p>
              </>)}
            </>
          )}

          <div style={{ display:"flex",gap:10,marginTop:8 }}>
            {step===2 && <button type="button" className="clay-btn clay-btn-outline" onClick={()=>setStep(1)} style={{ flex:1 }}>← Back</button>}
            <button type="submit" className="clay-btn clay-btn-red" style={{ flex:2,justifyContent:"center" }} disabled={loading}>
              <i className={`fas ${loading?"fa-spinner fa-spin":step===1?"fa-arrow-right":"fa-lock"}`}></i>
              {loading?"Processing...":step===1?"Continue to Payment":`Pay ${fmt(amount,curr)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
