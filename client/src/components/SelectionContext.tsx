import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface SelectionState {
  selecting: boolean;
  selected: Set<string>;
  start: () => void;
  cancel: () => void;
  toggle: (id: string) => void;
}

const SelectionCtx = createContext<SelectionState | null>(null);

// Shared photo-selection state so the "Select" button in the top nav and the
// timeline grid (and its action bar) can drive one selection together.
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const start = useCallback(() => {
    setSelected(new Set());
    setSelecting(true);
  }, []);

  const cancel = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <SelectionCtx.Provider value={{ selecting, selected, start, cancel, toggle }}>
      {children}
    </SelectionCtx.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionCtx);
  if (!ctx) throw new Error("useSelection must be used within a SelectionProvider");
  return ctx;
}
