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
        setNotifications((prev) => [data, ...prev].slice(0, 20));
      } catch {
        // ignore malformed messages
      }
    };

    return () => ws.close();
  }, [token]);

  if (notifications.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: 16, right: 16, maxWidth: 300 }}>
      <h3>Notifications</h3>
      {notifications.map((n, i) => (
        <p key={i}>
          Bug #{n.bug_id}: {n.description}
        </p>
      ))}
    </div>
  );
}
