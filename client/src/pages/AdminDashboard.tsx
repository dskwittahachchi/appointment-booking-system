import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, CalendarCheck, Check, Plus, Search, Stethoscope, UserCheck, Users, X } from "lucide-react";
import { api } from "../lib/api";
import type { Provider, Service } from "../types";
import { Avatar, MetricCard, PageLoader, ServiceGlyph } from "../components/UI";

interface Overview { users: number; providers: number; services: number; appointments: number; pendingProviders: number }
const blankService = { name: "", description: "", durationMinutes: 30, price: 80, category: "Primary care", icon: "sparkles", accent: "sage" as const };

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blankService);
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([api<Overview>("/admin/overview"), api<Service[]>("/services"), api<Provider[]>("/providers")]).then(([overviewResponse, servicesResponse, providersResponse]) => {
      setOverview(overviewResponse.data); setServices(servicesResponse.data); setProviders(providersResponse.data);
    });
  }
  useEffect(load, []);

  async function createService(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try { await api("/admin/services", { method: "POST", body: JSON.stringify(form) }); setModal(false); setForm(blankService); load(); }
    finally { setSaving(false); }
  }

  if (!overview) return <PageLoader label="Gathering platform health" />;
  return (
    <div className="dashboard-page admin-dashboard">
      <header className="page-heading"><div><p className="eyebrow">NovaCare operations</p><h1>Platform overview</h1><p>A clear view of care, people, and momentum across the system.</p></div><button className="button button-dark" onClick={() => setModal(true)}><Plus size={17} /> Add service</button></header>
      <div className="metrics-grid"><MetricCard label="Total members" value={overview.users.toLocaleString()} detail="+8.4% this month" icon={<Users size={19} />} /><MetricCard label="Active providers" value={overview.providers} detail={`${overview.pendingProviders} awaiting review`} icon={<UserCheck size={19} />} /><MetricCard label="Appointments" value={overview.appointments.toLocaleString()} detail="92% completion rate" icon={<CalendarCheck size={19} />} /><MetricCard label="Live services" value={overview.services} detail="Across 4 categories" icon={<Activity size={19} />} /></div>
      <div className="admin-main-grid">
        <section className="panel admin-chart-panel"><div className="panel-heading"><div><p className="eyebrow">Demand</p><h2>Appointments over time</h2></div><select aria-label="Chart date range"><option>Last 7 days</option><option>Last 30 days</option></select></div><div className="line-chart" aria-label="Appointment demand increased over seven days"><div className="chart-grid"><span /><span /><span /><span /></div><svg viewBox="0 0 600 190" role="img"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#789783" stopOpacity=".32"/><stop offset="1" stopColor="#789783" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d="M0,154 C55,140 78,145 118,120 C160,93 188,119 230,92 C279,59 316,82 360,64 C411,43 439,74 482,45 C527,18 560,35 600,22 L600,190 L0,190 Z"/><path className="chart-line" d="M0,154 C55,140 78,145 118,120 C160,93 188,119 230,92 C279,59 316,82 360,64 C411,43 439,74 482,45 C527,18 560,35 600,22"/></svg><div className="chart-labels">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div></div><div className="chart-summary"><span><strong>+18.2%</strong><small>vs. previous week</small></span><span><strong>612</strong><small>appointments booked</small></span></div></section>
        <aside className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Live feed</p><h2>Recent activity</h2></div><button className="icon-button"><ArrowUpRight size={17} /></button></div>{[["MT", "Maya booked a consultation", "2 min ago"], ["SC", "Dr. Chen completed a visit", "18 min ago"], ["AO", "Amara updated availability", "42 min ago"], ["MR", "New provider review submitted", "1 hr ago"]].map(([initials, text, time], index) => <div className="activity-item" key={text}><Avatar initials={initials} size="sm" tone={index % 2 ? "lilac" : "sage"} /><span><strong>{text}</strong><small>{time}</small></span></div>)}</aside>
      </div>
      <section className="panel admin-services"><div className="panel-heading"><div><p className="eyebrow">Catalog</p><h2>Services</h2></div><label className="table-search"><Search size={15} /><input placeholder="Search services" aria-label="Search services" /></label></div><div className="service-table" role="table"><div role="row" className="table-head"><span>Service</span><span>Category</span><span>Duration</span><span>Price</span><span>Status</span></div>{services.map((service) => <div role="row" className="table-row" key={service._id}><span className="service-cell"><ServiceGlyph icon={service.icon} accent={service.accent} /><strong>{service.name}</strong></span><span>{service.category}</span><span>{service.durationMinutes} min</span><span>${service.price}</span><span className="active-status"><Check size={12} /> Active</span></div>)}</div></section>
      <section className="panel provider-review"><div className="panel-heading"><div><p className="eyebrow">Care network</p><h2>Top providers</h2></div></div><div className="provider-review-grid">{providers.slice(0, 4).map((provider) => <article key={provider._id}><Avatar initials={provider.avatar} size="lg" /><span><strong>{provider.displayName}</strong><small>{provider.title}</small></span><em>{provider.rating} ★</em></article>)}</div></section>
      {modal ? <div className="modal-backdrop"><section className="modal service-modal" role="dialog" aria-modal="true" aria-labelledby="new-service-title"><button className="modal-close icon-button" onClick={() => setModal(false)} aria-label="Close"><X size={18} /></button><span className="modal-icon"><Stethoscope size={22} /></span><p className="eyebrow">Catalog management</p><h2 id="new-service-title">Add a service</h2><p>Create a new bookable care experience.</p><form onSubmit={createService} className="service-form"><label><span>Service name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required minLength={3} placeholder="Physiotherapy session" /></label><label><span>Description</span><textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required minLength={10} placeholder="A short, patient-friendly description…" /></label><div className="form-grid"><label><span>Duration</span><input type="number" min="15" step="15" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} /></label><label><span>Price</span><input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /></label></div><label><span>Category</span><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><button className="button button-dark button-full" disabled={saving}>{saving ? "Creating…" : "Create service"}</button></form></section></div> : null}
    </div>
  );
}
