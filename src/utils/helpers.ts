export function getTimeSinceUpdate(timestamp: number): string {
  if (timestamp === 0) return 'Never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  return seconds < 5 ? 'Just now' : `${seconds}s ago`;
}

export function formatPrice(price: number, decimals = 2): string {
  return `$${price.toFixed(decimals)}`;
}

export function formatSpreadBps(spread: number, midPrice: number): string {
  const bps = (spread / midPrice) * 10000;
  return `${bps.toFixed(2)} bps`;
}

export function formatPercentage(value: number, decimals = 4): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

