import React, { useMemo, useState } from "react";
import { useSeo } from "../lib/useSeo";
import { useMarkets } from "../context/domains/MarketsContext";
import { ArrowRight, Bitcoin, LineChart, Search, TrendingDown, TrendingUp } from "lucide-react";
import {
  Button,
  Column,
  DataTable,
  Input,
  SortState,
  Tabs,
} from "../components/ui";
import { formatMoney } from "../lib/format";

interface PublicMarketsProps {
  onNavigate: (view: string, targetAsset?: string) => void;
}

type MarketRow = ReturnType<typeof useMarkets>["marketCrypto"][number];

export const PublicMarkets: React.FC<PublicMarketsProps> = ({ onNavigate }) => {
  useSeo({
    title: "Live Crypto & Stock Markets — Real-Time Prices | Moneta Prime",
    description:
      "Track real-time cryptocurrency and stock prices, 24h changes, and volume on Moneta Prime. Live market data to inform every trade.",
    path: "/markets",
  });
  const { marketCrypto, marketStocks, isLoadingMarkets } = useMarkets();
  const [activeTab, setActiveTab] = useState<"crypto" | "stocks">("crypto");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "volume", ascending: false });

  const rawList = activeTab === "crypto" ? marketCrypto : marketStocks;

  const processedList = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const multiplier = sort.ascending ? 1 : -1;

    const parseVolume = (vol: string) => {
      const parsed = parseFloat(vol);
      if (vol.endsWith("B")) return parsed * 1e9;
      if (vol.endsWith("M")) return parsed * 1e6;
      return parsed;
    };

    return rawList
      .filter(
        (item) =>
          item.symbol.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        if (sort.key === "symbol") return a.symbol.localeCompare(b.symbol) * multiplier;
        if (sort.key === "price") return (a.price - b.price) * multiplier;
        if (sort.key === "change") return (a.change - b.change) * multiplier;
        return (parseVolume(a.volume) - parseVolume(b.volume)) * multiplier;
      });
  }, [rawList, searchQuery, sort]);

  const columns: Column<MarketRow>[] = [
    {
      key: "symbol",
      header: "Asset",
      sortable: true,
      primary: true,
      cell: (a) => <span className="font-data font-semibold text-ink">{a.symbol}</span>,
    },
    { key: "name", header: "Name", cell: (a) => <span className="text-muted">{a.name}</span> },
    {
      key: "price",
      header: "Last price",
      sortable: true,
      numeric: true,
      cell: (a) => formatMoney(a.price),
    },
    {
      key: "change",
      header: "24h",
      sortable: true,
      numeric: true,
      cell: (a) => (
        <span
          className={`inline-flex items-center justify-end gap-1 ${
            a.change >= 0 ? "text-positive" : "text-negative"
          }`}
        >
          {a.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {a.change >= 0 ? "+" : ""}
          {a.change}%
        </span>
      ),
    },
    {
      key: "range",
      header: "24h high / low",
      numeric: true,
      hideOnMobile: true,
      cell: (a) => (
        <span className="text-muted">
          {formatMoney(a.high)} / {formatMoney(a.low)}
        </span>
      ),
    },
    {
      key: "volume",
      header: "Volume",
      sortable: true,
      numeric: true,
      hideOnMobile: true,
      cell: (a) => <span className="text-muted">{a.volume}</span>,
    },
    {
      key: "trend",
      header: "Trend (7d)",
      align: "center",
      hideOnMobile: true,
      cell: (a) => (
        <span className="mx-auto block h-8 w-24">
          <svg className="h-full w-full" viewBox="0 0 100 30" aria-hidden="true">
            <polyline
              fill="none"
              stroke={a.change >= 0 ? "var(--mp-positive)" : "var(--mp-negative)"}
              strokeWidth="1.5"
              points={a.sparkline
                .map((val, idx) => {
                  const min = Math.min(...a.sparkline);
                  const max = Math.max(...a.sparkline);
                  const range = max - min || 1;
                  const x = (idx / (a.sparkline.length - 1)) * 100;
                  const y = 30 - ((val - min) / range) * 23 - 3;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: () => (
        <span className="inline-flex items-center gap-1 text-2xs font-semibold text-accent">
          Trade <ArrowRight size={11} />
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 pb-20">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-end">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            <TrendingUp size={24} className="shrink-0 text-faint" aria-hidden="true" />
            Markets
          </h1>
          <p className="mt-1 text-xs text-muted">
            Real-time prices. Select a pair to open its chart and trade.
          </p>
        </div>

        <Input
          className="md:w-80"
          aria-label="Search assets"
          placeholder="Search assets (e.g. BTC, NVDA)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefix={<Search size={14} />}
        />
      </header>

      {/* Emoji-labelled tabs replaced with icons: an emoji renders as a
          different glyph on every platform and is announced literally
          ("coin emoji") by a screen reader. */}
      <Tabs<"crypto" | "stocks">
        variant="pill"
        layoutGroup="markets"
        aria-label="Market type"
        value={activeTab}
        onChange={(id) => {
          setActiveTab(id);
          setSearchQuery("");
        }}
        items={[
          {
            id: "crypto",
            label: (
              <span className="flex items-center gap-1.5">
                <Bitcoin size={13} /> Crypto
              </span>
            ),
          },
          {
            id: "stocks",
            label: (
              <span className="flex items-center gap-1.5">
                <LineChart size={13} /> Stocks
              </span>
            ),
          },
        ]}
      />

      <DataTable
        caption={`${activeTab === "crypto" ? "Cryptocurrency" : "Equity"} market prices`}
        columns={columns}
        rows={processedList}
        rowKey={(a) => a.symbol}
        loading={isLoadingMarkets}
        sort={sort}
        onSortChange={setSort}
        onRowClick={(a) => onNavigate("dashboard-trading", a.symbol)}
        empty={{
          icon: Search,
          title: "No assets match your search",
          description: "Try a different symbol or name.",
          action: (
            <Button size="sm" variant="secondary" onClick={() => setSearchQuery("")}>
              Clear search
            </Button>
          ),
        }}
      />

      <div className="flex flex-col justify-between gap-4 text-xs text-muted sm:flex-row sm:items-center">
        <p>
          Prices update in real time. Figures are indicative and may differ slightly at execution.
        </p>
        <Button variant="secondary" onClick={() => onNavigate("dashboard-trading")}>
          Open trading terminal
        </Button>
      </div>
    </div>
  );
};
