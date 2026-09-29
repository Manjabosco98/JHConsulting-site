/** Shown by the panel's loading.tsx while a route streams in. */
export function AdminPageSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="Carregando">
      <div className="grid gap-3">
        <div className="skeleton h-9 w-56 max-w-full" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>
      <div className="card overflow-hidden rounded-2xl">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-4 border-b border-white/5 p-4 last:border-b-0 sm:px-5">
            <div className="skeleton h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-2/5 max-w-[16rem]" />
              <div className="skeleton mt-2 h-3 w-3/5 max-w-[22rem]" />
            </div>
            <div className="skeleton hidden h-6 w-16 shrink-0 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
