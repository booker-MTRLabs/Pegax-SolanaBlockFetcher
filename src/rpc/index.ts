import { RpcClient } from './services/RpcClient.ts';
import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node index.js <startSlot> <endSlot>");
  process.exit(1);
}

const startSlot = parseInt(args[0], 10);
const endSlot = parseInt(args[1], 10);

if (isNaN(startSlot) || isNaN(endSlot)) {
  console.error("startSlot and endSlot must be valid numbers");
  process.exit(1);
}

const endpoints = [
  process.env.RPC_ENDPOINT_1 || 'https://api.mainnet-beta.solana.com',
  process.env.RPC_ENDPOINT_2 || 'https://api.mainnet-beta.solana.com',
  process.env.RPC_ENDPOINT_3 || 'https://api.mainnet-beta.solana.com',
];

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