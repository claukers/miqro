import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";

/**
 * 
 * @param {string} filePath 
 * @returns {Promise<string>} the checksum
 */
export async function calculateChecksum(filePath: string): Promise<string> {
  return calculateChecksumFromStream(createReadStream(filePath));
}

/**
 * 
 * @param {string} filePath 
 * @returns {Promise<string>} the checksum
 */
export async function calculateChecksumFromStream(input: Readable): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const hash = createHash('sha256');
      input.on('readable', () => {
        // Only one element is going to be produced by the
        // hash stream.
        const data = input.read();
        if (data)
          hash.update(data);
        else {
          //log(`${hash.digest('hex')} ${filename}`);
          resolve(hash.digest('hex').toString());
        }
      });
      input.on("error", (e) => {
        reject(e);
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * 
 * @param {string} filePath 
 * @returns {Promise<string>} the checksum
 */
export async function calculateChecksumFromBuffer(buffer: Buffer): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const hash = createHash('sha256');
      hash.update(buffer);
      resolve(hash.digest('hex').toString());
    } catch (e) {
      reject(e);
    }
  });
}
