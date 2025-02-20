import { GrpcStreamManager } from '../services/GrpcStreamManager';
import { SubscribeRequest } from '@triton-one/yellowstone-grpc';

export async function monitorBlocks() {
  const manager = new GrpcStreamManager(process.env.GRPC_ENDPOINT, process.env.GRPC_XTOKEN, handleBlockUpdate);

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
    transactions: {},
    blocksMeta: {},
    entry: {},
    transactionsStatus: {},
  };

  console.log('Starting block monitoring...');
  await manager.connect(subscribeRequest);
}

function handleBlockUpdate(data: any): void {
  if (data?.block) {
    const block = data.block;
    console.log('\n=== Block Details ===');
    console.log(`Slot: ${block.slot}`);
    console.log(`Parent Slot: ${block.parentSlot}`);
    console.log(`Blockhash: ${block.blockhash}`);
    console.log('\n' + '='.repeat(50) + '\n');
  }
}
