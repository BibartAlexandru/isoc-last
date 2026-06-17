import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

interface Notification {
  bug_id: number;
  description: string;
}

export default function NotificationBox() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`wss://localhost:8004/api/notifications?token=${token}`);
    ws.onmessage = (event) => {
      try {
        const data: Notification = JSON.parse(event.data);
        setNotifications((prev) => [data, ...prev].slice(0, 10));
      } catch {
        // ignore malformed messages
      }
    };
    return () => ws.close();
  }, [token]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-72 space-y-2">
      {notifications.map((n, i) => (
        <div key={i}
          className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-xl flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-zinc-100 text-xs font-medium">Bug #{n.bug_id}</p>
            <p className="text-zinc-400 text-xs truncate">{n.description}</p>
          </div>
          <button
            className="text-zinc-600 hover:text-zinc-400 text-xs flex-shrink-0 cursor-pointer"
            onClick={() => setNotifications((prev) => prev.filter((_, j) => j !== i))}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
