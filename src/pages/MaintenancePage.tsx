import React from "react";
import { useApp } from "../context/AppContext";

export const MaintenancePage: React.FC = () => {
  const { appSettings } = useApp();

  return (
    <div className="relative min-h-screen bg-[#03060d] text-white flex items-center justify-center px-6 py-12">
      <div className="relative max-w-3xl w-full rounded-3xl border border-white/10 bg-slate-950/80 p-10 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="inline-flex items-center justify-center rounded-full bg-[#6AA5FF]/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-accent">
          Under Maintenance
        </div>

        <h1 className="mt-8 text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
          Moneta Prime is temporarily offline for improvements.
        </h1>

        <p className="mt-6 text-base sm:text-lg leading-8 text-slate-300">
          We're performing scheduled maintenance to make your experience faster and more reliable. We appreciate your patience and will be back shortly.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${appSettings.supportEmail}`}
            className="inline-flex items-center justify-center rounded-2xl bg-[#6AA5FF] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#ffb86c]"
          >
            Contact support
          </a>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Refresh page
          </button>
        </div>

        <div className="mt-10 text-sm leading-6 text-slate-500">
          If maintenance is complete and you still see this page, try refreshing again or contact support.
        </div>
      </div>
    </div>
  );
};



