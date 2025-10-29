"use client";

type Props = {
  quantity: string;
  onQuantityChange: (value: string) => void;
  onBuy: () => void;
  onSell: () => void;
  canBuy: boolean;
  canSell: boolean;
  busy?: boolean;
  error?: string | null;
};

export default function TradePanel({
  quantity,
  onQuantityChange,
  onBuy,
  onSell,
  canBuy,
  canSell,
  busy,
  error,
}: Props) {
  return (
    <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end">
      <div>
        <label className="block text-xs text-zinc-600 dark:text-zinc-400">
          Quantity
        </label>
        <input
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          inputMode="numeric"
          className="w-32 rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white/20"
        />
      </div>
      <button
        onClick={onBuy}
        disabled={!canBuy || !!busy}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        Buy @ Ask
      </button>
      <button
        onClick={onSell}
        disabled={!canSell || !!busy}
        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
      >
        Sell @ Bid
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
