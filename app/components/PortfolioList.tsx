"use client";

import Link from "next/link";
import type { Holding, QuoteResponseItem } from "@/app/types";

type Props = {
  holdings: Holding[];
  currentRates: { [symbol: string]: QuoteResponseItem };
};

export default function PortfolioList({ holdings, currentRates }: Props) {
  return (
    <div className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/15 dark:border-white/15">
      {holdings.length === 0 && (
        <div className="p-3 text-sm text-zinc-600 dark:text-zinc-400">
          No holdings yet.
        </div>
      )}
      {holdings.map((h) => (
        <div
          key={h.symbol}
          className="flex items-center justify-between gap-4 p-3 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div className="min-w-0 flex-1">
            <Link
              href={`/stock/${h.symbol}`}
              className="block truncate font-medium text-black underline-offset-2 hover:underline dark:text-white"
              title={h.companyName}
            >
              {h.companyName}
            </Link>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] dark:border-white/15">
                {h.symbol}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-6 text-sm">
            <div className="text-right">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Last
              </div>
              <div className="font-semibold">
                ${(currentRates[h.symbol]?.last || 0).toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Change
              </div>
              <div
                className={`font-semibold ${
                  (currentRates[h.symbol]?.change || 0) >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {(currentRates[h.symbol]?.change || 0).toFixed(2)} (
                {((currentRates[h.symbol]?.changePercent || 0) * 100).toFixed(
                  2
                )}
                %)
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Value
              </div>
              <div className="font-semibold">
                {(() => {
                  const live = currentRates[h.symbol];
                  return live
                    ? `$${(h.quantity * live.bid).toFixed(2)} - $${(
                        h.quantity * live.ask
                      ).toFixed(2)}`
                    : "—";
                })()}
              </div>
            </div>
          </div>
          <Link
            href={`/stock/${h.symbol}`}
            className="shrink-0 rounded-full border border-black/10 px-3 py-1.5 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            View
          </Link>
        </div>
      ))}
    </div>
  );
}
