import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute({ children }: any) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}
