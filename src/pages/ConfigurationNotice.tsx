import React from "react";
import { Cloud } from "lucide-react";

export const ConfigurationNotice: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8DDC9] dark:bg-[#171717] p-6 transition-colors">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-white/70 dark:border-white/10 shadow-[0_24px_60px_rgba(36,33,30,0.08)] animate-rise-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#222222] text-[#D97736] mb-5 shadow-sm">
          <Cloud size={24} />
        </div>

        <h1 className="font-display text-[22px] font-bold text-[#24211E] dark:text-[#F4EBDD]">
          Connect your Supabase Project
        </h1>

        <p className="mt-2 text-[13px] leading-relaxed text-[#777067] dark:text-[#A39B8F]">
          SEMTRACK requires your Supabase Project URL and anon publishable API key in your environment configuration.
        </p>

        <div className="mt-5 rounded-2xl bg-[#171717] p-4 text-[#F4EBDD] font-mono text-[12px] leading-relaxed border border-white/10 shadow-inner">
          <div className="text-[#A39B8F] text-[10px] mb-1 uppercase tracking-wider font-sans">
            Add to your .env file:
          </div>
          <div className="text-emerald-400">VITE_SUPABASE_URL=https://your-project.supabase.co</div>
          <div className="text-[#E99A61]">VITE_SUPABASE_ANON_KEY=your-publishable-key</div>
        </div>

        <p className="mt-4 text-[11px] text-[#777067] dark:text-[#8E867A]">
          Follow the setup guide in <code className="font-mono text-[#D97736]">README.md</code>. Never bundle or expose the Supabase service-role key in this frontend application.
        </p>
      </div>
    </div>
  );
};
