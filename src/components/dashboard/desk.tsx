import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { EventHtmlRow } from "@/domain/event-html";
import { applyTick, type ChartRange, type LiqRange, type MaKey } from "@/domain";
import { formatMarketClock } from "@/domain/market-clock";
import { COMMUNITY_HUB, MARKET_HUB, sectorOf } from "@/domain/nav";
import { EventHtmlList } from "./event-html-list";
import { HubIndex } from "./hub-index";
import { LabitconfBanner } from "./labitconf-banner";
import { buildModelMarket } from "@/application";
import { getDeskExtras, getEtfFlows, getMarket, getOnchainLive, getPulse, getTick } from "@/infrastructure/server-fns";
import { cn, formatPct, formatUsd } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClarityPanel } from "./clarity-panel";
import { ClientOnly } from "./client-only";
import { FearGreedPanel } from "./fear-greed-panel";
import { LiquidityPanel } from "./liquidity-panel";
import { NewsCycle } from "./news-cycle";
import { OnchainPanel } from "./onchain-panel";
import { OnchainLiveBar } from "./onchain-live";
import { ConcienciaBlock } from "./conciencia";
import { LearnIndex } from "./learn-index";
import { MapGate } from "@/components/map/map-gate";
import { SiteShell } from "@/components/site-header";
import { LazyMount } from "@/components/lazy-mount";
import { useInView } from "@/lib/in-view";
import { DATOS, useAppLang, useT } from "@/lib/i18n";
import { slowNet } from "@/lib/net";
import { legalHref } from "@/lib/locale";
import { scrollDeskTo } from "@/lib/desk-scroll";
import { MaToggles, Segmented, HeatToggle } from "./segmented";

const CommunityPinsBoard = lazy(() => import("./community-pins").then((m) => ({ default: m.CommunityPinsBoard })));
const ExperiencesBoard = lazy(() => import("./experiences").then((m) => ({ default: m.ExperiencesBoard })));
const CommunityFeedPanel = lazy(() => import("./community-feed").then((m) => ({ default: m.CommunityFeedPanel })));
const NetworkEvents = lazy(() => import("./network-events").then((m) => ({ default: m.NetworkEvents })));
const HistoryTimeline = lazy(() => import("./history-timeline").then((m) => ({ default: m.HistoryTimeline })));
const RoadmapWeb3 = lazy(() => import("./roadmap-web3").then((m) => ({ default: m.RoadmapWeb3 })));
const ContactBlock = lazy(() => import("./contact").then((m) => ({ default: m.ContactBlock })));
const SoberaniaBlock = lazy(() => import("./soberania").then((m) => ({ default: m.SoberaniaBlock })));
const EtfFlowPanel = lazy(() => import("./etf-flow").then((m) => ({ default: m.EtfFlowPanel })));
const PriceChart = lazy(() => import("./price-chart").then((m) => ({ default: m.PriceChart })));

function Soft() {
  return <div className="h-24 rounded-lg bg-card shadow-[var(--shadow-border)]" />;
}

const CHART_RANGES: { value: ChartRange; label: string }[] = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1S" },
  { value: "1m", label: "1M" },
  { value: "6m", label: "6M" },
];

const DEFAULT_MA: Record<MaKey, boolean> = {
  ema1d: true,
  ema1w: true,
  ema1m: true,
  ema6m: true,
};

function defaultMa(): Record<MaKey, boolean> {
  if (typeof window !== "undefined" && window.matchMedia("(max-width: 39.99rem)").matches) {
    return { ema1d: true, ema1w: false, ema1m: false, ema6m: false };
  }
  return DEFAULT_MA;
}

function fgLabel(classification: string, t: (k: "fgExtFear" | "fgExtGreed" | "fgFear" | "fgGreed" | "fgNeutral") => string) {
  if (classification === "Extreme Fear") return t("fgExtFear");
  if (classification === "Extreme Greed") return t("fgExtGreed");
  if (classification === "Fear") return t("fgFear");
  if (classification === "Greed") return t("fgGreed");
  return t("fgNeutral");
}

function asLiq(range: ChartRange): LiqRange {
  return range === "6m" ? "1m" : range;
}

export function Desk({ eventHtml = [] }: { eventHtml?: EventHtmlRow[] }) {
  const [range, setRange] = useState<ChartRange>("1w");
  const [ma, setMa] = useState(defaultMa);
  const [heatOn, setHeatOn] = useState(true);
  const liq = asLiq(range);
  const uiLang = useAppLang();
  const t = useT();
  const [allowFetch, setAllowFetch] = useState(false);
  const [liveOk, setLiveOk] = useState(false);
  const hash = useRouterState({ select: (s) => s.location.hash });
  const search = useRouterState({ select: (s) => s.location.searchStr ?? s.location.search });
  const [deskHash, setDeskHash] = useState(() => String(hash || "").replace(/^#/, "") || "mapa");
  useEffect(() => {
    const read = () => setDeskHash(window.location.hash.replace(/^#/, "") || "mapa");
    read();
    window.addEventListener("hashchange", read);
    window.addEventListener("bitacora-desk", read);
    return () => {
      window.removeEventListener("hashchange", read);
      window.removeEventListener("bitacora-desk", read);
    };
  }, []);
  useEffect(() => {
    setDeskHash(String(hash || "").replace(/^#/, "") || "mapa");
  }, [hash]);
  const live = useInView("280px");
  const tab = deskHash;
  const sector = sectorOf(tab);
  const wantLive = live.shown || sector === "mercado" || tab === "red" || tab === "datos";
  useEffect(() => {
    setAllowFetch(true);
    const n = window.setTimeout(() => setLiveOk(true), slowNet() ? 2800 : 400);
    return () => window.clearTimeout(n);
  }, []);
  useEffect(() => {
    const id = deskHash;
    if (!id) return;
    const t = window.setTimeout(() => scrollDeskTo(id), 80);
    return () => window.clearTimeout(t);
  }, [deskHash]);
  useEffect(() => {
    if (sector !== "llegar") return;
    window.dispatchEvent(new Event("resize"));
  }, [sector]);
  useEffect(() => {
    const h = deskHash;
    if (h === "legal" || h === "aviso" || h === "privacidad" || h === "cookies" || h === "accesibilidad" || h === "terminos") {
      window.location.replace(legalHref(h === "legal" ? "" : h, String(search || "")));
    }
  }, [deskHash, search]);

  const fallback = useMemo(() => buildModelMarket(range, liq), [range, liq]);

  const query = useQuery({
    queryKey: ["market", range, liq],
    queryFn: () => getMarket({ data: { range, liq } }),
    enabled: allowFetch && liveOk && wantLive,
    staleTime: 8_000,
    refetchOnMount: false,
    refetchInterval: (q) => (q.state.status === "error" ? 8_000 : 12_000),
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: (prev) => prev,
  });

  const extras = useQuery({
    queryKey: ["extras", range],
    queryFn: () => getDeskExtras({ data: { range } }),
    enabled: allowFetch && liveOk && wantLive,
    staleTime: 20_000,
    refetchOnMount: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: (prev) => prev,
  });

  const pulse = useQuery({
    queryKey: ["pulse", uiLang],
    queryFn: () => getPulse({ data: { lang: uiLang } }),
    enabled: allowFetch && liveOk,
    staleTime: 90_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const tick = useQuery({
    queryKey: ["tick"],
    queryFn: () => getTick(),
    enabled: allowFetch && liveOk && wantLive,
    staleTime: 1_500,
    refetchInterval: () => (slowNet() ? 15_000 : 2_000),
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: (prev) => prev,
  });

  const onchainLive = useQuery({
    queryKey: ["onchain-live"],
    queryFn: () => getOnchainLive(),
    enabled: allowFetch && liveOk && wantLive,
    staleTime: 5_000,
    refetchOnMount: false,
    refetchInterval: () => (slowNet() ? 20_000 : 8_000),
    refetchOnWindowFocus: false,
    retry: 2,
    placeholderData: (prev) => prev,
  });
  const etfFlows = useQuery({
    queryKey: ["etf-flows"],
    queryFn: () => getEtfFlows(),
    enabled: allowFetch && liveOk && wantLive,
    staleTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchInterval: 10 * 60_000,
    retry: 2,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!allowFetch || !liveOk) return;
    if (hash && hash !== "mercado") return;
    void query.refetch();
    void extras.refetch();
    void tick.refetch();
    void onchainLive.refetch();
    void etfFlows.refetch();
  }, [allowFetch, hash, range, liq]);

  const market = useMemo(() => {
    const base = query.data ?? fallback;
    return tick.data ? applyTick(base, tick.data) : base;
  }, [query.data, fallback, tick.data]);
  const fetching = query.isFetching || extras.isFetching;
  const updatedAt = tick.dataUpdatedAt || query.dataUpdatedAt || market.asOf;
  const priceText = formatUsd(market.price, 0);
  const priceSum = market.source === "modelo"
    ? t(updatedAt ? "priceSumModel" : "priceSumModelZone", { price: priceText, when: updatedAt ? formatMarketClock(updatedAt) : "" })
    : t(updatedAt ? "priceSum" : "priceSumZone", { price: priceText, when: updatedAt ? formatMarketClock(updatedAt) : "" });
  const up = (market?.change24h ?? 0) >= 0;

  const dist6m = useMemo(() => {
    if (!market?.emaNow.ema6m || !market.price) return null;
    return ((market.price - market.emaNow.ema6m) / market.emaNow.ema6m) * 100;
  }, [market]);

  const poc = market.poc;
  const fg = extras.data?.fearGreed ?? null;
  const fgUp = (fg?.value ?? 50) >= 50;
  const liqData = extras.data?.liquidity ?? null;

  const priceDelta = useMemo(() => {
    const c = market.candles;
    if (c.length < 2) return null;
    const last = c[c.length - 1]!;
    const from = last.t - (market.lookbackMs || 7 * 86_400_000);
    const first = c.find((x) => x.t >= from) ?? c[0]!;
    if (!first.close) return null;
    return ((last.close - first.close) / first.close) * 100;
  }, [market.candles, market.lookbackMs]);

  const onchainPanel = extras.data?.onchain
    ? { ...extras.data.onchain, ...onchainLive.data }
    : extras.data?.onchain ?? null;
  const showRed = Boolean(liqData || onchainPanel || fg || extras.data?.clarity);

  return (
    <SiteShell fill>
      <div
        className={cn(
          "scroll-free min-h-0 flex-col gap-3 sm:gap-[1.618rem]",
          sector === "llegar" ? "flex flex-1" : "hidden",
        )}
        aria-hidden={sector !== "llegar" || undefined}
        {...(sector !== "llegar" ? { inert: true } : {})}
      >
      <section id="mapa" className="relative shrink-0 scroll-mt-[var(--header-offset)]">
        <ClientOnly fallback={<div className="bit-globe rounded-lg bg-white shadow-[var(--shadow-border)]" />}>
          <MapGate embedded />
        </ClientOnly>
      </section>

      <section id="aprender" className="relative z-10 bg-background pt-2 scroll-mt-[var(--header-offset)] space-y-6">
        <LearnIndex />
        <section id="conciencia" className="scroll-mt-[4.5rem] space-y-4">
          <ConcienciaBlock />
        </section>
        <Suspense fallback={<Soft />}>
          <LazyMount fallback={<Soft />} minHeight="12rem">
            <section id="historia" className="scroll-mt-[4.5rem]">
              <HistoryTimeline />
            </section>
          </LazyMount>
        </Suspense>
        <section id="pulso" className="scroll-mt-[4.5rem]">
          <NewsCycle data={pulse.data ?? extras.data?.pulse ?? null} fetching={pulse.isFetching} />
        </section>
      </section>
      </div>

      <div
        className={cn(
          "scroll-free min-h-0 flex-col gap-3 sm:gap-[1.618rem]",
          sector === "comunidad" ? "flex flex-1" : "hidden",
        )}
        aria-hidden={sector !== "comunidad" || undefined}
        {...(sector !== "comunidad" ? { inert: true } : {})}
      >
      <section id="comunidad" className="scroll-mt-[var(--header-offset)] space-y-6">
        <HubIndex
          kicker="navComunidad"
          items={COMMUNITY_HUB}
          labels={{ anuncios: "hubAds", eventos: "hubEvents", experiencias: "hubExperiences", feed: "hubFeed" }}
          fallbackHash="anuncios"
          parentHash="comunidad"
        />
        <LabitconfBanner />
        <section id="anuncios" className="scroll-mt-[4.5rem]">
        <Suspense fallback={<Soft />}>
          <LazyMount fallback={<Soft />} minHeight="12rem">
            <CommunityPinsBoard />
          </LazyMount>
        </Suspense>
        </section>
        <section id="eventos" className="scroll-mt-[4.5rem]">
        <EventHtmlList rows={eventHtml} />
        <Suspense fallback={<Soft />}>
          <LazyMount fallback={<Soft />} minHeight="28rem">
            <NetworkEvents />
          </LazyMount>
        </Suspense>
        </section>
        <section id="experiencias" className="scroll-mt-[4.5rem]">
        <Suspense fallback={<Soft />}>
          <LazyMount fallback={<Soft />} minHeight="12rem">
            <ExperiencesBoard />
          </LazyMount>
        </Suspense>
        </section>
        <section id="feed" className="scroll-mt-[4.5rem]">
        <Suspense fallback={<Soft />}>
          <LazyMount fallback={<Soft />} minHeight="10rem">
            <CommunityFeedPanel />
          </LazyMount>
        </Suspense>
        </section>
      </section>
      </div>

      <div
        className={cn(
          "scroll-free min-h-0 flex-col gap-3 sm:gap-[1.618rem]",
          sector === "mercado" ? "flex flex-1" : "hidden",
        )}
        aria-hidden={sector !== "mercado" || undefined}
        {...(sector !== "mercado" ? { inert: true } : {})}
      >
      <section id="mercado" ref={live.ref} className="scroll-mt-[var(--header-offset)] space-y-3">
        <HubIndex
          kicker="navMercado"
          items={MARKET_HUB}
          labels={{ mercado: "mercadoTitle", red: "redTitle" }}
          fallbackHash="mercado"
        />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base text-pretty text-muted-foreground">
              {t("mercadoLead")}
            </p>
            <p className="mt-2 text-xs text-pretty text-muted-foreground">{t("marketDisclaimer")}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <Badge>
                {query.isLoading && !query.data
                  ? t("loading")
                  : market.source === "hyperliquid"
                    ? t("srcHl")
                    : market.source === "binance"
                      ? t("srcBn")
                      : market.source === "okx"
                        ? t("srcOkx")
                        : t("srcModel")}
              </Badge>
              {updatedAt ? (
                <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                  {query.isFetching ? t("updating") : `act. ${formatMarketClock(updatedAt)}`}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("refresh")}
              onClick={() => {
                query.refetch();
                extras.refetch();
                tick.refetch();
              }}
            >
              <RefreshCw className={cn("size-4", fetching && "animate-spin")} />
            </Button>
          </div>
        </div>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          label={market.source === "modelo" ? t("srcModel") : t("statPrice")}
          value={formatUsd(market.price, 0)}
          hint={market.source === "modelo" ? t("notQuote") : formatPct(market.change24h)}
          hintClass={market.source === "modelo" ? undefined : up ? "text-long" : "text-short"}
        />
        <Stat
          label={t("statEma")}
          value={market.emaNow.ema6m ? formatUsd(market.emaNow.ema6m, 0) : "—"}
          hint={dist6m != null ? `${formatPct(dist6m)} ${t("vsPrice")}` : ""}
        />
        <Stat
          label={t("statLs")}
          value={`${market.longPct.toFixed(1)}%`}
          hint={`${t("short")} ${market.shortPct.toFixed(1)}%`}
        />
        <Stat
          label={t("statFg")}
          value={fg ? String(fg.value) : "—"}
          hint={fg ? fgLabel(fg.classification, t) : "Alternative.me"}
          hintClass={fg ? (fgUp ? "text-long" : "text-short") : undefined}
        />
        <Stat
          label={t("statLiq")}
          value={liqData ? String(liqData.score) : "—"}
          hint={liqData ? `${liqData.spreadBps.toFixed(2)} ${t("spread")}` : t("okxBook")}
        />
      </section>

      <PocCallout poc={poc} price={market.price} />

      <OnchainLiveBar data={onchainLive.data ?? extras.data?.onchain ?? null} />

      <LongShortBar longPct={market.longPct} shortPct={market.shortPct} />

      <section className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-border)]">
        <div className="flex flex-col gap-1.5 border-b border-border px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-3">
          <Segmented
            ariaLabel={t("chartPeriod")}
            value={range}
            options={CHART_RANGES}
            onChange={setRange}
          />
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-1 sm:justify-end">
            <MaToggles
              enabled={ma}
              onToggle={(key) =>
                setMa((prev) => ({ ...prev, [key]: !prev[key as MaKey] }))
              }
            />
            <HeatToggle on={heatOn} onToggle={() => setHeatOn((v) => !v)} />
          </div>
        </div>
        <div className="bg-plot">
          <LazyMount fallback={<div className="bit-stage bg-plot" />} minHeight="14rem">
            <ClientOnly fallback={<div className="bit-stage bg-plot" />}>
              <Suspense fallback={<div className="bit-stage bg-plot" />}>
                <PriceChart market={market} enabled={ma} heatOn={heatOn} summary={priceSum} />
              </Suspense>
            </ClientOnly>
          </LazyMount>
        </div>
        <p className="border-t border-border px-3 py-2 text-xs text-pretty text-muted-foreground">
          <span className="text-foreground">{priceSum}</span> {t("chartDisclaimer")}
        </p>
      </section>
      <Suspense fallback={null}>
        <EtfFlowPanel data={etfFlows.data ?? null} />
      </Suspense>
      {showRed ? (
      <section id="red" className="scroll-mt-[4.5rem] space-y-3">
        <h3 className="font-display text-xl font-medium tracking-tight text-foreground sm:text-2xl">{t("redTitle")}</h3>
        <LiquidityPanel data={liqData} />
        <div className="grid gap-3 lg:grid-cols-3">
          <OnchainPanel data={onchainPanel} priceDelta={priceDelta} />
          <FearGreedPanel data={fg} />
          <ClarityPanel data={extras.data?.clarity ?? null} />
        </div>
      </section>
      ) : (
        <span id="red" className="sr-only" />
      )}
      </section>

      {query.isError && (
        <p className="text-sm text-short">
          {t("marketFail")}
        </p>
      )}
      </div>

      <div
        className={cn("scroll-free flex min-h-0 flex-1 flex-col gap-[1.618rem]", sector !== "pie" && "hidden")}
        aria-hidden={sector !== "pie" || undefined}
      >
      <Suspense fallback={<Soft />}>
        <RoadmapWeb3 />
      </Suspense>

      <section id="datos" className="scroll-mt-[var(--header-offset)] rounded-lg bg-card px-4 py-3 shadow-[var(--shadow-border)] sm:px-5">
        <details>
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            {t("datosTitle")}
          </summary>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {DATOS[uiLang].map((block) => (
              <p key={block.title}>
                <span className="text-foreground">{block.title}.</span> {block.body}
              </p>
            ))}
          </div>
        </details>
      </section>

      <Suspense fallback={<Soft />}>
        <LazyMount fallback={<Soft />} minHeight="8rem">
          <SoberaniaBlock />
        </LazyMount>
      </Suspense>

      <section id="contacto" className="scroll-mt-[var(--header-offset)]">
        <Suspense fallback={<Soft />}>
          <LazyMount fallback={<Soft />} minHeight="12rem">
            <ContactBlock />
          </LazyMount>
        </Suspense>
      </section>
      </div>
    </SiteShell>
  );
}

function PocCallout({ poc, price }: { poc: number | null; price: number }) {
  const t = useT();
  const ready = poc != null && poc > 0 && price > 0;
  const above = ready ? poc > price : false;
  const dist = ready ? (Math.abs(price - poc) / poc) * 100 : null;
  return (
    <section className="rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-border)] sm:px-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground">POC LIQ</span>
            {t("pocWeekly")}
          </p>
          <p className="mt-1 font-mono text-2xl tabular-nums tracking-tight text-primary sm:text-3xl">
            {ready ? formatUsd(poc, 0) : "—"}
          </p>
        </div>
        {dist != null ? (
          <p className="font-mono text-sm tabular-nums text-muted-foreground">
            {dist.toFixed(1)}% {above ? t("pocAbove") : t("pocBelow")} {t("pocOfPrice")}
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-pretty text-muted-foreground">
        {ready ? t("pocBody") : t("pocWait")}
      </p>
    </section>
  );
}

function LongShortBar({ longPct, shortPct }: { longPct: number; shortPct: number }) {
  const long = Number.isFinite(longPct) ? Math.max(0, longPct) : 50;
  const short = Number.isFinite(shortPct) ? Math.max(0, shortPct) : 50;
  const sum = long + short || 1;
  const lw = (long / sum) * 100;
  const sw = (short / sum) * 100;
  return (
    <div
      className="flex h-11 overflow-hidden rounded-xl"
      role="img"
      aria-label={`Long ${long.toFixed(1)} por ciento, short ${short.toFixed(1)} por ciento`}
    >
      <div
        className="flex min-w-0 items-center justify-between gap-2 bg-long px-3 text-primary-foreground"
        style={{ width: `${lw}%` }}
      >
        {lw >= 20 ? (
          <>
            <span className="text-xs font-medium tracking-wide uppercase">Long</span>
            <span className="font-mono text-sm font-semibold tabular-nums">{long.toFixed(1)}%</span>
          </>
        ) : null}
      </div>
      <div
        className="flex min-w-0 items-center justify-end gap-2 bg-short px-3 text-primary-foreground"
        style={{ width: `${sw}%` }}
      >
        {sw >= 20 ? (
          <>
            <span className="font-mono text-sm font-semibold tabular-nums">{short.toFixed(1)}%</span>
            <span className="text-xs font-medium tracking-wide uppercase">Short</span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  hintClass,
}: {
  label: string;
  value: string;
  hint?: string;
  hintClass?: string;
}) {
  return (
    <div className="rounded-2xl bg-card px-3 py-2 shadow-[var(--shadow-border)] sm:px-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase whitespace-nowrap">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-lg tabular-nums text-foreground sm:text-xl">
        {value}
      </p>
      {hint ? (
        <p className={cn("mt-0.5 font-mono text-sm tabular-nums", hintClass ?? "text-muted-foreground")}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
