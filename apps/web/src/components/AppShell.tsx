import { BarChart3, Box, FileText, Home, LogOut, Settings, Target } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { queryKeys } from "../lib/queryKeys";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/items", label: "Items", icon: Box },
  { to: "/logs", label: "Logs", icon: FileText },
  { to: "/targets", label: "Targets", icon: Target },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppShell() {
  const auth = useAuth();
  const navigate = useNavigate();
  const health = useQuery({
    queryKey: queryKeys.health,
    queryFn: api.health,
    refetchInterval: 30_000,
    retry: 1,
  });

  return (
    <div className="app-shell">
      {/* Sidebar for Desktop / Landscape */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="header-title">
            <span id="sidebar-logo-text">Smoke Tracker</span>
            <small className={health.isError ? "cloud-status offline" : "cloud-status"}>
              {health.isError ? "Cloud offline" : "Cloud connected"}
            </small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="sidebar-nav-item"
              id={`sidebar-nav-${item.label.toLowerCase()}`}
            >
              <item.icon aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-action-btn"
            type="button"
            aria-label="Settings"
            onClick={() => navigate("/settings")}
            id="sidebar-settings-btn"
          >
            <Settings aria-hidden="true" />
            <span>Settings</span>
          </button>
          <button
            className="sidebar-action-btn danger"
            type="button"
            aria-label="Log out"
            onClick={() => {
              auth.logout().then(() => navigate("/login"));
            }}
            id="sidebar-logout-btn"
          >
            <LogOut aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Header for Mobile / Portrait */}
      <header className="app-header">
        <div className="header-title">
          <span id="mobile-logo-text">Smoke Tracker</span>
          <small className={health.isError ? "cloud-status offline" : "cloud-status"}>
            {health.isError ? "Cloud offline" : "Cloud connected"}
          </small>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Settings"
            onClick={() => navigate("/settings")}
            id="mobile-settings-btn"
          >
            <Settings aria-hidden="true" />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Log out"
            onClick={() => {
              auth.logout().then(() => navigate("/login"));
            }}
            id="mobile-logout-btn"
          >
            <LogOut aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="content">
        <Outlet />
      </main>

      {/* Bottom Nav for Mobile / Portrait */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} id={`mobile-nav-${item.label.toLowerCase()}`}>
            <item.icon aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
