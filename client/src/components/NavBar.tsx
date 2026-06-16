import { NavLink } from "react-router-dom";
import { UploadButton } from "./UploadButton";

export function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isActive ? "bg-white/15 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-2 flex items-center gap-2">
      <span className="text-white font-semibold text-sm mr-2">Photos</span>
      <span className="text-white/30 text-xs">v{__APP_VERSION__}</span>
      <NavLink to="/" end className={linkClass}>
        Timeline
      </NavLink>
      <NavLink to="/map" className={linkClass}>
        Map
      </NavLink>
      <NavLink to="/albums" className={linkClass}>
        Albums
      </NavLink>
      <div className="ml-auto">
        <UploadButton />
      </div>
    </nav>
  );
}
