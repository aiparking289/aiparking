const items = [
  { label: "Available", colorClass: "bg-available" },
  { label: "Occupied", colorClass: "bg-occupied" },
  { label: "Booked", colorClass: "bg-booked" },
];

const StatusLegend = () => (
  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
    {items.map(({ label, colorClass }) => (
      <div key={label} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
        <span className={`h-3 w-3 rounded-full ${colorClass}`} />
        {label}
      </div>
    ))}
  </div>
);

export default StatusLegend;
