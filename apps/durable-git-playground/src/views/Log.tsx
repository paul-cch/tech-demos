import { Link } from "react-router-dom";
import { useRepo } from "@/context/repo";

export function Log() {
  const { cell } = useRepo();
  const commits = cell.log(50);

  return (
    <div className="space-y-4 max-w-3xl">
      <header>
        <h2 className="text-lg font-semibold">Commit log</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Walk from HEAD following parent links stored in the cell.
        </p>
      </header>
      <ol className="space-y-2">
        {commits.map((c, i) => (
          <li
            key={c.oid}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2"
          >
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[10px] text-zinc-600 font-mono">#{i}</span>
              <Link
                to={`/commit/${c.oid}`}
                className="font-mono text-violet-400 text-sm hover:underline"
              >
                {cell.short(c.oid)}
              </Link>
              <span className="text-sm">{c.message.split("\n")[0]}</span>
            </div>
            <div className="mt-1 text-[11px] text-zinc-500 font-mono">
              {c.author} &lt;{c.email}&gt; · {c.date}
              {c.parents.length > 0 && (
                <>
                  {" · parents "}
                  {c.parents.map((p) => (
                    <Link
                      key={p}
                      to={`/commit/${p}`}
                      className="text-sky-400 hover:underline mr-1"
                    >
                      {cell.short(p)}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
