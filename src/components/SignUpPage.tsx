import React, { useState, useEffect } from "react";
import {
  Eye, EyeOff, Mail, Lock, User, Building2,
  ArrowRight, ArrowLeft, Loader2, Video,
  CheckCircle2, ChevronDown, Zap, BarChart3,
  MessageSquare, Bell, ShieldCheck,
} from "lucide-react";
import { fetchUsers } from "../services/api";

/* ─────────────────────── constants ──────────────────────────────────────── */

const DEPARTMENTS = [
  "Engineering","Product","Design","Marketing",
  "Sales","Operations","Finance","HR","Executive","Other",
];

const MOCK_TASKS = [
  { owner:"AR", color:"#f59e0b", task:"Review Q3 roadmap",      done:false, dot:"#f87171" },
  { owner:"SC", color:"#60a5fa", task:"Send client proposal",   done:true,  dot:"#34d399" },
  { owner:"MJ", color:"#34d399", task:"Update sprint backlog",  done:false, dot:"#fbbf24" },
  { owner:"PS", color:"#a78bfa", task:"Schedule design review", done:true,  dot:"#34d399" },
];

const FEATURES = [
  { icon: Video,         label: "Transcription",  color: "#60a5fa" },
  { icon: CheckCircle2,  label: "Action Items",   color: "#34d399" },
  { icon: BarChart3,     label: "Analytics",      color: "#F26A21" },
  { icon: MessageSquare, label: "AI Chatbot",     color: "#a78bfa" },
  { icon: Zap,           label: "Autonomous",     color: "#fb923c" },
];

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin", executive: "Executive", manager: "Manager",
  team_lead: "Team Lead", member: "Member", client: "Client", guest: "Guest",
};

/* ─────────────────────── animation keyframes (injected once) ────────────── */
const STYLES = `
  @keyframes floatCard {
    0%,100% { transform: perspective(1000px) rotateX(6deg) rotateY(-8deg) translateY(0px);   }
    50%      { transform: perspective(1000px) rotateX(6deg) rotateY(-8deg) translateY(-10px); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes glowPulse {
    0%,100% { opacity:.55; }
    50%     { opacity:1;   }
  }
  @keyframes badgeBounce {
    0%,100% { transform:perspective(1000px) rotateX(6deg) rotateY(-8deg) translateZ(22px) translateY(0);  }
    50%     { transform:perspective(1000px) rotateX(6deg) rotateY(-8deg) translateZ(22px) translateY(-5px); }
  }
  @keyframes spinSlow {
    from { transform:rotate(0deg); }
    to   { transform:rotate(360deg); }
  }
  @keyframes progressFill {
    from { width:0%; }
    to   { width:61%; }
  }
  .fadeUp-1 { animation: fadeUp .55s ease both .1s;  }
  .fadeUp-2 { animation: fadeUp .55s ease both .22s; }
  .fadeUp-3 { animation: fadeUp .55s ease both .34s; }
  .fadeUp-4 { animation: fadeUp .55s ease both .46s; }
  .fadeUp-5 { animation: fadeUp .55s ease both .58s; }
  .float-card { animation: floatCard 4.5s ease-in-out infinite; }
  .badge-top  { animation: badgeBounce 4.5s ease-in-out infinite .3s; }
  .badge-bot  { animation: badgeBounce 4.5s ease-in-out infinite .9s; }
  .glow-orb   { animation: glowPulse 3s ease-in-out infinite; }
  .progress-bar { animation: progressFill 1.4s ease .9s both; }
`;

/* ─────────────────────── 3-D dashboard card ────────────────────────────── */
const DashboardCard: React.FC = () => (
  <div className="relative" style={{ perspective:"1000px" }}>
    {/* Ambient shadow */}
    <div style={{
      position:"absolute", inset:0, borderRadius:20,
      background:"rgba(0,0,0,0.55)", filter:"blur(28px)",
      transform:"translateY(22px) scale(0.88)",
    }}/>
    {/* Ghost depth layer */}
    <div style={{
      position:"absolute", inset:0, borderRadius:20,
      border:"1px solid rgba(255,255,255,0.07)",
      background:"rgba(255,255,255,0.03)",
      transform:"perspective(1000px) rotateX(6deg) rotateY(-8deg) translateZ(-20px) translate(14px,12px)",
    }}/>

    {/* ── Main card ── */}
    <div
      className="float-card"
      style={{
        position:"relative", borderRadius:20,
        border:"1px solid rgba(255,255,255,0.13)",
        background:"rgba(255,255,255,0.07)",
        backdropFilter:"blur(20px)",
        boxShadow:"0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)",
        padding:"18px",
      }}
    >
      {/* Card header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"#F26A21", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 14px rgba(242,106,33,0.6)" }}>
            <Video size={13} color="white"/>
          </div>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:"white", margin:0 }}>Meeting Intelligence</p>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.38)", margin:0 }}>Decision Minds · Live</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d399" }}/>
          <span style={{ fontSize:9, fontWeight:700, color:"#34d399" }}>LIVE</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
        {[
          { label:"Meetings",  value:"24",  color:"#60a5fa" },
          { label:"Tasks",     value:"87",  color:"#34d399" },
          { label:"Completed", value:"61%", color:"#F26A21" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ borderRadius:12, background:"rgba(255,255,255,0.06)", padding:"8px 10px" }}>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.42)", margin:"0 0 3px" }}>{label}</p>
            <p style={{ fontSize:18, fontWeight:900, color, margin:0, lineHeight:1 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Action items */}
      <p style={{ fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:"rgba(255,255,255,0.28)", marginBottom:7 }}>ACTION ITEMS</p>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
        {MOCK_TASKS.map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, borderRadius:10, padding:"7px 10px", background: t.done ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)", opacity: t.done ? 0.55 : 1 }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:t.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, color:"white", flexShrink:0 }}>{t.owner}</div>
            <p style={{ flex:1, fontSize:11, fontWeight:500, color: t.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.82)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textDecoration: t.done ? "line-through" : "none" }}>{t.task}</p>
            <div style={{ width:7, height:7, borderRadius:"50%", background:t.dot, flexShrink:0 }}/>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ borderRadius:12, background:"rgba(255,255,255,0.05)", padding:"9px 12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.45)", fontWeight:600 }}>Sprint Progress</span>
          <span style={{ fontSize:9, color:"white", fontWeight:800 }}>61%</span>
        </div>
        <div style={{ height:5, borderRadius:99, background:"rgba(255,255,255,0.1)", overflow:"hidden" }}>
          <div className="progress-bar" style={{ height:"100%", borderRadius:99, background:"linear-gradient(90deg,#F26A21,#fb923c)" }}/>
        </div>
      </div>
    </div>

    {/* Notification badge top-right */}
    <div
      className="badge-top"
      style={{
        position:"absolute", top:-14, right:-18,
        display:"flex", alignItems:"center", gap:6,
        borderRadius:99, border:"1px solid rgba(255,255,255,0.14)",
        background:"rgba(6,14,34,0.92)", backdropFilter:"blur(14px)",
        padding:"6px 12px",
        boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
        whiteSpace:"nowrap",
      }}
    >
      <Bell size={10} color="#F26A21"/>
      <span style={{ fontSize:10, fontWeight:700, color:"white" }}>3 new action items</span>
    </div>

    {/* AI badge bottom-left */}
    <div
      className="badge-bot"
      style={{
        position:"absolute", bottom:-14, left:-16,
        display:"flex", alignItems:"center", gap:6,
        borderRadius:99, border:"1px solid rgba(255,255,255,0.14)",
        background:"rgba(6,14,34,0.92)", backdropFilter:"blur(14px)",
        padding:"6px 12px",
        boxShadow:"0 8px 24px rgba(0,0,0,0.5)",
        whiteSpace:"nowrap",
      }}
    >
      <div style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", boxShadow:"0 0 8px #34d399" }}/>
      <span style={{ fontSize:10, fontWeight:700, color:"white" }}>AI processed · just now</span>
    </div>
  </div>
);

/* ─────────────────────── main component ────────────────────────────────── */
interface Props {
  onSignUp: (name: string, email: string, department: string, role: string) => Promise<void>;
  onGoLogin: () => void;
  error?: string;
}

const SignUpPage: React.FC<Props> = ({ onSignUp, onGoLogin, error }) => {
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [department,      setDepartment]      = useState("Engineering");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [localError,      setLocalError]      = useState("");
  const [success,         setSuccess]         = useState(false);
  const [focusedField,    setFocusedField]    = useState<string|null>(null);
  const [animIn,          setAnimIn]          = useState(false);
  const [showDeptDrop,    setShowDeptDrop]    = useState(false);

  // Invite detection
  const [isInvited,      setIsInvited]      = useState<boolean | null>(null);
  const [invitedRole,    setInvitedRole]    = useState("");
  const [invitedName,    setInvitedName]    = useState("");
  const [checkingInvite, setCheckingInvite] = useState(false);

  useEffect(() => { const t = setTimeout(() => setAnimIn(true), 60); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const close = () => setShowDeptDrop(false);
    if (showDeptDrop) window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showDeptDrop]);

  const displayError = error || localError;

  const checkEmailInvited = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes("@")) { setIsInvited(null); return; }
    setCheckingInvite(true);
    try {
      const { users } = await fetchUsers();
      const found = users.find(u => u.email.toLowerCase() === emailToCheck.toLowerCase());
      if (found) {
        setIsInvited(true);
        setInvitedRole(found.role);
        setInvitedName(found.name);
        if (!name) setName(found.name);
      } else {
        setIsInvited(false);
        setInvitedRole("");
        setInvitedName("");
      }
    } catch {
      setIsInvited(null);
    } finally {
      setCheckingInvite(false);
    }
  };

  const validate = () => {
    if (!isInvited && !name.trim())  return "Full name is required.";
    if (!email.trim())               return "Email is required.";
    if (!email.includes("@"))        return "Please enter a valid email.";
    if (!password)                   return "Password is required.";
    if (password.length < 4)         return "Password must be at least 4 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const err = validate();
    if (err) { setLocalError(err); return; }
    setLoading(true);
    try {
      const finalName = isInvited ? invitedName : name.trim();
      const finalRole = isInvited ? invitedRole : "member";
      await onSignUp(finalName, email.trim(), department, finalRole);
      setSuccess(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const ring = (field: string) =>
    `relative flex items-center rounded-xl border transition-all ${
      focusedField === field ? "border-[#F26A21] ring-2 ring-[#F26A21]/15" : "border-[#E5E7EB]"
    } bg-white`;

  /* success screen */
  if (success) {
    return (
      <div className="flex h-screen items-center justify-center bg-white px-6">
        <style>{STYLES}</style>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 size={36}/>
          </div>
          <h2 className="text-2xl font-black text-[#0B1633]">
            {isInvited ? "Account activated!" : "Account created!"}
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            {isInvited
              ? `Welcome back, ${invitedName}. Signing you in as ${ROLE_LABEL[invitedRole] ?? invitedRole}…`
              : "Welcome to Decision Minds. Signing you in…"}
          </p>
          <div className="mt-5 flex justify-center"><Loader2 size={22} className="animate-spin text-[#F26A21]"/></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="flex h-screen overflow-hidden">

        {/* ══ LEFT PANEL ═══════════════════════════════════════════════ */}
        <div className="relative hidden h-full flex-col overflow-hidden lg:flex lg:w-[50%]">

          {/* Background */}
          <div style={{ position:"absolute", inset:0, background:"#060d1f" }}/>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 65% 55% at 10% 20%, rgba(242,106,33,0.30) 0%, transparent 65%)" }}/>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 50% 45% at 92% 85%, rgba(99,102,241,0.22) 0%, transparent 60%)" }}/>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 40% 35% at 80% 5%,  rgba(242,106,33,0.13) 0%, transparent 55%)" }}/>

          {/* Grid overlay */}
          <div style={{
            position:"absolute", inset:0, opacity:0.045,
            backgroundImage:"linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)",
            backgroundSize:"36px 36px",
          }}/>

          {/* Animated glow orbs */}
          <div className="glow-orb" style={{ position:"absolute", left:-80, top:"10%",    width:260, height:260, borderRadius:"50%", background:"rgba(242,106,33,0.18)", filter:"blur(80px)", pointerEvents:"none" }}/>
          <div className="glow-orb" style={{ position:"absolute", right:-60, bottom:"15%", width:220, height:220, borderRadius:"50%", background:"rgba(99,102,241,0.18)", filter:"blur(70px)", pointerEvents:"none", animationDelay:"1.5s" }}/>

          {/* Content */}
          <div className="relative z-10 flex h-full flex-col px-10 py-10">

            {/* Logo */}
            <div className="fadeUp-1 flex items-center gap-3">
              <div style={{ width:40, height:40, borderRadius:12, background:"#F26A21", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 20px rgba(242,106,33,0.55)" }}>
                <Video size={19} color="white"/>
              </div>
              <div>
                <p style={{ color:"white", fontWeight:900, fontSize:15, margin:0, lineHeight:1.2 }}>Decision Minds</p>
                <p style={{ color:"#F26A21", fontSize:10, margin:0 }}>Meeting Intelligence Platform</p>
              </div>
            </div>

            {/* Headline */}
            <div className="fadeUp-2 mt-8">
              <h2 style={{ color:"white", fontSize:"2rem", fontWeight:900, lineHeight:1.2, margin:0, letterSpacing:"-0.02em" }}>
                Your meetings,{" "}
                <span style={{ color:"#F26A21", textShadow:"0 0 40px rgba(242,106,33,0.55)" }}>
                  reimagined.
                </span>
              </h2>
              <p style={{ color:"rgba(255,255,255,0.52)", fontSize:13, lineHeight:1.65, margin:"10px 0 0", maxWidth:320 }}>
                AI extracts action items, assigns owners, and tracks progress — so your team never misses a beat.
              </p>
            </div>

            {/* Feature pills */}
            <div className="fadeUp-3 mt-5 flex flex-wrap gap-2">
              {FEATURES.map(({ icon: Icon, label, color }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:6, borderRadius:99, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.06)", padding:"5px 12px", backdropFilter:"blur(8px)" }}>
                  <Icon size={11} color={color}/>
                  <span style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.78)" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* 3-D dashboard card */}
            <div className="fadeUp-4 mt-8 px-4 pb-6">
              <DashboardCard/>
            </div>

            {/* Steps at bottom */}
            <div className="fadeUp-5 mt-auto flex items-center gap-3">
              {[
                { n:"01", text:"Create account" },
                { n:"02", text:"Connect meetings" },
                { n:"03", text:"Get AI insights" },
              ].map(({ n, text }, i) => (
                <React.Fragment key={n}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontSize:10, fontWeight:900, color:"rgba(242,106,33,0.75)" }}>{n}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.42)" }}>{text}</span>
                  </div>
                  {i < 2 && <div style={{ height:1, width:20, background:"rgba(255,255,255,0.14)", flexShrink:0 }}/>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL – FORM ══════════════════════════════════════ */}
        <div
          className="flex h-full flex-1 flex-col justify-center overflow-y-auto bg-white px-6 py-8 lg:px-12"
          style={{ scrollbarWidth:"none" } as React.CSSProperties}
        >
          <div className={`mx-auto w-full max-w-[400px] transition-all duration-700 ${animIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

            {/* Back */}
            <button onClick={onGoLogin} className="mb-5 flex items-center gap-1.5 text-[12px] font-medium text-[#6B7280] transition hover:text-[#F26A21]">
              <ArrowLeft size={13}/> Back to sign in
            </button>

            <h1 className="text-[1.65rem] font-black text-[#0B1633]">
              {isInvited ? "Activate your account" : "Create account"}
            </h1>
            <p className="mt-1 text-[12px] text-[#6B7280]">
              {isInvited
                ? `You've been invited as ${ROLE_LABEL[invitedRole] ?? invitedRole}. Set a password to get started.`
                : "Fill in your details to get started."}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">

              {/* Name — hidden for invited users (name already set by admin) */}
              {!isInvited && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#0B1633]">Full name</label>
                    <div className={ring("name")}>
                      <User size={13} className="absolute left-3 text-[#C4C9D4]"/>
                      <input type="text" value={name} onChange={e=>{setName(e.target.value);setLocalError("");}}
                        onFocus={()=>setFocusedField("name")} onBlur={()=>setFocusedField(null)}
                        placeholder="Jane Smith" autoComplete="name"
                        className="h-10 w-full rounded-xl bg-transparent pl-9 pr-3 text-[12px] text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#0B1633]">Work email</label>
                    <div className={ring("email")}>
                      <Mail size={13} className="absolute left-3 text-[#C4C9D4]"/>
                      {checkingInvite && <Loader2 size={12} className="absolute right-3 animate-spin text-[#C4C9D4]"/>}
                      <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setLocalError("");setIsInvited(null);}}
                        onFocus={()=>setFocusedField("email")}
                        onBlur={()=>{ setFocusedField(null); checkEmailInvited(email); }}
                        placeholder="jane@co.com" autoComplete="email"
                        className="h-10 w-full rounded-xl bg-transparent pl-9 pr-3 text-[12px] text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email — full width for invited users */}
              {isInvited && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#0B1633]">Work email</label>
                  <div className={ring("email")}>
                    <Mail size={13} className="absolute left-3 text-[#C4C9D4]"/>
                    {checkingInvite && <Loader2 size={12} className="absolute right-3 animate-spin text-[#C4C9D4]"/>}
                    <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setLocalError("");setIsInvited(null);}}
                      onFocus={()=>setFocusedField("email")}
                      onBlur={()=>{ setFocusedField(null); checkEmailInvited(email); }}
                      placeholder="jane@co.com" autoComplete="email"
                      className="h-10 w-full rounded-xl bg-transparent pl-9 pr-7 text-[12px] text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Invited banner */}
              {isInvited && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500"/>
                  <div>
                    <p className="text-[12px] font-semibold text-emerald-800">
                      You've been invited as <span className="font-black">{ROLE_LABEL[invitedRole] ?? invitedRole}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-emerald-600">
                      Your account is ready. Just set a password to activate it.
                    </p>
                  </div>
                </div>
              )}

              {/* Not-invited notice */}
              {isInvited === false && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400"/>
                  <p className="text-[11px] text-amber-700">No invitation found for this email — you'll join as Member.</p>
                </div>
              )}

              {/* Department — hidden for invited users */}
              {!isInvited && (
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#0B1633]">Department</label>
                  <div className="relative">
                    <Building2 size={13} className="absolute left-3 top-[13px] z-10 text-[#C4C9D4]"/>
                    <button type="button" onClick={e=>{e.stopPropagation();setShowDeptDrop(v=>!v);}}
                      className={`flex h-10 w-full items-center justify-between rounded-xl border pl-9 pr-3 text-[12px] transition ${showDeptDrop?"border-[#F26A21] ring-2 ring-[#F26A21]/15":"border-[#E5E7EB]"} bg-white text-[#0B1633]`}>
                      {department}
                      <ChevronDown size={13} className={`text-[#C4C9D4] transition-transform ${showDeptDrop?"rotate-180":""}`}/>
                    </button>
                    {showDeptDrop && (
                      <div className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-card-hover">
                        {DEPARTMENTS.map(dept=>(
                          <button key={dept} type="button"
                            onClick={e=>{e.stopPropagation();setDepartment(dept);setShowDeptDrop(false);}}
                            className={`flex h-8 w-full items-center px-4 text-[12px] transition hover:bg-[#F8F7F5] ${dept===department?"font-semibold text-[#F26A21]":"text-[#0B1633]"}`}>
                            {dept}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Password + Confirm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#0B1633]">Password</label>
                  <div className={ring("password")}>
                    <Lock size={13} className="absolute left-3 text-[#C4C9D4]"/>
                    <input type={showPassword?"text":"password"} value={password}
                      onChange={e=>{setPassword(e.target.value);setLocalError("");}}
                      onFocus={()=>setFocusedField("password")} onBlur={()=>setFocusedField(null)}
                      placeholder="Password" autoComplete="new-password"
                      className="h-10 w-full rounded-xl bg-transparent pl-9 pr-8 text-[12px] text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                    />
                    <button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-2.5 text-[#C4C9D4] hover:text-[#F26A21]" tabIndex={-1}>
                      {showPassword?<EyeOff size={13}/>:<Eye size={13}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#0B1633]">Confirm</label>
                  <div className={ring("confirm")}>
                    <Lock size={13} className="absolute left-3 text-[#C4C9D4]"/>
                    <input type={showConfirm?"text":"password"} value={confirmPassword}
                      onChange={e=>{setConfirmPassword(e.target.value);setLocalError("");}}
                      onFocus={()=>setFocusedField("confirm")} onBlur={()=>setFocusedField(null)}
                      placeholder="Confirm" autoComplete="new-password"
                      className="h-10 w-full rounded-xl bg-transparent pl-9 pr-8 text-[12px] text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                    />
                    <button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute right-2.5 text-[#C4C9D4] hover:text-[#F26A21]" tabIndex={-1}>
                      {showConfirm?<EyeOff size={13}/>:<Eye size={13}/>}
                    </button>
                  </div>
                  {confirmPassword && password!==confirmPassword &&
                    <p className="mt-1 text-[10px] text-red-500">Doesn't match.</p>}
                  {confirmPassword && password===confirmPassword && password.length>=4 &&
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600"><CheckCircle2 size={10}/> Matches</p>}
                </div>
              </div>

              {/* Error */}
              {displayError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-red-400"/>
                  <p className="text-[12px] text-red-600">{displayError}</p>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#F26A21] text-sm font-bold text-white shadow-button transition hover:bg-[#e05e1a] active:scale-[0.98] disabled:opacity-60">
                {loading
                  ? <><Loader2 size={15} className="animate-spin"/>{isInvited ? "Activating…" : "Creating…"}</>
                  : <>{isInvited ? "Activate Account" : "Create account"} <ArrowRight size={14}/></>}
              </button>
            </form>

            <p className="mt-4 text-center text-[12px] text-[#6B7280]">
              Already have an account?{" "}
              <button onClick={onGoLogin} className="font-semibold text-[#F26A21] hover:underline">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUpPage;
