"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { QuoteResponseItem, Portfolio as PortfolioType } from "@/app/types";
import LookupForm from "@/app/components/LookupForm";
import QuoteOverview from "@/app/components/QuoteOverview";
import TradePanel from "@/app/components/TradePanel";
import CashCard from "@/app/components/CashCard";
import PortfolioList from "@/app/components/PortfolioList";

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<QuoteResponseItem | null>(null);
  const [currentRates, setCurrentRates] = useState<{
    [symbol: string]: QuoteResponseItem;
  }>({});
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioType | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [tradeQty, setTradeQty] = useState<string>("1");
  const [busy, setBusy] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  const loadSymbolQuote = useCallback(() => {
    setQuoteError(null);
    const sym = portfolio?.holdings.map((h) => h.symbol).join(",");
    if (!sym) {
      setCurrentRates({});
      return;
    }
    fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load quote");
        return r.json() as Promise<QuoteResponseItem[]>;
      })
      .then((q: QuoteResponseItem[]) => {
        if (!q.length) throw new Error("No quotes found");
        setCurrentRates(
          q.reduce((acc: { [symbol: string]: QuoteResponseItem }, it) => {
            acc[it.symbol] = it;
            return acc;
          }, {} as { [symbol: string]: QuoteResponseItem })
        );
      })
      .catch((e: unknown) => {
        setQuoteError(e instanceof Error ? e.message : "Failed to load quotes");
      });
  }, [portfolio?.holdings]);

  const loadPortfolio = useCallback(() => {
    setLoadingPortfolio(true);
    fetch("/api/portfolio", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load portfolio");
        return r.json();
      })
      .then((p: PortfolioType) => {
        setPortfolio(p);
      })
      // loadSymbolQuote will run via the effect when holdings change
      .catch((e: unknown) => {
        setTradeError(
          e instanceof Error ? e.message : "Failed to load portfolio"
        );
      })
      .finally(() => setLoadingPortfolio(false));
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    loadSymbolQuote();
  }, [loadSymbolQuote]);

  function onLookup(e?: React.FormEvent) {
    e?.preventDefault();
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    setQuote(null);
    setQuoteError(null);
    setLoadingQuote(true);
    fetch(`/api/quote?symbol=${encodeURIComponent(sym)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data?.error || "Symbol not found");
        }
        return r.json();
      })
      .then((data: unknown) => {
        const isItem = (v: unknown): v is QuoteResponseItem => {
          if (!v || typeof v !== "object") return false;
          const o = v as Record<string, unknown>;
          return (
            typeof o.symbol === "string" &&
            typeof o.companyName === "string" &&
            (typeof o.bid === "number" || typeof o.bid === "string") &&
            (typeof o.ask === "number" || typeof o.ask === "string")
          );
        };
        if (Array.isArray(data)) {
          const items = data.filter(isItem) as QuoteResponseItem[];
          const item =
            items.find((i) => i.symbol.toUpperCase() === sym) || items[0];
          if (!item) throw new Error("Symbol not found");
          setQuote({
            ...item,
            bid: Number(item.bid) || 0,
            ask: Number(item.ask) || 0,
          });
        } else if (isItem(data)) {
          setQuote({
            ...data,
            symbol: (data.symbol || sym).toUpperCase(),
            bid: Number(data.bid) || 0,
            ask: Number(data.ask) || 0,
          });
        } else {
          throw new Error("Unexpected quote format");
        }
      })
      .catch((e) => setQuoteError(e.message))
      .finally(() => setLoadingQuote(false));
  }

  const canBuy = useMemo(() => {
    if (!portfolio || !quote) return false;
    const qty = Number(tradeQty);
    if (!Number.isFinite(qty) || qty <= 0) return false;
    return portfolio.cash >= qty * quote.ask;
  }, [portfolio, quote, tradeQty]);

  const canSell = useMemo(() => {
    if (!portfolio || !quote) return false;
    const pos = portfolio.holdings.find((h) => h.symbol === quote.symbol);
    const qty = Number(tradeQty);
    return !!pos && Number.isFinite(qty) && qty > 0 && pos.quantity >= qty;
  }, [portfolio, quote, tradeQty]);

  async function trade(kind: "buy" | "sell") {
    if (!quote) return;
    setBusy(true);
    setTradeError(null);
    try {
      const qty = Number(tradeQty);
      if (!Number.isFinite(qty) || qty <= 0)
        throw new Error("Enter a valid quantity");
      const price = kind === "buy" ? quote.ask : quote.bid;
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: kind,
          symbol: quote.symbol,
          companyName: quote.companyName,
          price,
          quantity: qty,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Trade failed");
      }
      const p = (await res.json()) as PortfolioType;
      setPortfolio(p);
      setTradeQty("0");
    } catch (e: unknown) {
      const error = e as Error;
      setTradeError(error?.message || "Trade failed");
    } finally {
      setBusy(false);
    }
  }

  function resetPortfolio() {
    setBusy(true);
    fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Reset failed");
        return r.json();
      })
      .then(setPortfolio)
      .catch((e) => setTradeError(e.message))
      .finally(() => setBusy(false));
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-7xl flex-col gap-8 py-10 px-6 sm:px-10">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Benzinga Portfolio Simulator
          </h1>
          <button
            onClick={resetPortfolio}
            disabled={busy}
            className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Reset
          </button>
        </header>

        <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black">
          <LookupForm
            symbol={symbol}
            setSymbol={setSymbol}
            loading={loadingQuote}
            onLookup={onLookup}
            error={quoteError}
          />
          {quote && <QuoteOverview quote={quote} />}
          <TradePanel
            quantity={tradeQty}
            onQuantityChange={setTradeQty}
            onBuy={() => trade("buy")}
            onSell={() => trade("sell")}
            canBuy={canBuy && !!quote}
            canSell={canSell && !!quote}
            busy={busy}
            error={tradeError}
          />
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Portfolio
            </h2>
            {loadingPortfolio && (
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Loading...
              </span>
            )}
          </div>
          {portfolio && (
            <div className="space-y-3">
              <CashCard cash={portfolio.cash} />
              <PortfolioList
                holdings={portfolio.holdings}
                currentRates={currentRates}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
