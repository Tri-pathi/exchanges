import { OrderBook, OrderLevel } from '../types';

// zkLighter WebSocket - provides full orderbook
// Docs: https://apidocs.lighter.xyz/docs/websocket-reference#order-book
const LIGHTER_WS_URL = 'wss://mainnet.zklighter.elliot.ai/stream';

interface LighterOrderLevel {
  price: string;
  size: string;
}

interface LighterOrderBookData {
  code: number;
  asks: LighterOrderLevel[];
  bids: LighterOrderLevel[];
  offset: number;
  nonce: number;
}

interface LighterMessage {
  type: string;
  channel?: string;
  order_book?: LighterOrderBookData;
}

function parseOrderBook(orderBook: LighterOrderBookData): OrderBook | null {
  if (!orderBook.bids || !orderBook.asks) return null;

  const bidLevels: OrderLevel[] = orderBook.bids.map((l) => ({
    price: parseFloat(l.price),
    size: parseFloat(l.size)
  }));

  const askLevels: OrderLevel[] = orderBook.asks.map((l) => ({
    price: parseFloat(l.price),
    size: parseFloat(l.size)
  }));

  // Sort bids descending, asks ascending
  bidLevels.sort((a, b) => b.price - a.price);
  askLevels.sort((a, b) => a.price - b.price);

  const bestBid = bidLevels[0]?.price || 0;
  const bestAsk = askLevels[0]?.price || 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const midPrice = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : 0;

  if (midPrice <= 0) return null;

  return {
    bids: bidLevels,
    asks: askLevels,
    spread,
    midPrice,
    timestamp: Date.now()
  };
}

export class LighterWebSocket {
  private ws: WebSocket | null = null;
  private marketId: number;
  private onMessage: (book: OrderBook) => void;
  private onError: (error: Event) => void;
  private onClose: () => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    marketId: number,
    onMessage: (book: OrderBook) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
  ) {
    this.marketId = marketId;
    this.onMessage = onMessage;
    this.onError = onError || (() => {});
    this.onClose = onClose || (() => {});
  }

  connect(): void {
    try {
      this.ws = new WebSocket(LIGHTER_WS_URL);

      this.ws.onopen = () => {
        console.log('Lighter WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to full orderbook
        // Per docs: https://apidocs.lighter.xyz/docs/websocket-reference#order-book
        this.ws?.send(JSON.stringify({
          type: 'subscribe',
          channel: `order_book/${this.marketId}`
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data: LighterMessage = JSON.parse(event.data.toString());
          
          // Log all message types to debug
          if (data.type !== 'pong') {
            console.log(`[Lighter WS] Message type: ${data.type}`);
          }
          
          // Handle initial snapshot (subscribed/order_book) and updates (update/order_book)
          if ((data.type === 'subscribed/order_book' || data.type === 'update/order_book') && data.order_book) {
            const rawBids = data.order_book.bids?.length ?? 0;
            const rawAsks = data.order_book.asks?.length ?? 0;
            
            const book = parseOrderBook(data.order_book);
            if (book) {
              // Calculate total volume for context
              const totalBidVol = book.bids.reduce((s, l) => s + l.size, 0);
              const totalAskVol = book.asks.reduce((s, l) => s + l.size, 0);
              
              console.log(`[Lighter WS] Raw: ${rawBids}/${rawAsks} | Parsed: ${book.bids.length}/${book.asks.length} levels | Vol: ${totalBidVol.toFixed(2)}/${totalAskVol.toFixed(2)}`);
              this.onMessage(book);
            }
          }
        } catch (parseError) {
          console.error('Error parsing Lighter WebSocket message:', parseError);
        }
      };

      this.ws.onerror = (error) => {
        console.error('Lighter WebSocket error:', error);
        this.onError(error);
      };

      this.ws.onclose = () => {
        console.log('Lighter WebSocket closed');
        this.onClose();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create Lighter WebSocket:', error);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting Lighter (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
