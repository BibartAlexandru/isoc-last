import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Project from "./pages/Project";
import BugPage from "./pages/Bug";
import NotificationSettings from "./pages/NotificationSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationBox from "./components/NotificationBox";
import { Routes, Route } from "react-router-dom";
import "./index.css";

function AuthLayout() {
  return (
    <>
      <NotificationBox />
      <Routes>
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<Project />} />
        <Route path="/bugs/:id" element={<BugPage />} />
        <Route path="/notifications/settings" element={<NotificationSettings />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AuthLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
