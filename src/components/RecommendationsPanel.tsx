import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CalendarDays,
  Flame,
  Lightbulb,
  Loader2,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import {
  fetchRecommendations,
  fetchDailyBrief,
  fetchDeadlineRisks,
  fetchBurnoutRisks,
} from "../services/api";
import type { Recommendation, DailyBrief, DeadlineRisk, BurnoutRisk } from "../types";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "border-l-red-500 bg-red-500/5",
  high: "border-l-orange-500 bg-orange-500/5",
  medium: "border-l-amber-500 bg-amber-500/5",
  low: "border-l-emerald-500 bg-emerald-500/5",
};

const SEVERITY_DOTS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-emerald-500",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  risk: AlertTriangle,
  efficiency: TrendingUp,
  productivity: TrendingUp,
  workload: Users,
  meeting: CalendarDays,
  deadline: CalendarDays,
  resource: UserCheck,
  process: Brain,
};

const RecommendationsPanel: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [risks, setRisks] = useState<DeadlineRisk[]>([]);
  const [burnout, setBurnout] = useState<BurnoutRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"insights" | "risks" | "burnout" | "brief">(
    "insights"
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recs, briefData, riskData, burnoutData] = await Promise.all([
        fetchRecommendations(true),
        fetchDailyBrief(),
        fetchDeadlineRisks(),
        fetchBurnoutRisks(),
      ]);
      setRecommendations(recs.recommendations);
      setBrief(briefData);
      setRisks(riskData.risks);
      setBurnout(burnoutData.burnout_risks);
    } catch {
      setError("Failed to load AI insights. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1633]">AI Recommendations</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Proactive insights, deadline risk analysis, and team intelligence
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#5C667A] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Daily Brief */}
      {brief && !loading && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-gradient-to-r from-[#0B1633] to-[#1a2a4a] p-6 text-white shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Brain size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-white/60">AI Daily Brief</p>
              <p className="text-lg font-bold">
                {brief.total_recommendations} recommendations, {brief.total_risks} risks
                {brief.critical_items > 0 && (
                  <span className="ml-2 rounded-full bg-red-500/20 px-3 py-0.5 text-sm text-red-300">
                    {brief.critical_items} critical
                  </span>
                )}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/80">{brief.summary}</p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{brief.workforce_stats.total_tasks}</p>
              <p className="text-xs text-white/60">Total Tasks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{brief.workforce_stats.completed}</p>
              <p className="text-xs text-white/60">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{brief.critical_items}</p>
              <p className="text-xs text-white/60">Critical Items</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "insights" as const, label: "Recommendations", icon: Lightbulb },
          { id: "risks" as const, label: "Deadline Risks", icon: CalendarDays },
          { id: "burnout" as const, label: "Burnout Risk", icon: Flame },
          { id: "brief" as const, label: "Daily Brief", icon: Brain },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-[#F26A21]/40 bg-[#F26A21]/10 text-[#F26A21]"
                : "border-[#E5E7EB] bg-white text-[#5C667A] hover:border-[#F26A21]/40"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#F26A21]" />
        </div>
      ) : (
        <>
          {/* Recommendations */}
          {activeTab === "insights" && (
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <EmptyState icon={Lightbulb} text="No recommendations yet. Process meetings to generate insights." />
              ) : (
                recommendations.map((rec) => {
                  const CatIcon = CATEGORY_ICONS[rec.category] || Lightbulb;
                  return (
                    <div
                      key={rec.id}
                      className={`rounded-xl border-l-4 border border-[#E5E7EB] bg-white p-5 shadow-sm ${SEVERITY_COLORS[rec.severity] || "border-l-gray-500"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F26A21]/10">
                          <CatIcon size={16} className="text-[#F26A21]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-[#0B1633]">{rec.title}</h3>
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${SEVERITY_DOTS[rec.severity] || "bg-gray-500"}`}
                            />
                          </div>
                          <p className="mt-1 text-sm text-[#6B7280]">{rec.description}</p>
                          <p className="mt-1 text-xs font-medium text-[#9CA3AF]">
                            Impact: {rec.impact}
                          </p>
                          <div className="mt-3 rounded-lg bg-[#F8F7F5] px-3 py-2 text-sm">
                            <span className="font-semibold text-[#0B1633]">Action: </span>
                            {rec.action}
                          </div>
                          {rec.affected_owners.length > 0 && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-[#9CA3AF]">
                              <Users size={12} />
                              {rec.affected_owners.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Deadline Risks */}
          {activeTab === "risks" && (
            <RiskTable risks={risks} />
          )}

          {/* Burnout */}
          {activeTab === "burnout" && (
            <BurnoutView items={burnout} />
          )}

          {/* Brief */}
          {activeTab === "brief" && brief && (
            <BriefView brief={brief} />
          )}
        </>
      )}
    </div>
  );
};

const RiskTable: React.FC<{ risks: DeadlineRisk[] }> = ({ risks }) => {
  if (risks.length === 0) {
    return <EmptyState icon={CalendarDays} text="No deadline risks identified. All tasks on track!" />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
      <table className="w-full text-sm">
        <thead className="bg-[#F8F7F5]">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-[#0B1633]">Task</th>
            <th className="px-4 py-3 text-left font-semibold text-[#0B1633]">Owner</th>
            <th className="px-4 py-3 text-left font-semibold text-[#0B1633]">Days Left</th>
            <th className="px-4 py-3 text-left font-semibold text-[#0B1633]">Risk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F3F4F6]">
          {risks.map((r) => (
            <tr key={r.task_id} className="bg-white hover:bg-[#F8F7F5]">
              <td className="px-4 py-3 font-medium text-[#0B1633]">{r.title}</td>
              <td className="px-4 py-3 text-[#5C667A]">{r.owner}</td>
              <td className={`px-4 py-3 font-mono font-bold ${
                r.days_left < 0 ? "text-red-500" : r.days_left <= 2 ? "text-amber-500" : "text-emerald-500"
              }`}>
                {r.days_left < 0 ? `${Math.abs(r.days_left)}d overdue` : `${r.days_left}d`}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  r.risk_level === "critical" ? "bg-red-500/10 text-red-600" :
                  r.risk_level === "high" ? "bg-orange-500/10 text-orange-600" :
                  "bg-amber-500/10 text-amber-600"
                }`}>
                  {r.risk_level}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BurnoutView: React.FC<{ items: BurnoutRisk[] }> = ({ items }) => {
  if (items.length === 0) {
    return <EmptyState icon={Flame} text="No burnout risks detected. Team workload is balanced!" />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.owner}
          className="rounded-xl border border-[#E5E7EB] bg-white p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                item.risk_level === "high" ? "bg-red-500/10 text-red-500" :
                "bg-amber-500/10 text-amber-500"
              }`}>
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1633]">{item.owner}</h3>
                <p className="text-xs text-[#6B7280]">
                  {item.total_tasks} tasks ({item.pending} pending, {item.high_overdue} overdue)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#F26A21]">
                {Math.round(item.burnout_score * 100)}%
              </p>
              <p className="text-xs text-[#9CA3AF]">burnout score</p>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#F3F4F6]">
            <div
              className={`h-2 rounded-full transition-all ${
                item.risk_level === "high" ? "bg-red-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(item.burnout_score * 100, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-[#9CA3AF]">
            {item.recommendation}
          </p>
        </div>
      ))}
    </div>
  );
};

const BriefView: React.FC<{ brief: DailyBrief }> = ({ brief }) => (
  <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
    <h3 className="text-lg font-bold text-[#0B1633]">Daily Executive Brief</h3>
    <p className="mt-1 text-sm text-[#6B7280]">{brief.summary}</p>
    <div className="mt-6 grid grid-cols-3 gap-4">
      <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] p-4 text-center">
        <p className="text-3xl font-bold text-[#F26A21]">{brief.total_recommendations}</p>
        <p className="text-xs text-[#6B7280]">Recommendations</p>
      </div>
      <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] p-4 text-center">
        <p className="text-3xl font-bold text-amber-500">{brief.total_risks}</p>
        <p className="text-xs text-[#6B7280]">Deadline Risks</p>
      </div>
      <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] p-4 text-center">
        <p className="text-3xl font-bold text-red-500">{brief.critical_items}</p>
        <p className="text-xs text-[#6B7280]">Critical Items</p>
      </div>
    </div>
  </div>
);

const EmptyState: React.FC<{ icon: React.ElementType; text: string }> = ({
  icon: Icon,
  text,
}) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F7F5]">
      <Icon size={24} className="text-[#6B7280]" />
    </div>
    <p className="text-sm text-[#6B7280]">{text}</p>
  </div>
);

export default RecommendationsPanel;
