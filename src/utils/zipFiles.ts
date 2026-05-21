export interface ZipEntryInput {
  fileName: string;
  data: ArrayBuffer;
}

const textEncoder = new TextEncoder();
const CRC32_TABLE = createCrc32Table();

export function createZipArchive(entries: ZipEntryInput[]): ArrayBuffer {
  if (entries.length === 0) {
    throw new Error('Cannot create an empty ZIP archive.');
  }

  const localFileParts: Uint8Array[] = [];
  const centralDirectoryParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const fileNameBytes = textEncoder.encode(entry.fileName);
    const fileBytes = new Uint8Array(entry.data);
    const checksum = crc32(fileBytes);
    const localHeader = createLocalFileHeader(fileNameBytes, fileBytes, checksum);
    const centralHeader = createCentralDirectoryHeader(fileNameBytes, fileBytes, checksum, offset);

    localFileParts.push(localHeader, fileBytes);
    centralDirectoryParts.push(centralHeader);
    offset += localHeader.byteLength + fileBytes.byteLength;
  }

  const centralDirectorySize = centralDirectoryParts.reduce((sum, part) => sum + part.byteLength, 0);
  const endRecord = createEndOfCentralDirectory(entries.length, centralDirectorySize, offset);
  const archive = concatUint8Arrays([...localFileParts, ...centralDirectoryParts, endRecord]);

  return toExactArrayBuffer(archive);
}

function createLocalFileHeader(fileNameBytes: Uint8Array, fileBytes: Uint8Array, checksum: number): Uint8Array {
  const header = new Uint8Array(30 + fileNameBytes.byteLength);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, checksum, true);
  view.setUint32(18, fileBytes.byteLength, true);
  view.setUint32(22, fileBytes.byteLength, true);
  view.setUint16(26, fileNameBytes.byteLength, true);
  view.setUint16(28, 0, true);
  header.set(fileNameBytes, 30);

  return header;
}

function createCentralDirectoryHeader(
  fileNameBytes: Uint8Array,
  fileBytes: Uint8Array,
  checksum: number,
  localHeaderOffset: number,
): Uint8Array {
  const header = new Uint8Array(46 + fileNameBytes.byteLength);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, checksum, true);
  view.setUint32(20, fileBytes.byteLength, true);
  view.setUint32(24, fileBytes.byteLength, true);
  view.setUint16(28, fileNameBytes.byteLength, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, localHeaderOffset, true);
  header.set(fileNameBytes, 46);

  return header;
}

function createEndOfCentralDirectory(entryCount: number, centralDirectorySize: number, centralDirectoryOffset: number): Uint8Array {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  view.setUint16(20, 0, true);

  return record;
}

function concatUint8Arrays(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.byteLength;
  }

  return output;
}

function crc32(bytes: Uint8Array): number {
  let checksum = 0xffffffff;

  for (const byte of bytes) {
    checksum = (checksum >>> 8) ^ CRC32_TABLE[(checksum ^ byte) & 0xff];
  }

  return (checksum ^ 0xffffffff) >>> 0;
}

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
}

function toExactArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}
