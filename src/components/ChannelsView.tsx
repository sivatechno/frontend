import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Edit3,
  Eye,
  Hash,
  Lock,
  MessageSquare,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

/* simple unique id (no external dependency) */
let _idCounter = 0;
function uid(): string {
  return `${Date.now().toString(36)}-${(++_idCounter).toString(36)}`;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChannelMember {
  userId: string;
  name: string;
  email: string;
  initials: string;
  avatar?: string;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  department: string;
  visibility: "public" | "private";
  color: string;
  icon: string;
  members: ChannelMember[];
  ownerId: string;
  adminIds: string[];
  managerIds: string[];
  active: boolean;
  status: "active" | "pending" | "not_active";
  createdAt: string;
}

type ModalMode = "create" | "edit" | "delete" | "members" | null;

/* ------------------------------------------------------------------ */
/*  Mock data (available users / members pool)                         */
/* ------------------------------------------------------------------ */

const AVAILABLE_USERS: ChannelMember[] = [
  { userId: "u1", name: "Alice Johnson", email: "alice@decisionminds.com", initials: "AJ" },
  { userId: "u2", name: "Bob Smith", email: "bob@decisionminds.com", initials: "BS" },
  { userId: "u3", name: "Carol Davis", email: "carol@decisionminds.com", initials: "CD" },
  { userId: "u4", name: "David Wilson", email: "david@decisionminds.com", initials: "DW" },
  { userId: "u5", name: "Eva Martinez", email: "eva@decisionminds.com", initials: "EM" },
  { userId: "u6", name: "Frank Lee", email: "frank@decisionminds.com", initials: "FL" },
  { userId: "u7", name: "Grace Kim", email: "grace@decisionminds.com", initials: "GK" },
  { userId: "u8", name: "Henry Brown", email: "henry@decisionminds.com", initials: "HB" },
  { userId: "u9", name: "Iris Chen", email: "iris@decisionminds.com", initials: "IC" },
  { userId: "u10", name: "Jack Taylor", email: "jack@decisionminds.com", initials: "JT" },
];

const DEPARTMENTS = [
  "Engineering",
  "Analytics",
  "Quality Assurance",
  "Operations",
  "Human Resources",
  "Finance",
  "Leadership",
  "Product",
  "Client Delivery",
  "Sales",
  "Marketing",
  "Design",
];

const CHANNEL_COLORS = [
  "#F26A21", "#0a5791", "#059669", "#D97706", "#7C3AED",
  "#DB2777", "#0891B2", "#65A30D", "#DC2626", "#2563EB",
];

const CHANNEL_ICONS = ["#", "⚡", "📊", "🎯", "📢", "💡", "🔒", "⭐", "📁", "🔄"];

/* ------------------------------------------------------------------ */
/*  Default channels                                                   */
/* ------------------------------------------------------------------ */

const DEFAULT_CHANNELS: Channel[] = [
  {
    id: "ch-eng",
    name: "Engineering",
    description: "Engineering team discussions, code reviews, and technical planning.",
    department: "Engineering",
    visibility: "public",
    color: "#0a5791",
    icon: "#",
    members: [AVAILABLE_USERS[0], AVAILABLE_USERS[1], AVAILABLE_USERS[3], AVAILABLE_USERS[5]],
    ownerId: "u1",
    adminIds: ["u2"],
    managerIds: [],
    active: true,
    status: "active",
    createdAt: "2026-01-15",
  },
  {
    id: "ch-analytics",
    name: "Analytics",
    description: "Data analysis, reporting, and business intelligence discussions.",
    department: "Analytics",
    visibility: "public",
    color: "#059669",
    icon: "📊",
    members: [AVAILABLE_USERS[2], AVAILABLE_USERS[4], AVAILABLE_USERS[6]],
    ownerId: "u4",
    adminIds: ["u4"],
    managerIds: [],
    active: true,
    status: "active",
    createdAt: "2026-02-01",
  },
  {
    id: "ch-qa",
    name: "QA",
    description: "Quality assurance, testing strategies, and bug triage.",
    department: "Quality Assurance",
    visibility: "public",
    color: "#D97706",
    icon: "🎯",
    members: [AVAILABLE_USERS[0], AVAILABLE_USERS[5], AVAILABLE_USERS[7]],
    ownerId: "u5",
    adminIds: [],
    managerIds: [],
    active: true,
    status: "pending",
    createdAt: "2026-02-10",
  },
  {
    id: "ch-ops",
    name: "Operations",
    description: "Day-to-day operations, infrastructure, and process management.",
    department: "Operations",
    visibility: "private",
    color: "#7C3AED",
    icon: "⚡",
    members: [AVAILABLE_USERS[1], AVAILABLE_USERS[3], AVAILABLE_USERS[8]],
    ownerId: "u3",
    adminIds: ["u8"],
    managerIds: [],
    active: true,
    status: "active",
    createdAt: "2026-03-01",
  },
  {
    id: "ch-hr",
    name: "HR",
    description: "Human resources, recruitment, and employee engagement.",
    department: "Human Resources",
    visibility: "private",
    color: "#DB2777",
    icon: "📢",
    members: [AVAILABLE_USERS[2], AVAILABLE_USERS[6], AVAILABLE_USERS[9]],
    ownerId: "u6",
    adminIds: [],
    managerIds: [],
    active: true,
    status: "not_active",
    createdAt: "2026-03-15",
  },
  {
    id: "ch-finance",
    name: "Finance",
    description: "Financial planning, budgeting, and expense tracking.",
    department: "Finance",
    visibility: "private",
    color: "#0891B2",
    icon: "💡",
    members: [AVAILABLE_USERS[4], AVAILABLE_USERS[7]],
    ownerId: "u7",
    adminIds: ["u7"],
    managerIds: [],
    active: true,
    status: "active",
    createdAt: "2026-04-01",
  },
  {
    id: "ch-leadership",
    name: "Leadership",
    description: "Executive leadership team strategy and decision-making.",
    department: "Leadership",
    visibility: "private",
    color: "#DC2626",
    icon: "⭐",
    members: [AVAILABLE_USERS[0], AVAILABLE_USERS[3], AVAILABLE_USERS[6], AVAILABLE_USERS[8]],
    ownerId: "u0",
    adminIds: ["u3"],
    managerIds: [],
    active: true,
    status: "pending",
    createdAt: "2026-04-10",
  },
  {
    id: "ch-product",
    name: "Product Team",
    description: "Product roadmap, feature planning, and sprint reviews.",
    department: "Product",
    visibility: "public",
    color: "#65A30D",
    icon: "📁",
    members: [AVAILABLE_USERS[0], AVAILABLE_USERS[2], AVAILABLE_USERS[4], AVAILABLE_USERS[9]],
    ownerId: "u0",
    adminIds: ["u2"],
    managerIds: [],
    active: true,
    status: "active",
    createdAt: "2026-04-20",
  },
  {
    id: "ch-delivery",
    name: "Client Delivery",
    description: "Client project delivery, milestones, and stakeholder updates.",
    department: "Client Delivery",
    visibility: "public",
    color: "#2563EB",
    icon: "🔄",
    members: [AVAILABLE_USERS[1], AVAILABLE_USERS[5], AVAILABLE_USERS[7], AVAILABLE_USERS[8]],
    ownerId: "u1",
    adminIds: ["u5"],
    managerIds: [],
    active: true,
    status: "not_active",
    createdAt: "2026-05-01",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getOwnerName(channel: Channel): string {
  const m = channel.members.find((m) => m.userId === channel.ownerId);
  return m ? m.name : "Unassigned";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ================================================================== */
/*  ChannelsView Component                                              */
/* ================================================================== */

interface ChannelsViewProps {
  currentUser?: import("../types").UserInfo | null;
}

const ChannelsView: React.FC<ChannelsViewProps> = () => {
  /* ---- state ---- */
  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem("meetflow_channels");
      if (saved) {
        const parsed = JSON.parse(saved) as any[];
        // Migrate old data: fill in missing fields
        return parsed.map((ch) => ({
          ...DEFAULT_CHANNELS[0], // pull default field values
          ...ch,
          managerIds: ch.managerIds || [],
          status: ch.status || "active",
        }));
      }
    } catch { /* ignore */ }
    return DEFAULT_CHANNELS;
  });

  useEffect(() => {
    localStorage.setItem("meetflow_channels", JSON.stringify(channels));
  }, [channels]);

  const [searchQuery, setSearchQuery] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [detailChannel, setDetailChannel] = useState<Channel | null>(null);

  /* ---- derived ---- */
  const filteredChannels = useMemo(
    () =>
      channels.filter((ch) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          ch.name.toLowerCase().includes(q) ||
          ch.department.toLowerCase().includes(q)
        );
      }),
    [channels, searchQuery],
  );

  /* ---- handlers ---- */
  const handleSave = useCallback(
    (data: Omit<Channel, "id" | "createdAt" | "active" | "status" | "description"> & { id?: string }) => {
      if (data.id) {
        // edit
        setChannels((prev) =>
          prev.map((ch) => (ch.id === data.id ? { ...ch, ...data } : ch)),
        );
      } else {
        // create
        const newCh: Channel = {
          ...data,
          id: "ch-" + uid(),
          active: true,
          status: "active",
          createdAt: new Date().toISOString().slice(0, 10),
        };
        setChannels((prev) => [...prev, newCh]);
      }
      setModalMode(null);
      setSelectedChannel(null);
    },
    [],
  );

  const handleDelete = useCallback(() => {
    if (!selectedChannel) return;
    setChannels((prev) => prev.filter((ch) => ch.id !== selectedChannel.id));
    setModalMode(null);
    setSelectedChannel(null);
    if (detailChannel?.id === selectedChannel.id) setDetailChannel(null);
  }, [selectedChannel, detailChannel]);

  const handleAddMember = useCallback(
    (channelId: string, user: ChannelMember) => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId && !ch.members.some((m) => m.userId === user.userId)
            ? { ...ch, members: [...ch.members, user] }
            : ch,
        ),
      );
    },
    [],
  );

  const handleRemoveMember = useCallback(
    (channelId: string, userId: string) => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? {
                ...ch,
                members: ch.members.filter((m) => m.userId !== userId),
                adminIds: ch.adminIds.filter((id) => id !== userId),
                managerIds: (ch.managerIds || []).filter((id) => id !== userId),
                ownerId: ch.ownerId === userId ? ch.members.find((m) => m.userId !== userId)?.userId || ch.ownerId : ch.ownerId,
              }
            : ch,
        ),
      );
    },
    [],
  );

  const handleAssignOwner = useCallback(
    (channelId: string, userId: string) => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId ? { ...ch, ownerId: userId } : ch,
        ),
      );
    },
    [],
  );

  const handleToggleAdmin = useCallback(
    (channelId: string, userId: string) => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? {
                ...ch,
                adminIds: ch.adminIds.includes(userId)
                  ? ch.adminIds.filter((id) => id !== userId)
                  : [...ch.adminIds, userId],
              }
            : ch,
        ),
      );
    },
    [],
  );

  const handleToggleManager = useCallback(
    (channelId: string, userId: string) => {
      setChannels((prev) =>
        prev.map((ch) =>
          ch.id === channelId
            ? {
                ...ch,
                managerIds: (ch.managerIds || []).includes(userId)
                  ? (ch.managerIds || []).filter((id) => id !== userId)
                  : [...(ch.managerIds || []), userId],
              }
            : ch,
        ),
      );
    },
    [],
  );

  const handleUpdateChannel = useCallback(
    (channelId: string, updates: Partial<Channel>) => {
      setChannels((prev) =>
        prev.map((ch) => (ch.id === channelId ? { ...ch, ...updates } : ch)),
      );
    },
    [],
  );

  const openModal = (mode: ModalMode, channel?: Channel) => {
    setModalMode(mode);
    setSelectedChannel(channel || null);
  };

  /* ================================================================ */
  /*  Render                                                            */
  /* ================================================================ */

  if (detailChannel) {
    return (
      <ChannelDetailView
        channel={detailChannel}
        allUsers={AVAILABLE_USERS}
        onBack={() => setDetailChannel(null)}
        onEdit={(ch) => {
          setDetailChannel(ch);
          openModal("edit", ch);
        }}
        onDelete={(ch) => {
          setDetailChannel(null);
          openModal("delete", ch);
        }}
        onAddMember={(userId) => {
          const user = AVAILABLE_USERS.find((u) => u.userId === userId);
          if (user) handleAddMember(detailChannel.id, user);
        }}
        onRemoveMember={(userId) => handleRemoveMember(detailChannel.id, userId)}
        onAssignOwner={(userId) => handleAssignOwner(detailChannel.id, userId)}
        onToggleAdmin={(userId) => handleToggleAdmin(detailChannel.id, userId)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B1633]">All Channels</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            {channels.length} channel{channels.length !== 1 ? "s" : ""} across your workspace
          </p>
        </div>
        <button
          onClick={() => openModal("create")}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#F26A21] px-5 text-sm font-bold text-white shadow-button transition hover:bg-[#E55D1B]"
        >
          <Plus size={17} />
          Create Channel
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-sm text-[#0B1633] outline-none placeholder:text-[#9CA3AF] focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Channel Grid */}
      {filteredChannels.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-10 text-center">
          <MessageSquare size={40} className="text-[#9CA3AF]" />
          <p className="mt-4 text-lg font-bold text-[#0B1633]">No channels found</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {searchQuery ? "Try a different search term" : "Create your first channel to get started"}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onView={() => setDetailChannel(channel)}
              onEdit={() => openModal("edit", channel)}
              onDelete={() => openModal("delete", channel)}
              onUpdateChannel={handleUpdateChannel}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onAssignOwner={handleAssignOwner}
              onToggleAdmin={handleToggleAdmin}
              onToggleManager={handleToggleManager}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(modalMode === "create" || modalMode === "edit") && (
        <ChannelFormModal
          mode={modalMode}
          channel={selectedChannel}
          onSave={handleSave}
          onClose={() => {
            setModalMode(null);
            setSelectedChannel(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {modalMode === "delete" && selectedChannel && (
        <ConfirmDeleteModal
          channel={selectedChannel}
          onConfirm={handleDelete}
          onCancel={() => {
            setModalMode(null);
            setSelectedChannel(null);
          }}
        />
      )}
    </div>
  );
};

/* ================================================================== */
/*  Channel Card                                                        */
/* ================================================================== */

const ChannelCard: React.FC<{
  channel: Channel;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateChannel: (channelId: string, updates: Partial<Channel>) => void;
  onAddMember: (channelId: string, user: ChannelMember) => void;
  onRemoveMember: (channelId: string, userId: string) => void;
  onAssignOwner: (channelId: string, userId: string) => void;
  onToggleAdmin: (channelId: string, userId: string) => void;
  onToggleManager: (channelId: string, userId: string) => void;
}> = ({ channel, onView, onEdit, onDelete, onUpdateChannel, onAddMember, onRemoveMember, onAssignOwner, onToggleAdmin, onToggleManager }) => {
  const memberCount = channel.members.length;
  const ownerName = getOwnerName(channel);
  const [editingName, setEditingName] = useState(false);
  const [editingDept, setEditingDept] = useState(false);
  const [draftName, setDraftName] = useState(channel.name);
  const [draftDept, setDraftDept] = useState(channel.department);
  const [showMembers, setShowMembers] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"member" | "admin" | "manager" | "owner">("member");

  const statusMeta: Record<string, { dot: string; label: string; color: string }> = {
    active: { dot: "bg-emerald-500", label: "Active", color: "text-emerald-600 bg-emerald-500/10" },
    pending: { dot: "bg-amber-500", label: "Pending", color: "text-amber-600 bg-amber-500/10" },
    not_active: { dot: "bg-gray-400", label: "Not Active", color: "text-gray-500 bg-gray-100" },
  };

  const meta = statusMeta[channel.status] || statusMeta.not_active;

  const commitName = () => {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== channel.name) {
      onUpdateChannel(channel.id, { name: trimmed });
    } else {
      setDraftName(channel.name);
    }
    setEditingName(false);
  };

  const commitDept = () => {
    if (draftDept !== channel.department) {
      onUpdateChannel(channel.id, { department: draftDept });
    }
    setEditingDept(false);
  };

  const handleAddCustomMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    // Check for duplicate by name
    if (channel.members.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) return;
    const uid_ = "cm-" + uid();
    const initials = trimmed
      .split(" ")
      .map((s) => s[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const newMember: ChannelMember = {
      userId: uid_,
      name: trimmed,
      email: "",
      initials,
    };
    onAddMember(channel.id, newMember);
    // If role is owner, admin or manager, apply after adding
    if (newMemberRole === "owner") {
      onAssignOwner(channel.id, uid_);
    } else if (newMemberRole === "admin") {
      onToggleAdmin(channel.id, uid_);
    } else if (newMemberRole === "manager") {
      onToggleManager(channel.id, uid_);
    }
    setNewMemberName("");
    setNewMemberRole("member");
  };

  const handleRoleChange = (member: ChannelMember, role: "member" | "admin" | "manager" | "owner") => {
    const isOwner = member.userId === channel.ownerId;
    const isAdmin = (channel.adminIds || []).includes(member.userId);
    const isManager = (channel.managerIds || []).includes(member.userId);
    if (role === "owner" && !isOwner) {
      onAssignOwner(channel.id, member.userId);
    } else if (role === "admin") {
      if (!isAdmin) onToggleAdmin(channel.id, member.userId);
      if (isManager) onToggleManager(channel.id, member.userId);
    } else if (role === "manager") {
      if (!isManager) onToggleManager(channel.id, member.userId);
      if (isAdmin) onToggleAdmin(channel.id, member.userId);
    } else if (role === "member") {
      if (isOwner && channel.members.length > 1) {
        const nextOwner = channel.members.find((m) => m.userId !== member.userId);
        if (nextOwner) onAssignOwner(channel.id, nextOwner.userId);
      }
      if (isAdmin) onToggleAdmin(channel.id, member.userId);
      if (isManager) onToggleManager(channel.id, member.userId);
    }
  };

  const getMemberRole = (member: ChannelMember): "owner" | "admin" | "manager" | "member" => {
    if (member.userId === channel.ownerId) return "owner";
    if ((channel.adminIds || []).includes(member.userId)) return "admin";
    if ((channel.managerIds || []).includes(member.userId)) return "manager";
    return "member";
  };

  return (
    <article className="group relative rounded-2xl border border-[#E5E7EB] bg-white shadow-card transition hover:shadow-lg">
      {/* Top row: icon + badges */}
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white"
            style={{ backgroundColor: channel.color }}
          >
            {channel.icon}
          </div>
          <div className="min-w-0">
            {editingName ? (
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setDraftName(channel.name); setEditingName(false); } }}
                className="w-full rounded-lg border border-[#F26A21]/50 bg-white px-2 py-1 text-lg font-bold text-[#0B1633] outline-none ring-1 ring-[#F26A21]/20"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3
                className="cursor-pointer text-lg font-bold text-[#0B1633] transition hover:text-[#F26A21]"
                onClick={onView}
              >
                {channel.name}
              </h3>
            )}
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                channel.visibility === "public"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {channel.visibility === "public" ? (
                <Eye size={12} />
              ) : (
                <Lock size={12} />
              )}
              {channel.visibility === "public" ? "Public" : "Private"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditingName(true); setDraftName(channel.name); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F8F7F5] hover:text-[#0B1633]"
            title="Edit channel name"
          >
            <Edit3 size={15} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-red-50 hover:text-red-500"
            title="Delete channel"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Department editable */}
      <div className="mt-3 px-5">
        <label className="mb-1 block text-xs font-semibold text-[#5C667A]">
          Department / Team
        </label>
        {editingDept ? (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              list="dept-list"
              value={draftDept}
              onChange={(e) => setDraftDept(e.target.value)}
              onBlur={commitDept}
              onKeyDown={(e) => { if (e.key === "Enter") commitDept(); if (e.key === "Escape") { setDraftDept(channel.department); setEditingDept(false); } }}
              placeholder="Type or select department..."
              className="h-9 flex-1 rounded-lg border border-[#F26A21]/50 bg-white px-2 text-sm text-[#0B1633] outline-none ring-1 ring-[#F26A21]/20"
            />
            <datalist id="dept-list">
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
            <button
              onClick={(e) => { e.stopPropagation(); commitDept(); }}
              className="flex h-9 items-center rounded-lg bg-[#F26A21] px-3 text-xs font-bold text-white transition hover:bg-[#E55D1B]"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setEditingDept(true); setDraftDept(channel.department); }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8F7F5] px-2.5 py-1.5 text-xs font-medium text-[#5C667A] transition hover:bg-[#F26A21]/10 hover:text-[#F26A21]"
          >
            <Hash size={12} />
            {channel.department}
            <Edit3 size={11} className="opacity-0 group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Status badge */}
      <div className="mt-3 px-5">
        <label className="mb-1 block text-xs font-semibold text-[#5C667A]">
          Project Status
        </label>
        <div className="flex gap-2">
          {["active", "pending", "not_active"].map((s) => {
            const m = statusMeta[s];
            const isSelected = channel.status === s;
            return (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); onUpdateChannel(channel.id, { status: s as Channel["status"] }); }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? `${m.color} ring-1 ring-current`
                    : "bg-[#F8F7F5] text-[#9CA3AF] hover:bg-[#E5E7EB]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isSelected ? m.dot : "bg-[#D1D5DB]"}`} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Members section */}
      <div className="mt-4 border-t border-[#F3F4F6]">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMembers(!showMembers); }}
          className="flex w-full items-center justify-between px-5 py-3 text-xs font-semibold text-[#6B7280] transition hover:text-[#0B1633]"
        >
          <span className="inline-flex items-center gap-1.5">
            <Users size={14} />
            {channel.members.length} member{channel.members.length !== 1 ? "s" : ""}
          </span>
          <span className="text-[#9CA3AF]">{showMembers ? "▲" : "▼"}</span>
        </button>

        {showMembers && (
          <div className="border-t border-[#F3F4F6] px-5 pb-5">
            {/* Add member form */}
            <div className="mb-3 mt-3 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className="mb-0.5 block text-xs text-[#9CA3AF]">Add member</label>
                <input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); handleAddCustomMember(); } }}
                  placeholder="Enter name..."
                  className="h-8 w-full rounded-lg border border-[#E5E7EB] bg-white px-2.5 text-xs text-[#0B1633] outline-none placeholder:text-[#9CA3AF] focus:border-[#F26A21]/50 focus:ring-1 focus:ring-[#F26A21]/20"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as "member" | "admin" | "manager" | "owner")}
                className="h-8 rounded-lg border border-[#E5E7EB] bg-white px-2 text-xs text-[#0B1633] outline-none focus:border-[#F26A21]/50"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="member">Member</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
              <button
                onClick={(e) => { e.stopPropagation(); handleAddCustomMember(); }}
                disabled={!newMemberName.trim()}
                className="flex h-8 items-center gap-1 rounded-lg bg-[#F26A21] px-3 text-xs font-bold text-white transition hover:bg-[#E55D1B] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
              >
                <UserPlus size={13} />
                Add
              </button>
            </div>

            {/* Member list */}
            {channel.members.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#9CA3AF]">No members yet.</p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {channel.members.map((member) => {
                  const role = getMemberRole(member);
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-[#F8F7F5]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F26A21] text-[10px] font-bold text-white">
                        {member.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[#0B1633]">
                          {member.name}
                        </p>
                      </div>
                      {/* Role selector */}
                      {/* Role selector */}
                      <select
                        value={role}
                        onChange={(e) => {
                          handleRoleChange(member, e.target.value as "member" | "admin" | "manager" | "owner");
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold outline-none ${
                          role === "owner"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : role === "admin"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : role === "manager"
                            ? "border-purple-200 bg-purple-50 text-purple-700"
                            : "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveMember(channel.id, member.userId); }}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#9CA3AF] transition hover:bg-red-50 hover:text-red-500"
                        title="Remove member"
                      >
                        <UserMinus size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#F3F4F6] px-5 py-4 text-xs text-[#6B7280]">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <UserCheck size={14} />
          {ownerName}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 font-semibold">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>
    </article>
  );
};

/* ================================================================== */
/*  Channel Detail View (member management page)                        */
/* ================================================================== */

const ChannelDetailView: React.FC<{
  channel: Channel;
  allUsers: ChannelMember[];
  onBack: () => void;
  onEdit: (ch: Channel) => void;
  onDelete: (ch: Channel) => void;
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  onAssignOwner: (userId: string) => void;
  onToggleAdmin: (userId: string) => void;
}> = ({
  channel,
  allUsers,
  onBack,
  onEdit,
  onDelete,
  onAddMember,
  onRemoveMember,
  onAssignOwner,
  onToggleAdmin,
}) => {
  const ownerName = getOwnerName(channel);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const nonMembers = allUsers.filter(
    (u) => !channel.members.some((m) => m.userId === u.userId),
  );

  const filteredNonMembers = nonMembers.filter((u) => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Back button & header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
            style={{ backgroundColor: channel.color }}
          >
            {channel.icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0B1633]">{channel.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(channel)}
            className="flex h-9 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#5C667A] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
          >
            <Edit3 size={15} />
            Edit
          </button>
          <button
            onClick={() => onDelete(channel)}
            className="flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-500 transition hover:border-red-400 hover:bg-red-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      {/* Channel meta bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white px-5 py-4">
        <span className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
          <Users size={15} />
          <span className="font-medium text-[#0B1633]">{channel.members.length}</span> members
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
          <Hash size={15} />
          {channel.department}
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
          {channel.visibility === "public" ? <Eye size={15} /> : <Lock size={15} />}
          {channel.visibility === "public" ? "Public" : "Private"}
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
          <UserCheck size={15} />
          Owner: <span className="font-medium text-[#0B1633]">{ownerName}</span>
        </span>
        {channel.active && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Active
          </span>
        )}
      </div>

      {/* Members section */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#0B1633]">
            <Users size={18} />
            Members ({channel.members.length})
          </h3>
          <button
            onClick={() => setShowAddPanel(!showAddPanel)}
            className="flex h-9 items-center gap-2 rounded-lg bg-[#F26A21] px-4 text-sm font-bold text-white transition hover:bg-[#E55D1B]"
          >
            <UserPlus size={15} />
            {showAddPanel ? "Close" : "Add Member"}
          </button>
        </div>

        {/* Add member panel */}
        {showAddPanel && (
          <div className="border-b border-[#F3F4F6] bg-[#F8F7F5] px-6 py-4">
            <div className="relative mb-3 max-w-xs">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-sm text-[#0B1633] outline-none placeholder:text-[#9CA3AF] focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
                placeholder="Search users..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredNonMembers.length === 0 ? (
                <p className="py-2 text-sm text-[#9CA3AF]">No users available</p>
              ) : (
                filteredNonMembers.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => {
                      onAddMember(u.userId);
                      setMemberSearch("");
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#5C667A] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F26A21]/10 text-xs font-bold text-[#F26A21]">
                      {u.initials}
                    </span>
                    {u.name}
                    <Plus size={14} />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Member list */}
        <div className="divide-y divide-[#F3F4F6]">
          {channel.members.map((member) => {
            const isOwner = member.userId === channel.ownerId;
            const isAdmin = channel.adminIds.includes(member.userId);
            return (
              <div
                key={member.userId}
                className="flex items-center gap-4 px-6 py-4 transition hover:bg-[#F8F7F5]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F26A21] text-sm font-bold text-white">
                  {member.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-[#0B1633]">
                    {member.name}
                    {isOwner && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600">
                        Owner
                      </span>
                    )}
                    {isAdmin && !isOwner && (
                      <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#6B7280]">{member.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!isOwner && (
                    <>
                      <button
                        onClick={() => onAssignOwner(member.userId)}
                        className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-[#6B7280] transition hover:bg-amber-50 hover:text-amber-600"
                        title="Assign as owner"
                      >
                        <UserCheck size={13} />
                        Owner
                      </button>
                      <button
                        onClick={() => onToggleAdmin(member.userId)}
                        className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition ${
                          isAdmin
                            ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                            : "text-[#6B7280] hover:bg-blue-50 hover:text-blue-600"
                        }`}
                        title={isAdmin ? "Remove admin" : "Make admin"}
                      >
                        <SlidersHorizontal size={13} />
                        {isAdmin ? "Admin" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => onRemoveMember(member.userId)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-red-50 hover:text-red-500"
                        title="Remove member"
                      >
                        <UserMinus size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {channel.members.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-[#9CA3AF]">
              No members yet. Add members to this channel.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Create / Edit Channel Form Modal                                    */
/* ================================================================== */

const ChannelFormModal: React.FC<{
  mode: "create" | "edit";
  channel: Channel | null;
  onSave: (data: Omit<Channel, "id" | "createdAt" | "active" | "status" | "description"> & { id?: string }) => void;
  onClose: () => void;
}> = ({ mode, channel, onSave, onClose }) => {
  const [name, setName] = useState(channel?.name || "");
  const [department, setDepartment] = useState(channel?.department || DEPARTMENTS[0]);
  const [visibility, setVisibility] = useState<"public" | "private">(
    channel?.visibility || "public",
  );
  const [color, setColor] = useState(channel?.color || CHANNEL_COLORS[0]);
  const [icon, setIcon] = useState(channel?.icon || CHANNEL_ICONS[0]);

  const canSave = name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      id: channel?.id,
      name: name.trim(),
      department,
      visibility,
      color,
      icon,
      members: channel?.members || [],
      ownerId: channel?.ownerId || "",
      adminIds: channel?.adminIds || [],
      managerIds: channel?.managerIds || [],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 border-b border-[#F3F4F6] bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0B1633]">
              {mode === "create" ? "Create Channel" : "Edit Channel"}
            </h3>
            <button
              onClick={onClose}
              className="text-[#9CA3AF] transition hover:text-[#0B1633]"
            >
              <XCircle size={22} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Channel Name */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#0B1633]">
              Channel Name <span className="text-red-500">*</span>
            </label>
            <input
              className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#0B1633] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
              placeholder="e.g. Engineering"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Department */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#0B1633]">
              Department / Team Type
            </label>
            <select
              className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#0B1633] outline-none transition focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#0B1633]">
              Visibility
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={`flex flex-1 items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
                  visibility === "public"
                    ? "border-[#F26A21] bg-[#F26A21]/5 text-[#F26A21]"
                    : "border-[#E5E7EB] text-[#5C667A] hover:border-[#F26A21]/40"
                }`}
              >
                <Eye size={20} />
                <div className="text-left">
                  <p className="text-sm font-bold">Public</p>
                  <p className="text-xs text-[#6B7280]">Anyone can join</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`flex flex-1 items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
                  visibility === "private"
                    ? "border-[#F26A21] bg-[#F26A21]/5 text-[#F26A21]"
                    : "border-[#E5E7EB] text-[#5C667A] hover:border-[#F26A21]/40"
                }`}
              >
                <Lock size={20} />
                <div className="text-left">
                  <p className="text-sm font-bold">Private</p>
                  <p className="text-xs text-[#6B7280]">By invitation only</p>
                </div>
              </button>
            </div>
          </div>

          {/* Icon / Color */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#0B1633]">
              Channel Avatar & Color
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {icon}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {CHANNEL_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                        icon === ic
                          ? "bg-[#F26A21]/10 text-[#F26A21] ring-2 ring-[#F26A21]/40"
                          : "bg-[#F8F7F5] text-[#5C667A] hover:bg-[#E5E7EB]"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CHANNEL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-6 w-6 rounded-full border-2 transition ${
                        color === c ? "border-[#0B1633] scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#F3F4F6] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-[#E5E7EB] bg-white px-6 text-sm font-medium text-[#5C667A] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSave}
              className="h-10 rounded-xl bg-[#F26A21] px-6 text-sm font-bold text-white shadow-button transition hover:bg-[#E55D1B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode === "create" ? "Create Channel" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================================================================== */
/*  Delete Confirmation Modal                                           */
/* ================================================================== */

const ConfirmDeleteModal: React.FC<{
  channel: Channel;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ channel, onConfirm, onCancel }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    onClick={onCancel}
  >
    <div
      className="mx-4 w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          <Trash2 size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#0B1633]">Delete Channel</h3>
          <p className="text-sm text-[#6B7280]">
            Are you sure you want to delete{" "}
            <span className="font-bold text-[#0B1633]">{channel.name}</span>?
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
        This action cannot be undone. All channel data and member associations will be permanently removed.
      </p>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={onCancel}
          className="h-10 rounded-xl border border-[#E5E7EB] bg-white px-6 text-sm font-medium text-[#5C667A] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="h-10 rounded-xl bg-red-500 px-6 text-sm font-bold text-white transition hover:bg-red-600"
        >
          Delete Channel
        </button>
      </div>
    </div>
  </div>
);

export default ChannelsView;
