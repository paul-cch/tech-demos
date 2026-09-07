import { RepoCell } from "./repo-cell";

/** Build a seeded toy repository that lives inside one RepoCell. */
export function createSeededCell(): RepoCell {
  const cell = new RepoCell(
    "demo/hello-dgit",
    "Toy repo illustrating one Durable Object (RepoCell) per git repository.",
    "paul-cch",
  );

  const readme1 = cell.putBlob(
    "# hello-dgit\n\nA tiny demo repository living inside one RepoCell.\n",
  );
  const srcIndex1 = cell.putBlob(
    "export function greet(name: string) {\n  return `hello, ${name}`;\n}\n",
  );
  const srcTree1 = cell.putTree([
    { mode: "100644", name: "index.ts", oid: srcIndex1 },
  ]);
  const root1 = cell.putTree([
    { mode: "100644", name: "README.md", oid: readme1 },
    { mode: "040000", name: "src", oid: srcTree1 },
  ]);
  const c1 = cell.putCommit({
    tree: root1,
    parents: [],
    author: "Ada Demo",
    email: "ada@example.com",
    date: "2026-09-01T10:00:00Z",
    message: "initial commit: README + greet()",
  });

  const readme2 = cell.putBlob(
    "# hello-dgit\n\nA tiny demo repository living inside one RepoCell.\n\n## Ideas\n\n- one cell per repo\n- objects + refs in SQLite (here: memory)\n",
  );
  const srcIndex2 = cell.putBlob(
    "export function greet(name: string) {\n  return `hello, ${name}!`;\n}\n\nexport function shout(name: string) {\n  return greet(name).toUpperCase();\n}\n",
  );
  const srcTree2 = cell.putTree([
    { mode: "100644", name: "index.ts", oid: srcIndex2 },
  ]);
  const root2 = cell.putTree([
    { mode: "100644", name: "README.md", oid: readme2 },
    { mode: "040000", name: "src", oid: srcTree2 },
  ]);
  const c2 = cell.putCommit({
    tree: root2,
    parents: [c1],
    author: "Ada Demo",
    email: "ada@example.com",
    date: "2026-09-03T14:30:00Z",
    message: "docs: ideas; feat: shout()",
  });

  const license = cell.putBlob("MIT License\n\nCopyright (c) 2026 demo\n");
  const root3 = cell.putTree([
    { mode: "100644", name: "LICENSE", oid: license },
    { mode: "100644", name: "README.md", oid: readme2 },
    { mode: "040000", name: "src", oid: srcTree2 },
  ]);
  const c3 = cell.putCommit({
    tree: root3,
    parents: [c2],
    author: "Paul Couach",
    email: "paul@example.com",
    date: "2026-09-05T09:15:00Z",
    message: "add LICENSE",
  });

  cell.updateRef("refs/heads/main", c3);
  cell.updateRef("HEAD", "refs/heads/main");
  cell.pushLog.push("seeded cell with 3 commits on refs/heads/main");

  return cell;
}

/** Objects/ref tip applied by the walkthrough "second push". */
export function applyWalkthroughPush(cell: RepoCell): void {
  const head = cell.getHead()!;
  const headCommit = cell.getCommit(head)!;
  const note = cell.putBlob("note: push landed in this cell only\n");
  const prev = cell.flattenTree(headCommit.tree);
  const entries = [...prev.entries()].map(([name, oid]) => {
    if (name.includes("/")) return null;
    return { mode: "100644" as const, name, oid };
  }).filter(Boolean) as { mode: string; name: string; oid: string }[];

  // rebuild root with nested src preserved via previous tree walk
  const readme = prev.get("README.md")!;
  const license = prev.get("LICENSE")!;
  const srcIndex = prev.get("src/index.ts")!;
  const srcTree = cell.putTree([
    { mode: "100644", name: "index.ts", oid: srcIndex },
  ]);
  const root = cell.putTree([
    { mode: "100644", name: "LICENSE", oid: license },
    { mode: "100644", name: "README.md", oid: readme },
    { mode: "100644", name: "NOTES.txt", oid: note },
    { mode: "040000", name: "src", oid: srcTree },
  ]);
  void entries;
  const c4 = cell.putCommit({
    tree: root,
    parents: [head],
    author: "Walkthrough Bot",
    email: "bot@example.com",
    date: "2026-09-07T12:00:00Z",
    message: "push walkthrough: add NOTES.txt",
  });
  cell.updateRef("refs/heads/main", c4);
}
