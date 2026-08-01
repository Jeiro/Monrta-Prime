import React, { useEffect } from "react";
import { useSiteSettings } from "../context/domains/SiteSettingsContext";

declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: Date;
  }
}

const removeTawkScript = () => {
  document.querySelectorAll('script[data-moneta-prime-tawk="true"]').forEach(script => script.remove());
};

export const TawkChat: React.FC = () => {
  const { appSettings } = useSiteSettings();
  const propertyId = appSettings.tawkPropertyId.trim();
  const widgetId = appSettings.tawkWidgetId.trim();

  useEffect(() => {
    if (!propertyId || !widgetId) return;

    window.Tawk_API?.shutdown?.();
    removeTawkScript();

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_API.customStyle = {
      visibility: {
        mobile: {
          position: "br",
          xOffset: "15",
          yOffset: "90"
        }
      }
    };
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    const firstScript = document.getElementsByTagName("script")[0];
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    // Deliberately NO crossorigin attribute.
    //
    // Tawk's published snippet sets crossorigin="*", which is not a legal value
    // (the only ones are "anonymous" and "use-credentials"); anything else is
    // coerced to "anonymous", putting the request in CORS mode. Tawk's embed
    // does not reliably answer a browser CORS request even though curl sees an
    // Access-Control-Allow-Origin header, so that variant fails outright.
    // Setting it explicitly to "anonymous" fails the same way. Omitting it —
    // a plain classic script load — is what actually works in a real browser.
    script.setAttribute("data-moneta-prime-tawk", "true");

    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.body.appendChild(script);
    }

    return () => {
      window.Tawk_API?.shutdown?.();
      removeTawkScript();
    };
  }, [propertyId, widgetId]);

  return null;
};
