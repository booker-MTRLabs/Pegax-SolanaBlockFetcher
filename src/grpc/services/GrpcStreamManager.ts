import Client, { SubscribeRequest } from '@triton-one/yellowstone-grpc';
import * as bs58 from 'bs58';

export class GrpcStreamManager {
  private client: Client;
  private stream: any;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10;
  private readonly reconnectInterval: number = 5000; // 5 seconds
  private readonly dataHandler: (data: any) => void;

  constructor(endpoint: string, authToken: string, dataHandler: (data: any) => void) {
    this.client = new Client(endpoint, authToken, { 'grpc.max_receive_message_length': 64 * 1024 * 1024 });
    this.dataHandler = dataHandler;
  }

  async connect(subscribeRequest: SubscribeRequest): Promise<void> {
    try {
      this.stream = await this.client.subscribe();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      this.stream.on('data', this.handleData.bind(this));
      this.stream.on('error', this.handleError.bind(this));
      this.stream.on('end', () => this.handleDisconnect(subscribeRequest));
      this.stream.on('close', () => this.handleDisconnect(subscribeRequest));

      await this.write(subscribeRequest);
      this.startPing();
    } catch (error) {
      console.error('Connection error:', error);
      await this.reconnect(subscribeRequest);
    }
  }

  private async write(req: SubscribeRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.write(req, (err: any) => (err ? reject(err) : resolve()));
    });
  }

  private async reconnect(subscribeRequest: SubscribeRequest): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);

    setTimeout(
      async () => {
        try {
          await this.connect(subscribeRequest);
        } catch (error) {
          console.error('Reconnection failed:', error);
          await this.reconnect(subscribeRequest);
        }
      },
      this.reconnectInterval * Math.min(this.reconnectAttempts, 5),
    );
  }

  private startPing(): void {
    setInterval(() => {
      if (this.isConnected) {
        this.write({
          ping: { id: 1 },
          accounts: {},
          accountsDataSlice: [],
          transactions: {},
          blocks: {},
          blocksMeta: {},
          entry: {},
          slots: {},
          transactionsStatus: {},
        }).catch(console.error);
      }
    }, 30000);
  }

  private handleData(data: any): void {
    try {
      const processed = this.processBuffers(data);
      this.dataHandler(processed);
    } catch (error) {
      console.error('Error processing data:', error);
    }
  }

  private handleError(error: any): void {
    console.error('Stream error:', error);
    this.isConnected = false;
  }

  private handleDisconnect(subscribeRequest: SubscribeRequest): void {
    console.log('Stream disconnected');
    this.isConnected = false;
    this.reconnect(subscribeRequest);
  }

  private processBuffers(obj: any): any {
    if (!obj) return obj;
    if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
      return bs58.encode(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => this.processBuffers(item));
    }
    if (typeof obj === 'object') {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, this.processBuffers(v)]));
    }
    return obj;
  }
}