import * as React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { ROUTES } from "./resources/routes-constants";
import pigLogo from "./images/piggy-logo.png"; // ✅ update path if needed
import { TypeAnimation } from "react-type-animation";
import { Link as RouterLink, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  // 🔐 single source of truth
  const authed = Boolean(localStorage.getItem("authToken"));

  function handleLogout() {
    localStorage.removeItem("authToken");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/login", { replace: true });
  }

  const fontFamily =
    '"Space Grotesk", "Monument", "Poppins", system-ui, -apple-system, "Segoe UI", Arial, sans-serif';

  // 🐷 Pig brand palette
  const black = "#000000";
  const textSoft = "rgba(255,255,255,0.70)";
  const borderSoft = "rgba(255,182,193,0.18)";

  const pigPink = "#FFB6C1";
  const pigPinkStrong = "#FF8FAB";
  const pigGlow = "rgba(255,182,193,0.35)";

  const PATHS = {
    Home: ROUTES.HOMEPAGE_ROUTE,
    "Voice AI": ROUTES.VOICEPAGE_ROUTE || "/voice",
    "Face AI": "/face-ai",
    Transactions: ROUTES.TRANSPAGE_ROUTE || ROUTES.TRANPAGE_ROUTE || "/tran",
    Podcast: ROUTES.PODCASTPAGE_ROUTE || "/podcast",
    Map: ROUTES.ARTICLEPAGE_ROUTE || "/articles",
    About: ROUTES.ABOUTPAGE_ROUTE || "/about",
  };

  const NAV_LABELS = [
    "Home",
    "Voice AI",
    "Face AI",
    "Transactions",
    "Podcast",
    "Map",
    "About",
  ];

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: black,
        borderRadius: "16px 16px 0 0",
        px: 2.5,
        border: `1px solid ${borderSoft}`,
        boxShadow: "0 18px 55px rgba(0,0,0,0.7)",
      }}
    >
      <Toolbar sx={{ minHeight: 72, display: "flex", gap: 3 }}>
        {/* 🐷 Logo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mr: 1,
          }}
        >
          <img
            src={pigLogo}
            alt="PigQuest"
            style={{
              height: 48,
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Animated tagline */}
        <Typography sx={{ flexGrow: 1, color: textSoft, fontFamily }}>
          <TypeAnimation
            sequence={[
              "",
              800,
              "Plan.",
              800,
              "Plan. Learn.",
              800,
              "Plan. Learn. Allocate.",
              800,
              "Plan. Learn. Allocate. Nurture.",
              1600,
            ]}
            speed={55}
            repeat={Infinity}
          />
        </Typography>

        {/* Nav */}
        <Box sx={{ display: "flex", gap: 1 }}>
          {NAV_LABELS.map((label) => (
            <Button
              key={label}
              component={RouterLink}
              to={PATHS[label]}
              sx={{
                fontFamily,
                textTransform: "none",
                fontWeight: 900,
                borderRadius: 999,
                px: 2.2,
                py: 0.9,
                color: "#111",
                background: `linear-gradient(135deg, ${pigPink}, ${pigPinkStrong})`,
                boxShadow: `0 10px 22px ${pigGlow}`,
                "&:hover": {
                  filter: "brightness(0.95)",
                },
              }}
            >
              {label}
            </Button>
          ))}

          {/* Logout */}
          {authed && (
            <Button
              onClick={handleLogout}
              sx={{
                fontFamily,
                fontWeight: 900,
                borderRadius: 999,
                px: 2.2,
                py: 0.9,
                color: "#fff",
                background: "rgba(255,255,255,0.12)",
                "&:hover": {
                  background: "rgba(255,255,255,0.18)",
                },
              }}
            >
              Logout
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
