import React, { useState, useEffect } from "react";
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, Loader2,
  Video, BarChart3, CheckCircle2, Users, TrendingUp, Zap,
} from "lucide-react";

/* ─── Keyframe animations ──────────────────────────────────────────────── */
const STYLES = `
@keyframes dm-float3d {
  0%,100% { transform: perspective(1000px) rotateX(10deg) rotateY(-12deg) translateY(0px); }
  50%      { transform: perspective(1000px) rotateX(10deg) rotateY(-12deg) translateY(-18px); }
}
@keyframes dm-floatA {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-11px); }
}
@keyframes dm-floatB {
  0%,100% { transform: translateY(-7px); }
  50%      { transform: translateY(9px); }
}
@keyframes dm-floatC {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-8px); }
}
@keyframes dm-glow {
  0%,100% { box-shadow: 0 0 30px rgba(242,106,33,0.22), 0 12px 60px rgba(0,0,0,0.55); }
  50%      { box-shadow: 0 0 55px rgba(242,106,33,0.42), 0 12px 80px rgba(0,0,0,0.55); }
}
@keyframes dm-fadeUp {
  from { opacity:0; transform:translateY(22px); }
  to   { opacity:1; transform:translateY(0);    }
}
@keyframes dm-barFill { from { width:0%; } }
@keyframes dm-ring {
  0%   { transform:scale(1); opacity:0.9; }
  100% { transform:scale(2.6); opacity:0; }
}
@keyframes dm-scan {
  0%  { top:0%;   opacity:0.55; }
  90% { opacity:0.35; }
  100%{ top:100%; opacity:0; }
}
@keyframes dm-dotBlink {
  0%,100% { opacity:1; }
  50%     { opacity:0.25; }
}
@keyframes dm-orbit {
  0%   { transform: rotate(0deg)   translateX(22px) rotate(0deg);   }
  100% { transform: rotate(360deg) translateX(22px) rotate(-360deg); }
}

/* component classes */
.dm-card3d  { animation: dm-float3d 6s ease-in-out infinite; }
.dm-chipA   { animation: dm-floatA  4.2s ease-in-out infinite; }
.dm-chipB   { animation: dm-floatB  3.8s ease-in-out infinite; }
.dm-chipC   { animation: dm-floatC  5s   ease-in-out 0.7s infinite; }
.dm-glow    { animation: dm-glow    3.2s ease-in-out infinite; }
.dm-bar     { animation: dm-barFill 2s cubic-bezier(.4,0,.2,1) forwards 1.2s; }
.dm-scan    { animation: dm-scan    3s linear infinite; }

.dm-in1 { opacity:0; animation:dm-fadeUp 0.65s ease forwards 0.1s; }
.dm-in2 { opacity:0; animation:dm-fadeUp 0.65s ease forwards 0.3s; }
.dm-in3 { opacity:0; animation:dm-fadeUp 0.65s ease forwards 0.5s; }
.dm-in4 { opacity:0; animation:dm-fadeUp 0.65s ease forwards 0.7s; }

/* live-ring pseudo */
.dm-live-dot { position:relative; display:inline-block; }
.dm-live-dot::after {
  content:'';
  position:absolute;
  inset:-2px;
  border-radius:9999px;
  border:2px solid #22c55e;
  animation: dm-ring 1.6s ease-out infinite;
}
.dm-dot-blink { animation: dm-dotBlink 0.9s ease-in-out infinite; }
`;

const DEMO_ACCOUNTS = [
  { email: "admin@decisionminds.com", name: "Admin User",   role: "Admin",     initials: "AU", bg: "#8B5CF6" },
  { email: "sarah@decisionminds.com", name: "Sarah Chen",   role: "Executive", initials: "SC", bg: "#3B82F6" },
  { email: "mike@decisionminds.com",  name: "Mike Johnson", role: "Manager",   initials: "MJ", bg: "#10B981" },
  { email: "alex@decisionminds.com",  name: "Alex Rivera",  role: "Member",    initials: "AR", bg: "#F59E0B" },
];

const MEETINGS = [
  { name: "Team Sync",      tag: "Analyzed",   tagC: "#4ade80", tagBg: "rgba(74,222,128,0.13)",  bar: 92, barC: "#4ade80"  },
  { name: "Product Review", tag: "Processing", tagC: "#60a5fa", tagBg: "rgba(96,165,250,0.13)",  bar: 58, barC: "#60a5fa"  },
  { name: "Strategy Call",  tag: "Queued",     tagC: "#fb923c", tagBg: "rgba(242,106,33,0.13)",  bar: 18, barC: "#F26A21"  },
];

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoSignUp: () => void;
  error?: string;
}

const LoginPage: React.FC<Props> = ({ onLogin, onGoSignUp, error }) => {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPwd,      setShowPwd]      = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [localError,   setLocalError]   = useState("");
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [animIn,       setAnimIn]       = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimIn(true), 60);
    return () => clearTimeout(t);
  }, []);

  const displayError = error || localError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (!email.trim())        { setLocalError("Email is required.");          return; }
    if (!email.includes("@")) { setLocalError("Please enter a valid email."); return; }
    setLoading(true);
    try   { await onLogin(email.trim(), password); }
    catch (err) { setLocalError(err instanceof Error ? err.message : "Login failed. Please try again."); }
    finally { setLoading(false); }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email); setPassword("demo"); setLocalError("");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <style>{STYLES}</style>

      {/* ════════════════ LEFT PANEL ════════════════ */}
      <div className="relative hidden h-full overflow-hidden lg:flex lg:w-[56%]">

        {/* Background layers */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(145deg,#060d20 0%,#0B1633 55%,#0e1f40 100%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 55% at 10% 20%,rgba(242,106,33,0.20) 0%,transparent 65%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 45% at 92% 82%,rgba(242,106,33,0.13) 0%,transparent 65%)" }} />
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.045) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
        }} />
        {/* Glow blobs */}
        <div className="absolute" style={{ top:-100, left:-100, width:350, height:350, borderRadius:"50%", background:"rgba(242,106,33,0.09)", filter:"blur(90px)", pointerEvents:"none" }} />
        <div className="absolute" style={{ bottom:-80, right:-80, width:300, height:300, borderRadius:"50%", background:"rgba(242,106,33,0.07)", filter:"blur(80px)", pointerEvents:"none" }} />

        {/* ── Inner content ── */}
        <div className="relative z-10 flex h-full w-full flex-col px-11 py-9">

          {/* Logo row */}
          <div className="dm-in1 flex items-center gap-3">
            <div style={{ width:38,height:38,borderRadius:10,background:"#F26A21",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 22px rgba(242,106,33,0.55)" }}>
              <Video size={16} color="#fff" />
            </div>
            <div>
              <p style={{ color:"#fff", fontSize:13, fontWeight:900, letterSpacing:"-0.02em" }}>Decision Minds</p>
              <p style={{ color:"#F26A21", fontSize:10 }}>Meeting Intelligence</p>
            </div>
            {/* Live badge */}
            <div className="ml-auto flex items-center gap-2 rounded-full px-3 py-1" style={{ background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.28)" }}>
              <span className="dm-live-dot" style={{ width:7,height:7,borderRadius:"50%",background:"#22c55e",display:"inline-block" }} />
              <span style={{ color:"#4ade80",fontSize:11,fontWeight:700 }}>Live</span>
            </div>
          </div>

          {/* Headline */}
          <div className="dm-in2 mt-7">
            <h2 style={{ color:"#fff",fontSize:"2rem",fontWeight:900,lineHeight:1.18,letterSpacing:"-0.03em" }}>
              Turn meetings into<br />
              <span style={{ color:"#F26A21",textShadow:"0 0 44px rgba(242,106,33,0.55)" }}>actionable intelligence</span>
            </h2>
            <p style={{ color:"rgba(255,255,255,0.58)",fontSize:12.5,marginTop:9,lineHeight:1.7,maxWidth:330 }}>
              AI extracts action items, tracks ownership &amp; deadlines — automatically from every meeting.
            </p>
          </div>

          {/* ─── 3D Dashboard Scene ─── */}
          <div className="dm-in3 relative mt-6 flex-1 min-h-0 overflow-hidden">

            {/* ── Main 3D Card ── */}
            <div
              className="dm-card3d dm-glow absolute"
              style={{
                top: "0%", left: "0%", width: "72%",
                maxHeight: "100%",
                background: "rgba(255,255,255,0.065)",
                border: "1px solid rgba(255,255,255,0.13)",
                borderRadius: 20,
                backdropFilter: "blur(22px)",
                overflow: "hidden",
              }}
            >
              {/* Animated scan line */}
              <div className="dm-scan absolute left-0 right-0 h-px" style={{ background:"linear-gradient(90deg,transparent 0%,rgba(242,106,33,0.7) 50%,transparent 100%)", zIndex:10, pointerEvents:"none" }} />

              {/* Card header */}
              <div style={{ padding:"13px 16px 11px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:8 }}>
                <div style={{ width:28,height:28,borderRadius:8,background:"rgba(242,106,33,0.18)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <BarChart3 size={13} color="#F26A21" />
                </div>
                <span style={{ color:"#fff",fontSize:12.5,fontWeight:700 }}>Meeting Dashboard</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="dm-dot-blink" style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block" }} />
                  <span style={{ color:"#4ade80",fontSize:9.5,fontWeight:700,letterSpacing:"0.05em" }}>LIVE</span>
                </div>
              </div>

              {/* Metrics strip */}
              <div style={{ display:"flex",padding:"11px 16px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label:"Meetings", value:"1,240", color:"#fb923c" },
                  { label:"Tasks",    value:"8,900", color:"#60a5fa" },
                  { label:"Accuracy", value:"94%",   color:"#4ade80" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ flex:1, textAlign:"center" }}>
                    <p style={{ color,fontSize:18,fontWeight:900,lineHeight:1 }}>{value}</p>
                    <p style={{ color:"rgba(255,255,255,0.42)",fontSize:9.5,marginTop:3 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Meeting rows */}
              <div style={{ padding:"10px 16px 12px",display:"flex",flexDirection:"column",gap:7 }}>
                {MEETINGS.map(({ name, tag, tagC, tagBg, bar, barC }) => (
                  <div key={name} style={{ background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"8px 11px" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5 }}>
                      <span style={{ color:"rgba(255,255,255,0.88)",fontSize:11,fontWeight:600 }}>{name}</span>
                      <span style={{ color:tagC,background:tagBg,fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:99,letterSpacing:"0.02em" }}>{tag}</span>
                    </div>
                    <div style={{ height:3,borderRadius:99,background:"rgba(255,255,255,0.07)",overflow:"hidden" }}>
                      <div className="dm-bar" style={{ height:"100%",borderRadius:99,background:barC,width:`${bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div style={{ padding:"8px 16px 11px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:7 }}>
                <Zap size={10} color="#F26A21" />
                <span style={{ color:"rgba(255,255,255,0.45)",fontSize:10 }}>AI analyzing 3 meetings…</span>
                <div className="ml-auto flex gap-1">
                  {[0, 0.25, 0.5].map((delay, i) => (
                    <span key={i} className="dm-dot-blink" style={{ width:4,height:4,borderRadius:"50%",background:"#F26A21",display:"inline-block",opacity:1,animationDelay:`${delay}s` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Floating chip: Tasks extracted (top-right) ── */}
            <div
              className="dm-chipA absolute"
              style={{
                top:"4%", right:"0%",
                background:"rgba(242,106,33,0.14)",
                border:"1px solid rgba(242,106,33,0.32)",
                borderRadius:13,
                backdropFilter:"blur(16px)",
                padding:"10px 13px",
                minWidth:126,
              }}
            >
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <CheckCircle2 size={12} color="#F26A21" />
                <span style={{ color:"#fb923c",fontSize:11,fontWeight:700 }}>24 Tasks Found</span>
              </div>
              <p style={{ color:"rgba(255,255,255,0.5)",fontSize:9.5,marginTop:3 }}>from last meeting</p>
            </div>

            {/* ── Floating chip: Members (middle-right) ── */}
            <div
              className="dm-chipB absolute"
              style={{
                top:"38%", right:"0%",
                background:"rgba(96,165,250,0.12)",
                border:"1px solid rgba(96,165,250,0.28)",
                borderRadius:13,
                backdropFilter:"blur(16px)",
                padding:"9px 12px",
                minWidth:126,
              }}
            >
              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                <Users size={11} color="#60a5fa" />
                <span style={{ color:"#93c5fd",fontSize:11,fontWeight:700 }}>320+ Members</span>
              </div>
              <p style={{ color:"rgba(255,255,255,0.42)",fontSize:9,marginTop:2 }}>Across all teams</p>
            </div>

            {/* ── Floating chip: Accuracy (bottom-right) ── */}
            <div
              className="dm-chipC absolute"
              style={{
                bottom:"4%", right:"0%",
                background:"rgba(52,211,153,0.12)",
                border:"1px solid rgba(52,211,153,0.28)",
                borderRadius:13,
                backdropFilter:"blur(16px)",
                padding:"9px 13px",
                minWidth:126,
              }}
            >
              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                <TrendingUp size={11} color="#34d399" />
                <span style={{ color:"#6ee7b7",fontSize:11,fontWeight:700 }}>↑ 94% Accuracy</span>
              </div>
              <p style={{ color:"rgba(255,255,255,0.42)",fontSize:9,marginTop:2 }}>AI model performance</p>
            </div>

          </div>{/* end 3D scene */}

          {/* Social proof */}
          <div className="dm-in4 flex items-center gap-3 rounded-2xl px-4 py-3 mt-4"
            style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",backdropFilter:"blur(14px)" }}>
            <div style={{ display:"flex" }}>
              {[{c:"#8B5CF6"},{c:"#3B82F6"},{c:"#10B981"},{c:"#F59E0B"}].map(({ c }, i) => (
                <span key={i} style={{ width:26,height:26,borderRadius:"50%",background:c,border:"2px solid #0B1633",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:i>0?-7:0 }}>
                  <Users size={9} color="#fff" />
                </span>
              ))}
            </div>
            <p style={{ color:"rgba(255,255,255,0.52)",fontSize:12 }}>
              <span style={{ color:"#fff",fontWeight:700 }}>320+ team members</span> already using Decision Minds
            </p>
          </div>

        </div>
      </div>

      {/* ════════════════ RIGHT PANEL ════════════════ */}
      <div className="flex h-full flex-1 items-center justify-center overflow-hidden bg-white px-6 lg:px-12">
        <div className={`w-full max-w-[400px] transition-all duration-700 ${animIn ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F26A21]">
              <Video size={18} className="text-white" />
            </div>
            <p className="text-[15px] font-black text-[#0B1633]">Decision Minds</p>
          </div>

          <h1 className="text-[1.75rem] font-black text-[#0B1633]">Welcome back</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">Sign in to your workspace to continue.</p>

          {/* Demo accounts */}
          <div className="mt-5">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Quick demo login</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all ${
                    email === acc.email
                      ? "border-[#F26A21]/50 bg-[#F26A21]/8 ring-1 ring-[#F26A21]/20"
                      : "border-[#E5E7EB] hover:border-[#F26A21]/35 hover:bg-[#F26A21]/5"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: acc.bg }}>
                    {acc.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-[#0B1633]">{acc.name}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{acc.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#F3F4F6]" />
            <span className="text-[11px] text-[#C4C9D4]">or sign in manually</span>
            <div className="h-px flex-1 bg-[#F3F4F6]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#0B1633]">Email address</label>
              <div className={`relative flex items-center rounded-xl border transition-all ${
                focusedField === "email"
                  ? "border-[#F26A21] ring-2 ring-[#F26A21]/15"
                  : "border-[#E5E7EB]"
              } bg-white`}>
                <Mail size={14} className="absolute left-3.5 text-[#C4C9D4]" />
                <input
                  type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setLocalError(""); }}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="h-10 w-full rounded-xl bg-transparent pl-10 pr-4 text-sm text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#0B1633]">Password</label>
              <div className={`relative flex items-center rounded-xl border transition-all ${
                focusedField === "password"
                  ? "border-[#F26A21] ring-2 ring-[#F26A21]/15"
                  : "border-[#E5E7EB]"
              } bg-white`}>
                <Lock size={14} className="absolute left-3.5 text-[#C4C9D4]" />
                <input
                  type={showPwd ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(""); }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="h-10 w-full rounded-xl bg-transparent pl-10 pr-10 text-sm text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 text-[#C4C9D4] transition hover:text-[#F26A21]"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#9CA3AF]">Any password works for demo accounts.</p>
            </div>

            {displayError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
                <p className="text-[12px] text-red-600">{displayError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#F26A21] text-sm font-bold text-white shadow-button transition hover:bg-[#e05e1a] active:scale-[0.98] disabled:opacity-60"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : <>Sign in <ArrowRight size={14} /></>
              }
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-[#6B7280]">
            Don't have an account?{" "}
            <button onClick={onGoSignUp} className="font-semibold text-[#F26A21] transition hover:underline">
              Create one
            </button>
          </p>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
