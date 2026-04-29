import { Car, CircleX, CircleCheck, SquareParking } from "lucide-react";

interface Props {
  stats: { total: number; available: number; occupied: number; booked: number };
}

const items = [
  { key: "total", label: "Total", icon: SquareParking, color: "text-foreground", bg: "bg-muted" },
  { key: "available", label: "Available", icon: Car, color: "text-available", bg: "bg-[hsl(var(--available-light))]" },
  { key: "occupied", label: "Occupied", icon: CircleX, color: "text-occupied", bg: "bg-[hsl(var(--occupied-light))]" },
  { key: "booked", label: "Booked", icon: CircleCheck, color: "text-booked", bg: "bg-[hsl(var(--booked-light))]" },
] as const;

const StatsBar = ({ stats }: Props) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {items.map(({ key, label, icon: Icon, color, bg }) => (
      <div key={key} className={`flex items-center gap-2 sm:gap-3 rounded-xl ${bg} p-3 sm:p-4`}>
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} strokeWidth={1.5} />
        <div>
          <p className="text-xl sm:text-2xl font-heading font-bold text-foreground">{stats[key]}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    ))}
  </div>
);

export default StatsBar;
