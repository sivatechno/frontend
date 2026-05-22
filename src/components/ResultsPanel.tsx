import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import ActionItemCard from "./ActionItemCard";
import EventList from "./EventList";
import ExportButton from "./ExportButton";
import AssignmentBox from "./AssignmentBox";
import type { AnalysisOutput } from "../types";

interface ResultsPanelProps {
  jobId: string;
  result: AnalysisOutput;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ jobId, result }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const { meeting_summary, transcript, participants, action_items } = result;

  const ownerCounts = action_items.reduce<Record<string, number>>((acc, item) => {
    acc[item.owner] = (acc[item.owner] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col h-full">
      {meeting_summary && (
        <div className="bg-gradient-to-r from-[#F26A21]/5 to-[#F26A21]/[0.02] border border-[#F26A21]/10 rounded-2xl p-5 mb-5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#F26A21]/70 mb-2">
            Meeting Summary
          </h3>
          <p className="text-[#0B1633] text-sm leading-relaxed font-medium">
            {meeting_summary}
          </p>
        </div>
      )}

      {transcript && (
        <div className="mb-5 border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center justify-between w-full px-5 py-3 bg-[#F8F7F5] hover:bg-[#F3F2F0] transition-colors"
          >
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[#6B7280]">
              <FileText size={14} />
              Full Transcript
            </span>
            {showTranscript ? <ChevronUp size={16} className="text-[#6B7280]" /> : <ChevronDown size={16} className="text-[#6B7280]" />}
          </button>
          {showTranscript && (
            <div className="p-5 max-h-[400px] overflow-y-auto">
              <p className="text-xs text-[#5C667A] leading-relaxed whitespace-pre-wrap font-mono">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {participants.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {participants.map((p) => (
            <span
              key={p}
              className="bg-gradient-to-r from-[#DCEAF7]/60 to-[#EAF3FB]/60 text-[#0B1633] text-xs px-3.5 py-1.5 rounded-full border border-[#DCEAF7] font-medium"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#6B7280]">
          Action Items ({action_items.length})
        </h3>
      </div>

      {action_items.length === 0 ? (
        <p className="text-[#9CA3AF] text-sm italic text-center py-8">
          No action items detected in this meeting.
        </p>
      ) : (
        <>
          <div className="grid gap-3 mb-6 overflow-y-auto flex-1">
            {action_items.map((item, i) => (
              <ActionItemCard key={i} item={item} />
            ))}
          </div>
          <AssignmentBox actionItems={action_items} />
        </>
      )}

      {/* Footer with counts + export */}
      <div className="border-t border-[#F3F4F6] pt-4 mt-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(ownerCounts).map(([owner, count]) => (
            <span
              key={owner}
              className="text-[11px] text-[#6B7280] bg-[#F8F7F5] px-2.5 py-1 rounded-lg font-medium"
            >
              {owner}: {count} item{count > 1 ? "s" : ""}
            </span>
          ))}
        </div>
        <ExportButton jobId={jobId} />
        <EventList jobId={jobId} />
      </div>
    </div>
  );
};

export default ResultsPanel;
