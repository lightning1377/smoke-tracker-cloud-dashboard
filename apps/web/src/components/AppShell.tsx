import {
  BarChart3,
  Download,
  Gauge,
  ListChecks,
  Settings,
  Target,
  Timer
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/items", label: "Items", icon: ListChecks },
  { to: "/logs", label: "Logs", icon: Timer },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/exports", label: "Exports", icon: Download },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function AppShell() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <BarChart3 aria-hidden="true" />
          <span>Smoke Tracker Cloud</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <item.icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
