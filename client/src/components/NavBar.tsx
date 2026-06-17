import { NavLink } from "react-router-dom";
import { UploadButton } from "./UploadButton";

export function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isActive ? "bg-white/15 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-xl border-b border-white/8 px-5 py-3 flex items-center gap-1">
      <span className="text-white font-semibold text-sm mr-4 tracking-tight">Photos</span>
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
