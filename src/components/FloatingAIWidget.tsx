// FloatingAIWidget.tsx
// Full copy-paste file: voice → auto-submit → auto-speak answer

import React, { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";

import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

/* ======================
   CONFIG — tweak anytime
====================== */

const POSITION = { bottom: 24, right: 24 };
const BUTTON_SIZE = 56;

const DEFAULT_PANEL = { width: 360, height: 340 };
const MIN_PANEL = { width: 280, height: 240 };
const MAX_PANEL = { width: 560, height: 560 };

const SIZE_KEY = "petquest_ai_widget_size";

/* ======================
   Web Speech API types (TS-safe)
====================== */

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export default function FloatingAIWidget(): React.ReactElement {
  const [open, setOpen] = useState(false);

  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     SPEECH (Speech-to-text)
  ====================== */

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  /* ======================
     TEXT-TO-SPEECH
  ====================== */

  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ✅ Keep latest q in a ref so onend always sees current text
  const qRef = useRef("");
  useEffect(() => {
    qRef.current = q;
  }, [q]);

  // ✅ Auto behaviors
  // - if true, when answer arrives we speak it
  const autoSpeakNextRef = useRef(false);
  // - if true, when speech recognition ends we auto-submit
  const autoAskOnSpeechEndRef = useRef(false);

  /* ======================
     API base URL helper
  ====================== */


  function apiUrl(path: string) {
    const base =
      process.env.REACT_APP_API_URL ||
      "http://localhost:5050";
  
    return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }
  

  /* ======================
     Panel size (persisted)
  ====================== */

  const initialSize = useMemo(() => {
    try {
      const raw = localStorage.getItem(SIZE_KEY);
      if (!raw) return DEFAULT_PANEL;

      const parsed = JSON.parse(raw);
      const w = Number(parsed?.width);
      const h = Number(parsed?.height);

      if (!Number.isFinite(w) || !Number.isFinite(h)) return DEFAULT_PANEL;

      return {
        width: Math.min(Math.max(w, MIN_PANEL.width), MAX_PANEL.width),
        height: Math.min(Math.max(h, MIN_PANEL.height), MAX_PANEL.height),
      };
    } catch {
      return DEFAULT_PANEL;
    }
  }, []);

  const [panelSize, setPanelSize] = useState<{ width: number; height: number }>(initialSize);

  useEffect(() => {
    try {
      localStorage.setItem(SIZE_KEY, JSON.stringify(panelSize));
    } catch {
      // ignore
    }
  }, [panelSize]);

  /* ======================
     TEXT-TO-SPEECH helpers
  ====================== */

  useEffect(() => {
    setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  function stopSpeaking() {
    try {
      window.speechSynthesis?.cancel?.();
    } catch {
      // ignore
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
  }

  function speakAnswer() {
    if (!ttsSupported) return;
    if (!answer.trim()) return;

    // Toggle: if currently speaking, stop
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    // Cancel any queued speech first
    stopSpeaking();

    const u = new SpeechSynthesisUtterance(answer);
    utteranceRef.current = u;
    u.lang = "en-US";

    u.onstart = () => setIsSpeaking(true);
    u.onerror = () => setIsSpeaking(false);
    u.onend = () => setIsSpeaking(false);

    try {
      window.speechSynthesis.speak(u);
    } catch {
      setIsSpeaking(false);
    }
  }

  // Safety: stop speaking whenever panel is closed
  useEffect(() => {
    if (!open) stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ Auto-speak when answer arrives (only if we asked for it)
  useEffect(() => {
    if (!autoSpeakNextRef.current) return;
    if (!open) return;
    if (!ttsSupported) return;
    if (!answer.trim()) return;

    autoSpeakNextRef.current = false;
    speakAnswer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, open, ttsSupported]);

  /* ======================
     Ask function (calls backend)
     ✅ supports auto-speak
  ====================== */

  async function ask(questionOverride?: string) {
    const question = (questionOverride ?? q).trim();
    if (!question) return;

    setLoading(true);
    setAnswer("");
    stopSpeaking();

    // ✅ when answer arrives, auto-speak it
    autoSpeakNextRef.current = true;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    const url = apiUrl("/api/money-insights");
    console.log("AI request →", url);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const msg =
          (typeof payload === "object" && (payload as any)?.error) ||
          (typeof payload === "string" && payload) ||
          `Server error (${res.status})`;

        setAnswer(`AI server error: ${msg}`);
        autoSpeakNextRef.current = false; // don't auto-speak errors
        return;
      }

      setAnswer(
        (typeof payload === "object" && (payload as any)?.answer) ||
          (payload as any) ||
          "No response."
      );
    } catch (err: any) {
      const message =
        err?.name === "AbortError"
          ? "Request timed out. Is the AI server running?"
          : err?.message || "Network error.";

      setAnswer(`Could not reach AI server. ${message}`);
      autoSpeakNextRef.current = false; // don't auto-speak errors
      console.error("AI request failed:", err);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  /* ======================
     RESIZE (drag handle)
  ====================== */

  const resizingRef = useRef(false);

  const startRef = useRef({
    mouseX: 0,
    mouseY: 0,
    width: DEFAULT_PANEL.width,
    height: DEFAULT_PANEL.height,
  });

  function onResizeMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    resizingRef.current = true;

    startRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: panelSize.width,
      height: panelSize.height,
    };
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!resizingRef.current) return;

      const dx = e.clientX - startRef.current.mouseX;
      const dy = e.clientY - startRef.current.mouseY;

      const nextWidth = startRef.current.width + dx;
      const nextHeight = startRef.current.height + dy;

      setPanelSize({
        width: Math.min(Math.max(nextWidth, MIN_PANEL.width), MAX_PANEL.width),
        height: Math.min(Math.max(nextHeight, MIN_PANEL.height), MAX_PANEL.height),
      });
    }

    function onUp() {
      resizingRef.current = false;
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [panelSize.width, panelSize.height]);

  /* ======================
     SPEECH-TO-TEXT (Web Speech API)
     ✅ auto-submit on end
  ====================== */

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SR));
  }, []);

  function stopListening() {
    // ✅ If user manually stops, do NOT auto-submit
    autoAskOnSpeechEndRef.current = false;

    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
    setIsListening(false);
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    // Toggle off if already listening
    if (isListening) {
      stopListening();
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // ✅ We are starting a voice capture → when it ends, auto-submit
    autoAskOnSpeechEndRef.current = true;

    let finalText = "";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript ?? "";

        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }

      const combined = (finalText + " " + interim).trim();
      setQ(combined);
    };

    recognition.onerror = () => {
      setIsListening(false);
      autoAskOnSpeechEndRef.current = false;
    };

    recognition.onend = () => {
      setIsListening(false);

      // ✅ Auto-submit the spoken question, then auto-speak the answer
      if (autoAskOnSpeechEndRef.current) {
        autoAskOnSpeechEndRef.current = false;

        const spoken = qRef.current.trim();
        if (spoken) {
          setQ(spoken);
          ask(spoken); // ask() sets autoSpeakNextRef internally
        }
      }
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
      autoAskOnSpeechEndRef.current = false;
    }
  }

  // Safety: stop listening whenever panel closes
  useEffect(() => {
    if (!open) stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {!open && (
        <Box
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: POSITION.bottom,
            right: POSITION.right,
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: 3,
            background: "linear-gradient(135deg, #FF5FA2, #FF3D8E)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            zIndex: 2000,
            boxShadow: "0 14px 30px rgba(0,0,0,0.45)",
            userSelect: "none",
          }}
          title="Open AI Money Insights"
        >
          <Typography sx={{ fontSize: 26, color: "#FFFFFF", fontWeight: 900 }}>💬</Typography>
        </Box>
      )}

      {open && (
        <Box
          sx={{
            position: "fixed",
            bottom: POSITION.bottom,
            right: POSITION.right,
            width: panelSize.width,
            height: panelSize.height,
            borderRadius: 4,
            background: "rgba(8,8,12,0.96)",
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
            p: 2,
            zIndex: 2000,
            color: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 16, color: "#FFFFFF" }}>
                AI Money Insights
              </Typography>
              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
                Saving • budgeting • smart choices
              </Typography>
            </Box>

            <Button
              onClick={() => setOpen(false)}
              variant="text"
              sx={{ color: "#FFFFFF", fontWeight: 900, textTransform: "none" }}
            >
              Close
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 1.2, alignItems: "center" }}>
            <TextField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="Ask a money question…"
              fullWidth
              size="small"
              InputProps={{
                sx: {
                  color: "#FFFFFF",
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 2,
                },
              }}
              sx={{
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.25)" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,95,162,0.55)",
                },
                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,95,162,0.85)",
                },
              }}
            />

            <Tooltip
              title={
                !speechSupported
                  ? "Speech-to-text not supported in this browser (use Chrome)."
                  : isListening
                  ? "Stop recording"
                  : "Speak (auto-submits when you stop talking)"
              }
            >
              <span>
                <IconButton
                  onClick={startListening}
                  disabled={!speechSupported}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: isListening
                      ? "rgba(255,95,162,0.25)"
                      : "rgba(255,255,255,0.06)",
                    color: "#FFFFFF",
                    "&:hover": {
                      background: isListening ? "rgba(232,211,106,0.22)" : "rgba(255,255,255,0.10)",
                    },
                  }}
                >
                  {isListening ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button
              onClick={() => ask()}
              disabled={loading}
              variant="contained"
              sx={{
                flex: 1,
                fontWeight: 900,
                textTransform: "none",
                background: "linear-gradient(135deg, #FF5FA2, #FF3D8E)",
                color: "#111",
                "&:hover": { filter: "brightness(0.95)" },
              }}
            >
              {loading ? <CircularProgress size={20} /> : "Ask"}
            </Button>

            <Tooltip
              title={
                !ttsSupported
                  ? "Text-to-speech not supported in this browser."
                  : !answer
                  ? "Ask a question first to get an answer to read."
                  : isSpeaking
                  ? "Stop speaking"
                  : "Read answer out loud"
              }
            >
              <span>
                <IconButton
                  onClick={speakAnswer}
                  disabled={!ttsSupported || !answer.trim()}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: isSpeaking ? "rgba(232,211,106,0.18)" : "rgba(255,255,255,0.06)",
                    color: "#FFFFFF",
                    "&:hover": {
                      background: isSpeaking ? "rgba(232,211,106,0.22)" : "rgba(255,255,255,0.10)",
                    },
                  }}
                >
                  <VolumeUpIcon />
                </IconButton>
              </span>
            </Tooltip>

            <Button
              onClick={() => {
                stopListening();
                stopSpeaking();
                setQ("");
                setAnswer("");
              }}
              variant="outlined"
              sx={{
                fontWeight: 900,
                textTransform: "none",
                borderColor: "rgba(255,255,255,0.25)",
                color: "#FFFFFF",
                "&:hover": { background: "rgba(255,255,255,0.06)" },
              }}
            >
              Clear
            </Button>
          </Box>

          <Box
            sx={{
              mt: 1.2,
              flex: 1,
              overflowY: "auto",
              p: 1.2,
              borderRadius: 2,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {answer ? (
              <Typography sx={{ fontSize: 13, color: "#FFFFFF", whiteSpace: "pre-line" }}>
                {answer}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                {isListening
                  ? "Listening… speak your question. When you stop talking, it will auto-send and read the answer."
                  : "Try: “How do I stop impulse spending?” or “How much should I save weekly?”"}
              </Typography>
            )}
          </Box>

          <Box
            onMouseDown={onResizeMouseDown}
            sx={{
              position: "absolute",
              right: 6,
              bottom: 6,
              width: 18,
              height: 18,
              cursor: "nwse-resize",
              borderRadius: 2,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "grid",
              placeItems: "center",
              userSelect: "none",
            }}
            title="Drag to resize"
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRight: "2px solid rgba(255,255,255,0.6)",
                borderBottom: "2px solid rgba(255,255,255,0.6)",
                transform: "translate(-1px, -1px)",
              }}
            />
          </Box>
        </Box>
      )}
    </>
  );
}
