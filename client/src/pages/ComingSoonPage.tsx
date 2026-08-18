import { Sparkles } from "lucide-react";

export default function ComingSoonPage({ title }: { title: string }) {
  return <div className="dashboard-page"><div className="empty-state coming-soon"><span className="empty-icon"><Sparkles size={24} /></span><p className="eyebrow">On the roadmap</p><h1>{title}</h1><p>This workspace is prepared for the next vertical feature release.</p></div></div>;
}
