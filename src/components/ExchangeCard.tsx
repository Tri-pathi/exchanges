import React from 'react';
import { OrderBook, SlippageResult } from '../types';
import { formatPrice, formatSpreadBps } from '../utils';
import { SlippageDisplay } from './SlippageDisplay';

interface ExchangeCardProps {
  name: string;
  book: OrderBook | null;
  isLoading: boolean;
  amount: number;
  market: string;
  buySlippage: SlippageResult | null;
  sellSlippage: SlippageResult | null;
}

export const ExchangeCard: React.FC<ExchangeCardProps> = ({
  name,
  book,
  isLoading,
  amount,
  market,
  buySlippage,
  sellSlippage
}) => {
  const isLive = !isLoading && book;
  const statusBadge = isLive
    ? 'bg-green-900 text-green-300'
    : 'bg-yellow-900 text-yellow-300';
  const statusText = isLive ? 'Live' : 'Loading...';

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        {name}
        <span className={`text-xs px-2 py-1 rounded ${statusBadge}`}>
          {statusText}
        </span>
      </h2>

      {book ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Mid Price</span>
            <span className="text-xl font-mono">{formatPrice(book.midPrice)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Spread</span>
            <span className="font-mono">
              {formatPrice(book.spread)} ({formatSpreadBps(book.spread, book.midPrice)})
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Depth (Bids/Asks)</span>
            <span className="font-mono">{book.bids.length} / {book.asks.length}</span>
          </div>

          <SlippageDisplay
            title={`Buy ${amount} ${market}`}
            slippage={buySlippage}
            amount={amount}
            market={market}
          />

          <SlippageDisplay
            title={`Sell ${amount} ${market}`}
            slippage={sellSlippage}
            amount={amount}
            market={market}
            isSell
          />
        </div>
      ) : (
        <div className="text-gray-500">Waiting for data...</div>
      )}
    </div>
  );
};

