import Client, { SubscribeRequest, CommitmentLevel } from '@triton-one/yellowstone-grpc';
import dotenv from 'dotenv';

dotenv.config();

export class SlotFetcher {
  private client: Client;
  private stream: any;
  private dataHandler: (data: any) => void;

  constructor(endpoint: string, authToken: string, dataHandler: (data: any) => void) {
    this.client = new Client(endpoint, authToken, {
      'grpc.max_receive_message_length': -1,
      'grpc.max_concurrent_streams': -1,
    });
    this.dataHandler = dataHandler;
  }

  async start(): Promise<void> {
    const subscribeRequest: SubscribeRequest = {
      blocks: {},
      accounts: {},
      accountsDataSlice: [],
      slots: {
        slotsSubscription: {
          filterByCommitment: true,
        },
      },
      transactions: {},
      blocksMeta: {},
      entry: {},
      transactionsStatus: {},
      commitment: CommitmentLevel.CONFIRMED,
    };

    try {
      this.stream = await this.client.subscribe();
      this.stream.on('data', this.dataHandler);
      this.stream.on('error', (error: any) => console.error('Stream error:', error));
      this.stream.on('end', () => console.log('Stream ended'));
      this.stream.on('close', () => console.log('Stream closed'));

      await this.write(subscribeRequest);
    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  private async write(req: SubscribeRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.write(req, (err: any) => (err ? reject(err) : resolve()));
    });
  }
}
