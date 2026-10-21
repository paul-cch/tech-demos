export type DiffLine = { op: 'same' | 'add' | 'del'; text: string }

/** Line-level LCS diff; prompts are a few dozen lines, so O(n·m) is fine. */
export function lineDiff(a: string, b: string): DiffLine[] {
  const A = a ? a.split('\n') : []
  const B = b ? b.split('\n') : []
  const L = Array.from({ length: A.length + 1 }, () => new Array<number>(B.length + 1).fill(0))
  for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) {
      out.push({ op: 'same', text: A[i] })
      i++
      j++
    } else if (L[i + 1][j] >= L[i][j + 1]) out.push({ op: 'del', text: A[i++] })
    else out.push({ op: 'add', text: B[j++] })
  }
  while (i < A.length) out.push({ op: 'del', text: A[i++] })
  while (j < B.length) out.push({ op: 'add', text: B[j++] })
  return out
}
