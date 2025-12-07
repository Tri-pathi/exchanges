import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps
} from 'recharts';
import { SlippageHistoryEntry, TradeSide } from '../types';

interface SlippageHistoryChartProps {
  data: SlippageHistoryEntry[];
  market: string;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const entry = payload[0]?.payload as SlippageHistoryEntry;
  
  return (
    <div className="bg-gray-900 border border-gray-600 rounded p-3 text-sm">
      <div className="text-gray-400 mb-2">{label}</div>
      {payload.map((p, i) => {
        if (p.value == null) return null;
        const val = p.value as number;
        const isBuy = p.dataKey?.toString().includes('Buy');
        const isHL = p.dataKey?.toString().includes('hl');
        return (
          <div key={i} className="flex gap-2 items-center">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-400">{isHL ? 'HL' : 'LT'} {isBuy ? 'Buy' : 'Sell'}:</span>
            <span className={val > 0 ? 'text-red-400' : 'text-green-400'}>
              {val > 0 ? '+' : ''}{val.toFixed(4)}%
            </span>
          </div>
        );
      })}
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
        <div>HL: {entry?.hlBidLevels ?? '-'}/{entry?.hlAskLevels ?? '-'} levels</div>
        <div>Lighter: {entry?.lighterBidLevels ?? '-'}/{entry?.lighterAskLevels ?? '-'} levels</div>
      </div>
    </div>
  );
};

export const SlippageHistoryChart: React.FC<SlippageHistoryChartProps> = ({ data, market }) => {
  const [side, setSide] = useState<TradeSide>('buy');
  const asset = market.replace('_SPOT', '');

  if (data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-500">
        Collecting slippage data...
      </div>
    );
  }

  const hlKey = side === 'buy' ? 'hlBuySlippage' : 'hlSellSlippage';
  const lighterKey = side === 'buy' ? 'lighterBuySlippage' : 'lighterSellSlippage';

  // Calculate Y-axis domain
  const values = data.flatMap(d => [
    d[hlKey as keyof SlippageHistoryEntry],
    d[lighterKey as keyof SlippageHistoryEntry]
  ].filter((v): v is number => typeof v === 'number'));
  
  const yMin = values.length ? Math.min(...values, 0) : -0.1;
  const yMax = values.length ? Math.max(...values, 0) : 0.1;
  const yPad = Math.max((yMax - yMin) * 0.1, 0.01);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Slippage History — 5 {asset}</h3>
          <p className="text-sm text-gray-400">Last 8 hours</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSide('buy')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              side === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              side === 'sell'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            tickFormatter={v => `${v.toFixed(3)}%`}
            domain={[yMin - yPad, yMax + yPad]}
          />
          <ReferenceLine y={0} stroke="#4B5563" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => {
              if (value === hlKey) return 'Hyperliquid';
              if (value === lighterKey) return 'Lighter';
              return value;
            }}
          />
          <Line
            type="monotone"
            dataKey={hlKey}
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey={lighterKey}
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

