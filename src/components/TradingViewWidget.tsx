import React, { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  symbol: string; // e.g., "BTCUSDT" or "AAPL"
}

export const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({ symbol }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate the correct exchange/symbol path for TradingView
    let formattedSymbol = symbol.replace("/", "");
    if (formattedSymbol === "BTCUSD" || formattedSymbol === "ETHUSD" || formattedSymbol === "SOLUSD" || formattedSymbol === "XRPUSD" || formattedSymbol === "ADAUSD") {
      formattedSymbol = `BINANCE:${formattedSymbol}T`; // Use USDT on Binance for crypto charts
    } else {
      formattedSymbol = `NASDAQ:${formattedSymbol}`; // Default to NASDAQ for tech stocks
    }

    const scriptId = "tradingview-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const createWidget = () => {
      if (containerRef.current && (window as any).TradingView) {
        containerRef.current.innerHTML = ""; // Clear existing widget first
        const widgetContainer = document.createElement("div");
        widgetContainer.id = `tv_chart_${Date.now()}`;
        widgetContainer.style.height = "100%";
        widgetContainer.style.width = "100%";
        containerRef.current.appendChild(widgetContainer);

        new (window as any).TradingView.widget({
          autosize: true,
          symbol: formattedSymbol,
          interval: "H", // 1 Hour candles
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1", // Candlesticks
          locale: "en",
          toolbar_bg: "#0B0E14",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: widgetContainer.id,
          studies: ["RSI@tv-basicstudies", "MASimple@tv-basicstudies"],
          loading_screen: { backgroundColor: "#07090E" },
          // Custom deep Bybit-esque charcoal overlays
          overrides: {
            "paneProperties.background": "#0F131C",
            "paneProperties.vertGridProperties.color": "#1E232F",
            "paneProperties.horzGridProperties.color": "#1E232F",
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": "#8491A5",
          }
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    } else {
      if ((window as any).TradingView) {
        createWidget();
      } else {
        script.onload = createWidget;
      }
    }

    return () => {
      // Cleanup widget container but avoid removing the global script to save network reload costs
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol]);

  return (
    <div className="w-full h-full border border-line rounded-xl overflow-hidden bg-surface relative">
      <div className="absolute top-2 left-3 z-10 hidden md:flex items-center gap-2">
        <span className="text-2xs uppercase font-data tracking-wider bg-ground/85 border border-line px-2 py-0.5 rounded text-accent">
          Live feed active
        </span>
      </div>
      <div id="tv-container" ref={containerRef} className="w-full h-full" style={{ minHeight: "380px" }} />
    </div>
  );
};
