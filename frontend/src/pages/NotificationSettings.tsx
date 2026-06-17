import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";

const NOTIF_API = "https://localhost:8004";

const severityOptions = [
  { value: 1, label: "1 — Low", description: "All notifications" },
  { value: 2, label: "2 — Medium", description: "Medium and above" },
  { value: 3, label: "3 — High", description: "High and above" },
  { value: 4, label: "4 — Critical", description: "Critical and above" },
  { value: 5, label: "5 — Blocker", description: "Blockers only" },
];

export default function NotificationSettings() {
  const { token, userId } = useAuth();
  const [minSeverity, setMinSeverity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!userId) return;
    fetch(`${NOTIF_API}/api/notifications/configuration?user_id=${userId}`, { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setMinSeverity(data.min_severity); });
  }, [userId]);

  async function save() {
    const res = await fetch(`${NOTIF_API}/api/notifications/configuration`, {
      method: "POST", headers,
      body: JSON.stringify({ user_id: userId, min_severity: minSeverity }),
    });
    if (!res.ok) { setError("Failed to save."); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800/60 px-6 h-12 flex items-center gap-2">
        <Link to="/projects" className="text-zinc-500 hover:text-zinc-200 transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft size={15} />
          Projects
        </Link>
        <span className="text-zinc-700 text-sm">/</span>
        <span className="text-zinc-300 text-sm">Notification settings</span>
      </nav>

      <div className="max-w-md mx-auto px-6 py-10">
        <h1 className="text-lg font-semibold text-zinc-100 mb-1">Notifications</h1>
        <p className="text-zinc-500 text-sm mb-8">Set the minimum severity level for which you want to receive notifications.</p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
          {severityOptions.map((opt, i) => (
            <label key={opt.value}
              className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors hover:bg-zinc-800 ${i > 0 ? "border-t border-zinc-800" : ""} ${minSeverity === opt.value ? "bg-zinc-800/60" : ""}`}>
              <input
                type="radio" name="severity" value={opt.value}
                checked={minSeverity === opt.value}
                onChange={() => setMinSeverity(opt.value)}
                className="accent-indigo-500"
              />
              <div className="flex-1">
                <span className="text-zinc-200 text-sm font-medium">{opt.label}</span>
                <p className="text-zinc-500 text-xs">{opt.description}</p>
              </div>
              {minSeverity === opt.value && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
              )}
            </label>
          ))}
        </div>

        <button
          onClick={save}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
        >
          {saved ? "Saved ✓" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
