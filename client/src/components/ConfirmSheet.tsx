import { useEffect } from "react";
import { Portal } from "./Portal";

export interface SheetAction {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  title: string;
  message?: string;
  actions: SheetAction[];
  onCancel: () => void;
}

/** In-app replacement for confirm(): bottom sheet on mobile, centered card on desktop. */
export function ConfirmSheet({ title, message, actions, onCancel }: Props) {
  useEffect(() => {
    // Capture phase so keys don't reach handlers behind the sheet (e.g. Lightbox nav)
    const handler = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onCancel]);

  return (
    <Portal>
    <div
      className="fixed inset-0 z-[2100] bg-black/60 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full sm:max-w-sm bg-neutral-900 border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-slide-up"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <h2 className="text-white text-base font-medium text-center">{title}</h2>
        {message && <p className="mt-1 text-sm text-white/50 text-center">{message}</p>}
        <div className="mt-5 flex flex-col gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors tap ${
                action.danger
                  ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                  : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {action.label}
            </button>
          ))}
          <button
            onClick={onCancel}
            className="w-full rounded-xl py-2.5 text-sm text-white/50 hover:text-white transition-colors tap"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
