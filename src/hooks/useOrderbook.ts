import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderBook, SpreadHistoryEntry, SlippageHistoryEntry, LoadingState, LastUpdateState } from '../types';
import { fetchHyperliquidOrderbook, LighterWebSocket } from '../api';
import { calculateSlippage } from '../utils';
import { MARKETS, SYNC_INTERVAL } from '../utils/constants';

interface UseOrderbookResult {
  hyperliquidBook: OrderBook | null;
  lighterBook: OrderBook | null;
  spreadHistory: SpreadHistoryEntry[];
  slippageHistory: SlippageHistoryEntry[];
  isLoading: LoadingState;
  lastUpdate: LastUpdateState;
  connectionStatus: {
    hlConnected: boolean;
    lighterConnected: boolean;
  };
  nextSyncIn: number;
}

// Fixed amounts to track slippage over time (in base currency, e.g., ETH)
const TRACKED_AMOUNT = 5;

export function useOrderbook(selectedMarket: string): UseOrderbookResult {
  const [hyperliquidBook, setHyperliquidBook] = useState<OrderBook | null>(null);
  const [lighterBook, setLighterBook] = useState<OrderBook | null>(null);
  const [spreadHistory, setSpreadHistory] = useState<SpreadHistoryEntry[]>([]);
  const [slippageHistory, setSlippageHistory] = useState<SlippageHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState<LoadingState>({ hl: true, lighter: true });
  const [lastUpdate, setLastUpdate] = useState<LastUpdateState>({ hl: 0, lighter: 0 });
  const [connectionStatus, setConnectionStatus] = useState({ hlConnected: false, lighterConnected: false });
  const [nextSyncIn, setNextSyncIn] = useState<number>(SYNC_INTERVAL / 1000);

  const latestHlBook = useRef<OrderBook | null>(null);
  const latestLighterBook = useRef<OrderBook | null>(null);
  const lighterWsRef = useRef<LighterWebSocket | null>(null);

  // Update history with synchronized data
  const updateHistory = useCallback((hlBook: OrderBook | null, ltBook: OrderBook | null) => {
    const now = Date.now();
    const time = new Date(now).toLocaleTimeString();

    // Spread history
    const spreadEntry: SpreadHistoryEntry = { time, timestamp: now };
    if (hlBook && hlBook.midPrice > 0) {
      spreadEntry.hyperliquidSpread = parseFloat((hlBook.spread / hlBook.midPrice * 10000).toFixed(2));
    }
    if (ltBook && ltBook.midPrice > 0) {
      spreadEntry.lighterSpread = parseFloat((ltBook.spread / ltBook.midPrice * 10000).toFixed(2));
    }
    if (spreadEntry.hyperliquidSpread !== undefined || spreadEntry.lighterSpread !== undefined) {
      setSpreadHistory(prev => [...prev, spreadEntry].slice(-14400)); // 8 hours at 2s intervals
    }

    // Slippage history at tracked amount
    const slippageEntry: SlippageHistoryEntry = { time, timestamp: now };
    
    if (hlBook) {
      const hlBuy = calculateSlippage(hlBook, TRACKED_AMOUNT, 'buy');
      const hlSell = calculateSlippage(hlBook, TRACKED_AMOUNT, 'sell');
      if (hlBuy) slippageEntry.hlBuySlippage = parseFloat(hlBuy.slippage.toFixed(4));
      if (hlSell) slippageEntry.hlSellSlippage = parseFloat(hlSell.slippage.toFixed(4));
      slippageEntry.hlBidLevels = hlBook.bids.length;
      slippageEntry.hlAskLevels = hlBook.asks.length;
    }
    
    if (ltBook) {
      const ltBuy = calculateSlippage(ltBook, TRACKED_AMOUNT, 'buy');
      const ltSell = calculateSlippage(ltBook, TRACKED_AMOUNT, 'sell');
      if (ltBuy) slippageEntry.lighterBuySlippage = parseFloat(ltBuy.slippage.toFixed(4));
      if (ltSell) slippageEntry.lighterSellSlippage = parseFloat(ltSell.slippage.toFixed(4));
      slippageEntry.lighterBidLevels = ltBook.bids.length;
      slippageEntry.lighterAskLevels = ltBook.asks.length;
    }

    const hasSlippageData = slippageEntry.hlBuySlippage !== undefined || 
                           slippageEntry.lighterBuySlippage !== undefined;
    if (hasSlippageData) {
      setSlippageHistory(prev => [...prev, slippageEntry].slice(-14400)); // 8 hours at 2s intervals
    }
  }, []);

  const performSyncUpdate = useCallback(async () => {
    const coin = MARKETS[selectedMarket]?.hl;
    
    if (coin) {
      const book = await fetchHyperliquidOrderbook(coin);
      if (book) {
        latestHlBook.current = book;
        setConnectionStatus(prev => ({ ...prev, hlConnected: true }));
      }
    }

    const hlBook = latestHlBook.current;
    const ltBook = latestLighterBook.current;
    const now = Date.now();
    
    if (hlBook) {
      setHyperliquidBook(hlBook);
      setLastUpdate(prev => ({ ...prev, hl: now }));
      setIsLoading(prev => ({ ...prev, hl: false }));
    }
    
    if (ltBook) {
      setLighterBook(ltBook);
      setLastUpdate(prev => ({ ...prev, lighter: now }));
      setIsLoading(prev => ({ ...prev, lighter: false }));
    }

    updateHistory(hlBook, ltBook);
    
    console.log(`[SYNC] HL: ${hlBook?.bids.length}/${hlBook?.asks.length} levels | Lighter: ${ltBook?.bids.length}/${ltBook?.asks.length} levels`);
  }, [selectedMarket, updateHistory]);

  useEffect(() => {
    setIsLoading({ hl: true, lighter: true });
    setSpreadHistory([]);
    setSlippageHistory([]);
    setConnectionStatus({ hlConnected: false, lighterConnected: false });
    latestHlBook.current = null;
    latestLighterBook.current = null;

    performSyncUpdate();
    const syncInterval = setInterval(performSyncUpdate, SYNC_INTERVAL);

    let countdown = SYNC_INTERVAL / 1000;
    setNextSyncIn(countdown);
    const countdownInterval = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) countdown = SYNC_INTERVAL / 1000;
      setNextSyncIn(countdown);
    }, 1000);

    const marketId = MARKETS[selectedMarket]?.lighter;
    lighterWsRef.current?.disconnect();

    if (marketId !== undefined) {
      lighterWsRef.current = new LighterWebSocket(
        marketId,
        (book) => {
          latestLighterBook.current = book;
          setConnectionStatus(prev => ({ ...prev, lighterConnected: true }));
        },
        () => setConnectionStatus(prev => ({ ...prev, lighterConnected: false })),
        () => setConnectionStatus(prev => ({ ...prev, lighterConnected: false }))
      );
      lighterWsRef.current.connect();
    }

    return () => {
      clearInterval(syncInterval);
      clearInterval(countdownInterval);
      lighterWsRef.current?.disconnect();
    };
  }, [selectedMarket, performSyncUpdate]);

  return {
    hyperliquidBook,
    lighterBook,
    spreadHistory,
    slippageHistory,
    isLoading,
    lastUpdate,
    connectionStatus,
    nextSyncIn
  };
}
