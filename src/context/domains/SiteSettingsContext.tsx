import React, { createContext, useContext } from "react";
import type { SiteContent, AppSettings } from "../../types";
import { useSiteSettings as useSiteSettingsData } from "../../hooks/data/useSiteSettings";
import { useSession } from "./SessionContext";

// Re-exported for AdminContentTab.tsx, which resets its form to the defaults.
export { DEFAULT_SITE_CONTENT } from "../../services/settingsService";

interface SiteSettingsContextType {
  siteContent: SiteContent;
  updateSiteContent: (newContent: Partial<SiteContent>) => Promise<void>;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

/**
 * Editable marketing copy + platform settings (company name, support inbox,
 * sender identity). Read by a lot of otherwise-inert pages — the footer, the
 * legal pages, the chat widget — which is exactly why it is its own context:
 * none of them should re-render when a market price ticks.
 */
export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useSession();
  const { siteContent, appSettings, updateSiteContent, updateAppSettings } = useSiteSettingsData(supabase);

  return (
    <SiteSettingsContext.Provider value={{ siteContent, updateSiteContent, appSettings, updateAppSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error("useSiteSettings must be used inside a SiteSettingsProvider");
  }
  return context;
};
