import { MarketConfig } from '../types';

// Market mappings for SPOT markets
// Hyperliquid: Uses @{index} for spot pairs (from spotMeta universe)
//   - @151 = UETH/USDC (wrapped ETH spot)
// zkLighter: Uses market index
//   - 2048 = ETH/USDC spot
// Sources:
//   - Lighter: https://explorer.elliot.ai/api/markets
//   - Hyperliquid: https://api.hyperliquid.xyz/info (type: spotMeta)
export const MARKETS: Record<string, MarketConfig> = {
  'ETH_SPOT': { hl: '@151', lighter: 2048 },  // UETH/USDC vs ETH/USDC spot
};

// Synchronized update interval (both exchanges update together)
export const SYNC_INTERVAL = 2000; // 30 seconds

// Legacy - kept for reference
export const POLLING_INTERVAL = 2000;
