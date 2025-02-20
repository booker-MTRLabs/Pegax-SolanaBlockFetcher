import { promises as fs, createReadStream, createWriteStream } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

export class FileCompressor {
  async compressFile(filePath: string): Promise<void> {
    const zipPath = `${filePath}.gz`;
    const gzip = createGzip();
    const source = createReadStream(filePath);
    const destination = createWriteStream(zipPath);

    await pipelineAsync(source, gzip, destination);
    console.log(`File ${filePath} compressed to ${zipPath}`);

    await fs.unlink(filePath);
    console.log(`File ${filePath} deleted after compression`);
  }
}