import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function isAuthed() {
  return localStorage.getItem("petquest_auth") === "1";
}

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const location = useLocation();

  if (!isAuthed()) {
    // Send them to login, and remember where they were going
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
