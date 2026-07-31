import type { AppSettings, SiteContent } from "../types";
import { safeParse } from "./utils";

export const SETTINGS_DOC_PATH = "app_settings/business";
export const SETTINGS_STORAGE_KEY = "orbitrio_app_settings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  companyName: "Moneta Prime",
  supportEmail: "support@PLACEHOLDER-DOMAIN.example",
  supportPhone: "+1 (840) 234-4828",
  companyAddress: "2780 Candlelight Drive, La Porte, TX 77571, USA",
  senderName: "Moneta Prime",
  replyToEmail: "",
  tawkPropertyId: "6a6c68f44f48221d49ac0248",
  tawkWidgetId: "1jurnk07k"
};
export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero_title: "Build wealth with intelligent investing",
  hero_subtitle: "Access institutional-grade strategies and automated portfolio growth designed for modern investors.",
  hero_button: "Get Started",
  dashboard_title: "Your trading dashboard",
  dashboard_description: "Monitor positions, manage investments, and grow your assets with real-time insights.",
  investment_title: "Investment plans",
  investment_description: "Choose the right plan for your goals and start earning reliable returns today.",
  footer_text: "© 2026 Moneta Prime. All rights reserved.",
  announcement_text: "Stay informed with the latest platform updates and market alerts.",
  faq_question_1: "How do I start investing?",
  faq_answer_1: "Sign up, verify your account, and choose a plan to begin funding your portfolio.",
  faq_question_2: "Can I withdraw anytime?",
  faq_answer_2: "Withdrawals are processed according to plan terms, with support available for urgent requests.",
  faq_question_3: "Is my capital secure?",
  faq_answer_3: "We use industry-standard security practices and monitoring to protect your funds and personal data."
};
export const mergeSiteContent = (current: SiteContent, updates: Partial<SiteContent>): SiteContent => ({
  ...current,
  ...updates
});

export const normalizeAppSettings = (settings: Partial<AppSettings> = {}): AppSettings => ({
  companyName: (settings.companyName || DEFAULT_APP_SETTINGS.companyName).trim(),
  supportEmail: (settings.supportEmail || DEFAULT_APP_SETTINGS.supportEmail).trim(),
  supportPhone: (settings.supportPhone || DEFAULT_APP_SETTINGS.supportPhone).trim(),
  companyAddress: (settings.companyAddress || DEFAULT_APP_SETTINGS.companyAddress).trim(),
  senderName: (settings.senderName || DEFAULT_APP_SETTINGS.senderName).trim(),
  replyToEmail: (settings.replyToEmail || "").trim(),
  tawkPropertyId: (settings.tawkPropertyId || DEFAULT_APP_SETTINGS.tawkPropertyId).trim(),
  tawkWidgetId: (settings.tawkWidgetId || DEFAULT_APP_SETTINGS.tawkWidgetId).trim()
});

export const mergeAppSettings = (current: AppSettings, updates: Partial<AppSettings>): AppSettings =>
  normalizeAppSettings({ ...current, ...updates });

export const loadLocalAppSettings = (): AppSettings => {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  return normalizeAppSettings(safeParse<Partial<AppSettings>>(window.localStorage.getItem(SETTINGS_STORAGE_KEY), DEFAULT_APP_SETTINGS));
};

export const saveLocalAppSettings = (settings: AppSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizeAppSettings(settings)));
};
