import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRepo } from "@/context/repo";

const STEPS = [
  {
    title: "Client speaks smart HTTP",
    body: "A stock git client opens a push to the Worker. durable-git routes by repo name to a single Durable Object — the RepoCell. There is no shared filesystem origin.",
    highlight: "route",
  },
  {
    title: "Pack streams into the cell",
    body: "The push body is a packfile (pkt-line framed). In real dgit the cell parses ofs/ref deltas and indexes each object. Here we do not parse packs — we only narrate the effect on cell state.",
    highlight: "pack",
  },
  {
    title: "Objects land in cell storage",
    body: "Blobs, trees, and commits are stored against the cell (SQLite on Workers; Map in this playground). Compression from the client pack can be preserved. One hot repo cannot starve another — sharding is by construction.",
    highlight: "objects",
  },
  {
    title: "Refs update atomically",
    body: "After objects are accepted, refs/heads/main (and friends) swing to the new tip. Forced updates and deletes behave like any git server. Unreachable objects may later be GC'd by a DO alarm.",
    highlight: "refs",
  },
  {
    title: "Try a simulated push",
    body: "Click Apply simulated push to mint NOTES.txt, a new commit, and move main — as if a pack just landed in this cell. Watch object/ref counts and the push log.",
    highlight: "apply",
  },
] as const;

export function PushWalkthrough() {
  const { cell, snapshot, runWalkthroughPush, reset } = useRepo();
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const headBefore = useMemo(() => snapshot.refs["refs/heads/main"], [snapshot]);

  return (
    <div className="space-y-5 max-w-4xl">
      <header>
        <h2 className="text-lg font-semibold">Push walkthrough</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Narrative of how a push hits one RepoCell. Not a real pack parser —
          the button below mutates the in-memory cell the same way a successful
          push would.
        </p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setStep(i)}
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-mono border",
              i === step
                ? "border-amber-500/60 bg-amber-500/15 text-amber-200"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500",
            ].join(" ")}
          >
            {i + 1}. {s.title.split(" ")[0]}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <article className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
          <h3 className="font-medium text-sm">
            Step {step + 1}: {current.title}
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">{current.body}</p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="text-xs px-2 py-1 rounded border border-zinc-700 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={step === STEPS.length - 1}
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="text-xs px-2 py-1 rounded border border-zinc-700 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </article>

        <aside
          className={[
            "rounded-lg border p-4 font-mono text-xs space-y-2 transition-colors",
            current.highlight === "objects"
              ? "border-emerald-500/50 bg-emerald-950/30"
              : current.highlight === "refs"
                ? "border-sky-500/50 bg-sky-950/30"
                : current.highlight === "pack" || current.highlight === "apply"
                  ? "border-amber-500/50 bg-amber-950/20"
                  : "border-zinc-800 bg-zinc-950/60",
          ].join(" ")}
        >
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            Cell state
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">name</span>
            <span>{snapshot.name}</span>
          </div>
          <div
            className={[
              "flex justify-between",
              current.highlight === "objects" ? "text-emerald-300" : "",
            ].join(" ")}
          >
            <span className="text-zinc-500">objects</span>
            <span>{snapshot.objectCount}</span>
          </div>
          <div
            className={[
              "flex justify-between",
              current.highlight === "refs" ? "text-sky-300" : "",
            ].join(" ")}
          >
            <span className="text-zinc-500">refs</span>
            <span>{snapshot.refCount}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500 shrink-0">main</span>
            <Link
              to={`/commit/${headBefore}`}
              className="text-violet-400 hover:underline truncate"
            >
              {headBefore?.slice(0, 12)}
            </Link>
          </div>
          <div className="pt-2 border-t border-zinc-800">
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
              Push log
            </div>
            <ul className="space-y-0.5 text-zinc-400 max-h-28 overflow-auto">
              {cell.pushLog.map((line, i) => (
                <li key={i}>· {line}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runWalkthroughPush}
          className="rounded-md bg-amber-500/90 hover:bg-amber-400 text-zinc-950 text-sm font-medium px-3 py-1.5"
        >
          Apply simulated push
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md border border-zinc-700 text-sm px-3 py-1.5 text-zinc-300 hover:bg-zinc-900"
        >
          Reset cell to seed
        </button>
        <Link
          to="/log"
          className="rounded-md border border-zinc-700 text-sm px-3 py-1.5 text-sky-300 hover:bg-zinc-900"
        >
          View log
        </Link>
      </div>
    </div>
  );
}
