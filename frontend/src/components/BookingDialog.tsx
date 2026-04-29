import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface BookingDialogProps {
  open: boolean;
  slotId: number;
  slotLabel: string;
  onClose: () => void;
  onConfirm: (userName: string, userEmail: string, userPhone: string) => Promise<void>;
}

const BookingDialog = ({ open, slotId, slotLabel, onClose, onConfirm }: BookingDialogProps) => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim() || !userEmail.trim() || !userPhone.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(userName, userEmail, userPhone);
      setUserName("");
      setUserEmail("");
      setUserPhone("");
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to book slot";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setUserName("");
      setUserEmail("");
      setUserPhone("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-lg sm:max-w-md mx-2 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">Book Slot {slotLabel}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Enter your details to reserve slot {slotLabel}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (with country code)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              disabled={loading}
              required
            />
            <p className="text-[10px] text-muted-foreground italic">Include country code (e.g. +91) for SMS acknowledgement</p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
