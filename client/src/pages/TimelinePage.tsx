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

// Logarithmic mapping so each slider position corresponds to a consistent column-count change
function sliderToColumn(s: number, max: number): number {
  const logMin = Math.log(ZOOM_MIN);
  const logMax = Math.log(max);
  return Math.round(Math.exp(logMin + (s / 100) * (logMax - logMin)));
}

function columnToSlider(c: number, max: number): number {
  const logMin = Math.log(ZOOM_MIN);
  const logMax = Math.log(max);
  return ((Math.log(Math.max(c, ZOOM_MIN)) - logMin) / (logMax - logMin)) * 100;
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
  const [sliderVisible, setSliderVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bumpSlider = () => {
    setSliderVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setSliderVisible(false), 3000);
  };

  useEffect(() => {
    document.addEventListener("touchstart", bumpSlider, { passive: true });
    hideTimer.current = setTimeout(() => setSliderVisible(false), 3000);
    return () => {
      document.removeEventListener("touchstart", bumpSlider);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

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
      <div className="flex items-center justify-center h-64 text-white/30">
        Loading…
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white/40 gap-3">
        <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">No photos yet — drag &amp; drop or click &ldquo;Add photos&rdquo;</p>
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
          <h2 className="text-xs font-semibold text-white/40 px-5 pt-6 pb-1 sticky top-14 bg-neutral-900/95 backdrop-blur-sm z-10 tracking-widest uppercase">
            {yearGroup.year}
          </h2>
          {yearGroup.months.map((monthGroup) => (
            <div key={monthGroup.month}>
              <h3 className="text-base font-semibold text-white/70 px-5 pt-4 pb-2">
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

      {/* Mobile zoom slider — logarithmic so column changes feel even across the full range */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-20 px-6 pb-8 pt-4 bg-neutral-900/85 backdrop-blur-md border-t border-white/10 transition-opacity duration-500 ${sliderVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="flex items-center gap-4">
          <svg className="w-4 h-4 text-white/40 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <rect x="1" y="1" width="8" height="8" rx="1" />
            <rect x="11" y="1" width="8" height="8" rx="1" />
            <rect x="1" y="11" width="8" height="8" rx="1" />
            <rect x="11" y="11" width="8" height="8" rx="1" />
          </svg>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={columnToSlider(columnSize, sliderMax)}
            onChange={(e) => { bumpSlider(); saveAndSet(sliderToColumn(Number(e.target.value), sliderMax)); }}
            className="flex-1 accent-white cursor-pointer"
          />
          <svg className="w-6 h-6 text-white/40 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <rect x="1" y="1" width="18" height="18" rx="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
