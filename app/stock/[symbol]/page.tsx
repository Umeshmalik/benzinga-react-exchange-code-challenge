"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Portfolio as PortfolioType, QuoteResponseItem } from "@/app/types";
import QuoteOverview from "@/app/components/QuoteOverview";
import TradePanel from "@/app/components/TradePanel";
import ActivitySection from "@/app/components/ActivitySection";

export default function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const initialSymbol = (symbol || "").toUpperCase();
  const [quote, setQuote] = useState<QuoteResponseItem | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioType | null>(null);
  const [qty, setQty] = useState("0");
  const [busy, setBusy] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  function loadPortfolio() {
    fetch("/api/portfolio", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load portfolio");
        return r.json() as Promise<PortfolioType>;
      })
      .then(setPortfolio)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load portfolio");
      })
      .finally(() => {
        setQty("0");
      });
  }

  function loadQuote() {
    setLoadingQuote(true);
    setError(null);
    fetch(`/api/quote?symbol=${encodeURIComponent(initialSymbol)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data?.error || "Failed to load quote");
        }
        return r.json() as Promise<QuoteResponseItem[]>;
      })
      .then((q: QuoteResponseItem[]) => {
        const quote = q.find((q) => q.symbol === initialSymbol);
        if (!quote) {
          throw new Error("Quote not found");
        }
        setQuote(quote);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Unknown error")
      )
      .finally(() => setLoadingQuote(false));
  }

  useEffect(() => {
    loadPortfolio();
    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSymbol]);

  const canBuy = useMemo(() => {
    if (!portfolio || !quote) return false;
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) return false;
    return portfolio.cash >= n * quote.ask;
  }, [portfolio, quote, qty]);

  const canSell = useMemo(() => {
    if (!portfolio || !quote) return false;
    const pos = portfolio.holdings.find((h) => h.symbol === quote.symbol);
    const n = Number(qty);
    return !!pos && Number.isFinite(n) && n > 0 && pos.quantity >= n;
  }, [portfolio, quote, qty]);

  async function trade(kind: "buy" | "sell") {
    if (!quote) return;
    setBusy(true);
    setTradeError(null);
    try {
      const n = Number(qty);
      if (!Number.isFinite(n) || n <= 0)
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
          quantity: n,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Trade failed");
      }
      const p = (await res.json()) as PortfolioType;
      setPortfolio(p);
      setQty("0");
    } catch (e: unknown) {
      const err = e as Error;
      setTradeError(err?.message || "Trade failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-7xl flex-col gap-8 py-10 px-6 sm:px-10">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            {initialSymbol}
          </h1>
          <Link
            href="/"
            className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Back
          </Link>
        </header>

        <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black">
          {loadingQuote && <div>Loading quote...</div>}
          {error && <div className="text-red-600">{error}</div>}
          {quote && <QuoteOverview quote={quote} />}

          <TradePanel
            quantity={qty}
            onQuantityChange={setQty}
            onBuy={() => trade("buy")}
            onSell={() => trade("sell")}
            canBuy={canBuy && !!quote}
            canSell={canSell && !!quote}
            busy={busy}
            error={tradeError}
          />
        </section>

        {portfolio && (
          <ActivitySection
            symbol={initialSymbol}
            transactions={portfolio.transactions || []}
            holdings={portfolio.holdings}
            quote={quote}
          />
        )}
      </main>
    </div>
  );
}
