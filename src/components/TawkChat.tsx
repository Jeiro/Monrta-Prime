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
    // NO crossorigin attribute. It used to be set to "*", which is not a legal
    // value — the only ones are "anonymous" and "use-credentials", and anything
    // else is coerced to "anonymous". That forced the embed into CORS mode, and
    // Tawk does not send Access-Control-Allow-Origin, so the script and every
    // chunk it pulls failed to load. That was the source of the "Loading failed
    // for the <script>", the va.tawk.to CORS blocks, and the cascading
    // websocket failures. A classic script tag loads in no-CORS mode and works.
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
