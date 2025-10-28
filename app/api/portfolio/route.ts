import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import type { Portfolio } from "./types";

const COOKIE_NAME = "bz_portfolio";
const INITIAL_CASH = 100_000;

async function readPortfolioFromCookie(): Promise<Portfolio> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) {
    return { cash: INITIAL_CASH, holdings: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Portfolio;
    if (
      typeof parsed === "object" &&
      parsed &&
      typeof parsed.cash === "number" &&
      Array.isArray(parsed.holdings)
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return { cash: INITIAL_CASH, holdings: [] };
}

async function writePortfolioToCookie(p: Portfolio) {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: JSON.stringify(p),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function GET() {
  const portfolio = await readPortfolioFromCookie();
  return Response.json(portfolio);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body?.action as string;
  if (!action) {
    return Response.json({ error: "Missing action" }, { status: 400 });
  }

  const portfolio = await readPortfolioFromCookie();

  if (action === "reset") {
    const reset: Portfolio = { cash: INITIAL_CASH, holdings: [] };
    await writePortfolioToCookie(reset);
    return Response.json(reset);
  }

  if (action === "buy") {
    const { symbol, companyName, price, quantity } = body || {};
    if (!symbol || !price || !quantity) {
      return Response.json({ error: "Missing buy fields" }, { status: 400 });
    }
    const qty = Number(quantity);
    const px = Number(price);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(px) || px <= 0) {
      return Response.json(
        { error: "Invalid price/quantity" },
        { status: 400 }
      );
    }
    const total = px * qty;
    if (portfolio.cash < total) {
      return Response.json({ error: "Insufficient cash" }, { status: 400 });
    }
    const existing = portfolio.holdings.find(
      (h) => h.symbol.toUpperCase() === String(symbol).toUpperCase()
    );
    if (!existing) {
      portfolio.holdings.push({
        symbol: String(symbol).toUpperCase(),
        companyName: companyName || symbol,
        quantity: qty,
        avgCost: px,
      });
    } else {
      const newQty = existing.quantity + qty;
      const newCost =
        (existing.avgCost * existing.quantity + px * qty) / newQty;
      existing.quantity = newQty;
      existing.avgCost = newCost;
      if (companyName) existing.companyName = companyName;
    }
    portfolio.cash -= total;
    await writePortfolioToCookie(portfolio);
    return Response.json(portfolio);
  }

  if (action === "sell") {
    const { symbol, price, quantity } = body || {};
    if (!symbol || !price || !quantity) {
      return Response.json({ error: "Missing sell fields" }, { status: 400 });
    }
    const qty = Number(quantity);
    const px = Number(price);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(px) || px <= 0) {
      return Response.json(
        { error: "Invalid price/quantity" },
        { status: 400 }
      );
    }
    const idx = portfolio.holdings.findIndex(
      (h) => h.symbol.toUpperCase() === String(symbol).toUpperCase()
    );
    if (idx === -1) {
      return Response.json({ error: "No position to sell" }, { status: 400 });
    }
    const pos = portfolio.holdings[idx];
    if (pos.quantity < qty) {
      return Response.json({ error: "Insufficient shares" }, { status: 400 });
    }
    const proceeds = px * qty;
    pos.quantity -= qty;
    if (pos.quantity === 0) {
      portfolio.holdings.splice(idx, 1);
    }
    portfolio.cash += proceeds;
    await writePortfolioToCookie(portfolio);
    return Response.json(portfolio);
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
