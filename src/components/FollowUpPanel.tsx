import React, { useEffect, useState } from "react";
import {
  Loader2,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Brain,
  BarChart3,
  User,
  Clock,
} from "lucide-react";
import {
  fetchPendingFollowUps,
  fetchFollowUps,
  dismissFollowUp,
  triggerFollowUpScan,
  fetchWorkforceStats,
  fetchLearningInsights,
} from "../services/api";
import type { FollowUpInfo, WorkforceStats, LearningInsight } from "../types";

const FollowUpPanel: React.FC<{ onViewPerson?: (owner: string) => void }> = ({ onViewPerson }) => {
  const [pendingFollowUps, setPendingFollowUps] = useState<FollowUpInfo[]>([]);
  const [allFollowUps, setAllFollowUps] = useState<FollowUpInfo[]>([]);
  const [workforce, setWorkforce] = useState<WorkforceStats | null>(null);
  const [learning, setLearning] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "history" | "workforce" | "learning">("pending");

  const loadData = async () => {
    setLoading(true);
    try {
      const [pending, all, wf, learn] = await Promise.all([
        fetchPendingFollowUps().catch(() => []),
        fetchFollowUps().catch(() => []),
        fetchWorkforceStats().catch(() => null),
        fetchLearningInsights().catch(() => []),
      ]);
      setPendingFollowUps(pending);
      setAllFollowUps(all);
      setWorkforce(wf);
      setLearning(learn);
    } catch (err) {
      console.error("Failed to load follow-up data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      await dismissFollowUp(id);
      setPendingFollowUps((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Failed to dismiss", err);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await triggerFollowUpScan();
      await loadData();
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#F26A21]" />
      </div>
    );
  }

  const tabs = [
    { id: "pending" as const, label: "Pending", count: pendingFollowUps.length },
    { id: "history" as const, label: "History", count: allFollowUps.length },
    { id: "workforce" as const, label: "Workforce" },
    { id: "learning" as const, label: "Learning" },
  ];

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B7280]">
          {pendingFollowUps.length} task(s) awaiting follow-up
        </p>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F26A21] px-4 py-2 text-sm font-bold text-white shadow-button transition hover:bg-[#E55D1B] disabled:opacity-50"
        >
          {scanning ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <RefreshCw size={15} />
          )}
          Scan Now
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-[#F8F7F5] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-white text-[#F26A21] shadow-sm"
                : "text-[#6B7280] hover:text-[#0B1633]"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-full bg-[#F26A21]/10 px-2 py-0.5 text-xs font-bold text-[#F26A21]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending Tab */}
      {activeTab === "pending" && (
        <div className="space-y-3">
          {pendingFollowUps.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white text-[#6B7280]">
              <MessageSquare size={36} className="mb-3 text-[#9CA3AF]" />
              <p className="font-medium">No pending follow-ups</p>
              <p className="mt-1 text-sm">All tasks are being tracked</p>
            </div>
          ) : (
            pendingFollowUps.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F26A21]/10 text-[#F26A21]">
                        <MessageSquare size={14} />
                      </span>
                      <span className="font-semibold text-[#0B1633]">{f.task_title || "Untitled"}</span>
                    </div>
                    <p className="mt-3 rounded-lg bg-[#F8F7F5] px-4 py-3 text-sm leading-relaxed text-[#5C667A]">
                      {f.prompt_text}
                    </p>
                    {f.owner && (
                      <p className="mt-3 flex items-center gap-2 text-sm text-[#6B7280]">
                        <User size={14} />
                        {f.owner}
                      </p>
                    )}
                    {f.meeting_title && (
                      <p className="mt-1 flex items-center gap-2 text-xs text-[#9CA3AF]">
                        <Clock size={12} />
                        {f.meeting_title}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDismiss(f.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#9CA3AF] hover:border-red-300 hover:text-red-500"
                    title="Dismiss"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-card">
          {allFollowUps.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center text-[#6B7280]">
              No follow-up history yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b border-[#F3F4F6] text-left text-xs font-black uppercase tracking-[0.16em] text-[#6B7280]">
                    <th className="px-6 py-5">Task</th>
                    <th className="px-6 py-5">Owner</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {allFollowUps.map((f) => (
                    <tr key={f.id} className="border-b border-[#F3F4F6] last:border-b-0">
                      <td className="px-6 py-4 font-medium text-[#0B1633]">{f.task_title}</td>
                      <td className="px-6 py-4 text-sm text-[#6B7280]">{f.owner || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-xs font-bold ${
                          f.status === "responded"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : f.status === "ignored"
                            ? "bg-gray-100 text-gray-500"
                            : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-[#6B7280]">
                        {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Workforce Tab */}
      {activeTab === "workforce" && (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#0B1633]">
              <BarChart3 size={17} className="text-[#F26A21]" />
              Overview
            </h3>
            <div className="space-y-3">
              <MetricRow label="Past Deadline" value={workforce?.past_deadline ?? 0} />
              <MetricRow label="Pending Follow-ups" value={workforce?.pending_followups ?? 0} />
              <MetricRow label="Team Members" value={workforce?.per_owner?.length ?? 0} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#0B1633]">
              <User size={17} className="text-[#F26A21]" />
              Per Person
            </h3>
            <div className="space-y-3">
              {workforce?.per_owner?.slice(0, 5).map((p) => (
                <div
                  key={p.owner}
                  onClick={() => onViewPerson?.(p.owner)}
                  className="flex items-center justify-between rounded-lg p-2 transition hover:bg-[#F26A21]/5 hover:cursor-pointer"
                >
                  <span className="text-sm font-medium text-[#0B1633]">{p.owner}</span>
                  <div className="flex gap-3 text-xs text-[#6B7280]">
                    <span>{p.completed} done</span>
                    <span className="text-amber-500">{p.pending} pending</span>
                    {p.high_overdue > 0 && (
                      <span className="text-red-500">{p.high_overdue} overdue</span>
                    )}
                  </div>
                </div>
              ))}
              {(!workforce?.per_owner || workforce.per_owner.length === 0) && (
                <p className="text-sm text-[#9CA3AF]">No workforce data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Learning Tab */}
      {activeTab === "learning" && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-[#0B1633]">
            <Brain size={17} className="text-[#F26A21]" />
            Agent Learning Insights
          </h3>
          {learning.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">
              No learning data yet. Patterns will emerge as follow-ups are sent and responded to.
            </p>
          ) : (
            <div className="space-y-4">
              {learning.map((l) => (
                <div
                  key={`${l.category}-${l.owner}-${l.metric_key}`}
                  className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="rounded-full bg-[#F26A21]/10 px-2 py-0.5 text-xs font-bold text-[#F26A21]">
                        {l.category}
                      </span>
                      <span className="ml-2 font-medium text-[#0B1633]">{l.owner}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#F26A21]">
                      {(l.metric_value * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#6B7280]">
                    {l.metric_key.replace(/_/g, " ")} · {l.sample_size} sample(s)
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetricRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-2 last:border-b-0">
    <span className="text-sm text-[#5C667A]">{label}</span>
    <span className={`font-mono text-sm font-bold ${value > 0 ? "text-[#F26A21]" : "text-[#0B1633]"}`}>
      {value}
    </span>
  </div>
);

export default FollowUpPanel;
