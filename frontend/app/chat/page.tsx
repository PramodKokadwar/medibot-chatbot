"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { chat } from "@/lib/api";
import type { Message, UserSession } from "@/lib/types";

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  doctor: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  nurse: { bg: "bg-teal-100", text: "text-teal-800", border: "border-teal-300" },
  billing_executive: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  technician: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  admin: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
};

const ROLE_ICONS: Record<string, string> = {
  doctor: "⚕️",
  nurse: "🏥",
  billing_executive: "📋",
  technician: "🔧",
  admin: "🛡️",
};

const COLLECTION_ICONS: Record<string, string> = {
  general: "📄",
  clinical: "🩺",
  nursing: "💉",
  billing: "💳",
  equipment: "⚙️",
};

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${color.bg} ${color.text} ${color.border}`}
    >
      <span>{ROLE_ICONS[role] ?? "👤"}</span>
      {role.replace("_", " ")}
    </span>
  );
}

function RetrievalBadge({ type }: { type: "hybrid_rag" | "sql_rag" }) {
  if (type === "sql_rag") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        🗄️ SQL RAG
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
      🔍 Hybrid RAG
    </span>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        {/* Answer bubble */}
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm ${
            message.blocked
              ? "bg-amber-50 border border-amber-200 text-amber-900"
              : "bg-white border border-slate-200 text-slate-800"
          }`}
        >
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Retrieval type + sources */}
        {message.retrieval_type && !message.blocked && (
          <div className="px-1 space-y-2">
            <RetrievalBadge type={message.retrieval_type} />

            {message.sources && message.sources.length > 0 && (
              <div className="mt-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Sources</p>
                <div className="space-y-1">
                  {message.sources.map((src, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"
                    >
                      <span className="text-sm mt-0.5">{COLLECTION_ICONS[src.collection] ?? "📄"}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{src.source_document}</p>
                        <p className="text-xs text-slate-500 truncate">{src.section_title}</p>
                        <span className="inline-block text-xs text-slate-400 italic">{src.collection}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blocked indicator */}
        {message.blocked && (
          <div className="px-1">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
              🔒 Access restricted by RBAC
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("medibot_session");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const sess: UserSession = JSON.parse(raw);
    setSession(sess);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hello ${sess.display_name}! I'm MediBot. You're logged in as **${sess.role}** and have access to: ${sess.collections.join(", ")}. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function logout() {
    sessionStorage.removeItem("medibot_session");
    router.replace("/login");
  }

  async function sendMessage() {
    if (!input.trim() || !session || loading) return;
    const question = input.trim();
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chat(question, session.token);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        retrieval_type: res.retrieval_type,
        blocked: res.blocked,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: err instanceof Error ? err.message : "An unexpected error occurred.",
          blocked: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    );
  }

  const roleColor = ROLE_COLORS[session.role] ?? { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        {/* Branding */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              M
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">MediBot</p>
              <p className="text-xs text-slate-400">MediAssist Network</p>
            </div>
          </div>
        </div>

        {/* User identity */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Logged in as</p>
          <p className="text-sm font-semibold text-slate-800 mb-1">{session.display_name}</p>
          <p className="text-xs text-slate-500 mb-2">@{session.username}</p>
          <RoleBadge role={session.role} />
        </div>

        {/* Accessible collections */}
        <div className="px-5 py-4 flex-1 overflow-y-auto">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            Accessible collections
          </p>
          <ul className="space-y-1.5">
            {session.collections.map((col) => (
              <li
                key={col}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}
              >
                <span>{COLLECTION_ICONS[col] ?? "📄"}</span>
                <span className="font-medium">{col}</span>
              </li>
            ))}
          </ul>

          {/* Blocked collections indicator */}
          {session.role !== "admin" && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                Restricted (no access)
              </p>
              {["general", "clinical", "nursing", "billing", "equipment"]
                .filter((c) => !session.collections.includes(c))
                .map((col) => (
                  <div
                    key={col}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-slate-50 text-slate-400 border border-slate-200 mb-1.5"
                  >
                    <span className="opacity-50">{COLLECTION_ICONS[col] ?? "📄"}</span>
                    <span>{col}</span>
                    <span className="ml-auto text-xs">🔒</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="px-5 py-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition text-left"
          >
            ← Sign out
          </button>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-slate-800">Chat with MediBot</h1>
            <p className="text-xs text-slate-500">
              Answers drawn from your authorised document collections
            </p>
          </div>
          <RoleBadge role={session.role} />
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm shadow-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                  <span className="text-xs">MediBot is thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask a question from your accessible collections…"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition flex items-center gap-2"
            >
              Send
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2 text-center">
            MediBot enforces role-based access. Queries outside your permitted collections are blocked automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
