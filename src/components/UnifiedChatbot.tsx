import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Send,
  X,
  Loader2,
  Sparkles,
  ChevronLeft,
  FileText,
  CalendarDays,
  ClipboardList,
  BarChart3,
  ExternalLink,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Trash2,
  History,
  RefreshCw,
  Globe,
} from "lucide-react";
import {
  sendChatMessage,
  speakText,
  stopSpeaking,
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
} from "../services/api";
import type { ChatContext, ChatMessage } from "../services/api";

// ── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: Array<{ type: string; filter?: string; view?: string }>;
  timestamp: Date;
}

interface Props {
  activeView: string;
  tasksCount: { todo: number; progress: number; done: number };
  meetingsCount: number;
  onNavigate?: (view: string, filter?: string) => void;
  userId?: string;
  workspaceId?: string;
  projectId?: string;
  meetingId?: string;
  taskId?: string;
  pageId?: string;
  isOpenExternal?: boolean;
  onClose?: () => void;
}

const SUGGESTED_PROMPTS = [
  "Show my pending action items",
  "Filter high-priority tasks",
  "Summarize the workspace",
  "Show overdue tasks",
  "How many meetings were processed?",
  "Create a meeting tomorrow at 3 PM",
  "What can you help me with?",
  "Read me a voice summary",
];

const LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ja-JP", label: "Japanese" },
  { code: "zh-CN", label: "Chinese" },
];

// ── Helper: Simple Markdown Renderer ───────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br/>");
}

// ── Component ───────────────────────────────────────────────────────────────

const UnifiedChatbot: React.FC<Props> = ({
  activeView,
  tasksCount,
  meetingsCount,
  onNavigate,
  userId = "super_admin",
  workspaceId = "default",
  projectId = "",
  meetingId = "",
  taskId = "",
  pageId = "",
  isOpenExternal,
  onClose,
}) => {
  // ── State ──
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `👋 Hi! I'm your **AI Assistant**. I can help you manage tasks, meetings, action items, and more across your workspace.\n\n**Current workspace:** ${tasksCount.todo + tasksCount.progress + tasksCount.done} tasks, ${meetingsCount} meetings.\n\nTry asking me something — or click the 🎤 mic button to speak!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    onClose?.();
  }, [onClose]);

  // ── Refs ──
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer> | null>(null);
  const messagesRef = useRef<Message[]>(messages);

  // Keep messages ref in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── Auto-scroll ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Auto-focus ──
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen, isMinimized]);

  // ── Escape key ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showHistoryPanel) setShowHistoryPanel(false);
        else handleClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showHistoryPanel]);

  // ── Click outside ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !isMinimized && panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest(".chatbot-header-btn")
      ) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isMinimized]);

  // ── Preload speech voices ──
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
    }
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // ── Sync with external open/close control ──
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
      if (isOpenExternal) setIsMinimized(false);
    }
  }, [isOpenExternal]);

  // ── Speak AI reply ──
  const speakAIReply = useCallback((text: string) => {
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/[#*_`~]/g, "")
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, "")
      .trim();
    if (!cleanText) return;
    setVoiceStatus("speaking");
    const utterance = speakText(cleanText, () => setVoiceStatus("idle"));
    if (!utterance) setVoiceStatus("idle");
  }, []);

  // ── Stop speaking ──
  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    setVoiceStatus("idle");
  }, []);

  // ── Send message ──
  const handleSend = useCallback(async (text: string, fromVoice = false) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowSuggestions(false);

    // Add a placeholder assistant message for streaming
    setMessages((prev) => [...prev, { id: `assistant-${Date.now()}`, role: "assistant", content: "", timestamp: new Date() }]);

    try {
      const context: ChatContext = {
        active_view: activeView,
        workspace_id: workspaceId,
        user_id: userId,
        current_module: activeView,
        project_id: projectId,
        meeting_id: meetingId,
        task_id: taskId,
        page_id: pageId,
      };

      const history: ChatMessage[] = messagesRef.current
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp.toISOString(),
        }));

      const response = await sendChatMessage(trimmed, context, history);

      // Update the placeholder with the actual response
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant" && updated[lastIdx]?.content === "") {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: response.reply,
            actions: response.actions,
          };
        } else {
          updated.push({
            id: `assistant-${Date.now()}-final`,
            role: "assistant",
            content: response.reply,
            actions: response.actions,
            timestamp: new Date(),
          });
        }
        return updated;
      });

      // Auto-speak if from voice and not muted
      if (fromVoice && !isMuted) speakAIReply(response.reply);

      // Execute navigation actions
      if (response.actions && onNavigate) {
        for (const action of response.actions) {
          if (action.type === "navigate" && action.view) onNavigate(action.view);
          else if (action.type === "filter_tasks" && action.filter) onNavigate("tasks", action.filter);
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        // Remove the empty placeholder
        if (updated[updated.length - 1]?.role === "assistant" && updated[updated.length - 1]?.content === "") {
          updated.pop();
        }
        updated.push({
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Sorry, I couldn't reach the AI service. ${err instanceof Error ? err.message : "Please try again."}\n\nMake sure the backend server is running.`,
          timestamp: new Date(),
        });
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeView, isLoading, isMuted, onNavigate, speakAIReply, userId, workspaceId, projectId, meetingId, taskId, pageId]);

  // ── Voice input ──
  const handleVoiceInput = useCallback(() => {
    if (voiceStatus === "listening") {
      recognizerRef.current?.stop();
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      setMessages((prev) => [...prev, {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "⚠️ Voice input is not supported in this browser. Please use Chrome or Edge.",
        timestamp: new Date(),
      }]);
      return;
    }

    const recognizer = createSpeechRecognizer(
      (text) => { if (text.trim()) handleSend(text, true); },
      (status) => {
        if (status === "listening") setVoiceStatus("listening");
        else if (status === "processing") setVoiceStatus("processing");
        else setVoiceStatus("idle");
      },
      () => setVoiceStatus("idle"),
      language
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  }, [voiceStatus, language, handleSend]);

  // ── Clear chat ──
  const handleClearChat = useCallback(async () => {
    handleStopSpeaking();
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: "assistant",
      content: `👋 Chat cleared! I'm your **AI Assistant**. How can I help you today?\n\n**Workspace stats:** ${tasksCount.todo + tasksCount.progress + tasksCount.done} tasks, ${meetingsCount} meetings.`,
      timestamp: new Date(),
    }]);
    setShowSuggestions(true);
  }, [handleStopSpeaking, tasksCount, meetingsCount]);

  // ── Load history ──
  const loadHistory = useCallback(async () => {
    try {
      const { fetchChatHistory } = await import("../services/api");
      const result = await fetchChatHistory(userId);
      if (result.messages.length > 1) setHistoryMessages(result.messages);
    } catch { /* silent */ }
  }, [userId]);

  // ── Restore history ──
  const handleRestoreHistory = useCallback(async () => {
    try {
      const { fetchChatHistory } = await import("../services/api");
      const result = await fetchChatHistory(userId);
      if (result.messages.length > 0) {
        const restored: Message[] = result.messages.map((m, i) => ({
          id: `hist-${i}-${Date.now()}`,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.timestamp || Date.now()),
        }));
        setMessages(restored);
        setShowSuggestions(false);
        setShowHistoryPanel(false);
      }
    } catch { /* silent */ }
  }, [userId]);

  // Load history when panel opens
  useEffect(() => {
    if (isOpen && !isMinimized) loadHistory();
  }, [isOpen, isMinimized, loadHistory]);

  // ── Keyboard handler ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // ── Action button click ──
  const handleActionClick = (action: { type: string; filter?: string; view?: string }) => {
    if (action.type === "navigate" && action.view && onNavigate) onNavigate(action.view);
    else if (action.type === "filter_tasks" && action.filter && onNavigate) onNavigate("tasks", action.filter);
  };

  const getActionIcon = (action: { type: string; view?: string }) => {
    if (action.type === "navigate") {
      switch (action.view) {
        case "tasks": return <ClipboardList size={14} />;
        case "meetings": return <CalendarDays size={14} />;
        case "analytics": return <BarChart3 size={14} />;
        case "upload": return <FileText size={14} />;
        default: return <ExternalLink size={14} />;
      }
    }
    return <Sparkles size={14} />;
  };

  // ── Speak a specific message ──
  const handleSpeakMessage = (content: string) => {
    if (voiceStatus === "speaking") handleStopSpeaking();
    else speakAIReply(content);
  };

  // ── Voice status helpers ──
  const voiceStatusColor =
    voiceStatus === "listening" ? "text-emerald-500" :
    voiceStatus === "speaking" ? "text-[#F26A21]" :
    "text-[#6B7280]";

  // ── Render ──
  return (
    <div
      ref={panelRef}
      className={`fixed top-[62px] right-4 z-50 w-[430px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
        isOpen && !isMinimized
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
      style={{
        height: "620px",
        maxHeight: "calc(100vh - 72px)",
        border: "1px solid rgba(229,231,235,0.8)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(242,106,33,0.08)",
      }}
    >
      {/* ── Panel Header ── */}
      <div
        className="relative flex h-[62px] items-center justify-between overflow-hidden px-4"
        style={{ background: "linear-gradient(135deg, #F26A21 0%, #d45a10 100%)" }}
      >
        <div className="relative z-10 flex items-center gap-3">
          {showHistoryPanel ? (
            <button
              onClick={() => setShowHistoryPanel(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white hover:bg-white/20 transition"
            >
              <ChevronLeft size={16} />
            </button>
          ) : (
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)" }}
            >
              <Bot size={17} className="text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-white">
                {showHistoryPanel ? "Chat History" : "AI Assistant"}
              </h3>
              {!showHistoryPanel && (
                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
                  style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)" }}>
                  Decision Minds
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/80 transition-colors duration-300">
              {voiceStatus === "listening" ? "Listening..." :
               voiceStatus === "processing" ? "Processing..." :
               voiceStatus === "speaking" ? "Speaking..." :
               "Workspace Intelligence · Ready"}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-0.5">
          {voiceStatus === "speaking" && (
            <button onClick={handleStopSpeaking}
              className="flex h-7 w-7 animate-pulse items-center justify-center rounded-lg text-white hover:bg-white/20 transition"
              title="Stop speaking"
            >
              <Square size={13} />
            </button>
          )}
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-white/20 ${
              showHistoryPanel ? "text-white bg-white/20" : "text-white/70 hover:text-white"
            }`}
            title="Chat History"
          >
            <History size={14} />
          </button>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {showHistoryPanel ? (
        /* ══ History Panel ══ */
        <div className="overflow-y-auto px-4 py-4" style={{ height: "calc(100% - 62px)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">Previous Conversations</h4>
            <button
              onClick={handleRestoreHistory}
              className="flex items-center gap-1 rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#F26A21] hover:bg-[#F26A21]/5 transition"
            >
              <RefreshCw size={12} />
              Restore
            </button>
          </div>
          {historyMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History size={36} className="text-[#D1D5DB] mb-3" />
              <p className="text-sm text-[#6B7280]">No chat history yet</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">Start a conversation to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {historyMessages.slice(-20).reverse().map((msg, idx) => (
                <div key={idx} className="rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${msg.role === "user" ? "text-[#F26A21]" : "text-[#0B1633]"}`}>
                      {msg.role === "user" ? "You" : "AI"}
                    </span>
                    {msg.timestamp && (
                      <span className="text-[10px] text-[#9CA3AF]">
                        {new Date(msg.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5C667A] line-clamp-2">
                    {msg.content.substring(0, 120)}{msg.content.length > 120 ? "..." : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ══ Chat Area ══ */
        <>
          <div className="overflow-y-auto px-4 py-4" style={{ height: "calc(100% - 62px - 78px)" }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#F26A21] text-white rounded-br-md"
                      : "bg-[#F8F7F5] text-[#0B1633] rounded-bl-md border border-[#E5E7EB]"
                  }`}
                >
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        ? renderMarkdown(msg.content)
                        : '<span class="text-gray-400 italic">Thinking...</span>',
                    }}
                  />
                  {msg.role === "assistant" && msg.content && (
                    <div className="mt-2 flex items-center gap-1.5 border-t border-[#E5E7EB] pt-2">
                      <button
                        onClick={() => handleSpeakMessage(msg.content)}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-[#9CA3AF] hover:bg-white hover:text-[#F26A21] transition"
                        title={voiceStatus === "speaking" ? "Stop" : "Read aloud"}
                      >
                        {voiceStatus === "speaking" ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.actions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleActionClick(action)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#F26A21]/30 bg-white px-2 py-1 text-[11px] font-medium text-[#F26A21] transition hover:bg-[#F26A21]/10"
                            >
                              {getActionIcon(action)}
                              <span>
                                {action.type === "navigate" ? `Go to ${action.view}` :
                                 action.type === "filter_tasks" ? `Show ${action.filter} tasks` :
                                 "Open"}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="mt-1 px-1 text-[10px] text-[#9CA3AF]">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}

            {isLoading && (
              <div className="mb-4 text-left">
                <div className="inline-flex items-center gap-3 rounded-2xl rounded-bl-md border border-[#E5E7EB] bg-[#F8F7F5] px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#F26A21] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#F26A21] animate-bounce" style={{ animationDelay: "160ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#F26A21] animate-bounce" style={{ animationDelay: "320ms" }} />
                  </div>
                  <span className="text-sm text-[#6B7280]">
                    {voiceStatus === "processing" ? "🎤 Processing voice..." : "Thinking..."}
                  </span>
                </div>
              </div>
            )}

            {voiceStatus === "listening" && !isLoading && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <span className="text-sm font-medium text-emerald-700">Listening... speak now</span>
                </div>
              </div>
            )}

            {showSuggestions && messages.length <= 1 && voiceStatus === "idle" && (
              <div className="mt-2">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#6B7280]">
                  <Sparkles size={12} className="text-[#F26A21]" />
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs text-[#5C667A] transition hover:border-[#F26A21]/40 hover:bg-[#F26A21]/5 hover:text-[#F26A21]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-[#F3F4F6] bg-white px-3 py-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] px-2 transition focus-within:border-[#F26A21]/50 focus-within:bg-white focus-within:shadow-sm">
              <div className="relative">
                <button
                  onClick={() => setShowLangPicker(!showLangPicker)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-white hover:text-[#6B7280] transition"
                  title="Select language"
                >
                  <Globe size={15} />
                </button>
                {showLangPicker && (
                  <div className="absolute bottom-full left-0 mb-2 rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg z-10 min-w-[130px]">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setShowLangPicker(false); }}
                        className={`w-full px-3 py-1.5 text-left text-xs transition hover:bg-[#F8F7F5] ${
                          language === lang.code ? "text-[#F26A21] font-bold" : "text-[#5C667A]"
                        }`}
                      >
                        {language === lang.code ? "✓ " : "  "}{lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={voiceStatus === "listening" ? "Listening..." : "Ask me anything..."}
                className="flex-1 bg-transparent py-2.5 text-sm text-[#0B1633] outline-none placeholder:text-[#9CA3AF]"
                disabled={isLoading || voiceStatus === "listening"}
              />

              <button
                onClick={handleVoiceInput}
                disabled={isLoading}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  voiceStatus === "listening"
                    ? "bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-200"
                    : "text-[#6B7280] hover:bg-white hover:text-emerald-500"
                } disabled:cursor-not-allowed disabled:opacity-40`}
                title={voiceStatus === "listening" ? "Stop recording" : "Voice input"}
              >
                {voiceStatus === "listening" ? <MicOff size={15} /> : <Mic size={15} />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isMuted ? "text-[#9CA3AF]" : "text-[#6B7280] hover:bg-white hover:text-[#F26A21]"
                }`}
                title={isMuted ? "Unmute voice responses" : "Mute voice responses"}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #F26A21 0%, #e05010 100%)" }}
                aria-label="Send message"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>

            <div className="mt-1.5 flex items-center justify-between px-1">
              <button
                onClick={handleClearChat}
                className="flex items-center gap-1 text-[10px] text-[#9CA3AF] hover:text-red-400 transition"
                title="Clear chat"
              >
                <Trash2 size={11} />
                Clear
              </button>
              <p className={`text-[10px] transition-colors duration-300 ${voiceStatusColor}`}>
                {voiceStatus !== "idle" ? (
                  <span className="font-medium">
                    {voiceStatus === "listening" && "🎤 Listening..."}
                    {voiceStatus === "processing" && "⏳ Processing..."}
                    {voiceStatus === "speaking" && "🔊 Speaking..."}
                  </span>
                ) : (
                  "AI Assistant · Voice ready"
                )}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UnifiedChatbot;
