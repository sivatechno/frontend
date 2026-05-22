import React, { useState, useEffect, useRef } from "react";
import {
  UserPlus, Mail, Building2, ChevronDown,
  Loader2, CheckCircle2, X, Shield, Users,
  Crown, UserCheck, AlertCircle, FolderKanban, Plus, Trash2,
} from "lucide-react";
import { fetchUsers, createUser, updateUserRole } from "../services/api";
import type { UserInfo } from "../types";

// ── constants ────────────────────────────────────────────────────────────────

const ROLE_LEVEL: Record<string, number> = {
  admin: 100, executive: 80, manager: 60,
  team_lead: 50, member: 30, client: 20, guest: 10,
};

const ROLE_META: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  admin:     { label: "Admin",     bg: "#EDE9FE", text: "#7C3AED", icon: <Crown size={10} /> },
  executive: { label: "Executive", bg: "#DBEAFE", text: "#1D4ED8", icon: <Shield size={10} /> },
  manager:   { label: "Manager",   bg: "#D1FAE5", text: "#065F46", icon: <UserCheck size={10} /> },
  team_lead: { label: "Team Lead", bg: "#CFFAFE", text: "#0E7490", icon: <UserCheck size={10} /> },
  member:    { label: "Member",    bg: "#F3F4F6", text: "#374151", icon: <Users size={10} /> },
  client:    { label: "Client",    bg: "#FEF3C7", text: "#92400E", icon: <Users size={10} /> },
  guest:     { label: "Guest",     bg: "#F9FAFB", text: "#6B7280", icon: <Users size={10} /> },
};

const ALL_ROLES = ["admin", "executive", "manager", "team_lead", "member", "guest", "client"];

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Marketing",
  "Sales", "Operations", "Finance", "HR", "Executive", "Other",
];

const PROJECT_COLORS = [
  "#F26A21", "#0a5791", "#059669", "#D97706", "#7C3AED",
  "#DB2777", "#0891B2", "#65A30D", "#DC2626", "#2563EB",
];

// ── project types ─────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  color: string;
  description: string;
  memberEmails: string[];
  memberNames: { email: string; name: string; initials: string }[];
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed";
  progress: number;
}

const DEFAULT_PROJECTS: Project[] = [
  { id: "proj-1", name: "Product Launch Q3",   color: "#F26A21", description: "", memberEmails: [], memberNames: [], startDate: "2026-05-01", endDate: "2026-08-31", status: "active",    progress: 35 },
  { id: "proj-2", name: "Engineering Platform", color: "#0a5791", description: "", memberEmails: [], memberNames: [], startDate: "2026-04-01", endDate: "2026-09-30", status: "active",    progress: 52 },
  { id: "proj-3", name: "Client Delivery",      color: "#059669", description: "", memberEmails: [], memberNames: [], startDate: "2026-06-01", endDate: "2026-07-31", status: "planning",  progress: 10 },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] ?? ROLE_META.member;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: m.bg, color: m.text }}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function Avatar({ user }: { user: UserInfo }) {
  const initials = user.avatar || user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#F26A21", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];
  const color = colors[user.email.charCodeAt(0) % colors.length];
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

// ── inline role dropdown ──────────────────────────────────────────────────────

function RoleDropdown({
  user,
  assignableRoles,
  onRoleChange,
  disabled,
}: {
  user: UserInfo;
  assignableRoles: string[];
  onRoleChange: (email: string, role: string) => Promise<void>;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const canChange = assignableRoles.length > 0 && !disabled;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => canChange && setOpen(v => !v)}
        disabled={!canChange || saving}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition ${
          canChange
            ? "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#F26A21]/40 hover:text-[#F26A21]"
            : "cursor-default border-transparent bg-transparent text-[#9CA3AF]"
        }`}
      >
        {saving ? <Loader2 size={12} className="animate-spin" /> : null}
        Change Role
        {canChange && <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-xl border border-[#E5E7EB] bg-white py-1.5 shadow-lg">
          {assignableRoles.map(role => {
            const m = ROLE_META[role] ?? ROLE_META.member;
            const isCurrent = user.role === role;
            return (
              <button
                key={role}
                onClick={async () => {
                  if (isCurrent) { setOpen(false); return; }
                  setOpen(false);
                  setSaving(true);
                  await onRoleChange(user.email, role);
                  setSaving(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[12px] transition hover:bg-[#F8F7F5] ${
                  isCurrent ? "font-semibold" : "font-medium text-[#374151]"
                }`}
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px]"
                  style={{ background: m.bg, color: m.text }}
                >
                  {m.icon}
                </span>
                <span style={{ color: isCurrent ? m.text : undefined }}>{m.label}</span>
                {isCurrent && <CheckCircle2 size={11} className="ml-auto text-[#F26A21]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── projects cell ─────────────────────────────────────────────────────────────

function ProjectsCell({
  email,
  userProjects,
  allProjects,
  canManage,
  onToggle,
}: {
  email: string;
  userProjects: Project[];
  allProjects: Project[];
  canManage: boolean;
  onToggle: (email: string, projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unassigned = allProjects.filter(p => !p.memberEmails.includes(email));

  return (
    <div ref={ref} className="relative flex flex-wrap items-center gap-1.5">
      {userProjects.map(p => (
        <span
          key={p.id}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
          style={{ background: p.color }}
        >
          {p.name}
          {canManage && (
            <button
              onClick={() => onToggle(email, p.id)}
              className="ml-0.5 opacity-70 hover:opacity-100"
            >
              <X size={9} />
            </button>
          )}
        </span>
      ))}

      {canManage && unassigned.length > 0 && (
        <button
          onClick={() => setOpen(v => !v)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-[#C4C9D4] text-[#9CA3AF] transition hover:border-[#F26A21] hover:text-[#F26A21]"
          title="Assign to project"
        >
          <Plus size={10} />
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-7 z-50 w-52 rounded-xl border border-[#E5E7EB] bg-white py-1.5 shadow-lg">
          <p className="px-3.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">
            Assign to project
          </p>
          {unassigned.map(p => (
            <button
              key={p.id}
              onClick={() => { onToggle(email, p.id); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[12px] font-medium text-[#374151] transition hover:bg-[#F8F7F5]"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ background: p.color }}
              />
              {p.name}
            </button>
          ))}
        </div>
      )}

      {userProjects.length === 0 && !canManage && (
        <span className="text-[12px] text-[#C4C9D4]">—</span>
      )}
    </div>
  );
}

// ── new project modal ─────────────────────────────────────────────────────────

function NewProjectModal({
  onSave,
  onClose,
}: {
  onSave: (name: string, color: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [focused, setFocused] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[360px] rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-6 py-4">
          <h2 className="text-[15px] font-bold text-[#0B1633]">New Channel</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-[#0B1633]">Channel Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="e.g. Product Launch Q4"
              className={`h-10 w-full rounded-xl border px-4 text-[13px] text-[#0B1633] outline-none transition placeholder:text-[#C4C9D4] ${
                focused ? "border-[#F26A21] ring-2 ring-[#F26A21]/15" : "border-[#E5E7EB]"
              }`}
            />
          </div>

          <div>
            <label className="mb-2 block text-[12px] font-semibold text-[#0B1633]">Color</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    color === c ? "border-[#0B1633] scale-110" : "border-transparent"
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-2 rounded-xl bg-[#F8F7F5] px-4 py-3">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: color }}
            >
              {name || "Channel Name"}
            </span>
            <span className="text-[11px] text-[#9CA3AF]">preview</span>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#F3F4F6] px-6 py-4">
          <button
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border border-[#E5E7EB] text-[13px] font-medium text-[#374151] transition hover:border-[#F26A21]/30 hover:text-[#F26A21]"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (name.trim()) onSave(name.trim(), color); }}
            disabled={!name.trim()}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F26A21] text-[13px] font-bold text-white transition hover:bg-[#e05e1a] disabled:opacity-50"
          >
            <FolderKanban size={14} />
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ── invite modal ──────────────────────────────────────────────────────────────

function InviteModal({
  assignableRoles,
  onInvite,
  onClose,
}: {
  assignableRoles: string[];
  onInvite: (data: { name: string; email: string; department: string; role: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [role, setRole] = useState(assignableRoles.includes("member") ? "member" : assignableRoles[assignableRoles.length - 1] ?? "member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showDept, setShowDept] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const deptRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) setShowDept(false);
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setShowRole(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Full name is required."); return; }
    if (!email.trim() || !email.includes("@")) { setError("Valid work email is required."); return; }
    setLoading(true);
    try {
      await onInvite({ name: name.trim(), email: email.trim(), department, role });
      setSuccess(true);
      setTimeout(onClose, 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (focused: boolean) =>
    `flex h-10 w-full items-center rounded-xl border bg-white transition-all ${
      focused ? "border-[#F26A21] ring-2 ring-[#F26A21]/15" : "border-[#E5E7EB]"
    }`;

  const [focusField, setFocusField] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-[#F3F4F6] px-6 py-5">
          <div>
            <h2 className="text-[15px] font-bold text-[#0B1633]">Invite Team Member</h2>
            <p className="mt-0.5 text-[12px] text-[#6B7280]">
              They can log in immediately with any password.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151]">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 size={28} />
            </div>
            <p className="font-bold text-[#0B1633]">Invitation created!</p>
            <p className="text-[13px] text-[#6B7280]">
              Share these details with <span className="font-semibold text-[#0B1633]">{name}</span>:
            </p>
            <div className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] px-4 py-3 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#6B7280]">Email</span>
                <span className="font-mono text-[12px] font-bold text-[#F26A21]">{email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#6B7280]">Role</span>
                <RoleBadge role={role} />
              </div>
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Tell them to open the app, click <strong className="text-[#0B1633]">Sign up</strong>, enter this email, and set a password to activate their account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#0B1633]">Full name</label>
              <div className={`relative ${inputCls(focusField === "name")}`}>
                <span className="absolute left-3 text-[#C4C9D4]"><Users size={13} /></span>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  onFocus={() => setFocusField("name")} onBlur={() => setFocusField(null)}
                  placeholder="Jane Smith"
                  className="h-full w-full rounded-xl bg-transparent pl-9 pr-3 text-[13px] text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-[#0B1633]">Work email</label>
              <div className={`relative ${inputCls(focusField === "email")}`}>
                <span className="absolute left-3 text-[#C4C9D4]"><Mail size={13} /></span>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusField("email")} onBlur={() => setFocusField(null)}
                  placeholder="jane@company.com"
                  className="h-full w-full rounded-xl bg-transparent pl-9 pr-3 text-[13px] text-[#0B1633] placeholder-[#C4C9D4] outline-none"
                />
              </div>
            </div>

            {/* <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#0B1633]">Department</label>
                <div ref={deptRef} className="relative">
                  <span className="absolute left-3 top-[11px] z-10 text-[#C4C9D4]"><Building2 size={13} /></span>
                  <button
                    type="button" onClick={() => setShowDept(v => !v)}
                    className={`flex h-10 w-full items-center justify-between rounded-xl border pl-9 pr-2.5 text-[12px] transition ${
                      showDept ? "border-[#F26A21] ring-2 ring-[#F26A21]/15" : "border-[#E5E7EB]"
                    } bg-white text-[#0B1633]`}
                  >
                    <span className="truncate">{department}</span>
                    <ChevronDown size={12} className={`shrink-0 text-[#C4C9D4] transition-transform ${showDept ? "rotate-180" : ""}`} />
                  </button>
                  {showDept && (
                    <div className="absolute z-50 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg">
                      {DEPARTMENTS.map(d => (
                        <button key={d} type="button"
                          onClick={() => { setDepartment(d); setShowDept(false); }}
                          className={`flex h-8 w-full items-center px-3.5 text-[12px] transition hover:bg-[#F8F7F5] ${d === department ? "font-semibold text-[#F26A21]" : "text-[#374151]"}`}
                        >{d}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-[#0B1633]">Role</label>
                <div ref={roleRef} className="relative">
                  <button
                    type="button" onClick={() => setShowRole(v => !v)}
                    className={`flex h-10 w-full items-center justify-between rounded-xl border px-3 text-[12px] transition ${
                      showRole ? "border-[#F26A21] ring-2 ring-[#F26A21]/15" : "border-[#E5E7EB]"
                    } bg-white`}
                  >
                    <RoleBadge role={role} />
                    <ChevronDown size={12} className={`shrink-0 text-[#C4C9D4] transition-transform ${showRole ? "rotate-180" : ""}`} />
                  </button>
                  {showRole && (
                    <div className="absolute z-50 mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg">
                      {assignableRoles.map(r => (
                        <button key={r} type="button"
                          onClick={() => { setRole(r); setShowRole(false); }}
                          className={`flex h-8 w-full items-center px-3.5 text-[12px] transition hover:bg-[#F8F7F5] ${r === role ? "font-semibold" : ""}`}
                        >
                          <RoleBadge role={r} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div> */}

            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#0B1633]">
                {ROLE_META[role]?.label ?? role} access
              </p>
              <p className="mt-0.5 text-[11px] text-[#6B7280]">
                {role === "admin" && "Full access to all features, users, and settings."}
                {role === "executive" && "Can view all dashboards, analytics, manage workflows, and invite users."}
                {role === "manager" && "Can manage team tasks, meetings, analytics, and assign work."}
                {role === "team_lead" && "Can view team dashboards, meetings, analytics, and assign tasks."}
                {role === "member" && "Can view own tasks and meetings, use chatbot, upload meetings."}
                {role === "client" && "Read-only access to client reports and assigned meetings."}
                {role === "guest" && "Minimal access — can view meetings and use chatbot only."}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5">
                <AlertCircle size={13} className="shrink-0 text-red-400" />
                <p className="text-[12px] text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="h-10 flex-1 rounded-xl border border-[#E5E7EB] text-[13px] font-medium text-[#374151] transition hover:border-[#F26A21]/30 hover:text-[#F26A21]"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F26A21] text-[13px] font-bold text-white transition hover:bg-[#e05e1a] disabled:opacity-60"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {loading ? "Inviting…" : "Send Invitation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

const FILTER_TABS = ["All", "Admin", "Executive", "Manager", "Team Lead", "Member"];

interface Props {
  currentUser: UserInfo | null;
}

const UsersView: React.FC<Props> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("All");
  const [showInvite, setShowInvite] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);

  // Projects — stored in localStorage, only executives+ can create
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem("meetflow_projects");
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return DEFAULT_PROJECTS;
  });

  useEffect(() => {
    localStorage.setItem("meetflow_projects", JSON.stringify(projects));
  }, [projects]);

  const myLevel = ROLE_LEVEL[currentUser?.role ?? "member"] ?? 30;
  const canManageProjects = myLevel >= 80; // executive and above

  const assignableRoles = ALL_ROLES.filter(r => (ROLE_LEVEL[r] ?? 0) <= myLevel);

  useEffect(() => {
    fetchUsers()
      .then(({ users }) => setUsers(users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRoleChange = async (email: string, newRole: string) => {
    setUpdatingEmail(email);
    try {
      const updated = await updateUserRole(email, newRole);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, role: updated.role } : u));
      showToast(`Role updated to ${ROLE_META[newRole]?.label ?? newRole}`);
    } catch {
      showToast("Failed to update role — try again.");
    } finally {
      setUpdatingEmail(null);
    }
  };

  const handleInvite = async (data: { name: string; email: string; department: string; role: string }) => {
    const newUser = await createUser(data);
    setUsers(prev => [...prev, newUser]);
    showToast(`${newUser.name} invited as ${ROLE_META[newUser.role]?.label ?? newUser.role}`);
  };

  const handleToggleProject = (email: string, projectId: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId
        ? {
            ...p,
            memberEmails: p.memberEmails.includes(email)
              ? p.memberEmails.filter(e => e !== email)
              : [...p.memberEmails, email],
          }
        : p
    ));
  };

  const handleCreateProject = (name: string, color: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      color,
      memberEmails: [],
      description: "",
      memberNames: [],
      startDate: today,
      endDate: today,
      status: "planning",
      progress: 0,
    };
    setProjects(prev => [...prev, newProject]);
    setShowNewProject(false);
    showToast(`Project "${name}" created`);
  };

  const handleDeleteProject = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (proj) showToast(`Project "${proj.name}" deleted`);
  };

  const getUserProjects = (email: string) =>
    projects.filter(p => p.memberEmails.includes(email));

  const filtered = users.filter(u => {
    if (roleFilter === "All") return true;
    const label = ROLE_META[u.role]?.label ?? u.role;
    return label === roleFilter;
  });

  const roleCount = (r: string) => users.filter(u => u.role === r).length;
  const uniqueDepts = new Set(users.map(u => u.department).filter(Boolean)).size;

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B1633]">Users & Roles</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage team access. Invite members and assign the right role before they log in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageProjects && (
            <button
              onClick={() => setShowNewProject(true)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#374151] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
            >
              <FolderKanban size={15} />
              New Project
            </button>
          )}
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F26A21] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#e05e1a]"
          >
            <UserPlus size={15} />
            Invite User
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Members", value: users.length, sub: `${uniqueDepts} departments` },
          { label: "Admins & Executives", value: roleCount("admin") + roleCount("executive"), sub: "elevated access" },
          { label: "Active Projects", value: projects.length, sub: `${projects.filter(p => p.memberEmails.length > 0).length} with members` },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6B7280]">{label}</p>
            <p className="mt-2 text-4xl font-bold text-[#F26A21]">{value}</p>
            <p className="mt-1 font-mono text-xs text-[#9CA3AF]">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Projects overview (executive only) ── */}
      {/* {canManageProjects && projects.length > 0 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#0B1633]">
              <FolderKanban size={15} className="text-[#F26A21]" />
              Projects
            </h3>
            <span className="text-[11px] text-[#9CA3AF]">Only executives can create & manage projects</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {projects.map(p => (
              <div
                key={p.id}
                className="group flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F8F7F5] pl-1.5 pr-2.5 py-1"
              >
                <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                <span className="text-[12px] font-semibold text-[#374151]">{p.name}</span>
                <span className="text-[11px] text-[#9CA3AF]">{p.memberEmails.length}</span>
                <button
                  onClick={() => handleDeleteProject(p.id)}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 text-[#C4C9D4] transition hover:text-red-400"
                  title="Delete project"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* ── RBAC flow note ── */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#F26A21]/20 bg-[#FFF7F2] px-5 py-4">
        <Shield size={18} className="mt-0.5 shrink-0 text-[#F26A21]" />
        <div>
          <p className="text-sm font-semibold text-[#0B1633]">How role assignment works</p>
          <p className="mt-0.5 text-[12px] text-[#6B7280]">
            New sign-ups always start as <strong>Member</strong>. To give someone Executive or Manager access,
            use <strong>Invite User</strong> before they sign up — or change their role here after they log in.
            Users get their permissions instantly on next login.
          </p>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map(tab => (
          <button key={tab} onClick={() => setRoleFilter(tab)}
            className={`h-8 rounded-xl border px-3.5 text-[12px] font-medium transition ${
              roleFilter === tab
                ? "border-[#F26A21]/40 bg-[#F26A21]/10 text-[#F26A21]"
                : "border-[#E5E7EB] bg-white text-[#5C667A] hover:border-[#F26A21]/30 hover:text-[#F26A21]"
            }`}
          >
            {tab}
            {tab !== "All" && (
              <span className="ml-1.5 rounded-full bg-[#0B1633]/5 px-1.5 py-0.5 text-[10px] text-[#6B7280]">
                {users.filter(u => (ROLE_META[u.role]?.label ?? u.role) === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#F26A21]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-[#9CA3AF]">
            <Users size={28} />
            <p className="text-sm">No users in this role.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse">
              <thead>
                <tr className="border-b border-[#F3F4F6] text-left text-[11px] font-black uppercase tracking-[0.14em] text-[#6B7280]">
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Role</th>
                  {/* <th className="px-6 py-4">Department</th> */}
                  <th className="px-6 py-4">Workspace</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const isMe = user.email === currentUser?.email;
                  const targetLevel = ROLE_LEVEL[user.role] ?? 0;
                  const canManage = !isMe && targetLevel <= myLevel;
                  return (
                    <tr key={user.email} className="border-b border-[#F3F4F6] last:border-b-0 transition hover:bg-[#FAFAFA]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />
                          <div>
                            <p className="font-semibold text-[#0B1633]">
                              {user.name}
                              {isMe && (
                                <span className="ml-2 rounded-full bg-[#F26A21]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#F26A21]">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 font-mono text-[12px] text-[#6B7280]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {updatingEmail === user.email ? (
                          <Loader2 size={14} className="animate-spin text-[#F26A21]" />
                        ) : (
                          <RoleBadge role={user.role} />
                        )}
                      </td>
                      {/* <td className="px-6 py-4 text-[13px] text-[#5C667A]">
                        {user.department || <span className="text-[#C4C9D4]">—</span>}
                      </td> */}
                      <td className="px-6 py-4">
                        <ProjectsCell
                          email={user.email}
                          userProjects={getUserProjects(user.email)}
                          allProjects={projects}
                          canManage={canManageProjects}
                          onToggle={handleToggleProject}
                        />
                      </td>
                      <td className="px-6 py-4 font-mono text-[12px] text-[#6B7280]">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RoleDropdown
                          user={user}
                          assignableRoles={canManage ? assignableRoles : []}
                          onRoleChange={handleRoleChange}
                          disabled={updatingEmail === user.email}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showInvite && (
        <InviteModal
          assignableRoles={assignableRoles}
          onInvite={handleInvite}
          onClose={() => setShowInvite(false)}
        />
      )}

      {showNewProject && (
        <NewProjectModal
          onSave={handleCreateProject}
          onClose={() => setShowNewProject(false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-lg">
          <CheckCircle2 size={15} className="text-emerald-500" />
          <p className="text-[13px] font-medium text-[#0B1633]">{toast}</p>
        </div>
      )}
    </div>
  );
};

export default UsersView;
