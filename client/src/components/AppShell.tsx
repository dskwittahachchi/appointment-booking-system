import { useState, type ReactNode } from "react";
import { CalendarCheck, CalendarPlus, ChevronDown, Clock3, LayoutDashboard, LogOut, Menu, Settings2, Stethoscope, Users, X } from "lucide-react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { Avatar, Logo } from "./UI";

const roleLinks: Record<Role, Array<{ to: string; label: string; icon: typeof LayoutDashboard }>> = {
  customer: [
    { to: "/app", label: "Overview", icon: LayoutDashboard },
    { to: "/app/appointments", label: "Appointments", icon: CalendarCheck },
    { to: "/app/book", label: "Book care", icon: CalendarPlus },
  ],
  provider: [
    { to: "/provider", label: "Today", icon: LayoutDashboard },
    { to: "/provider/appointments", label: "Appointments", icon: CalendarCheck },
    { to: "/provider/availability", label: "Availability", icon: Clock3 },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/services", label: "Services", icon: Stethoscope },
    { to: "/admin/users", label: "People", icon: Users },
    { to: "/admin/settings", label: "Settings", icon: Settings2 },
  ],
};

export function PublicLayout({ children }: { children?: ReactNode }) {
  const { user } = useAuth();
  const destination = user?.role === "provider" ? "/provider" : user?.role === "admin" ? "/admin" : "/app";
  return (
    <div className="public-shell">
      <header className="public-header">
        <Link to="/" className="logo-link"><Logo /></Link>
        <nav aria-label="Main navigation">
          <a href="/#services">Services</a>
          <a href="/#specialists">Specialists</a>
          <a href="/#how-it-works">How it works</a>
        </nav>
        <div className="header-actions">
          {user ? <Link className="button button-ghost" to={destination}>Open dashboard</Link> : <Link className="text-link" to="/login">Sign in</Link>}
          <Link className="button button-dark" to={user ? "/app/book" : "/login?intent=book"}>Book an appointment</Link>
        </div>
      </header>
      {children || <Outlet />}
    </div>
  );
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    const destination = user.role === "provider" ? "/provider" : user.role === "admin" ? "/admin" : "/app";
    return <Navigate to={destination} replace />;
  }
  return <Outlet />;
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const links = roleLinks[user.role];

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Link to="/" className="logo-link"><Logo /></Link>
          <button className="icon-button mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>
        <p className="sidebar-label">Workspace</p>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to.split("/").length === 2} onClick={() => setOpen(false)}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className="eyebrow">Need a hand?</span>
          <p>Our care team usually replies in under five minutes.</p>
          <button className="text-button">Start a conversation</button>
        </div>
        <button className="sidebar-profile" onClick={logout} title="Sign out">
          <Avatar initials={user.avatar} size="sm" />
          <span><strong>{user.name}</strong><small>{user.role}</small></span>
          <LogOut size={16} />
        </button>
      </aside>
      {open ? <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <span className="topbar-context">{user.role === "customer" ? "My care" : user.role === "provider" ? "Provider studio" : "Operations"}</span>
          <button className="topbar-profile"><Avatar initials={user.avatar} size="sm" /><span>{user.name.split(" ")[0]}</span><ChevronDown size={14} /></button>
        </header>
        <div className="dashboard-content"><Outlet /></div>
      </main>
    </div>
  );
}
