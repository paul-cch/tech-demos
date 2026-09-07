export type ObjectType = "blob" | "tree" | "commit";

export interface StoredObject {
  type: ObjectType;
  /** Raw payload (blob text, tree lines, or commit text). */
  content: string;
}

export interface TreeEntry {
  mode: string;
  name: string;
  oid: string;
}

export interface CommitInfo {
  oid: string;
  tree: string;
  parents: string[];
  author: string;
  email: string;
  date: string;
  message: string;
}

export interface CellSnapshot {
  name: string;
  description: string;
  owner: string;
  objectCount: number;
  refCount: number;
  refs: Record<string, string>;
  objectIds: string[];
}
