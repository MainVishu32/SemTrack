import React from "react";
import { Cloud } from "lucide-react";

export const ConfigurationNotice: React.FC = () => {
  return (
    <div className="facet-canvas min-h-screen flex items-center justify-center p-6">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-8 animate-rise-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16C784]/10 text-[#16C784] mb-5">
          <Cloud size={24} />
        </div>

        <h1 className="font-display text-[22px] font-bold text-[#F5F6F8]">
          Connect your Supabase Project
        </h1>

        <p className="mt-2 text-[13px] leading-relaxed text-[#A0A8B4]">
          SEMTRACK requires your Supabase Project URL and anon publishable API key in your environment configuration.
        </p>

        <div className="mt-5 rounded-2xl bg-[#11151C] p-4 text-[#F5F6F8] font-mono text-[12px] leading-relaxed border border-white/10">
          <div className="text-[#737C89] text-[10px] mb-1 uppercase tracking-wider font-sans">
            Add to your .env file:
          </div>
          <div className="text-[#16C784]">VITE_SUPABASE_URL=https://your-project.supabase.co</div>
          <div className="text-[#A0A8B4]">VITE_SUPABASE_ANON_KEY=your-publishable-key</div>
        </div>

        <p className="mt-4 text-[11px] text-[#A0A8B4]">
          Follow the setup guide in <code className="font-mono text-[#16C784]">README.md</code>. Never bundle or expose the Supabase service-role key in this frontend application.
        </p>
      </div>
    </div>
  );
};
