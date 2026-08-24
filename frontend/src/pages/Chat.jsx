import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, fmtDateTime } from "../lib/api";
import { MessageCircle, Send, ArrowLeft, User, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

const WS_BASE = (process.env.REACT_APP_BACKEND_URL || "").replace(/^http/, "ws");

function ThreadList({ threads, selected, onSelect, search, setSearch }) {
  const filtered = threads.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 py-3 border-b border-line">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
          <input
            type="text"
            placeholder="Cari penghuni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-muted rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-subtle" />
            </button>
          )}
        </div>
      </div>

      {/* Threads */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-subtle text-sm">
            <MessageCircle size={40} className="mx-auto mb-3 text-line" />
            <p>Belum ada penghuni aktif</p>
          </div>
        ) : (
          filtered.map((t) => (
            <motion.button
              key={t.tenant_id}
              onClick={() => onSelect(t)}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-line/50 text-left transition-colors ${
                selected?.tenant_id === t.tenant_id
                  ? "bg-primary/5 border-l-2 border-l-primary"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="relative flex-shrink-0">
                {t.avatar_url ? (
                  <img src={t.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/10 grid place-items-center">
                    <User size={18} className="text-primary" />
                  </div>
                )}
                {t.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold grid place-items-center">
                    {t.unread > 9 ? "9+" : t.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="font-semibold text-sm text-ink truncate">{t.name}</p>
                  {t.last_at && (
                    <span className="text-[10px] text-subtle flex-shrink-0 ml-2">
                      {fmtDateTime(t.last_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-subtle truncate mt-0.5">
                  {t.last_message || "Belum ada pesan"}
                </p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}

function MessageView({ thread, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const wsRef = useRef(null);
  const inputRef = useRef(null);
  const { user } = useAuth();

  const scrollDown = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // Load messages and connect WS
  useEffect(() => {
    if (!thread) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get(`/chat/${thread.tenant_id}/messages`);
        if (!cancelled) {
          setMessages(data);
          setLoading(false);
          scrollDown();
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    // WebSocket
    const token = localStorage.getItem("lh_token");
    if (token && WS_BASE) {
      try {
        const ws = new WebSocket(`${WS_BASE}/ws/chat/${thread.tenant_id}?token=${token}`);
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollDown();
          } catch {}
        };
        ws.onclose = () => {};
        wsRef.current = ws;
      } catch {}
    }

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [thread, scrollDown]);

  const send = async () => {
    const msg = text.trim();
    if (!msg) return;
    setText("");

    // Try WebSocket first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: msg }));
    } else {
      // Fallback to REST
      try {
        const { data } = await api.post(`/chat/${thread.tenant_id}/messages`, { text: msg });
        setMessages((prev) => [...prev, data]);
        scrollDown();
      } catch {
        toast.error("Gagal mengirim pesan");
      }
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!thread) {
    return (
      <div className="h-full grid place-items-center text-center p-8">
        <div>
          <MessageCircle size={48} className="mx-auto mb-4 text-line" />
          <p className="text-subtle text-sm">Pilih percakapan untuk mulai chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="lg:hidden p-1 -ml-1">
          <ArrowLeft size={20} className="text-primary" />
        </button>
        {thread.avatar_url ? (
          <img src={thread.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center">
            <User size={16} className="text-primary" />
          </div>
        )}
        <div>
          <p className="font-semibold text-sm text-ink">{thread.name}</p>
          <p className="text-[11px] text-subtle">Kamar {thread.room_name || "-"}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/30">
        {loading ? (
          <div className="text-center text-subtle text-sm py-12 animate-pulse">Memuat pesan...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-subtle text-sm py-12">
            <MessageCircle size={32} className="mx-auto mb-2 text-line" />
            Belum ada pesan
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const isAdmin = m.sender === "admin";
              return (
                <motion.div
                  key={m.id || m.created_at}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isAdmin
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-white text-ink border border-line/60 rounded-bl-md"
                    }`}
                  >
                    {!isAdmin && (
                      <p className="text-[10px] font-semibold text-secondary mb-1">{m.sender_name}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p
                      className={`text-[10px] mt-1.5 ${
                        isAdmin ? "text-white/60" : "text-subtle"
                      } text-right`}
                    >
                      {fmtDateTime(m.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-line bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan..."
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 max-h-24"
            style={{ minHeight: "42px" }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={send}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full bg-primary text-white grid place-items-center disabled:opacity-40 flex-shrink-0"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/chat/threads");
        setThreads(data);
      } catch {
        toast.error("Gagal memuat chat");
      } finally {
        setLoading(false);
      }
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen bg-bg" data-testid="chat-page">
      {/* Mobile: show either threads or message view */}
      <div className="lg:hidden">
        {!selected ? (
          <>
            <PageHeader title="Chat Penghuni" subtitle={`${threads.length} percakapan`} />
            <div className="h-[calc(100vh-180px)]">
              {loading ? (
                <div className="py-16 text-center text-subtle animate-pulse">Memuat...</div>
              ) : (
                <ThreadList
                  threads={threads}
                  selected={selected}
                  onSelect={setSelected}
                  search={search}
                  setSearch={setSearch}
                />
              )}
            </div>
          </>
        ) : (
          <div className="h-[calc(100vh-80px)]">
            <MessageView thread={selected} onBack={() => setSelected(null)} />
          </div>
        )}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:flex h-screen">
        <div className="w-[340px] border-r border-line bg-white flex flex-col">
          <div className="px-4 py-4 border-b border-line">
            <h2 className="font-serif text-lg text-primary">Chat Penghuni</h2>
            <p className="text-xs text-subtle">{threads.length} percakapan</p>
          </div>
          <ThreadList
            threads={threads}
            selected={selected}
            onSelect={setSelected}
            search={search}
            setSearch={setSearch}
          />
        </div>
        <div className="flex-1 bg-bg">
          <MessageView thread={selected} onBack={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}
