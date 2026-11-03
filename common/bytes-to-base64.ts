/** Browser-safe base64. The sandboxed renderer does not have Node's Buffer. */
export function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, Math.min(index + chunkSize, bytes.length));
    const codes = new Array<number>(chunk.length);
    for (let i = 0; i < chunk.length; i += 1) {
      codes[i] = chunk[i];
    }
    binary += String.fromCharCode.apply(null, codes);
  }
  return btoa(binary);
}
