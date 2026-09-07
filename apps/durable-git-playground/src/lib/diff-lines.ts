export type LineDiff =
  | { kind: "same"; text: string }
  | { kind: "add"; text: string }
  | { kind: "del"; text: string };

/** Tiny LCS-based line diff for the commit view. */
export function diffLines(a = "", b = ""): LineDiff[] {
  const aa = a.split("\n");
  const bb = b.split("\n");
  const n = aa.length;
  const m = bb.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        aa[i] === bb[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: LineDiff[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aa[i] === bb[j]) {
      out.push({ kind: "same", text: aa[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "del", text: aa[i++] });
    } else {
      out.push({ kind: "add", text: bb[j++] });
    }
  }
  while (i < n) out.push({ kind: "del", text: aa[i++] });
  while (j < m) out.push({ kind: "add", text: bb[j++] });
  return out;
}
