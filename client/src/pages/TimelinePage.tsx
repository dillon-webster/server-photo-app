import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { PhotoGrid } from "../components/PhotoGrid";
import { TimelineScrubber, type ScrubberYear } from "../components/TimelineScrubber";

const NAVBAR_H = 56;
const ZOOM_SIZES = [100, 150, 200, 280, 360];
const ZOOM_KEY = "timeline-zoom";

function loadZoom(): number {
  const saved = localStorage.getItem(ZOOM_KEY);
  const idx = saved !== null ? Number(saved) : 2;
  return Math.min(Math.max(idx, 0), ZOOM_SIZES.length - 1);
}

export function TimelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["timeline"],
    queryFn: api.photos.timeline,
  });

  const yearRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeSet = useRef(new Set<string>());
  const [activeYear, setActiveYear] = useState<string | null>(null);

  const [zoomIdx, setZoomIdx] = useState(loadZoom);
  const columnSize = ZOOM_SIZES[zoomIdx];

  const zoomIn = () => setZoomIdx((i) => { const n = Math.min(i + 1, ZOOM_SIZES.length - 1); localStorage.setItem(ZOOM_KEY, String(n)); return n; });
  const zoomOut = () => setZoomIdx((i) => { const n = Math.max(i - 1, 0); localStorage.setItem(ZOOM_KEY, String(n)); return n; });

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
    <div className="min-h-screen pb-12 pr-10">
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
              <PhotoGrid photos={monthGroup.photos} columnSize={columnSize} />
            </div>
          ))}
        </div>
      ))}

      <TimelineScrubber years={scrubberYears} activeYear={activeYear} />

      <div className="fixed bottom-6 left-6 flex gap-1 z-20">
        <button
          onClick={zoomOut}
          disabled={zoomIdx === 0}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-lg flex items-center justify-center transition-colors"
        >
          −
        </button>
        <button
          onClick={zoomIn}
          disabled={zoomIdx === ZOOM_SIZES.length - 1}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-lg flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
