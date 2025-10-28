export type Holding = {
  symbol: string;
  companyName: string;
  quantity: number;
  avgCost: number;
};

export type Portfolio = {
  cash: number;
  holdings: Holding[];
};
