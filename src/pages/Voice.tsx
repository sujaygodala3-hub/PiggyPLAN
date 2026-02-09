import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../resources/routes-constants";

/* =======================
   SPEECH HELPERS
======================= */

function getSpeechRecognition(): any | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function speak(text: string) {
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {}
}

/* =======================
   PIGGYPLAN THEME (NO BLACK TEXT)
======================= */

const font =
  '"Space Grotesk", system-ui, -apple-system, "Segoe UI", Arial, sans-serif';

const bg = "#050406";
const surface = "rgba(22,14,18,0.88)";
const stroke = "rgba(255,182,193,0.32)";

const text0 = "#FFF2F6";
const text1 = "rgba(255,242,246,0.78)";
const text2 = "rgba(255,242,246,0.60)";

const pink = "#FFD6E0";
const pinkStrong = "#FF9BB3";
const rose = "#C97A8A";
const glow = "rgba(255,155,179,0.35)";

/* =======================
   COMPONENT
======================= */

export default function Voice() {
  const navigate = useNavigate();
  const recognitionRef = useRef<any | null>(null);

  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [partialText, setPartialText] = useState("");
  const [status, setStatus] = useState("Press Start and speak a command.");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setSupported(false);
      setStatus("Speech recognition not supported. Use Chrome.");
      return;
    }

    const rec = new Recognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => {
      setListening(true);
      setStatus('Listening… try: “go to map page” or “open face ai”');
    };

    rec.onend = () => {
      setListening(false);
      setPartialText("");
      setStatus("Stopped listening.");
    };

    rec.onerror = (e: any) => {
      setListening(false);
      setStatus(`Error: ${e?.error || "unknown"}`);
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0].transcript;
        if (res.isFinal) final += transcript;
        else interim += transcript;
      }

      if (interim) setPartialText(interim);

      if (final) {
        const text = normalize(final);
        setFinalText((prev) => (prev ? prev + "\n" : "") + final.trim());

        if (text.includes("map")) {
          speak("Opening map page");
          navigate(ROUTES.ARTICLEPAGE_ROUTE);
        } else if (text.includes("home")) {
          speak("Going home");
          navigate(ROUTES.HOMEPAGE_ROUTE);
        } else if (text.includes("transaction")) {
          speak("Opening transactions");
          navigate(ROUTES.TRANSPAGE_ROUTE);
        } else if (text.includes("about")) {
          speak("Opening about page");
          navigate(ROUTES.ABOUTPAGE_ROUTE);
        } else if (text.includes("podcast") && (ROUTES as any).PODCASTPAGE_ROUTE) {
          speak("Opening podcast page");
          navigate((ROUTES as any).PODCASTPAGE_ROUTE);
        } else if (
          text.includes("face ai") ||
          (text.includes("face") && text.includes("ai")) ||
          text.includes("camera") ||
          text.includes("selfie") ||
          text.includes("scan my face")
        ) {
          speak("Opening Face AI page");
          navigate("/face-ai");
        } else {
          speak("I heard you, but didn’t recognize that command.");
          setStatus("Command not recognized.");
        }
      }
    };

    recognitionRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [navigate]);

  const start = () => {
    try {
      recognitionRef.current?.start();
    } catch {}
  };

  const stop = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: bg,
        py: 6,
        fontFamily: font,
        color: text0,
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            borderRadius: 5,
            background: surface,
            border: `1px solid ${stroke}`,
            boxShadow: `0 25px 60px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.06)`,
            backdropFilter: "blur(14px)",
          }}
        >
          <CardContent>
            <Typography sx={{ fontSize: 28, fontWeight: 900, color: text0 }}>
              Voice AI Assistant
            </Typography>

            <Typography sx={{ mt: 1, color: text1 }}>
              Speak commands to navigate through PiggyPLAN.
            </Typography>

            {/* Status chips */}
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              <Chip label={`Supported: ${supported ? "Yes" : "No"}`} sx={chip} />
              <Chip
                label={`Listening: ${listening ? "Yes" : "No"}`}
                sx={{
                  ...chip,
                  background: listening
                    ? "rgba(255,182,193,0.22)"
                    : "rgba(255,255,255,0.08)",
                }}
              />
            </Box>

            {/* Controls */}
            <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
              <Button onClick={start} disabled={!supported || listening} sx={primaryBtn}>
                Start Listening
              </Button>

              <Button onClick={stop} disabled={!supported || !listening} sx={secondaryBtn}>
                Stop
              </Button>
            </Box>

            <Divider sx={{ my: 3, borderColor: stroke }} />

            {/* Live transcript */}
            <Typography sx={{ fontWeight: 900, color: text0 }}>
              Live transcript
            </Typography>
            <Box sx={transcript}>
              <Typography sx={{ color: text0 }}>
                {partialText || "—"}
              </Typography>
            </Box>

            {/* Final transcript */}
            <Typography sx={{ fontWeight: 900, mt: 3, color: text0 }}>
              Final transcript
            </Typography>
            <Box sx={{ ...transcript, whiteSpace: "pre-wrap", minHeight: 100 }}>
              <Typography sx={{ color: text0 }}>
                {finalText || "—"}
              </Typography>
            </Box>

            <Typography sx={{ mt: 3, fontWeight: 600, color: text1 }}>
              {status}
            </Typography>

            {!supported && (
              <Typography sx={{ mt: 2, color: "#FF8FA3", fontWeight: 900 }}>
                Use Google Chrome for voice support.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

/* =======================
   STYLES
======================= */

const chip = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,182,193,0.35)",
  color: "#FFF2F6",
  fontWeight: 800,
};

const primaryBtn = {
  borderRadius: 999,
  fontWeight: 950,
  px: 3,
  textTransform: "none",
  color: "#FFF2F6",
  background: `linear-gradient(135deg, ${pink}, ${pinkStrong})`,
  boxShadow: `0 14px 30px ${glow}`,
  "&:hover": {
    background: `linear-gradient(135deg, ${pinkStrong}, ${pink})`,
  },
  "&.Mui-disabled": {
    color: "rgba(255,242,246,0.55)",
  },
};

const secondaryBtn = {
  borderRadius: 999,
  fontWeight: 950,
  px: 3,
  textTransform: "none",
  color: "#FFF2F6",
  border: "1px solid rgba(255,182,193,0.45)",
  background: "rgba(255,255,255,0.04)",
  "&:hover": {
    background: "rgba(255,182,193,0.16)",
  },
  "&.Mui-disabled": {
    color: "rgba(255,242,246,0.55)",
  },
};

const transcript = {
  mt: 1,
  p: 2,
  minHeight: 60,
  borderRadius: 3,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,182,193,0.35)",
};
