import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <main className="not-found"><span>404</span><p className="eyebrow">A quiet corner</p><h1>There’s nothing scheduled here.</h1><p>The page may have moved, but your care is still right where you left it.</p><Link className="button button-dark" to="/"><ArrowLeft size={16} /> Return home</Link></main>;
}
