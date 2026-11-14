import React from "react";
import { CheckCircle2, Sparkles, X } from "lucide-react";

interface ToastProps { message: string; onClose: () => void; }

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;
  const celebrate = message.includes("🎉");
  return (
    <aside aria-label="Notification" className="fixed bottom-6 right-6 z-50 flex max-w-[calc(100%-3rem)] sm:max-w-md items-center gap-3 glass-deep rounded-2xl px-5 py-3.5 text-[13px] font-medium shadow-float animate-float-in">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${celebrate ? "bg-gradient-to-br from-[#0E7E4E] to-[#10B96F] text-white shadow-glow-green" : "bg-[#0E7E4E]/10 text-[#0E7E4E]"}`}>
        {celebrate ? <Sparkles size={14} /> : <CheckCircle2 size={14} />}
      </div>
      <div className="flex-1 leading-snug">{message}</div>
      <button onClick={onClose} aria-label="Dismiss" className="btn-float h-7 w-7 flex items-center justify-center rounded-lg text-[#aaa] hover:text-black dark:hover:text-white">
        <X size={13} />
      </button>
    </aside>
  );
};
