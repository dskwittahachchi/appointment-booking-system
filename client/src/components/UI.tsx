import { CalendarDays, HeartPulse, Leaf, Sparkles, Stethoscope } from "lucide-react";
import type { AppointmentStatus, Service } from "../types";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand" aria-label="NovaCare home">
      <span className="brand-mark" aria-hidden="true"><HeartPulse size={19} strokeWidth={2.4} /></span>
      {compact ? null : <span>nova<span>care</span></span>}
    </span>
  );
}

export function Avatar({ initials, size = "md", tone = "sage" }: { initials?: string; size?: "sm" | "md" | "lg" | "xl"; tone?: string }) {
  return <span className={`avatar avatar-${size} avatar-${tone}`} aria-hidden="true">{initials || "NC"}</span>;
}

export function ServiceGlyph({ icon, accent = "sage" }: Pick<Service, "icon" | "accent">) {
  const icons = { stethoscope: Stethoscope, heart: HeartPulse, leaf: Leaf, sparkles: Sparkles };
  const Icon = icons[icon as keyof typeof icons] || CalendarDays;
  return <span className={`service-glyph accent-${accent}`}><Icon size={24} strokeWidth={1.8} /></span>;
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const labels: Record<AppointmentStatus, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    "no-show": "No show",
  };
  return <span className={`status status-${status}`}>{labels[status]}</span>;
}

export function PageLoader({ label = "Preparing your experience" }: { label?: string }) {
  return (
    <div className="page-loader" role="status">
      <span className="loader-orbit" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><CalendarDays size={25} /></span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function MetricCard({ label, value, detail, icon }: { label: string; value: string | number; detail: string; icon: React.ReactNode }) {
  return (
    <article className="metric-card">
      <span className="metric-icon">{icon}</span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
