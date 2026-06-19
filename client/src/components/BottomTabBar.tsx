import { NavLink } from "react-router-dom";

export function BottomTabBar() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 flex-1 py-2 text-xs transition-colors ${
      isActive ? "text-blue-400" : "text-white/40"
    }`;

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 flex"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <NavLink to="/" end className={tab}>
        {({ isActive }) => (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke={isActive ? "none" : "currentColor"} strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            Photos
          </>
        )}
      </NavLink>

      <NavLink to="/map" className={tab}>
        {({ isActive }) => (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke={isActive ? "none" : "currentColor"} strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-10.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Map
          </>
        )}
      </NavLink>

      <NavLink to="/albums" className={tab}>
        {({ isActive }) => (
          <>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke={isActive ? "none" : "currentColor"} strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Albums
          </>
        )}
      </NavLink>
    </nav>
  );
}
