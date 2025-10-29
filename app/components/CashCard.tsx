"use client";

type Props = { cash: number };

export default function CashCard({ cash }: Props) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/15">
      <div className="text-sm text-zinc-600 dark:text-zinc-300">Cash</div>
      <div className="font-semibold">
        $
        {cash.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
    </div>
  );
}
