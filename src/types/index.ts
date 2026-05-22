export interface ActionItem {
  owner: string;
  task: string;
  deadline: string | null;
  priority: "high" | "medium" | "low";
  confidence: number;
  context?: string;
  eventId?: string;
  teamsEventId?: string;
}

export interface AnalysisOutput {
  transcript?: string;
  meeting_summary?: string;
  participants: string[];
  action_items: ActionItem[];
  raw_result?: string;
}

export interface JobStatus {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: AnalysisOutput;
  error?: string;
}

export interface ExportRequest {
  target: "sharepoint_list" | "sharepoint_document" | "local_log";
  sharepoint_url?: string;
}

export interface MeetingInfo {
  job_id: string;
  title: string;
  team: string;
  source: string;
  tasks: number;
  status: "Processed" | "Failed" | "Processing";
  date: string;
  participants: string[];
  summary: string;
}

export interface TaskInfo {
  id: string;
  title: string;
  meeting: string;
  owner?: string | null;
  initials?: string | null;
  due?: string | null;
  priority: "High" | "Medium" | "Low";
  confidence: number;
  context: string;
  status: "todo" | "progress" | "done";
}

export interface DashboardData {
  total_tasks: number;
  in_progress: number;
  completed: number;
  overdue: number;
  total_meetings: number;
  total_participants: number;
  recent_meetings: Array<{ title: string; date: string; tasks: number }>;
  activity: Array<{ title: string; time: string }>;
}

export interface AnalyticsTimeSeries {
  dailyTasks: Array<{ date: string; created: number; completed: number }>;
  priorityDistribution: Array<{ name: string; value: number }>;
  ownerWorkload: Array<{ owner: string; tasks: number; completed: number }>;
  meetingFrequency: Array<{ week: string; count: number }>;
  confidenceDistribution: Array<{ range: string; count: number }>;
}

export interface AnalyticsSummary {
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<string, number>;
  completionRate: number;
  avgConfidence: number;
  totalMeetings: number;
  totalParticipants: number;
}

export interface CrossMeetingInsights {
  recurring_topics: Array<{ topic: string; frequency: number; meetings: string[] }>;
  bottlenecks: Array<{ description: string; severity: "high" | "medium" | "low"; affected_items: number }>;
  owner_workload: Array<{ owner: string; total_tasks: number; completed: number; high_priority: number; assessment: "overloaded" | "balanced" | "underutilized" }>;
  patterns: Array<{ pattern: string; confidence: "high" | "medium" | "low" }>;
  recommendations: string[];
  _generated_at?: string;
  _insufficient_data?: boolean;
}

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface AutonomousStatus {
  running: boolean;
  enabled_env: boolean;
  jobs: Array<{ name: string; status: string }>;
}

export interface FollowUpInfo {
  id: string;
  task_id: string;
  meeting_id?: string;
  owner?: string;
  task_title?: string;
  prompt_text: string;
  status: "pending" | "sent" | "responded" | "ignored";
  response_summary?: string;
  source?: string;
  meeting_title?: string;
  created_at: string;
  responded_at?: string;
}

export interface WorkforcePerOwner {
  owner: string;
  total_tasks: number;
  completed: number;
  in_progress: number;
  pending: number;
  high_overdue: number;
}

export interface WorkforceStats {
  per_owner: WorkforcePerOwner[];
  past_deadline: number;
  pending_followups: number;
  learning_insights: Array<{
    category: string;
    owner: string;
    metric_value: number;
    sample_size: number;
  }>;
}

export interface EscalationItem {
  id: string;
  task: string;
  owner: string;
  meeting_title: string;
  created_at: string;
  priority: string;
}

export interface LearningInsight {
  category: string;
  owner: string;
  metric_key: string;
  metric_value: number;
  sample_size: number;
  last_updated: string;
}

// -- Chat Types ------------------------------------------------------------------

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatSessionData {
  session_id: string;
  messages: ChatMessage[];
  created_at: string;
  last_active: string;
}

export interface ChatIntent {
  action: string;
  confidence: number;
}

// -- Knowledge Base Types -------------------------------------------------------

export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  summary?: string;
  participants?: string[];
  date?: string;
  relevance_score?: number;
  created_at: string;
}

export interface KnowledgeStats {
  total_entries: number;
  meetings: number;
  decisions: number;
  action_items: number;
  insights: number;
  documents: number;
}

// -- Recommendation Types -------------------------------------------------------

export interface Recommendation {
  id: string;
  title: string;
  category: "risk" | "efficiency" | "productivity" | "workload" | "meeting" | "deadline" | "resource" | "process";
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  impact: string;
  action: string;
  affected_owners: string[];
  generated_at: string;
}

export interface DeadlineRisk {
  task_id: string;
  title: string;
  owner: string;
  due: string;
  days_left: number;
  risk_level: "critical" | "high" | "medium" | "low";
  priority: string;
}

export interface DailyBrief {
  brief_date: string;
  summary: string;
  total_recommendations: number;
  total_risks: number;
  critical_items: number;
  recommendations: Recommendation[];
  deadline_risks: DeadlineRisk[];
  workforce_stats: {
    total_tasks: number;
    completed: number;
  };
}

export interface BurnoutRisk {
  owner: string;
  burnout_score: number;
  total_tasks: number;
  pending: number;
  high_overdue: number;
  risk_level: string;
  recommendation: string;
}

// -- Workflow Types -------------------------------------------------------------

export interface WorkflowAction {
  action_type: string;
  config: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: WorkflowAction[];
  enabled: boolean;
  created_at: string;
  execution_count: number;
  last_executed: string | null;
}

export interface WorkflowExecutionLog {
  workflow_id: string;
  workflow_name: string;
  event: Record<string, unknown>;
  results: Record<string, unknown>[];
  timestamp: string;
}

// -- Auth Types ------------------------------------------------------------------

export interface UserInfo {
  user_id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  permissions: string[];
  created_at: string;
  last_login: string;
}

export interface AuthResponse {
  token: string;
  session_id: string;
  user: UserInfo;
  expires_at: string;
}

// -- Analytics Types ------------------------------------------------------------

export interface BurndownData {
  date: string;
  remaining: number;
  completed: number;
  total: number;
}

export interface BurndownResponse {
  burndown: BurndownData[];
  ideal_burndown: Array<{ date: string; ideal: number }>;
  total_tasks: number;
  completed_tasks: number;
  remaining_tasks: number;
}

export interface VelocityData {
  week: string;
  tasks_completed: number;
  start: string;
  end: string;
}

export interface VelocityResponse {
  velocity: VelocityData[];
  average_velocity: number;
  trend: string;
}

export interface Anomaly {
  type: string;
  severity: string;
  entity: string;
  message: string;
  date?: string;
  pending_ratio?: number;
}
