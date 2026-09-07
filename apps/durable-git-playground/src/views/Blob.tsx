import { Link, useParams } from "react-router-dom";
import { useRepo } from "@/context/repo";

export function BlobView() {
  const { "*": splat } = useParams();
  const path = splat ?? "";
  const { cell } = useRepo();
  const head = cell.getHead();
  const commit = head ? cell.getCommit(head) : undefined;

  if (!commit) {
    return <p className="text-sm text-zinc-400">No HEAD commit.</p>;
  }

  const resolved = cell.resolvePath(commit.tree, path);
  if (!resolved || resolved.type !== "blob") {
    return (
      <p className="text-sm text-red-400">
        Blob not found: <code>{path}</code>.{" "}
        <Link to="/tree" className="text-amber-400 hover:underline">
          Back to tree
        </Link>
      </p>
    );
  }

  const text = cell.getBlob(resolved.oid) ?? "";
  const parent = path.includes("/")
    ? path.split("/").slice(0, -1).join("/")
    : "";

  return (
    <div className="space-y-3 max-w-4xl">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold font-mono">{path}</h2>
          <p className="text-xs font-mono text-violet-400 mt-0.5">
            blob {cell.short(resolved.oid)}
          </p>
        </div>
        <Link
          to={parent ? `/tree/${parent}` : "/tree"}
          className="text-xs text-sky-400 hover:underline"
        >
          ← tree
        </Link>
      </header>
      <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed overflow-auto font-mono text-zinc-200 whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}
