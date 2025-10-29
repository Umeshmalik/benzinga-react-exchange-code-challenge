## Benzinga React Exchange Code Challenge

A simple stock portfolio simulator built with Next.js (App Router) that trades using Benzinga's Delayed Quote API. Users start with $100,000 cash, can look up symbols, buy at the current ask, sell at the current bid, and track holdings and transactions. Data persists in an httpOnly cookie.

Documentation reference: [Benzinga APIs Home](https://docs.benzinga.com/home)

## Features

- Inline symbol lookup on the homepage (no redirect)
- Buy at ask and sell at bid with validations (no negative cash, no shorting)
- Portfolio with cash balance and holdings; live value range per holding (bid–ask)
- Dedicated stock page with full quote details and direct trading
- Complete transaction log and per-symbol summary (invested, proceeds, P/L)
- Server API routes for quotes and portfolio; cookie-backed persistence
- Modular UI components in `app/components/`

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS (Next 14/15+ modern setup)
- Server routes under `app/api/*`

## Prerequisites

- Node.js 18+ (recommended)
- pnpm installed (project uses pnpm)
- A Benzinga API key with access to Delayed Quote

## Environment Variables

Create `.env.local` in the project root and add:

```bash
BENZINGA_API_KEY=your_benzinga_api_key
```

## Local Development

```bash
pnpm install
pnpm dev
```

Then open <http://localhost:3000>

## How to Use

1. On the homepage:
   - Enter a symbol (e.g., AAPL) and click Lookup to view bid/ask, last, change, and other details
   - Enter a Quantity and click Buy @ Ask or Sell @ Bid
   - See cash, holdings, and live value ranges; click View to open the stock’s page
2. On the stock page (`/stock/[symbol]`):
   - Trade the focused symbol directly
   - Review a summary of all transactions, purchase prices, and full transaction history

## API Routes (Internal)

- GET `/api/quote?symbol=AAPL` or `/api/quote?symbol=AAPL,MSFT` → returns an array of items with:
  - `symbol`, `companyName`, `bid`, `ask`, `last`, `change`, `changePercent`, `open`, `high`, `low`, `previousClosePrice`, `volume`, `fiftyTwoWeekHigh`, `fiftyTwoWeekLow`, `marketCap`, `currency`
- GET `/api/portfolio` → returns current `cash`, `holdings`, and `transactions`
- POST `/api/portfolio` → body JSON:
  - `{ action: "buy", symbol, companyName, price, quantity }`
  - `{ action: "sell", symbol, price, quantity }`
  - `{ action: "reset" }`

Notes:

- The upstream quote request is proxied server-side and uses the `BENZINGA_API_KEY` via the `token` query param.
- Holdings and transactions are stored in an httpOnly cookie named `bz_portfolio`.

## Project Structure

- `app/page.tsx`: Home (lookup, trade panel, portfolio)
- `app/stock/[symbol]/page.tsx`: Stock detail page (focused trading, summaries)
- `app/components/*`: Reusable UI (lookup form, quote overview, trade panel, cash card, portfolio list, activity section)
- `app/api/quote/route.ts`: Quote proxy (Benzinga Delayed Quote)
- `app/api/portfolio/route.ts`: Portfolio storage and trade logic
- `app/types.ts`: Shared types (`Portfolio`, `Holding`, `Transaction`, `QuoteResponseItem`)

## Scripts

```bash
pnpm dev      # start dev server
pnpm build    # build for production
pnpm start    # start production server (after build)
pnpm lint     # run eslint
```

## Deployment

Any Node host is fine (Vercel recommended). Ensure `BENZINGA_API_KEY` is set in your deployment environment.

## Notes & Constraints

- Infinite size assumption at current bid/ask; no shorting (as required by the challenge)
- Basic error handling for invalid symbols and upstream errors
- API key is only used server-side via internal `/api/quote`
