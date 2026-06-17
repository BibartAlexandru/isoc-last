import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

interface Notification {
  bug_id: number;
  description: string;
}

export function useNotifications() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [popups, setPopups] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`wss://localhost:8004/api/notifications?token=${token}`);
    ws.onmessage = (event) => {
      try {
        const data: Notification = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev].slice(0, 50));
        setPopups((prev) => [data, ...prev].slice(0, 5));
        setTimeout(() => setPopups((prev) => prev.filter((n) => n !== data)), 5000);
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [token]);

  function dismissPopup(n: Notification) {
    setPopups((prev) => prev.filter((p) => p !== n));
  }

  return { notifications, popups, dismissPopup };
}

export function NotificationPanel({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
      >
        <Bell size={16} />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <span className="text-zinc-200 text-sm font-medium">Notifications</span>
            <Link to="/notifications/settings" className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors" onClick={() => setOpen(false)}>
              Settings
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-zinc-800/60">
              {notifications.map((n, i) => (
                <li key={i} className="px-4 py-3 hover:bg-zinc-800/40 transition-colors">
                  <p className="text-zinc-200 text-xs font-medium">Bug #{n.bug_id}</p>
                  <p className="text-zinc-500 text-xs">{n.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function NotificationBox() {
  const { popups, dismissPopup } = useNotifications();

  if (popups.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 space-y-2 pointer-events-none">
      {popups.map((n, i) => (
        <div key={i}
          className="pointer-events-auto bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl flex items-start gap-3 w-72">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-zinc-100 text-xs font-medium">Bug #{n.bug_id}</p>
            <p className="text-zinc-400 text-xs truncate">{n.description}</p>
          </div>
          <button className="text-zinc-600 hover:text-zinc-400 text-xs flex-shrink-0 cursor-pointer"
            onClick={() => dismissPopup(n)}>✕</button>
        </div>
      ))}
    </div>
  );
}
