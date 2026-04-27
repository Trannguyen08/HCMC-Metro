"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";
const SESSION_KEY = "chatbox_session_token";
const MAX_CHARS = 500;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOrCreateSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

function newSessionToken(): string {
  const token = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, token);
  return token;
}

/** Chuyển markdown cơ bản (bold, bullet) sang HTML an toàn */
function parseMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n/g, "<br />");
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ChatboxWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── tự động khởi tạo session token ──────────────────────────────────────────
  useEffect(() => {
    setSessionToken(getOrCreateSessionToken());
  }, []);

  // ── load lịch sử khi mở chatbox lần đầu ─────────────────────────────────────
  useEffect(() => {
    if (isOpen && sessionToken && !hasLoadedHistory) {
      loadHistory(sessionToken);
      setHasLoadedHistory(true);
      setUnreadCount(0);
    }
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, sessionToken]);

  // ── auto-scroll mỗi khi messages thay đổi ───────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── load lịch sử từ server ───────────────────────────────────────────────────
  const loadHistory = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/chatbox/history/${token}/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages?.length) {
        setMessages(
          data.messages.map((m: { id: string; role: "user" | "assistant"; content: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      } else {
        // Tin nhắn chào mừng
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content:
              "Xin chào! Tôi là **Metro Assistant**, trợ lý thông minh của hệ thống Metro TP.HCM. 🚇\n\nTôi có thể giúp bạn:\n- Thông tin các ga và tuyến Metro\n- Giá vé và cách mua vé\n- Tiện ích quanh ga\n- Kết nối xe buýt\n\nBạn muốn hỏi gì?",
          },
        ]);
      }
    } catch {
      // Không có mạng — hiển thị welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Xin chào! Tôi là **Metro Assistant**. Bạn cần hỗ trợ gì về Metro TP.HCM?",
        },
      ]);
    }
  };

  // ── gửi tin nhắn ─────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || !sessionToken) return;
    if (text.length > MAX_CHARS) return;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: text },
      { id: assistantMsgId, role: "assistant", content: "", isStreaming: true },
    ]);
    setInput("");
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/chatbox/message/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_token: sessionToken }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        // Lỗi HTTP (400, 429, 503, …)
        let errMsg = "Đã xảy ra lỗi. Vui lòng thử lại.";
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch { /* ignore */ }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: errMsg, isStreaming: false, isError: true }
              : m
          )
        );
        setIsLoading(false);
        return;
      }

      // ── đọc SSE stream ─────────────────────────────────────────────────────
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);

          if (dataStr === "[DONE]") {
            // Stream kết thúc
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, isStreaming: false }
                  : m
              )
            );
            break;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: parsed.error, isStreaming: false, isError: true }
                    : m
                )
              );
              break;
            }
            if (parsed.content) {
              accumulatedContent += parsed.content;
              const snapshot = accumulatedContent;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: snapshot }
                    : m
                )
              );
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: "Mất kết nối, vui lòng thử lại.",
                isStreaming: false,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      // Nếu chatbox đóng → tăng unread count
      if (!isOpen) setUnreadCount((c) => c + 1);
    }
  }, [input, isLoading, sessionToken, isOpen]);

  // ── cuộc trò chuyện mới ──────────────────────────────────────────────────────
  const startNewConversation = async () => {
    // Đánh dấu session cũ inactive
    try {
      await fetch(`${API_BASE}/chatbox/history/${sessionToken}/delete/`, { method: "DELETE" });
    } catch { /* ignore */ }

    const newToken = newSessionToken();
    setSessionToken(newToken);
    setHasLoadedHistory(false);
    setMessages([
      {
        id: "welcome-new",
        role: "assistant",
        content: "Cuộc trò chuyện mới đã bắt đầu! Tôi có thể giúp gì cho bạn? 🚇",
      },
    ]);
    setUnreadCount(0);
  };

  // ── keyboard handler ─────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const charsLeft = MAX_CHARS - input.length;

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────────────────── */}
      <button
        id="chatbox-toggle-btn"
        onClick={() => setIsOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #0066CC 0%, #004499 100%)",
          boxShadow: "0 8px 32px rgba(0, 102, 204, 0.4)",
        }}
        aria-label="Mở chatbox Metro Assistant"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}

        {/* Badge số tin chưa đọc */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Chat Window ─────────────────────────────────────────────────────── */}
      <div
        id="chatbox-window"
        className={`fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl transition-all duration-300 ${
          isOpen
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
        style={{
          width: "360px",
          height: "520px",
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.08)",
          transformOrigin: "bottom right",
        }}
        aria-live="polite"
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="flex flex-shrink-0 items-center justify-between px-4 py-3"
          style={{
            background: "linear-gradient(135deg, #0066CC 0%, #004499 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            {/* Avatar icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <span className="text-base">🚇</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Metro Assistant</p>
              <p className="text-xs text-blue-200 leading-tight">Trợ lý Metro TP.HCM</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Nút cuộc trò chuyện mới */}
            <button
              id="chatbox-new-conversation-btn"
              onClick={startNewConversation}
              title="Cuộc trò chuyện mới"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            {/* Nút đóng */}
            <button
              id="chatbox-close-btn"
              onClick={() => setIsOpen(false)}
              title="Đóng"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/20 hover:text-white"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Messages Area ──────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
          style={{ background: "#F8FAFC" }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Bot avatar */}
              {msg.role === "assistant" && (
                <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ background: "#EFF6FF" }}>
                  🚇
                </div>
              )}

              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-tr-sm text-white"
                    : msg.isError
                    ? "rounded-tl-sm border border-red-100 bg-red-50 text-red-700"
                    : "rounded-tl-sm border border-gray-100 bg-white text-gray-800 shadow-sm"
                }`}
                style={
                  msg.role === "user"
                    ? { background: "linear-gradient(135deg, #0066CC 0%, #004499 100%)" }
                    : {}
                }
              >
                {msg.role === "assistant" ? (
                  <>
                    <span
                      dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                    />
                    {/* Cursor nhấp nháy khi đang stream */}
                    {msg.isStreaming && (
                      <span
                        className="ml-0.5 inline-block h-4 w-0.5 align-middle"
                        style={{
                          background: "#0066CC",
                          animation: "blink 1s step-end infinite",
                        }}
                      />
                    )}
                  </>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator - chỉ hiện khi đang stream nhưng content rỗng */}
          {isLoading && messages[messages.length - 1]?.isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="mr-2 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm"
                style={{ background: "#EFF6FF" }}>
                🚇
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="block h-2 w-2 rounded-full bg-blue-400"
                      style={{
                        animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 border-t px-3 py-3"
          style={{ borderColor: "#E5E7EB", background: "#fff" }}
        >
          <div
            className="flex items-end gap-2 rounded-xl border px-3 py-2 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
            style={{ borderColor: "#E5E7EB" }}
          >
            <textarea
              ref={inputRef}
              id="chatbox-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi về Metro TP.HCM..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none border-0 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              style={{ maxHeight: "100px", lineHeight: "1.5" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
              }}
            />
            <div className="flex flex-col items-end gap-1">
              {/* Char counter */}
              <span className={`text-[10px] ${charsLeft < 50 ? "text-red-400" : "text-gray-300"}`}>
                {charsLeft}
              </span>
              {/* Send button */}
              <button
                id="chatbox-send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition disabled:opacity-40"
                style={{ background: "#0066CC" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-gray-300">
            Metro Assistant · metro.hochiminhcity.gov.vn
          </p>
        </div>
      </div>

      {/* ── CSS Animations ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        #chatbox-window ::-webkit-scrollbar {
          width: 4px;
        }
        #chatbox-window ::-webkit-scrollbar-track {
          background: transparent;
        }
        #chatbox-window ::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 2px;
        }
      `}</style>
    </>
  );
}
