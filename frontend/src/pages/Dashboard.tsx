import { useParkingSlots } from "@/hooks/useParkingSlots";
import ParkingSlotCard from "@/components/ParkingSlotCard";
import StatsBar from "@/components/StatsBar";
import StatusLegend from "@/components/StatusLegend";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { sendBookingAcknowledgement } from "@/lib/emailService";

const Dashboard = () => {
  const { slots, loading, bookSlot, stats, error } = useParkingSlots();
  const { toast } = useToast();

  const handleBook = async (id: number, userName: string, userEmail: string, userPhone: string) => {
    try {
      await bookSlot(id, userName, userEmail, userPhone);
      const slot = slots.find((s) => s.id === id);
      const slotLabel = slot?.label || `Slot ${id}`;
      
      // Send acknowledgement email
      let emailSent = false;
      try {
        await sendBookingAcknowledgement(userName, userEmail, userPhone, slotLabel);
        console.log("Acknowledgement email sent");
        emailSent = true;
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
        toast({
          title: "Email Notification Delayed",
          description: "Slot booked, but we couldn't send the email right now. Please check your console.",
          variant: "destructive",
        });
      }

      toast({
        title: "Slot Booked!",
        description: emailSent 
          ? `Parking slot ${slotLabel} has been reserved successfully for ${userName}. Confirmation sent to ${userEmail}.`
          : `Parking slot ${slotLabel} has been reserved successfully for ${userName}.`,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to book slot";
      toast({
        title: "Booking Failed",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    }
  };

  return (
    <div className="container py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">Parking Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Real-time slot availability · Auto-refreshes every 5s</p>
        </div>
        <StatusLegend />
      </div>

      <StatsBar stats={stats} />

      {error && (
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-destructive flex-shrink-0 mt-0.5" />    
          <div>
            <p className="font-semibold text-destructive text-sm">Connection Error</p>  
            <p className="text-xs sm:text-sm text-destructive/80">{error}</p>
            <p className="text-xs text-destructive/60 mt-1">Flask backend on http://localhost:5000</p>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {slots.map((slot, i) => (
            <ParkingSlotCard
              key={slot.id}
              slot={slot}
              onBook={handleBook}
              onBookingSuccess={(label) => {
                console.log(`Slot ${label} booked successfully`);
              }}
              index={i}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
        Live · Data refreshing automatically from YOLO detection
      </div>
    </div>
  );
};

export default Dashboard;
