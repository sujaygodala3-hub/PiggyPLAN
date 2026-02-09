// Import React + hooks:
// - useState: component state
// - useRef: keep a mutable value (SpeechRecognition instance) across renders
// - useMemo: memoize the SpeechRecognition constructor lookup
import React, { useMemo, useRef, useState } from "react";

// Import Material UI components used to build the UI
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
} from "@mui/material";

// Font + color tokens for consistent styling
const font = "Monument, sans-serif";
const purpleDark = "#2d124f";
const purpleLight = "#f1e8ff";

// Type helper for TS so we can access SpeechRecognition / webkitSpeechRecognition safely
type SpeechRecognitionType = typeof window & {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
};

// Main component: Voice AI Coach
export default function VoiceAI() {
  // Whether the browser supports SpeechRecognition
  const [supported, setSupported] = useState<boolean>(true);

  // Whether the app is currently listening for speech input
  const [listening, setListening] = useState<boolean>(false);

  // Transcript text (what the user said / typed)
  const [transcript, setTranscript] = useState<string>("");

  // Reply text (the “coach” response)
  const [reply, setReply] = useState<string>("");

  // Ref to store the recognition instance so we can stop it later
  const recRef = useRef<any>(null);

  // Memoize the SpeechRecognition constructor lookup so it doesn't re-run every render
  const RecognitionCtor = useMemo(() => {
    const w = window as SpeechRecognitionType;
    // Prefer standard SpeechRecognition, fallback to Chrome's webkitSpeechRecognition
    return w.SpeechRecognition || w.webkitSpeechRecognition;
  }, []);

  /**
   * Start speech recognition:
   * - check support
   * - create recognition instance
   * - configure it (language, interim results, continuous)
   * - wire up event handlers to capture transcript
   */
  const start = () => {
    // If no constructor exists, the browser doesn't support SpeechRecognition
    if (!RecognitionCtor) {
      setSupported(false);
      return;
    }
    // Mark as supported (in case it was previously set false)
    setSupported(true);

    // Create a new recognition session
    const rec = new RecognitionCtor();
    recRef.current = rec;

    // Configure recognition behavior
    rec.lang = "en-US";
    rec.interimResults = true; // get partial results while speaking
    rec.continuous = true; // keep listening instead of stopping after one phrase

    // Called whenever recognition returns results
    rec.onresult = (event: any) => {
      let text = "";

      // Build a transcript from the latest results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }

      // Update transcript state (trim to remove extra whitespace)
      setTranscript(text.trim());
    };

    // If recognition ends naturally, mark listening false
    rec.onend = () => setListening(false);

    // If recognition errors, mark listening false
    rec.onerror = () => setListening(false);

    // Update UI state + start listening
    setListening(true);
    rec.start();
  };

  /**
   * Stop speech recognition:
   * - updates UI state
   * - calls stop() on the current recognition instance if it exists
   */
  const stop = () => {
    setListening(false);
    recRef.current?.stop?.();
  };

  /**
   * Text-to-speech helper:
   * - uses SpeechSynthesis to speak a response aloud
   */
  const speak = (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";

    // Cancel any ongoing speech before speaking the new utterance
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  /**
   * Simple “coach” logic (no API key):
   * - looks at transcript keywords and returns a canned coaching response
   * - also speaks the response out loud
   */
  const quickCoach = () => {
    // This is “voice AI” without needing any API key.
    // If you later connect ChatGPT, replace this with your API call.
    const t = transcript.toLowerCase();

    // Default coaching response
    let r =
      "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Pick one goal and automate a small weekly transfer.";

    // If user mentions saving + pet, tailor response to premium pet saving
    if (t.includes("save") && t.includes("pet")) {
      r =
        "To save for a premium pet, set a weekly target. Example: $25/week gets you $500 in 20 weeks. Earn money on the map, then avoid spending at the salon/toy store until you hit the goal.";

      // If user mentions budget, give a budgeting-specific response
    } else if (t.includes("budget")) {
      r =
        "Start by tracking 7 days of spending, then cap one category (snacks, shopping) and move that amount into savings every week.";
    }

    // Update UI reply and speak it out loud
    setReply(r);
    speak(r);
  };

  // Render UI
  return (
    <Box
      sx={{
        // Full screen height
        minHeight: "100vh",

        // Soft purple-to-white background gradient
        background: `linear-gradient(180deg, ${purpleLight}, #ffffff)`,

        // Page padding
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Main card container */}
        <Card sx={{ borderRadius: 4, border: "1px solid rgba(45,18,79,0.12)" }}>
          <CardContent>
            {/* Title */}
            <Typography
              sx={{
                fontFamily: font,
                fontWeight: 900,
                color: purpleDark,
                fontSize: 26,
              }}
            >
              Voice AI Coach
            </Typography>

            {/* Browser support warning */}
            {!supported && (
              <Typography sx={{ fontFamily: font, mt: 1, color: purpleDark }}>
                Your browser doesn’t support Speech Recognition. Try Chrome.
              </Typography>
            )}

            {/* Action buttons */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
              {/* Start/Stop toggles based on listening state */}
              {!listening ? (
                <Button
                  variant="contained"
                  onClick={start}
                  sx={{
                    fontFamily: font,
                    fontWeight: 900,
                    borderRadius: 999,
                    background: purpleDark,
                  }}
                >
                  Start Listening
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={stop}
                  sx={{
                    fontFamily: font,
                    fontWeight: 900,
                    borderRadius: 999,
                    borderColor: purpleDark,
                    color: purpleDark,
                  }}
                >
                  Stop
                </Button>
              )}

              {/* Coaching button: analyzes transcript and responds */}
              <Button
                variant="contained"
                onClick={quickCoach}
                sx={{
                  fontFamily: font,
                  fontWeight: 900,
                  borderRadius: 999,
                  background: "#7c4dff",
                }}
              >
                Get Coaching
              </Button>
            </Box>

            {/* Transcript input/display */}
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  fontFamily: font,
                  fontWeight: 900,
                  color: purpleDark,
                  mb: 1,
                }}
              >
                What you said
              </Typography>

              {/* TextField allows manual editing if speech input fails */}
              <TextField
                fullWidth
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Say something like: 'How do I save for the dragon?'"
              />
            </Box>

            {/* Reply output */}
            <Box sx={{ mt: 2 }}>
              <Typography
                sx={{
                  fontFamily: font,
                  fontWeight: 900,
                  color: purpleDark,
                  mb: 1,
                }}
              >
                AI reply
              </Typography>

              {/* Show reply, or an instruction if empty */}
              <Typography sx={{ fontFamily: font, opacity: 0.9 }}>
                {reply || "Press Get Coaching to receive advice."}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
