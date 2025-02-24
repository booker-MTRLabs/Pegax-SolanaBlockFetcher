import { RpcClient } from './services/RpcClient.ts';
import { SlotFetcher } from '../rpc-v2/services/SlotFetcher';
import dotenv from 'dotenv';

dotenv.config();

const endpoints = [
  process.env.RPC_ENDPOINT_1 || 'https://api.mainnet-beta.solana.com',
  process.env.RPC_ENDPOINT_2 || 'https://api.mainnet-beta.solana.com',
  process.env.RPC_ENDPOINT_3 || 'https://api.mainnet-beta.solana.com',
  process.env.RPC_ENDPOINT_4 || 'https://api.mainnet-beta.solana.com',
];

const rpcClients = endpoints.map((endpoint) => new RpcClient(endpoint));

const slotStack: number[] = [];
const MAX_SLOTS = 1000;

const handleData = (data: any): void => {
  if (data.slot !== undefined) {
    const latestSlot = Number(data.slot.slot);
    console.log('latest slot:', latestSlot);
    if (!slotStack.includes(latestSlot)) {
      slotStack.push(latestSlot);
      if (slotStack.length > MAX_SLOTS) {
        slotStack.shift();
      }
    }
  }
};

const startSlotFetcher = async () => {
  const slotFetcher = new SlotFetcher(process.env.GRPC_ENDPOINT, process.env.GRPC_XTOKEN, handleData);
  await slotFetcher.start();
};

const fetchBlocks = async () => {
  while (true) {
    let slot: number | undefined;
    if (slotStack.length > 0) {
      slot = slotStack.pop();
    }

    if (slot !== undefined) {
      await Promise.all(rpcClients.map((client) => client.fetchBlock(slot)));
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
};

const startConsumers = (numConsumers: number) => {
  for (let i = 0; i < numConsumers; i++) {
    fetchBlocks().catch(console.error);
  }
};

startSlotFetcher().catch(console.error);
startConsumers(4);