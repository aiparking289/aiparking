const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
    {Array.from({ length: 18 }).map((_, i) => (
      <div
        key={i}
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-border/50 p-5 animate-pulse"
      >
        <div className="flex w-full justify-between">
          <div className="h-5 w-10 rounded bg-muted" />
          <div className="h-5 w-16 rounded-full bg-muted" />
        </div>
        <div className="h-16 w-16 rounded-xl bg-muted" />
        <div className="h-8 w-full rounded-md bg-muted" />
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;
