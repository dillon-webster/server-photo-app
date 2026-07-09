import { createPortal } from "react-dom";
import type { ReactNode } from "react";

// Renders children into document.body so overlays escape any ancestor stacking
// context (page-transition wrappers, sticky/fixed nav bars). Without this, a
// stacking context above the overlay traps it below the mobile nav bars.
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
