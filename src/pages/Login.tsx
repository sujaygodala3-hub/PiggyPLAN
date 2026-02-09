import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import piggyLogo from "../images/piggy-logo.png"; // ⬅️ rename your logo file if needed

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password");
      return;
    }

    // TEMP AUTH
    localStorage.setItem("authToken", "dev-token");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/", { replace: true });
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background:
          "radial-gradient(circle at top, rgba(255,182,193,0.35), #070707 60%)",
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "min(430px, 92vw)",
          borderRadius: 5,
          background: "rgba(15, 10, 12, 0.78)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,182,193,0.25)",
          boxShadow: "0 30px 90px rgba(255,182,193,0.25)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* 🐷 Logo */}
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <img
              src={piggyLogo}
              alt="Piggy Plan"
              style={{
                width: 160,
                filter: "drop-shadow(0 0 22px rgba(255,182,193,0.6))",
              }}
            />
          </Box>

          <Typography
            sx={{
              textAlign: "center",
              fontWeight: 900,
              fontSize: 28,
              color: "#FFD6E0",
              letterSpacing: 0.6,
            }}
          >
            Piggy Plan
          </Typography>

          <Typography
            sx={{
              mt: 0.6,
              textAlign: "center",
              fontSize: 14,
              color: "rgba(255,214,224,0.75)",
            }}
          >
            Feed your pig. Grow your plan.
          </Typography>

          {error && (
            <Typography
              sx={{
                mt: 2,
                textAlign: "center",
                color: "#FF9BAE",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {error}
            </Typography>
          )}

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{ mt: 3, display: "grid", gap: 1.6 }}
          >
            <TextField
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 2.5,
                  background: "rgba(255,214,224,0.08)",
                  color: "#FFD6E0",
                },
              }}
            />

            <TextField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 2.5,
                  background: "rgba(255,214,224,0.08)",
                  color: "#FFD6E0",
                },
              }}
            />

            <Button
              type="submit"
              sx={{
                mt: 1,
                py: 1.25,
                borderRadius: 999,
                fontWeight: 900,
                textTransform: "none",
                color: "#2A0F17",
                background:
                  "linear-gradient(135deg, #FFD6E0, #FF9BB3)",
                boxShadow: "0 12px 35px rgba(255,155,179,0.55)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #FFE3EB, #FFABC1)",
                },
              }}
            >
              Log In
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
