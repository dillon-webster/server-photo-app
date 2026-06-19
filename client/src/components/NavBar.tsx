import { NavLink } from "react-router-dom";
import { UploadButton } from "./UploadButton";
import { clearToken } from "../api";

export function NavBar({ onLogout }: { onLogout?: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isActive ? "bg-white/15 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
    }`;

  return (
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
        <UploadButton />
        {onLogout && (
          <button
            onClick={() => { clearToken(); onLogout(); }}
            className="text-white/40 hover:text-white/80 text-sm px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
