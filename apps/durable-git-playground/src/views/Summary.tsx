import { Link } from "react-router-dom";
import { useRepo } from "@/context/repo";

export function Summary() {
  const { cell, snapshot } = useRepo();
  const commits = cell.log(5);
  const head = cell.getHead();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="text-lg font-semibold tracking-tight">Summary</h2>
        <p className="text-sm text-zinc-400 mt-1">
          cgit-style overview of the cell. Everything below lives in one
          in-memory RepoCell — the durable-git model is one Durable Object per
          repository.
        </p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["objects", snapshot.objectCount],
          ["refs", snapshot.refCount],
          ["commits (walk)", commits.length],
          ["HEAD", head ? cell.short(head) : "—"],
        ].map(([k, val]) => (
          <div
            key={String(k)}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2"
          >
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              {k}
            </div>
            <div className="font-mono text-sm mt-0.5">{val}</div>
          </div>
        ))}
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Recent commits
        </h3>
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 overflow-hidden">
          {commits.map((c) => (
            <li key={c.oid}>
              <Link
                to={`/commit/${c.oid}`}
                className="flex gap-3 px-3 py-2 hover:bg-zinc-900 text-sm"
              >
                <span className="font-mono text-violet-400 shrink-0">
                  {cell.short(c.oid)}
                </span>
                <span className="truncate flex-1">{c.message.split("\n")[0]}</span>
                <span className="text-zinc-500 shrink-0 hidden sm:inline">
                  {c.author}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Refs
        </h3>
        <table className="w-full text-sm font-mono">
          <tbody>
            {cell.listRefs().map((r) => (
              <tr key={r.name} className="border-b border-zinc-800/80">
                <td className="py-1.5 pr-4 text-zinc-300">{r.name}</td>
                <td className="py-1.5 text-violet-400">
                  {r.name === "HEAD" ? r.oid : (
                    <Link className="hover:underline" to={`/commit/${r.oid}`}>
                      {cell.short(r.oid)}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
