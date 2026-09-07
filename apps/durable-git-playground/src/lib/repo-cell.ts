import { toyOid, shortOid } from "./hash";
import type {
  CellSnapshot,
  CommitInfo,
  ObjectType,
  StoredObject,
  TreeEntry,
} from "./types";

function serializeTree(entries: TreeEntry[]): string {
  return [...entries]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => `${e.mode} ${e.name}\t${e.oid}`)
    .join("\n");
}

function parseTree(content: string): TreeEntry[] {
  if (!content.trim()) return [];
  return content.split("\n").map((line) => {
    const [meta, oid] = line.split("\t");
    const space = meta.indexOf(" ");
    return {
      mode: meta.slice(0, space),
      name: meta.slice(space + 1),
      oid,
    };
  });
}

function serializeCommit(c: Omit<CommitInfo, "oid">): string {
  const lines = [`tree ${c.tree}`];
  for (const p of c.parents) lines.push(`parent ${p}`);
  lines.push(`author ${c.author} <${c.email}> ${c.date}`);
  lines.push(`committer ${c.author} <${c.email}> ${c.date}`);
  lines.push("");
  lines.push(c.message);
  return lines.join("\n");
}

function parseCommit(oid: string, content: string): CommitInfo {
  const [header, ...rest] = content.split("\n\n");
  const message = rest.join("\n\n");
  const lines = header.split("\n");
  let tree = "";
  const parents: string[] = [];
  let author = "";
  let email = "";
  let date = "";
  for (const line of lines) {
    if (line.startsWith("tree ")) tree = line.slice(5);
    else if (line.startsWith("parent ")) parents.push(line.slice(7));
    else if (line.startsWith("author ")) {
      const m = line.match(/^author (.+) <(.+)> (.+)$/);
      if (m) {
        author = m[1];
        email = m[2];
        date = m[3];
      }
    }
  }
  return { oid, tree, parents, author, email, date, message };
}

/**
 * In-memory stand-in for a durable-git RepoCell:
 * one named cell = one repository (objects + refs).
 */
export class RepoCell {
  readonly name: string;
  description: string;
  owner: string;
  private objects = new Map<string, StoredObject>();
  private refs = new Map<string, string>();
  /** Narrative push log for the walkthrough panel. */
  pushLog: string[] = [];

  constructor(name: string, description: string, owner: string) {
    this.name = name;
    this.description = description;
    this.owner = owner;
  }

  store(type: ObjectType, content: string): string {
    const oid = toyOid(`${type}\0${content}`);
    this.objects.set(oid, { type, content });
    return oid;
  }

  putBlob(text: string): string {
    return this.store("blob", text);
  }

  putTree(entries: TreeEntry[]): string {
    return this.store("tree", serializeTree(entries));
  }

  putCommit(data: Omit<CommitInfo, "oid">): string {
    return this.store("commit", serializeCommit(data));
  }

  updateRef(name: string, oid: string): void {
    this.refs.set(name, oid);
  }

  getObject(oid: string): StoredObject | undefined {
    return this.objects.get(oid);
  }

  getRef(name: string): string | undefined {
    return this.refs.get(name);
  }

  listRefs(): { name: string; oid: string }[] {
    return [...this.refs.entries()].map(([name, oid]) => ({ name, oid }));
  }

  getHead(): string | undefined {
    return this.refs.get("refs/heads/main") ?? this.refs.get("HEAD");
  }

  getCommit(oid: string): CommitInfo | undefined {
    const obj = this.objects.get(oid);
    if (!obj || obj.type !== "commit") return undefined;
    return parseCommit(oid, obj.content);
  }

  getTree(oid: string): TreeEntry[] | undefined {
    const obj = this.objects.get(oid);
    if (!obj || obj.type !== "tree") return undefined;
    return parseTree(obj.content);
  }

  getBlob(oid: string): string | undefined {
    const obj = this.objects.get(oid);
    if (!obj || obj.type !== "blob") return undefined;
    return obj.content;
  }

  log(limit = 50): CommitInfo[] {
    const head = this.getHead();
    if (!head) return [];
    const out: CommitInfo[] = [];
    const queue = [head];
    const seen = new Set<string>();
    while (queue.length && out.length < limit) {
      const oid = queue.shift()!;
      if (seen.has(oid)) continue;
      seen.add(oid);
      const c = this.getCommit(oid);
      if (!c) continue;
      out.push(c);
      queue.push(...c.parents);
    }
    return out;
  }

  resolvePath(treeOid: string, path: string): { type: ObjectType; oid: string } | undefined {
    const parts = path.split("/").filter(Boolean);
    let current = treeOid;
    if (parts.length === 0) return { type: "tree", oid: current };
    for (let i = 0; i < parts.length; i++) {
      const entries = this.getTree(current);
      if (!entries) return undefined;
      const ent = entries.find((e) => e.name === parts[i]);
      if (!ent) return undefined;
      const obj = this.getObject(ent.oid);
      if (!obj) return undefined;
      if (i === parts.length - 1) return { type: obj.type, oid: ent.oid };
      if (obj.type !== "tree") return undefined;
      current = ent.oid;
    }
    return undefined;
  }

  /** Simple unified-ish diff of two commit trees (file-level, not line Myers). */
  diffCommits(oldOid: string | undefined, newOid: string): {
    path: string;
    status: "added" | "modified" | "deleted";
    oldOid?: string;
    newOid?: string;
    oldText?: string;
    newText?: string;
  }[] {
    const newCommit = this.getCommit(newOid);
    if (!newCommit) return [];
    const oldMap = oldOid
      ? this.flattenTree(this.getCommit(oldOid)?.tree ?? "")
      : new Map<string, string>();
    const newMap = this.flattenTree(newCommit.tree);
    const paths = new Set([...oldMap.keys(), ...newMap.keys()]);
    const changes: {
      path: string;
      status: "added" | "modified" | "deleted";
      oldOid?: string;
      newOid?: string;
      oldText?: string;
      newText?: string;
    }[] = [];
    for (const path of [...paths].sort()) {
      const a = oldMap.get(path);
      const b = newMap.get(path);
      if (a && !b) {
        changes.push({
          path,
          status: "deleted",
          oldOid: a,
          oldText: this.getBlob(a),
        });
      } else if (!a && b) {
        changes.push({
          path,
          status: "added",
          newOid: b,
          newText: this.getBlob(b),
        });
      } else if (a && b && a !== b) {
        changes.push({
          path,
          status: "modified",
          oldOid: a,
          newOid: b,
          oldText: this.getBlob(a),
          newText: this.getBlob(b),
        });
      }
    }
    return changes;
  }

  flattenTree(treeOid: string, prefix = ""): Map<string, string> {
    const out = new Map<string, string>();
    if (!treeOid) return out;
    const entries = this.getTree(treeOid);
    if (!entries) return out;
    for (const e of entries) {
      const path = prefix ? `${prefix}/${e.name}` : e.name;
      const obj = this.getObject(e.oid);
      if (!obj) continue;
      if (obj.type === "blob") out.set(path, e.oid);
      else if (obj.type === "tree") {
        for (const [k, v] of this.flattenTree(e.oid, path)) out.set(k, v);
      }
    }
    return out;
  }

  snapshot(): CellSnapshot {
    return {
      name: this.name,
      description: this.description,
      owner: this.owner,
      objectCount: this.objects.size,
      refCount: this.refs.size,
      refs: Object.fromEntries(this.refs),
      objectIds: [...this.objects.keys()],
    };
  }

  /**
   * Simulated push: apply pre-built objects/ref tip as if a pack landed.
   * Not a pack parser — narrative only.
   */
  simulatePush(label: string, apply: (cell: RepoCell) => void): CellSnapshot {
    this.pushLog.push(`recv pack: ${label}`);
    apply(this);
    this.pushLog.push(
      `updated refs — objects=${this.objects.size} refs=${this.refs.size}`,
    );
    return this.snapshot();
  }

  short(oid: string): string {
    return shortOid(oid);
  }
}
