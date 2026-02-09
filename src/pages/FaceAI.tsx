import React, { useEffect, useMemo, useRef, useState } from "react";
import * as tmImage from "@teachablemachine/image";
import * as tf from "@tensorflow/tfjs";

/* =======================
   CONFIG
======================= */

const VERIFY_TIME_MS = 10_000;

const FONT =
  '"Space Grotesk", system-ui, -apple-system, "Segoe UI", Arial, sans-serif';

/* =======================
   PIGGYPLAN THEME
======================= */

const BLACK = "#050406";
const BORDER = "rgba(255,182,193,0.28)";
const TEXT = "#FFF2F6";
const MUTED = "rgba(255,242,246,0.65)";

const PINK = "#FFD6E0";
const PINK_STRONG = "#FF9BB3";
const ROSE = "#C97A8A";

const GLOW = "rgba(255,155,179,0.35)";
const SOFT_BG = "rgba(255,255,255,0.04)";

/* =======================
   MODEL LABELS
======================= */

type Animal = "dog" | "cat" | "bunny" | "fox";
const ANIMALS: Animal[] = ["dog", "cat", "bunny", "fox"];

/* =======================
   COMPONENT
======================= */

export default function FaceAI() {
  const camSlotRef = useRef<HTMLDivElement | null>(null);
  const chosenSlotRef = useRef<HTMLDivElement | null>(null);
  const webcamRef = useRef<tmImage.Webcam | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const modelRef = useRef<any>(null);

  const scoreRef = useRef<Record<Animal, number>>({
    dog: 0,
    cat: 0,
    bunny: 0,
    fox: 0,
  });

  const [status, setStatus] = useState<"idle" | "running" | "verified">("idle");
  const [leaderboard, setLeaderboard] = useState<Record<Animal, number>>({
    dog: 0,
    cat: 0,
    bunny: 0,
    fox: 0,
  });
  const [chosen, setChosen] = useState<Animal | null>(null);
  const [progress, setProgress] = useState(0);

  const swapLabel = (a: string) => {
    if (a === "dog") return "bunny";
    if (a === "bunny") return "dog";
    return a;
  };

  useEffect(() => {
    return () => {
      stop();
      disposeModel();
    };
  }, []);

  function disposeModel() {
    try {
      modelRef.current?.dispose?.();
      modelRef.current?.model?.dispose?.();
    } catch {}
    modelRef.current = null;
    try {
      tf.disposeVariables();
    } catch {}
  }

  async function start() {
    setStatus("running");
    setChosen(null);
    setProgress(0);
    startTimeRef.current = Date.now();

    scoreRef.current = { dog: 0, cat: 0, bunny: 0, fox: 0 };
    setLeaderboard({ dog: 0, cat: 0, bunny: 0, fox: 0 });

    if (chosenSlotRef.current) chosenSlotRef.current.innerHTML = "";

    stop();
    disposeModel();

    const MODEL_BASE = "/my_model/";
    const loaded = await tmImage.load(
      MODEL_BASE + "model.json",
      MODEL_BASE + "metadata.json"
    );
    modelRef.current = loaded;

    const webcam = new tmImage.Webcam(420, 420, true);
    await webcam.setup();
    await webcam.play();
    webcamRef.current = webcam;

    if (camSlotRef.current) {
      camSlotRef.current.innerHTML = "";
      camSlotRef.current.appendChild(webcam.canvas);
    }

    const loop = async () => {
      if (!webcamRef.current || !startTimeRef.current || !modelRef.current)
        return;

      webcamRef.current.update();
      const prediction = await modelRef.current.predict(
        webcamRef.current.canvas
      );

      for (const p of prediction) {
        const mapped = mapLabel(p.className);
        if (mapped) scoreRef.current[mapped] += p.probability;
      }

      const total = ANIMALS.reduce((s, a) => s + scoreRef.current[a], 0);
      const pct: Record<Animal, number> = {
        dog: 0,
        cat: 0,
        bunny: 0,
        fox: 0,
      };

      if (total > 0) {
        for (const a of ANIMALS)
          pct[a] = (scoreRef.current[a] / total) * 100;
      }

      setLeaderboard(pct);

      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min(100, Math.round((elapsed / VERIFY_TIME_MS) * 100)));

      if (elapsed >= VERIFY_TIME_MS) {
        setChosen("bunny");
        setStatus("verified");

        if (chosenSlotRef.current && webcamRef.current) {
          chosenSlotRef.current.innerHTML = "";
          const snap = document.createElement("canvas");
          snap.width = webcamRef.current.canvas.width;
          snap.height = webcamRef.current.canvas.height;
          snap.getContext("2d")?.drawImage(webcamRef.current.canvas, 0, 0);
          chosenSlotRef.current.appendChild(snap);
        }

        stop();
        disposeModel();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try {
      webcamRef.current?.stop();
    } catch {}
    webcamRef.current = null;
  }

  function reset() {
    stop();
    disposeModel();
    setStatus("idle");
    setChosen(null);
    setProgress(0);
    setLeaderboard({ dog: 0, cat: 0, bunny: 0, fox: 0 });
    camSlotRef.current && (camSlotRef.current.innerHTML = "");
    chosenSlotRef.current && (chosenSlotRef.current.innerHTML = "");
  }

  function mapLabel(label: string): Animal | null {
    const l = label.toLowerCase();
    if (l.includes("dog")) return "dog";
    if (l.includes("cat")) return "cat";
    if (l.includes("bunny") || l.includes("rabbit")) return "bunny";
    if (l.includes("fox")) return "fox";
    return null;
  }

  const rows = useMemo(
    () =>
      ANIMALS.map((a) => ({ animal: a, pct: leaderboard[a] })).sort(
        (a, b) => b.pct - a.pct
      ),
    [leaderboard]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BLACK,
        color: TEXT,
        fontFamily: FONT,
        padding: "48px 20px",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 42, fontWeight: 900 }}>Face AI</div>
        <div style={{ color: MUTED }}>Scanning for <b>10 seconds</b>…</div>
      </div>

      {status === "verified" && chosen && (
        <div style={cardWide}>
          <div style={winnerBanner}>
            This is a <span style={{ textTransform: "uppercase" }}>BUNNY</span>
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            <div ref={chosenSlotRef} style={cameraBox} />
          </div>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button onClick={reset} style={ghostBtn}>
              Scan Again
            </button>
          </div>
        </div>
      )}

      {status === "idle" && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button onClick={start} style={heroBtn}>
            Start Camera
          </button>
        </div>
      )}

      {status === "running" && (
        <div style={grid}>
          <div style={card}>
            <div ref={camSlotRef} style={cameraBox} />
            <div style={{ marginTop: 14 }}>
              <div style={progressTop}>
                <span>Scan progress</span>
                <span>{progress}%</span>
              </div>
              <div style={progressTrack}>
                <div style={{ ...progressFill, width: `${progress}%` }} />
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 900 }}>Leaderboard</div>
            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              {rows.map((r, i) => (
                <Row key={r.animal} animal={swapLabel(r.animal)} pct={r.pct} top={i === 0} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =======================
   ROW
======================= */

function Row({ animal, pct, top }: { animal: string; pct: number; top?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 18,
        border: `1px solid ${BORDER}`,
        background: top ? "rgba(255,182,193,0.18)" : SOFT_BG,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>{animal}</div>
        <div style={{ fontWeight: 900 }}>{clamped.toFixed(1)}%</div>
      </div>
      <div style={barTrack}>
        <div style={{ ...barFill, width: `${clamped}%` }} />
      </div>
    </div>
  );
}

/* =======================
   STYLES
======================= */

const card: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
  borderRadius: 26,
  padding: 18,
  background: SOFT_BG,
};

const cardWide: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto 24px",
  padding: 18,
  borderRadius: 26,
  border: `1px solid ${BORDER}`,
  boxShadow: `0 22px 70px ${GLOW}`,
};

const heroBtn: React.CSSProperties = {
  fontSize: 22,
  padding: "20px 46px",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer",
  color: "#111",
  background: `linear-gradient(135deg, ${PINK}, ${PINK_STRONG})`,
  border: "none",
  boxShadow: `0 24px 70px ${GLOW}`,
};

const ghostBtn: React.CSSProperties = {
  padding: "12px 22px",
  borderRadius: 999,
  border: `1px solid ${BORDER}`,
  background: SOFT_BG,
  color: TEXT,
  cursor: "pointer",
  fontWeight: 800,
  fontFamily: FONT,
};

const cameraBox: React.CSSProperties = {
  width: 420,
  height: 420,
  borderRadius: 22,
  overflow: "hidden",
  border: `1px solid ${BORDER}`,
  display: "grid",
  placeItems: "center",
  margin: "0 auto",
};

const progressTrack: React.CSSProperties = {
  marginTop: 8,
  height: 12,
  borderRadius: 999,
  border: `1px solid ${BORDER}`,
  background: SOFT_BG,
  overflow: "hidden",
};

const progressFill: React.CSSProperties = {
  height: "100%",
  background: `linear-gradient(135deg, ${PINK}, ${PINK_STRONG})`,
};

const barTrack = progressTrack;
const barFill = progressFill;

const grid: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

const progressTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: MUTED,
  fontSize: 12,
};

const winnerBanner: React.CSSProperties = {
  textAlign: "center",
  padding: 18,
  borderRadius: 20,
  background: `linear-gradient(135deg, ${PINK}, ${PINK_STRONG})`,
  color: "#111",
  fontWeight: 900,
  fontSize: 34,
};
