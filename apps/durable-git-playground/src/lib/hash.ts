/** Deterministic toy oid (not real SHA-1) — looks like a git object id. */
export function toyOid(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x811c9dc5);
  }
  const a = (h1 >>> 0).toString(16).padStart(8, "0");
  const b = (h2 >>> 0).toString(16).padStart(8, "0");
  const c = (Math.imul(h1, h2) >>> 0).toString(16).padStart(8, "0");
  const d = ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0");
  const e = (Math.imul(h1 ^ 0xdeadbeef, h2) >>> 0).toString(16).padStart(8, "0");
  return (a + b + c + d + e).slice(0, 40);
}

export function shortOid(oid: string, n = 7): string {
  return oid.slice(0, n);
}
