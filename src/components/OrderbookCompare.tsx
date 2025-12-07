import React, { useState } from 'react';
import { useOrderbook } from '../hooks/useOrderbook';
import { calculateSlippage } from '../utils';
import { MARKETS, SYNC_INTERVAL } from '../utils/constants';
import { ExchangeCard, SpreadChart, StatusIndicator, SlippageHistoryChart } from './';

export const OrderbookCompare: React.FC = () => {
  const [amount, setAmount] = useState<number>(10);
  const [selectedMarket, setSelectedMarket] = useState<string>('ETH_SPOT');

  const {
    hyperliquidBook,
    lighterBook,
    spreadHistory,
    slippageHistory,
    isLoading,
    lastUpdate,
    connectionStatus,
    nextSyncIn
  } = useOrderbook(selectedMarket);

  const hlBuySlippage = calculateSlippage(hyperliquidBook, amount, 'buy');
  const hlSellSlippage = calculateSlippage(hyperliquidBook, amount, 'sell');
  const lighterBuySlippage = calculateSlippage(lighterBook, amount, 'buy');
  const lighterSellSlippage = calculateSlippage(lighterBook, amount, 'sell');

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Spot Orderbook Comparison</h1>
          <p className="text-gray-400">Hyperliquid vs Lighter - Updates every {SYNC_INTERVAL / 1000}s</p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Market</label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
            >
              {Object.keys(MARKETS).map((market) => (
                <option key={market} value={market}>
                  {market.replace('_SPOT', '/USDC')}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-gray-400 block mb-1">
              Amount ({selectedMarket.replace('_SPOT', '')})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 w-full"
              step="0.1"
              min="0"
            />
          </div>

          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Next Sync</div>
            <div className="bg-blue-900/50 border border-blue-700 rounded px-4 py-2">
              <span className="text-2xl font-mono text-blue-400">{nextSyncIn}s</span>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <StatusIndicator
              label="Hyperliquid"
              isConnected={connectionStatus.hlConnected}
              lastUpdate={lastUpdate.hl}
            />
            <StatusIndicator
              label="Lighter"
              isConnected={connectionStatus.lighterConnected}
              lastUpdate={lastUpdate.lighter}
            />
          </div>
        </div>

        {/* Exchange Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ExchangeCard
            name="Hyperliquid"
            book={hyperliquidBook}
            isLoading={isLoading.hl}
            amount={amount}
            market={selectedMarket}
            buySlippage={hlBuySlippage}
            sellSlippage={hlSellSlippage}
          />
          <ExchangeCard
            name="Lighter"
            book={lighterBook}
            isLoading={isLoading.lighter}
            amount={amount}
            market={selectedMarket}
            buySlippage={lighterBuySlippage}
            sellSlippage={lighterSellSlippage}
          />
        </div>

        {/* Slippage History Chart */}
        <div className="mb-6">
          <SlippageHistoryChart data={slippageHistory} market={selectedMarket} />
        </div>

        {/* Spread History Chart */}
        <SpreadChart data={spreadHistory} />

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>HL: ~20 price levels (REST) | Lighter: Full aggregated book (WebSocket)</p>
        </div>
      </div>
    </div>
  );
};

export default OrderbookCompare;
