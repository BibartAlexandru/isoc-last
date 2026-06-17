import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Project from "./pages/Project";

import ProtectedRoute from "./components/ProtectedRoute";
import NotificationBox from "./components/NotificationBox";
import { Routes, Route } from "react-router-dom";

function AuthLayout() {
  return (
    <>
      <NotificationBox />
      <Routes>
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<Project />} />
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
