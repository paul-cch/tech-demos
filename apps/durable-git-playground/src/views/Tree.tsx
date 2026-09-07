import { Link, useParams } from "react-router-dom";
import { useRepo } from "@/context/repo";

export function TreeView() {
  const { "*": splat } = useParams();
  const path = splat ?? "";
  const { cell } = useRepo();
  const head = cell.getHead();
  const commit = head ? cell.getCommit(head) : undefined;

  if (!commit) {
    return <p className="text-sm text-zinc-400">No HEAD commit in cell.</p>;
  }

  const resolved = cell.resolvePath(commit.tree, path);
  if (!resolved) {
    return (
      <p className="text-sm text-red-400">
        Path not found: <code>{path || "/"}</code>
      </p>
    );
  }

  if (resolved.type === "blob") {
    return <NavigateBlob oid={resolved.oid} path={path} />;
  }

  const entries = cell.getTree(resolved.oid) ?? [];
  const crumbs = path ? path.split("/") : [];

  return (
    <div className="space-y-4 max-w-3xl">
      <header>
        <h2 className="text-lg font-semibold">Tree</h2>
        <nav className="text-sm font-mono text-zinc-400 mt-1 flex flex-wrap gap-1">
          <Link to="/tree" className="text-amber-400 hover:underline">
            root
          </Link>
          {crumbs.map((c, i) => {
            const to = `/tree/${crumbs.slice(0, i + 1).join("/")}`;
            return (
              <span key={to}>
                <span className="text-zinc-600">/</span>{" "}
                <Link to={to} className="hover:underline text-zinc-300">
                  {c}
                </Link>
              </span>
            );
          })}
        </nav>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
            <th className="py-1 pr-3">mode</th>
            <th className="py-1 pr-3">name</th>
            <th className="py-1">oid</th>
          </tr>
        </thead>
        <tbody>
          {path && (
            <tr className="border-b border-zinc-800/60">
              <td className="py-1.5 font-mono text-zinc-600">040000</td>
              <td className="py-1.5">
                <Link
                  to={
                    crumbs.length <= 1
                      ? "/tree"
                      : `/tree/${crumbs.slice(0, -1).join("/")}`
                  }
                  className="text-sky-400 hover:underline"
                >
                  ..
                </Link>
              </td>
              <td />
            </tr>
          )}
          {entries.map((e) => {
            const obj = cell.getObject(e.oid);
            const childPath = path ? `${path}/${e.name}` : e.name;
            const href =
              obj?.type === "tree"
                ? `/tree/${childPath}`
                : `/blob/${childPath}`;
            return (
              <tr key={e.name} className="border-b border-zinc-800/60">
                <td className="py-1.5 font-mono text-zinc-500 text-xs">
                  {e.mode}
                </td>
                <td className="py-1.5">
                  <Link
                    to={href}
                    className={
                      obj?.type === "tree"
                        ? "text-amber-300 hover:underline font-medium"
                        : "text-zinc-200 hover:underline"
                    }
                  >
                    {e.name}
                    {obj?.type === "tree" ? "/" : ""}
                  </Link>
                </td>
                <td className="py-1.5 font-mono text-xs text-violet-400">
                  {cell.short(e.oid)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NavigateBlob({ oid, path }: { oid: string; path: string }) {
  return (
    <p className="text-sm">
      <code>{path}</code> is a blob ({oid.slice(0, 7)}).{" "}
      <Link className="text-amber-400 hover:underline" to={`/blob/${path}`}>
        Open blob view
      </Link>
    </p>
  );
}
