import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Zap,
} from "lucide-react";
import {
  fetchWorkflows,
  toggleWorkflow,
  deleteWorkflow,
  createWorkflow,
  fetchWorkflowLog,
} from "../services/api";
import type { WorkflowDefinition, WorkflowExecutionLog } from "../types";

const TRIGGER_TYPES = [
  { id: "meeting_completed", label: "Meeting Completed" },
  { id: "task_created", label: "Task Created" },
  { id: "task_overdue", label: "Task Overdue" },
  { id: "task_status_changed", label: "Task Status Changed" },
  { id: "schedule", label: "Schedule (Cron)" },
  { id: "manual", label: "Manual Trigger" },
];

const ACTION_TYPES = [
  { id: "notify", label: "Send Notification" },
  { id: "create_task", label: "Create Task" },
  { id: "send_email", label: "Send Email" },
  { id: "update_status", label: "Update Task Status" },
  { id: "generate_report", label: "Generate Report" },
  { id: "create_followup", label: "Create Follow-up" },
];

const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [log, setLog] = useState<WorkflowExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [newWf, setNewWf] = useState({
    name: "",
    description: "",
    trigger_type: "meeting_completed",
    trigger_config: "{}",
    actions: [{ action_type: "notify", config: "{}" }],
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wfRes, logRes] = await Promise.all([
        fetchWorkflows(),
        fetchWorkflowLog(),
      ]);
      setWorkflows(wfRes.workflows);
      setLog(logRes.log);
    } catch {
      setError("Failed to load workflows. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleWorkflow(id, enabled);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, enabled } : w))
      );
    } catch {
      setError("Failed to toggle workflow");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError("Failed to delete workflow");
    }
  };

  const handleCreate = async () => {
    try {
      const triggerConfig = JSON.parse(newWf.trigger_config || "{}");
      const actions = newWf.actions.map((a) => ({
        action_type: a.action_type,
        config: JSON.parse(a.config || "{}"),
      }));

      const created = await createWorkflow({
        name: newWf.name,
        description: newWf.description,
        trigger_type: newWf.trigger_type,
        trigger_config: triggerConfig,
        actions,
      });
      setWorkflows((prev) => [...prev, created]);
      setShowCreator(false);
      setNewWf({
        name: "",
        description: "",
        trigger_type: "meeting_completed",
        trigger_config: "{}",
        actions: [{ action_type: "notify", config: "{}" }],
      });
    } catch {
      setError("Failed to create workflow");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1633]">Workflow Automation</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Automate processes with trigger-based workflows
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#5C667A] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="flex items-center gap-2 rounded-xl bg-[#F26A21] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#E55D1B]"
          >
            <Plus size={15} />
            New Workflow
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Creator */}
      {showCreator && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-card">
          <h3 className="font-bold text-[#0B1633]">Create Workflow</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Name
              </label>
              <input
                value={newWf.name}
                onChange={(e) => setNewWf({ ...newWf, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F26A21]/50"
                placeholder="My Workflow"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Description
              </label>
              <input
                value={newWf.description}
                onChange={(e) =>
                  setNewWf({ ...newWf, description: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F26A21]/50"
                placeholder="What does this workflow do?"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Trigger
              </label>
              <select
                value={newWf.trigger_type}
                onChange={(e) =>
                  setNewWf({ ...newWf, trigger_type: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F26A21]/50"
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Trigger Config (JSON)
              </label>
              <input
                value={newWf.trigger_config}
                onChange={(e) =>
                  setNewWf({ ...newWf, trigger_config: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-[#E5E7EB] px-3 py-2 font-mono text-xs outline-none focus:border-[#F26A21]/50"
                placeholder='{"conditions": {"priority": "high"}}'
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Actions
            </label>
            {newWf.actions.map((action, idx) => (
              <div key={idx} className="mt-2 flex gap-2">
                <select
                  value={action.action_type}
                  onChange={(e) => {
                    const updated = [...newWf.actions];
                    updated[idx] = {
                      ...updated[idx],
                      action_type: e.target.value,
                    };
                    setNewWf({ ...newWf, actions: updated });
                  }}
                  className="flex-1 rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm outline-none"
                >
                  {ACTION_TYPES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <input
                  value={action.config}
                  onChange={(e) => {
                    const updated = [...newWf.actions];
                    updated[idx] = {
                      ...updated[idx],
                      config: e.target.value,
                    };
                    setNewWf({ ...newWf, actions: updated });
                  }}
                  className="flex-1 rounded-xl border border-[#E5E7EB] px-3 font-mono text-xs outline-none"
                  placeholder='{"event_type": "...", "message": "..."}'
                />
                <button
                  onClick={() => {
                    const updated = newWf.actions.filter((_, i) => i !== idx);
                    setNewWf({ ...newWf, actions: updated });
                  }}
                  className="rounded-xl border border-red-200 px-3 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                setNewWf({
                  ...newWf,
                  actions: [
                    ...newWf.actions,
                    { action_type: "notify", config: "{}" },
                  ],
                })
              }
              className="mt-2 flex items-center gap-2 text-sm font-medium text-[#F26A21]"
            >
              <Plus size={14} />
              Add Action
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setShowCreator(false)}
              className="rounded-xl border border-[#E5E7EB] px-4 py-2 text-sm text-[#5C667A]"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newWf.name}
              className="rounded-xl bg-[#F26A21] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Create Workflow
            </button>
          </div>
        </div>
      )}

      {/* Workflow List */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#F26A21]" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {workflows.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F7F5]">
                  <Zap size={24} className="text-[#6B7280]" />
                </div>
                <p className="text-lg font-bold text-[#0B1633]">No workflows yet</p>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Create automated workflows to streamline your processes.
                </p>
              </div>
            ) : (
              workflows.map((wf) => (
                <div
                  key={wf.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm ${
                    wf.enabled
                      ? "border-[#E5E7EB]"
                      : "border-dashed border-[#D1D5DB] opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          wf.enabled
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Cpu size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#0B1633]">{wf.name}</h3>
                        <p className="text-sm text-[#6B7280]">{wf.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                            {TRIGGER_TYPES.find((t) => t.id === wf.trigger_type)?.label ||
                              wf.trigger_type}
                          </span>
                          {wf.actions.map((a, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-[#F26A21]/10 px-2.5 py-0.5 text-xs font-medium text-[#F26A21]"
                            >
                              {ACTION_TYPES.find((at) => at.id === a.action_type)
                                ?.label || a.action_type}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-[#9CA3AF]">
                          <span>{wf.execution_count} executions</span>
                          {wf.last_executed && (
                            <span>Last: {new Date(wf.last_executed).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(wf.id, !wf.enabled)}
                        className={`rounded-lg p-2 transition ${
                          wf.enabled
                            ? "text-emerald-500 hover:bg-emerald-50"
                            : "text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {wf.enabled ? (
                          <ToggleRight size={20} />
                        ) : (
                          <ToggleLeft size={20} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(wf.id)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Execution Log */}
          {log.length > 0 && (
            <div className="mt-8">
              <h3 className="font-bold text-[#0B1633]">Execution Log</h3>
              <div className="mt-3 space-y-2">
                {log.slice(-10).reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-[#E5E7EB] bg-[#F8F7F5] px-4 py-2 text-sm"
                  >
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="font-medium text-[#0B1633]">
                      {entry.workflow_name}
                    </span>
                    <span className="text-[#6B7280]">
                      {entry.results.length} action(s) executed
                    </span>
                    <span className="ml-auto font-mono text-xs text-[#9CA3AF]">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowBuilder;
