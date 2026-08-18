import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, MoreHorizontal, RefreshCw, Trash2, X } from "lucide-react";
import { addDays, format, isAfter } from "date-fns";
import { Link } from "react-router-dom";
import { Avatar, EmptyState, PageLoader, StatusBadge } from "../components/UI";
import { api } from "../lib/api";
import type { Appointment, Slot } from "../types";

type Dialog = { type: "cancel" | "reschedule"; appointment: Appointment } | null;

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");

  const loadAppointments = useCallback(() => api<Appointment[]>("/appointments").then((response) => setAppointments(response.data)).finally(() => setLoading(false)), []);
  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  useEffect(() => {
    if (dialog?.type !== "reschedule") return;
    const item = dialog.appointment;
    api<Slot[]>(`/availability/slots?providerId=${item.provider?._id || item.providerId}&serviceId=${item.service?._id || item.serviceId}&date=${date}&excludeAppointmentId=${item._id}`)
      .then((response) => setSlots(response.data));
  }, [date, dialog]);

  const visible = useMemo(() => appointments.filter((item) => filter === "all" || (filter === "upcoming" ? isAfter(new Date(item.startAt), new Date()) && !["cancelled", "completed", "no-show"].includes(item.status) : ["completed", "cancelled", "no-show"].includes(item.status))), [appointments, filter]);

  async function cancel() {
    if (!dialog) return;
    await api(`/appointments/${dialog.appointment._id}`, { method: "DELETE" });
    setDialog(null); setMessage("Appointment cancelled. The time is available again."); await loadAppointments();
  }

  async function reschedule() {
    if (!dialog || !selectedSlot) return;
    await api(`/appointments/${dialog.appointment._id}/reschedule`, { method: "PUT", body: JSON.stringify({ startAt: selectedSlot }) });
    setDialog(null); setSelectedSlot(""); setMessage("Appointment moved. We’ve saved your new time."); await loadAppointments();
  }

  if (loading) return <PageLoader label="Opening your appointment history" />;
  return (
    <div className="dashboard-page appointments-page">
      <header className="page-heading"><div><p className="eyebrow">My care</p><h1>Appointments</h1><p>Everything upcoming, completed, and changed along the way.</p></div><Link className="button button-dark" to="/app/book"><CalendarDays size={17} /> Book care</Link></header>
      {message ? <div className="success-banner"><Check size={17} /> {message}<button onClick={() => setMessage("")} aria-label="Dismiss"><X size={15} /></button></div> : null}
      <div className="filter-tabs" role="tablist" aria-label="Filter appointments">{[["upcoming", "Upcoming"], ["past", "Past"], ["all", "All"]].map(([value, label]) => <button role="tab" aria-selected={filter === value} className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      <section className="appointment-list">
        {visible.length ? visible.map((item) => <article className="appointment-list-card" key={item._id}><div className="appointment-date-column"><span>{format(new Date(item.startAt), "MMM")}</span><strong>{format(new Date(item.startAt), "d")}</strong><small>{format(new Date(item.startAt), "EEE")}</small></div><div className="appointment-card-core"><div><StatusBadge status={item.status} /><h2>{item.service?.name}</h2></div><div className="provider-inline"><Avatar initials={item.provider?.avatar} /><span><strong>{item.provider?.displayName}</strong><small>{item.provider?.title}</small></span></div><div className="appointment-info-row"><span><Clock3 size={15} /> {format(new Date(item.startAt), "h:mm a")} – {format(new Date(item.endAt), "h:mm a")}</span><span>{item.provider?.location}</span></div></div><div className="appointment-actions">{["pending", "confirmed"].includes(item.status) ? <><button className="button button-outline" onClick={() => { setDialog({ type: "reschedule", appointment: item }); setDate(format(addDays(new Date(), 1), "yyyy-MM-dd")); }}><RefreshCw size={15} /> Reschedule</button><button className="icon-button danger" onClick={() => setDialog({ type: "cancel", appointment: item })} aria-label={`Cancel ${item.service?.name}`}><Trash2 size={17} /></button></> : <button className="icon-button" aria-label="Appointment details"><MoreHorizontal size={18} /></button>}</div></article>) : <EmptyState title="Nothing here yet" message={filter === "upcoming" ? "Your upcoming appointments will appear here." : "No appointments match this view."} action={<Link className="button button-outline" to="/app/book">Find care</Link>} />}
      </section>
      {dialog ? <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="modal-close icon-button" onClick={() => setDialog(null)} aria-label="Close"><X size={18} /></button>{dialog.type === "cancel" ? <><span className="modal-icon danger"><Trash2 size={22} /></span><p className="eyebrow">Please confirm</p><h2 id="dialog-title">Cancel this appointment?</h2><p>{dialog.appointment.service?.name} with {dialog.appointment.provider?.displayName} on {format(new Date(dialog.appointment.startAt), "MMMM d 'at' h:mm a")}.</p><div className="button-row"><button className="button button-danger" onClick={cancel}>Yes, cancel it</button><button className="button button-outline" onClick={() => setDialog(null)}>Keep appointment</button></div></> : <><span className="modal-icon"><RefreshCw size={22} /></span><p className="eyebrow">Choose a new time</p><h2 id="dialog-title">Reschedule appointment</h2><label className="modal-date"><span>New date</span><input type="date" min={format(addDays(new Date(), 1), "yyyy-MM-dd")} value={date} onChange={(event) => { setDate(event.target.value); setSelectedSlot(""); }} /></label><div className="slot-grid modal-slots">{slots.map((item) => <button className={selectedSlot === item.startAt ? "selected" : ""} key={item.startAt} onClick={() => setSelectedSlot(item.startAt)}>{item.label}</button>)}</div><div className="button-row"><button className="button button-dark" disabled={!selectedSlot} onClick={reschedule}>Save new time</button><button className="button button-outline" onClick={() => setDialog(null)}>Not now</button></div></>}</section></div> : null}
    </div>
  );
}
