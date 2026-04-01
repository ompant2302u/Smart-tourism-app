import { useState } from "react";
import { useLang } from "../context/LangContext";

const DESTINATIONS = [
  "Kathmandu & Bhaktapur", "Everest Region (EBC Trek)", "Pokhara & Annapurna",
  "Upper Mustang", "Chitwan National Park", "Langtang Valley",
  "Dolpa Region", "Bardiya National Park", "Lumbini & Kapilvastu",
  "Gokyo Lakes Trek", "Poon Hill Trek", "Manaslu Circuit",
];

const INTERESTS = [
  { id: "trekking", label: "Trekking", icon: "🥾" },
  { id: "culture",  label: "Culture",  icon: "🏛️" },
  { id: "wildlife", label: "Wildlife", icon: "🦏" },
  { id: "food",     label: "Local Food",icon: "🍜" },
  { id: "photo",    label: "Photography",icon:"📷" },
  { id: "yoga",     label: "Yoga & Wellness",icon:"🧘" },
  { id: "history",  label: "History",   icon: "📜" },
  { id: "adventure",label: "Adventure", icon: "🪂" },
];

const BUDGETS = [
  { id: "budget",   label: "Budget",   sub: "$20–50/day",  icon: "💰" },
  { id: "mid",      label: "Mid-Range",sub: "$50–150/day", icon: "💳" },
  { id: "luxury",   label: "Luxury",   sub: "$150+/day",   icon: "👑" },
];

const PACE = [
  { id: "relaxed",  label: "Relaxed",  sub: "2–3 sites/day" },
  { id: "moderate", label: "Moderate", sub: "4–5 sites/day" },
  { id: "packed",   label: "Packed",   sub: "6+ sites/day" },
];

/* Sample itinerary generator */
function generateItinerary(form) {
  const days = parseInt(form.days) || 7;
  const dest = form.destination;
  const budget = form.budget;

  const templates = {
    "Everest Region (EBC Trek)": [
      { title: "Arrival in Kathmandu", morning: "Land at Tribhuvan International Airport, transfer to hotel in Thamel", afternoon: "Rest and acclimatize, explore Thamel markets", evening: "Welcome dinner at traditional Nepali restaurant, gear check", tips: "Exchange currency at airport, buy SIM card" },
      { title: "Fly to Lukla, Trek to Phakding", morning: "Early morning flight to Lukla (2860m) — thrilling mountain airstrip", afternoon: "Begin trek to Phakding (2610m), 3–4 hour walk", evening: "Tea house dinner, meet fellow trekkers", tips: "Start easy — don't rush on day 1" },
      { title: "Phakding to Namche Bazaar", morning: "Trek through Sagarmatha National Park gate (entrance fee required)", afternoon: "Challenging ascent to Namche Bazaar (3440m)", evening: "Explore Namche's famous Saturday Market", tips: "First acclimatization day — drink lots of water" },
      { title: "Acclimatization in Namche", morning: "Hike to Everest View Hotel for first Everest views!", afternoon: "Visit Sherpa Museum, explore local shops", evening: "Rest and prepare for higher altitude ahead", tips: "Buy last-minute gear here if needed" },
      { title: "Namche to Tengboche", morning: "Trek to Tengboche Monastery (3867m) with stunning Everest views", afternoon: "Attend afternoon puja at the monastery", evening: "Cozy tea house with Himalayan panorama", tips: "Photography is allowed at the monastery" },
      { title: "Tengboche to Dingboche", morning: "Continue up the valley to Dingboche (4410m)", afternoon: "Explore the village, potato fields at altitude", evening: "Altitude sickness prevention: hydrate well", tips: "Headache is normal — descend if severe" },
      { title: "Acclimatization Hike to Nangkartshang", morning: "Acclimatization hike to 5000m peak above Dingboche", afternoon: "Return to tea house, rest", evening: "Prepare for the Lobuche push tomorrow", tips: "This hike is crucial for EBC success" },
    ],
    "Pokhara & Annapurna": [
      { title: "Arrive Pokhara", morning: "Fly or drive to Pokhara (1-hour flight or 7-hour bus from Kathmandu)", afternoon: "Lakeside stroll at Fewa Lake, boat ride", evening: "Sunset at Peace Pagoda, dinner by the lake", tips: "Best sunset views from the northern end of the lake" },
      { title: "Poon Hill Sunrise Trek Begins", morning: "Drive to Nayapul, begin trek to Tikhedhunga", afternoon: "Climb to Ulleri (2073m) via stone staircase", evening: "Tea house in Ulleri with mountain views", tips: "The staircase has 3,000+ steps — pace yourself!" },
      { title: "Trek to Ghorepani", morning: "Continue through rhododendron forests to Ghorepani (2874m)", afternoon: "Arrive early, rest, explore the village", evening: "Stars are incredible at this altitude", tips: "Wake up at 4:30 AM next day for sunrise hike" },
      { title: "Poon Hill Sunrise & Trek to Tadapani", morning: "Pre-dawn hike to Poon Hill (3210m) — panoramic Annapurna views!", afternoon: "Trek to Tadapani through forest", evening: "Celebrate with dal bhat dinner", tips: "Bring warm layers — it's cold at sunrise" },
      { title: "Return to Pokhara", morning: "Trek to Ghandruk or continue to Nayapul", afternoon: "Drive back to Pokhara", evening: "Massage and celebration in Lakeside", tips: "Book massage in advance on busy days" },
    ],
  };

  const base = templates[dest] || templates["Pokhara & Annapurna"];
  const result = [];
  for (let i = 0; i < days; i++) {
    if (base[i]) {
      result.push({ day: i + 1, ...base[i] });
    } else {
      result.push({
        day: i + 1,
        title: `Day ${i + 1} — Extended Exploration`,
        morning: "Continue exploring the region at your own pace",
        afternoon: "Optional day hike or cultural visit",
        evening: "Local restaurant dinner with fellow travelers",
        tips: "Consult your guide for personalized recommendations",
      });
    }
  }
  return result;
}


export default function AIItineraryPage({ navigate, user }) {
  const { t } = useLang();
  const [step, setStep] = useState(1); // 1=form, 2=generating, 3=result
  const [form, setForm] = useState({
    destination: "Everest Region (EBC Trek)",
    days: "7",
    budget: "mid",
    pace: "moderate",
    interests: ["trekking"],
    groupSize: "2",
    fitnessLevel: "moderate",
    language: "english",
    specialNeeds: "",
  });
  const [itinerary, setItinerary] = useState([]);
  const [expandedDay, setExpandedDay] = useState(0);

  const toggleInterest = (id) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(id) ? f.interests.filter(i => i !== id) : [...f.interests, id],
    }));
  };

  const handleGenerate = () => {
    setStep(2);
    setTimeout(() => {
      const result = generateItinerary(form);
      setItinerary(result);
      setStep(3);
    }, 3200);
  };

  const accentStyle = { background: "linear-gradient(135deg,var(--mountain-300),var(--forest-300),var(--sunset-300))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Hero Header */}
      <div style={{ background: "linear-gradient(135deg,var(--mountain-900),var(--mountain-800))", padding: "90px 0 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 40%,rgba(37,99,176,0.2),transparent 60%)", pointerEvents: "none" }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="section-eyebrow" style={{ background: "rgba(255,255,255,0.08)", color: "var(--sunset-300)", borderColor: "rgba(255,255,255,0.12)", marginBottom: 16 }}>
            🤖 AI-Powered Planning
          </div>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: "clamp(2rem,5vw,3.2rem)", fontWeight: 900, color: "#fff", marginBottom: 14, lineHeight: 1.1 }}>
            Your Personal<br /><span style={accentStyle}>Nepal Travel AI</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.05rem", maxWidth: 520, lineHeight: 1.72 }}>
            Answer a few questions and get a fully personalized, day-by-day Nepal itinerary — with accommodation, activities, and local tips.
          </p>

          {step === 3 && (
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 20, color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)" }} onClick={() => setStep(1)}>
              <i className="fas fa-redo" /> Generate New Itinerary
            </button>
          )}
        </div>
      </div>

      <div className="container" style={{ padding: "48px 24px" }}>

        {/* ── STEP 1: Form ── */}
        {step === 1 && (
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <div className="ai-generator">

              {/* Destination */}
              <div className="form-group">
                <label className="form-label"><i className="fas fa-map-marker-alt" style={{ color: "var(--primary)", marginRight: 6 }} /> Where do you want to go?</label>
                <select className="input" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}>
                  {DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Days + Group */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-calendar" style={{ color: "var(--primary)", marginRight: 6 }} /> Trip Duration</label>
                  <select className="input" value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))}>
                    {[3,5,7,10,14,21,30].map(d => <option key={d} value={d}>{d} days</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-users" style={{ color: "var(--primary)", marginRight: 6 }} /> Group Size</label>
                  <select className="input" value={form.groupSize} onChange={e => setForm(f => ({ ...f, groupSize: e.target.value }))}>
                    {["Solo","2","3–4","5–8","9+"].map(g => <option key={g} value={g}>{g === "Solo" ? "Solo" : `${g} people`}</option>)}
                  </select>
                </div>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label className="form-label"><i className="fas fa-wallet" style={{ color: "var(--primary)", marginRight: 6 }} /> Budget Level</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {BUDGETS.map(b => (
                    <div key={b.id} onClick={() => setForm(f => ({ ...f, budget: b.id }))} style={{
                      padding: "14px 12px", border: "2px solid",
                      borderColor: form.budget === b.id ? "var(--primary)" : "var(--card-border)",
                      borderRadius: "var(--radius-lg)", cursor: "pointer", textAlign: "center",
                      background: form.budget === b.id ? "rgba(37,99,176,0.08)" : "var(--surface-subtle)",
                      transition: "all var(--transition)",
                    }}>
                      <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{b.icon}</div>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>{b.label}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text4)" }}>{b.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pace */}
              <div className="form-group">
                <label className="form-label"><i className="fas fa-tachometer-alt" style={{ color: "var(--primary)", marginRight: 6 }} /> Travel Pace</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                  {PACE.map(p => (
                    <div key={p.id} onClick={() => setForm(f => ({ ...f, pace: p.id }))} style={{
                      padding: "12px", border: "2px solid",
                      borderColor: form.pace === p.id ? "var(--forest-500)" : "var(--card-border)",
                      borderRadius: "var(--radius-lg)", cursor: "pointer", textAlign: "center",
                      background: form.pace === p.id ? "rgba(22,163,74,0.08)" : "var(--surface-subtle)",
                      transition: "all var(--transition)",
                    }}>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>{p.label}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text4)" }}>{p.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="form-group">
                <label className="form-label"><i className="fas fa-heart" style={{ color: "var(--sunset-500)", marginRight: 6 }} /> Your Interests (select all that apply)</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {INTERESTS.map(int => (
                    <button key={int.id} onClick={() => toggleInterest(int.id)} style={{
                      padding: "8px 16px", border: "2px solid",
                      borderColor: form.interests.includes(int.id) ? "var(--primary)" : "var(--card-border)",
                      borderRadius: "var(--radius-full)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      background: form.interests.includes(int.id) ? "rgba(37,99,176,0.1)" : "transparent",
                      color: form.interests.includes(int.id) ? "var(--primary)" : "var(--text3)",
                      fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: "0.82rem",
                      transition: "all var(--transition)",
                    }}>
                      {int.icon} {int.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fitness + Language */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-dumbbell" style={{ color: "var(--primary)", marginRight: 6 }} /> Fitness Level</label>
                  <select className="input" value={form.fitnessLevel} onChange={e => setForm(f => ({ ...f, fitnessLevel: e.target.value }))}>
                    <option value="beginner">Beginner (light walks)</option>
                    <option value="moderate">Moderate (regular hiker)</option>
                    <option value="fit">Fit (experienced trekker)</option>
                    <option value="athlete">Athlete (mountaineer)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label"><i className="fas fa-globe" style={{ color: "var(--primary)", marginRight: 6 }} /> Preferred Language</label>
                  <select className="input" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    <option value="english">English</option>
                    <option value="nepali">नेपाली (Nepali)</option>
                    <option value="chinese">中文 (Chinese)</option>
                    <option value="hindi">हिन्दी (Hindi)</option>
                    <option value="german">Deutsch (German)</option>
                    <option value="french">Français (French)</option>
                  </select>
                </div>
              </div>

              {/* Special needs */}
              <div className="form-group">
                <label className="form-label"><i className="fas fa-info-circle" style={{ color: "var(--primary)", marginRight: 6 }} /> Special Requirements (optional)</label>
                <input type="text" className="input" placeholder="Dietary needs, disabilities, specific sites you must visit..."
                  value={form.specialNeeds} onChange={e => setForm(f => ({ ...f, specialNeeds: e.target.value }))} />
              </div>

              <button className="btn btn-primary btn-lg w-full" onClick={handleGenerate} style={{ marginTop: 8 }}>
                <i className="fas fa-magic" /> Generate My Personalized Itinerary
              </button>

              <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text4)", marginTop: 12 }}>
                Free • No account required • Instant results
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Generating ── */}
        {step === 2 && (
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", padding: "60px 0" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,var(--primary),var(--forest-600))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 24px", animation: "float 2s ease infinite" }}>
              🤖
            </div>
            <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: "var(--text)", marginBottom: 10, fontSize: "1.5rem" }}>
              Crafting Your Perfect Itinerary...
            </h2>
            <p style={{ color: "var(--text4)", marginBottom: 36 }}>
              Analyzing {form.days} days in {form.destination} for {form.groupSize === "Solo" ? "solo travel" : `${form.groupSize} people`}
            </p>

            <div className="ai-thinking" style={{ justifyContent: "center", gap: 8, marginBottom: 32 }}>
              <div className="ai-dot" />
              <div className="ai-dot" />
              <div className="ai-dot" />
            </div>

            <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-xl)", padding: 24, textAlign: "left" }}>
              {[
                "📍 Optimizing route based on your interests...",
                "🏨 Selecting accommodations for your budget...",
                "🍜 Curating local food experiences...",
                "🛡️ Checking real-time safety conditions...",
                "📋 Finalizing day-by-day schedule...",
              ].map((msg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--card-border)", fontSize: "0.88rem", color: "var(--text3)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--forest-500)", animation: `pulse 1s ease ${i * 0.4}s infinite` }} />
                  {msg}
                </div>
              ))}
            </div>
            <style>{`@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}`}</style>
          </div>
        )}

        {/* ── STEP 3: Result ── */}
        {step === 3 && (
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {/* Summary */}
            <div style={{ background: "linear-gradient(135deg,var(--mountain-800),var(--mountain-900))", borderRadius: "var(--radius-2xl)", padding: 32, marginBottom: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "radial-gradient(circle,rgba(37,99,176,0.3),transparent)", borderRadius: "50%" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="section-eyebrow" style={{ background: "rgba(255,255,255,0.1)", color: "var(--sunset-300)", borderColor: "rgba(255,255,255,0.15)", marginBottom: 16 }}>
                  ✅ Your AI Itinerary is Ready!
                </div>
                <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, color: "#fff", fontSize: "1.6rem", marginBottom: 12 }}>
                  {form.days}-Day {form.destination} Adventure
                </h2>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  {[
                    { icon: "fa-calendar", val: `${form.days} days` },
                    { icon: "fa-users", val: form.groupSize === "Solo" ? "Solo" : `${form.groupSize} people` },
                    { icon: "fa-wallet", val: BUDGETS.find(b => b.id === form.budget)?.label },
                    { icon: "fa-running", val: form.pace.charAt(0).toUpperCase() + form.pace.slice(1) },
                  ].map(item => (
                    <div key={item.icon} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.88rem", color: "rgba(255,255,255,0.7)" }}>
                      <i className={`fas ${item.icon}`} style={{ color: "var(--mountain-300)" }} />
                      {item.val}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
                  <button className="btn btn-accent btn-sm" onClick={() => navigate("guides")}>
                    <i className="fas fa-user-tie" /> Book a Guide
                  </button>
                  <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} onClick={() => navigate("hotels")}>
                    <i className="fas fa-hotel" /> Find Hotels
                  </button>
                  <button className="btn btn-sm" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} onClick={() => navigate("interactive-map")}>
                    <i className="fas fa-map" /> View on Map
                  </button>
                </div>
              </div>
            </div>

            {/* Day-by-day itinerary */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {itinerary.map((day, i) => (
                <div key={day.day} style={{
                  background: "var(--card-bg)", border: "1px solid",
                  borderColor: expandedDay === i ? "var(--primary)" : "var(--card-border)",
                  borderRadius: "var(--radius-xl)", overflow: "hidden",
                  transition: "border-color var(--transition)",
                }}>
                  {/* Day header */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", cursor: "pointer" }}
                    onClick={() => setExpandedDay(expandedDay === i ? -1 : i)}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: expandedDay === i ? "linear-gradient(135deg,var(--primary),var(--forest-600))" : "var(--bg2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: "0.95rem",
                      color: expandedDay === i ? "#fff" : "var(--text3)",
                      transition: "all var(--transition)",
                    }}>
                      {day.day}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: "var(--text)", fontSize: "1rem" }}>
                        Day {day.day}: {day.title}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text4)", marginTop: 2 }}>
                        {day.morning.substring(0, 60)}...
                      </div>
                    </div>
                    <i className={`fas fa-chevron-${expandedDay === i ? "up" : "down"}`} style={{ color: "var(--text4)", fontSize: "0.8rem", flexShrink: 0 }} />
                  </div>

                  {/* Expanded content */}
                  {expandedDay === i && (
                    <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--card-border)" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginTop: 16 }}>
                        {[
                          { icon: "fa-sun", label: "Morning", text: day.morning, color: "var(--sunset-500)" },
                          { icon: "fa-cloud-sun", label: "Afternoon", text: day.afternoon, color: "var(--mountain-400)" },
                          { icon: "fa-moon", label: "Evening", text: day.evening, color: "var(--mountain-700)" },
                        ].map(slot => (
                          <div key={slot.label} style={{ padding: 16, background: "var(--surface-subtle)", borderRadius: "var(--radius-lg)", border: "1px solid var(--card-border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                              <i className={`fas ${slot.icon}`} style={{ color: slot.color }} />
                              <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.83rem", color: "var(--text)" }}>{slot.label}</span>
                            </div>
                            <p style={{ fontSize: "0.85rem", color: "var(--text3)", lineHeight: 1.6 }}>{slot.text}</p>
                          </div>
                        ))}
                      </div>

                      {/* Pro tip */}
                      <div style={{ marginTop: 14, padding: "12px 16px", background: "rgba(37,99,176,0.06)", border: "1px solid rgba(37,99,176,0.15)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <i className="fas fa-lightbulb" style={{ color: "var(--gold)", marginTop: 2 }} />
                        <div>
                          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--text)", marginBottom: 2 }}>Local Tip</div>
                          <p style={{ fontSize: "0.82rem", color: "var(--text3)" }}>{day.tips}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom CTAs */}
            <div style={{ textAlign: "center", marginTop: 36, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate("guides")}>
                <i className="fas fa-user-tie" /> Book a Certified Guide
              </button>
              <button className="btn btn-accent btn-lg" onClick={() => navigate("hotels")}>
                <i className="fas fa-hotel" /> Find Accommodations
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => setStep(1)}>
                <i className="fas fa-redo" /> Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
