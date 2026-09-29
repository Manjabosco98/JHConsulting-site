export default function Loading() {
  return (
    <div className="container-shell section-space grid gap-8" role="status" aria-label="Carregando">
      <div className="grid gap-3">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-12 w-full max-w-[28rem]" />
        <div className="skeleton h-4 w-full max-w-[36rem]" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <div key={card} className="card overflow-hidden rounded-2xl">
            <div className="skeleton aspect-[3/2] w-full rounded-none" />
            <div className="p-5">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton mt-3 h-3 w-full" />
              <div className="skeleton mt-2 h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
