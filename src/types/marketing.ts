export type MarketingChannelId =
  | "organic"
  | "paid_search"
  | "social"
  | "email"
  | "referral";

export type MarketingFunnelStageKey =
  | "visit"
  | "template_selected"
  | "template_modified"
  | "payment";

export interface MarketingChannel {
  id: MarketingChannelId;
  label: string;
  visits: number;
  templateSelections: number;
  templateModifications: number;
  payments: number;
  newCustomers: number;
  revenue: number;
  cost: number;
}

export interface MarketingDailyPoint {
  date: Date;
  visits: number;
  templateSelections: number;
  templateModifications: number;
  payments: number;
  revenue: number;
  cost: number;
}

export interface MarketingTotals {
  visits: number;
  templateSelections: number;
  templateModifications: number;
  payments: number;
  newCustomers: number;
  revenue: number;
  cost: number;
}

export interface MarketingDataset {
  generatedAt: Date;
  seed: number;
  channels: MarketingChannel[];
  daily: MarketingDailyPoint[];
  totals: MarketingTotals;
}
