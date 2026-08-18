import { useEffect, useState } from "react";
import { Check, Clock3, Copy, Info } from "lucide-react";
import { api } from "../lib/api";
import type { Availability } from "../types";
import { PageLoader } from "../components/UI";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
interface DayRow { weekday: number; enabled: boolean; startTime: string; endTime: string }

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState<DayRow[]>(() => days.map((_, weekday) => ({ weekday, enabled: weekday > 0 && weekday < 6, startTime: "09:00", endTime: weekday === 5 ? "15:00" : "17:00" })));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<Availability[]>("/provider/availability").then((response) => {
      if (!response.data.length) return;
      setSchedule(days.map((_, weekday) => {
        const row = response.data.find((item) => item.weekday === weekday);
        return { weekday, enabled: Boolean(row), startTime: row?.startTime || "09:00", endTime: row?.endTime || "17:00" };
      }));
    }).finally(() => setLoading(false));
  }, []);

  function update(weekday: number, changes: Partial<DayRow>) {
    setSaved(false);
    setSchedule((current) => current.map((row) => row.weekday === weekday ? { ...row, ...changes } : row));
  }

  async function save() {
    setSaving(true);
    try { await api("/provider/availability", { method: "POST", body: JSON.stringify({ schedule }) }); setSaved(true); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader label="Loading your working hours" />;
  return (
    <div className="dashboard-page availability-page">
      <header className="page-heading"><div><p className="eyebrow">Schedule settings</p><h1>Availability</h1><p>Set the weekly rhythm patients can book. Existing appointments stay protected.</p></div><button className="button button-dark" onClick={save} disabled={saving}>{saved ? <Check size={17} /> : <Clock3 size={17} />}{saving ? "Saving…" : saved ? "Saved" : "Save schedule"}</button></header>
      <div className="availability-layout">
        <section className="panel availability-panel"><div className="panel-heading"><div><h2>Weekly hours</h2><p>Changes apply to future booking availability.</p></div><button className="text-button" onClick={() => { const monday = schedule[1]; setSchedule((current) => current.map((row) => row.weekday > 1 && row.weekday < 6 ? { ...row, enabled: monday.enabled, startTime: monday.startTime, endTime: monday.endTime } : row)); }}><Copy size={14} /> Copy Monday to weekdays</button></div><div className="availability-list">{schedule.map((row) => <div className={`availability-row ${row.enabled ? "" : "disabled"}`} key={row.weekday}><label className="switch"><input type="checkbox" checked={row.enabled} onChange={(event) => update(row.weekday, { enabled: event.target.checked })} /><span /></label><strong>{days[row.weekday]}</strong>{row.enabled ? <div className="time-range"><input type="time" aria-label={`${days[row.weekday]} start time`} value={row.startTime} onChange={(event) => update(row.weekday, { startTime: event.target.value })} /><span>to</span><input type="time" aria-label={`${days[row.weekday]} end time`} value={row.endTime} onChange={(event) => update(row.weekday, { endTime: event.target.value })} /></div> : <span className="unavailable-label">Unavailable</span>}</div>)}</div></section>
        <aside className="availability-side"><section className="panel booking-preview"><p className="eyebrow">Patient preview</p><h3>Your bookable week</h3><div className="preview-calendar">{schedule.map((row) => <div className={row.enabled ? "active" : ""} key={row.weekday}><small>{days[row.weekday][0]}</small><span>{row.enabled ? Math.max(1, (Number(row.endTime.slice(0, 2)) - Number(row.startTime.slice(0, 2))) * 2) : 0}</span></div>)}</div><p>About <strong>{schedule.reduce((total, row) => total + (row.enabled ? Math.max(0, Number(row.endTime.slice(0, 2)) - Number(row.startTime.slice(0, 2))) * 2 : 0), 0)} slots</strong> available each week.</p></section><div className="info-card"><Info size={18} /><span><strong>Conflict protection is always on.</strong> NovaCare removes booked and blocked times before showing availability.</span></div></aside>
      </div>
    </div>
  );
}
