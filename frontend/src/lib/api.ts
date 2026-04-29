const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface SlotData {
  id: number;
  status: "free" | "occupied" | "booked";
}

export interface BookingData {
  id: number;
  slot_id: number;
  user_name: string;
  user_email: string;
  user_phone?: string;
  booking_date: string;
  is_active: boolean;
}

// Fetch available slots (with real-time YOLO detection)
export const fetchAvailableSlots = async (): Promise<SlotData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/available-slots`);
    if (!response.ok) {
      throw new Error("Failed to fetch slots");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching slots:", error);
    throw error;
  }
};

// Get current bookings
export const fetchBookings = async (): Promise<BookingData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`);
    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

// Book a slot
export const bookSlot = async (
  slotId: number,
  userName: string,
  userEmail: string,
  userPhone?: string
): Promise<BookingData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slot_id: slotId,
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to book slot");
    }

    const data = await response.json();
    return data.booking;
  } catch (error) {
    console.error("Error booking slot:", error);
    throw error;
  }
};

// Cancel a booking
export const cancelBooking = async (bookingId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to cancel booking");
    }
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

// Get booked slots only
export const fetchBookedSlots = async (): Promise<number[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/booked-slots`);
    if (!response.ok) {
      throw new Error("Failed to fetch booked slots");
    }
    const data = await response.json();
    return data.booked_slots || [];
  } catch (error) {
    console.error("Error fetching booked slots:", error);
    throw error;
  }
};

// Get live status (for backward compatibility)
export const fetchLiveStatus = async (): Promise<SlotData[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`);
    if (!response.ok) {
      throw new Error("Failed to fetch live status");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching live status:", error);
    throw error;
  }
};
