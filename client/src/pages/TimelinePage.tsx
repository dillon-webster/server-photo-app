import { useRef, useEffect, useState, useMemo, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { PhotoGrid } from "../components/PhotoGrid";
import { TimelineScrubber, type ScrubberYear } from "../components/TimelineScrubber";

const NAVBAR_H = 56;
const ZOOM_KEY = "timeline-zoom-px";
const ZOOM_MIN = 50;
const ZOOM_MAX = 400;
const ZOOM_DEFAULT = 100;
const ZOOM_STEP = 80;

// px-5 on PhotoGrid (40px) + pr-10 on container (40px)
const GRID_PADDING = 80;

function loadZoom(): number {
  const v = Number(localStorage.getItem(ZOOM_KEY));
  return v >= ZOOM_MIN && v <= ZOOM_MAX ? v : ZOOM_DEFAULT;
}


export function TimelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["timeline"],
    queryFn: api.photos.timeline,
  });

  const yearRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeSet = useRef(new Set<string>());
  const [activeYear, setActiveYear] = useState<string | null>(null);

  const [columnSize, setColumnSize] = useState(loadZoom);
  const deferredColumnSize = useDeferredValue(columnSize);
  const contentRef = useRef<HTMLDivElement>(null);
  const [sliderMax, setSliderMax] = useState(ZOOM_MAX);
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const gridWidth = el.offsetWidth - GRID_PADDING;
      // Cap just past the 2-column threshold so 1-column view is at the very end of the slider
      const max = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN + 10, Math.floor(gridWidth / 2 * 1.1)));
      setSliderMax(max);
      setColumnSize((c) => Math.min(c, max));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const saveAndSet = (v: number) => {
    const clamped = Math.min(sliderMax, Math.max(ZOOM_MIN, Math.round(v)));
    localStorage.setItem(ZOOM_KEY, String(clamped));
    setColumnSize(clamped);
  };

  const yearList = useMemo(() => data?.map((y) => y.year) ?? [], [data]);

  const scrubberYears = useMemo(
    (): ScrubberYear[] =>
      yearList.map((year) => ({
        year,
        scrollTo: () => {
          const el = yearRefs.current[year];
          if (!el) return;
          const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_H;
          window.scrollTo({ top, behavior: "instant" });
        },
      })),
    [yearList]
  );

  useEffect(() => {
    if (!yearList.length) return;

    const pick = () => {
      for (const year of yearList) {
        if (activeSet.current.has(year)) {
          setActiveYear(year);
          return;
        }
      }
    };

    const observers: IntersectionObserver[] = [];
    for (const year of yearList) {
      const el = yearRefs.current[year];
      if (!el) continue;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) activeSet.current.add(year);
          else activeSet.current.delete(year);
          pick();
        },
        { rootMargin: "0px 0px -55% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => {
      observers.forEach((o) => o.disconnect());
      activeSet.current.clear();
    };
  }, [yearList]);

  if (isLoading) {
    return (
      <div className="pt-6 px-5 animate-fade-in">
        <div className="h-3 w-16 rounded-full skeleton mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-px sm:gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="aspect-square skeleton" style={{ animationDelay: `${(i % 6) * 80}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-white/40 gap-4 animate-slide-up px-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center">
          <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm max-w-[15rem] leading-relaxed">No photos yet — drag &amp; drop or tap &ldquo;Add photos&rdquo; to get started</p>
      </div>
    );
  }

  return (
    <div ref={contentRef} className="min-h-screen pb-32 sm:pb-12 pr-10">
      {data.map((yearGroup) => (
        <div
          key={yearGroup.year}
          ref={(el) => { yearRefs.current[yearGroup.year] = el; }}
        >
          <h2 className="year-header-sticky text-[11px] font-bold text-accent-bright/80 px-5 pt-6 pb-1.5 bg-neutral-900/80 backdrop-blur-md z-10 tracking-[0.18em] uppercase">
            {yearGroup.year}
          </h2>
          {yearGroup.months.map((monthGroup) => (
            <div key={monthGroup.month}>
              <h3 className="text-xl font-bold text-white tracking-tight px-5 pt-4 pb-2.5">
                {monthGroup.month}
              </h3>
              <PhotoGrid photos={monthGroup.photos} columnSize={deferredColumnSize} />
            </div>
          ))}
        </div>
      ))}

      <TimelineScrubber years={scrubberYears} activeYear={activeYear} />

      {/* Desktop zoom buttons */}
      <div className="fixed bottom-6 left-6 hidden sm:flex gap-1 z-20">
        <button
          onClick={() => saveAndSet(columnSize - ZOOM_STEP)}
          disabled={columnSize <= ZOOM_MIN}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-lg flex items-center justify-center transition-colors"
        >
          −
        </button>
        <button
          onClick={() => saveAndSet(columnSize + ZOOM_STEP)}
          disabled={columnSize >= sliderMax}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-lg flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>

      {/* Spacer for mobile bottom tab bar */}
      <div className="sm:hidden" style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }} />
    </div>
  );
}
