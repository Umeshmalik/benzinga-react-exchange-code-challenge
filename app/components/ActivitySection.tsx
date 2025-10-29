"use client";

import type { Holding, Transaction, QuoteResponseItem } from "@/app/types";

type Props = {
  symbol: string;
  transactions: Transaction[];
  holdings: Holding[];
  quote?: QuoteResponseItem | null;
};

export default function ActivitySection({
  symbol,
  transactions,
  holdings,
  quote,
}: Props) {
  const txs = (transactions || []).filter((t) => t.symbol === symbol);
  const buys = txs.filter((t) => t.action === "buy");
  const sells = txs.filter((t) => t.action === "sell");
  const uniqueBuyPrices = Array.from(
    new Set(buys.map((b) => b.price.toFixed(2)))
  );
  const sorted = [...txs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const buyCount = buys.length;
  const sellCount = sells.length;
  const qtyBought = buys.reduce((sum, t) => sum + t.quantity, 0);
  const qtySold = sells.reduce((sum, t) => sum + t.quantity, 0);
  const totalInvested = buys.reduce((sum, t) => sum + t.price * t.quantity, 0);
  const totalProceeds = sells.reduce((sum, t) => sum + t.price * t.quantity, 0);
  const avgBuyPrice = qtyBought ? totalInvested / qtyBought : 0;
  const pos = holdings.find((h) => h.symbol === symbol);
  const positionQty = pos?.quantity || 0;
  const avgCost = pos?.avgCost || 0;
  const bid = quote?.bid || 0;
  const ask = quote?.ask || 0;
  const estValueLow = positionQty * bid;
  const estValueHigh = positionQty * ask;
  const unrealizedLow = positionQty ? estValueLow - positionQty * avgCost : 0;
  const unrealizedHigh = positionQty ? estValueHigh - positionQty * avgCost : 0;

  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black">
      <h3 className="mb-3 text-lg font-semibold text-black dark:text-white">
        Activity
      </h3>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Summary
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Trades
              </div>
              <div className="font-semibold">
                {buyCount} buys / {sellCount} sells
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Shares
              </div>
              <div className="font-semibold">
                {qtyBought} bought / {qtySold} sold (Net {qtyBought - qtySold})
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Avg Buy
              </div>
              <div className="font-semibold">${avgBuyPrice.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Invested
              </div>
              <div className="font-semibold">${totalInvested.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Proceeds
              </div>
              <div className="font-semibold">${totalProceeds.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Position
              </div>
              <div className="font-semibold">
                {positionQty} @ ${avgCost.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Est Value
              </div>
              <div className="font-semibold">
                ${estValueLow.toFixed(2)} - ${estValueHigh.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Unrealized P/L
              </div>
              <div
                className={`font-semibold ${
                  unrealizedHigh >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                ${unrealizedLow.toFixed(2)} - ${unrealizedHigh.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Purchase prices
          </div>
          {uniqueBuyPrices.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {uniqueBuyPrices.map((p) => (
                <span
                  key={p}
                  className="rounded-full border border-black/10 px-2 py-1 text-xs dark:border-white/15"
                >
                  ${p}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              No purchases yet.
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Transactions
          </div>
          {sorted.length === 0 ? (
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              No transactions for this symbol.
            </div>
          ) : (
            <div className="mt-2 divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/15 dark:border-white/15">
              {sorted.map((t, i) => (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-5"
                >
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 sm:col-span-2">
                    {new Date(t.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm font-medium capitalize">
                    {t.action}
                  </div>
                  <div className="text-sm">Qty: {t.quantity}</div>
                  <div className="text-sm">@ ${t.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
