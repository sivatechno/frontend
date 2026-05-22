import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Bot,
  ChevronDown,
  Loader2,
  MessageSquare,
  SendHorizonal,
  Sparkles,
  X,
  Trash2,
} from "lucide-react";
import {
  createChatSession,
  sendChatMessage,
  fetchChatHistory,
  clearChatHistory,
} from "../services/api";
import type { ChatMessage } from "../types";

const ChatPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I\u2019m **Sophia**, your AI Workplace Assistant. I can help with meetings, tasks, analytics, and more. What would you like to do?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !sessionId) {
      createChatSession()
        .then((s) => setSessionId(s.session_id))
        .catch(() => setError("Failed to initialize chat"));
    }
  }, [isOpen, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !sessionId || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    setError(null);

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Add a placeholder assistant message
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await sendChatMessage(userMessage, {}, messages.slice(0, -1));
      const reply = response.reply;

      // Update the placeholder assistant message with the full reply
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = { role: "assistant", content: reply };
        }
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
      setMessages((prev) => prev.slice(0, -1)); // Remove placeholder
    } finally {
      setIsLoading(false);
    }
  }, [input, sessionId, isLoading]);

  const handleClear = async () => {
    if (sessionId) {
      try {
        await clearChatHistory(sessionId);
      } catch {}
    }
    setMessages([
      {
        role: "assistant",
        content:
          "Conversation cleared. How can I help you today?",
      },
    ]);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F26A21] to-[#E55D1B] text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-xl"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized
          ? "bottom-6 right-6 h-14 w-72"
          : "bottom-6 right-6 h-[600px] w-[400px]"
      }`}
    >
      <div className="flex h-full flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-[#0B1633] to-[#1a2a4a] px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Sophia AI</p>
              <p className="text-xs text-white/60">Workplace Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
              title="Clear conversation"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronDown size={16} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {error && (
                <div className="mb-3 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#F26A21] text-white"
                        : "bg-[#F8F7F5] text-[#1F2937]"
                    }`}
                  >
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          ? msg.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\n/g, "<br/>")
                          : '<span class="text-gray-400 italic">Thinking...</span>',
                      }}
                    />
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#F3F4F6] px-4 py-3">
              <div className="flex items-end gap-2 rounded-xl border border-[#E5E7EB] bg-[#F8F7F5] px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Sophia anything..."
                  className="flex-1 resize-none bg-transparent text-sm text-[#1F2937] outline-none placeholder:text-[#9CA3AF]"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F26A21] text-white transition hover:bg-[#E55D1B] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <SendHorizonal size={15} />
                  )}
                </button>
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-[#9CA3AF]">
                <Sparkles size={11} />
                AI-powered workplace assistant
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
