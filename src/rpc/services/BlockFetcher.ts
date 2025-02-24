import { Connection, PublicKey, GetVersionedBlockConfig } from '@solana/web3.js';
import { promises as fs } from 'fs';
import path from 'path';
import { FileCompressor } from './FileCompressor';

const MAX_PROCESSES = 5;
const MAX_RETRY_ATTEMPTS = 3;
const BLOCKS_PER_FOLDER = 10000;
const VOTE_PUBKEY = new PublicKey('Vote111111111111111111111111111111111111111');

export class BlockFetcher {
  private connection: Connection;
  private fileCompressor: FileCompressor;

  constructor(connection: Connection) {
    this.connection = connection;
    this.fileCompressor = new FileCompressor();
  }

  async fetchAndPrintBlocks(startSlot: number, endSlot: number): Promise<void> {
    const slots = Array.from({ length: endSlot - startSlot + 1 }, (_, i) => startSlot + i);

    for (let i = 0; i < slots.length; i += MAX_PROCESSES) {
      const chunk = slots.slice(i, i + MAX_PROCESSES);
      await Promise.all(chunk.map((slot) => this.fetchBlockWithRetry(slot)));
    }
  }

  public async fetchBlockWithRetry(slot: number, attempt = 1): Promise<void> {
    try {
      const config: GetVersionedBlockConfig = {
        maxSupportedTransactionVersion: 0,
        rewards: false,
        transactionDetails: 'accounts',
        commitment: 'confirmed',
      };
      const block = await this.connection.getParsedBlock(slot, config);
      if (block) {
        const filteredTransactions = block.transactions.filter((transactionParsed) => {
          if (transactionParsed.meta.err != null) {
            return false;
          }
          return !transactionParsed.transaction.accountKeys.some((accountKey) => accountKey.pubkey.equals(VOTE_PUBKEY));
        });

        const blockInfo = {
          block_time: block.blockTime,
          slot_number: slot,
          transactions: filteredTransactions,
        };

        const blockNumber = block.blockHeight;
        const folderNumber = Math.floor(blockNumber / BLOCKS_PER_FOLDER) * BLOCKS_PER_FOLDER;
        const folderPath = path.join(__dirname, '../../block_json', folderNumber.toString());
        const filePath = path.join(folderPath, `${blockNumber}.json`);

        await fs.mkdir(folderPath, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(blockInfo));

        console.log(`Block ${blockNumber} saved to ${filePath}`);

        await this.fileCompressor.compressFile(filePath);
      } else {
        console.log(`Block ${slot} not found.`);
      }
    } catch (error) {
      console.error(`Error fetching block ${slot} (attempt ${attempt}):`, error);
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying block ${slot} (attempt ${attempt + 1})...`);
        await this.fetchBlockWithRetry(slot, attempt + 1);
      }
    }
  }
}
