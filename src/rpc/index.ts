import { RpcClient } from './services/RpcClient.ts';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.RPC_ENDPOINT || 'https://api.devnet.solana.com';
const startSlot = 321361273;
const endSlot = 321381277;

const rpcClient = new RpcClient(endpoint);
rpcClient.fetchBlocks(startSlot, endSlot).catch(console.error);