import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./pages/Home";
import ArticlesPage from "./pages/Articles";
import AboutPage from "./pages/About";
import DashboardPage from "./pages/Dashboard";
import TransPage from "./pages/Tran";
import UsersPage from "./pages/Users";
import UserPage from "./pages/User";
import NotFoundPage from "./pages/NotFound";
import Voice from "./pages/Voice";
import VoiceAI from "./pages/VoiceAI";
import Podcast from "./pages/Podcast";
import FaceAI from "./pages/FaceAI";

import Header from "./Header";
import Footer from "./Footer";
import FloatingAIWidget from "./components/FloatingAIWidget";
import QuickGuide from "./components/QuickGuide";

import { ROUTES } from "./resources/routes-constants";

import LoginPage from "./pages/Login";
import AuthPage from "./pages/Auth";

/* =========================
   AUTH HELPERS
========================= */
function isAuthed() {
  return Boolean(localStorage.getItem("authToken"));
}

function ProtectedRoute({
  authed,
  children,
}: {
  authed: boolean;
  children: React.ReactElement;
}) {
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/* =========================
   APP SHELL
========================= */
function AppShell() {
  return (
    <>
      <Header />

      <Routes>
        <Route path={ROUTES.HOMEPAGE_ROUTE} element={<HomePage />} />
        <Route path={ROUTES.DASHBOARDPAGE_ROUTE} element={<DashboardPage />} />
        <Route path={ROUTES.TRANSPAGE_ROUTE} element={<TransPage />} />
        <Route path={ROUTES.ARTICLEPAGE_ROUTE} element={<ArticlesPage />} />
        <Route path={ROUTES.PODCASTPAGE_ROUTE} element={<Podcast />} />
        <Route path={ROUTES.ABOUTPAGE_ROUTE} element={<AboutPage />} />
        <Route path={ROUTES.USERSPAGE_ROUTE} element={<UsersPage />} />
        <Route path={ROUTES.USERPAGE_ROUTE} element={<UserPage />} />

        <Route path="/voice" element={<Voice />} />
        <Route path="/voice-ai" element={<VoiceAI />} />
        <Route path="/face-ai" element={<FaceAI />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <FloatingAIWidget />
      <QuickGuide />
      <Footer />
    </>
  );
}

/* =========================
   ROOT
========================= */
const RootComponent: React.FC = () => {
  const [authed, setAuthed] = useState<boolean>(() => isAuthed());
  const homePath = useMemo(() => ROUTES.HOMEPAGE_ROUTE, []);

  useEffect(() => {
    const syncAuth = () => setAuthed(isAuthed());

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={authed ? <Navigate to={homePath} replace /> : <LoginPage />}
        />

        {/* SIGNUP / AUTH */}
        <Route
          path="/auth"
          element={authed ? <Navigate to={homePath} replace /> : <AuthPage />}
        />

        {/* PROTECTED APP */}
        <Route
          path="/*"
          element={
            <ProtectedRoute authed={authed}>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default RootComponent;
