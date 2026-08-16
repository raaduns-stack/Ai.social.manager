/**
 * TicketThread.jsx
 * Message thread view for a single support ticket, plus a reply box.
 * Used by: Support Center (ticket detail), WhatsApp conversation view
 * (same shape: from/text/at), and the AI chatbot shell (mock only).
 *
 * Usage:
 *   <TicketThread ticket={ticket} onReply={(text) => ...} />
 */
import { useState } from "react";
import { Send } from "lucide-react";

export default function TicketThread({ ticket, onReply }) {
  const [draft, setDraft] = useState("");

  if (!ticket) return null;

  const handleSend = () => {
    if (!draft.trim()) return;
    onReply?.(draft.trim());
    setDraft("");
  };

  return (
    <div className="flex flex-col rounded-card border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-4 py-3">
        <p className="text-sm font-medium text-[#111827]">{ticket.subject}</p>
        <p className="text-xs text-[#6B7280]">
          {ticket.status} · assigned to {ticket.assignedTo}
        </p>
      </div>

      <div className="flex-1 space-y-3 px-4 py-4 max-h-80 overflow-y-auto">
        {ticket.messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
              m.from === "admin"
                ? "ml-auto bg-[#FF6600] text-white"
                : "bg-[#F9FAFB] text-[#111827]"
            }`}
          >
            <p>{m.text}</p>
            <p
              className={`mt-1 text-xs ${
                m.from === "admin" ? "text-white/80" : "text-[#6B7280]"
              }`}
            >
              {m.at}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-[#E5E7EB] px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a reply..."
          className="flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          className="rounded-lg bg-[#FF6600] p-2 text-white"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
