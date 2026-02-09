import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function AppGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const authed = localStorage.getItem("petquest_auth") === "true";

  // ✅ Allow visiting /login even when not authed
  if (!authed && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  // ✅ If authed and user goes to /login, send them home
  if (authed && location.pathname === "/login") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
