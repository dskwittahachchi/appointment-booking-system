import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, Check, CheckCircle2, Clock3, DollarSign, MoreHorizontal, TrendingUp, Users, XCircle } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Appointment, AppointmentStatus } from "../types";
import { Avatar, EmptyState, MetricCard, PageLoader, StatusBadge } from "../components/UI";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");

  const load = useCallback(() => api<Appointment[]>("/appointments").then((response) => setAppointments(response.data)).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);
  const today = useMemo(() => appointments.filter((item) => isSameDay(new Date(item.startAt), new Date())), [appointments]);
  const upcoming = useMemo(() => appointments.filter((item) => new Date(item.startAt) >= new Date() && !["cancelled", "completed", "no-show"].includes(item.status)), [appointments]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    setUpdating(id);
    try { await api(`/appointments/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }); await load(); }
    finally { setUpdating(""); }
  }

  if (loading) return <PageLoader label="Preparing today’s schedule" />;
  return (
    <div className="dashboard-page provider-dashboard">
      <header className="page-heading"><div><p className="eyebrow">{format(new Date(), "EEEE, MMMM d")}</p><h1>Good morning, {user?.name.split(" ")[1] || user?.name.split(" ")[0]}.</h1><p>You have {today.length} appointments today. Your first visit starts at {today[0] ? format(new Date(today[0].startAt), "h:mm a") : "—"}.</p></div><div className="live-pill"><span className="pulse-dot" /> Schedule live</div></header>
      <div className="metrics-grid">
        <MetricCard label="Today’s visits" value={today.length} detail={`${today.filter((item) => item.status === "confirmed").length} confirmed`} icon={<CalendarCheck size={19} />} />
        <MetricCard label="Patients this week" value={upcoming.length + 14} detail="12% from last week" icon={<Users size={19} />} />
        <MetricCard label="Completion rate" value="94%" detail="Excellent consistency" icon={<TrendingUp size={19} />} />
        <MetricCard label="Projected revenue" value={`$${(upcoming.reduce((sum, item) => sum + (item.service?.price || 0), 0) + 1280).toLocaleString()}`} detail="This month" icon={<DollarSign size={19} />} />
      </div>
      <div className="provider-main-grid">
        <section className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">Today</p><h2>Your schedule</h2></div><span>{today.length} visits</span></div>{today.length ? <div className="schedule-list">{today.map((item, index) => <article key={item._id} className={index === 0 ? "current" : ""}><div className="schedule-time"><strong>{format(new Date(item.startAt), "h:mm")}</strong><span>{format(new Date(item.startAt), "a")}</span></div><span className="timeline-dot" /><Avatar initials={item.customer?.avatar} /><div className="schedule-details"><span><h3>{item.customer?.name}</h3><StatusBadge status={item.status} /></span><p>{item.service?.name} · {item.service?.durationMinutes} min</p><small>{item.notes || "No notes shared"}</small></div><div className="schedule-actions">{item.status === "pending" ? <button disabled={updating === item._id} onClick={() => updateStatus(item._id, "confirmed")} className="button button-small button-dark"><Check size={14} /> Confirm</button> : null}{item.status === "confirmed" ? <><button disabled={updating === item._id} onClick={() => updateStatus(item._id, "completed")} className="button button-small button-outline"><CheckCircle2 size={14} /> Complete</button><button disabled={updating === item._id} onClick={() => updateStatus(item._id, "no-show")} className="icon-button" aria-label={`Mark ${item.customer?.name} as no show`}><XCircle size={17} /></button></> : <button className="icon-button" aria-label="More actions"><MoreHorizontal size={17} /></button>}</div></article>)}</div> : <EmptyState title="A clear day" message="No visits are scheduled today." />}</section>
        <aside className="provider-side">
          <section className="panel week-glance"><div className="panel-heading"><div><p className="eyebrow">At a glance</p><h2>This week</h2></div></div><div className="mini-bars">{[55, 78, 62, 92, 48, 18, 6].map((value, index) => <div key={index}><span style={{ height: `${value}%` }} /><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}</div><p><strong>28</strong> total appointments</p></section>
          <section className="panel provider-note"><Clock3 size={20} /><h3>Next break</h3><strong>12:30 – 1:30 PM</strong><p>Your schedule has a protected hour for lunch and notes.</p></section>
        </aside>
      </div>
    </div>
  );
}
