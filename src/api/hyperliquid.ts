import { OrderBook, OrderLevel } from '../types';

// Hyperliquid REST API - returns ~20 levels
const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

export async function fetchHyperliquidOrderbook(coin: string): Promise<OrderBook | null> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'l2Book', coin })
    });

    const data = await response.json();

    if (!data.levels) return null;

    const [bids, asks] = data.levels;

    const bidLevels: OrderLevel[] = bids.map((l: { px: string; sz: string }) => ({
      price: parseFloat(l.px),
      size: parseFloat(l.sz)
    }));

    const askLevels: OrderLevel[] = asks.map((l: { px: string; sz: string }) => ({
      price: parseFloat(l.px),
      size: parseFloat(l.sz)
    }));

    const bestBid = bidLevels[0]?.price || 0;
    const bestAsk = askLevels[0]?.price || 0;
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;

    return {
      bids: bidLevels,
      asks: askLevels,
      spread,
      midPrice,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Hyperliquid fetch error:', error);
    return null;
  }
}
