import { Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import { BlockFetcher } from './BlockFetcher';

dotenv.config();

export class RpcClient {
  private connection: Connection;
  private blockFetcher: BlockFetcher;

  constructor(endpoint: string) {
    this.connection = new Connection(endpoint);
    this.blockFetcher = new BlockFetcher(this.connection);
  }

  async fetchBlock(slot: number): Promise<void> {
    await this.blockFetcher.fetchBlockWithRetry(slot);
  }
}