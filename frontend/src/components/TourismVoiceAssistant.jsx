import { useConversation, useConversationClientTool } from "@elevenlabs/react";
import { useState, useRef, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_4901kmv3tab6ep6rdxhz84fcywk5";

async function callAIChat(message, history) {
  const res = await fetch(`${BASE}/ai-chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error("Chat API error");
  return res.json();
}

function AssistantInner({ navigate, open, setOpen }) {
  const [tab, setTab]           = useState("chat");
  const [input, setInput]       = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Namaste! 🏔️ Ask me anything about Nepal — treks, hotels, visa, budget, or just say where you want to go." },
  ]);
  const msgEnd   = useRef(null);
  const transEnd = useRef(null);
  // Prevent double-call to endSession
  const endingRef = useRef(false);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { transEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [transcript]);

  // ── Client tools — all tools registered on the agent ─────────────────────
  // Navigation tools
  useConversationClientTool("goHome",              useCallback(() => { navigate("home");            return "ok"; }, [navigate]));
  useConversationClientTool("openDestinations",    useCallback(() => { navigate("destinations");    return "ok"; }, [navigate]));
  useConversationClientTool("openHotels",          useCallback(() => { navigate("hotels");          return "ok"; }, [navigate]));
  useConversationClientTool("openGuides",          useCallback(() => { navigate("guides");          return "ok"; }, [navigate]));
  useConversationClientTool("openSafety",          useCallback(() => { navigate("safety");          return "ok"; }, [navigate]));
  useConversationClientTool("openTransport",       useCallback(() => { navigate("transport");       return "ok"; }, [navigate]));
  useConversationClientTool("openAIItinerary",     useCallback(() => { navigate("ai-itinerary");    return "ok"; }, [navigate]));
  useConversationClientTool("openBudgetEstimator", useCallback(() => { navigate("estimator");       return "ok"; }, [navigate]));
  useConversationClientTool("openInteractiveMap",  useCallback(() => { navigate("interactive-map"); return "ok"; }, [navigate]));
  useConversationClientTool("openAbout",           useCallback(() => { navigate("about");           return "ok"; }, [navigate]));
  useConversationClientTool("openContact",         useCallback(() => { navigate("contact");         return "ok"; }, [navigate]));
  useConversationClientTool("openProfile",         useCallback(() => { navigate("profile");         return "ok"; }, [navigate]));
  useConversationClientTool("openActivity",        useCallback(() => { navigate("activity");        return "ok"; }, [navigate]));
  useConversationClientTool("searchSite",          useCallback(({ query } = {}) => { navigate("search", { q: query || "" }); return "ok"; }, [navigate]));

  // Data tools — navigate to relevant page and return data summary
  useConversationClientTool("getTopHotels",        useCallback(({ city } = {}) => {
    navigate("hotels");
    return city ? `Showing hotels in ${city}` : "Showing all hotels";
  }, [navigate]));
  useConversationClientTool("getTopDestinations",  useCallback(({ category, difficulty } = {}) => {
    navigate("destinations");
    return `Showing destinations${category ? ` for ${category}` : ""}${difficulty ? `, difficulty: ${difficulty}` : ""}`;
  }, [navigate]));
  useConversationClientTool("getTopGuides",        useCallback(({ category } = {}) => {
    navigate("guides");
    return category ? `Showing guides for ${category}` : "Showing all guides";
  }, [navigate]));
  useConversationClientTool("planTrip",            useCallback(({ category, difficulty } = {}) => {
    navigate("ai-itinerary");
    return `Opening AI Itinerary Planner${category ? ` for ${category} trip` : ""}`;
  }, [navigate]));
  useConversationClientTool("bookHotel",           useCallback(({ name } = {}) => {
    navigate("hotels");
    return name ? `Opening hotels page to book ${name}` : "Opening hotels page";
  }, [navigate]));
  useConversationClientTool("searchDestination",   useCallback(({ query, category } = {}) => {
    navigate("search", { q: query || category || "" });
    return `Searching for ${query || category || "destinations"}`;
  }, [navigate]));

  // ── Conversation — NO props passed so it never auto-connects ──────────────
  const conversation = useConversation({
    onMessage: useCallback(({ message, role }) => {
      if (!message) return;
      const r = role === "agent" ? "ai" : "user";
      setTranscript(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === r) {
          return [...prev.slice(0, -1), { role: r, text: last.text + " " + message }];
        }
        return [...prev, { role: r, text: message }];
      });
    }, []),
    onError: useCallback((error) => {
      const msg = typeof error === "string" ? error : (error?.message || "Voice connection error.");
      setVoiceError(msg);
      endingRef.current = false;
    }, []),
    onDisconnect: useCallback(() => {
      endingRef.current = false;
    }, []),
  });

  const { status, isSpeaking } = conversation;
  const isConnected  = status === "connected";
  const isConnecting = status === "connecting";

  // ── Voice controls ────────────────────────────────────────────────────────
  const startVoice = useCallback(() => {
    if (isConnected || isConnecting) return;
    setVoiceError("");
    setTranscript([]);
    endingRef.current = false;
    conversation.startSession({
      agentId: AGENT_ID,
      // Keep session alive — don't auto-end after one exchange
      overrides: {
        agent: {
          turn: {
            turn_timeout: 30,
            mode: "turn",
          },
        },
      },
    });
  }, [conversation, isConnected, isConnecting]);

  const stopVoice = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    // Interrupt AI speech immediately, then end session
    try { conversation.sendUserActivity(); } catch {}
    conversation.endSession();
  }, [conversation]);

  // Save transcript to localStorage history when session ends
  const saveHistory = useCallback((t) => {
    if (!t.length) return;
    const sessions = JSON.parse(localStorage.getItem("nw-voice-history") || "[]");
    sessions.unshift({ date: new Date().toISOString(), messages: t });
    localStorage.setItem("nw-voice-history", JSON.stringify(sessions.slice(0, 50)));
  }, []);

  useEffect(() => {
    if (status === "disconnected" && transcript.length > 0) {
      saveHistory(transcript);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (status !== "disconnected") conversation.endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Text chat ─────────────────────────────────────────────────────────────
  const send = useCallback(async (override) => {
    const q = (override ?? input).trim();
    if (!q || isTyping) return;
    setInput("");
    setMessages(p => [...p, { role: "user", text: q }]);
    setIsTyping(true);
    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.text }));
    try {
      const { reply, action } = await callAIChat(q, history);
      setMessages(p => [...p, { role: "ai", text: reply }]);
      if (action?.type === "navigate") setTimeout(() => navigate(action.page, action.params || {}), 500);
    } catch {
      setMessages(p => [...p, { role: "ai", text: "Server is unavailable or still starting up. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, navigate]);

  // ── Orb style ─────────────────────────────────────────────────────────────
  const orbBg = isConnected
    ? isSpeaking ? "linear-gradient(135deg,#ec4899,#8b5cf6)" : "linear-gradient(135deg,#22c55e,#16a34a)"
    : isConnecting ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "rgba(255,255,255,.08)";
  const orbAnim = isConnected
    ? isSpeaking ? "orb-speak 1s ease-in-out infinite" : "orb-listen 2s ease-in-out infinite"
    : "none";
  const voiceLabel = isConnecting ? "Connecting…"
    : isConnected ? (isSpeaking ? "🔊 AI Speaking" : "🎙️ Listening…")
    : "Voice Assistant";

  return (
    <>
      <style>{`
        @keyframes btn-pulse{0%,100%{box-shadow:0 6px 24px rgba(99,102,241,.5),0 0 0 0 rgba(99,102,241,.35);}50%{box-shadow:0 6px 24px rgba(236,72,153,.6),0 0 0 10px rgba(99,102,241,0);}}
        @keyframes slide-up{from{opacity:0;transform:translateY(20px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes orb-listen{0%,100%{box-shadow:0 0 0 12px rgba(34,197,94,.2),0 0 0 24px rgba(34,197,94,.07);}50%{box-shadow:0 0 0 20px rgba(34,197,94,.12),0 0 0 40px rgba(34,197,94,.04);}}
        @keyframes orb-speak{0%,100%{box-shadow:0 0 0 8px rgba(236,72,153,.3),0 0 0 18px rgba(139,92,246,.12);}50%{box-shadow:0 0 0 18px rgba(236,72,153,.2),0 0 0 36px rgba(139,92,246,.06);}}
        @keyframes dot{0%,80%,100%{transform:scale(.55);opacity:.4;}40%{transform:scale(1);opacity:1;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        .nw-scr::-webkit-scrollbar{width:3px;}
        .nw-scr::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px;}
      `}</style>

      {/* Floating button */}
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="AI assistant" style={{
          position:"fixed",right:20,bottom:24,width:56,height:56,borderRadius:"50%",
          border:"none",background:"linear-gradient(135deg,#6366f1,#ec4899)",
          animation:"btn-pulse 2.5s ease-in-out infinite",
          color:"#fff",fontSize:22,cursor:"pointer",zIndex:9999,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          🤖
          <span style={{position:"absolute",top:0,right:0,width:12,height:12,borderRadius:"50%",background:"#22c55e",border:"2px solid #111"}}/>
        </button>
      )}

      {/* Global End Chat button — visible when voice is active and panel is closed */}
      {!open && isConnected && (
        <button onClick={stopVoice} aria-label="End voice chat" style={{
          position:"fixed",right:84,bottom:24,padding:"0 16px",height:40,borderRadius:20,
          border:"1px solid rgba(239,68,68,.5)",background:"rgba(239,68,68,.15)",
          color:"#fca5a5",fontSize:12,fontWeight:700,cursor:"pointer",zIndex:9999,
          display:"flex",alignItems:"center",gap:6,backdropFilter:"blur(8px)",
          boxShadow:"0 4px 14px rgba(239,68,68,.3)",
        }}>
          ■ End Chat
        </button>
      )}

      {/* Panel */}
      {open && (
        <div style={{
          position:"fixed",right:16,bottom:20,width:370,maxWidth:"calc(100vw - 24px)",
          borderRadius:24,overflow:"hidden",zIndex:9999,
          background:"#13111e",
          border:"1px solid rgba(255,255,255,.1)",
          boxShadow:"0 24px 64px rgba(0,0,0,.7),0 0 0 1px rgba(99,102,241,.2)",
          color:"#fff",display:"flex",flexDirection:"column",
          maxHeight:"calc(100vh - 36px)",
          animation:"slide-up .25s ease-out",
        }}>

          {/* Top gradient bar */}
          <div style={{height:3,background:"linear-gradient(90deg,#f59e0b,#ec4899,#6366f1,#06b6d4)",flexShrink:0}}/>

          {/* Header */}
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{
                width:36,height:36,borderRadius:"50%",flexShrink:0,
                background:"linear-gradient(135deg,#6366f1,#ec4899)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
              }}>🤖</div>
              <div>
                <div style={{fontWeight:700,fontSize:14}}>Nepal AI Guide</div>
                <div style={{fontSize:10,opacity:.5,marginTop:1}}>
                  {isConnected ? (isSpeaking ? "🔊 speaking" : "🎙️ listening") : "Ask me anything about Nepal"}
                </div>
              </div>
            </div>
            <button onClick={() => { stopVoice(); setOpen(false); }} style={{
              width:28,height:28,borderRadius:"50%",border:"1px solid rgba(255,255,255,.12)",
              background:"rgba(255,255,255,.06)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:13,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,.07)",flexShrink:0}}>
            {[["chat","💬 Chat"],["voice","🎙️ Voice"],["history","🕘 History"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{
                flex:1,padding:"10px 0",border:"none",
                background:"transparent",color:"#fff",
                fontWeight:700,fontSize:11,cursor:"pointer",
                borderBottom: tab===t ? "2px solid #6366f1" : "2px solid transparent",
                opacity: tab===t ? 1 : .45,
              }}>{l}</button>
            ))}
          </div>

          {/* ── CHAT ── */}
          {tab==="chat" && (<>
            <div className="nw-scr" style={{flex:1,overflowY:"auto",padding:"12px 14px",minHeight:0,display:"flex",flexDirection:"column",gap:8}}>
              {messages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:6}}>
                  {m.role==="ai"&&<span style={{fontSize:14,marginBottom:2}}>🤖</span>}
                  <div style={{
                    maxWidth:"82%",padding:"8px 12px",
                    borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                    background:m.role==="user"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,.08)",
                    fontSize:13,lineHeight:1.6,whiteSpace:"pre-wrap",
                    border:m.role==="ai"?"1px solid rgba(255,255,255,.08)":"none",
                  }}>{m.text}</div>
                </div>
              ))}
              {isTyping&&(
                <div style={{display:"flex",alignItems:"flex-end",gap:6}}>
                  <span style={{fontSize:14}}>🤖</span>
                  <div style={{padding:"10px 14px",borderRadius:"16px 16px 16px 4px",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.08)",display:"flex",gap:5,alignItems:"center"}}>
                    {[0,1,2].map(i=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:"rgba(255,255,255,.6)",display:"inline-block",animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}
                  </div>
                </div>
              )}
              <div ref={msgEnd}/>
            </div>

            <div style={{padding:"10px 14px 12px",borderTop:"1px solid rgba(255,255,255,.07)",flexShrink:0,display:"flex",gap:8}}>
              <input
                value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
                placeholder="Ask about Nepal…"
                disabled={isTyping}
                style={{
                  flex:1,padding:"9px 13px",borderRadius:12,
                  border:"1px solid rgba(255,255,255,.1)",
                  background:"rgba(255,255,255,.06)",color:"#fff",
                  fontSize:13,outline:"none",fontFamily:"inherit",
                }}
              />
              <button onClick={()=>send()} disabled={isTyping||!input.trim()} style={{
                width:38,height:38,borderRadius:"50%",border:"none",
                background:isTyping||!input.trim()?"rgba(255,255,255,.1)":"linear-gradient(135deg,#6366f1,#ec4899)",
                color:"#fff",cursor:isTyping||!input.trim()?"not-allowed":"pointer",
                fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
              }}>
                {isTyping
                  ? <span style={{width:14,height:14,border:"2px solid #fff",borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}}/>
                  : "➤"}
              </button>
            </div>
          </>)}

          {/* ── VOICE ── */}
          {tab==="voice" && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px 20px",gap:16}}>
              {/* Orb */}
              <div style={{
                width:100,height:100,borderRadius:"50%",
                background:orbBg,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:40,animation:orbAnim,
                border:"2px solid rgba(255,255,255,.1)",
                transition:"background .3s",
              }}>
                {isConnecting
                  ? <span style={{display:"flex",gap:4}}>{[0,1,2].map(i=><span key={i} style={{width:8,height:8,borderRadius:"50%",background:"#fff",display:"inline-block",animation:`dot 1.2s ${i*.2}s ease-in-out infinite`}}/>)}</span>
                  : "🎙️"
                }
              </div>

              {/* Label */}
              <div style={{textAlign:"center"}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{voiceLabel}</div>
                <div style={{fontSize:12,opacity:.5,lineHeight:1.6,maxWidth:280}}>
                  {isConnected
                    ? "Speak naturally. I can answer questions and navigate any page for you."
                    : voiceError || "Start voice to talk with your AI Nepal guide."}
                </div>
                {voiceError && <div style={{marginTop:6,fontSize:11,color:"#fca5a5"}}>{voiceError}</div>}
              </div>

              {/* Transcript area */}
              {transcript.length > 0 && (
                <div className="nw-scr" style={{
                  width:"100%",maxHeight:140,overflowY:"auto",
                  borderRadius:12,padding:"10px 12px",
                  background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",
                  display:"flex",flexDirection:"column",gap:6,
                }}>
                  {transcript.map((m,i)=>(
                    <div key={i} style={{
                      fontSize:12,lineHeight:1.5,
                      color: m.role==="ai" ? "rgba(255,255,255,.9)" : "rgba(167,139,250,.9)",
                      textAlign: m.role==="ai" ? "left" : "right",
                    }}>
                      <span style={{fontWeight:700,opacity:.6}}>{m.role==="ai"?"🤖 AI: ":"🧑 You: "}</span>
                      {m.text}
                    </div>
                  ))}
                  <div ref={transEnd}/>
                </div>
              )}

              {/* Buttons */}
              <div style={{display:"flex",gap:8,width:"100%"}}>
                <button onClick={startVoice} disabled={isConnecting||isConnected} style={{
                  flex:1,padding:"12px",borderRadius:12,border:"none",
                  background:isConnecting||isConnected?"rgba(255,255,255,.08)":"linear-gradient(135deg,#facc15,#f59e0b)",
                  color:isConnecting||isConnected?"rgba(255,255,255,.35)":"#1a1a1a",
                  fontWeight:700,fontSize:13,cursor:isConnecting||isConnected?"not-allowed":"pointer",
                  boxShadow:isConnecting||isConnected?"none":"0 4px 14px rgba(245,158,11,.4)",
                }}>
                  {isConnecting ? "Connecting…" : isConnected ? "● Live" : "▶ Start Voice"}
                </button>
                <button onClick={stopVoice} disabled={!isConnected&&!isConnecting} style={{
                  flex:1,padding:"12px",borderRadius:12,
                  border:isConnected?"1px solid rgba(239,68,68,.35)":"1px solid rgba(255,255,255,.1)",
                  background:isConnected?"rgba(239,68,68,.12)":"rgba(255,255,255,.04)",
                  color:isConnected?"#fca5a5":"rgba(255,255,255,.3)",
                  fontWeight:700,fontSize:13,cursor:isConnected||isConnecting?"pointer":"not-allowed",
                }}>
                  ■ End Call
                </button>
              </div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {tab==="history" && <HistoryPanel />}

        </div>
      )}
    </>
  );
}

function HistoryPanel() {
  const [sessions, setSessions] = useState(() =>
    JSON.parse(localStorage.getItem("nw-voice-history") || "[]")
  );
  const [open, setOpen] = useState(null);

  const del = (i) => {
    const u = sessions.filter((_,idx) => idx !== i);
    setSessions(u);
    localStorage.setItem("nw-voice-history", JSON.stringify(u));
    if (open === i) setOpen(null);
  };

  if (!sessions.length) return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,gap:10,opacity:.6}}>
      <span style={{fontSize:32}}>🎙️</span>
      <span style={{fontSize:13,fontWeight:600}}>No voice chats saved yet</span>
      <span style={{fontSize:11,opacity:.7,textAlign:"center"}}>Start a voice session — it saves automatically when you end the call.</span>
    </div>
  );

  return (
    <div className="nw-scr" style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:11,opacity:.5,fontWeight:600}}>{sessions.length} session{sessions.length!==1?"s":""}</span>
        <button onClick={()=>{setSessions([]);localStorage.removeItem("nw-voice-history");setOpen(null);}} style={{fontSize:10,padding:"3px 8px",borderRadius:6,border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.08)",color:"#fca5a5",cursor:"pointer",fontWeight:700}}>Clear all</button>
      </div>
      {sessions.map((s,i) => {
        const d = new Date(s.date);
        const label = d.toLocaleDateString(undefined,{month:"short",day:"numeric"}) + " " + d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"});
        return (
          <div key={i} style={{borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",overflow:"hidden"}}>
            <div onClick={()=>setOpen(open===i?null:i)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",cursor:"pointer"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:10,opacity:.5,marginBottom:2}}>{label} · {s.messages.length} msgs</div>
                <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.messages[0]?.text?.slice(0,60)||"Voice session"}</div>
              </div>
              <div style={{display:"flex",gap:6,marginLeft:8,flexShrink:0}}>
                <button onClick={e=>{e.stopPropagation();del(i);}} style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.08)",color:"#fca5a5",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                <span style={{opacity:.4,fontSize:11}}>{open===i?"▲":"▼"}</span>
              </div>
            </div>
            {open===i && (
              <div style={{borderTop:"1px solid rgba(255,255,255,.06)",padding:"8px 12px",display:"flex",flexDirection:"column",gap:6,maxHeight:200,overflowY:"auto"}}>
                {s.messages.map((m,j)=>(
                  <div key={j} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                    <div style={{maxWidth:"85%",padding:"6px 10px",borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",background:m.role==="user"?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,.08)",fontSize:11,lineHeight:1.5}}>
                      <span style={{opacity:.5,fontSize:9,display:"block",marginBottom:1}}>{m.role==="ai"?"🤖":"🧑"}</span>
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
  );
}

export default function TourismVoiceAssistant({ navigate }) {
  const [open, setOpen] = useState(false);
  return <AssistantInner navigate={navigate} open={open} setOpen={setOpen} />;
}
