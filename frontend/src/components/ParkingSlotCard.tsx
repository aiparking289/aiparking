import { useState } from "react";
import { Car, CircleCheck, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ParkingSlot } from "@/hooks/useParkingSlots";
import BookingDialog from "./BookingDialog";

interface Props {
  slot: ParkingSlot;
  onBook: (id: number, userName: string, userEmail: string, userPhone: string) => Promise<void>;
  onBookingSuccess?: (label: string) => void;
  index: number;
}

const statusConfig = {
  available: {
    cardClass: "slot-card-available cursor-pointer",
    icon: Car,
    iconClass: "text-available",
    badge: "Available",
    badgeClass: "bg-available/15 text-available",
  },
  occupied: {
    cardClass: "slot-card-occupied",
    icon: CircleX,
    iconClass: "text-occupied",
    badge: "Occupied",
    badgeClass: "bg-occupied/15 text-occupied",
  },
  booked: {
    cardClass: "slot-card-booked",
    icon: CircleCheck,
    iconClass: "text-booked",
    badge: "Booked",
    badgeClass: "bg-booked/15 text-booked",
  },
};

const ParkingSlotCard = ({ slot, onBook, onBookingSuccess, index }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const config = statusConfig[slot.status];
  const Icon = config.icon;

  const handleBookingConfirm = async (userName: string, userEmail: string, userPhone: string) => {
    try {
      await onBook(slot.id, userName, userEmail, userPhone);
      onBookingSuccess?.(slot.label);
      setDialogOpen(false);
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col items-center gap-2 sm:gap-3 rounded-xl border-2 p-3 sm:p-5 transition-all duration-300 animate-slide-up",
          config.cardClass
        )}
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="flex w-full items-center justify-between">
          <span className="font-heading text-base sm:text-lg font-bold text-foreground">{slot.label}</span>
          <span className={cn("rounded-full px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold", config.badgeClass)}>
            {config.badge}
          </span>
        </div>

        <div className={cn("rounded-xl p-2 sm:p-4 transition-transform duration-300 group-hover:scale-110", config.iconClass)}>
          <Icon className="h-6 w-6 sm:h-10 sm:w-10" strokeWidth={1.5} />
        </div>

        {slot.status === "available" && (
          <Button
            size="sm"
            className="w-full bg-primary hover:bg-primary/90 text-xs sm:text-sm"
            onClick={() => setDialogOpen(true)}
          >
            Book
          </Button>
        )}
        {slot.status === "booked" && (
          <Button size="sm" className="w-full text-xs sm:text-sm" disabled>
            Booked
          </Button>
        )}
        {slot.status === "occupied" && (
          <Button size="sm" className="w-full text-xs sm:text-sm" disabled>
            Occupied
          </Button>
        )}
      </div>

      <BookingDialog
        open={dialogOpen}
        slotId={slot.id}
        slotLabel={slot.label}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleBookingConfirm}
      />
    </>
  );
};

export default ParkingSlotCard;
