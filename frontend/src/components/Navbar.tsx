import { Link, useLocation } from "react-router-dom";
import { Car, LayoutDashboard, Home, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { pathname } = useLocation();

  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin", label: "Admin", icon: ShieldAlert },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">    
      <div className="container flex h-14 sm:h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-1 sm:gap-2 font-heading text-sm sm:text-lg font-bold">
          <div className="flex h-8 sm:h-9 w-8 sm:w-9 items-center justify-center rounded-lg bg-primary">
            <Car className="h-4 sm:h-5 w-4 sm:w-5 text-primary-foreground" />
          </div>
          <span className="hidden xs:inline">Techno Slot Seeker</span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors",
                pathname === to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3 sm:h-4 w-3 sm:w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
