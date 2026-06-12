import { useRef, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { PhotoGrid } from "../components/PhotoGrid";
import { TimelineScrubber, type ScrubberYear } from "../components/TimelineScrubber";

const NAVBAR_H = 56;

export function TimelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["timeline"],
    queryFn: api.photos.timeline,
  });

  const yearRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const activeSet = useRef(new Set<string>());
  const [activeYear, setActiveYear] = useState<string | null>(null);

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
    <div className="min-h-screen pb-12 pr-8">
      {data.map((yearGroup) => (
        <div
          key={yearGroup.year}
          ref={(el) => { yearRefs.current[yearGroup.year] = el; }}
        >
          <h2 className="text-2xl font-semibold text-white/80 px-4 pt-8 pb-2 sticky top-14 bg-neutral-950/95 backdrop-blur-sm z-10">
            {yearGroup.year}
          </h2>
          {yearGroup.months.map((monthGroup) => (
            <div key={monthGroup.month}>
              <h3 className="text-sm font-medium text-white/40 px-4 py-2">
                {monthGroup.month}
              </h3>
              <PhotoGrid photos={monthGroup.photos} />
            </div>
          ))}
        </div>
      ))}

      <TimelineScrubber years={scrubberYears} activeYear={activeYear} />
    </div>
  );
}
