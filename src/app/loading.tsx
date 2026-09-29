export default function Loading() {
  return (
    <div className="container-shell section-space grid gap-10" role="status" aria-label="Carregando">
      <div className="grid gap-4">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-14 w-full max-w-[42rem]" />
        <div className="skeleton h-14 w-full max-w-[30rem]" />
        <div className="skeleton mt-2 h-4 w-full max-w-[38rem]" />
        <div className="skeleton h-4 w-full max-w-[32rem]" />
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="skeleton h-12 w-40" />
          <div className="skeleton h-12 w-40" />
        </div>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((card) => (
          <div key={card} className="card rounded-2xl p-6">
            <div className="skeleton h-11 w-11" />
            <div className="skeleton mt-5 h-5 w-3/5" />
            <div className="skeleton mt-3 h-3 w-full" />
            <div className="skeleton mt-2 h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
