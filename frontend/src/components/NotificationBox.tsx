import { useEffect, useState } from "react";

export default function NotificationBox() {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8004/api/notifications");

    ws.onmessage = (event) => {
      setNotifications((prev) => [...prev, event.data]);
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      <h3>Notifications</h3>

      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        notifications.map((n, i) => <p key={i}>{n}</p>)
      )}
    </div>
  );
}
