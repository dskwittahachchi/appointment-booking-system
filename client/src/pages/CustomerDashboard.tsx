import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, Heart, Sparkles } from "lucide-react";
import { format, isAfter } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Appointment, Service } from "../types";
import { Avatar, EmptyState, PageLoader, ServiceGlyph, StatusBadge } from "../components/UI";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api<Appointment[]>("/appointments"), api<Service[]>("/services")])
      .then(([appointmentResponse, serviceResponse]) => {
        setAppointments(appointmentResponse.data);
        setServices(serviceResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const nextAppointment = useMemo(() => appointments.find((item) => !["cancelled", "completed", "no-show"].includes(item.status) && isAfter(new Date(item.startAt), new Date())), [appointments]);
  if (loading) return <PageLoader label="Gathering your care plan" />;

  return (
    <div className="dashboard-page customer-dashboard">
      <header className="page-heading">
        <div><p className="eyebrow">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}</p><h1>How are you feeling, {user?.name.split(" ")[0]}?</h1><p>Everything you need for your next step, in one calm place.</p></div>
        <Link className="button button-dark" to="/app/book"><CalendarDays size={17} /> Book care</Link>
      </header>

      <div className="customer-dashboard-grid">
        <section className="panel next-care-panel">
          <div className="panel-heading"><div><p className="eyebrow">Up next</p><h2>Your next appointment</h2></div><Link to="/app/appointments">View all <ArrowRight size={15} /></Link></div>
          {nextAppointment ? (
            <article className="next-appointment-card">
              <div className="date-tile"><small>{format(new Date(nextAppointment.startAt), "MMM")}</small><strong>{format(new Date(nextAppointment.startAt), "d")}</strong><span>{format(new Date(nextAppointment.startAt), "EEE")}</span></div>
              <div className="next-appointment-main">
                <div className="next-title"><span><StatusBadge status={nextAppointment.status} /><h3>{nextAppointment.service?.name}</h3></span><button className="icon-button" aria-label="Save appointment"><Heart size={18} /></button></div>
                <div className="provider-inline"><Avatar initials={nextAppointment.provider?.avatar} /><span><strong>{nextAppointment.provider?.displayName}</strong><small>{nextAppointment.provider?.title}</small></span></div>
                <div className="appointment-info-row"><span><Clock3 size={15} /> {format(new Date(nextAppointment.startAt), "h:mm a")} – {format(new Date(nextAppointment.endAt), "h:mm a")}</span><span>{nextAppointment.provider?.location}</span></div>
              </div>
            </article>
          ) : <EmptyState title="Your calendar is open" message="Book your next check-in whenever you’re ready." action={<Link className="button button-outline" to="/app/book">Find an appointment</Link>} />}
        </section>

        <aside className="panel care-score-panel">
          <div className="sparkle-mark"><Sparkles size={20} /></div><p className="eyebrow">Care rhythm</p><strong>You're on track</strong><p>One upcoming appointment and no follow-ups waiting.</p>
          <div className="progress-ring"><span>82<small>%</small></span></div>
          <small>Keep showing up for yourself.</small>
        </aside>
      </div>

      <section className="dashboard-section">
        <div className="panel-heading"><div><p className="eyebrow">Explore care</p><h2>What can we help with?</h2></div><Link to="/app/book">Browse all <ArrowRight size={15} /></Link></div>
        <div className="dashboard-service-grid">
          {services.map((service) => <Link to={`/app/book?service=${service._id}`} key={service._id} className={`mini-service accent-bg-${service.accent}`}><ServiceGlyph icon={service.icon} accent={service.accent} /><span><strong>{service.name}</strong><small>{service.durationMinutes} min · from ${service.price}</small></span><ArrowRight size={16} /></Link>)}
        </div>
      </section>

      <section className="wellness-note"><div className="wellness-illustration"><span /><span /></div><div><p className="eyebrow">A note for today</p><blockquote>Rest is not a reward. It is part of the work.</blockquote><small>Your gentle reminder from NovaCare</small></div></section>
    </div>
  );
}
