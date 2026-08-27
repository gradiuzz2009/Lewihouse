import React, { useState } from "react";
import { 
  Check, CheckCheck, Clock, AlertCircle, RefreshCw, Trash2, 
  FileText, Lock, Eye 
} from "lucide-react";
import { fmtDateTime } from "../lib/api";

export function formatChatDateHeader(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Hari Ini";
  if (isYesterday) return "Kemarin";

  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ChatMessageBubble({
  message,
  isMe,
  isGrouped,
  onImageClick,
  onRetry,
  onDelete,
}) {
  const [showRetryMenu, setShowRetryMenu] = useState(false);
  const isFailed = message.deliveryStatus === "failed";
  const isPending = message.deliveryStatus === "pending";
  const isNote = message.isInternalNote;
  const isSystem = message.type === "system_event" || message.senderRole === "SYSTEM";

  if (isSystem) {
    return (
      <div className="text-center my-3">
        <span className="inline-block px-3.5 py-1 rounded-full bg-muted/80 text-[10px] text-subtle border border-line font-medium shadow-2xs">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isGrouped ? "mt-0.5" : "mt-2.5"}`}>
      {/* Sender name for non-grouped counter-party */}
      {!isMe && !isGrouped && (
        <span className="text-[10px] font-bold text-subtle px-1 mb-0.5">
          {message.senderName || "Pengirim"}
        </span>
      )}

      <div className={`relative flex items-center gap-1.5 max-w-[84%] sm:max-w-[76%]`}>
        {/* Failed Action Popover / Trigger */}
        {isFailed && (
          <div className="relative">
            <button
              onClick={() => setShowRetryMenu((p) => !p)}
              className="w-6 h-6 rounded-full bg-rose-500 text-white grid place-items-center animate-bounce shadow-xs"
              title="Pesan gagal dikirim. Klik untuk opsi."
            >
              <AlertCircle size={14} />
            </button>

            {showRetryMenu && (
              <div className="absolute bottom-8 right-0 bg-surface rounded-2xl shadow-lifted border border-line p-1.5 z-20 min-w-[130px] space-y-1">
                <button
                  onClick={() => {
                    setShowRetryMenu(false);
                    onRetry && onRetry(message);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-primary hover:bg-muted text-left"
                >
                  <RefreshCw size={13} />
                  <span>Kirim Ulang</span>
                </button>
                <button
                  onClick={() => {
                    setShowRetryMenu(false);
                    onDelete && onDelete(message.id);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-danger hover:bg-rose-50 text-left"
                >
                  <Trash2 size={13} />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Message Bubble Card */}
        <div
          className={`rounded-2xl p-3 text-xs leading-relaxed shadow-xs transition-all ${
            isNote
              ? "w-full bg-amber-50/90 border-2 border-dashed border-amber-300 text-amber-950 rounded-br-xs"
              : isMe
              ? "bg-primary text-white rounded-br-xs"
              : "bg-surface border border-line text-ink rounded-bl-xs"
          } ${isFailed ? "opacity-75 border border-rose-400" : ""}`}
        >
          {/* Internal Note Distinction Banner */}
          {isNote && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 mb-1.5 pb-1 border-b border-amber-200">
              <Lock size={12} className="shrink-0" />
              <span>CATATAN INTERNAL (HANYA STAFF)</span>
            </div>
          )}

          {/* Text Message */}
          {message.text && (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          )}

          {/* Image & File Attachments */}
          {message.attachment && (
            <div className="mt-2">
              {message.attachment.fileType?.startsWith("image/") ? (
                <div
                  onClick={() => onImageClick && onImageClick(message.attachment.fileUrl, message.attachment.fileName)}
                  className="cursor-pointer rounded-xl overflow-hidden border border-black/10 relative group max-h-52 bg-black/5"
                >
                  <img
                    src={message.attachment.fileUrl}
                    alt={message.attachment.fileName || "Lampiran"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                    <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-xs">
                      <Eye size={16} />
                    </span>
                  </div>
                </div>
              ) : (
                <a
                  href={message.attachment.fileUrl}
                  download={message.attachment.fileName || "dokumen.pdf"}
                  className={`flex items-center gap-2 p-2 rounded-xl text-[11px] font-semibold border ${
                    isMe && !isNote
                      ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                      : "bg-muted hover:bg-muted/80 border-line text-primary"
                  } transition-colors`}
                >
                  <FileText size={16} className="shrink-0" />
                  <span className="truncate flex-1">{message.attachment.fileName || "Unduh Dokumen"}</span>
                </a>
              )}
            </div>
          )}

          {/* Timestamp & Acknowledgments (Only shown on un-grouped messages or last message in cluster) */}
          <div className="flex items-center justify-end gap-1 mt-1.5 select-none">
            <span className={`text-[9px] ${isMe && !isNote ? "text-white/70" : "text-subtle"}`}>
              {fmtDateTime(message.created_at || message.timestamp)}
            </span>

            {isMe && !isNote && (
              <span className="inline-flex items-center ml-0.5">
                {isFailed ? (
                  <span className="text-[9px] text-rose-300 font-bold">Gagal</span>
                ) : isPending ? (
                  <Clock size={11} className="text-white/60 animate-spin" />
                ) : message.read || message.deliveryStatus === "read" ? (
                  <CheckCheck size={13} className="text-emerald-300" title="Dibaca" />
                ) : message.deliveryStatus === "delivered" ? (
                  <CheckCheck size={13} className="text-white/70" title="Tersampaikan" />
                ) : (
                  <Check size={12} className="text-white/70" title="Terkirim ke server" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
