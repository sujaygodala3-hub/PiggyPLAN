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
import petquest from "../images/finwise-logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const navigate = useNavigate();

  function handleLogin() {
    setErr(null);

    if (!email.trim() || !password.trim()) {
      setErr("Enter email and password.");
      return;
    }

    localStorage.setItem("petquest_auth", "1");
    localStorage.setItem("petquest_user_email", email.trim());

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
          "radial-gradient(circle at top, rgba(235,212,105,0.15), #000 55%)",
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "min(440px, 92vw)",
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.85)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <img src={petquest} alt="PETQuest" style={{ width: 190 }} />
          </Box>

          <Typography
            sx={{
              fontWeight: 900,
              fontSize: 26,
              color: "#fff",
              textAlign: "center",
            }}
          >
            Welcome Back
          </Typography>

          <Typography
            sx={{
              mt: 0.6,
              color: "rgba(255,255,255,0.65)",
              textAlign: "center",
              fontSize: 14,
            }}
          >
            Log in to continue your journey
          </Typography>

          {err && (
            <Typography
              sx={{
                mt: 2,
                color: "#ff6b6b",
                fontWeight: 700,
                textAlign: "center",
                fontSize: 14,
              }}
            >
              {err}
            </Typography>
          )}

          <Box sx={{ mt: 3, display: "grid", gap: 1.6 }}>
            <TextField
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                },
              }}
            />

            <TextField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              fullWidth
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                },
              }}
            />

            <Button
              onClick={handleLogin}
              sx={{
                mt: 1,
                py: 1.2,
                fontWeight: 900,
                borderRadius: 999,
                textTransform: "none",
                color: "#000",
                background:
                  "linear-gradient(135deg, #EBD469, #AC663E)",
                boxShadow: "0 12px 30px rgba(235,212,105,0.35)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #f2df8a, #c97a4d)",
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
