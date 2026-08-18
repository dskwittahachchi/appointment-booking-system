import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/UI";
import { useAuth } from "../context/AuthContext";

const demos = [
  { role: "Customer", email: "customer@novacare.demo", copy: "Book and manage your care" },
  { role: "Provider", email: "provider@novacare.demo", copy: "Run your daily schedule" },
  { role: "Admin", email: "admin@novacare.demo", copy: "Manage the whole platform" },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "customer@novacare.demo", password: "Demo123!" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = mode === "login" ? await login(form.email, form.password) : await register(form.name, form.email, form.password);
      const service = params.get("service");
      if (user.role === "provider") navigate("/provider");
      else if (user.role === "admin") navigate("/admin");
      else navigate(service ? `/app/book?service=${service}` : params.get("intent") === "book" ? "/app/book" : "/app");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art">
        <Link to="/" className="auth-back"><ArrowLeft size={16} /> Back to NovaCare</Link>
        <div className="auth-art-content"><Logo /><p className="eyebrow">Care, in your hands</p><h1>A better rhythm<br />for your wellbeing.</h1><p>One thoughtful place for appointments, care plans, and the people who help you feel your best.</p></div>
        <div className="auth-quote"><span className="quote-mark">“</span><p>NovaCare took the stress out of finding help. Everything simply made sense.</p><small>— Maya, NovaCare member</small></div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <div className="auth-mobile-logo"><Logo /></div>
          <p className="eyebrow">Welcome {mode === "login" ? "back" : "in"}</p>
          <h2>{mode === "login" ? "Sign in to your care." : "Create your account."}</h2>
          <p>{mode === "login" ? "Your next step is right where you left it." : "Thoughtful care is only a few details away."}</p>

          <form onSubmit={handleSubmit}>
            {mode === "register" ? <label><span>Full name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Maya Thompson" required minLength={2} /></label> : null}
            <label><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required /></label>
            <label><span>Password</span><span className="password-field"><input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={8} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            {error ? <div className="form-error" role="alert">{error}</div> : null}
            <button className="button button-dark button-full" type="submit" disabled={submitting}>{submitting ? "Taking you there…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={17} /></button>
          </form>

          <p className="auth-switch">{mode === "login" ? "New to NovaCare?" : "Already have an account?"} <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
          {mode === "login" ? <div className="demo-logins"><div><span>Demo workspaces</span><small>Password: Demo123!</small></div>{demos.map((demo) => <button key={demo.role} type="button" onClick={() => setForm({ name: "", email: demo.email, password: "Demo123!" })}><span><strong>{demo.role}</strong><small>{demo.copy}</small></span>{form.email === demo.email ? <Check size={16} /> : <ArrowRight size={16} />}</button>)}</div> : null}
          <div className="privacy-note"><ShieldCheck size={16} /> <span>Your information is encrypted and never sold.</span></div>
        </div>
      </section>
    </main>
  );
}
