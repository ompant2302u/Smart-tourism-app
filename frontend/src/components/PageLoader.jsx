import { useEffect, useState } from "react";

export default function PageLoader() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1100);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;

  return (
    <div className="page-loader">
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 8, animation: "float 1.2s ease-in-out infinite" }}>🏔️</div>
        <div className="loader-logo" style={{ justifyContent: "center", marginBottom: 24 }}>
          Tour Tech
        </div>
      </div>
      <div className="loader-spinner" />
      <div className="loader-progress">
        <div className="loader-bar" />
      </div>
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 8 }}>
        Loading your Nepal experience...
      </div>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);} }
      `}</style>
    </div>
  );
}
