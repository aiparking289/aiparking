import { useState, useEffect, useCallback } from "react";
import { fetchAvailableSlots, bookSlot as apiBookSlot } from "@/lib/api";

export type SlotStatus = "free" | "occupied" | "booked";

export interface ParkingSlot {
  id: number;
  label: string;
  status: SlotStatus;
}

const mapSlotId = (id: number): string => {
  // Map slot ID to label format like A1, A2, etc.
  const row = String.fromCharCode(65 + Math.floor((id - 1) / 6));
  const col = ((id - 1) % 6) + 1;
  return `${row}${col}`;
};

export const useParkingSlots = () => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    try {
      const data = await fetchAvailableSlots();
      const mappedSlots: ParkingSlot[] = data.map((slot) => ({
        id: slot.id,
        label: mapSlotId(slot.id),
        status: slot.status === "free" ? "available" : slot.status,
      }));
      setSlots(mappedSlots);
      setError(null);
      setLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch slots";
      setError(errorMsg);
      console.error("Error fetching slots:", err);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(fetchSlots, 800);
    return () => clearTimeout(timer);
  }, [fetchSlots]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchSlots, 5000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  const bookSlot = async (id: number, userName: string, userEmail: string, userPhone?: string) => {
    try {
      await apiBookSlot(id, userName, userEmail, userPhone);
      // Refresh slots after booking
      await fetchSlots();
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to book slot";
      setError(errorMsg);
      throw err;
    }
  };

  const stats = {
    total: slots.length,
    available: slots.filter((s) => s.status === "available").length,
    occupied: slots.filter((s) => s.status === "occupied").length,
    booked: slots.filter((s) => s.status === "booked").length,
  };

  return { slots, loading, bookSlot, stats, error };
};
