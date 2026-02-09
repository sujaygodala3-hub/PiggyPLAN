import React, { useEffect } from "react";
import { Box, Card, CardContent, Typography, Button, Divider } from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
};

// Minimal PETQuest theme tokens (matches your home theme vibe)
const fontBody =
  "'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
const fontDisplay =
  "'Space Grotesk', system-ui, -apple-system, Segoe UI, Roboto, sans-serif";

const surface = "rgba(18, 18, 18, 0.78)";
const stroke = "rgba(255,255,255,0.10)";

const brandGold = "#E8D36A";
const brandBrown = "#A86A45";
const glow = "rgba(232, 211, 106, 0.22)";

const text0 = "#F6F3EA";
const text1 = "rgba(246,243,234,0.78)";
const text2 = "rgba(246,243,234,0.62)";

export default function InstructionsModal({ open, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <Box
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(); // click outside closes
      }}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.70)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 3 },
      }}
    >
      <Card
        sx={{
          width: "min(860px, 100%)",
          maxHeight: "85vh",
          overflow: "auto",
          borderRadius: 5,
          background: surface,
          backdropFilter: "blur(14px)",
          border: `1px solid ${stroke}`,
          boxShadow: `0 22px 70px rgba(0,0,0,0.65), 0 18px 55px ${glow}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Typography
                sx={{
                  fontFamily: fontDisplay,
                  fontWeight: 950,
                  fontSize: { xs: 20, md: 24 },
                  color: text0,
                  letterSpacing: "-0.02em",
                }}
              >
                Welcome to PETQuest 🐾
              </Typography>
              <Typography sx={{ mt: 0.6, color: text1, fontFamily: fontBody }}>
                Quick guide to help you care for your pet, earn rewards, and manage your budget.
              </Typography>
            </Box>

            <Button
              onClick={onClose}
              sx={{
                minWidth: 40,
                height: 40,
                borderRadius: 999,
                fontWeight: 950,
                color: text0,
                border: `1px solid rgba(255,255,255,0.14)`,
                background: "rgba(0,0,0,0.25)",
                "&:hover": { background: "rgba(255,255,255,0.06)" },
              }}
              aria-label="Close instructions"
            >
              ✕
            </Button>
          </Box>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.10)" }} />

          <Box sx={{ display: "grid", gap: 1.6 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid rgba(255,255,255,0.10)`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Typography sx={{ fontFamily: fontDisplay, fontWeight: 950, color: text0, fontSize: 16 }}>
                Getting Started
              </Typography>
              <Typography sx={{ mt: 0.8, color: text2, fontFamily: fontBody, lineHeight: 1.7 }}>
                • Name your pet and choose a pet type.<br />
                • Your choices affect your pet’s mood/health and your balance over time.<br />
                • Use the dashboard to track money, accessories, and badges.
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid rgba(255,255,255,0.10)`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Typography sx={{ fontFamily: fontDisplay, fontWeight: 950, color: text0, fontSize: 16 }}>
                How Pages Work
              </Typography>
              <Typography sx={{ mt: 0.8, color: text2, fontFamily: fontBody, lineHeight: 1.7 }}>
                <b style={{ color: text0 }}>Home:</b> Dashboard (pet, balance, badges, accessories, reviews).<br />
                <b style={{ color: text0 }}>Map:</b> Travel to locations; short vs long activities affect rewards + pet state.<br />
                <b style={{ color: text0 }}>Transactions:</b> Track earnings/spending and use Savings to plan ahead.<br />
                <b style={{ color: text0 }}>Voice AI:</b> Navigate with voice commands (ex: “Go to Map”).<br />
                <b style={{ color: text0 }}>Face AI:</b> Show a real/stuffed animal to match a pet in-game.<br />
                <b style={{ color: text0 }}>Podcast:</b> Short episodes about responsibility.<br />
                <b style={{ color: text0 }}>About:</b> Contact + updates.
              </Typography>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 4,
                border: `1px solid rgba(255,255,255,0.10)`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <Typography sx={{ fontFamily: fontDisplay, fontWeight: 950, color: text0, fontSize: 16 }}>
                Tips
              </Typography>
              <Typography sx={{ mt: 0.8, color: text2, fontFamily: fontBody, lineHeight: 1.7 }}>
                • Save money for bigger costs (like vet visits).<br />
                • Consistent care unlocks better outcomes and rewards.<br />
                • Check Transactions to see how daily choices add up.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2.2, display: "flex", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                fontWeight: 950,
                borderRadius: 999,
                px: 3,
                py: 1.1,
                textTransform: "none",
                background: `linear-gradient(135deg, ${brandGold}, ${brandBrown})`,
                boxShadow: `0 14px 30px ${glow}`,
                color: "#111",
                border: "1px solid rgba(255,255,255,0.18)",
                "&:hover": { filter: "brightness(0.96)" },
              }}
            >
              Got it — Start!
            </Button>

            <Typography sx={{ color: text2, fontFamily: fontBody, fontSize: 13 }}>
              Tip: Click outside, press <b style={{ color: text0 }}>Esc</b>, or click <b style={{ color: text0 }}>✕</b> to close.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
