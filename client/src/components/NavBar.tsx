import { NavLink, useLocation } from "react-router-dom";
import { UploadButton } from "./UploadButton";
import { useSelection } from "./SelectionContext";
import { clearToken } from "../api";

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

  const signOutButton = onLogout && (
    <button
      onClick={() => { clearToken(); onLogout(); }}
      className="text-white/40 hover:text-white/80 text-sm px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
    >
      Sign out
    </button>
  );

  return (
    <>
      {/* Desktop / landscape nav */}
      <nav className="sticky top-0 z-30 bg-neutral-900/90 backdrop-blur-xl border-b border-white/8 px-5 py-3 hidden sm:flex items-center gap-1">
        <span className="text-white font-semibold text-sm mr-2 tracking-tight">Photos</span>
        <span className="hidden sm:inline text-white/30 text-xs mr-2">v{__APP_VERSION__}</span>
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
          {signOutButton}
        </div>
      </nav>

      {/* Mobile / portrait top bar — route tabs live in the bottom bar, so this
          only carries the actions the bottom bar can't: upload + sign out. */}
      <nav
        className="sm:hidden sticky z-30 bg-neutral-900/90 backdrop-blur-xl border-b border-white/8 px-4 py-2.5 flex items-center"
        style={{ top: "env(safe-area-inset-top)" }}
      >
        <span className="text-white font-semibold text-base tracking-tight">Photos</span>
        <div className="ml-auto flex items-center gap-1">
          {selectButton}
          <UploadButton />
          {signOutButton}
        </div>
      </nav>
    </>
  );
}
