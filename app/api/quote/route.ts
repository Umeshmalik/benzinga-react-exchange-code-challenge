import { NextRequest } from "next/server";

type QuoteResult = {
  symbol: string;
  companyName: string;
  bid: number;
  ask: number;
};

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function extractQuoteFromUnknown(
  data: unknown,
  symbol: string
): QuoteResult | null {
  // Common shapes we might encounter
  const tryMap = (q: unknown): QuoteResult | null => {
    if (!q || typeof q !== "object") return null;
    const obj = q as Record<string, unknown>;
    const bid =
      coerceNumber(obj.bid) ??
      coerceNumber(obj.bidPrice) ??
      coerceNumber(obj.bid_price) ??
      coerceNumber(obj.bidprice);
    const ask =
      coerceNumber(obj.ask) ??
      coerceNumber(obj.askPrice) ??
      coerceNumber(obj.ask_price) ??
      coerceNumber(obj.askprice);
    const companyName =
      (obj.name as string | undefined) ??
      (obj.companyName as string | undefined) ??
      (obj.company_name as string | undefined) ??
      "";
    const sym = (
      (obj.symbol as string | undefined) ??
      (obj.ticker as string | undefined) ??
      symbol ??
      ""
    )
      .toString()
      .toUpperCase();
    if (typeof bid === "number" && typeof ask === "number" && sym) {
      return {
        symbol: sym,
        companyName: companyName || sym,
        bid,
        ask,
      };
    }
    return null;
  };

  // Array of quotes
  if (Array.isArray(data)) {
    for (const item of data) {
      const mapped = tryMap(item);
      if (mapped && mapped.symbol.toUpperCase() === symbol.toUpperCase()) {
        return mapped;
      }
    }
    // Fallback to first valid
    for (const item of data) {
      const mapped = tryMap(item);
      if (mapped) return mapped;
    }
  }

  // Object keyed by symbol
  if (data && typeof data === "object") {
    const direct = tryMap(data);
    if (direct) return direct;
    const rec = data as Record<string, unknown>;
    const keys = Object.keys(rec);
    for (const key of keys) {
      const mapped = tryMap((rec as Record<string, unknown>)[key]);
      if (mapped) return mapped;
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").trim().toUpperCase();
  if (!symbol) {
    return Response.json({ error: "Missing symbol" }, { status: 400 });
  }

  const token = process.env.BENZINGA_API_KEY || "";

  // Try a couple of likely endpoints; map flexibly to bid/ask
  const candidate: {
    url: string;
    qs: Record<string, string>;
  } = {
    // Delayed Quote - documented to use `token` query param
    url: "https://api.benzinga.com/api/v2/quoteDelayed",
    qs: { symbols: symbol, token },
  };

  try {
    const url = new URL(candidate.url);
    Object.entries(candidate.qs).forEach(([k, v]) =>
      url.searchParams.set(k, v)
    );
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      return Response.json(
        { error: `Upstream error ${res.status}` },
        { status: 500 }
      );
    }
    const data = await res.json().catch(() => ({}));
    const mapped = extractQuoteFromUnknown(data, symbol);
    if (mapped) {
      // If companyName is missing, enrich via Fundamentals
      if (!mapped.companyName || mapped.companyName === mapped.symbol) {
        try {
          const fundamentalsUrl = new URL(
            "https://api.benzinga.com/api/v1/fundamentals"
          );
          fundamentalsUrl.searchParams.set("symbols", symbol);
          fundamentalsUrl.searchParams.set("token", token);
          const fRes = await fetch(fundamentalsUrl.toString(), {
            next: { revalidate: 0 },
          });
          if (fRes.ok) {
            const fData = (await fRes.json()) as unknown;
            let name: string | undefined;
            if (fData && typeof fData === "object") {
              const rec = fData as Record<string, unknown>;
              const bySymbol = (rec[symbol] || rec[symbol.toUpperCase()]) as
                | Record<string, unknown>
                | undefined;
              if (bySymbol && typeof bySymbol === "object") {
                const company = (bySymbol["company"] || bySymbol["Company"]) as
                  | Record<string, unknown>
                  | undefined;
                if (company && typeof company === "object") {
                  name = (company["name"] || company["Name"]) as
                    | string
                    | undefined;
                }
                if (!name) {
                  name = (bySymbol["name"] || bySymbol["Name"]) as
                    | string
                    | undefined;
                }
              }
            }
            if (name) {
              mapped.companyName = name;
            }
          }
        } catch {
          // ignore enrichment errors
        }
      }
      return Response.json(mapped, { status: 200 });
    }
    return Response.json(
      { error: "Quote fields not found in response" },
      { status: 404 }
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
