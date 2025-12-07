import React from 'react';
import { SlippageResult } from '../types';
import { formatPrice, formatPercentage } from '../utils';

interface SlippageDisplayProps {
  title: string;
  slippage: SlippageResult | null;
  amount: number;
  market: string;
  isSell?: boolean;
}

export const SlippageDisplay: React.FC<SlippageDisplayProps> = ({
  title,
  slippage,
  amount,
  market,
  isSell = false
}) => {
  if (!slippage) {
    return (
      <div className="border-t border-gray-700 pt-4">
        <div className="text-sm text-gray-400 mb-2">{title}</div>
        <div className="text-gray-500">Insufficient liquidity</div>
      </div>
    );
  }

  const isNegativeSlippage = isSell ? slippage.slippage < 0 : slippage.slippage > 0;
  const slippageColorClass = isNegativeSlippage ? 'text-red-400' : 'text-green-400';

  return (
    <div className="border-t border-gray-700 pt-4">
      <div className="text-sm text-gray-400 mb-2">{title}</div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Price</span>
          <span className="font-mono">{formatPrice(slippage.avgPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Slippage</span>
          <span className={`font-mono ${slippageColorClass}`}>
            {formatPercentage(slippage.slippage)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{isSell ? 'Total Value' : 'Total Cost'}</span>
          <span className="font-mono">{formatPrice(slippage.totalCost)}</span>
        </div>
        {slippage.filled < amount && (
          <div className="text-yellow-400 text-xs">
            Partial fill: {slippage.filled.toFixed(4)} {market}
          </div>
        )}
      </div>
    </div>
  );
};

