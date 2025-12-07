import { OrderBook, SlippageResult, TradeSide } from '../types';

export function calculateSlippage(
  book: OrderBook | null,
  amount: number,
  side: TradeSide
): SlippageResult | null {
  if (!book || amount <= 0) return null;

  const levels = side === 'buy' ? book.asks : book.bids;
  let remaining = amount;
  let totalCost = 0;
  let filled = 0;

  for (const level of levels) {
    if (remaining <= 0) break;
    const fillSize = Math.min(remaining, level.size);
    totalCost += fillSize * level.price;
    filled += fillSize;
    remaining -= fillSize;
  }

  if (filled === 0) return null;

  const avgPrice = totalCost / filled;
  const slippage = ((avgPrice - book.midPrice) / book.midPrice) * 100;

  return { totalCost, avgPrice, slippage, filled };
}

export function getMaxFillableAmount(book: OrderBook | null, side: TradeSide): number {
  if (!book) return 0;
  const levels = side === 'buy' ? book.asks : book.bids;
  return levels.reduce((sum, level) => sum + level.size, 0);
}
