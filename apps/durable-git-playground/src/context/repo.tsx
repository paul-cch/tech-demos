import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RepoCell } from "@/lib/repo-cell";
import { applyWalkthroughPush, createSeededCell } from "@/lib/seed";
import type { CellSnapshot } from "@/lib/types";

interface RepoContextValue {
  cell: RepoCell;
  tick: number;
  snapshot: CellSnapshot;
  refresh: () => void;
  runWalkthroughPush: () => void;
  reset: () => void;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: ReactNode }) {
  const [cell, setCell] = useState(() => createSeededCell());
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const runWalkthroughPush = useCallback(() => {
    cell.simulatePush("walkthrough NOTES.txt", applyWalkthroughPush);
    refresh();
  }, [cell, refresh]);

  const reset = useCallback(() => {
    setCell(createSeededCell());
    setTick((t) => t + 1);
  }, []);

  const snapshot = useMemo(() => cell.snapshot(), [cell, tick]);

  const value = useMemo(
    () => ({ cell, tick, snapshot, refresh, runWalkthroughPush, reset }),
    [cell, tick, snapshot, refresh, runWalkthroughPush, reset],
  );

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepo(): RepoContextValue {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error("useRepo must be used within RepoProvider");
  return ctx;
}
