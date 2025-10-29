"use client";

type Props = {
  symbol: string;
  setSymbol: (s: string) => void;
  loading: boolean;
  onLookup: (e?: React.FormEvent) => void;
  error?: string | null;
};

export default function LookupForm({
  symbol,
  setSymbol,
  loading,
  onLookup,
  error,
}: Props) {
  return (
    <div>
      <form onSubmit={onLookup} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter symbol (e.g., AAPL)"
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-black/20 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {loading ? "Looking up..." : "Lookup"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
