import { Link, useParams } from "react-router-dom";
import { useRepo } from "@/context/repo";
import { diffLines } from "@/lib/diff-lines";

export function CommitView() {
  const { oid } = useParams();
  const { cell } = useRepo();
  const commit = oid ? cell.getCommit(oid) : undefined;

  if (!oid || !commit) {
    return <p className="text-sm text-red-400">Unknown commit.</p>;
  }

  const parent = commit.parents[0];
  const changes = cell.diffCommits(parent, oid);

  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h2 className="text-lg font-semibold font-mono text-violet-300">
          commit {cell.short(oid)}
        </h2>
        <p className="text-sm mt-1">{commit.message}</p>
        <p className="text-[11px] font-mono text-zinc-500 mt-2">
          {commit.author} &lt;{commit.email}&gt; · {commit.date}
          {parent && (
            <>
              {" · parent "}
              <Link to={`/commit/${parent}`} className="text-sky-400 hover:underline">
                {cell.short(parent)}
              </Link>
            </>
          )}
          {" · tree "}
          <Link to="/tree" className="text-amber-400 hover:underline">
            {cell.short(commit.tree)}
          </Link>
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500">
          Diff ({changes.length} file{changes.length === 1 ? "" : "s"})
        </h3>
        {changes.length === 0 && (
          <p className="text-sm text-zinc-500">No file changes.</p>
        )}
        {changes.map((ch) => {
          const lines = diffLines(ch.oldText ?? "", ch.newText ?? "");
          return (
            <div
              key={ch.path}
              className="rounded-lg border border-zinc-800 overflow-hidden"
            >
              <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs font-mono flex gap-2">
                <span
                  className={
                    ch.status === "added"
                      ? "text-emerald-400"
                      : ch.status === "deleted"
                        ? "text-red-400"
                        : "text-amber-400"
                  }
                >
                  {ch.status}
                </span>
                <span>{ch.path}</span>
              </div>
              <pre className="text-[11px] leading-5 overflow-auto font-mono">
                {lines.map((l, i) => (
                  <div
                    key={i}
                    className={
                      l.kind === "add"
                        ? "bg-emerald-950/50 text-emerald-200"
                        : l.kind === "del"
                          ? "bg-red-950/40 text-red-200"
                          : "text-zinc-400"
                    }
                  >
                    <span className="inline-block w-4 text-center opacity-60 select-none">
                      {l.kind === "add" ? "+" : l.kind === "del" ? "-" : " "}
                    </span>
                    {l.text}
                  </div>
                ))}
              </pre>
            </div>
          );
        })}
      </section>
    </div>
  );
}
