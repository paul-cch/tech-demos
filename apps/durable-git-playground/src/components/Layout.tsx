import { NavLink, Outlet } from "react-router-dom";
import { useRepo } from "@/context/repo";

const nav = [
  { to: "/", label: "summary", end: true },
  { to: "/log", label: "log" },
  { to: "/tree", label: "tree" },
  { to: "/push", label: "push walkthrough" },
];

export function Layout() {
  const { snapshot } = useRepo();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-900/80 p-4 flex flex-col gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-amber-500/90">
            RepoCell
          </div>
          <h1 className="font-mono text-sm font-semibold text-zinc-50 break-all">
            {snapshot.name}
          </h1>
          <p className="mt-1 text-xs text-zinc-400 leading-snug">
            {snapshot.description}
          </p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-2 text-[11px] font-mono space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">owner</span>
            <span>{snapshot.owner}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">objects</span>
            <span className="text-emerald-400">{snapshot.objectCount}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">refs</span>
            <span className="text-sky-400">{snapshot.refCount}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 text-sm">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "rounded px-2 py-1.5 font-mono text-xs",
                  isActive
                    ? "bg-amber-500/15 text-amber-300"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto text-[10px] text-zinc-600 leading-relaxed">
          Local playground for the durable-git idea: one Durable Object per
          repo. Not a real Workers deploy.
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="border-b border-zinc-800 px-5 py-2 text-[11px] font-mono text-zinc-500 flex gap-3 flex-wrap">
          {Object.entries(snapshot.refs).map(([name, oid]) => (
            <span key={name}>
              <span className="text-zinc-400">{name}</span>{" "}
              <span className="text-violet-400">{oid.slice(0, 7)}</span>
            </span>
          ))}
        </div>
        <div className="p-5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
