import React from "react";
import type { ActionItem } from "../types";

interface AssignmentBoxProps {
  actionItems: ActionItem[];
}

const AssignmentBox: React.FC<AssignmentBoxProps> = ({ actionItems }) => {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#6B7280] mb-4">
        Assignments
      </h3>
      <div className="space-y-3">
        {actionItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm font-medium text-[#0B1633]">
              Action {index + 1}:
            </span>
            <span className="text-sm text-[#F26A21] font-semibold">
              Assigned to {item.owner}
            </span>
          </div>
        ))}
        {actionItems.length === 0 && (
          <p className="text-xs text-[#9CA3AF] italic">No assignments identified.</p>
        )}
      </div>
    </div>
  );
};

export default AssignmentBox;
