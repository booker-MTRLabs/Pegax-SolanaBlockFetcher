import Client, { SubscribeRequest } from '@triton-one/yellowstone-grpc';
import dotenv from 'dotenv';

dotenv.config();

class GrpcStreamManager {
  private client: Client;
  private stream: any;

  constructor(
    endpoint: string,
    authToken: string,
    private dataHandler: (data: any) => void,
  ) {
    this.client = new Client(endpoint, authToken, {
      'grpc.max_receive_message_length': -1,
      'grpc.max_concurrent_streams': -1,
    });
  }

  async connect(subscribeRequest: SubscribeRequest): Promise<void> {
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

async function monitorData() {
  const manager = new GrpcStreamManager(process.env.GRPC_ENDPOINT, process.env.GRPC_XTOKEN, handleData);

  const subscribeRequest: SubscribeRequest = {
    blocks: {
      blockSubscription: {
        accountInclude: [],
        includeTransactions: true,
      },
    },
    accounts: {},
    accountsDataSlice: [],
    slots: {},
    transactions: {
      // transactionSubscription: {
      //   accountInclude: [],
      //   accountExclude: [],
      //   accountRequired: [],
      //   vote: false,
      //   failed: false,
      // },
    },
    blocksMeta: {},
    entry: {},
    transactionsStatus: {},
  };

  console.log('Starting data monitoring...');
  await manager.connect(subscribeRequest);
}

function handleData(data: any): void {
  console.log('Received data:', data.block.slot);
}

monitorData().catch(console.error);