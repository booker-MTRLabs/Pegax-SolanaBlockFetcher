import { GrpcStreamManager } from '../services/GrpcStreamManager';
import { SubscribeRequest, CommitmentLevel } from '@triton-one/yellowstone-grpc';

export async function monitorSlots() {
  const manager = new GrpcStreamManager(process.env.GRPC_ENDPOINT, process.env.GRPC_XTOKEN, handleSlotUpdate);

  const subscribeRequest: SubscribeRequest = {
    slots: {
      slotSubscribe: {},
    },
    accounts: {},
    accountsDataSlice: [],
    blocks: {},
    transactions: {},
    blocksMeta: {},
    entry: {},
    transactionsStatus: {},
    commitment: CommitmentLevel.CONFIRMED,
  };

  console.log('Starting slot monitoring...');
  await manager.connect(subscribeRequest);
}

function handleSlotUpdate(data: any): void {
  if (data?.slot) {
    const slotInfo = data.slot;
    console.log('\n=== Slot Update ===');
    console.log(`Slot: ${slotInfo.slot}`);

    if (slotInfo.parent !== undefined) {
      console.log(`Parent Slot: ${slotInfo.parent}`);
    }

    if (slotInfo.status) {
      console.log('Status:');
      if (slotInfo.status.confirmed !== undefined) {
        console.log(`  Confirmed: ${slotInfo.status.confirmed}`);
      }
      if (slotInfo.status.processed !== undefined) {
        console.log(`  Processed: ${slotInfo.status.processed}`);
      }
      if (slotInfo.status.finalized !== undefined) {
        console.log(`  Finalized: ${slotInfo.status.finalized}`);
      }
    }

    if (slotInfo.timestamp) {
      console.log(`Timestamp: ${new Date(slotInfo.timestamp).toISOString()}`);
    }

    console.log('\n' + '='.repeat(50) + '\n');
  }
}
