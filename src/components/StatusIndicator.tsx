import React from 'react';
import { getTimeSinceUpdate } from '../utils';

interface StatusIndicatorProps {
  label: string;
  isConnected: boolean;
  lastUpdate: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  label,
  isConnected,
  lastUpdate
}) => {
  const dotColor = isConnected ? 'bg-green-500' : 'bg-yellow-500';

  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs text-gray-400">{getTimeSinceUpdate(lastUpdate)}</span>
      </div>
    </div>
  );
};

