import React from "react";
import { useSiteSettings } from "../context/domains/SiteSettingsContext";

export const MaintenancePage: React.FC = () => {
  const { appSettings } = useSiteSettings();

  return (
    <div className="relative min-h-screen bg-ground text-ink flex items-center justify-center px-6 py-12">
      <div className="relative max-w-3xl w-full rounded-3xl border border-white/10 bg-raised/80 p-10 shadow-[0_30px_90px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="inline-flex items-center justify-center rounded-full bg-accent/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-accent">
          Under Maintenance
        </div>

        <h1 className="mt-8 text-4xl sm:text-5xl font-extrabold tracking-tight text-ink">
          Moneta Prime is temporarily offline for improvements.
        </h1>

        <p className="mt-6 text-base sm:text-lg leading-8 text-muted">
          We're performing scheduled maintenance to make your experience faster and more reliable. We appreciate your patience and will be back shortly.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${appSettings.supportEmail}`}
            className="inline-flex items-center justify-center rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-faint transition hover:bg-warning"
          >
            Contact support
          </a>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/10"
          >
            Refresh page
          </button>
        </div>

        <div className="mt-10 text-sm leading-6 text-faint">
          If maintenance is complete and you still see this page, try refreshing again or contact support.
        </div>
      </div>
    </div>
  );
};



