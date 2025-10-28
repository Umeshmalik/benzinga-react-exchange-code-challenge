"use client";

import { useEffect, useMemo, useState } from "react";

type Quote = {
  symbol: string;
  companyName: string;
  bid: number;
  ask: number;
};

type Holding = {
  symbol: string;
  companyName: string;
  quantity: number;
  avgCost: number;
};

type Portfolio = {
  cash: number;
  holdings: Holding[];
};

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [tradeQty, setTradeQty] = useState<string>("1");
  const [busy, setBusy] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);

  function loadPortfolio() {
    setLoadingPortfolio(true);
    fetch("/api/portfolio", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load portfolio");
        return r.json();
      })
      .then(setPortfolio)
      .catch((e) => setTradeError(e.message))
      .finally(() => setLoadingPortfolio(false));
  }

  useEffect(() => {
    loadPortfolio();
  }, []);

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
      .then((q: Quote) => setQuote(q))
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
      const p = (await res.json()) as Portfolio;
      setPortfolio(p);
      setTradeQty("1");
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
      <main className="flex w-full max-w-3xl flex-col gap-8 py-10 px-6 sm:px-10">
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
          <form onSubmit={onLookup} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter symbol (e.g., AAPL)"
              className="flex-1 rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white/20"
            />
            <button
              type="submit"
              disabled={loadingQuote}
              className="rounded-lg bg-black px-4 py-2 text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
            >
              {loadingQuote ? "Looking up..." : "Lookup"}
            </button>
          </form>
          {quoteError && (
            <p className="mt-2 text-sm text-red-600">{quoteError}</p>
          )}
          {quote && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-4">
              <div className="col-span-2">
                <div className="text-lg font-medium text-black dark:text-white">
                  {quote.companyName}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {quote.symbol}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Bid
                </div>
                <div className="text-lg font-semibold">
                  ${quote.bid.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Ask
                </div>
                <div className="text-lg font-semibold">
                  ${quote.ask.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400">
                Quantity
              </label>
              <input
                value={tradeQty}
                onChange={(e) => setTradeQty(e.target.value)}
                inputMode="numeric"
                className="w-32 rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white/20"
              />
            </div>
            <button
              onClick={() => trade("buy")}
              disabled={!canBuy || busy || !quote}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Buy @ Ask
            </button>
            <button
              onClick={() => trade("sell")}
              disabled={!canSell || busy || !quote}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Sell @ Bid
            </button>
          </div>
          {tradeError && (
            <p className="mt-2 text-sm text-red-600">{tradeError}</p>
          )}
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
              <div className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/15">
                <div className="text-sm text-zinc-600 dark:text-zinc-300">
                  Cash
                </div>
                <div className="font-semibold">
                  $
                  {portfolio.cash.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/15 dark:border-white/15">
                {portfolio.holdings.length === 0 && (
                  <div className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
                    No holdings yet.
                  </div>
                )}
                {portfolio.holdings.map((h) => (
                  <div
                    key={h.symbol}
                    className="grid grid-cols-3 items-center gap-2 p-3 sm:grid-cols-6"
                  >
                    <div className="col-span-2">
                      <div className="font-medium text-black dark:text-white">
                        {h.companyName}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        {h.symbol}
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-zinc-600 dark:text-zinc-400">
                        Qty
                      </div>
                      <div className="font-semibold">{h.quantity}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-zinc-600 dark:text-zinc-400">
                        Avg Cost
                      </div>
                      <div className="font-semibold">
                        ${h.avgCost.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm">
                      <div className="text-zinc-600 dark:text-zinc-400">
                        Market Value (est)
                      </div>
                      <div className="font-semibold">
                        {quote && quote.symbol === h.symbol
                          ? `$${(h.quantity * quote.bid).toFixed(2)} - $${(
                              h.quantity * quote.ask
                            ).toFixed(2)}`
                          : "Lookup symbol to view"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
