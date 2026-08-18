import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronRight, Clock3, MapPin, Search, ShieldCheck, Star, Video } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { api } from "../lib/api";
import type { Provider, Service } from "../types";
import { Avatar, Logo, ServiceGlyph } from "../components/UI";

export default function LandingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api<Service[]>("/services"), api<Provider[]>("/providers")])
      .then(([serviceResponse, providerResponse]) => {
        setServices(serviceResponse.data);
        setProviders(providerResponse.data);
      })
      .catch(() => setError("Live availability is taking a moment. You can still explore NovaCare."));
  }, []);

  const nextDate = format(addDays(new Date(), 2), "EEE, MMM d");

  return (
    <>
      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow eyebrow-pill"><span /> Care that fits your life</p>
            <h1>Your wellbeing,<br /><em>beautifully</em> scheduled.</h1>
            <p className="hero-lede">Find trusted specialists and book thoughtful care in minutes. No phone calls, no waiting rooms full of uncertainty.</p>
            <form className="hero-search" onSubmit={(event) => { event.preventDefault(); navigate(selectedService ? `/login?service=${selectedService}` : "/login?intent=book"); }}>
              <label>
                <Search size={19} />
                <span>
                  <small>I'm looking for</small>
                  <select aria-label="Choose a service" value={selectedService} onChange={(event) => setSelectedService(event.target.value)}>
                    <option value="">Any kind of care</option>
                    {services.map((service) => <option key={service._id} value={service._id}>{service.name}</option>)}
                  </select>
                </span>
              </label>
              <span className="search-divider" />
              <div className="hero-search-location"><MapPin size={19} /><span><small>Appointment type</small><strong>In person or virtual</strong></span></div>
              <button type="submit" aria-label="Find an appointment"><ArrowRight size={20} /></button>
            </form>
            {error ? <p className="inline-note">{error}</p> : null}
            <div className="trust-row">
              <span className="avatar-stack"><Avatar initials="SC" size="sm" /><Avatar initials="MR" size="sm" tone="lilac" /><Avatar initials="AO" size="sm" tone="sand" /></span>
              <span><strong>4.9 <Star size={13} fill="currentColor" /></strong><small>Loved by 2,000+ patients</small></span>
              <span className="trust-separator" />
              <span className="secure-note"><ShieldCheck size={18} /><small>Your data stays private</small></span>
            </div>
          </div>
          <div className="hero-visual" aria-label="NovaCare appointment preview">
            <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
            <div className="care-portrait">
              <div className="portrait-shape portrait-halo" />
              <div className="portrait-person">
                <span className="portrait-head" />
                <span className="portrait-hair" />
                <span className="portrait-body" />
                <span className="portrait-coat" />
              </div>
              <span className="portrait-caption">A calmer way to care</span>
            </div>
            <article className="floating-appointment">
              <div className="floating-top"><span><Check size={14} /></span><small>You're all set</small></div>
              <div className="appointment-provider"><Avatar initials="SC" /><span><strong>Dr. Sarah Chen</strong><small>Family medicine</small></span></div>
              <div className="appointment-meta"><CalendarDays size={16} /><span><small>Next appointment</small><strong>{nextDate} · 10:30 AM</strong></span></div>
              <div className="appointment-meta"><Video size={16} /><span><small>Visit type</small><strong>Video consultation</strong></span></div>
            </article>
            <div className="availability-float"><span className="pulse-dot" /><small>Next opening</small><strong>Thursday · 10:30 AM</strong></div>
          </div>
        </section>

        <section className="section services-section" id="services">
          <div className="section-heading split-heading">
            <div><p className="eyebrow">Care, your way</p><h2>Start with what<br />you need today.</h2></div>
            <p>Whether it’s a check-in, a new concern, or support for feeling your best—we’ll help you find the right person.</p>
          </div>
          <div className="service-grid">
            {services.slice(0, 4).map((service, index) => (
              <Link to={`/login?service=${service._id}`} className={`service-card service-card-${service.accent}`} key={service._id}>
                <span className="card-number">0{index + 1}</span>
                <ServiceGlyph icon={service.icon} accent={service.accent} />
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div><span><Clock3 size={14} /> {service.durationMinutes} min</span><strong>from ${service.price}</strong></div>
                <span className="round-arrow"><ArrowRight size={17} /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section specialists-section" id="specialists">
          <div className="section-heading centered-heading"><p className="eyebrow">People who listen</p><h2>Meet your care team.</h2><p>Verified specialists, chosen for expertise and empathy.</p></div>
          <div className="provider-grid">
            {providers.slice(0, 4).map((provider, index) => (
              <article className="provider-card" key={provider._id}>
                <div className={`provider-portrait portrait-tone-${index + 1}`}><span>{provider.avatar}</span><div className="rating-chip"><Star size={12} fill="currentColor" /> {provider.rating}</div></div>
                <div className="provider-card-body">
                  <h3>{provider.displayName}</h3><p>{provider.title}</p>
                  <div className="tag-row">{provider.specialties.map((item) => <span key={item}>{item}</span>)}</div>
                  <div className="provider-card-footer"><small><span className="pulse-dot" /> Next opening this week</small><Link to={`/login?provider=${provider._id}`} aria-label={`Book with ${provider.displayName}`}><ChevronRight size={17} /></Link></div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section journey-section" id="how-it-works">
          <div className="journey-copy"><p className="eyebrow">Simple by design</p><h2>Care shouldn’t feel<br />complicated.</h2><p>From finding the right specialist to remembering your follow-up, NovaCare keeps each step clear and human.</p><Link className="text-button arrow-link" to="/login?intent=book">Find your appointment <ArrowRight size={16} /></Link></div>
          <div className="journey-steps">
            {[
              ["01", "Choose your care", "Browse services and specialists at your own pace."],
              ["02", "Pick a time", "See real availability and choose what fits your day."],
              ["03", "Feel supported", "Receive clear confirmations, reminders, and next steps."],
            ].map(([number, title, copy]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
          </div>
        </section>

        <section className="testimonial-section">
          <div className="quote-mark">“</div>
          <blockquote>I found a therapist I connected with and booked for the next morning. The whole experience felt calm, clear, and surprisingly personal.</blockquote>
          <div className="quote-person"><Avatar initials="JL" /><span><strong>Jamie L.</strong><small>NovaCare patient</small></span></div>
        </section>

        <section className="cta-section">
          <span className="cta-flower flower-one" /><span className="cta-flower flower-two" />
          <p className="eyebrow">A little care goes a long way</p><h2>Ready when you are.</h2><p>Your next appointment could be the easiest part of your day.</p>
          <Link className="button button-light" to="/login?intent=book">Find an appointment <ArrowRight size={17} /></Link>
        </section>
      </main>
      <footer className="footer">
        <div><Logo /><p>Thoughtful care, beautifully scheduled.</p></div>
        <div><strong>Explore</strong><a href="#services">Services</a><a href="#specialists">Specialists</a><a href="#how-it-works">How it works</a></div>
        <div><strong>Support</strong><a href="mailto:hello@novacare.demo">Contact care team</a><Link to="/login">Sign in</Link><a href="#privacy">Privacy</a></div>
        <div><strong>Stay in the loop</strong><p>Kind notes for a healthier week.</p><label className="newsletter"><input type="email" placeholder="Your email" aria-label="Email for newsletter" /><button aria-label="Subscribe"><ArrowRight size={16} /></button></label></div>
        <small className="footer-bottom">© {new Date().getFullYear()} NovaCare. Built for better days.</small>
      </footer>
    </>
  );
}
