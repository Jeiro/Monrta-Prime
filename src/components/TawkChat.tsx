import React, { useEffect } from "react";
import { useApp } from "../context/AppContext";

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
  const { appSettings } = useApp();
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
    script.setAttribute("crossorigin", "*");
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
