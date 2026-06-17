import { useRef, useState, useCallback } from "react";

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

  if (!years.length) return null;

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
        className="fixed right-3 top-14 bottom-0 z-20 w-8 flex flex-col items-center justify-around py-4 select-none touch-none cursor-pointer"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="absolute inset-y-4 right-0 w-px bg-white/10 pointer-events-none" />
        {years.map((y) => (
          <span
            key={y.year}
            className={`text-[10px] font-bold leading-none z-10 transition-colors ${
              activeYear === y.year ? "text-white" : "text-white/30"
            }`}
          >
            {y.year}
          </span>
        ))}
      </div>
    </>
  );
}
