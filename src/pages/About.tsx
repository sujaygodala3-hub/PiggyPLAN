import React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

import PdfReactPdf from "../components/license";
import LicensePDF from "../images/allterms.pdf";

const AboutPage: React.FC = () => {
  /* =========================
     PINK THEME TOKENS
  ========================= */
  const BG_0 = "#050507";
  const BG_1 = "#0B0B12";

  const SURFACE_MAIN = "rgba(18,18,28,0.85)";
  const SURFACE_SOFT = "rgba(255,255,255,0.06)";
  const STROKE = "rgba(255,255,255,0.14)";

  const WHITE = "#ffffff";
  const TEXT_SOFT = "rgba(255,255,255,0.82)";
  const TEXT_MUTED = "rgba(255,255,255,0.70)";

  const PINK_MAIN = "#FF5FA2";
  const PINK_HOT = "#FF3D8E";
  const PINK_SOFT = "rgba(255,95,162,0.16)";
  const PINK_GLOW = "rgba(255,95,162,0.35)";

  const fontFamily =
    '"Space Grotesk","Monument","Poppins",system-ui,-apple-system,"Segoe UI",Arial,sans-serif';

  return (
    <Box
      sx={{
        minHeight: "100vh",
        fontFamily,
        py: { xs: 10, md: 12 },
        color: WHITE,
        background: `
          radial-gradient(1200px 600px at 15% -10%, ${PINK_SOFT}, transparent 60%),
          radial-gradient(900px 520px at 90% 0%, ${PINK_SOFT}, transparent 60%),
          linear-gradient(180deg, ${BG_0}, ${BG_1})
        `,
      }}
    >
      <Container maxWidth="md">
        {/* HEADER */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography
            sx={{
              fontSize: { xs: 34, md: 46 },
              fontWeight: 950,
              letterSpacing: "-0.03em",
              background: `linear-gradient(135deg, ${PINK_MAIN}, ${PINK_HOT})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            About Us
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: TEXT_MUTED,
              fontWeight: 700,
            }}
          >
            PETQuest policies, terms, and updates — all in one place.
          </Typography>
        </Box>

        {/* MAIN CARD */}
        <Card
          sx={{
            borderRadius: 4,
            background: SURFACE_MAIN,
            border: `1px solid ${STROKE}`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 3 }, color: WHITE }}>
            {/* TOP STRIP */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                mb: 2,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 950, color: WHITE }}>
                  Terms & Documentation
                </Typography>
                <Typography
                  sx={{
                    mt: 0.25,
                    fontSize: 13,
                    color: TEXT_MUTED,
                  }}
                >
                  View the full PDF below.
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 1.6,
                  py: 0.75,
                  borderRadius: 999,
                  background: PINK_SOFT,
                  border: `1px solid ${PINK_MAIN}`,
                  color: WHITE,
                  fontWeight: 900,
                  fontSize: 12,
                  boxShadow: `0 0 18px ${PINK_GLOW}`,
                  whiteSpace: "nowrap",
                }}
              >
                PETQuest • Official
              </Box>
            </Box>

            <Divider
              sx={{
                borderColor: "rgba(255,255,255,0.14)",
                mb: 2,
              }}
            />

            {/* PDF VIEWER */}
            <Box
              className="pdf-container"
              sx={{
                borderRadius: 3,
                background: SURFACE_SOFT,
                border: `1px solid ${STROKE}`,
                overflow: "hidden",
                p: { xs: 1, md: 1.5 },
                boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04)`,
              }}
            >
              <PdfReactPdf src={LicensePDF} />
            </Box>

            {/* FOOTER NOTE */}
            <Typography
              sx={{
                mt: 2,
                fontSize: 12,
                color: TEXT_MUTED,
                lineHeight: 1.6,
              }}
            >
              Questions or feedback? Use the contact section in the footer to reach
              the PETQuest team.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default AboutPage;
