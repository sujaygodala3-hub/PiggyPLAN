// src/pages/Podcast.tsx

import React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function Podcast() {
  /* =========================
     THEME CONSTANTS (PINK)
  ========================= */
  const fontFamily =
    '"Space Grotesk","Monument","Poppins",system-ui,-apple-system,"Segoe UI",Arial,sans-serif';

  const BG_0 = "#050507";
  const BG_1 = "#0B0B12";

  const WHITE = "#ffffff";

  const PINK_MAIN = "#FF5FA2";
  const PINK_HOT = "#FF3D8E";
  const PINK_SOFT = "rgba(255,95,162,0.18)";
  const PINK_GLOW = "rgba(255,95,162,0.35)";

  const STROKE = "rgba(255,255,255,0.12)";
  const SURFACE = "rgba(18,18,28,0.78)";

  /* =========================
     YOUTUBE EMBED HELPER
  ========================= */
  const toEmbedUrl = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) {
        return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
      }
      if (u.hostname.includes("youtube.com")) {
        const id = u.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
        if (u.pathname.includes("/embed/")) return url;
      }
    } catch {}
    return url;
  };

  /* =========================
     PODCAST DATA
  ========================= */
  const podcasts = [
    {
      title: "PiggyPLAN × Angels Among Us Rescue",
      tag: "Partner Series",
      description:
        "This episode centers on the ethical responsibilities that come with pet adoption and the often-overlooked realities of animal rescue work. Through a candid conversation with Angels Among Us Rescue, we explore what responsible adoption truly means beyond the initial excitement, including long-term care, financial planning, and emotional commitment. The discussion highlights real rescue stories, challenges faced by shelters, and the importance of informed decision-making in reducing abandonment and improving animal welfare outcomes.",
      publishDate: "11-15-2025",
      status: "Featured",
      videoSrc: "https://youtu.be/AEnfKXc0kMo",
    },
    {
      title: "PiggyPLAN × Beyond the Mind HOSA",
      tag: "Wellbeing",
      description:
        "This conversation examines the connection between structured pet care and mental well-being, focusing on how responsibility, routine, and caregiving influence emotional health. Featuring insights from Beyond the Mind HOSA, the episode discusses how consistent daily habits can foster stability, reduce stress, and encourage mindfulness. By linking personal wellness with caregiving accountability, this episode emphasizes the role of routine and purpose in supporting long-term mental health.",
      publishDate: "12-30-2025",
      status: "Featured",
      videoSrc: "https://www.youtube.com/watch?v=zxa_CdnifEQ",
    },
    {
      title: "PiggyPLAN × Kabilesh Yuvaraj",
      tag: "Computer Science",
      description:
        "In this episode, we explore how core computer science principles extend beyond code and into meaningful product design. The discussion breaks down how logical thinking, problem decomposition, and user-centered design shape the development of PiggyPLAN. By connecting technical foundations to real-world impact, the conversation highlights how thoughtful engineering decisions can create tools that encourage responsibility, accessibility, and long-term user engagement.",
      publishDate: "01-07-2026",
      status: "Featured",
      videoSrc: "https://youtu.be/fKR2gPBqwYM",
    },
    {
      title: "PiggyPLAN × Peach State Hacks",
      tag: "Hackathon",
      description:
        "This behind-the-scenes episode documents the journey of building PiggyPLAN at Peach State Hacks, from the initial idea to a polished final product that placed third overall. The conversation covers the design process, technical challenges, and rapid iteration required in a hackathon environment. Emphasis is placed on teamwork, adaptability, and learning through failure, showcasing how collaboration and feedback drive innovation under tight time constraints.",
      publishDate: "01-18-2026",
      status: "Featured",
      videoSrc: "https://youtu.be/nsXXd6y16HQ",
    },
    {
      title: "PiggyPLAN Finale",
      tag: "Final Episode",
      description:
        "The final episode serves as a reflection on the broader lessons learned throughout the PiggyPLAN project. It revisits themes of responsibility, financial planning, and long-term decision-making, tying together insights from previous conversations. The finale emphasizes how small, consistent choices shape future outcomes, offering a thoughtful conclusion on growth, accountability, and the lasting impact of intentional habits.",
      publishDate: "02-2026",
      status: "Final",
      videoSrc: "https://youtu.be/DQbuOx0z_9E",
    },
  ];

  /* =========================
     RENDER
  ========================= */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 6,
        fontFamily,
        background: `
          radial-gradient(1200px 600px at 15% -10%, ${PINK_SOFT}, transparent 60%),
          radial-gradient(900px 520px at 90% 0%, ${PINK_SOFT}, transparent 60%),
          linear-gradient(180deg, ${BG_0}, ${BG_1})
        `,
        color: WHITE,
      }}
    >
      <Container maxWidth="lg">
        {/* HEADER */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            sx={{
              fontSize: { xs: 34, md: 46 },
              fontWeight: 950,
              color: WHITE,
              letterSpacing: "-0.03em",
            }}
          >
            🎙️ PiggyPLAN Podcasts
          </Typography>

          <Typography
            sx={{
              mt: 1,
              maxWidth: 760,
              mx: "auto",
              color: "rgba(255,255,255,0.85)",
              fontSize: 16,
            }}
          >
            Featured conversations exploring responsibility, technology, wellness,
            and ethical pet ownership.
          </Typography>
        </Box>

        {/* MAIN CARD */}
        <Card
          sx={{
            background: SURFACE,
            border: `1px solid ${STROKE}`,
            borderRadius: 5,
            boxShadow: "0 20px 60px rgba(0,0,0,0.65)",
          }}
        >
          <CardContent sx={{ color: WHITE }}>
            <Grid container spacing={3}>
              {podcasts.map((p) => (
                <Grid item xs={12} md={6} key={p.title}>
                  <Card
                    sx={{
                      height: "100%",
                      background: "rgba(22,22,32,0.85)",
                      border: `1px solid ${STROKE}`,
                      borderRadius: 4,
                      boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
                    }}
                  >
                    <CardContent sx={{ color: WHITE }}>
                      {/* TAGS */}
                      <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
                        <Chip
                          label={p.tag}
                          sx={{
                            color: WHITE,
                            fontWeight: 900,
                            background: `linear-gradient(135deg, ${PINK_MAIN}, ${PINK_HOT})`,
                            boxShadow: `0 10px 28px ${PINK_GLOW}`,
                          }}
                        />
                        <Chip
                          label={p.status}
                          sx={{
                            color: WHITE,
                            fontWeight: 900,
                            border: `1px solid ${PINK_MAIN}`,
                            background: "rgba(255,255,255,0.06)",
                          }}
                        />
                      </Box>

                      {/* TITLE */}
                      <Typography
                        sx={{
                          fontWeight: 950,
                          fontSize: 18,
                          color: WHITE,
                        }}
                      >
                        {p.title}
                      </Typography>

                      {/* DESCRIPTION */}
                      <Typography
                        sx={{
                          mt: 1,
                          fontSize: 13,
                          lineHeight: 1.45,
                          color: "rgba(255,255,255,0.82)",
                        }}
                      >
                        {p.description}
                      </Typography>

                      {/* DATE */}
                      <Typography
                        sx={{
                          mt: 1.5,
                          fontSize: 13,
                          color: WHITE,
                        }}
                      >
                        Publish:{" "}
                        <span style={{ color: PINK_MAIN, fontWeight: 900 }}>
                          {p.publishDate}
                        </span>
                      </Typography>

                      {/* VIDEO */}
                      <Box
                        sx={{
                          mt: 2,
                          borderRadius: 4,
                          overflow: "hidden",
                          border: `1px solid ${PINK_MAIN}`,
                          boxShadow: `0 16px 40px ${PINK_GLOW}`,
                        }}
                      >
                        <iframe
                          src={toEmbedUrl(p.videoSrc)}
                          title={p.title}
                          width="100%"
                          height="300"
                          style={{ border: "none" }}
                          allowFullScreen
                        />
                      </Box>

                      {/* ACTIONS */}
                      <Box sx={{ display: "flex", gap: 1.2, mt: 2 }}>
                        <Button
                          sx={{
                            color: WHITE,
                            fontWeight: 900,
                            borderRadius: 999,
                            px: 3,
                            background: `linear-gradient(135deg, ${PINK_MAIN}, ${PINK_HOT})`,
                            boxShadow: `0 14px 30px ${PINK_GLOW}`,
                          }}
                        >
                          Play
                        </Button>

                        <Button
                          component={RouterLink}
                          to="/"
                          sx={{
                            color: WHITE,
                            fontWeight: 900,
                            borderRadius: 999,
                            px: 3,
                            border: `1px solid ${PINK_MAIN}`,
                            background: "rgba(255,255,255,0.06)",
                            "&:hover": {
                              background: PINK_SOFT,
                            },
                          }}
                        >
                          Back Home
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
