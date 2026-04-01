import { useState, useEffect, useRef } from "react";

const TREKKING_ROUTES = [
  {
    id: 1, name: "Everest Base Camp", difficulty: "Strenuous", days: 14, color: "#e63946", maxAlt: "5,364m", season: "Mar–May, Sep–Nov",
    start: [27.6869, 86.7314],
    waypoints: [
      [27.6869,86.7314],[27.7333,86.7167],[27.7667,86.7167],[27.8067,86.7133],
      [27.8333,86.7667],[27.8500,86.7667],[27.8667,86.7667],[27.8833,86.7833],
      [27.9167,86.7667],[27.9500,86.8000],[27.9833,86.8333],[28.0026,86.8528]
    ],
    stages: ["Lukla (2,860m)","Phakding (2,610m)","Namche (3,440m)","Tengboche (3,867m)","Dingboche (4,410m)","Lobuche (4,940m)","EBC (5,364m)"],
  },
  {
    id: 2, name: "Annapurna Circuit", difficulty: "Moderate–Hard", days: 21, color: "#f97316", maxAlt: "5,416m", season: "Mar–May, Oct–Nov",
    start: [28.2167, 84.3833],
    waypoints: [
      [28.2167,84.3833],[28.2500,84.4167],[28.3167,84.5000],[28.4167,84.5833],
      [28.5000,84.5667],[28.5833,84.2333],[28.5167,83.9667],[28.4167,83.8667],
      [28.3500,83.8167],[28.2500,83.8000],[28.2167,83.9833]
    ],
    stages: ["Besisahar (760m)","Chame (2,710m)","Manang (3,519m)","Thorong La (5,416m)","Muktinath (3,800m)","Jomsom (2,720m)","Pokhara (827m)"],
  },
  {
    id: 3, name: "Langtang Valley", difficulty: "Moderate", days: 10, color: "#16a34a", maxAlt: "4,984m", season: "Mar–May, Sep–Nov",
    start: [28.2167, 85.5167],
    waypoints: [
      [28.2167,85.5167],[28.2500,85.5500],[28.2833,85.5833],[28.3167,85.6167],
      [28.3500,85.6500],[28.3833,85.6833],[28.4167,85.7167]
    ],
    stages: ["Syabrubesi (1,503m)","Lama Hotel (2,380m)","Langtang (3,430m)","Kyanjin Gompa (3,870m)","Tserko Ri (4,984m)"],
  },
  {
    id: 4, name: "Gokyo Lakes", difficulty: "Strenuous", days: 12, color: "#2563b0", maxAlt: "5,483m", season: "Mar–May, Sep–Nov",
    start: [27.6869, 86.7314],
    waypoints: [
      [27.6869,86.7314],[27.7333,86.7167],[27.8067,86.7133],[27.8500,86.7167],
      [27.9000,86.7000],[27.9333,86.6833],[27.9667,86.6833],[28.0000,86.6833]
    ],
    stages: ["Lukla (2,860m)","Namche (3,440m)","Dole (4,200m)","Machhermo (4,470m)","Gokyo (4,790m)","Gokyo Ri (5,483m)"],
  },
  {
    id: 5, name: "Poon Hill Trek", difficulty: "Easy–Moderate", days: 5, color: "#8b5cf6", maxAlt: "3,210m", season: "Year-round",
    start: [28.3833, 83.6667],
    waypoints: [
      [28.3833,83.6667],[28.3667,83.6833],[28.3500,83.7000],[28.3667,83.7167],[28.4000,83.7000]
    ],
    stages: ["Nayapul (1,070m)","Tikhedhunga (1,540m)","Ghorepani (2,874m)","Poon Hill (3,210m)","Tadapani (2,630m)"],
  },
  {
    id: 6, name: "Manaslu Circuit", difficulty: "Hard", days: 17, color: "#0891b2", maxAlt: "5,106m", season: "Sep–Nov",
    start: [28.1667, 84.6333],
    waypoints: [
      [28.1667,84.6333],[28.3000,84.7167],[28.4333,84.7833],[28.5500,84.7167],
      [28.6333,84.8333],[28.6500,84.6167],[28.5833,84.4833],[28.4833,84.3833],[28.3500,84.3167]
    ],
    stages: ["Soti Khola (700m)","Jagat (1,340m)","Deng (1,804m)","Namrung (2,630m)","Samagaon (3,530m)","Larkya La (5,106m)","Bimthang (3,720m)"],
  },
  {
    id: 7, name: "Upper Mustang Trek", difficulty: "Moderate", days: 14, color: "#d97706", maxAlt: "4,000m", season: "Mar–Nov",
    start: [28.4167, 83.8167],
    waypoints: [
      [28.4167,83.8167],[28.5000,83.8500],[28.6167,83.8833],[28.7333,83.9167],
      [28.8500,83.9333],[28.9833,83.9500],[29.1833,83.9667]
    ],
    stages: ["Jomsom (2,720m)","Kagbeni (2,810m)","Chele (3,050m)","Syangboche (3,800m)","Ghami (3,520m)","Lo Manthang (3,840m)"],
  },
];

const LOCATIONS = [
  { id: 1,  name: "Kathmandu",          type: "city",       lat: 27.7172, lng: 85.3240, icon: "🏙️", desc: "Capital city — Thamel, Durbar Square, Boudhanath", elev: "1,400m" },
  { id: 2,  name: "Pokhara",            type: "city",       lat: 28.2096, lng: 83.9856, icon: "🏞️", desc: "Adventure capital — Phewa Lake, Annapurna views", elev: "827m" },
  { id: 3,  name: "Lukla Airport",      type: "airport",    lat: 27.6869, lng: 86.7314, icon: "✈️", desc: "Gateway to Everest — world's most thrilling airstrip", elev: "2,860m" },
  { id: 4,  name: "Namche Bazaar",      type: "town",       lat: 27.8067, lng: 86.7133, icon: "🏘️", desc: "Sherpa capital — last major stop before EBC", elev: "3,440m" },
  { id: 5,  name: "Everest Base Camp",  type: "peak",       lat: 28.0026, lng: 86.8528, icon: "🏔️", desc: "5,364m — foot of the world's highest mountain", elev: "5,364m" },
  { id: 6,  name: "Annapurna BC",       type: "peak",       lat: 28.5333, lng: 83.8667, icon: "🗻", desc: "4,130m — surrounded by 7,000m+ peaks", elev: "4,130m" },
  { id: 7,  name: "Lumbini",            type: "heritage",   lat: 27.4833, lng: 83.2767, icon: "🕌", desc: "Birthplace of Buddha — UNESCO World Heritage", elev: "100m" },
  { id: 8,  name: "Chitwan NP",         type: "wildlife",   lat: 27.5291, lng: 84.3542, icon: "🦏", desc: "Rhinos, tigers, elephants — UNESCO World Heritage", elev: "100m" },
  { id: 9,  name: "Lo Manthang",        type: "heritage",   lat: 29.1833, lng: 83.9667, icon: "🏜️", desc: "Walled capital of Upper Mustang — forbidden kingdom", elev: "3,840m" },
  { id: 10, name: "Tengboche Monastery",type: "monastery",  lat: 27.8367, lng: 86.7633, icon: "🙏", desc: "Most famous monastery in the Everest region", elev: "3,867m" },
  { id: 11, name: "Patan Durbar Sq.",   type: "heritage",   lat: 27.6762, lng: 85.3172, icon: "🏛️", desc: "Finest Newari architecture — UNESCO World Heritage", elev: "1,337m" },
  { id: 12, name: "Bhaktapur",          type: "heritage",   lat: 27.6722, lng: 85.4278, icon: "🏯", desc: "Best-preserved medieval city in Nepal", elev: "1,401m" },
  { id: 13, name: "Gokyo Lakes",        type: "peak",       lat: 27.9667, lng: 86.6833, icon: "🏞️", desc: "4,790m — stunning turquoise glacial lakes", elev: "4,790m" },
  { id: 14, name: "Jomsom",             type: "airport",    lat: 28.7833, lng: 83.7333, icon: "✈️", desc: "Gateway to Mustang — windy mountain airstrip", elev: "2,720m" },
  { id: 15, name: "Bardia NP",          type: "wildlife",   lat: 28.3667, lng: 81.5000, icon: "🐯", desc: "Nepal's largest park — highest tiger density", elev: "150m" },
  { id: 16, name: "Gosaikunda Lake",    type: "monastery",  lat: 28.0833, lng: 85.4167, icon: "🌊", desc: "Sacred glacial lake at 4,380m — Hindu pilgrimage", elev: "4,380m" },
  { id: 17, name: "Nagarkot",           type: "city",       lat: 27.7167, lng: 85.5167, icon: "🌄", desc: "Best Himalayan sunrise viewpoint near Kathmandu", elev: "2,195m" },
  { id: 18, name: "Rara Lake",          type: "peak",       lat: 29.5167, lng: 82.0833, icon: "💎", desc: "Nepal's largest lake — remote paradise in Karnali", elev: "2,990m" },
];

const TRANSPORT = [
  { from: "Kathmandu", to: "Pokhara",   type: "✈️ Flight",    duration: "25 min",  cost: "$80–120",  note: "Buddha Air / Yeti Airlines" },
  { from: "Kathmandu", to: "Pokhara",   type: "🚌 Bus",       duration: "6–7 hrs", cost: "$10–20",   note: "Greenline / Prithvi Highway" },
  { from: "Kathmandu", to: "Lukla",     type: "✈️ Flight",    duration: "35 min",  cost: "$180–220", note: "Tara Air / Summit Air" },
  { from: "Pokhara",   to: "Jomsom",    type: "✈️ Flight",    duration: "20 min",  cost: "$140–180", note: "Tara Air — scenic mountain flight" },
  { from: "Kathmandu", to: "Chitwan",   type: "🚌 Bus",       duration: "4–5 hrs", cost: "$8–15",    note: "Tourist bus via Prithvi Hwy" },
  { from: "Kathmandu", to: "Lumbini",   type: "🚌 Bus",       duration: "6–7 hrs", cost: "$10–18",   note: "Via Bhairahawa" },
  { from: "Pokhara",   to: "Ghandruk",  type: "🚙 Jeep",      duration: "3–4 hrs", cost: "$15–25",   note: "Annapurna foothills access" },
  { from: "Kathmandu", to: "Syabrubesi",type: "🚙 Jeep",      duration: "7–8 hrs", cost: "$20–30",   note: "Langtang Valley access" },
  { from: "Kathmandu", to: "Nagarkot",  type: "🚙 Taxi/Bus",  duration: "1.5 hrs", cost: "$8–15",    note: "Sunrise viewpoint day trip" },
  { from: "Kathmandu", to: "Bhaktapur", type: "🚌 Bus",       duration: "45 min",  cost: "$1–3",     note: "Local bus from Ratna Park" },
];

/* Map component using Leaflet via CDN (loaded in index.html) */
function LeafletMap({ selectedRoute, locations, onLocationClick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    if (!window.L || mapInstance.current) return;

    // Initialize map centered on Nepal
    mapInstance.current = window.L.map(mapRef.current, {
      center: [28.1, 84.1],
      zoom: 7,
      zoomControl: false,
    });

    // Add zoom control on the right
    window.L.control.zoom({ position: "topright" }).addTo(mapInstance.current);

    // Tile layer - CartoDB dark
    window.L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> &copy; <a href="https://carto.com">CARTO</a>',
      maxZoom: 19,
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Add route lines
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    layersRef.current.forEach(l => l.remove());
    layersRef.current = [];

    const route = TREKKING_ROUTES.find(r => r.id === selectedRoute);
    if (route) {
      // Main route line
      const line = window.L.polyline(route.waypoints.map(w => [w[0], w[1]]), {
        color: route.color, weight: 5, opacity: 0.9, dashArray: "10,5",
        lineCap: "round", lineJoin: "round",
      }).addTo(mapInstance.current);
      layersRef.current.push(line);

      // Glow effect line underneath
      const glow = window.L.polyline(route.waypoints.map(w => [w[0], w[1]]), {
        color: route.color, weight: 12, opacity: 0.18,
      }).addTo(mapInstance.current);
      layersRef.current.push(glow);

      // Start marker
      const startIcon = window.L.divIcon({
        html: `<div style="background:${route.color};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
        className: "", iconSize: [16, 16], iconAnchor: [8, 8],
      });
      const startMarker = window.L.marker(route.start, { icon: startIcon })
        .bindPopup(`<div class="map-popup-title">🚩 ${route.name}</div><div class="map-popup-sub">${route.days} days · ${route.difficulty} · Max: ${route.maxAlt}</div><div class="map-popup-sub">Season: ${route.season}</div>`)
        .addTo(mapInstance.current);
      layersRef.current.push(startMarker);

      // End marker
      const endWp = route.waypoints[route.waypoints.length - 1];
      const endIcon = window.L.divIcon({
        html: `<div style="background:#fff;width:14px;height:14px;border-radius:50%;border:3px solid ${route.color};box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        className: "", iconSize: [14, 14], iconAnchor: [7, 7],
      });
      const endMarker = window.L.marker([endWp[0], endWp[1]], { icon: endIcon })
        .bindPopup(`<div class="map-popup-title">🏁 Summit / Goal</div><div class="map-popup-sub">Max altitude: ${route.maxAlt}</div>`)
        .addTo(mapInstance.current);
      layersRef.current.push(endMarker);

      // Stage markers (every other waypoint)
      route.waypoints.forEach((wp, i) => {
        if (i === 0 || i === route.waypoints.length - 1) return;
        if (i % 2 !== 0) return;
        const stageIcon = window.L.divIcon({
          html: `<div style="background:${route.color};width:8px;height:8px;border-radius:50%;border:2px solid white;opacity:0.85"></div>`,
          className: "", iconSize: [8, 8], iconAnchor: [4, 4],
        });
        const m = window.L.marker([wp[0], wp[1]], { icon: stageIcon })
          .addTo(mapInstance.current);
        layersRef.current.push(m);
      });

      mapInstance.current.fitBounds(line.getBounds(), { padding: [50, 50] });
    }
  }, [selectedRoute]);

  // Add location markers
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;
    locations.forEach(loc => {
      const icon = window.L.divIcon({
        html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));cursor:pointer">${loc.icon}</div>`,
        className: "",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const m = window.L.marker([loc.lat, loc.lng], { icon })
        .bindPopup(`<div class="map-popup-title">${loc.icon} ${loc.name}</div><div class="map-popup-sub">${loc.desc}</div>${loc.elev ? `<div class="map-popup-sub" style="margin-top:4px;color:#2563b0;font-weight:700">⛰️ ${loc.elev}</div>` : ""}`)
        .addTo(mapInstance.current);
      m.on("click", () => onLocationClick(loc));
    });
  }, [locations]);

  return (
    <div ref={mapRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
  );
}

/* Fallback if Leaflet not available */
function MapFallback({ selectedRoute }) {
  const route = TREKKING_ROUTES.find(r => r.id === selectedRoute);
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,var(--mountain-800),var(--mountain-900))", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, borderRadius: "inherit" }}>
      <div style={{ fontSize: "4rem" }}>🗺️</div>
      <div style={{ color: "#fff", fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "1.2rem" }}>Interactive Map</div>
      {route && (
        <div style={{ textAlign: "center", color: "rgba(255,255,255,0.65)", fontSize: "0.88rem" }}>
          <div style={{ color: route.color, fontWeight: 700, marginBottom: 4 }}>{route.name}</div>
          <div>{route.days} days · Max alt: {route.maxAlt}</div>
        </div>
      )}
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", marginTop: 8 }}>
        Loading map tiles...
      </div>
    </div>
  );
}

export default function InteractiveMapPage({ navigate }) {
  const [selectedRoute, setSelectedRoute] = useState(1);
  const [activeTab, setActiveTab] = useState("routes");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    // Check if Leaflet is available
    const check = setInterval(() => {
      if (window.L) { setLeafletLoaded(true); clearInterval(check); }
    }, 200);
    return () => clearInterval(check);
  }, []);

  const route = TREKKING_ROUTES.find(r => r.id === selectedRoute);

  const diffColor = {
    "Easy–Moderate": "var(--forest-500)",
    "Moderate": "var(--forest-600)",
    "Moderate–Hard": "var(--sunset-500)",
    "Hard": "var(--sunset-600)",
    "Strenuous": "var(--nepal-red)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,var(--mountain-900),var(--mountain-800))", padding: "90px 0 40px" }}>
        <div className="container">
          <div className="section-eyebrow" style={{ background: "rgba(255,255,255,0.08)", color: "var(--forest-300)", borderColor: "rgba(255,255,255,0.12)", marginBottom: 14 }}>
            🗺️ Interactive Trekking Map
          </div>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, color: "#fff", marginBottom: 12 }}>
            Plan Your Nepal Trek
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", maxWidth: 520 }}>
            Explore trekking routes, discover key destinations, and plan your transport — even with offline support.
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: "32px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

          {/* ── Sidebar ── */}
          <div>
            {/* Tabs */}
            <div className="dashboard-tabs" style={{ marginBottom: 16 }}>
              {["routes", "locations", "transport"].map(tab => (
                <button key={tab} className={`dashboard-tab${activeTab === tab ? " active" : ""}`} onClick={() => setActiveTab(tab)} style={{ textTransform: "capitalize" }}>
                  {tab === "routes" ? "🥾 Routes" : tab === "locations" ? "📍 Places" : "🚌 Transport"}
                </button>
              ))}
            </div>

            <div className="map-sidebar" style={{ height: "calc(100vh - 380px)", minHeight: 400, overflowY: "auto" }}>

              {/* Routes tab */}
              {activeTab === "routes" && (
                <div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Popular Trekking Routes
                  </div>
                  {TREKKING_ROUTES.map(r => (
                    <div key={r.id} className={`route-item${selectedRoute === r.id ? " active" : ""}`} onClick={() => setSelectedRoute(r.id)}>
                      <div className="route-dot" style={{ background: r.color }} />
                      <div style={{ flex: 1 }}>
                        <div className="route-name">{r.name}</div>
                        <div className="route-diff" style={{ color: diffColor[r.difficulty] || "var(--text4)" }}>{r.difficulty} · {r.days} days</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Locations tab */}
              {activeTab === "locations" && (
                <div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Key Destinations
                  </div>
                  {LOCATIONS.map(loc => (
                    <div key={loc.id} className={`route-item${selectedLocation?.id === loc.id ? " active" : ""}`} onClick={() => setSelectedLocation(loc)}>
                      <span style={{ fontSize: "1.2rem" }}>{loc.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div className="route-name">{loc.name}</div>
                        <div className="route-diff">{loc.desc}</div>
                      </div>
                      {loc.elev && <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--primary)", background: "var(--primary-glow)", padding: "2px 6px", borderRadius: 99, flexShrink: 0 }}>{loc.elev}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Transport tab */}
              {activeTab === "transport" && (
                <div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
                    Transport Connections
                  </div>
                  {TRANSPORT.map((t, i) => (
                    <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", border: "1px solid var(--card-border)", marginBottom: 8, background: "var(--surface-subtle)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                        <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.86rem", color: "var(--text)" }}>{t.from}</span>
                        <i className="fas fa-arrow-right" style={{ fontSize: "0.72rem", color: "var(--text4)" }} />
                        <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.86rem", color: "var(--text)" }}>{t.to}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                        <span className="badge badge-blue">{t.type}</span>
                        <span className="badge badge-green">{t.duration}</span>
                        <span className="badge badge-orange">{t.cost}</span>
                      </div>
                      {t.note && <div style={{ fontSize: "0.72rem", color: "var(--text4)", fontStyle: "italic" }}>{t.note}</div>}
                    </div>
                  ))}
                  <button className="btn btn-primary btn-sm w-full" style={{ marginTop: 8 }} onClick={() => navigate("transport")}>
                    Full Transport Guide <i className="fas fa-arrow-right" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Map Area ── */}
          <div>
            {/* Route info card */}
            {activeTab === "routes" && route && (
              <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-xl)", padding: "16px 20px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: route.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: "var(--text)" }}>{route.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-blue"><i className="fas fa-clock" /> {route.days} days</span>
                    <span className="badge" style={{ background: `${route.color}15`, color: route.color, border: `1px solid ${route.color}30` }}>{route.difficulty}</span>
                    <span className="badge badge-green"><i className="fas fa-mountain" /> {route.maxAlt}</span>
                    <span className="badge badge-gold"><i className="fas fa-calendar" /> {route.season}</span>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate("ai-itinerary")}>
                    Plan This <i className="fas fa-arrow-right" />
                  </button>
                </div>
                {/* Stage breakdown */}
                {route.stages && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingTop: 10, borderTop: "1px solid var(--card-border)" }}>
                    {route.stages.map((s, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: "var(--radius-full)", background: `${route.color}12`, border: `1px solid ${route.color}25`, fontSize: "0.72rem", fontWeight: 600, color: "var(--text3)" }}>
                        <span style={{ color: route.color, fontWeight: 800 }}>{i + 1}</span> {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Map container */}
            <div className="map-container" style={{ height: "calc(100vh - 380px)", minHeight: 480 }}>
              {leafletLoaded ? (
                <LeafletMap
                  selectedRoute={selectedRoute}
                  locations={LOCATIONS}
                  onLocationClick={setSelectedLocation}
                />
              ) : (
                <MapFallback selectedRoute={selectedRoute} />
              )}
            </div>

            {/* Location detail popup */}
            {selectedLocation && (
              <div style={{ marginTop: 14, background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-xl)", padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: "2rem" }}>{selectedLocation.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{selectedLocation.name}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text4)" }}>{selectedLocation.desc}</div>
                  <span className="badge badge-blue" style={{ marginTop: 6 }}>{selectedLocation.type}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate("destinations")}>
                    Explore <i className="fas fa-arrow-right" />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedLocation(null)}>×</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom legend */}
        <div style={{ marginTop: 24, background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-xl)", padding: "16px 20px" }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: "0.82rem", color: "var(--text4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Map Legend</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { icon: "🏙️", label: "City" }, { icon: "✈️", label: "Airport" }, { icon: "🏔️", label: "Peak/Base Camp" },
              { icon: "🏘️", label: "Town" }, { icon: "🕌", label: "Heritage Site" }, { icon: "🦏", label: "Wildlife Area" },
              { icon: "🙏", label: "Monastery" }, { icon: "---", label: "Trekking Route" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", color: "var(--text3)" }}>
                {item.icon === "---" ? (
                  <div style={{ width: 24, height: 3, background: "var(--primary)", borderRadius: 2 }} />
                ) : (
                  <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                )}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          .map-page-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
