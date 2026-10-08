import { inflateRawSync } from 'node:zlib';

// Minimal zip reader on node:zlib (Spec 000, plan decision: no zip dependency is approved).
// Playwright's trace archives and its HTML report payload are plain zip files whose entries are
// stored (method 0) or deflated (method 8); Zip64 and encryption are not supported.

export interface ZipEntry {
  name: string;
  data: Buffer;
}

const END_OF_CENTRAL_DIRECTORY = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIZE = 46;
const LOCAL_HEADER_SIZE = 30;
const METHOD_STORED = 0;
const METHOD_DEFLATED = 8;

/** Returns every file entry of a zip archive, decompressed. Throws on a non-zip buffer. */
export function readZipEntries(zip: Buffer): ZipEntry[] {
  const end = zip.lastIndexOf(END_OF_CENTRAL_DIRECTORY);
  if (end < 0) throw new Error('Not a zip archive: end of central directory not found');
  const entryCount = zip.readUInt16LE(end + 10);
  let offset = zip.readUInt32LE(end + 16);
  const entries: ZipEntry[] = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (zip.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) throw new Error('Corrupt zip: bad central directory entry');
    const method = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localOffset = zip.readUInt32LE(offset + 42);
    const name = zip.toString('utf8', offset + CENTRAL_HEADER_SIZE, offset + CENTRAL_HEADER_SIZE + nameLength);

    if (zip.readUInt32LE(localOffset) !== LOCAL_HEADER_SIGNATURE) throw new Error(`Corrupt zip: bad local header for ${name}`);
    const dataStart = localOffset + LOCAL_HEADER_SIZE + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28);
    const raw = zip.subarray(dataStart, dataStart + compressedSize);

    if (!name.endsWith('/')) {
      if (method === METHOD_STORED) entries.push({ name, data: Buffer.from(raw) });
      else if (method === METHOD_DEFLATED) entries.push({ name, data: inflateRawSync(raw) });
      else throw new Error(`Unsupported zip compression method ${String(method)} for ${name}`);
    }
    offset += CENTRAL_HEADER_SIZE + nameLength + extraLength + commentLength;
  }
  return entries;
}
