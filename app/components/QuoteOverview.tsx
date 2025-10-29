"use client";

import type { QuoteResponseItem } from "@/app/types";

type Props = {
  quote: QuoteResponseItem;
};

export default function QuoteOverview({ quote }: Props) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-6">
      <div className="col-span-2">
        <div className="text-lg font-medium text-black dark:text-white">
          {quote.companyName}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {quote.symbol}
        </div>
      </div>
      <div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">Last</div>
        <div className="text-lg font-semibold">${quote.last.toFixed(2)}</div>
      </div>
      <div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">Change</div>
        <div
          className={`text-lg font-semibold ${
            quote.change >= 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {quote.change.toFixed(2)} ({(quote.changePercent * 100).toFixed(2)}%)
        </div>
      </div>
      <div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">Bid</div>
        <div className="text-lg font-semibold">${quote.bid.toFixed(2)}</div>
      </div>
      <div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">Ask</div>
        <div className="text-lg font-semibold">${quote.ask.toFixed(2)}</div>
      </div>
      <div className="col-span-3 grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">Open</div>
          <div className="font-semibold">${quote.open.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">High</div>
          <div className="font-semibold">${quote.high.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">Low</div>
          <div className="font-semibold">${quote.low.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Prev Close
          </div>
          <div className="font-semibold">
            ${quote.previousClosePrice.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">Volume</div>
          <div className="font-semibold">{quote.volume.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            52W Range
          </div>
          <div className="font-semibold">
            ${quote.fiftyTwoWeekLow.toFixed(2)} - $
            {quote.fiftyTwoWeekHigh.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
