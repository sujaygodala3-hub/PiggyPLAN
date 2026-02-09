import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import db from "./db.js";

dotenv.config({ path: new URL("./.env", import.meta.url) });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

// =========================
// OPENAI SETUP
// =========================
const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

if (!apiKey) {
  console.warn("⚠️ OPENAI_API_KEY missing — AI responses will be mocked.");
}

// =========================
// AUTH SETUP
// =========================
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const APP_NAME = process.env.APP_NAME || "PETQuest";

const signAuthToken = (user) =>
  jwt.sign({ sub: user.id, username: user.username, typ: "auth" }, JWT_SECRET, {
    expiresIn: "7d",
  });

const signTemp2FAToken = (user) =>
  jwt.sign({ sub: user.id, username: user.username, typ: "2fa" }, JWT_SECRET, {
    expiresIn: "10m",
  });

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.typ !== "auth") throw new Error();
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const requireTemp2FA = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.typ !== "2fa") throw new Error();
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// =========================
// HEALTH
// =========================
app.get("/health", (_, res) => res.json({ ok: true }));

// =========================
// AUTH ROUTES
// =========================
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });

  const password_hash = await bcrypt.hash(password, 12);

  db.run(
    `INSERT INTO users (username, password_hash) VALUES (?, ?)`,
    [username, password_hash],
    function (err) {
      if (err) return res.status(409).json({ error: "Username taken" });
      res.json({ token: signAuthToken({ id: this.lastID, username }) });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, user) => {
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.twofa_enabled) {
        return res.json({
          requires2FA: true,
          tempToken: signTemp2FAToken(user),
        });
      }

      res.json({ token: signAuthToken(user) });
    }
  );
});

// =========================
// CHATBOT ENDPOINT
// =========================
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    if (!client) {
      return res.json({
        reply: "AI is temporarily unavailable. Please try again later.",
      });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages,
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

// =========================
// MONEY INSIGHTS (YOUR GAME AI)
// =========================
app.post("/api/money-insights", async (req, res) => {
  try {
    const { question, gameState } = req.body || {};
    if (!question) return res.status(400).json({ error: "Missing question" });

    if (!client) {
      return res.json({
        answer:
          "AI unavailable. Save consistently and track your spending habits.",
      });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are a money coach giving short, actionable advice for a game.",
        },
        {
          role: "user",
          content: `${question}\nGame State:\n${JSON.stringify(gameState)}`,
        },
      ],
    });

    res.json({ answer: completion.choices[0].message.content });
  } catch (err) {
    console.error("🔥 FULL OPENAI ERROR 🔥");
    console.error(err?.response?.data || err);
    return res.status(500).json({
      error: err?.response?.data?.error?.message || err?.message || "AI failed",
    });
  }
  
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
