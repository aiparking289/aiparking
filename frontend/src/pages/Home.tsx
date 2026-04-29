import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Clock, Shield } from "lucide-react";

const features = [
  { icon: MapPin, title: "Real-Time Detection", desc: "Live sensor data updates every few seconds" },
  { icon: Clock, title: "Instant Booking", desc: "Reserve your spot in a single tap" },
  { icon: Shield, title: "Secure & Reliable", desc: "Smart city grade infrastructure" },
];

const Home = () => (
  <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
    <div className="animate-fade-in space-y-4 sm:space-y-6 max-w-2xl">
      <div className="mx-auto flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-2xl bg-primary/10">
        <Car className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
      </div>

      <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Techno Slot
        <span className="block text-primary">Seeker</span>
      </h1>

      <p className="mx-auto max-w-md text-base sm:text-lg text-muted-foreground">
        Find and book parking slots in real-time. AI-powered sensors detect availability so you never circle the lot again.
      </p>

      <Button asChild size="lg" className="px-8 text-base">
        <Link to="/dashboard">View Parking</Link>
      </Button>

      <div className="grid gap-3 sm:gap-4 pt-8 sm:pt-12 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="animate-slide-up rounded-xl border bg-card p-4 sm:p-5 text-left shadow-sm"
            style={{ animationDelay: `${200 + i * 100}ms` }}
          >
            <Icon className="mb-2 sm:mb-3 h-5 sm:h-6 w-5 sm:w-6 text-primary" />
            <h3 className="font-heading text-sm sm:text-base font-semibold">{title}</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Home;
