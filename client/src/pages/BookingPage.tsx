import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, MapPin, ShieldCheck, Star } from "lucide-react";
import { addDays, format } from "date-fns";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, PageLoader, ServiceGlyph } from "../components/UI";
import { api } from "../lib/api";
import type { Appointment, Provider, Service, Slot } from "../types";

export default function BookingPage() {
  const [params] = useSearchParams();
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [serviceId, setServiceId] = useState(params.get("service") || "");
  const [providerId, setProviderId] = useState(params.get("provider") || "");
  const [date, setDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api<Service[]>("/services").then((response) => setServices(response.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!serviceId) return;
    api<Provider[]>(`/providers?serviceId=${encodeURIComponent(serviceId)}`).then((response) => {
      setProviders(response.data);
      setProviderId((current) => current && response.data.some((item) => item._id === current) ? current : "");
    });
  }, [serviceId]);

  useEffect(() => {
    if (!providerId || !serviceId || !date) return;
    let active = true;
    Promise.resolve().then(() => { if (active) setSlotLoading(true); });
    api<Slot[]>(`/availability/slots?providerId=${encodeURIComponent(providerId)}&serviceId=${encodeURIComponent(serviceId)}&date=${date}`)
      .then((response) => { if (active) setSlots(response.data); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Unable to load times"); })
      .finally(() => { if (active) setSlotLoading(false); });
    return () => { active = false; };
  }, [providerId, serviceId, date]);

  const service = services.find((item) => item._id === serviceId);
  const provider = providers.find((item) => item._id === providerId);
  const dates = useMemo(() => Array.from({ length: 8 }, (_, index) => addDays(new Date(), index + 1)), []);

  async function submitBooking() {
    if (!slot || !service || !provider) return;
    setError(""); setSubmitting(true);
    try {
      const response = await api<Appointment>("/appointments", { method: "POST", body: JSON.stringify({ providerId, serviceId, startAt: slot.startAt, notes }) });
      setConfirmed(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to book this appointment");
    } finally { setSubmitting(false); }
  }

  if (loading) return <PageLoader label="Opening the appointment book" />;
  if (confirmed) return <div className="booking-confirmation"><span className="confirmation-check"><Check size={34} /></span><p className="eyebrow">Appointment requested</p><h1>You’re all set.</h1><p>We’ve saved your {confirmed.service?.name.toLowerCase()} with {confirmed.provider?.displayName}.</p><article><div className="date-tile"><small>{format(new Date(confirmed.startAt), "MMM")}</small><strong>{format(new Date(confirmed.startAt), "d")}</strong><span>{format(new Date(confirmed.startAt), "EEE")}</span></div><div><strong>{format(new Date(confirmed.startAt), "EEEE, MMMM d")}</strong><span>{format(new Date(confirmed.startAt), "h:mm a")} · {confirmed.provider?.location}</span></div></article><div className="button-row"><button className="button button-dark" onClick={() => navigate("/app/appointments")}>View my appointments</button><button className="button button-outline" onClick={() => { setConfirmed(null); setSlot(null); }}>Book another</button></div></div>;

  return (
    <div className="dashboard-page booking-page">
      <header className="page-heading compact"><div><Link className="back-link" to="/app"><ArrowLeft size={15} /> Overview</Link><p className="eyebrow">New appointment</p><h1>Find a time that feels right.</h1><p>Choose your care, specialist, and a live available time.</p></div></header>
      <div className="booking-layout">
        <div className="booking-form">
          <section className="booking-step"><div className="step-title"><span>1</span><div><h2>What brings you in?</h2><p>Choose the type of care you’d like.</p></div></div><div className="booking-service-grid">{services.map((item) => <button className={serviceId === item._id ? "selected" : ""} key={item._id} onClick={() => { setServiceId(item._id); setProviderId(""); setProviders([]); setSlot(null); setSlots([]); }}><ServiceGlyph icon={item.icon} accent={item.accent} /><span><strong>{item.name}</strong><small>{item.durationMinutes} min · ${item.price}</small></span>{serviceId === item._id ? <Check size={17} /> : null}</button>)}</div></section>
          {service ? <section className="booking-step"><div className="step-title"><span>2</span><div><h2>Who would you like to see?</h2><p>Every specialist is verified by our team.</p></div></div><div className="booking-provider-list">{providers.map((item) => <button className={providerId === item._id ? "selected" : ""} key={item._id} onClick={() => { setProviderId(item._id); setSlot(null); setSlots([]); }}><Avatar initials={item.avatar} size="lg" tone={item._id.includes("marcus") ? "lilac" : "sage"} /><span><strong>{item.displayName}</strong><small>{item.title}</small><em><Star size={12} fill="currentColor" /> {item.rating} · {item.reviewCount} reviews</em></span>{providerId === item._id ? <span className="selection-check"><Check size={15} /></span> : null}</button>)}</div></section> : null}
          {provider ? <section className="booking-step"><div className="step-title"><span>3</span><div><h2>When works for you?</h2><p>Times shown are live and held only when you confirm.</p></div></div><div className="date-strip">{dates.map((item) => { const value = format(item, "yyyy-MM-dd"); return <button className={date === value ? "selected" : ""} key={value} onClick={() => { setDate(value); setSlot(null); setSlots([]); }}><small>{format(item, "EEE")}</small><strong>{format(item, "d")}</strong><span>{format(item, "MMM")}</span></button>; })}</div><div className="slot-area"><div className="slot-label"><Clock3 size={16} /> Available times</div>{slotLoading ? <div className="slot-skeleton"><span /><span /><span /><span /></div> : slots.length ? <div className="slot-grid">{slots.map((item) => <button key={item.startAt} className={slot?.startAt === item.startAt ? "selected" : ""} onClick={() => setSlot(item)}>{item.label}{slot?.startAt === item.startAt ? <Check size={13} /> : null}</button>)}</div> : <p className="empty-times">No openings on this date. Try another day.</p>}</div></section> : null}
          {slot ? <section className="booking-step"><div className="step-title"><span>4</span><div><h2>Anything you’d like to share?</h2><p>Optional—this helps your specialist prepare.</p></div></div><label className="notes-field"><span>Notes for your specialist</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} placeholder="A short note about what you'd like to discuss…" /><small>{notes.length}/1000</small></label></section> : null}
        </div>
        <aside className="booking-summary"><p className="eyebrow">Your appointment</p><h2>A little preview</h2>{service ? <div className="summary-service"><ServiceGlyph icon={service.icon} accent={service.accent} /><span><strong>{service.name}</strong><small>{service.durationMinutes} minutes</small></span></div> : <p className="summary-placeholder">Your choices will appear here as you go.</p>}{provider ? <div className="summary-row"><Avatar initials={provider.avatar} size="sm" /><span><small>Specialist</small><strong>{provider.displayName}</strong></span></div> : null}{slot ? <><div className="summary-row"><CalendarDays size={18} /><span><small>Date & time</small><strong>{format(new Date(slot.startAt), "EEE, MMM d · h:mm a")}</strong></span></div><div className="summary-row"><MapPin size={18} /><span><small>Location</small><strong>{provider?.location}</strong></span></div></> : null}{error ? <div className="form-error" role="alert">{error}</div> : null}<button className="button button-dark button-full" disabled={!slot || submitting} onClick={submitBooking}>{submitting ? "Securing your time…" : "Request appointment"}<ArrowRight size={17} /></button><small className="summary-secure"><ShieldCheck size={14} /> Your slot is verified again before booking.</small></aside>
      </div>
    </div>
  );
}
