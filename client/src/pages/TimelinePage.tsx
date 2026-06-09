import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { PhotoGrid } from "../components/PhotoGrid";

export function TimelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["timeline"],
    queryFn: api.photos.timeline,
  });

  const yearRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const years = data.map((y) => y.year);

  return (
    <div className="flex min-h-screen">
      {/* Year sidebar */}
      <aside className="hidden lg:flex flex-col gap-1 pt-6 px-3 w-16 shrink-0 sticky top-14 self-start max-h-[calc(100vh-56px)] overflow-y-auto">
        {years.map((year) => (
          <button
            key={year}
            onClick={() =>
              yearRefs.current[year]?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="text-white/30 hover:text-white text-xs font-medium text-center py-1 rounded transition-colors hover:bg-white/5"
          >
            {year}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 pb-12">
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
      </div>
    </div>
  );
}
