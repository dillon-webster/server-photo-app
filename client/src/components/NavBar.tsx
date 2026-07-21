import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { UploadButton } from "./UploadButton";
import { useSelection } from "./SelectionContext";
import { clearToken } from "../api";

// Sign out is rare and semi-destructive — it lives behind this menu rather than
// sitting permanently in the bar competing with Select and Add.
// Both nav bars are always mounted (only CSS hides one), so this is a component
// rather than shared JSX: each instance needs its own open state and ref.
function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account"
        aria-expanded={open}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors tap cursor-pointer ${
          open ? "bg-white/15 text-white" : "text-white/40 hover:text-white hover:bg-white/10"
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 1115 0v.25h-15v-.25z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-40 min-w-40 rounded-xl bg-neutral-800/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 p-1 animate-scale-in origin-top-right">
          <button
            onClick={() => { setOpen(false); clearToken(); onLogout(); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            Sign out
          </button>
          <div className="px-3 py-1.5 text-[11px] text-white/25">v{__APP_VERSION__}</div>
        </div>
      )}
    </div>
  );
}

export function NavBar({ onLogout }: { onLogout?: () => void }) {
  const { pathname } = useLocation();
  const { selecting, start, cancel } = useSelection();
  // Selecting photos only makes sense on the timeline.
  const onTimeline = pathname === "/";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isActive ? "bg-accent/15 text-accent-bright font-medium" : "text-white/50 hover:text-white hover:bg-white/10"
    }`;

  const selectButton = onTimeline && (
    <button
      onClick={() => (selecting ? cancel() : start())}
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors tap ${
        selecting
          ? "text-accent-bright bg-accent/15 font-medium"
          : "text-white/50 hover:text-white hover:bg-white/10"
      }`}
    >
      {selecting ? "Cancel" : "Select"}
    </button>
  );

  return (
    <>
      {/* Desktop / landscape nav */}
      <nav className="sticky top-0 z-30 bg-neutral-900/90 backdrop-blur-xl border-b border-white/8 px-5 py-3 hidden sm:flex items-center gap-1">
        <span className="text-white font-semibold text-sm mr-2 tracking-tight">Photos</span>
        <NavLink to="/" end className={linkClass}>
          Timeline
        </NavLink>
        <NavLink to="/map" className={linkClass}>
          Map
        </NavLink>
        <NavLink to="/albums" className={linkClass}>
          Albums
        </NavLink>
        <div className="ml-auto flex items-center gap-2">
          {selectButton}
          <UploadButton />
          {onLogout && <AccountMenu onLogout={onLogout} />}
        </div>
      </nav>

      {/* Mobile / portrait top bar — route tabs live in the bottom bar, so this
          only carries the actions the bottom bar can't: upload + account. */}
      <nav
        className="sm:hidden sticky z-30 bg-neutral-900/90 backdrop-blur-xl border-b border-white/8 px-4 py-2.5 flex items-center"
        style={{ top: "env(safe-area-inset-top)" }}
      >
        <span className="text-white font-semibold text-base tracking-tight">Photos</span>
        <div className="ml-auto flex items-center gap-1">
          {selectButton}
          <UploadButton />
          {onLogout && <AccountMenu onLogout={onLogout} />}
        </div>
      </nav>
    </>
  );
}
