export interface OrderLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  bids: OrderLevel[];
  asks: OrderLevel[];
  spread: number;
  midPrice: number;
  timestamp: number;
}

export interface SlippageResult {
  totalCost: number;
  avgPrice: number;
  slippage: number;
  filled: number;
}

export interface MarketConfig {
  hl: string;
  lighter: number;
}

export interface LoadingState {
  hl: boolean;
  lighter: boolean;
}

export interface LastUpdateState {
  hl: number;
  lighter: number;
}

export interface SpreadHistoryEntry {
  time: string;
  timestamp: number;
  hyperliquidSpread?: number;
  lighterSpread?: number;
}

// Slippage history for a specific amount over time
export interface SlippageHistoryEntry {
  time: string;
  timestamp: number;
  hlBuySlippage?: number;
  hlSellSlippage?: number;
  lighterBuySlippage?: number;
  lighterSellSlippage?: number;
  // Book depth info for context
  hlBidLevels?: number;
  hlAskLevels?: number;
  lighterBidLevels?: number;
  lighterAskLevels?: number;
}

export type Exchange = 'hyperliquid' | 'lighter';
export type TradeSide = 'buy' | 'sell';
