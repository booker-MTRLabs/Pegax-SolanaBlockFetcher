import { RpcClient } from './services/RpcClient.ts';
import dotenv from 'dotenv';

dotenv.config();

const endpoints = [
  process.env.RPC_ENDPOINT_1 || 'https://api.mainnet-beta.solana.com',
  process.env.RPC_ENDPOINT_2 || 'https://api.mainnet-beta.solana.com',
  process.env.RPC_ENDPOINT_3 || 'https://api.mainnet-beta.solana.com',
];
const startSlot = 321361273;
const endSlot = 321381277;

const rpcClients = endpoints.map(endpoint => new RpcClient(endpoint));

const fetchBlocks = async () => {
  const slotRange = endSlot - startSlot + 1;
  const slotsPerClient = Math.ceil(slotRange / rpcClients.length);

  await Promise.all(
    rpcClients.map((client, index) => {
      const clientStartSlot = startSlot + index * slotsPerClient;
      const clientEndSlot = Math.min(clientStartSlot + slotsPerClient - 1, endSlot);
      return client.fetchBlocks(clientStartSlot, clientEndSlot);
    })
  );
};

fetchBlocks().catch(console.error);