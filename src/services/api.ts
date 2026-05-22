import type {
  AnalyticsSummary,
  AnalyticsTimeSeries,
  AppNotification,
  AutonomousStatus,
  CrossMeetingInsights,
  JobStatus,
  ExportRequest,
  MeetingInfo,
  TaskInfo,
  DashboardData,
} from "../types";

const BASE =
  import.meta.env.VITE_API_BASE ||
  "https://meeting-video-to-action-item.onrender.com";

export async function fetchAnalyticsTimeSeries(): Promise<AnalyticsTimeSeries> {
  const res = await fetch(`${BASE}/analytics/timeseries`);
  if (!res.ok) throw new Error("Failed to fetch timeseries analytics");
  return res.json();
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${BASE}/analytics/summary`);
  if (!res.ok) throw new Error("Failed to fetch analytics summary");
  return res.json();
}

export async function fetchMeetings(): Promise<MeetingInfo[]> {
  const res = await fetch(`${BASE}/meetings`);
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

export interface MeetingDetailData {
  job_id: string;
  title: string;
  team: string;
  source: string;
  meeting_summary: string;
  transcript: string;
  participants: string[];
  action_items: Array<{
    task: string;
    owner?: string | null;
    deadline?: string | null;
    priority: string;
    context?: string;
    status: string;
  }>;
  date: string;
}

export async function fetchMeetingDetail(
  jobId: string,
): Promise<MeetingDetailData> {
  const res = await fetch(`${BASE}/meetings/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch meeting detail");
  return res.json();
}

export async function fetchTasks(): Promise<TaskInfo[]> {
  const res = await fetch(`${BASE}/tasks`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${BASE}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function uploadVideo(file: File): Promise<JobStatus> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error("Upload is too large for the server proxy.");
    }
    throw new Error(`Upload failed with status ${res.status}`);
  }
  return res.json();
}

export async function analyzeSharePointUrl(
  sharepointUrl: string,
): Promise<JobStatus> {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sharepoint_url: sharepointUrl }),
  });
  if (!res.ok) throw new Error("Analysis request failed");
  return res.json();
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetch(`${BASE}/status/${jobId}`);
  if (!res.ok) throw new Error("Status check failed");
  return res.json();
}

export function createLogStream(jobId: string): EventSource {
  return new EventSource(`${BASE}/logs/${jobId}`);
}

export async function exportResults(
  jobId: string,
  target: ExportRequest["target"],
  sharepointUrl?: string,
): Promise<{ status: string; detail?: string; url?: string }> {
  const res = await fetch(`${BASE}/export/${jobId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, sharepoint_url: sharepointUrl }),
  });
  if (!res.ok) throw new Error("Export failed");
  return res.json();
}

export async function updateTaskStatus(
  taskId: string,
  status: "todo" | "progress" | "done",
): Promise<{ task_id: string; status: string }> {
  const res = await fetch(`${BASE}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update task status");
  return res.json();
}

export async function updateTaskDetails(
  taskId: string,
  updates: {
    title?: string;
    owner?: string;
    deadline?: string | null;
    priority?: string;
    context?: string;
  },
): Promise<{ task_id: string }> {
  const res = await fetch(`${BASE}/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update task details");
  return res.json();
}

export async function fetchInsights(): Promise<CrossMeetingInsights> {
  const res = await fetch(`${BASE}/insights`);
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
}

export async function refreshInsights(): Promise<CrossMeetingInsights> {
  const res = await fetch(`${BASE}/insights/refresh`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to refresh insights");
  return res.json();
}

export async function fetchNotifications(
  unreadOnly = false,
): Promise<AppNotification[]> {
  const res = await fetch(
    `${BASE}/notifications${unreadOnly ? "?unread_only=true" : ""}`,
  );
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${BASE}/notifications/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark notification read");
}

export async function fetchAutonomousStatus(): Promise<AutonomousStatus> {
  const res = await fetch(`${BASE}/autonomous/status`);
  if (!res.ok) throw new Error("Failed to fetch autonomous status");
  return res.json();
}

export async function toggleAutonomous(): Promise<{
  running: boolean;
  message: string;
}> {
  const res = await fetch(`${BASE}/autonomous/toggle`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to toggle autonomous mode");
  return res.json();
}

export const getDownloadUrl = (jobId: string): string =>
  `${BASE}/download/${jobId}`;

export async function sendCalendarInvite(item: {
  task: string;
  owner: string;
  deadline?: string | null;
  context?: string | null;
}): Promise<{ status: string; event_id: string; message: string }> {
  const res = await fetch(`${BASE}/calendar/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Calendar invite failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Follow-ups ──────────────────────────────────────────────────────────────

export async function fetchFollowUps(): Promise<
  import("../types").FollowUpInfo[]
> {
  const res = await fetch(`${BASE}/followups`);
  if (!res.ok) throw new Error("Failed to fetch follow-ups");
  return res.json();
}

export async function fetchPendingFollowUps(): Promise<
  import("../types").FollowUpInfo[]
> {
  const res = await fetch(`${BASE}/followups/pending`);
  if (!res.ok) throw new Error("Failed to fetch pending follow-ups");
  return res.json();
}

export async function triggerFollowUpScan(): Promise<{
  scanned: boolean;
  followups_generated: number;
  results: unknown[];
}> {
  const res = await fetch(`${BASE}/followups/scan`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger follow-up scan");
  return res.json();
}

export async function dismissFollowUp(
  id: string,
): Promise<{ id: string; status: string }> {
  const res = await fetch(`${BASE}/followups/${id}/dismiss`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to dismiss follow-up");
  return res.json();
}

export async function processFollowUpResponses(): Promise<{
  processed: number;
}> {
  const res = await fetch(`${BASE}/followups/process-responses`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to process responses");
  return res.json();
}

// ── Workforce ───────────────────────────────────────────────────────────────

export async function fetchWorkforceStats(): Promise<
  import("../types").WorkforceStats
> {
  const res = await fetch(`${BASE}/workforce/stats`);
  if (!res.ok) throw new Error("Failed to fetch workforce stats");
  return res.json();
}

export async function fetchEscalations(): Promise<
  import("../types").EscalationItem[]
> {
  const res = await fetch(`${BASE}/workforce/escalations`);
  if (!res.ok) throw new Error("Failed to fetch escalations");
  return res.json();
}

export async function fetchSlaReport(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/workforce/sla-report`);
  if (!res.ok) throw new Error("Failed to fetch SLA report");
  return res.json();
}

export async function generateWeeklySummary(): Promise<
  Record<string, unknown>
> {
  const res = await fetch(`${BASE}/workforce/generate-summary`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate weekly summary");
  return res.json();
}

// ── Learning ────────────────────────────────────────────────────────────────

export async function fetchLearningInsights(): Promise<
  import("../types").LearningInsight[]
> {
  const res = await fetch(`${BASE}/followups/learning`);
  if (!res.ok) throw new Error("Failed to fetch learning insights");
  return res.json();
}

export async function analyzeOwnerLearning(
  owner: string,
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `${BASE}/followups/analyze-learning/${encodeURIComponent(owner)}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error("Failed to analyze learning");
  return res.json();
}

// ── Chatbot ──────────────────────────────────────────────────────────────────

export interface ChatContext {
  workspace_id?: string;
  user_id?: string;
  active_view?: string;
  project_id?: string;
  meeting_id?: string;
  page_id?: string;
  task_id?: string;
  current_module?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  reply: string;
  actions: Array<{ type: string; filter?: string; view?: string }>;
}

export async function sendChatMessage(
  message: string,
  context: ChatContext = {},
  history: ChatMessage[] = [],
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      workspace_id: context.workspace_id || "default",
      user_id: context.user_id || "super_admin",
      active_view: context.active_view || "overview",
      project_id: context.project_id || "",
      meeting_id: context.meeting_id || "",
      page_id: context.page_id || "",
      task_id: context.task_id || "",
      current_module: context.current_module || "",
      history: history.slice(-10),
    }),
  });
  if (!res.ok) {
    const err = await res
      .json()
      .catch(() => ({ detail: "Chat request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function transcribeAudio(
  audioBlob: Blob,
): Promise<{ text: string; error?: string | null }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  const res = await fetch(`${BASE}/chat/transcribe`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) return { text: "", error: `HTTP ${res.status}` };
  return res.json();
}

export async function fetchChatHistory(
  userId: string = "super_admin",
): Promise<{ messages: ChatMessage[] }> {
  const res = await fetch(`${BASE}/chat/history/${encodeURIComponent(userId)}`);
  if (!res.ok) return { messages: [] };
  return res.json();
}

export async function saveChatHistory(
  userId: string,
  messages: ChatMessage[],
): Promise<void> {
  await fetch(`${BASE}/chat/history/${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.slice(-100) }),
  });
}

export async function clearChatHistory(
  userId: string = "super_admin",
): Promise<void> {
  await fetch(`${BASE}/chat/history/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

// ── Client-side Text-to-Speech ──────────────────────────────────────────────

export function speakText(
  text: string,
  onEnd?: () => void,
): SpeechSynthesisUtterance | null {
  if (!window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  // Use a good English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice =
    voices.find((v) => v.lang.startsWith("en") && v.name.includes("Female")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
  if (preferredVoice) utterance.voice = preferredVoice;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ── Client-side Speech Recognition ──────────────────────────────────────────

export function isSpeechRecognitionSupported(): boolean {
  return !!(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
}

export type SpeechStatus = "idle" | "listening" | "processing";

export function createSpeechRecognizer(
  onResult: (text: string) => void,
  onStatusChange: (status: SpeechStatus) => void,
  onError?: (error: string) => void,
  language = "en-US",
): { start: () => void; stop: () => void; abort: () => void } | null {
  const SpeechRecognition =
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const recognition = new (SpeechRecognition as new () => unknown)() as {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult:
      | ((event: { results: SpeechRecognitionResultList }) => void)
      | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
  };

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = language;

  recognition.onresult = (event) => {
    const results = event.results;
    if (results.length > 0) {
      const text = results[results.length - 1][0].transcript;
      onResult(text);
    }
    onStatusChange("processing");
  };

  recognition.onerror = (event) => {
    onStatusChange("idle");
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    onStatusChange("idle");
  };

  return {
    start: () => {
      onStatusChange("listening");
      try {
        recognition.start();
      } catch {
        onStatusChange("idle");
      }
    },
    stop: () => {
      onStatusChange("processing");
      try {
        recognition.stop();
      } catch {
        onStatusChange("idle");
      }
    },
    abort: () => {
      onStatusChange("idle");
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    },
  };
}

// -- Session-based Chat API ----------------------------------------------------------

export async function createChatSession(): Promise<{ session_id: string }> {
  const res = await fetch(`${BASE}/chat/session`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create chat session");
  return res.json();
}

export function createChatStream(
  sessionId: string,
  message: string,
): EventSource {
  return new EventSource(`${BASE}/chat/session/${sessionId}/send`, {
    withCredentials: false,
  });
}

export async function sendSessionChatMessage(
  sessionId: string,
  message: string,
): Promise<Response> {
  return fetch(`${BASE}/chat/session/${sessionId}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function getSessionChatHistory(
  sessionId: string,
): Promise<import("../types").ChatSessionData> {
  const res = await fetch(`${BASE}/chat/session/${sessionId}/history`);
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}

export async function clearSessionHistory(sessionId: string): Promise<void> {
  await fetch(`${BASE}/chat/session/${sessionId}`, { method: "DELETE" });
}

export async function analyzeIntent(
  message: string,
): Promise<import("../types").ChatIntent> {
  const res = await fetch(`${BASE}/chat/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error("Failed to analyze intent");
  return res.json();
}

// -- Knowledge Base API ---------------------------------------------------------

export async function searchKnowledge(
  query: string,
  category?: string,
  limit?: number,
): Promise<import("../types").KnowledgeEntry[]> {
  const params = new URLSearchParams({ query });
  if (category) params.set("category", category);
  if (limit) params.set("limit", String(limit));
  const res = await fetch(`${BASE}/knowledge/search?${params}`);
  if (!res.ok) throw new Error("Knowledge search failed");
  return res.json();
}

export async function getRecentKnowledge(
  category?: string,
  limit?: number,
): Promise<import("../types").KnowledgeEntry[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (limit) params.set("limit", String(limit));
  const res = await fetch(`${BASE}/knowledge/recent?${params}`);
  if (!res.ok) throw new Error("Failed to fetch recent knowledge");
  return res.json();
}

export async function getKnowledgeStats(): Promise<
  import("../types").KnowledgeStats
> {
  const res = await fetch(`${BASE}/knowledge/stats`);
  if (!res.ok) throw new Error("Failed to fetch knowledge stats");
  return res.json();
}

export async function getRelatedKnowledge(
  contentId: string,
): Promise<import("../types").KnowledgeEntry[]> {
  const res = await fetch(`${BASE}/knowledge/related/${contentId}`);
  if (!res.ok) throw new Error("Failed to fetch related knowledge");
  return res.json();
}

// -- Recommendations API --------------------------------------------------------

export async function fetchRecommendations(
  forceRefresh?: boolean,
): Promise<{ recommendations: import("../types").Recommendation[] }> {
  const params = forceRefresh ? "?force_refresh=true" : "";
  const res = await fetch(`${BASE}/recommendations${params}`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

export async function fetchDeadlineRisks(): Promise<{
  risks: import("../types").DeadlineRisk[];
}> {
  const res = await fetch(`${BASE}/recommendations/deadline-risks`);
  if (!res.ok) throw new Error("Failed to fetch deadline risks");
  return res.json();
}

export async function fetchDailyBrief(): Promise<
  import("../types").DailyBrief
> {
  const res = await fetch(`${BASE}/recommendations/daily-brief`);
  if (!res.ok) throw new Error("Failed to fetch daily brief");
  return res.json();
}

export async function fetchBurnoutRisks(): Promise<{
  burnout_risks: import("../types").BurnoutRisk[];
}> {
  const res = await fetch(`${BASE}/recommendations/burnout-risks`);
  if (!res.ok) throw new Error("Failed to fetch burnout risks");
  return res.json();
}

// -- Workflow API ---------------------------------------------------------------

export async function fetchWorkflows(): Promise<{
  workflows: import("../types").WorkflowDefinition[];
}> {
  const res = await fetch(`${BASE}/workflows`);
  if (!res.ok) throw new Error("Failed to fetch workflows");
  return res.json();
}

export async function createWorkflow(data: {
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: Array<{ action_type: string; config: Record<string, unknown> }>;
}): Promise<import("../types").WorkflowDefinition> {
  const res = await fetch(`${BASE}/workflows`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create workflow");
  return res.json();
}

export async function deleteWorkflow(id: string): Promise<void> {
  await fetch(`${BASE}/workflows/${id}`, { method: "DELETE" });
}

export async function toggleWorkflow(
  id: string,
  enabled: boolean,
): Promise<void> {
  await fetch(`${BASE}/workflows/${id}/toggle`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
}

export async function triggerWorkflowEvent(
  eventType: string,
  data: Record<string, unknown>,
): Promise<{ executed: number; results: unknown[] }> {
  const res = await fetch(`${BASE}/workflows/trigger/${eventType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error("Failed to trigger workflow");
  return res.json();
}

export async function fetchWorkflowLog(): Promise<{
  log: import("../types").WorkflowExecutionLog[];
}> {
  const res = await fetch(`${BASE}/workflows/log`);
  if (!res.ok) throw new Error("Failed to fetch workflow log");
  return res.json();
}

// -- Auth API -------------------------------------------------------------------

export async function login(
  email: string,
  password?: string,
): Promise<import("../types").AuthResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function logout(sessionId: string): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export async function getCurrentUser(
  token: string,
): Promise<import("../types").UserInfo> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get user");
  return res.json();
}

export async function fetchUsers(): Promise<{
  users: import("../types").UserInfo[];
}> {
  const res = await fetch(`${BASE}/auth/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(data: {
  name: string;
  email: string;
  role: string;
  department?: string;
}): Promise<import("../types").UserInfo> {
  const res = await fetch(`${BASE}/auth/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function updateUserRole(
  email: string,
  role: string,
): Promise<import("../types").UserInfo> {
  const res = await fetch(
    `${BASE}/auth/users/${encodeURIComponent(email)}/role`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
  if (!res.ok) throw new Error("Failed to update user role");
  return res.json();
}

// -- Analytics API --------------------------------------------------------------

export async function fetchBurndown(
  days?: number,
): Promise<import("../types").BurndownResponse> {
  const params = days ? `?days=${days}` : "";
  const res = await fetch(`${BASE}/analytics/burndown${params}`);
  if (!res.ok) throw new Error("Failed to fetch burndown");
  return res.json();
}

export async function fetchVelocity(
  weeks?: number,
): Promise<import("../types").VelocityResponse> {
  const params = weeks ? `?weeks=${weeks}` : "";
  const res = await fetch(`${BASE}/analytics/velocity${params}`);
  if (!res.ok) throw new Error("Failed to fetch velocity");
  return res.json();
}

export async function fetchAnomalies(): Promise<{
  anomalies: import("../types").Anomaly[];
}> {
  const res = await fetch(`${BASE}/analytics/anomalies`);
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}
