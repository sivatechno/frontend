import React, { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  MessageSquare,
  Search,
  TrendingUp,
  Users,
  Video,
  Loader2,
  AlertCircle,
  Lightbulb,
  Hash,
} from "lucide-react";
import {
  searchKnowledge,
  getRecentKnowledge,
  getKnowledgeStats,
} from "../services/api";
import type { KnowledgeEntry, KnowledgeStats } from "../types";

const CATEGORIES = [
  { id: "meetings", label: "Meetings", icon: Video },
  { id: "decisions", label: "Decisions", icon: Lightbulb },
  { id: "action_items", label: "Action Items", icon: FileText },
  { id: "insights", label: "Insights", icon: TrendingUp },
  { id: "documents", label: "Documents", icon: BookOpen },
];

const KnowledgeBaseView: React.FC = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KnowledgeEntry[]>([]);
  const [recent, setRecent] = useState<KnowledgeEntry[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rec, st] = await Promise.all([
        getRecentKnowledge(),
        getKnowledgeStats(),
      ]);
      setRecent(rec);
      setStats(st);
    } catch {
      setError("Failed to load knowledge base. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await searchKnowledge(
        query,
        activeCategory || undefined,
        20
      );
      setResults(res);
    } catch {
      setError("Search failed");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (query) {
      const timeout = setTimeout(() => handleSearch(), 300);
      return () => clearTimeout(timeout);
    } else {
      setResults([]);
    }
  }, [query, activeCategory]);

  const displayEntries = results.length > 0 ? results : recent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1633]">Knowledge Base</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Organizational memory - search meetings, decisions, and insights
        </p>
      </div>

      {/* Stats */}
      {stats && !loading && (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setActiveCategory(
                  activeCategory === cat.id ? null : cat.id
                )
              }
              className={`rounded-xl border p-4 text-left transition ${
                activeCategory === cat.id
                  ? "border-[#F26A21]/40 bg-[#F26A21]/5"
                  : "border-[#E5E7EB] bg-white hover:border-[#F26A21]/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <cat.icon size={18} className="text-[#F26A21]" />
                <span className="text-sm font-semibold text-[#0B1633]">
                  {cat.label}
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-[#F26A21]">
                {stats[cat.id as keyof KnowledgeStats] ?? 0}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search organizational memory..."
          className="w-full rounded-xl border border-[#E5E7EB] bg-white py-3 pl-11 pr-4 text-sm text-[#1F2937] outline-none transition focus:border-[#F26A21]/50 focus:ring-2 focus:ring-[#F26A21]/10"
        />
        {searching && (
          <Loader2
            size={16}
            className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#F26A21]"
          />
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={32} className="animate-spin text-[#F26A21]" />
        </div>
      ) : displayEntries.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F8F7F5]">
            <BookOpen size={28} className="text-[#6B7280]" />
          </div>
          <p className="text-lg font-bold text-[#0B1633]">No knowledge entries yet</p>
          <p className="mt-1 max-w-sm text-sm text-[#6B7280]">
            Process meetings and generate insights to build your organizational memory.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            {results.length > 0
              ? `Search Results (${results.length})`
              : "Recent Entries"}
          </p>
          {displayEntries.map((entry) => (
            <KnowledgeCard key={`${entry.id}-${entry.created_at}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
};

const CATEGORY_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  meetings: { icon: Video, color: "text-blue-500 bg-blue-500/10" },
  decisions: { icon: Lightbulb, color: "text-amber-500 bg-amber-500/10" },
  action_items: { icon: Hash, color: "text-emerald-500 bg-emerald-500/10" },
  insights: { icon: TrendingUp, color: "text-purple-500 bg-purple-500/10" },
  documents: { icon: FileText, color: "text-cyan-500 bg-cyan-500/10" },
};

const KnowledgeCard: React.FC<{ entry: KnowledgeEntry }> = ({ entry }) => {
  const meta = CATEGORY_MAP[entry.category] || CATEGORY_MAP.documents;
  const Icon = meta.icon;

  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}
        >
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-[#6B7280]">
              {entry.category}
            </span>
            {entry.relevance_score !== undefined && (
              <span className="rounded-full bg-[#F26A21]/10 px-2 py-0.5 text-xs font-medium text-[#F26A21]">
                {Math.round(entry.relevance_score * 100)}% match
              </span>
            )}
          </div>
          <h3 className="mt-1 font-semibold text-[#0B1633]">
            {entry.title || entry.summary?.slice(0, 100) || "Untitled"}
          </h3>
          {entry.summary && (
            <p className="mt-1 line-clamp-2 text-sm text-[#6B7280]">
              {entry.summary}
            </p>
          )}
          {entry.participants && entry.participants.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-[#9CA3AF]">
              <Users size={12} />
              {entry.participants.slice(0, 3).join(", ")}
              {entry.participants.length > 3 &&
                ` +${entry.participants.length - 3} more`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseView;
