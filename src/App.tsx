import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  AlignLeft,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  FolderInput,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Sparkles,
  UserCog,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  Users,
  Video,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
import AnalyticsView from "./components/AnalyticsView";
import AutonomousPanel from "./components/AutonomousPanel";
import FileUpload from "./components/FileUpload";
import FollowUpPanel from "./components/FollowUpPanel";
import InsightsPanel from "./components/InsightsPanel";
import UnifiedChatbot from "./components/UnifiedChatbot";
import KnowledgeBaseView from "./components/KnowledgeBaseView";
import RecommendationsPanel from "./components/RecommendationsPanel";
import WorkflowBuilder from "./components/WorkflowBuilder";
import IntegrationsView from "./components/IntegrationsView";
import ChannelsView from "./components/ChannelsView";
import UsersView from "./components/UsersView";
import NotificationDropdown from "./components/NotificationDropdown";
import LogTerminal from "./components/LogTerminal";
import ResultsPanel from "./components/ResultsPanel";
import SharePointInput from "./components/SharePointInput";
import TabSelector from "./components/TabSelector";
import TaskDetailModal from "./components/TaskDetailModal";
import {
  analyzeSharePointUrl,
  createLogStream,
  createUser,
  fetchDashboard,
  fetchMeetingDetail,
  fetchMeetings,
  fetchTasks,
  getCurrentUser,
  getJobStatus,
  login,
  logout,
  updateTaskStatus,
  uploadVideo,
} from "./services/api";
import type { MeetingDetailData } from "./services/api";
import type { DashboardData, JobStatus, MeetingInfo, TaskInfo, UserInfo } from "./types";

type View = "overview" | "tasks" | "meetings" | "analytics" | "upload" | "integrations" | "autonomous" | "followups" | "knowledge" | "recommendations" | "workflows" | "channels" | "users";
type Priority = "High" | "Medium" | "Low";
type TaskStatus = "todo" | "progress" | "done";

const ROLE_LEVEL: Record<string, number> = {
  admin: 100, executive: 80, manager: 60,
  team_lead: 50, member: 30, client: 20, guest: 10,
};

const ROLE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  admin:     { label: "Admin",     bg: "#EDE9FE", text: "#7C3AED" },
  executive: { label: "Executive", bg: "#DBEAFE", text: "#1D4ED8" },
  manager:   { label: "Manager",   bg: "#D1FAE5", text: "#065F46" },
  team_lead: { label: "Team Lead", bg: "#CFFAFE", text: "#0E7490" },
  member:    { label: "Member",    bg: "#F3F4F6", text: "#374151" },
  client:    { label: "Client",    bg: "#FEF3C7", text: "#92400E" },
  guest:     { label: "Guest",     bg: "#F3F4F6", text: "#6B7280" },
};

// Minimum role level required to see each nav item
const NAV_MIN_LEVEL: Record<string, number> = {
  overview: 10, tasks: 30, followups: 50, meetings: 10,
  analytics: 50, upload: 30, integrations: 60,
  autonomous: 80, channels: 10, knowledge: 50,
  recommendations: 50, workflows: 60, users: 80,
};

interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
  count?: number;
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Main",
    items: [
      { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
      { id: "tasks" as const, label: "Task Board", icon: ClipboardList },
      { id: "followups" as const, label: "Follow-ups", icon: MessageSquare },
      { id: "meetings" as const, label: "Meetings", icon: Video },
      { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Ingest",
    items: [
      { id: "upload" as const, label: "Upload Meeting", icon: Upload },
      { id: "integrations" as const, label: "Integrations", icon: Wrench },
      { id: "autonomous" as const, label: "Autonomous", icon: ShieldCheck },
    ],
  },
  {
    label: "Admin",
    items: [
      { id: "users" as const, label: "Users & Roles", icon: UserCog },
    ],
  },
];

const channelLinks = [
  { id: "channels" as const, label: "My Workspace", icon: Users },
];

const priorityClasses: Record<Priority, string> = {
  High: "bg-red-500",
  Medium: "bg-amber-500",
  Low: "bg-emerald-500",
};

const App: React.FC = () => {
  const [authScreen, setAuthScreen] = useState<"login" | "signup" | "app">("login");
  const [authError, setAuthError] = useState("");
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [_authToken, setAuthToken] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>("overview");
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(
    () => !!localStorage.getItem("dm_token")
  );

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("dm_token");
    const storedSession = localStorage.getItem("dm_session");
    if (!storedToken) { setSessionChecking(false); return; }

    // Abort if backend takes > 6 s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    getCurrentUser(storedToken)
      .then((user) => {
        setCurrentUser(user);
        setAuthToken(storedToken);
        if (storedSession) setSessionId(storedSession);
        setAuthScreen("app");
      })
      .catch(() => {
        localStorage.removeItem("dm_token");
        localStorage.removeItem("dm_session");
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setSessionChecking(false);
      });
  }, []);

  const [activeTab, setActiveTab] = useState<"sharepoint" | "upload">("sharepoint");
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [meetingsData, setMeetingsData] = useState<MeetingInfo[]>([]);
  const [tasksData, setTasksData] = useState<TaskInfo[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [taskOwnerFilter, setTaskOwnerFilter] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<TaskInfo | null>(null);

  useEffect(() => {
    if (!jobId) return;
    if (status?.status === "completed" || status?.status === "failed") return;

    const interval = window.setInterval(async () => {
      try {
        const data = await getJobStatus(jobId);
        setStatus(data);
        if (data.status === "completed" || data.status === "failed") {
          setIsProcessing(false);
        }
      } catch (err) {
        console.error("Failed to fetch status", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, status?.status]);

  useEffect(() => {
    if (!jobId) return;

    setLogs([]);
    const eventSource = createLogStream(jobId);
    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSource.close();
        return;
      }
      setLogs((prev) => [...prev, event.data]);
    };
    eventSource.onerror = () => eventSource.close();

    return () => eventSource.close();
  }, [jobId]);

  const loadData = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [meetings, tasks, dashboard] = await Promise.all([
        fetchMeetings(),
        fetchTasks(),
        fetchDashboard(),
      ]);
      setMeetingsData(meetings);
      setTasksData(tasks);
      setDashboardData(dashboard);
    } catch (err) {
      console.error("Failed to load data", err);
      setDataError("Unable to load tasks");
    } finally {
      setDataLoading(false);
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    setTasksData((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } satisfies TaskInfo : t))
    );
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error("Failed to persist task move", err);
    }
  };

  const handleTaskUpdated = () => {
    setSelectedTask(null);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [activeView]);

  // Refresh data after job completion
  useEffect(() => {
    if (status?.status === "completed" || status?.status === "failed") {
      loadData();
    }
  }, [status?.status]);

  const userLevel = ROLE_LEVEL[currentUser?.role ?? "member"] ?? 30;

  const filteredNavGroups = useMemo(
    () =>
      navGroups
        .map((g) => ({ ...g, items: g.items.filter((i) => (NAV_MIN_LEVEL[i.id] ?? 0) <= userLevel) }))
        .filter((g) => g.items.length > 0),
    [userLevel],
  );

  const taskCountByStatus = useMemo(() => ({
    todo: tasksData.filter((t) => t.status === "todo").length,
    progress: tasksData.filter((t) => t.status === "progress").length,
    done: tasksData.filter((t) => t.status === "done").length,
  }), [tasksData]);

  const totalTasks = tasksData.length;
  const isRunning =
    !!jobId && status?.status !== "completed" && status?.status !== "failed";

  const currentTitle =
    activeView === "tasks"
      ? "Task Board"
      : activeView === "followups"
      ? "Follow-ups & Learning"
      : activeView === "meetings"
      ? "Meetings"
      : activeView === "upload"
      ? "Upload Meeting"
      : activeView === "integrations"
      ? "Integrations"
      : activeView === "analytics"
      ? "Analytics"
      : activeView === "autonomous"
      ? "Autonomous Mode"
      : activeView === "channels"
      ? "All Workspace"
      : activeView === "users"
      ? "Users & Roles"
      : "Overview";

  const handleSharePointSubmit = async (url: string) => {
    setIsProcessing(true);
    setLogs([]);
    setJobId(null);
    setStatus(null);
    try {
      const data = await analyzeSharePointUrl(url);
      setJobId(data.job_id);
      setStatus(data);
    } catch (err) {
      console.error("SharePoint analysis failed", err);
      setLogs(["Error: Failed to analyze SharePoint URL."]);
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    const maxUploadSizeMB = 2000;
    if (file.size > maxUploadSizeMB * 1024 * 1024) {
      setLogs([`Error: File is too large. Maximum upload is ${maxUploadSizeMB}MB.`]);
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setJobId(null);
    setStatus(null);
    try {
      const data = await uploadVideo(file);
      setJobId(data.job_id);
      setStatus(data);
    } catch (err) {
      console.error("Upload failed", err);
      setLogs([`Error: ${err instanceof Error ? err.message : "Upload failed."}`]);
      setIsProcessing(false);
    }
  };

  const openUpload = () => {
    setActiveView("upload");
    setActiveTab("upload");
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    localStorage.setItem("dm_token", result.token);
    localStorage.setItem("dm_session", result.session_id);
    setAuthToken(result.token);
    setSessionId(result.session_id);
    setCurrentUser(result.user);
    setAuthScreen("app");
  };

  const handleSignUp = async (name: string, email: string, department: string, _role: string) => {
    try {
      await createUser({ name: name || email.split("@")[0], email, role: "member", department });
    } catch {
      // Pre-invited: account already exists with pre-assigned role
    }
    const result = await login(email, "");
    localStorage.setItem("dm_token", result.token);
    localStorage.setItem("dm_session", result.session_id);
    setAuthToken(result.token);
    setSessionId(result.session_id);
    setCurrentUser(result.user);
    // Transition handled by useEffect below — lets SignUpPage show its success screen
  };

  // After signup, show success screen briefly then enter app
  useEffect(() => {
    if (currentUser && authScreen === "signup") {
      const timer = setTimeout(() => setAuthScreen("app"), 1600);
      return () => clearTimeout(timer);
    }
  }, [currentUser, authScreen]);

  const handleSignOut = async () => {
    try { if (sessionId) await logout(sessionId); } catch { /* ignore */ }
    localStorage.removeItem("dm_token");
    localStorage.removeItem("dm_session");
    setCurrentUser(null);
    setAuthToken(null);
    setSessionId(null);
    setAuthScreen("login");
  };

  if (sessionChecking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-5 bg-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F26A21] shadow-lg shadow-orange-200">
          <Video size={24} className="text-white" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[15px] font-bold text-[#0B1633]">Decision Minds</p>
          <p className="text-[12px] text-[#9CA3AF]">Restoring your session…</p>
        </div>
        <Loader2 size={18} className="animate-spin text-[#F26A21]" />
      </div>
    );
  }

  if (authScreen === "login") {
    return (
      <LoginPage
        onLogin={handleLogin}
        onGoSignUp={() => { setAuthError(""); setAuthScreen("signup"); }}
        error={authError}
      />
    );
  }

  if (authScreen === "signup") {
    return (
      <SignUpPage
        onSignUp={handleSignUp}
        onGoLogin={() => { setAuthError(""); setAuthScreen("login"); }}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F5] text-[#0B1633]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] border-r border-[#ECEEF2] bg-white lg:flex lg:flex-col">
        <div className="flex h-[62px] items-center border-b border-[#ECEEF2] px-6">
          <BrandMark />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Workspace card */}
          <div className="rounded-xl border border-[#ECEEF2] bg-[#FAFAFA] px-4 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-[#9CA3AF]">Workspace</p>
                <p className="mt-1 truncate text-[13.5px] font-semibold text-[#0B1633]">Decision Minds</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentUser && (() => {
                  const badge = ROLE_BADGE[currentUser.role] ?? ROLE_BADGE.member;
                  return (
                    <span className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                      style={{ background: badge.bg, color: badge.text }}>
                      {badge.label}
                    </span>
                  );
                })()}
                <ChevronDown size={14} className="text-[#C4C9D4]" />
              </div>
            </div>
          </div>

          <nav className="mt-7 space-y-6">
            {filteredNavGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#C4C9D4]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const displayCount = item.id === "tasks" ? totalTasks || undefined : item.count;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`group flex h-[40px] w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors duration-100 ${
                          activeView === item.id
                            ? "bg-[#F26A21]/10 text-[#F26A21] font-medium"
                            : "text-[#6B7280] hover:bg-[#F5F5F7] hover:text-[#0B1633]"
                        }`}
                      >
                        <item.icon size={16} className="shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {displayCount ? (
                          <span className="rounded-md bg-[#0B1633]/6 px-1.5 py-0.5 text-[11px] text-[#9CA3AF]">
                            {displayCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Channels — always visible */}
            {(NAV_MIN_LEVEL["channels"] ?? 0) <= userLevel && (
              <div>
                <p className="mb-2 px-2 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#C4C9D4]">Workspace</p>
                <div className="space-y-0.5">
                  {channelLinks.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`group flex h-[40px] w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] transition-colors duration-100 ${
                        activeView === item.id
                          ? "bg-[#F26A21]/10 text-[#F26A21] font-medium"
                          : "text-[#6B7280] hover:bg-[#F5F5F7] hover:text-[#0B1633]"
                      }`}
                    >
                      <item.icon size={16} className="shrink-0" />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* User profile + sign-out footer */}
        {currentUser && (
          <div className="border-t border-[#ECEEF2] px-4 py-4">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F26A21] text-[12px] font-semibold text-white">
                {currentUser.avatar || currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-[#0B1633]">{currentUser.name}</p>
                <p className="truncate text-[11px] capitalize text-[#9CA3AF]">{currentUser.department || currentUser.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#C4C9D4] transition hover:bg-red-50 hover:text-red-400"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-[62px] items-center justify-between border-b border-[#E5E7EB] bg-white/95 px-5 backdrop-blur md:px-8">
          <h1 className="text-xl font-bold tracking-normal text-[#0B1633]">{currentTitle}</h1>
          <div className="flex items-center gap-2.5">
            <span className="hidden border-r border-[#E5E7EB] pr-4 font-mono text-sm text-[#6B7280] sm:block">
              Workspace
            </span>
            <button
              onClick={openUpload}
              className="hidden h-9 items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 text-sm font-medium text-[#0B1633] transition hover:border-[#F26A21]/40 hover:text-[#F26A21] md:flex"
            >
              <Plus size={16} />
              New Meeting
            </button>

            {/* ── AI Assistant Header Button ── */}
            <button
              onClick={() => setChatbotOpen((v) => !v)}
              aria-label="AI Assistant"
              className="chatbot-header-btn relative flex h-10 items-center gap-2 overflow-hidden rounded-xl px-3.5 text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: chatbotOpen
                  ? "linear-gradient(135deg, #1a2850 0%, #F26A21 100%)"
                  : "linear-gradient(135deg, #F26A21 0%, #b84d0e 100%)",
                boxShadow: chatbotOpen
                  ? "0 0 0 2px rgba(242,106,33,0.3), 0 4px 16px rgba(242,106,33,0.25)"
                  : "0 0 0 2px rgba(242,106,33,0.15), 0 4px 12px rgba(242,106,33,0.2)",
              }}
            >
              {/* Shine overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 55%)" }}
              />
              <div className="relative z-10 flex items-center gap-1.5">
                <Bot size={16} />
                <Sparkles
                  size={9}
                  className="absolute -top-2 -right-2 text-yellow-200 opacity-80"
                />
              </div>
              <span className="relative z-10 hidden text-[13px] font-bold tracking-tight sm:block">
                {chatbotOpen ? "Close AI" : "Ask AI"}
              </span>
              {!chatbotOpen && (
                <span className="relative z-10 flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              )}
            </button>

            <NotificationDropdown onNavigate={(v) => setActiveView(v as View)} />
            <IconButton label="Search">
              <Search size={20} />
            </IconButton>
          </div>
        </header>

        <div className="min-h-[calc(100vh-62px)] bg-[#F8F7F5] px-5 py-7 md:px-8">
          {activeView === "overview" && (
            <OverviewView
              dashboard={dashboardData}
              loading={dataLoading}
              meetings={meetingsData}
              onProcessMeeting={openUpload}
              currentUser={currentUser}
            />
          )}
          {activeView === "tasks" && (
            <TaskBoardView
              key={taskOwnerFilter || "all"}
              taskCountByStatus={taskCountByStatus}
              tasks={tasksData}
              loading={dataLoading}
              error={dataError}
              onMoveTask={handleMoveTask}
              initialSearch={taskOwnerFilter}
              onTaskClick={(task) => setSelectedTask(task)}
            />
          )}
          {activeView === "meetings" && (
            <MeetingsView
              meetings={meetingsData}
              loading={dataLoading}
              onProcessMeeting={openUpload}
            />
          )}
          {activeView === "upload" && (
            <UploadView
              activeTab={activeTab}
              file={file}
              isProcessing={isProcessing}
              isRunning={isRunning}
              jobId={jobId}
              logs={logs}
              status={status}
              onFileSelect={setFile}
              onFileUpload={handleFileUpload}
              onSharePointSubmit={handleSharePointSubmit}
              onTabChange={setActiveTab}
            />
          )}
          {activeView === "analytics" && <AnalyticsView onNavigate={(view: string) => setActiveView(view as View)} />}
          {activeView === "integrations" && <IntegrationsView />}
          {activeView === "autonomous" && <AutonomousPanel />}
          {activeView === "followups" && (
            <FollowUpPanel
              onViewPerson={(owner) => {
                setTaskOwnerFilter(owner);
                setActiveView("tasks");
              }}
            />
          )}
          {activeView === "knowledge" && <KnowledgeBaseView />}
          {activeView === "recommendations" && <RecommendationsPanel />}
          {activeView === "workflows" && <WorkflowBuilder />}
          {activeView === "channels" && <ChannelsView currentUser={currentUser} />}
          {activeView === "users" && <UsersView currentUser={currentUser} />}
        </div>
      </main>

      {/* Unified AI Chatbot — triggered from header */}
      <UnifiedChatbot
        activeView={activeView}
        tasksCount={taskCountByStatus}
        meetingsCount={meetingsData.length}
        isOpenExternal={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        onNavigate={(view, filter) => {
          if (filter) setTaskOwnerFilter(filter);
          setActiveView(view as View);
        }}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSaved={handleTaskUpdated}
        />
      )}
    </div>
  );
};

const BrandMark = () => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F26A21] text-2xl font-black text-white">
      M
    </div>
    <span className="text-2xl font-bold tracking-normal text-[#0B1633]">
      Meet<span className="text-[#F26A21]">Flow</span>
    </span>
  </div>
);

const IconButton: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <button
    aria-label={label}
    className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
  >
    {children}
  </button>
);

const OverviewView: React.FC<{
  dashboard: DashboardData | null;
  loading: boolean;
  meetings: MeetingInfo[];
  onProcessMeeting: () => void;
  onNavigate?: (view: string) => void;
  currentUser?: UserInfo | null;
}> = ({ dashboard, loading, onNavigate, currentUser }) => {
  if (loading && !dashboard) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#F26A21]" />
      </div>
    );
  }

  const d = dashboard || { total_tasks: 0, in_progress: 0, completed: 0, overdue: 0, total_meetings: 0, total_participants: 0, recent_meetings: [], activity: [] };
  const completionRate = d.total_tasks > 0 ? Math.round((d.completed / d.total_tasks) * 100) : 0;

  return (
    <div className="space-y-7">
      <div className="inline-flex items-center gap-3 rounded-xl border border-[#F26A21]/20 bg-[#F26A21]/6 px-4 py-2.5">
        <ShieldCheck size={14} className="shrink-0 text-[#F26A21]" />
        <p className="text-[12.5px] text-[#6B7280]">
          Signed in as{" "}
          <span className="font-semibold text-[#F26A21]">
            {currentUser?.name ?? "Guest"}
          </span>
          {currentUser && (
            <span className="text-[#9CA3AF]"> ({ROLE_BADGE[currentUser.role]?.label ?? currentUser.role})</span>
          )}
          <span className="text-[#C4C9D4]"> · {d.total_meetings} meetings · {d.total_participants} participants</span>
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={ClipboardList} label="Total Tasks" value={String(d.total_tasks)}
          detail={`from ${d.total_meetings} meetings`} tone="orange"
          chartType="sparkline"
        />
        <MetricCard
          icon={Loader2} label="In Progress" value={String(d.in_progress)}
          detail="currently active" tone="amber"
          chartType="progress"
          progressPct={d.total_tasks > 0 ? Math.round((d.in_progress / d.total_tasks) * 100) : 0}
        />
        <MetricCard
          icon={CheckCircle2} label="Completed" value={String(d.completed)}
          detail={`${completionRate}% completion rate`} tone="green"
          chartType="bars"
        />
        <MetricCard
          icon={AlertTriangle} label="Overdue" value={String(d.overdue)}
          detail="tap to review tasks" tone="red"
          chartType="ring"
          progressPct={d.total_tasks > 0 ? Math.round((d.overdue / d.total_tasks) * 100) : 0}
          overdueCount={d.overdue}
          onClick={() => onNavigate?.("tasks")}
        />
      </section>

      <InsightsPanel />
    </div>
  );
};

const TaskBoardView: React.FC<{
  taskCountByStatus: Record<TaskStatus, number>;
  tasks: TaskInfo[];
  loading: boolean;
  error?: string | null;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  initialSearch?: string;
  onTaskClick?: (task: TaskInfo) => void;
}> = ({ taskCountByStatus, tasks, loading, error, onMoveTask, initialSearch, onTaskClick }) => {
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState(initialSearch || "");

  // Sync when initialSearch changes (e.g. navigating from a person click)
  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);

  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== "All" && t.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (statusFilter !== "All") {
      const sf = statusFilter.toLowerCase();
      if (sf === "todo" && t.status !== "todo") return false;
      if (sf === "progress" && t.status !== "progress") return false;
      if (sf === "done" && t.status !== "done") return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchesTitle = t.title.toLowerCase().includes(q);
      const matchesMeeting = (t.meeting || "").toLowerCase().includes(q);
      const matchesOwner = (t.owner || "").toLowerCase().includes(q);
      const matchesPriority = t.priority.toLowerCase().includes(q);
      const matchesStatus = t.status.toLowerCase().includes(q);
      const matchesContext = (t.context || "").toLowerCase().includes(q);
      if (!matchesTitle && !matchesMeeting && !matchesOwner && !matchesPriority && !matchesStatus && !matchesContext) return false;
    }
    return true;
  });

  // Safe UI states
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] pb-5">
          <span className="text-sm font-bold text-[#0B1633]">Priority:</span>
          <FilterButton active={priorityFilter === "All"} label="All" onClick={() => setPriorityFilter("All")} />
          <FilterButton active={priorityFilter === "High"} dot="bg-red-500" label="High" onClick={() => setPriorityFilter("High")} />
          <FilterButton active={priorityFilter === "Medium"} dot="bg-amber-500" label="Medium" onClick={() => setPriorityFilter("Medium")} />
          <FilterButton active={priorityFilter === "Low"} dot="bg-emerald-500" label="Low" onClick={() => setPriorityFilter("Low")} />
          <div className="h-8 w-px bg-[#E5E7EB]" />
          <span className="text-sm font-bold text-[#0B1633]">Status:</span>
          <FilterButton active={statusFilter === "All"} label="All" onClick={() => setStatusFilter("All")} />
          <FilterButton active={statusFilter === "todo"} label="To Do" onClick={() => setStatusFilter("todo")} />
          <FilterButton active={statusFilter === "progress"} label="In Progress" onClick={() => setStatusFilter("progress")} />
          <FilterButton active={statusFilter === "done"} label="Done" onClick={() => setStatusFilter("done")} />
        </div>
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin text-[#F26A21]" />
        <p className="text-sm font-medium text-[#6B7280]">Fetching tasks…</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] pb-5">
          <span className="text-sm font-bold text-[#0B1633]">Priority:</span>
          <FilterButton active={priorityFilter === "All"} label="All" onClick={() => setPriorityFilter("All")} />
          <FilterButton active={priorityFilter === "High"} dot="bg-red-500" label="High" onClick={() => setPriorityFilter("High")} />
          <FilterButton active={priorityFilter === "Medium"} dot="bg-amber-500" label="Medium" onClick={() => setPriorityFilter("Medium")} />
          <FilterButton active={priorityFilter === "Low"} dot="bg-emerald-500" label="Low" onClick={() => setPriorityFilter("Low")} />
          <div className="h-8 w-px bg-[#E5E7EB]" />
          <span className="text-sm font-bold text-[#0B1633]">Status:</span>
          <FilterButton active={statusFilter === "All"} label="All" onClick={() => setStatusFilter("All")} />
          <FilterButton active={statusFilter === "todo"} label="To Do" onClick={() => setStatusFilter("todo")} />
          <FilterButton active={statusFilter === "progress"} label="In Progress" onClick={() => setStatusFilter("progress")} />
          <FilterButton active={statusFilter === "done"} label="Done" onClick={() => setStatusFilter("done")} />
        </div>
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white">
          <div className="text-center">
            <ClipboardList size={36} className="mx-auto text-[#9CA3AF]" />
            <p className="mt-3 text-sm font-medium text-[#6B7280]">No tasks yet</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Tasks will appear here after processing meetings.</p>
          </div>
        </div>
      </div>
    );
  }

  // Compute per-column counts from the filtered set
  const filteredTodo = filteredTasks.filter((t) => t.status === "todo").length;
  const filteredProgress = filteredTasks.filter((t) => t.status === "progress").length;
  const filteredDone = filteredTasks.filter((t) => t.status === "done").length;
  const hasNoMatch = filteredTasks.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E7EB] pb-5">
        <span className="text-sm font-bold text-[#0B1633]">Priority:</span>
        <FilterButton active={priorityFilter === "All"} label="All" onClick={() => setPriorityFilter("All")} />
        <FilterButton active={priorityFilter === "High"} dot="bg-red-500" label="High" onClick={() => setPriorityFilter("High")} />
        <FilterButton active={priorityFilter === "Medium"} dot="bg-amber-500" label="Medium" onClick={() => setPriorityFilter("Medium")} />
        <FilterButton active={priorityFilter === "Low"} dot="bg-emerald-500" label="Low" onClick={() => setPriorityFilter("Low")} />
        <div className="h-8 w-px bg-[#E5E7EB]" />
        <span className="text-sm font-bold text-[#0B1633]">Status:</span>
        <FilterButton active={statusFilter === "All"} label="All" onClick={() => setStatusFilter("All")} />
        <FilterButton active={statusFilter === "todo"} label="To Do" onClick={() => setStatusFilter("todo")} />
        <FilterButton active={statusFilter === "progress"} label="In Progress" onClick={() => setStatusFilter("progress")} />
        <FilterButton active={statusFilter === "done"} label="Done" onClick={() => setStatusFilter("done")} />
        <div className="hidden h-8 w-px bg-[#E5E7EB] md:block" />
        <div className="relative min-w-[250px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-sm text-[#0B1633] outline-none placeholder:text-[#9CA3AF] focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ml-auto flex items-center gap-5">
          <span className="font-mono text-sm text-[#6B7280]">{filteredTasks.length} tasks</span>
        </div>
      </div>

      {hasNoMatch ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white">
          <div className="text-center">
            <Search size={32} className="mx-auto text-[#9CA3AF]" />
            <p className="mt-3 text-sm font-medium text-[#6B7280]">No matching tasks found</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Try adjusting your filters or search term.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          <TaskColumn title="To Do" dot="bg-[#9CA3AF]" count={filteredTodo} status="todo" tasks={filteredTasks} onMoveTask={onMoveTask} onTaskClick={onTaskClick} />
          <TaskColumn title="In Progress" dot="bg-amber-500" count={filteredProgress} status="progress" tasks={filteredTasks} onMoveTask={onMoveTask} onTaskClick={onTaskClick} />
          <TaskColumn title="Done" dot="bg-emerald-500" count={filteredDone} status="done" tasks={filteredTasks} onMoveTask={onMoveTask} onTaskClick={onTaskClick} />
        </div>
      )}
    </div>
  );
};

const MeetingsView: React.FC<{
  meetings: MeetingInfo[];
  loading: boolean;
  onProcessMeeting: () => void;
}> = ({ meetings, loading, onProcessMeeting }) => {
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#F26A21]" />
      </div>
    );
  }

  const processedCount = meetings.filter((m) => m.status === "Processed").length;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#0B1633]">All Meetings</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{processedCount} meetings processed</p>
        </div>
        <button
          onClick={onProcessMeeting}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#F26A21] px-4 text-sm font-bold text-white shadow-button transition hover:bg-[#E55D1B]"
        >
          <Plus size={17} />
          Process Meeting
        </button>
      </div>
      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-card">
        <MeetingsTable meetings={meetings} />
      </div>
    </div>
  );
};

interface UploadViewProps {
  activeTab: "sharepoint" | "upload";
  file: File | null;
  isProcessing: boolean;
  isRunning: boolean;
  jobId: string | null;
  logs: string[];
  status: JobStatus | null;
  onFileSelect: (file: File) => void;
  onFileUpload: () => void;
  onSharePointSubmit: (url: string) => void;
  onTabChange: (tab: "sharepoint" | "upload") => void;
}

const UploadView: React.FC<UploadViewProps> = ({
  activeTab,
  file,
  isProcessing,
  isRunning,
  jobId,
  logs,
  status,
  onFileSelect,
  onFileUpload,
  onSharePointSubmit,
  onTabChange,
}) => (
  <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0B1633]">Process Meeting</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Upload a recording or process a SharePoint meeting link.
        </p>
      </div>
      <TabSelector activeTab={activeTab} onTabChange={onTabChange} />
      {activeTab === "sharepoint" ? (
        <SharePointInput
          disabled={isRunning}
          isProcessing={isProcessing}
          onSubmit={onSharePointSubmit}
        />
      ) : (
        <FileUpload
          disabled={isRunning}
          file={file}
          isProcessing={isProcessing}
          onFileSelect={onFileSelect}
          onSubmit={onFileUpload}
        />
      )}
      <div className="mt-6">
        <LogTerminal
          hasStarted={!!jobId}
          logs={logs}
          progress={status?.progress || 0}
          status={status?.status || ""}
        />
      </div>
    </section>

    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between border-b border-[#F3F4F6] pb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#0B1633]">
          <CheckCircle2 size={20} className="text-[#F26A21]" />
          AI Action Insights
        </h2>
        {status?.status === "completed" ? (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
            Verified
          </span>
        ) : null}
      </div>
      {!jobId ? <EmptyUploadState /> : null}
      {status?.status === "processing" ? <ProcessingState progress={status.progress} /> : null}
      {status?.status === "failed" ? <FailedState error={status.error} /> : null}
      {status?.status === "completed" && status.result ? (
        <ResultsPanel jobId={jobId!} result={status.result} />
      ) : null}
    </section>
  </div>
);

const SparklineChart: React.FC<{ color: string }> = ({ color }) => (
  <svg viewBox="0 0 140 28" preserveAspectRatio="none" className="w-full h-7">
    <path
      d="M0 24 C15 22 20 19 35 14 C50 9 58 12 72 8 C86 4 95 6 110 2 C122 0 132 1 140 0 L140 28 L0 28Z"
      fill={color} fillOpacity="0.1"
    />
    <path
      d="M0 24 C15 22 20 19 35 14 C50 9 58 12 72 8 C86 4 95 6 110 2 C122 0 132 1 140 0"
      fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"
    />
  </svg>
);

const BarMiniChart: React.FC<{ color: string }> = ({ color }) => {
  const heights = [35, 52, 44, 68, 58, 82, 65, 90, 74, 100];
  return (
    <div className="flex items-end gap-[3px] h-7">
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-[2px]"
          style={{ height: `${h}%`, backgroundColor: color, opacity: 0.18 + (h / 100) * 0.6 }}
        />
      ))}
    </div>
  );
};

const ProgressMiniChart: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div className="h-[5px] w-full overflow-hidden rounded-full bg-[#F0F1F4]">
    <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: color }} />
  </div>
);

const RingChart: React.FC<{ pct: number; color: string; overdueCount: number }> = ({ pct, color, overdueCount }) => {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  return (
    <div className="flex items-center gap-3">
      <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#FEE2E2" strokeWidth="4.5" />
        <circle
          cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="4.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 22 22)"
        />
        <text x="22" y="26" textAnchor="middle" fill={color} fontSize="9.5" fontWeight="700" fontFamily="system-ui">
          {pct}%
        </text>
      </svg>
      <p className="text-[11px] leading-snug text-[#9CA3AF]">
        {overdueCount === 0 ? "All tasks\non track" : `of tasks\nneed review`}
      </p>
    </div>
  );
};

const MetricCard: React.FC<{
  detail: string;
  icon: React.ElementType;
  label: string;
  tone: "orange" | "amber" | "green" | "red";
  value: string;
  onClick?: () => void;
  chartType?: "sparkline" | "bars" | "progress" | "ring";
  progressPct?: number;
  overdueCount?: number;
}> = ({ detail, icon: Icon, label, tone, value, onClick, chartType, progressPct = 0, overdueCount = 0 }) => {
  const config = {
    orange: { valueClass: "text-[#F26A21]", iconClass: "text-[#F26A21] bg-orange-50",    color: "#F26A21" },
    amber:  { valueClass: "text-amber-500",  iconClass: "text-amber-500 bg-amber-50",     color: "#F59E0B" },
    green:  { valueClass: "text-emerald-500", iconClass: "text-emerald-600 bg-emerald-50", color: "#10B981" },
    red:    { valueClass: "text-red-500",    iconClass: "text-red-500 bg-red-50",          color: "#EF4444" },
  }[tone];
  const Wrapper = onClick ? "button" : "article";
  const clickProps = onClick ? { onClick, type: "button" as const } : {};
  return (
    <Wrapper
      className={`flex flex-col rounded-xl border border-[#ECEEF2] bg-white px-5 py-5 shadow-sm ${
        onClick ? "cursor-pointer text-left transition-all duration-150 hover:border-[#F26A21]/25 hover:shadow-md" : ""
      }`}
      {...clickProps}
    >
      {/* Icon left · Number right */}
      <div className="flex items-center justify-between">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}>
          <Icon size={18} />
        </div>
        <p className={`text-[2.6rem] font-bold leading-none tracking-tight ${config.valueClass}`}>
          {value}
        </p>
      </div>

      {/* Label + detail */}
      <p className="mt-3 text-[13px] font-semibold text-[#1A202C]">{label}</p>
      <p className="mt-0.5 text-[11.5px] text-[#9CA3AF]">{detail}</p>

      {/* Mini chart */}
      <div className="mt-4">
        {chartType === "sparkline" && <SparklineChart color={config.color} />}
        {chartType === "bars"      && <BarMiniChart color={config.color} />}
        {chartType === "progress"  && <ProgressMiniChart pct={progressPct} color={config.color} />}
        {chartType === "ring"      && <RingChart pct={progressPct} color={config.color} overdueCount={overdueCount} />}
      </div>
    </Wrapper>
  );
};
type MeetingDetail = { meeting: MeetingInfo; data: MeetingDetailData | null; loading: boolean };

const MeetingsTable: React.FC<{ meetings: MeetingInfo[]; compact?: boolean }> = ({ meetings, compact = false }) => {
  const rows = compact ? meetings.slice(0, 4) : meetings;
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [panelTab, setPanelTab] = useState<"summary" | "actions">("summary");

  const openPanel = async (meeting: MeetingInfo) => {
    setPanelTab("summary");
    setDetail({ meeting, data: null, loading: true });
    try {
      const data = await fetchMeetingDetail(meeting.job_id);
      setDetail({ meeting, data, loading: false });
    } catch {
      setDetail({ meeting, data: null, loading: false });
    }
  };

  const closePanel = () => setDetail(null);

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6 text-[#6B7280]">
        <p>No meetings yet. Process a meeting recording to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse">
          <thead>
            <tr className="border-b border-[#F3F4F6] text-left text-xs font-black uppercase tracking-[0.16em] text-[#6B7280]">
              <th className="px-6 py-5">Meeting</th>
              <th className="px-6 py-5">Source</th>
              <th className="px-6 py-5">Tasks</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Transcript</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((meeting) => (
              <tr key={meeting.job_id} className="border-b border-[#F3F4F6] last:border-b-0">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a5791]/10 text-[#0a5791]">
                      <FileText size={17} />
                    </div>
                    <div>
                      <p className="max-w-[420px] truncate font-bold text-[#0B1633]">{meeting.title}</p>
                      <p className="mt-1 font-mono text-sm text-[#6B7280]">{meeting.team} · {meeting.participants.length} participants</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center rounded-full bg-[#0a5791]/10 px-3 py-1 font-mono text-xs font-bold text-[#0a5791]">
                    <span className="mr-2 h-2 w-2 rounded-full bg-[#0a5791]" />
                    {meeting.source}
                  </span>
                </td>
                <td className="px-6 py-5 font-mono text-sm text-[#6B7280]">{meeting.tasks}</td>
                <td className="px-6 py-5"><StatusBadge status={meeting.status} /></td>
                <td className="px-6 py-5 font-mono text-sm text-[#6B7280]">{meeting.date}</td>
                <td className="px-6 py-5">
                  {meeting.status !== "Failed" && meeting.status !== "Processing" ? (
                    <button
                      onClick={() => openPanel(meeting)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C667A] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
                    >
                      <AlignLeft size={13} />
                      View
                    </button>
                  ) : (
                    <span className="text-xs text-[#C4C9D4]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-in panel */}
      {detail && (
          <div className="fixed bottom-0 right-0 top-[62px] z-50 flex w-[520px] flex-col bg-white border-l border-[#ECEEF2] shadow-xl">

            {/* ── Top header bar ── */}
            <div className="shrink-0 border-b border-[#F0F1F4] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0a5791]/10">
                    <FileText size={16} className="text-[#0a5791]" />
                  </div>
                  <p className="truncate text-[14px] font-bold text-black">{detail.meeting.title}</p>
                </div>
                <button
                  onClick={closePanel}
                  className="ml-3 shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F5F5F7] hover:text-[#0B1633]"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Metadata chips row */}
              <div className="mt-4 grid grid-cols-4 divide-x divide-[#F0F1F4] rounded-xl border border-[#ECEEF2] bg-[#FAFAFA]">
                {[
                  { label: "Team",         value: detail.meeting.team },
                  { label: "Source",       value: detail.meeting.source },
                  { label: "Participants", value: String(detail.meeting.participants.length) },
                  { label: "Date",         value: detail.meeting.date },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-2.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#B0B7C3]">{label}</p>
                    <p className="mt-0.5 truncate text-[12px] font-semibold text-[#1A202C]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="flex shrink-0 border-b border-[#F0F1F4]">
              {(["summary", "actions"] as const).map((tab) => {
                const label = tab === "summary" ? "Summary & Transcript" : `Action Items${detail.data ? ` (${detail.data.action_items.length})` : ""}`;
                return (
                  <button
                    key={tab}
                    onClick={() => setPanelTab(tab)}
                    className={`px-6 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                      panelTab === tab
                        ? "border-[#F26A21] text-[#F26A21]"
                        : "border-transparent text-black hover:text-black"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ── Tab content ── */}
            <div className="flex-1 overflow-y-auto">
              {detail.loading ? (
                <div className="flex h-48 items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#F26A21]" />
                </div>
              ) : !detail.data ? (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-[#9CA3AF]">
                  <FileText size={28} />
                  <p className="text-sm">No data available for this meeting.</p>
                </div>
              ) : panelTab === "summary" ? (
                <div className="divide-y divide-[#F0F1F4]">
                  {detail.data.meeting_summary ? (
                    <section className="px-6 py-5">
                      <h3 className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-black">
                        Meeting Summary
                      </h3>
                      <p className="text-[13px] leading-[1.75] text-black">
                        {detail.data.meeting_summary}
                      </p>
                    </section>
                  ) : (
                    <div className="px-6 py-5 text-[13px] text-[#9CA3AF]">No summary available.</div>
                  )}
                  {detail.data.transcript ? (
                    <section className="px-6 py-5">
                      <h3 className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-black">
                        Full Transcript
                      </h3>
                      <p className="whitespace-pre-wrap text-[12.5px] leading-[1.75] text-black">
                        {detail.data.transcript}
                      </p>
                    </section>
                  ) : (
                    <div className="px-6 py-5 text-[13px] text-[#9CA3AF]">No transcript available.</div>
                  )}
                </div>
              ) : (
                <div className="px-6 py-5">
                  {detail.data.action_items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
                      <ClipboardList size={28} />
                      <p className="mt-2 text-sm">No action items for this meeting.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detail.data.action_items.map((item, i) => (
                        <div key={i} className="rounded-xl border border-[#ECEEF2] bg-[#FAFAFA] px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F26A21]/10 text-[10px] font-bold text-[#F26A21]">
                                {i + 1}
                              </span>
                              <p className="text-[13px] font-medium leading-snug text-black">{item.task}</p>
                            </div>
                            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-semibold ${
                              item.priority === "high"   ? "bg-red-50 text-red-500"
                              : item.priority === "medium" ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                            }`}>
                              {item.priority}
                            </span>
                          </div>
                          {(item.owner || item.deadline) && (
                            <div className="mt-2.5 flex flex-wrap gap-4 text-[11px] text-black">
                              {item.owner   && <span className="flex items-center gap-1"><Users size={11} />{item.owner}</span>}
                              {item.deadline && <span className="flex items-center gap-1"><CalendarDays size={11} />{item.deadline}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
      )}
    </>
  );
};

const TaskColumn: React.FC<{
  count: number;
  dot: string;
  status: TaskStatus;
  tasks: TaskInfo[];
  title: string;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onTaskClick?: (task: TaskInfo) => void;
}> = ({ count, dot, status, tasks, title, onMoveTask, onTaskClick }) => {
  const columnTasks = tasks.filter((task) => task.status === status);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onMoveTask(taskId, status);
    }
  };

  return (
    <section
      className={`min-h-[560px] rounded-2xl border bg-white shadow-card transition-colors ${
        isDragOver ? "border-[#F26A21] bg-[#F26A21]/5" : "border-[#E5E7EB]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="flex items-center gap-3 border-b border-[#F3F4F6] px-5 py-5">
        <span className={`h-3 w-3 rounded-full ${dot}`} />
        <h2 className="flex-1 text-lg font-bold text-[#0B1633]">{title}</h2>
        <span className="rounded-full bg-[#F8F7F5] px-3 py-1 font-mono text-sm text-[#6B7280]">
          {count}
        </span>
      </header>
      <div className="max-h-[614px] space-y-3 overflow-y-auto p-4">
        {columnTasks.length > 0 ? (
          columnTasks.map((task) => <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} />)
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-[#9CA3AF]">
            <ClipboardList size={28} />
            <p className="mt-3 text-sm">Drop tasks here</p>
          </div>
        )}
      </div>
    </section>
  );
};

const TaskCard: React.FC<{ task: TaskInfo; onTaskClick?: (task: TaskInfo) => void }> = ({ task, onTaskClick }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <article
      draggable
      onDragStart={handleDragStart}
      onClick={() => onTaskClick?.(task)}
      className="cursor-pointer rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] p-5 transition hover:border-[#F26A21]/30 hover:bg-white hover:shadow-card active:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold leading-6 text-[#0B1633]">{task.title}</h3>
        <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${priorityClasses[task.priority]}`} />
      </div>
      {task.owner ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-[#5C667A]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F26A21] text-xs font-bold text-white">
            {task.initials}
          </span>
          {task.owner}
        </div>
      ) : null}
      {task.due ? (
        <p className="mt-3 flex items-center gap-2 font-mono text-sm font-bold text-red-500">
          <CalendarDays size={14} />
          {task.due}
        </p>
      ) : null}
      <p className="mt-4 flex items-center gap-1 truncate font-mono text-xs text-[#6B7280]">
        <Video size={13} />
        {task.meeting}
      </p>
    </article>
  );
};

const FilterButton: React.FC<{ active?: boolean; dot?: string; label: string; onClick?: () => void }> = ({
  active,
  dot,
  label,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
      active
        ? "border-[#F26A21]/40 bg-[#F26A21]/10 text-[#F26A21]"
        : "border-[#E5E7EB] bg-white text-[#5C667A] hover:border-[#F26A21]/40 hover:text-[#F26A21]"
    }`}
  >
    {dot ? <span className={`h-2.5 w-2.5 rounded-full ${dot}`} /> : null}
    {label}
  </button>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const isProcessed = status === "Processed";
  const isFailed = status === "Failed";
  const colorClass = isProcessed
    ? "bg-emerald-500/10 text-emerald-600"
    : isFailed
    ? "bg-red-500/10 text-red-600"
    : "bg-amber-500/10 text-amber-600";
  const dotClass = isProcessed
    ? "bg-emerald-500"
    : isFailed
    ? "bg-red-500"
    : "bg-amber-500";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-xs font-bold ${colorClass}`}>
      <span className={`mr-2 h-2 w-2 rounded-full ${dotClass}`} />
      {status}
    </span>
  );
};


const EmptyUploadState = () => (
  <div className="flex min-h-[440px] flex-col items-center justify-center text-center text-[#6B7280]">
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F8F7F5]">
      <FolderInput size={36} />
    </div>
    <p className="text-lg font-bold text-[#0B1633]">Ready to analyze</p>
    <p className="mt-2 max-w-sm text-sm leading-6">
      Paste a SharePoint link or upload a video to extract action items.
    </p>
  </div>
);

const ProcessingState: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
    <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F26A21]/10 text-[#F26A21]">
      <Loader2 size={40} className="animate-spin" />
      <span className="absolute text-xs font-bold">{progress}%</span>
    </div>
    <p className="text-lg font-bold text-[#0B1633]">Analyzing Meeting</p>
    <p className="mt-2 text-sm text-[#6B7280]">AI processing is in progress.</p>
  </div>
);

const FailedState: React.FC<{ error?: string }> = ({ error }) => (
  <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
      <AlertCircle size={36} />
    </div>
    <p className="text-lg font-bold text-[#0B1633]">Analysis Interrupted</p>
    <p className="mt-2 max-w-sm text-sm text-[#5C667A]">{error || "The meeting could not be processed."}</p>
  </div>
);
export default App;




