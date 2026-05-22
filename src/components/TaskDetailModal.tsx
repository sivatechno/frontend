import React, { useState, useEffect, useCallback } from "react";
import { X, Loader2, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import type { TaskInfo } from "../types";
import { updateTaskDetails } from "../services/api";

interface TaskDetailModalProps {
  task: TaskInfo;
  onClose: () => void;
  onSaved: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onSaved }) => {
  const [title, setTitle] = useState(task.title);
  const [owner, setOwner] = useState(task.owner || "");
  const [priority, setPriority] = useState(task.priority);
  const [deadline, setDeadline] = useState(task.due || "");
  const [context, setContext] = useState(task.context || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updates: Record<string, string | null> = {};
      if (title !== task.title) updates.title = title;
      if (owner !== (task.owner || "")) updates.owner = owner || "Unknown";
      if (priority !== task.priority) updates.priority = priority;
      if (deadline !== (task.due || "")) updates.deadline = deadline || null;
      if (context !== (task.context || "")) updates.context = context;

      if (Object.keys(updates).length === 0) {
        setSaving(false);
        onClose();
        return;
      }

      await updateTaskDetails(task.id, updates);
      setSuccess(true);
      setTimeout(() => {
        setSaving(false);
        onSaved();
        onClose();
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  const hasChanges =
    title !== task.title ||
    owner !== (task.owner || "") ||
    priority !== task.priority ||
    deadline !== (task.due || "") ||
    context !== (task.context || "");

  const priorityOptions: Array<{ value: string; label: string; dot: string }> = [
    { value: "High", label: "High", dot: "bg-red-500" },
    { value: "Medium", label: "Medium", dot: "bg-amber-500" },
    { value: "Low", label: "Low", dot: "bg-emerald-500" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-6 py-5">
          <h2 className="text-lg font-bold text-[#0B1633]">Task Details</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F8F7F5] hover:text-[#0B1633] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-6 max-h-[65vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#0B1633] outline-none focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
            />
          </div>

          {/* Owner */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Owner</label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#0B1633] outline-none focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
              placeholder="Unassigned"
            />
          </div>

          {/* Priority + Deadline row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Priority</label>
              <div className="flex gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value as TaskInfo["priority"])}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      priority === opt.value
                        ? "border-[#F26A21]/40 bg-[#F26A21]/10 text-[#F26A21]"
                        : "border-[#E5E7EB] text-[#5C667A] hover:border-[#F26A21]/40"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Deadline</label>
              <input
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#0B1633] outline-none focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
                placeholder="e.g. 2026-06-01"
              />
            </div>
          </div>

          {/* Context */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Context</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm text-[#0B1633] outline-none focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10 resize-none"
            />
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#F8F7F5] p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Meeting</p>
              <p className="mt-1 text-sm text-[#0B1633] truncate">{task.meeting}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Confidence</p>
              <p className="mt-1 text-sm text-[#0B1633]">{Math.round(task.confidence * 100)}%</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Status</p>
              <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                task.status === "done" ? "bg-emerald-100 text-emerald-700" :
                task.status === "progress" ? "bg-amber-100 text-amber-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {task.status === "todo" ? "To Do" : task.status === "progress" ? "In Progress" : "Done"}
              </span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">Task ID</p>
              <p className="mt-1 text-xs font-mono text-[#6B7280] truncate">{task.id}</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
              <CheckCircle2 size={16} />
              Saved successfully
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#F3F4F6] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[#E5E7EB] px-5 py-2.5 text-sm font-medium text-[#5C667A] transition hover:border-[#F26A21]/40 hover:text-[#F26A21]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!hasChanges && !error)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F26A21] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#E55D1B] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
