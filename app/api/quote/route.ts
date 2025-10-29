import { NextRequest } from "next/server";
import { QuoteResponse, QuoteResponseItem } from "../../types";

const token = process.env.BENZINGA_API_KEY || "";

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function coerceString(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function extractQuoteFromResponse(data: QuoteResponse): QuoteResponseItem[] {
  return Object.entries(data).map(
    ([symbol, quote]): QuoteResponseItem => ({
      symbol: symbol.toUpperCase(),
      companyName: quote.name,
      bid: coerceNumber(quote.bidPrice) || 0,
      ask: coerceNumber(quote.askPrice) || 0,
      last: coerceNumber(quote.lastTradePrice) || 0,
      change: coerceNumber(quote.change) || 0,
      changePercent: coerceNumber(quote.changePercent) || 0,
      open: coerceNumber(quote.open) || 0,
      high: coerceNumber(quote.high) || 0,
      low: coerceNumber(quote.low) || 0,
      previousClosePrice: coerceNumber(quote.previousClosePrice) || 0,
      volume: coerceNumber(quote.volume) || 0,
      fiftyTwoWeekHigh: coerceNumber(quote.fiftyTwoWeekHigh) || 0,
      fiftyTwoWeekLow: coerceNumber(quote.fiftyTwoWeekLow) || 0,
      marketCap: coerceNumber(quote.marketCap) || 0,
      currency: coerceString(
        (quote as unknown as Record<string, unknown>)?.currency,
        "USD"
      ),
    })
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").trim().toUpperCase();
  if (!symbol) {
    return Response.json({ error: "Missing symbol" }, { status: 400 });
  }

  try {
    const url = new URL("https://api.benzinga.com/api/v2/quoteDelayed");
    url.searchParams.set("symbols", symbol);
    url.searchParams.set("token", token);
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!res.ok) {
      return Response.json(
        { error: `Upstream error ${res.status}` },
        { status: 500 }
      );
    }
    const data = (await res.json().catch(() => ({}))) as QuoteResponse;
    const quote = extractQuoteFromResponse(data);
    if (!quote) {
      return Response.json({ error: "Quote not found" }, { status: 404 });
    }
    return Response.json(quote, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
