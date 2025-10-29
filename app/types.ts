export type Holding = {
  symbol: string;
  companyName: string;
  quantity: number;
  avgCost: number;
};

export type Transaction = {
  timestamp: string; // ISO
  action: "buy" | "sell";
  symbol: string;
  companyName: string;
  price: number;
  quantity: number;
};

export type Portfolio = {
  cash: number;
  holdings: Holding[];
  transactions: Transaction[];
};

export type Quote = {
  symbol: string;
  exchange: string;
  isoExchange: string;
  bzExchange: string;
  otcMarket: string;
  otcTier: string;
  type: string;
  name: string;
  companyStandardName: string;
  description: string;
  sector: string;
  industry: string;
  open: number;
  high: number;
  low: number;
  close: number;
  bidPrice: number;
  askPrice: number;
  askSize: number;
  bidSize: number;
  size: number;
  bidTime: number;
  askTime: number;
  lastTradePrice: number;
  lastTradeTime: number;
  volume: number;
  change: number;
  changePercent: number;
  previousClosePrice: number;
  previousCloseDate: string;
  closeDate: string;
  fiftyDayAveragePrice: number;
  hundredDayAveragePrice: number;
  twoHundredDayAveragePrice: number;
  averageVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
  sharesOutstanding: number;
  sharesFloat: number;
  pe: number;
  forwardPE: number;
  dividendYield: number;
  dividend: number;
  payoutRatio: number;
  ethPrice: number;
  ethVolume: number;
  ethTime: number;
  currency: string;
  issuerName: string;
  primary: true;
  shortDescription: string;
  issuerShortName: string;
};

export type QuoteResponse = {
  [symbol: string]: Quote;
};

export type QuoteResponseItem = {
  symbol: string;
  companyName: string;
  bid: number;
  ask: number;
  last: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClosePrice: number;
  volume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  marketCap: number;
  currency: string;
};
