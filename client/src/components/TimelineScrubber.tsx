import { useRef, useState, useCallback, useEffect } from "react";

const HIDE_DELAY_MS = 1400;

export interface ScrubberYear {
  year: string;
  scrollTo: () => void;
}

interface Props {
  years: ScrubberYear[];
  activeYear: string | null;
}

export function TimelineScrubber({ years, activeYear }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tooltipY, setTooltipY] = useState(0);
  const [tooltipYear, setTooltipYear] = useState<string | null>(null);
  const lastJumped = useRef<string | null>(null);

  const getYearAt = useCallback(
    (clientY: number): ScrubberYear | null => {
      if (!stripRef.current || !years.length) return null;
      const rect = stripRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      const idx = Math.min(Math.floor(pct * years.length), years.length - 1);
      return years[idx] ?? null;
    },
    [years]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      lastJumped.current = null;
      const y = getYearAt(e.clientY);
      if (y) {
        y.scrollTo();
        lastJumped.current = y.year;
        setTooltipY(e.clientY);
        setTooltipYear(y.year);
      }
    },
    [getYearAt]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const y = getYearAt(e.clientY);
      if (!y) return;
      setTooltipY(e.clientY);
      setTooltipYear(y.year);
      if (y.year !== lastJumped.current) {
        lastJumped.current = y.year;
        y.scrollTo();
      }
    },
    [isDragging, getYearAt]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setTooltipYear(null);
    lastJumped.current = null;
  }, []);

  // The grid now runs edge to edge underneath this strip, so it only becomes
  // interactive while the user is actually scrolling — otherwise it would eat
  // taps on the right-hand column. Same behaviour as the iOS Photos scrubber.
  const [scrolling, setScrolling] = useState(false);
  const hideTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const onScroll = () => {
      setScrolling(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setScrolling(false), HIDE_DELAY_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  if (!years.length) return null;

  const shown = scrolling || isDragging;

  return (
    <>
      {isDragging && tooltipYear && (
        <div
          className="fixed right-14 z-50 bg-neutral-800 border border-white/10 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none select-none"
          style={{ top: Math.max(56, tooltipY - 16) }}
        >
          {tooltipYear}
        </div>
      )}
      <div
        ref={stripRef}
        className={`fixed right-1.5 top-16 bottom-20 sm:bottom-6 z-20 w-9 flex flex-col items-center justify-around py-3 select-none touch-none cursor-pointer rounded-full transition-opacity duration-300 ${
          shown ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute inset-0 rounded-full bg-neutral-800/70 backdrop-blur-md border border-white/8 pointer-events-none" />
        {years.map((y) => {
          const isActive = activeYear === y.year;
          return (
            <span
              key={y.year}
              className={`relative z-10 text-[10px] font-bold leading-none tabular-nums transition-colors ${
                isActive ? "text-white" : "text-white/35"
              }`}
            >
              {isActive && (
                <span className="absolute -inset-x-1.5 -inset-y-1 rounded-full bg-accent -z-10" />
              )}
              {y.year}
            </span>
          );
        })}
      </div>
    </>
  );
}
