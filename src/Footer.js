import React from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";

const Footer = () => {
  const fontFamily =
    '"Space Grotesk","Monument","Poppins",system-ui,-apple-system,"Segoe UI",Arial,sans-serif';

  /* =========================
     PINK THEME TOKENS
  ========================= */
  const BG_0 = "#050507";
  const BORDER = "rgba(255,255,255,0.12)";

  const WHITE = "#FFFFFF";
  const TEXT_MUTED = "rgba(255,255,255,0.70)";

  const PINK_MAIN = "#FF5FA2";
  const PINK_HOT = "#FF3D8E";
  const PINK_SOFT = "rgba(255,95,162,0.16)";
  const PINK_GLOW = "rgba(255,95,162,0.35)";

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: BG_0,
        borderRadius: "0 0 12px 12px",
        px: 2,
        borderTop: `1px solid ${BORDER}`,
        boxShadow: "0 -18px 50px rgba(0,0,0,0.70)",
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          fontFamily,
        }}
      >
        {/* LEFT: CONTACT */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
          <Typography
            sx={{
              fontFamily,
              fontWeight: 950,
              letterSpacing: "0.06em",
              background: `linear-gradient(135deg, ${PINK_MAIN}, ${PINK_HOT})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: `0 0 22px ${PINK_GLOW}`,
            }}
          >
            Contact Us
          </Typography>

          <Typography
            sx={{
              fontFamily,
              color: TEXT_MUTED,
              fontWeight: 600,
            }}
          >
            Phone: +1 706-590-6420
          </Typography>

          <Typography
            sx={{
              fontFamily,
              color: TEXT_MUTED,
              fontWeight: 600,
            }}
          >
            Email: petquest111@gmail.com
          </Typography>
        </Box>

        {/* RIGHT: CONNECT */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            textAlign: "right",
          }}
        >
          <Typography
            sx={{
              fontFamily,
              fontWeight: 950,
              letterSpacing: "0.06em",
              background: `linear-gradient(135deg, ${PINK_MAIN}, ${PINK_HOT})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: `0 0 22px ${PINK_GLOW}`,
            }}
          >
            Connect With Us
          </Typography>

          <Typography
            sx={{
              fontFamily,
              color: TEXT_MUTED,
              fontWeight: 600,
              maxWidth: 320,
            }}
          >
            Stay connected for up-to-date updates.
          </Typography>
        </Box>
      </Toolbar>

      {/* BOTTOM ACCENT STRIP */}
      <Box
        sx={{
          height: 8,
          borderRadius: "0 0 12px 12px",
          background: `linear-gradient(
            90deg,
            rgba(255,95,162,0.35),
            rgba(255,61,142,0.28),
            rgba(255,95,162,0.22),
            rgba(255,255,255,0.06),
            rgba(255,61,142,0.24)
          )`,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          boxShadow: `0 0 0 6px ${PINK_SOFT}`,
        }}
      />
    </AppBar>
  );
};

export default Footer;
